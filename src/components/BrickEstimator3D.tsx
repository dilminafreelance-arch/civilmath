import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { generateBricksList } from '../utils/calcEngine';
import { UnitSystem } from '../types';

export interface BrickEstimator3DProps {
  wallLength: number;
  wallHeight: number;
  wallThickness: number;
  brickLength: number;
  brickWidth: number;
  brickHeight: number;
  mortarJoint: number;
  bondType: string;
  openings: any[];
  unitSystem: UnitSystem;
  wireframeMode: boolean;
  xRayMode: boolean;
  showJoints: boolean;
  layerProgress: number; // 0 to 1
  viewMode: '3d' | 'elevation' | 'plan' | 'section';
}

export default function BrickEstimator3D({
  wallLength,
  wallHeight,
  wallThickness,
  brickLength,
  brickWidth,
  brickHeight,
  mortarJoint,
  bondType,
  openings,
  unitSystem,
  wireframeMode,
  xRayMode,
  showJoints,
  layerProgress,
  viewMode
}: BrickEstimator3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | THREE.OrthographicCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const instancedMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const wireframeMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const jointsMeshRef = useRef<THREE.Mesh | null>(null);
  const reqIdRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Setup Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.domElement);

    // 2. Setup Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 15);
    scene.add(directionalLight);
    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-10, 5, -15);
    scene.add(backLight);

    // Initial Resize
    updateSize();
    window.addEventListener('resize', updateSize);

    // Animation Loop
    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate);
      if (controlsRef.current) controlsRef.current.update();
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      window.removeEventListener('resize', updateSize);
      cancelAnimationFrame(reqIdRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (containerRef.current && rendererRef.current.domElement.parentNode === containerRef.current) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, []);

  const updateSize = () => {
    if (!containerRef.current || !rendererRef.current || !sceneRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    rendererRef.current.setSize(width, height);
    
    setupCamera(width, height);
  };

  const setupCamera = (width: number, height: number) => {
    if (!sceneRef.current || !rendererRef.current) return;
    const aspect = width / height;
    
    // Base unit multiplier for dimensions passed in mm or inches
    const m = unitSystem === 'metric' ? 1 / 1000 : 1 / 12;
    const center = new THREE.Vector3(wallLength / 2, wallHeight / 2, (wallThickness * m) / 2);
    
    // Choose camera type
    if (viewMode === '3d') {
      const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
      camera.position.set(center.x, center.y + Math.max(wallHeight, 2), center.z + Math.max(wallLength, wallHeight) * 1.5);
      camera.lookAt(center);
      cameraRef.current = camera;
    } else {
      const viewSize = Math.max(wallLength, wallHeight) * 1.2;
      const camera = new THREE.OrthographicCamera(
        -viewSize * aspect / 2, viewSize * aspect / 2,
        viewSize / 2, -viewSize / 2,
        -100, 1000
      );
      if (viewMode === 'elevation') {
        camera.position.set(center.x, center.y, center.z + viewSize);
        camera.lookAt(center);
      } else if (viewMode === 'plan') {
        camera.position.set(center.x, center.y + viewSize, center.z);
        camera.lookAt(center);
      } else if (viewMode === 'section') {
        camera.position.set(center.x - viewSize, center.y, center.z);
        camera.lookAt(center);
      }
      cameraRef.current = camera;
    }

    // Setup controls
    if (controlsRef.current) {
      controlsRef.current.dispose();
    }
    const controls = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
    controls.target.copy(center);
    if (viewMode !== '3d') {
      controls.enableRotate = false; // Lock rotation in orthographic views
    }
    controls.update();
    controlsRef.current = controls;
  };

  // Rebuild scene when parameters change
  useEffect(() => {
    if (!sceneRef.current || !rendererRef.current) return;
    const scene = sceneRef.current;
    
    // Clear old objects
    if (instancedMeshRef.current) {
      scene.remove(instancedMeshRef.current);
      instancedMeshRef.current.geometry.dispose();
      (instancedMeshRef.current.material as THREE.Material).dispose();
      instancedMeshRef.current = null;
    }
    if (wireframeMeshRef.current) {
      scene.remove(wireframeMeshRef.current);
      wireframeMeshRef.current.geometry.dispose();
      (wireframeMeshRef.current.material as THREE.Material).dispose();
      wireframeMeshRef.current = null;
    }
    if (jointsMeshRef.current) {
      scene.remove(jointsMeshRef.current);
      jointsMeshRef.current.geometry.dispose();
      (jointsMeshRef.current.material as THREE.Material).dispose();
      jointsMeshRef.current = null;
    }

    const m = unitSystem === 'metric' ? 1 / 1000 : 1 / 12;
    const { bricks } = generateBricksList(
      wallLength, // Already in meters/feet
      wallHeight, // Already in meters/feet
      wallThickness * m,
      brickLength * m,
      brickWidth * m,
      brickHeight * m,
      mortarJoint * m,
      bondType,
      openings.map(op => ({
        ...op,
        length: op.length * m,
        height: op.height * m,
        x: op.x * m,
        y: op.y * m
      }))
    );

    // Calculate max Y to determine visible layers based on layerProgress
    let maxY = 0;
    bricks.forEach(b => { if (b.y > maxY) maxY = b.y; });
    const cutoffY = maxY * layerProgress;

    const visibleBricks = bricks.filter(b => b.y <= cutoffY + 0.001);
    
    if (visibleBricks.length > 0) {
      // Create Brick Geometry (unit cube, scaled per instance)
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      
      const material = new THREE.MeshStandardMaterial({
        color: 0xcc5533,
        roughness: 0.8,
        transparent: xRayMode,
        opacity: xRayMode ? 0.4 : 1.0,
      });

      const instancedMesh = new THREE.InstancedMesh(geometry, material, visibleBricks.length);
      const dummy = new THREE.Object3D();

      visibleBricks.forEach((b, i) => {
        dummy.position.set(b.x + b.w / 2, b.y + b.h / 2, b.z + b.d / 2);
        dummy.scale.set(b.w, b.h, b.d);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
      });
      instancedMesh.instanceMatrix.needsUpdate = true;
      scene.add(instancedMesh);
      instancedMeshRef.current = instancedMesh;

      if (wireframeMode) {
        const wireMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true, transparent: true, opacity: 0.3 });
        const wireMesh = new THREE.InstancedMesh(geometry, wireMaterial, visibleBricks.length);
        visibleBricks.forEach((b, i) => {
          dummy.position.set(b.x + b.w / 2, b.y + b.h / 2, b.z + b.d / 2);
          dummy.scale.set(b.w, b.h, b.d);
          dummy.updateMatrix();
          wireMesh.setMatrixAt(i, dummy.matrix);
        });
        wireMesh.instanceMatrix.needsUpdate = true;
        scene.add(wireMesh);
        wireframeMeshRef.current = wireMesh;
      }
    }

    if (showJoints && mortarJoint > 0 && layerProgress > 0) {
      // Simplified mortar representation
      const mw = wallLength;
      const mh = Math.min(wallHeight, cutoffY + brickHeight * m);
      const mt = wallThickness * m;
      
      const jointGeom = new THREE.BoxGeometry(mw, mh, mt);
      const jointMat = new THREE.MeshStandardMaterial({
        color: 0x999999,
        roughness: 0.9,
        transparent: xRayMode,
        opacity: xRayMode ? 0.3 : 1.0,
      });
      const jointMesh = new THREE.Mesh(jointGeom, jointMat);
      jointMesh.position.set(mw / 2, mh / 2, mt / 2);
      jointMesh.scale.set(1.0, 1.0, 0.98); 
      scene.add(jointMesh);
      jointsMeshRef.current = jointMesh;
    }

    updateSize(); // Re-adjust camera for new bounds if needed

  }, [
    wallLength, wallHeight, wallThickness, 
    brickLength, brickWidth, brickHeight, mortarJoint, 
    bondType, openings, unitSystem, 
    wireframeMode, xRayMode, showJoints, layerProgress, viewMode
  ]);

  useEffect(() => {
    if (containerRef.current) {
      updateSize();
    }
  }, [viewMode]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden shadow-inner cursor-move" />
  );
};
