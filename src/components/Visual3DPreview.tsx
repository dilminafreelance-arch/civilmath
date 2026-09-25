import React, { useEffect, useRef, useState } from 'react';
import { UnitSystem } from '../types';
import { RotateCcw, Play, Pause, ZoomIn, ZoomOut, Compass, HelpCircle } from 'lucide-react';

interface VisualPreviewProps {
  calculatorId: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  unitSystem: UnitSystem;
}

export default function Visual3DPreview({ calculatorId, inputs, outputs, unitSystem }: VisualPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [beamTab, setBeamTab] = useState<'profile' | 'sfd' | 'bmd'>('profile');

  // Interactive structural display viewMode ('3d' render or '2d' blueprints)
  const [viewMode, setViewMode] = useState<'3d' | '2d'>(
    calculatorId === 'structural-beam' ? '2d' : '3d'
  );

  useEffect(() => {
    setViewMode(calculatorId === 'structural-beam' ? '2d' : '3d');
  }, [calculatorId]);

  // Camera settings
  const [yaw, setYaw] = useState<number>(-45 * Math.PI / 180); // Yaw angle in radians
  const [pitch, setPitch] = useState<number>(30 * Math.PI / 180); // Pitch angle in radians
  const [zoom, setZoom] = useState<number>(1.0);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [showWireframeOnly, setShowWireframeOnly] = useState<boolean>(false);

  // Drag interaction states
  const isDraggingRef = useRef<boolean>(false);
  const prevMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Reset Camera View
  const handleResetCamera = () => {
    setYaw(-45 * Math.PI / 180);
    setPitch(30 * Math.PI / 180);
    setZoom(1.0);
    setAutoRotate(false);
  };

  // Zoom helpers
  const handleZoomIn = () => setZoom(z => Math.min(2.5, z + 0.15));
  const handleZoomOut = () => setZoom(z => Math.max(0.4, z - 0.15));

  // Auto rotate tick
  useEffect(() => {
    if (!autoRotate) return;
    let animId: number;
    const tick = () => {
      setYaw(y => (y + 0.006) % (Math.PI * 2));
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [autoRotate]);

  // Drag and touch handlers
  const onMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - prevMouseRef.current.x;
    const dy = e.clientY - prevMouseRef.current.y;
    
    // Adjust rotation parameters based on drag distance
    setYaw(y => y + dx * 0.007);
    setPitch(p => Math.max(-85 * Math.PI / 180, Math.min(85 * Math.PI / 180, p - dy * 0.007)));
    
    prevMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseUp = () => {
    isDraggingRef.current = false;
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      prevMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - prevMouseRef.current.x;
    const dy = e.touches[0].clientY - prevMouseRef.current.y;
    
    setYaw(y => y + dx * 0.007);
    setPitch(p => Math.max(-85 * Math.PI / 180, Math.min(85 * Math.PI / 180, p - dy * 0.007)));
    
    prevMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const onTouchEnd = () => {
    isDraggingRef.current = false;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Fluid resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = (width || 300) * window.devicePixelRatio;
        canvas.height = (height || 260) * window.devicePixelRatio;
        canvas.style.width = `${width || 300}px`;
        canvas.style.height = `${height || 260}px`;
        draw();
      }
    });

    const parent = canvas.parentElement;
    if (parent) {
      resizeObserver.observe(parent);
    }

    // Centered 3D projection matrix with custom rotation
    const project3D = (
      x: number, 
      y: number, 
      z: number, 
      cx: number, 
      cy: number, 
      scale: number,
      sizeX: number,
      sizeY: number,
      sizeZ: number
    ) => {
      // Translate to centroid so rotation is self-centered
      const xc = x - sizeX / 2;
      const yc = y - sizeY / 2;
      const zc = z - sizeZ / 2;

      // 1. Rotation around world Z axis (Yaw)
      const x1 = xc * Math.cos(yaw) - yc * Math.sin(yaw);
      const y1 = xc * Math.sin(yaw) + yc * Math.cos(yaw);
      const z1 = zc;

      // 2. Rotation around rotated horizontal X axis (Pitch)
      const x2 = x1;
      const y2 = y1 * Math.cos(pitch) - z1 * Math.sin(pitch);
      const z2 = y1 * Math.sin(pitch) + z1 * Math.cos(pitch);

      // 3. Screen mapping with scale and user zoom
      const px = cx + x2 * scale * zoom;
      const py = cy + y2 * scale * zoom;

      return { x: px, y: py, depth: z2 };
    };

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const dpr = window.devicePixelRatio || 1;

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.scale(dpr, dpr);

      const width = w / dpr;
      const height = h / dpr;

      // Draw grid pattern (Engineering workspace grid)
      ctx.strokeStyle = 'rgba(46, 107, 86, 0.08)'; 
      ctx.lineWidth = 0.5;
      const gridSize = 24;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Technical Telemetry & Model Indicators (No brand name)
      ctx.fillStyle = '#5A7D71';
      ctx.font = '600 9px monospace';
      ctx.fillText(`ENGINEERING CAD MODEL // SCALE 1:100`, 16, 22);

      // Camera State Telemetry
      const angleYawDeg = Math.round((yaw * 180) / Math.PI);
      const anglePitchDeg = Math.round((pitch * 180) / Math.PI);
      ctx.fillText(`ROTATION: YAW ${angleYawDeg}° · PITCH ${anglePitchDeg}° · ZOOM ${zoom.toFixed(2)}x`, 16, 35);

      // Delegate rendering to corresponding shape drawer
      switch (calculatorId) {
        case 'concrete-volume':
          drawConcreteSlab3D(ctx, width, height, inputs, outputs, project3D);
          break;
        case 'structural-beam':
        case 'structural-deflection':
          if (viewMode === '3d') {
            drawConcreteBeam3D(ctx, width, height, inputs, outputs, project3D);
          } else {
            drawBeamDeflection2D(ctx, width, height, inputs, outputs);
          }
          break;
        case 'structural-column':
          if (viewMode === '3d') {
            drawConcreteColumn3D(ctx, width, height, inputs, outputs, project3D);
          } else {
            drawConcreteColumn2D(ctx, width, height, inputs, outputs);
          }
          break;
        case 'structural-slab':
          if (viewMode === '3d') {
            drawConcreteSlab3D(ctx, width, height, inputs, outputs, project3D, true); // slab mode with stress contours!
          } else {
            drawConcreteSlab2D(ctx, width, height, inputs, outputs);
          }
          break;
        case 'geotech-bearing':
          drawSpreadFooting3D(ctx, width, height, inputs, outputs, project3D);
          break;
        case 'geotech-retaining':
          drawRetainingWall3D(ctx, width, height, inputs, outputs, project3D);
          break;
        case 'survey-hi':
          drawSurveyLevelRun2D(ctx, width, height, inputs, outputs);
          break;
        case 'survey-coordinate':
          drawSurveyCoordinate3D(ctx, width, height, inputs, outputs, project3D);
          break;
        case 'steel-calculator':
          drawSteelSection3D(ctx, width, height, inputs, outputs, project3D);
          break;
        case 'rebar-calculator':
          drawRebarGrid3D(ctx, width, height, inputs, outputs, project3D);
          break;
        case 'brick-calculator':
          drawBrickWall3D(ctx, width, height, inputs, outputs, project3D);
          break;
        default:
          drawLogoWatermark2D(ctx, width, height);
          break;
      }

      ctx.restore();
    };

    // ==========================================
    // 1. ADVANCED 3D CONCRETE SLAB RENDERING WITH AGGREGATES
    // ==========================================
    const drawConcreteSlab3D = (
      ctx: CanvasRenderingContext2D, 
      w: number, 
      h: number, 
      inp: any, 
      out: any,
      project: typeof project3D,
      isSlabStressMode = false
    ) => {
      const length = Number(inp.length) || 10;
      const slabWidth = Number(inp.width) || 5;
      const thickness = Number(inp.thickness) || 6; // raw mm or inches

      const cx = w / 2;
      const cy = h / 2 + 10;

      // Define real proportions
      const isM = unitSystem === 'metric';
      const lVal = length;
      const wVal = slabWidth;
      const tVal = isM ? thickness / 1000 : thickness / 12; // convert to consistent m/ft

      const maxDim = Math.max(lVal, wVal, tVal) || 1;
      const targetSize = Math.min(w, h) * 0.45;
      const scale = targetSize / maxDim;

      const L = lVal * scale;
      const W = wVal * scale;
      const T = Math.max(tVal * scale, 8); // set minimum representation thickness to stay legible

      // Compute 3D vertices
      const v0 = project(0, 0, 0, cx, cy, 1, L, W, T);
      const v1 = project(L, 0, 0, cx, cy, 1, L, W, T);
      const v2 = project(L, W, 0, cx, cy, 1, L, W, T);
      const v3 = project(0, W, 0, cx, cy, 1, L, W, T);
      const v4 = project(0, 0, T, cx, cy, 1, L, W, T);
      const v5 = project(L, 0, T, cx, cy, 1, L, W, T);
      const v6 = project(L, W, T, cx, cy, 1, L, W, T);
      const v7 = project(0, W, T, cx, cy, 1, L, W, T);

      // Define faces with center depths to do painter's algorithm sorting
      const faces = [
        { name: 'bottom', indices: [0, 1, 2, 3], color: 'rgba(175, 168, 156, 0.6)', stroke: '#70675B' },
        { name: 'top', indices: [4, 5, 6, 7], color: isSlabStressMode ? 'rgba(46, 107, 86, 0.25)' : '#C7D0EE', stroke: '#232B44' },
        { name: 'front_left', indices: [0, 1, 5, 4], color: '#B5ADA0', stroke: '#232B44' },
        { name: 'front_right', indices: [1, 2, 6, 5], color: '#C2BBAE', stroke: '#232B44' },
        { name: 'back_right', indices: [2, 3, 7, 6], color: '#A69E91', stroke: '#5C5448' },
        { name: 'back_left', indices: [3, 0, 4, 7], color: '#A69E91', stroke: '#5C5448' }
      ];

      const pArr = [v0, v1, v2, v3, v4, v5, v6, v7];

      // Sort faces based on the average depth of their 4 vertices
      faces.forEach(f => {
        const sumD = f.indices.reduce((sum, idx) => sum + pArr[idx].depth, 0);
        (f as any).avgDepth = sumD / 4;
      });

      // Sort back-to-front (ascending avgDepth draw order)
      faces.sort((a, b) => (a as any).avgDepth - (b as any).avgDepth);

      // Draw faces & edges
      faces.forEach(face => {
        if (showWireframeOnly && face.name !== 'top' && face.name !== 'bottom') return;

        ctx.beginPath();
        const pStart = pArr[face.indices[0]];
        ctx.moveTo(pStart.x, pStart.y);
        for (let i = 1; i < face.indices.length; i++) {
          const p = pArr[face.indices[i]];
          ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();

        if (!showWireframeOnly) {
          if (isSlabStressMode && face.name === 'top') {
            const grad = ctx.createRadialGradient((v4.x+v6.x)/2, (v4.y+v6.y)/2, 5, (v4.x+v6.x)/2, (v4.y+v6.y)/2, L * 0.7);
            grad.addColorStop(0, 'rgba(181, 111, 80, 0.6)');
            grad.addColorStop(0.5, 'rgba(217, 185, 110, 0.4)');
            grad.addColorStop(1, 'rgba(46, 107, 86, 0.2)');
            ctx.fillStyle = grad;
          } else {
            ctx.fillStyle = face.color;
          }
          ctx.fill();
        }

        ctx.strokeStyle = face.stroke;
        ctx.lineWidth = face.name === 'top' ? 1.8 : 1.2;
        ctx.stroke();
      });

      // ----------------------------------------------------
      // DRAW REALISTIC CONCRETE TEXTURE & SUBTLE AGGREGATE GRAINS
      // ----------------------------------------------------
      if (!showWireframeOnly && !isSlabStressMode) {
        ctx.save();
        const pebbleSeedCount = 40;
        for (let i = 1; i <= pebbleSeedCount; i++) {
          const rx = (i * 19) % L;
          const ry = (i * 31) % W;
          const rz = (i * 43) % T;
          
          const pt = project(rx, ry, rz, cx, cy, 1, L, W, T);
          const pType = i % 3;
          if (pType === 0) {
            ctx.fillStyle = 'rgba(92, 85, 75, 0.35)';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 1.8, 0, Math.PI * 2);
            ctx.fill();
          } else if (pType === 1) {
            ctx.fillStyle = 'rgba(163, 155, 142, 0.45)';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 1.2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = 'rgba(74, 68, 59, 0.25)';
            ctx.fillRect(pt.x - 0.7, pt.y - 0.7, 1.4, 1.4);
          }
        }
        ctx.restore();
      }

      // ----------------------------------------------------
      // TECHNICAL CAD DIMENSION LEADER LINES (WARM CHARCOAL)
      // ----------------------------------------------------
      ctx.save();
      ctx.strokeStyle = '#141A16';
      ctx.fillStyle = '#141A16';
      ctx.lineWidth = 1.2;
      ctx.font = '600 11px Inter, system-ui, sans-serif';

      // 1. Length guideline (offset along Y axis)
      const dy = -W * 0.18;
      const l_start = project(0, dy, T, cx, cy, 1, L, W, T);
      const l_end = project(L, dy, T, cx, cy, 1, L, W, T);

      ctx.beginPath();
      ctx.moveTo(l_start.x, l_start.y);
      ctx.lineTo(l_end.x, l_end.y);
      ctx.stroke();
      
      // Extension lines & 45-deg CAD ticks
      ctx.beginPath();
      ctx.moveTo(l_start.x - 4, l_start.y - 4); ctx.lineTo(l_start.x + 4, l_start.y + 4);
      ctx.moveTo(l_end.x - 4, l_end.y - 4); ctx.lineTo(l_end.x + 4, l_end.y + 4);
      ctx.stroke();

      const labelLengthText = `${Number(length).toFixed(2)} ${isM ? 'm' : 'ft'}`;
      ctx.fillText(labelLengthText, (l_start.x + l_end.x) / 2 - 18, (l_start.y + l_end.y) / 2 - 8);

      // 2. Width guideline (offset along X axis)
      const dx = -L * 0.18;
      const w_start = project(dx, 0, T, cx, cy, 1, L, W, T);
      const w_end = project(dx, W, T, cx, cy, 1, L, W, T);

      ctx.beginPath();
      ctx.moveTo(w_start.x, w_start.y);
      ctx.lineTo(w_end.x, w_end.y);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(w_start.x - 4, w_start.y - 4); ctx.lineTo(w_start.x + 4, w_start.y + 4);
      ctx.moveTo(w_end.x - 4, w_end.y - 4); ctx.lineTo(w_end.x + 4, w_end.y + 4);
      ctx.stroke();

      const labelWidthText = `${Number(slabWidth).toFixed(2)} ${isM ? 'm' : 'ft'}`;
      ctx.fillText(labelWidthText, (w_start.x + w_end.x) / 2 - 20, (w_start.y + w_end.y) / 2 - 8);

      // 3. Depth/Thickness guideline (vertical projection)
      const t_start = project(L, W, 0, cx, cy, 1, L, W, T);
      const t_end = project(L, W, T, cx, cy, 1, L, W, T);

      ctx.beginPath();
      ctx.moveTo(t_start.x + 12, t_start.y);
      ctx.lineTo(t_end.x + 12, t_end.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(t_start.x + 8, t_start.y); ctx.lineTo(t_start.x + 16, t_start.y);
      ctx.moveTo(t_end.x + 8, t_end.y); ctx.lineTo(t_end.x + 16, t_end.y);
      ctx.stroke();

      // Show depth in meters if metric e.g. 0.15 m
      const depthDisplayVal = isM && thickness > 1 ? (thickness / 1000).toFixed(2) : Number(thickness).toFixed(2);
      const labelThickText = `${depthDisplayVal} ${isM ? 'm' : 'in'}`;
      ctx.fillText(labelThickText, t_end.x + 20, (t_start.y + t_end.y) / 2 + 4);

      ctx.restore();

      // Output values overlay
      if (out && out.volumeTotal) {
        ctx.fillStyle = '#94A3B8';
        ctx.fillText(`Ordered Vol (Wastage applied): ${out.volumeTotal} ${isM ? 'm³' : 'yd³'}`, 16, h - 35);
        ctx.fillStyle = '#22C55E';
        const sT = out.sandWeight ?? out.sandTons ?? 0;
        const aT = out.aggregateWeight ?? out.aggregateTons ?? 0;
        ctx.fillText(`Ratio: ${inputs.mixType === 'custom' ? 'Custom' : inputs.mixType || 'M20'} (C:${out.cementBags ?? 0} bags, S:${sT}t, A:${aT}t)`, 16, h - 22);
      }
    };

    // ==========================================
    // 2. ADVANCED 3D REINFORCED CONCRETE COLUMN RENDERING
    // ==========================================
    const drawConcreteColumn3D = (
      ctx: CanvasRenderingContext2D, 
      w: number, 
      h: number, 
      inp: any, 
      out: any,
      project: typeof project3D
    ) => {
      const colWidth = Number(inp.width) || 400; // mm or in
      const colDepth = Number(inp.depth) || 400; // mm or in
      const barCount = Number(inp.barCount) || 4;
      const barDiameter = Number(inp.barDiameter) || 20;

      const cx = w / 2;
      const cy = h / 2 + 10;
      const isM = unitSystem === 'metric';

      // Design 3D Column Height (make it nice and tall, normalized)
      const colHeight = Math.max(colWidth, colDepth) * 2.8;

      const maxDim = Math.max(colWidth, colDepth, colHeight) || 1;
      const targetSize = Math.min(w, h) * 0.45;
      const scale = targetSize / maxDim;

      // Scaled dimensions
      const L = colWidth * scale; // Width (X)
      const W = colDepth * scale; // Depth (Y)
      const T = colHeight * scale; // Height (Z)

      // 8 Concrete vertices
      const v0 = project(0, 0, 0, cx, cy, 1, L, W, T);
      const v1 = project(L, 0, 0, cx, cy, 1, L, W, T);
      const v2 = project(L, W, 0, cx, cy, 1, L, W, T);
      const v3 = project(0, W, 0, cx, cy, 1, L, W, T);
      const v4 = project(0, 0, T, cx, cy, 1, L, W, T);
      const v5 = project(L, 0, T, cx, cy, 1, L, W, T);
      const v6 = project(L, W, T, cx, cy, 1, L, W, T);
      const v7 = project(0, W, T, cx, cy, 1, L, W, T);

      // Faces sort for painter's algorithm
      const faces = [
        { indices: [0, 1, 2, 3], color: 'rgba(30, 41, 59, 0.4)' },
        { indices: [4, 5, 6, 7], color: 'rgba(30, 41, 59, 0.65)' },
        { indices: [0, 1, 5, 4], color: 'rgba(148, 163, 184, 0.1)' },
        { indices: [1, 2, 6, 5], color: 'rgba(148, 163, 184, 0.15)' },
        { indices: [2, 3, 7, 6], color: 'rgba(148, 163, 184, 0.08)' },
        { indices: [3, 0, 4, 7], color: 'rgba(148, 163, 184, 0.08)' }
      ];

      const pArr = [v0, v1, v2, v3, v4, v5, v6, v7];
      faces.forEach(f => {
        const sumD = f.indices.reduce((sum, idx) => sum + pArr[idx].depth, 0);
        (f as any).avgDepth = sumD / 4;
      });
      faces.sort((a, b) => (a as any).avgDepth - (b as any).avgDepth);

      // Render 3D Column Concrete body
      faces.forEach(face => {
        ctx.beginPath();
        ctx.moveTo(pArr[face.indices[0]].x, pArr[face.indices[0]].y);
        for (let i = 1; i < face.indices.length; i++) {
          ctx.lineTo(pArr[face.indices[i]].x, pArr[face.indices[i]].y);
        }
        ctx.closePath();
        ctx.fillStyle = face.color;
        ctx.fill();

        ctx.strokeStyle = 'rgba(100, 116, 139, 0.45)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // ----------------------------------------------------
      // DRAW 3D INTERNAL REINFORCING CAGE (STIRRUPS AND LONGITUDINAL REBAR)
      // ----------------------------------------------------
      ctx.save();

      // Clear concrete cover (approx 15% of width)
      const cv = Math.max(L * 0.12, 6);
      
      const cageX_min = cv;
      const cageX_max = L - cv;
      const cageY_min = cv;
      const cageY_max = W - cv;

      // 1. Draw 3D Lateral ties / stirrup loops at multiple stacked levels
      const stirrupCount = 6;
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#10B981'; // Vivid green stirrups

      for (let s = 0; s < stirrupCount; s++) {
        // Distribute along column height index
        const sz = (s / (stirrupCount - 1)) * (T - 2 * cv) + cv;
        
        const s0 = project(cageX_min, cageY_min, sz, cx, cy, 1, L, W, T);
        const s1 = project(cageX_max, cageY_min, sz, cx, cy, 1, L, W, T);
        const s2 = project(cageX_max, cageY_max, sz, cx, cy, 1, L, W, T);
        const s3 = project(cageX_min, cageY_max, sz, cx, cy, 1, L, W, T);

        ctx.beginPath();
        ctx.moveTo(s0.x, s0.y);
        ctx.lineTo(s1.x, s1.y);
        ctx.lineTo(s2.x, s2.y);
        ctx.lineTo(s3.x, s3.y);
        ctx.closePath();
        ctx.stroke();
      }

      // 2. Draw Longitudinal main reinforcing steel bars
      ctx.lineWidth = Math.min((barDiameter * scale) / 30 + 3.5, 7);
      ctx.strokeStyle = '#34D399'; // Bright copper-tinted steel

      const rebar3DCoords: {x: number, y: number}[] = [];
      if (barCount <= 4) {
        // 4 corner rebars
        rebar3DCoords.push({ x: cageX_min, y: cageY_min });
        rebar3DCoords.push({ x: cageX_max, y: cageY_min });
        rebar3DCoords.push({ x: cageX_max, y: cageY_max });
        rebar3DCoords.push({ x: cageX_min, y: cageY_max });
      } else if (barCount === 6) {
        rebar3DCoords.push({ x: cageX_min, y: cageY_min });
        rebar3DCoords.push({ x: cageX_max, y: cageY_min });
        rebar3DCoords.push({ x: cageX_max, y: cageY_max });
        rebar3DCoords.push({ x: cageX_min, y: cageY_max });
        if (L >= W) {
          rebar3DCoords.push({ x: L / 2, y: cageY_min });
          rebar3DCoords.push({ x: L / 2, y: cageY_max });
        } else {
          rebar3DCoords.push({ x: cageX_min, y: W / 2 });
          rebar3DCoords.push({ x: cageX_max, y: W / 2 });
        }
      } else {
        // 8 rebars
        rebar3DCoords.push({ x: cageX_min, y: cageY_min });
        rebar3DCoords.push({ x: cageX_max, y: cageY_min });
        rebar3DCoords.push({ x: cageX_max, y: cageY_max });
        rebar3DCoords.push({ x: cageX_min, y: cageY_max });
        rebar3DCoords.push({ x: L / 2, y: cageY_min });
        rebar3DCoords.push({ x: L / 2, y: cageY_max });
        rebar3DCoords.push({ x: cageX_min, y: W / 2 });
        rebar3DCoords.push({ x: cageX_max, y: W / 2 });
      }

      // Plot rebar lines from Z=cb down to Z=T-cb
      rebar3DCoords.forEach(c => {
        const r_start = project(c.x, c.y, cv, cx, cy, 1, L, W, T);
        const r_end = project(c.x, c.y, T - cv, cx, cy, 1, L, W, T);

        ctx.beginPath();
        ctx.moveTo(r_start.x, r_start.y);
        ctx.lineTo(r_end.x, r_end.y);
        ctx.stroke();
      });

      ctx.restore();

      // Dynamic Dimension overlays in green
      ctx.save();
      ctx.strokeStyle = '#22C55E';
      ctx.fillStyle = '#22C55E';
      ctx.lineWidth = 1;
      ctx.font = '9px monospace';

      // Width notation
      const dWidth = project(0, -15, T, cx, cy, 1, L, W, T);
      const dWidthEnd = project(L, -15, T, cx, cy, 1, L, W, T);
      ctx.beginPath();
      ctx.moveTo(dWidth.x, dWidth.y);
      ctx.lineTo(dWidthEnd.x, dWidthEnd.y);
      ctx.stroke();
      ctx.fillText(`Width: ${colWidth} ${isM ? 'mm' : 'in'}`, (dWidth.x+dWidthEnd.x)/2 - 35, (dWidth.y+dWidthEnd.y)/2 - 5);

      // Depth notation
      const dDepth = project(-15, 0, T, cx, cy, 1, L, W, T);
      const dDepthEnd = project(-15, W, T, cx, cy, 1, L, W, T);
      ctx.beginPath();
      ctx.moveTo(dDepth.x, dDepth.y);
      ctx.lineTo(dDepthEnd.x, dDepthEnd.y);
      ctx.stroke();
      ctx.fillText(`Depth: ${colDepth} ${isM ? 'mm' : 'in'}`, (dDepth.x+dDepthEnd.x)/2 - 35, (dDepth.y+dDepthEnd.y)/2 - 5);

      ctx.restore();

      // Steel warnings & load capacities
      if (out && out.factoredCapacityPhiPn) {
        ctx.fillStyle = '#94A3B8';
        ctx.fillText(`Reinforcing: ${barCount}xØ${barDiameter} long bars. Stirrup spacing ~200mm`, 16, h - 35);
        
        ctx.fillStyle = (out.minRebarWarning || out.maxRebarWarning) ? '#F59E0B' : '#10B981';
        ctx.fillText(`Capacity (φPn): ${out.factoredCapacityPhiPn} ${isM ? 'kN' : 'kips'} (${out.steelRatio}% steel)`, 16, h - 22);
      }
    };

    // ==========================================
    // 3. ADVANCED 3D GEOTECHNICAL SPREAD FOOTING RENDERING
    // ==========================================
    const drawSpreadFooting3D = (
      ctx: CanvasRenderingContext2D, 
      w: number, 
      h: number, 
      inp: any, 
      out: any,
      project: typeof project3D
    ) => {
      const cx = w / 2;
      const cy = h / 2 + 10;
      const isM = unitSystem === 'metric';

      const Df_val = Number(inp.df) || 1.5; // footing depth m/ft
      const B_val = Number(inp.bg) || 2.0;  // footing base width m/ft

      const maxDim = Math.max(B_val, Df_val * 1.5) || 1;
      const targetSize = Math.min(w, h) * 0.45;
      const scale = targetSize / maxDim;

      const B = B_val * scale;
      const Df = Df_val * scale;
      const footH = Math.max(scale * 0.35, 12);
      const colW = Math.max(scale * 0.25, 10);

      // Draw Earth surface reference grid/plane
      ctx.fillStyle = 'rgba(63, 34, 15, 0.2)';
      ctx.strokeStyle = '#78350F';
      
      const s0 = project(-B, -B, -Df, cx, cy, 1, B, B, Df);
      const s1 = project(2*B, -B, -Df, cx, cy, 1, B, B, Df);
      const s2 = project(2*B, 2*B, -Df, cx, cy, 1, B, B, Df);
      const s3 = project(-B, 2*B, -Df, cx, cy, 1, B, B, Df);

      ctx.beginPath();
      ctx.moveTo(s0.x, s0.y);
      ctx.lineTo(s1.x, s1.y);
      ctx.lineTo(s2.x, s2.y);
      ctx.lineTo(s3.x, s3.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Footing 3D Slab representation
      const f0 = project(0, 0, 0, cx, cy, 1, B, B, Df);
      const f1 = project(B, 0, 0, cx, cy, 1, B, B, Df);
      const f2 = project(B, B, 0, cx, cy, 1, B, B, Df);
      const f3 = project(0, B, 0, cx, cy, 1, B, B, Df);
      const f4 = project(0, 0, footH, cx, cy, 1, B, B, Df);
      const f5 = project(B, 0, footH, cx, cy, 1, B, B, Df);
      const f6 = project(B, B, footH, cx, cy, 1, B, B, Df);
      const f7 = project(0, B, footH, cx, cy, 1, B, B, Df);

      // Draw footing slab (translucent slate)
      const fArr = [f0, f1, f2, f3, f4, f5, f6, f7];
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 1.5;
      ctx.fillStyle = 'rgba(5, 150, 105, 0.2)';

      ctx.beginPath();
      ctx.moveTo(f4.x, f4.y); ctx.lineTo(f5.x, f5.y); ctx.lineTo(f6.x, f6.y); ctx.lineTo(f7.x, f7.y);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(f1.x, f1.y); ctx.lineTo(f5.x, f5.y); ctx.lineTo(f6.x, f6.y); ctx.lineTo(f2.x, f2.y);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      // Column standing upwards
      const cCenterOffset = (B - colW) / 2;
      const c0 = project(cCenterOffset, cCenterOffset, footH, cx, cy, 1, B, B, Df);
      const c1 = project(cCenterOffset + colW, cCenterOffset, footH, cx, cy, 1, B, B, Df);
      const c2 = project(cCenterOffset + colW, cCenterOffset + colW, footH, cx, cy, 1, B, B, Df);
      const c3 = project(cCenterOffset, cCenterOffset + colW, footH, cx, cy, 1, B, B, Df);
      const c4 = project(cCenterOffset, cCenterOffset, Df + 20, cx, cy, 1, B, B, Df);
      const c5 = project(cCenterOffset + colW, cCenterOffset, Df + 20, cx, cy, 1, B, B, Df);
      const c6 = project(cCenterOffset + colW, cCenterOffset + colW, Df + 20, cx, cy, 1, B, B, Df);
      const c7 = project(cCenterOffset, cCenterOffset + colW, Df + 20, cx, cy, 1, B, B, Df);

      ctx.fillStyle = 'rgba(51, 65, 85, 0.85)';
      ctx.strokeStyle = '#0A84FF';
      ctx.beginPath();
      ctx.moveTo(c4.x, c4.y); ctx.lineTo(c5.x, c5.y); ctx.lineTo(c6.x, c6.y); ctx.lineTo(c7.x, c7.y);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(c1.x, c1.y); ctx.lineTo(c5.x, c5.y); ctx.lineTo(c6.x, c6.y); ctx.lineTo(c2.x, c2.y);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      // Dynamic Geotechnical Pressure Bulb stress isobars (below footing Z <= 0)
      ctx.save();
      ctx.strokeStyle = '#F59E0B'; // Orange isobar contours
      ctx.fillStyle = 'rgba(245, 158, 11, 0.04)';
      ctx.lineWidth = 1;

      // Draw spheroidal contour meshes below footing
      const contourSteps = [0.4, 0.9, 1.4];
      contourSteps.forEach((cStep, idx) => {
        ctx.beginPath();
        const baseZ = -cStep * B;
        const radius = B / 2 * (1.5 - cStep * 0.4);
        
        ctx.ellipse(
          (f0.x + f2.x) / 2, 
          (f0.y + f2.y) / 2 + cStep * 28 * zoom,
          radius * zoom,
          radius * 0.5 * zoom,
          0, 
          0, 
          Math.PI * 2
        );
        ctx.fill();
        ctx.stroke();
      });
      ctx.restore();

      // Vertical load vector downwards
      const loadTop = project(B/2, B/2, Df + 60, cx, cy, 1, B, B, Df);
      const loadBottom = project(B/2, B/2, Df + 20, cx, cy, 1, B, B, Df);
      
      ctx.save();
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(loadTop.x, loadTop.y);
      ctx.lineTo(loadBottom.x, loadBottom.y);
      ctx.stroke();

      // Arrow head
      ctx.beginPath();
      ctx.moveTo(loadBottom.x - 5, loadBottom.y - 8);
      ctx.lineTo(loadBottom.x, loadBottom.y);
      ctx.lineTo(loadBottom.x + 5, loadBottom.y - 8);
      ctx.stroke();
      ctx.fillStyle = '#EF4444';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('AXIAL LOAD P', loadTop.x + 8, loadTop.y + 12);
      ctx.restore();

      // Dimension details
      ctx.save();
      ctx.strokeStyle = '#22C55E';
      ctx.fillStyle = '#22C55E';
      ctx.font = '9px monospace';
      
      // Plot footing Width B
      const dimB_start = project(0, B + 15, 0, cx, cy, 1, B, B, Df);
      const dimB_end = project(B, B + 15, 0, cx, cy, 1, B, B, Df);
      ctx.beginPath();
      ctx.moveTo(dimB_start.x, dimB_start.y);
      ctx.lineTo(dimB_end.x, dimB_end.y);
      ctx.stroke();
      ctx.fillText(`Width B = ${B_val} ${isM ? 'm' : 'ft'}`, (dimB_start.x+dimB_end.x)/2 - 35, (dimB_start.y+dimB_end.y)/2 - 5);

      ctx.restore();

      // Soil Bearing capacity parameters
      if (out && out.allowableCapacity) {
        ctx.fillStyle = '#94A3B8';
        ctx.fillText(`Bearing Capacities: Nc=${out.nc}, Nq=${out.nq}, Nγ=${out.ngg}`, 16, h - 35);
        ctx.fillStyle = '#22C55E';
        ctx.fillText(`Max Allowable Stress: ${out.allowableCapacity} ${isM ? 'kPa' : 'psf'} (FS=${inp.safetyFactor})`, 16, h - 22);
      }
    };

    // ==========================================
    // 4. ADVANCED 3D RETAINING WALL RENDERING
    // ==========================================
    const drawRetainingWall3D = (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      inp: any,
      out: any,
      project: typeof project3D
    ) => {
      const cx = w / 2;
      const cy = h / 2 + 10;
      const isM = unitSystem === 'metric';

      const wallHeight = Number(inp.height) || 4.5; // m/ft

      const maxDim = Math.max(wallHeight, 4) || 1;
      const targetSize = Math.min(w, h) * 0.45;
      const scale = targetSize / maxDim;

      const stemH = wallHeight * scale;
      const baseW = Math.max(wallHeight * 0.6 * scale, 30);
      const baseH = Math.max(scale * 0.4, 8);
      const stemW = Math.max(scale * 0.35, 8);

      // Concrete corners of Inverted-T base
      const f0 = project(0, 0, 0, cx, cy, 1, baseW, baseW, stemH);
      const f1 = project(baseW, 0, 0, cx, cy, 1, baseW, baseW, stemH);
      const f2 = project(baseW, baseW, 0, cx, cy, 1, baseW, baseW, stemH);
      const f3 = project(0, baseW, 0, cx, cy, 1, baseW, baseW, stemH);
      const f4 = project(0, 0, baseH, cx, cy, 1, baseW, baseW, stemH);
      const f5 = project(baseW, 0, baseH, cx, cy, 1, baseW, baseW, stemH);
      const f6 = project(baseW, baseW, baseH, cx, cy, 1, baseW, baseW, stemH);
      const f7 = project(0, baseW, baseH, cx, cy, 1, baseW, baseW, stemH);

      ctx.fillStyle = 'rgba(71, 85, 105, 0.4)';
      ctx.strokeStyle = '#0A84FF';
      ctx.lineWidth = 1;

      // Base top layer
      ctx.beginPath();
      ctx.moveTo(f4.x, f4.y); ctx.lineTo(f5.x, f5.y); ctx.lineTo(f6.x, f6.y); ctx.lineTo(f7.x, f7.y);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      // Stem vertical prism corners (placed closer to toe / heel ratio)
      const xOffset = baseW * 0.35;
      const s0 = project(xOffset, 0, baseH, cx, cy, 1, baseW, baseW, stemH);
      const s1 = project(xOffset + stemW, 0, baseH, cx, cy, 1, baseW, baseW, stemH);
      const s2 = project(xOffset + stemW, baseW, baseH, cx, cy, 1, baseW, baseW, stemH);
      const s3 = project(xOffset, baseW, baseH, cx, cy, 1, baseW, baseW, stemH);
      const s4 = project(xOffset, 0, stemH, cx, cy, 1, baseW, baseW, stemH);
      const s5 = project(xOffset + stemW, 0, stemH, cx, cy, 1, baseW, baseW, stemH);
      const s6 = project(xOffset + stemW, baseW, stemH, cx, cy, 1, baseW, baseW, stemH);
      const s7 = project(xOffset, baseW, stemH, cx, cy, 1, baseW, baseW, stemH);

      ctx.fillStyle = 'rgba(51, 65, 85, 0.82)';
      
      ctx.beginPath();
      ctx.moveTo(s4.x, s4.y); ctx.lineTo(s5.x, s5.y); ctx.lineTo(s6.x, s6.y); ctx.lineTo(s7.x, s7.y);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(s1.x, s1.y); ctx.lineTo(s5.x, s5.y); ctx.lineTo(s6.x, s6.y); ctx.lineTo(s2.x, s2.y);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      // Draw Earth active lateral thrust pressure wedge / triangle in Z plane
      ctx.save();
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 1.5;
      ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';

      const steps = 4;
      for (let i = 1; i <= steps; i++) {
        const heightPct = i / steps; // 0 to 1
        const curZ = baseH + heightPct * (stemH - baseH);
        
        const originWall = project(xOffset + stemW, baseW / 2, curZ, cx, cy, 1, baseW, baseW, stemH);
        const arrowExtent = project(xOffset + stemW + (1 - heightPct) * 45, baseW / 2, curZ, cx, cy, 1, baseW, baseW, stemH);

        ctx.beginPath();
        ctx.moveTo(arrowExtent.x, arrowExtent.y);
        ctx.lineTo(originWall.x, originWall.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(originWall.x + 4, originWall.y - 3);
        ctx.lineTo(originWall.x, originWall.y);
        ctx.lineTo(originWall.x + 4, originWall.y + 3);
        ctx.stroke();
      }
      ctx.restore();

      // Dimensioning in green
      ctx.save();
      ctx.strokeStyle = '#22C55E';
      ctx.fillStyle = '#22C55E';
      ctx.font = '9px monospace';
      
      const dH_start = project(-10, baseW/2, 0, cx, cy, 1, baseW, baseW, stemH);
      const dH_end = project(-10, baseW/2, stemH, cx, cy, 1, baseW, baseW, stemH);
      ctx.beginPath();
      ctx.moveTo(dH_start.x, dH_start.y);
      ctx.lineTo(dH_end.x, dH_end.y);
      ctx.stroke();
      ctx.fillText(`Height H = ${wallHeight} ${isM ? 'm' : 'ft'}`, dH_end.x - 70, (dH_start.y+dH_end.y)/2);

      ctx.restore();

      if (out && out.ka) {
        ctx.fillStyle = '#94A3B8';
        ctx.fillText(`Active Earth Coeff (Ka): ${out.ka}. Backfill Angle: ${inp.backfillSlope ?? 0}°`, 16, h - 35);
        ctx.fillStyle = '#22C55E';
        ctx.fillText(`Total Lateral Thrust: ${out.lateralMoistureThrust} ${isM ? 'kN/m' : 'lbs/ft'}`, 16, h - 22);
      }
    };

    // ==========================================
    // 5. ANALYTICAL BEAM LOAD & DIAGRAM DRAWING (2D BLUEPRINT STYLE)
    // ==========================================
    const drawBeamDeflection2D = (ctx: CanvasRenderingContext2D, w: number, h: number, inp: any, out: any) => {
      const cy = h / 2 - 10;
      const leftX = 50;
      const rightX = w - 50;
      const bW = rightX - leftX;
      const loadType = inp.loadType || 'udl';
      const deflection = Number(out.maxDeflection) || 0;
      const maxShearVal = Number(out.maxShear) || 0;
      const maxMomentVal = Number(out.maxMoment) || 0;

      // Draw supports
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 2;
      
      // Triangle base support left Pin
      ctx.beginPath();
      ctx.moveTo(leftX, cy);
      ctx.lineTo(leftX - 10, cy + 18);
      ctx.lineTo(leftX + 10, cy + 18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Roller support right
      ctx.beginPath();
      ctx.arc(rightX, cy + 9, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rightX - 12, cy + 18);
      ctx.lineTo(rightX + 12, cy + 18);
      ctx.stroke();

      if (beamTab === 'profile') {
        // Draw original beam bounds (gray dotted)
        ctx.strokeStyle = '#334155';
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(leftX, cy - 8, bW, 16);
        ctx.setLineDash([]);

        // Multiplier to visualize deflection curve beautifully
        let defMultiplier = 1;
        if (deflection > 0) {
          const maxDrawDef = 35; // px
          defMultiplier = maxDrawDef / Math.max(deflection, 0.1);
          if (defMultiplier > 30) defMultiplier = 30; // limit scale
        }

        // Draw bending deflection curve
        ctx.beginPath();
        ctx.strokeStyle = '#0A84FF';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        
        for (let x = leftX; x <= rightX; x++) {
          const x_norm = (x - leftX) / bW; // 0 to 1
          let y_def = 0;
          if (loadType === 'udl') {
            y_def = 16 * x_norm * (1 - 2 * Math.pow(x_norm, 2) + Math.pow(x_norm, 3)) * (deflection * defMultiplier * 0.4);
          } else {
            if (x_norm <= 0.5) {
              y_def = (3 * x_norm - 4 * Math.pow(x_norm, 3)) * (deflection * defMultiplier * 0.5);
            } else {
              const z = 1 - x_norm;
              y_def = (3 * z - 4 * Math.pow(z, 3)) * (deflection * defMultiplier * 0.5);
            }
          }
          
          if (x === leftX) ctx.moveTo(x, cy + y_def);
          else ctx.lineTo(x, cy + y_def);
        }
        ctx.stroke();

        // Stress gradient flow beneath
        ctx.fillStyle = 'rgba(10, 132, 255, 0.05)';
        ctx.beginPath();
        ctx.moveTo(leftX, cy);
        for (let x = leftX; x <= rightX; x++) {
          const x_norm = (x - leftX) / bW;
          let y_def = 0;
          if (loadType === 'udl') {
            y_def = 16 * x_norm * (1 - 2 * Math.pow(x_norm, 2) + Math.pow(x_norm, 3)) * (deflection * defMultiplier * 0.4);
          } else {
            y_def = x_norm <= 0.5 ? (3 * x_norm - 4 * Math.pow(x_norm, 3)) * (deflection * defMultiplier * 0.5) : (3*(1-x_norm)-4*Math.pow(1-x_norm,3)) * (deflection * defMultiplier * 0.5);
          }
          ctx.lineTo(x, cy + y_def);
        }
        ctx.lineTo(rightX, cy);
        ctx.closePath();
        ctx.fill();

        // Draw loads diagram
        ctx.strokeStyle = '#EF4444';
        ctx.fillStyle = '#EF4444';
        ctx.lineWidth = 1.5;

        if (loadType === 'udl') {
          for (let x = leftX + 15; x <= rightX - 15; x += 25) {
            ctx.beginPath();
            ctx.moveTo(x, cy - 35);
            ctx.lineTo(x, cy - 13);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x - 3, cy - 18);
            ctx.lineTo(x, cy - 13);
            ctx.lineTo(x + 3, cy - 18);
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.moveTo(leftX + 15, cy - 35);
          ctx.lineTo(rightX - 15, cy - 35);
          ctx.stroke();
          ctx.font = '10px monospace';
          ctx.fillText(`UDL: ${inp.load} ${unitSystem === 'metric' ? 'kN/m' : 'klf'}`, bW / 2 - 10, cy - 42);
        } else {
          const midX = leftX + bW / 2;
          ctx.beginPath();
          ctx.moveTo(midX, cy - 45);
          ctx.lineTo(midX, cy - 15);
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(midX - 6, cy - 23);
          ctx.lineTo(midX, cy - 15);
          ctx.lineTo(midX + 6, cy - 23);
          ctx.stroke();
          ctx.font = '10px monospace';
          ctx.fillText(`POINT LOAD P = ${inp.load} ${unitSystem === 'metric' ? 'kN' : 'kips'}`, midX - 58, cy - 50);
        }

        // Span dimension
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#22C55E';
        ctx.fillStyle = '#22C55E';
        ctx.beginPath();
        ctx.moveTo(leftX, cy + 30);
        ctx.lineTo(rightX, cy + 30);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(leftX, cy + 25); ctx.lineTo(leftX, cy + 35);
        ctx.moveTo(rightX, cy + 25); ctx.lineTo(rightX, cy + 35);
        ctx.stroke();
        ctx.fillText(`SPAN L = ${inp.span} ${unitSystem === 'metric' ? 'm' : 'ft'}`, leftX + bW / 2 - 35, cy + 42);

        // Limits and safety
        if (out && out.maxMoment) {
          ctx.fillStyle = '#94A3B8';
          ctx.fillText(`Max Moment (M_max): ${out.maxMoment} ${unitSystem === 'metric' ? 'kN·m' : 'kip·ft'}`, 16, h - 35);
          ctx.fillText(`Max Deflection (Δ): ${out.maxDeflection} ${unitSystem === 'metric' ? 'mm' : 'in'}`, 16, h - 22);

          const statusText = out.isDeflectionOk ? 'PASS // LIMIT CONTROL OK' : 'CRITICAL // EXCEEDS L/240';
          ctx.fillStyle = out.isDeflectionOk ? '#22C55E' : '#EF4444';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(statusText, w - ctx.measureText(statusText).width - 16, h - 22);
        }
      } 
      
      else if (beamTab === 'sfd') {
        // SHEAR FORCE DIAGRAM (SFD)
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(leftX, cy);
        ctx.lineTo(rightX, cy);
        ctx.stroke();

        ctx.font = '9px monospace';
        ctx.fillStyle = '#94A3B8';
        ctx.fillText('SHEAR FORCE DIAGRAM (SFD)', bW / 2 + leftX - 60, cy - 55);

        const fillHeight = 45; // Maximum amplitude of drawing
        ctx.lineWidth = 3;

        if (loadType === 'udl') {
          ctx.strokeStyle = '#F59E0B'; // Amber
          ctx.beginPath();
          ctx.moveTo(leftX, cy - fillHeight);
          ctx.lineTo(rightX, cy + fillHeight);
          ctx.stroke();

          ctx.fillStyle = 'rgba(34, 197, 94, 0.15)'; // green shade
          ctx.beginPath();
          ctx.moveTo(leftX, cy);
          ctx.lineTo(leftX, cy - fillHeight);
          ctx.lineTo(leftX + bW / 2, cy);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = 'rgba(239, 68, 68, 0.15)'; // red shade
          ctx.beginPath();
          ctx.moveTo(leftX + bW / 2, cy);
          ctx.lineTo(rightX, cy + fillHeight);
          ctx.lineTo(rightX, cy);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
          ctx.lineWidth = 1;
          for (let step = 10; step < bW / 2; step += 15) {
            const x = leftX + step;
            const y = cy - fillHeight * (1 - step / (bW / 2));
            ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x, y); ctx.stroke();
            
            const x_neg = leftX + bW / 2 + step;
            const y_neg = cy + fillHeight * (step / (bW / 2));
            ctx.beginPath(); ctx.moveTo(x_neg, cy); ctx.lineTo(x_neg, y_neg); ctx.stroke();
          }

          ctx.fillStyle = '#22C55E';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(`+V = ${maxShearVal} ${unitSystem === 'metric' ? 'kN' : 'kips'}`, leftX + 5, cy - fillHeight - 8);

          ctx.fillStyle = '#EF4444';
          ctx.fillText(`-V = -${maxShearVal} ${unitSystem === 'metric' ? 'kN' : 'kips'}`, rightX - 90, cy + fillHeight + 14);
        } else {
          ctx.strokeStyle = '#F59E0B';
          ctx.beginPath();
          ctx.moveTo(leftX, cy - fillHeight);
          ctx.lineTo(leftX + bW / 2, cy - fillHeight);
          ctx.lineTo(leftX + bW / 2, cy + fillHeight);
          ctx.lineTo(rightX, cy + fillHeight);
          ctx.stroke();

          ctx.fillStyle = 'rgba(34, 197, 94, 0.12)';
          ctx.fillRect(leftX, cy - fillHeight, bW / 2, fillHeight);

          ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
          ctx.fillRect(leftX + bW / 2, cy, bW / 2, fillHeight);

          ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
          ctx.lineWidth = 1;
          for (let x = leftX + 12; x < rightX; x += 15) {
            if (x < leftX + bW / 2) {
              ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x, cy - fillHeight); ctx.stroke();
            } else if (Math.abs(x - (leftX + bW / 2)) > 5) {
              ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x, cy + fillHeight); ctx.stroke();
            }
          }

          ctx.fillStyle = '#22C55E';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(`+V = ${maxShearVal} ${unitSystem === 'metric' ? 'kN' : 'kips'}`, leftX + 8, cy - fillHeight - 8);

          ctx.fillStyle = '#EF4444';
          ctx.fillText(`-V = -${maxShearVal} ${unitSystem === 'metric' ? 'kN' : 'kips'}`, rightX - 90, cy + fillHeight + 14);
        }

        ctx.fillStyle = '#94A3B8';
        ctx.font = '9px monospace';
        ctx.fillText(`Supports: Ra = Rb = ${maxShearVal} ${unitSystem === 'metric' ? 'kN' : 'kips'}`, 16, h - 22);
      } 
      
      else if (beamTab === 'bmd') {
        // BENDING MOMENT DIAGRAM (BMD)
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(leftX, cy);
        ctx.lineTo(rightX, cy);
        ctx.stroke();

        ctx.font = '9px monospace';
        ctx.fillStyle = '#94A3B8';
        ctx.fillText('BENDING MOMENT DIAGRAM (BMD)', bW / 2 + leftX - 65, cy - 55);

        const bmdMaxHeight = 50; 
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#00D8A5';

        if (loadType === 'udl') {
          ctx.beginPath();
          for (let x = leftX; x <= rightX; x++) {
            const x_norm = (x - leftX) / bW;
            const momentFactor = 4 * x_norm * (1 - x_norm);
            const y_bmd = cy - bmdMaxHeight * momentFactor;

            if (x === leftX) ctx.moveTo(x, y_bmd);
            else ctx.lineTo(x, y_bmd);
          }
          ctx.stroke();

          ctx.fillStyle = 'rgba(0, 216, 165, 0.12)';
          ctx.beginPath();
          ctx.moveTo(leftX, cy);
          for (let x = leftX; x <= rightX; x++) {
            const x_norm = (x - leftX) / bW;
            const y_bmd = cy - bmdMaxHeight * 4 * x_norm * (1 - x_norm);
            ctx.lineTo(x, y_bmd);
          }
          ctx.lineTo(rightX, cy);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
          ctx.lineWidth = 1;
          for (let x = leftX + 15; x < rightX; x += 15) {
            const x_norm = (x - leftX) / bW;
            const y_bmd = cy - bmdMaxHeight * 4 * x_norm * (1 - x_norm);
            ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x, y_bmd); ctx.stroke();
          }

          ctx.fillStyle = '#00D8A5';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(`M_max = ${maxMomentVal} ${unitSystem === 'metric' ? 'kN·m' : 'kip·ft'}`, leftX + bW / 2 - 55, cy - bmdMaxHeight - 8);

        } else {
          ctx.strokeStyle = '#00D8A5';
          ctx.beginPath();
          ctx.moveTo(leftX, cy);
          ctx.lineTo(leftX + bW / 2, cy - bmdMaxHeight);
          ctx.lineTo(rightX, cy);
          ctx.stroke();

          ctx.fillStyle = 'rgba(0, 216, 165, 0.12)';
          ctx.beginPath();
          ctx.moveTo(leftX, cy);
          ctx.lineTo(leftX + bW / 2, cy - bmdMaxHeight);
          ctx.lineTo(rightX, cy);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
          ctx.lineWidth = 1;
          for (let x = leftX + 15; x < rightX; x += 15) {
            const x_norm = (x - leftX) / bW;
            const y_bmd = x_norm <= 0.5 ? cy - bmdMaxHeight * 2 * x_norm : cy - bmdMaxHeight * 2 * (1 - x_norm);
            ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x, y_bmd); ctx.stroke();
          }

          ctx.fillStyle = '#00D8A5';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(`M_max = ${maxMomentVal} ${unitSystem === 'metric' ? 'kN·m' : 'kip·ft'}`, leftX + bW / 2 - 55, cy - bmdMaxHeight - 8);
        }

        ctx.fillStyle = '#94A3B8';
        ctx.font = '9px monospace';
        ctx.fillText(`Peak Stress occurs at Mid-Span L/2 (${(inp.span / 2).toFixed(2)} ${unitSystem === 'metric' ? 'm' : 'ft'})`, 16, h - 22);
      }
    };

    // ==========================================
    // 6. SURVEY RUN PROFILE ELEVATION PLOTTER
    // ==========================================
    const drawSurveyLevelRun2D = (ctx: CanvasRenderingContext2D, w: number, h: number, inp: any, out: any) => {
      const isM = unitSystem === 'metric';
      const u = isM ? 'm' : 'ft';

      if (out.rows && out.rows.length > 0) {
        const rows = out.rows;
        
        let minRL = Infinity;
        let maxRL = -Infinity;
        rows.forEach((r: any) => {
          if (r.rl !== undefined) {
            if (r.rl < minRL) minRL = r.rl;
            if (r.rl > maxRL) maxRL = r.rl;
          }
        });
        
        if (minRL === Infinity || maxRL === -Infinity) {
          minRL = 100;
          maxRL = 105;
        }
        
        const rlRange = maxRL - minRL;
        const padRL = rlRange * 0.2 || 2.0; 
        const displayMin = minRL - padRL;
        const displayMax = maxRL + padRL;
        const displayRange = displayMax - displayMin;
        
        const minX = 40;
        const maxX = w - 40;
        const totalDist = rows[rows.length - 1].distance || 100;
        
        const getX = (dist: number) => {
          return minX + (dist / (totalDist || 1)) * (maxX - minX);
        };
        
        const getY = (rl: number) => {
          const topSpace = 40;
          const bottomSpace = h - 65;
          return bottomSpace - ((rl - displayMin) / (displayRange || 1)) * (bottomSpace - topSpace);
        };

        ctx.fillStyle = '#0F172A';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(getX(0), h - 35); 
        
        rows.forEach((r: any) => {
          const rx = getX(r.distance);
          const ry = getY(r.rl ?? displayMin);
          ctx.lineTo(rx, ry);
        });
        
        ctx.lineTo(getX(totalDist), h - 35); 
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        for (let d = 0; d <= totalDist; d += totalDist / 30) {
          const rx = getX(d);
          let sampleRl = displayMin;
          for (let i = 0; i < rows.length - 1; i++) {
            if (d >= rows[i].distance && d <= rows[i + 1].distance) {
              const fraction = (d - rows[i].distance) / ((rows[i + 1].distance - rows[i].distance) || 1);
              sampleRl = (rows[i].rl ?? displayMin) + fraction * ((rows[i + 1].rl ?? displayMin) - (rows[i].rl ?? displayMin));
              break;
            }
          }
          const ry = getY(sampleRl);
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 4, ry + 6);
          ctx.stroke();
        }
        
        rows.forEach((r: any) => {
          const rx = getX(r.distance);
          const ry = getY(r.rl ?? displayMin);
          
          const rodH = 45;
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(rx - 2, ry - rodH, 4, rodH);
          ctx.strokeStyle = '#64748B';
          ctx.lineWidth = 1;
          ctx.strokeRect(rx - 2, ry - rodH, 4, rodH);
          
          ctx.fillStyle = '#0F172A';
          for (let tickY = ry; tickY > ry - rodH; tickY -= 6) {
            if (Math.round(tickY) % 12 === 0) {
              ctx.fillRect(rx - 2, tickY - 3, 4, 3);
            }
          }
          
          if (r.bs !== null) {
            const instX = rx + 14; 
            const instY = getY(r.hi ?? (r.rl + r.bs));
            
            ctx.strokeStyle = '#E11D48';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(instX, instY + 5);
            ctx.lineTo(instX - 5, ry);
            ctx.moveTo(instX, instY + 5);
            ctx.lineTo(instX, ry);
            ctx.moveTo(instX, instY + 5);
            ctx.lineTo(instX + 5, ry);
            ctx.stroke();
            
            ctx.fillStyle = '#EA580C';
            ctx.fillRect(instX - 4, instY - 2, 8, 5);
            ctx.fillStyle = '#D97706';
            ctx.fillRect(instX - 6, instY - 1, 12, 3);
          }
          
          if (r.station) {
            ctx.fillStyle = '#F8FAFC';
            ctx.font = 'bold 9px sans-serif';
            ctx.fillText(r.station, rx - 4, ry + 12);
          }
          
          ctx.fillStyle = '#10B981';
          ctx.font = '7px monospace';
          ctx.fillText((r.rl ?? 0).toFixed(1), rx - 10, ry + (r.station ? 22 : 12));
          
          if (r.remarks) {
            ctx.fillStyle = '#F59E0B';
            ctx.font = 'bold 7px monospace';
            ctx.fillText(r.remarks, rx - 12, ry - rodH - 4);
          }
        });
        
        let lastSetupRow = null;
        for (let idx = 0; idx < rows.length; idx++) {
          if (rows[idx].bs !== null) {
            lastSetupRow = rows[idx];
          }
        }
        if (lastSetupRow) {
          const laserY = getY(lastSetupRow.hi);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(minX, laserY);
          ctx.lineTo(maxX, laserY);
          ctx.stroke();
          ctx.setLineDash([]);
          
          ctx.fillStyle = '#EF4444';
          ctx.font = 'italic 7px monospace';
          ctx.fillText(`PLANE HI: ${lastSetupRow.hi.toFixed(3)} ${u}`, minX + 5, laserY - 4);
        }
        
        ctx.fillStyle = '#94A3B8';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`FIELD SURVEY RUN PROFILE (ELEVATIONS)`, 16, h - 14);
      } else {
        ctx.fillStyle = '#94A3B8';
        ctx.font = '9px monospace';
        ctx.fillText('No leveling stations defined to plot profile', w / 2 - 100, h / 2);
      }
    };

    // ==========================================
    // 3D CONCRETE BEAM RENDERING WITH DEFLECTION & REBARS
    // ==========================================
    const drawConcreteBeam3D = (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      inp: any,
      out: any,
      project: typeof project3D
    ) => {
      const span = Number(inp.span) || 6; 
      const width = Number(inp.width) || 300; 
      const depth = Number(inp.depth) || 500; 
      const loadType = inp.loadType || 'udl';
      const deflection = Number(out.maxDeflection) || 0;

      const cx = w / 2;
      const cy = h / 2 + 10;
      const isM = unitSystem === 'metric';

      const beamL_val = span;
      const beamW_val = isM ? width / 1000 : width / 12;
      const beamH_val = isM ? depth / 1000 : depth / 12;

      const maxDim = Math.max(beamL_val, beamW_val * 6, beamH_val * 6) || 1;
      const targetSize = Math.min(w, h) * 0.45;
      const scale = targetSize / maxDim;

      const L = beamL_val * scale;
      const W = Math.max(beamW_val * scale, 15);
      const T = Math.max(beamH_val * scale, 25);

      const segments = 16;
      ctx.lineWidth = 1;

      let defMultiplier = 1;
      if (deflection > 0) {
        const maxDrawDef = T * 0.5; 
        defMultiplier = maxDrawDef / Math.max(deflection, 0.001);
        if (defMultiplier > 40) defMultiplier = 40;
      }

      const getDeflectionAt = (xNorm: number) => {
        if (loadType === 'udl') {
          return 16 * xNorm * (1 - 2 * Math.pow(xNorm, 2) + Math.pow(xNorm, 3)) * (deflection * defMultiplier * 0.25);
        } else {
          if (xNorm <= 0.5) {
            return (3 * xNorm - 4 * Math.pow(xNorm, 3)) * (deflection * defMultiplier * 0.35);
          } else {
            const z = 1 - xNorm;
            return (3 * z - 4 * Math.pow(z, 3)) * (deflection * defMultiplier * 0.35);
          }
        }
      };

      const slices: { x: number, points: any[] }[] = [];

      for (let i = 0; i <= segments; i++) {
        const xNorm = i / segments;
        const curX = xNorm * L;
        const dy = getDeflectionAt(xNorm);

        const p0 = project(curX, 0, 0 - dy, cx, cy, 1, L, W, T);
        const p1 = project(curX, W, 0 - dy, cx, cy, 1, L, W, T);
        const p2 = project(curX, W, T - dy, cx, cy, 1, L, W, T);
        const p3 = project(curX, 0, T - dy, cx, cy, 1, L, W, T);

        slices.push({ x: curX, points: [p0, p1, p2, p3] });
      }

      const drawFace = (quad: any[], fill: string, stroke: string, lineWidth = 1) => {
        ctx.beginPath();
        ctx.moveTo(quad[0].x, quad[0].y);
        ctx.lineTo(quad[1].x, quad[1].y);
        ctx.lineTo(quad[2].x, quad[2].y);
        ctx.lineTo(quad[3].x, quad[3].y);
        ctx.closePath();
        if (!showWireframeOnly) {
          ctx.fillStyle = fill;
          ctx.fill();
        }
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      };

      for (let i = 0; i < segments; i++) {
        const sL = slices[i].points;
        const sR = slices[i + 1].points;

        drawFace([sL[0], sR[0], sR[1], sL[1]], 'rgba(30, 41, 59, 0.3)', 'rgba(71, 85, 105, 0.4)');
        drawFace([sL[0], sL[3], sR[3], sR[0]], 'rgba(10, 132, 255, 0.05)', 'rgba(10, 132, 255, 0.3)');
        drawFace([sL[3], sL[2], sR[2], sR[3]], 'rgba(148, 163, 184, 0.15)', '#0A84FF', 1.5);
        drawFace([sL[1], sR[1], sR[2], sL[2]], 'rgba(10, 132, 255, 0.12)', '#0A84FF', 1.5);
      }

      const supLeft0 = slices[0].points[0];
      const supLeft1 = slices[0].points[1];
      const bottomY = Math.max(supLeft0.y, supLeft1.y) + 15;
      
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#64748B';
      ctx.beginPath();
      ctx.moveTo((supLeft0.x + supLeft1.x)/2, (supLeft0.y + supLeft1.y)/2);
      ctx.lineTo((supLeft0.x + supLeft1.x)/2 - 8, bottomY);
      ctx.lineTo((supLeft0.x + supLeft1.x)/2 + 8, bottomY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      const supRight0 = slices[segments].points[0];
      const supRight1 = slices[segments].points[1];
      const rCenter = { x: (supRight0.x + supRight1.x)/2, y: (supRight0.y + supRight1.y)/2 + 7 };
      ctx.beginPath();
      ctx.arc(rCenter.x, rCenter.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (!showWireframeOnly) {
        ctx.save();
        ctx.lineWidth = 1.8;
        const cover = 3.5;
        const colorRebar = '#34D399';
        
        const drawInternalRebar = (ly: number, lz: number) => {
          ctx.beginPath();
          ctx.strokeStyle = colorRebar;
          for (let i = 0; i <= segments; i++) {
            const xNorm = i / segments;
            const curX = xNorm * L;
            const dy = getDeflectionAt(xNorm);
            const rPt = project(curX, ly, lz - dy, cx, cy, 1, L, W, T);
            if (i === 0) ctx.moveTo(rPt.x, rPt.y);
            else ctx.lineTo(rPt.x, rPt.y);
          }
          ctx.stroke();
        };

        drawInternalRebar(cover, cover);
        drawInternalRebar(W - cover, cover);
        drawInternalRebar(cover, T - cover);
        drawInternalRebar(W - cover, T - cover);

        ctx.restore();
      }

      ctx.save();
      ctx.strokeStyle = '#EF4444';
      ctx.fillStyle = '#EF4444';
      ctx.lineWidth = 1.5;

      if (loadType === 'udl') {
        for (let i = 2; i < segments; i += 3) {
          const xNorm = i / segments;
          const curX = xNorm * L;
          const dy = getDeflectionAt(xNorm);

          const curTopY = (slices[i].points[2].y + slices[i].points[3].y) / 2;
          const curTopX = (slices[i].points[2].x + slices[i].points[3].x) / 2;

          ctx.beginPath();
          ctx.moveTo(curTopX, curTopY - 22);
          ctx.lineTo(curTopX, curTopY - 2);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(curTopX - 3, curTopY - 6);
          ctx.lineTo(curTopX, curTopY - 2);
          ctx.lineTo(curTopX + 3, curTopY - 6);
          ctx.stroke();
        }
        ctx.font = '9px monospace';
        const topMid = slices[Math.floor(segments/2)].points[2];
        ctx.fillText(`UDL: ${inp.load} ${isM ? 'kN/m' : 'klf'}`, topMid.x - 45, topMid.y - 28);
      } else {
        const iMid = Math.floor(segments / 2);
        const topMidY = (slices[iMid].points[2].y + slices[iMid].points[3].y) / 2;
        const topMidX = (slices[iMid].points[2].x + slices[iMid].points[3].x) / 2;

        ctx.beginPath();
        ctx.moveTo(topMidX, topMidY - 32);
        ctx.lineTo(topMidX, topMidY - 3);
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(topMidX - 5, topMidY - 9);
        ctx.lineTo(topMidX, topMidY - 3);
        ctx.lineTo(topMidX + 5, topMidY - 9);
        ctx.stroke();

        ctx.font = 'bold 9px monospace';
        ctx.fillText(`POINT LOAD: ${inp.load} ${isM ? 'kN' : 'kips'}`, topMidX - 50, topMidY - 37);
      }
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = '#22C55E';
      ctx.fillStyle = '#22C55E';
      ctx.font = '9px monospace';
      
      const dL_start = project(0, W + 10, 0, cx, cy, 1, L, W, T);
      const dL_end = project(L, W + 10, 0, cx, cy, 1, L, W, T);
      ctx.beginPath();
      ctx.moveTo(dL_start.x, dL_start.y);
      ctx.lineTo(dL_end.x, dL_end.y);
      ctx.stroke();
      ctx.fillText(`Span L: ${span} ${isM ? 'm' : 'ft'}`, (dL_start.x+dL_end.x)/2 - 35, (dL_start.y+dL_end.y)/2 + 10);

      ctx.restore();
    };

    // ==========================================
    // 2D REINFORCED CONCRETE COLUMN CROSS SECTION
    // ==========================================
    const drawConcreteColumn2D = (ctx: CanvasRenderingContext2D, w: number, h: number, inp: any, out: any) => {
      const cx = w / 2;
      const cy = h / 2 - 10;
      const isM = unitSystem === 'metric';

      const colWidth = Number(inp.width) || 400; 
      const colDepth = Number(inp.depth) || 400; 
      const barCount = Number(inp.barCount) || 4;
      const barDiameter = Number(inp.barDiameter) || 20;
      const clearCover = Number(inp.clearCover) || 40; 

      const maxColDim = Math.max(colWidth, colDepth) || 1;
      const maxBoxSize = Math.min(w, h) * 0.55;
      const scale = maxBoxSize / maxColDim;

      const drawW = colWidth * scale;
      const drawD = colDepth * scale;
      const drawCover = clearCover * scale;

      const left = cx - drawW / 2;
      const top = cy - drawD / 2;

      ctx.save();
      ctx.fillStyle = '#1E293B'; 
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.rect(left, top, drawW, drawD);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#10B981'; 
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(left + drawCover, top + drawCover, drawW - 2 * drawCover, drawD - 2 * drawCover);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(left + drawCover, top + drawCover);
      ctx.lineTo(left + drawCover + 12, top + drawCover + 12);
      ctx.moveTo(left + drawCover, top + drawCover);
      ctx.lineTo(left + drawCover + 4, top + drawCover + 15);
      ctx.stroke();

      const rX_min = left + drawCover;
      const rX_max = left + drawW - drawCover;
      const rY_min = top + drawCover;
      const rY_max = top + drawD - drawCover;

      const rebars: { x: number, y: number }[] = [];

      if (barCount <= 4) {
        rebars.push({ x: rX_min, y: rY_min });
        rebars.push({ x: rX_max, y: rY_min });
        rebars.push({ x: rX_max, y: rY_max });
        rebars.push({ x: rX_min, y: rY_max });
      } else if (barCount === 6) {
        rebars.push({ x: rX_min, y: rY_min });
        rebars.push({ x: rX_max, y: rY_min });
        rebars.push({ x: rX_max, y: rY_max });
        rebars.push({ x: rX_min, y: rY_max });
        if (colWidth >= colDepth) {
          rebars.push({ x: (rX_min + rX_max) / 2, y: rY_min });
          rebars.push({ x: (rX_min + rX_max) / 2, y: rY_max });
        } else {
          rebars.push({ x: rX_min, y: (rY_min + rY_max) / 2 });
          rebars.push({ x: rX_max, y: (rY_min + rY_max) / 2 });
        }
      } else {
        rebars.push({ x: rX_min, y: rY_min });
        rebars.push({ x: rX_max, y: rY_min });
        rebars.push({ x: rX_max, y: rY_max });
        rebars.push({ x: rX_min, y: rY_max });
        rebars.push({ x: (rX_min + rX_max) / 2, y: rY_min });
        rebars.push({ x: (rX_min + rX_max) / 2, y: rY_max });
        rebars.push({ x: rX_min, y: (rY_min + rY_max) / 2 });
        rebars.push({ x: rX_max, y: (rY_min + rY_max) / 2 });
      }

      const radius = Math.max((barDiameter * scale) / 2, 4);
      ctx.fillStyle = '#34D399';
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 1.5;

      rebars.forEach(bar => {
        ctx.beginPath();
        ctx.arc(bar.x, bar.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      ctx.strokeStyle = '#475569';
      ctx.fillStyle = '#94A3B8';
      ctx.font = '8px monospace';
      ctx.lineWidth = 0.5;
      
      ctx.beginPath();
      ctx.moveTo(left, top + drawD / 2);
      ctx.lineTo(left + drawCover, top + drawD / 2);
      ctx.stroke();
      ctx.fillText(`Cover: ${clearCover}${isM ? 'mm' : 'in'}`, left + 2, top + drawD / 2 - 4);

      ctx.save();
      ctx.strokeStyle = '#22C55E';
      ctx.fillStyle = '#22C55E';
      ctx.font = '10px monospace';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(left, top - 15);
      ctx.lineTo(left + drawW, top - 15);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(left, top - 19); ctx.lineTo(left, top - 11);
      ctx.moveTo(left + drawW, top - 19); ctx.lineTo(left + drawW, top - 11);
      ctx.stroke();
      ctx.fillText(`b = ${colWidth} ${isM ? 'mm' : 'in'}`, left + drawW / 2 - 35, top - 20);

      ctx.beginPath();
      ctx.moveTo(left + drawW + 15, top);
      ctx.lineTo(left + drawW + 15, top + drawD);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(left + drawW + 11, top); ctx.lineTo(left + drawW + 19, top);
      ctx.moveTo(left + drawW + 11, top + drawD); ctx.lineTo(left + drawW + 19, top + drawD);
      ctx.stroke();
      ctx.fillText(`h = ${colDepth} ${isM ? 'mm' : 'in'}`, left + drawW + 20, top + drawD / 2 + 3);

      ctx.restore();

      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('CROSS SECTIONAL BLUEPRINT DETAIL', 16, 25);

      if (out && out.factoredCapacityPhiPn) {
        ctx.fillStyle = '#94A3B8';
        ctx.fillText(`Spec Array: Tie Spacing ≤ ${isM ? '300 mm o.c.' : '12 in o.c.'} S350 Rebar`, 16, h - 35);
        ctx.fillStyle = '#22C55E';
        ctx.fillText(`Allowable Compessive Capacity (φPn): ${out.factoredCapacityPhiPn} ${isM ? 'kN' : 'kips'}`, 16, h - 22);
      }
      ctx.restore();
    };

    // ==========================================
    // 2D REINFORCED CONCRETE SLAB ELEVATIONAL SECTION
    // ==========================================
    const drawConcreteSlab2D = (ctx: CanvasRenderingContext2D, w: number, h: number, inp: any, out: any) => {
      const cx = w / 2;
      const cy = h / 2 - 10;
      const isM = unitSystem === 'metric';

      const sLength = Number(inp.length) || Number(inp.span) || 6; 
      const sThick = Number(inp.thickness) || 150; 
      const barSpacing = Number(inp.barSpacing) || 200; 
      const barDia = Number(inp.barDiameter) || 12; 

      const boxW = w - 100;
      const boxH = Math.max(sThick * 0.35, 45); 
      
      const left = cx - boxW / 2;
      const top = cy - boxH / 2;

      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;

      ctx.fillRect(left - 5, top + boxH, 20, 25);
      ctx.strokeRect(left - 5, top + boxH, 20, 25);

      ctx.fillRect(left + boxW - 15, top + boxH, 20, 25);
      ctx.strokeRect(left + boxW - 15, top + boxH, 20, 25);

      ctx.fillStyle = 'rgba(71, 85, 105, 0.25)';
      ctx.strokeStyle = '#0A84FF';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.rect(left, top, boxW, boxH);
      ctx.fill();
      ctx.stroke();

      const cover = Math.max(boxH * 0.18, 8); 
      ctx.strokeStyle = '#34D399'; 
      ctx.lineWidth = Math.min((barDia * 0.25) + 2, 5);
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(left + 8, top + boxH - cover - 8);
      ctx.lineTo(left + 8, top + boxH - cover);
      ctx.lineTo(left + boxW - 8, top + boxH - cover);
      ctx.lineTo(left + boxW - 8, top + boxH - cover - 8);
      ctx.stroke();

      const spacingRepresentational = 35; 
      ctx.fillStyle = '#10B981';
      ctx.strokeStyle = '#047857';
      ctx.lineWidth = 1;

      for (let rx = left + 25; rx < left + boxW - 20; rx += spacingRepresentational) {
        ctx.beginPath();
        ctx.arc(rx, top + boxH - cover - 4, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.save();
      ctx.strokeStyle = '#22C55E';
      ctx.fillStyle = '#22C55E';
      ctx.font = '10px monospace';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(left, top - 15);
      ctx.lineTo(left + boxW, top - 15);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(left, top - 19); ctx.lineTo(left, top - 11);
      ctx.moveTo(left + boxW, top - 19); ctx.lineTo(left + boxW, top - 11);
      ctx.stroke();
      ctx.fillText(`Span L = ${sLength} ${isM ? 'm' : 'ft'}`, left + boxW / 2 - 45, top - 20);

      ctx.beginPath();
      ctx.moveTo(left + boxW + 12, top);
      ctx.lineTo(left + boxW + 12, top + boxH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(left + boxW + 8, top); ctx.lineTo(left + boxW + 16, top);
      ctx.moveTo(left + boxW + 8, top + boxH); ctx.lineTo(left + boxW + 16, top + boxH);
      ctx.stroke();
      ctx.fillText(`t = ${sThick}${isM ? 'mm' : 'in'}`, left + boxW + 18, top + boxH / 2 + 3);

      ctx.restore();

      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('SLAB LONGITUDINAL REINFORCEMENT BLUEPRINT', 16, 25);

      if (out && out.steelAreaProvided) {
        ctx.fillStyle = '#94A3B8';
        ctx.fillText(`Provided Steel Area: As = ${out.steelAreaProvided} ${isM ? 'mm²/m' : 'in²/ft'} (Ø${barDia} @ ${barSpacing} o.c.)`, 16, h - 35);
        ctx.fillStyle = '#22C55E';
        ctx.fillText(`Moment Capacity (φMn): ${out.momentCapacity} ${isM ? 'kN·m/m' : 'kip·ft/ft'}`, 16, h - 22);
      }
    };

    /**
     * 3D SURVEY TRAVERSE PATH RENDER
     */
    const drawSurveyCoordinate3D = (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      inputs: any,
      outputs: any,
      project: typeof project3D
    ) => {
      const cx = w / 2;
      const cy = h / 2 - 20;
      const isM = unitSystem === 'metric';
      
      // Starting Benchmark point
      const pStart = project(0, 0, 0, cx, cy, 1.4, 100, 100, 100);
      
      const de = outputs.deltaEasting || 0;
      const dn = outputs.deltaNorthing || 0;
      const dv = outputs.verticalDistance || 0;
      const dist = inputs.distance || 1.0;
      
      // Vector scale sizing
      const scaleLen = 70;
      const px = (de / dist) * scaleLen;
      const py = (dn / dist) * scaleLen;
      const pz = (dv / dist) * scaleLen;
      
      const pEnd = project(px, py, pz, cx, cy, 1.4, 100, 100, 100);
      
      // Grid lines on ground (datum elevation Z₀ reference)
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
      ctx.lineWidth = 1;
      for (let i = -80; i <= 80; i += 40) {
        // grid X lines
        const g1 = project(i, -80, 0, cx, cy, 1.4, 100, 100, 100);
        const g2 = project(i, 80, 0, cx, cy, 1.4, 100, 100, 100);
        ctx.beginPath();
        ctx.moveTo(g1.x, g1.y);
        ctx.lineTo(g2.x, g2.y);
        ctx.stroke();
        
        // grid Y lines
        const g3 = project(-80, i, 0, cx, cy, 1.4, 100, 100, 100);
        const g4 = project(80, i, 0, cx, cy, 1.4, 100, 100, 100);
        ctx.beginPath();
        ctx.moveTo(g3.x, g3.y);
        ctx.lineTo(g4.x, g4.y);
        ctx.stroke();
      }
      
      // Ground horizontal projection lines
      const pProj = project(px, py, 0, cx, cy, 1.4, 100, 100, 100);
      
      ctx.strokeStyle = '#D97706'; // gold for plan proj
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pStart.x, pStart.y);
      ctx.lineTo(pProj.x, pProj.y);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Vertical height drop (Z shift)
      ctx.strokeStyle = '#2563EB'; // blue for vertical elevation
      ctx.beginPath();
      ctx.moveTo(pProj.x, pProj.y);
      ctx.lineTo(pEnd.x, pEnd.y);
      ctx.stroke();
      
      // Final slope vector line (true path)
      ctx.strokeStyle = '#059669'; // Emerald for actual traverse
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(pStart.x, pStart.y);
      ctx.lineTo(pEnd.x, pEnd.y);
      ctx.stroke();
      
      // Draw Start point bubble
      ctx.beginPath();
      ctx.arc(pStart.x, pStart.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#38BDF8';
      ctx.fill();
      ctx.strokeStyle = '#0284C7';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // Draw end station bubble
      ctx.beginPath();
      ctx.arc(pEnd.x, pEnd.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#34D399';
      ctx.fill();
      ctx.strokeStyle = '#047857';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Text annotations on HUD
      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`BM: (N:${inputs.startNorthing}, E:${inputs.startEasting}, Z:${inputs.startElevation})`, pStart.x + 8, pStart.y - 4);
      
      ctx.fillStyle = '#34D399';
      ctx.fillText(`STN_A: (N:${outputs.endNorthing}, E:${outputs.endEasting}, Z:${outputs.endElevation})`, pEnd.x + 8, pEnd.y - 4);
      
      ctx.fillStyle = '#A7F3D0';
      ctx.fillText(`SLOPE DIST S = ${inputs.distance} ${isM ? 'm' : 'ft'}`, (pStart.x + pEnd.x) / 2 + 10, (pStart.y + pEnd.y) / 2);
    };

    /**
     * 3D STEEL MEMBER CAD WIREFRAME
     */
    const drawSteelSection3D = (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      inputs: any,
      outputs: any,
      project: typeof project3D
    ) => {
      const cx = w / 2;
      const cy = h / 2;
      const shape = inputs.steelShape || 'plate';
      const isM = unitSystem === 'metric';
      const wtUnit = isM ? 'kg' : 'lbs';
      
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      
      const l = 120; // visual segment length
      
      if (shape === 'plate') {
        const wid = 40;
        const thick = 10;
        
        // Define 8 vertices of a rectangular cuboid (the Plate)
        const vertices = [
          [-wid / 2, -l / 2, 0],
          [wid / 2, -l / 2, 0],
          [wid / 2, l / 2, 0],
          [-wid / 2, l / 2, 0],
          [-wid / 2, -l / 2, thick],
          [wid / 2, -l / 2, thick],
          [wid / 2, l / 2, thick],
          [-wid / 2, l / 2, thick]
        ];
        
        const proj = vertices.map(v => project(v[0], v[1], v[2], cx, cy, 1.2, 100, 100, 100));
        
        // Draw solid filling loops
        ctx.beginPath();
        ctx.moveTo(proj[0].x, proj[0].y);
        for (let i = 1; i < 4; i++) ctx.lineTo(proj[i].x, proj[i].y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(proj[4].x, proj[4].y);
        for (let i = 5; i < 8; i++) ctx.lineTo(proj[i].x, proj[i].y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Connecting struts
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(proj[i].x, proj[i].y);
          ctx.lineTo(proj[i+4].x, proj[i+4].y);
          ctx.stroke();
        }
      } else if (shape === 'round') {
        const rad = 25;
        const steps = 12;
        
        const circles = [-l / 2, l / 2];
        const projCircles = circles.map(() => [] as any[]);
        
        for (let c = 0; c < 2; c++) {
          const cyVal = circles[c];
          for (let s = 0; s < steps; s++) {
            const th = (s * Math.PI * 2) / steps;
            const px = rad * Math.cos(th);
            const pz = rad * Math.sin(th);
            projCircles[c].push(project(px, cyVal, pz, cx, cy, 1.2, 100, 100, 100));
          }
        }
        
        // Draw rings
        for (let c = 0; c < 2; c++) {
          ctx.beginPath();
          ctx.moveTo(projCircles[c][0].x, projCircles[c][0].y);
          for (let s = 1; s < steps; s++) {
            ctx.lineTo(projCircles[c][s].x, projCircles[c][s].y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        
        // Connect sides
        for (let s = 0; s < steps; s += 3) {
          ctx.beginPath();
          ctx.moveTo(projCircles[0][s].x, projCircles[0][s].y);
          ctx.lineTo(projCircles[1][s].x, projCircles[1][s].y);
          ctx.stroke();
        }
      } else if (shape === 'pipe') {
        const outerRad = 28;
        const innerRad = 18;
        const steps = 10;
        
        const rings = [-l / 2, l / 2];
        
        rings.forEach(cyVal => {
          const projOuter = [] as any[];
          const projInner = [] as any[];
          
          for (let s = 0; s <= steps; s++) {
            const th = (s * Math.PI * 2) / steps;
            projOuter.push(project(outerRad * Math.cos(th), cyVal, outerRad * Math.sin(th), cx, cy, 1.2, 100, 100, 100));
            projInner.push(project(innerRad * Math.cos(th), cyVal, innerRad * Math.sin(th), cx, cy, 1.2, 100, 100, 100));
          }
          
          // Outer loop
          ctx.beginPath();
          ctx.moveTo(projOuter[0].x, projOuter[0].y);
          for (let s = 1; s <= steps; s++) ctx.lineTo(projOuter[s].x, projOuter[s].y);
          ctx.closePath();
          ctx.stroke();
          
          // Inner loop
          ctx.beginPath();
          ctx.moveTo(projInner[0].x, projInner[0].y);
          for (let s = 1; s <= steps; s++) ctx.lineTo(projInner[s].x, projInner[s].y);
          ctx.closePath();
          ctx.stroke();
        });
        
        // Longitudinal connecting bars on tube sides
        for (let s = 0; s < steps; s += 2) {
          const th = (s * Math.PI * 2) / steps;
          const p1 = project(outerRad * Math.cos(th), -l/2, outerRad * Math.sin(th), cx, cy, 1.2, 100, 100, 100);
          const p2 = project(outerRad * Math.cos(th), l/2, outerRad * Math.sin(th), cx, cy, 1.2, 100, 100, 100);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      } else if (shape === 'hbeam') {
        const bf = 34; // flange width
        const d = 40;  // web depth
        const tf = 5;  // flange thick
        const tw = 3;  // web thick
        
        const makeISlice = (yVal: number) => {
          return [
            [-bf/2, yVal, d/2], [bf/2, yVal, d/2], [bf/2, yVal, d/2 - tf], [tw/2, yVal, d/2 - tf],
            [tw/2, yVal, -d/2 + tf], [bf/2, yVal, -d/2 + tf], [bf/2, yVal, -d/2], [-bf/2, yVal, -d/2],
            [-bf/2, yVal, -d/2 + tf], [-tw/2, yVal, -d/2 + tf], [-tw/2, yVal, d/2 - tf], [-bf/2, yVal, d/2 - tf]
          ];
        };
        
        const frontIS = makeISlice(-l/2).map(v => project(v[0], v[1], v[2], cx, cy, 1.2, 100, 100, 100));
        const backIS = makeISlice(l/2).map(v => project(v[0], v[1], v[2], cx, cy, 1.2, 100, 100, 100));
        
        // Render 2 slice loops
        ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
        [frontIS, backIS].forEach(points => {
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        });
        
        // Connecting edges
        for (let i = 0; i < frontIS.length; i += 2) {
          ctx.beginPath();
          ctx.moveTo(frontIS[i].x, frontIS[i].y);
          ctx.lineTo(backIS[i].x, backIS[i].y);
          ctx.stroke();
        }
      }
      
      // Member HUD labels
      ctx.fillStyle = '#E2E8F0';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`SHAPE PROFILE: ${shape.toUpperCase()}`, 16, 25);
      ctx.fillText(`TOTAL WEIGHT = ${outputs.totalWeight ?? 0} ${wtUnit}`, 16, h - 22);
    };

    /**
     * 3D REBAR MESH BLUEPRINT RECONSTRUCTION
     */
    const drawRebarGrid3D = (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      inputs: any,
      outputs: any,
      project: typeof project3D
    ) => {
      const cx = w / 2;
      const cy = h / 2 - 20;
      const isM = unitSystem === 'metric';
      const wtUnit = isM ? 'kg' : 'lbs';
      
      // Draw standard transparent concrete slab container
      const scX = 110;
      const scY = 110;
      const scZ = 16;
      
      const vertices = [
        [-scX/2, -scY/2, -scZ/2], [scX/2, -scY/2, -scZ/2], [scX/2, scY/2, -scZ/2], [-scX/2, scY/2, -scZ/2],
        [-scX/2, -scY/2, scZ/2], [scX/2, -scY/2, scZ/2], [scX/2, scY/2, scZ/2], [-scX/2, scY/2, scZ/2]
      ];
      
      const proj = vertices.map(v => project(v[0], v[1], v[2], cx, cy, 1.25, 100, 100, 100));
      
      // Fill bottom slab shell
      ctx.fillStyle = 'rgba(100,116,139, 0.08)';
      ctx.strokeStyle = 'rgba(148,163,184, 0.25)';
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      ctx.moveTo(proj[0].x, proj[0].y);
      for (let i = 1; i < 4; i++) ctx.lineTo(proj[i].x, proj[i].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Draw top concrete slab face
      ctx.beginPath();
      ctx.moveTo(proj[4].x, proj[4].y);
      for (let i = 5; i < 8; i++) ctx.lineTo(proj[i].x, proj[i].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Connect vertical edges representing corners
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(proj[i].x, proj[i].y);
        ctx.lineTo(proj[i+4].x, proj[i+4].y);
        ctx.stroke();
      }
      
      // DRAW REBAR WIRE GRID LAYERS INSIDE SLAB BOUNDS
      ctx.strokeStyle = '#EF4444'; // Red rebar bars
      ctx.lineWidth = 2.5;
      
      const barsL = Math.min(22, outputs.barsAlongLengthCount || 5);
      const barsW = Math.min(22, outputs.barsAlongWidthCount || 5);
      
      const coverLim = 8; // scaled cover boundary
      const gridLimX = scX / 2 - coverLim;
      const gridLimY = scY / 2 - coverLim;
      
      // longitudinal bars
      for (let i = 0; i < barsL; i++) {
        const factor = barsL > 1 ? (i / (barsL - 1)) : 0.5;
        const px = -gridLimX + 2*gridLimX * factor;
        
        const p1 = project(px, -gridLimY, -1, cx, cy, 1.25, 100, 100, 100);
        const p2 = project(px, gridLimY, -1, cx, cy, 1.25, 100, 100, 100);
        
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      
      // transverse bars
      ctx.strokeStyle = '#F59E0B'; // Gold cross-bars
      for (let i = 0; i < barsW; i++) {
        const factor = barsW > 1 ? (i / (barsW - 1)) : 0.5;
        const py = -gridLimY + 2*gridLimY * factor;
        
        const p1 = project(-gridLimX, py, 1, cx, cy, 1.25, 100, 100, 100);
        const p2 = project(gridLimX, py, 1, cx, cy, 1.25, 100, 100, 100);
        
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      
      // Legend and annotations
      ctx.fillStyle = '#EF4444';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`LONGITUDINAL: L-Bars Count = ${outputs.barsAlongLengthCount} bars`, 16, 25);
      ctx.fillStyle = '#F59E0B';
      ctx.fillText(`TRANSVERSE: W-Bars Count = ${outputs.barsAlongWidthCount} bars`, 16, 38);
      
      ctx.fillStyle = '#10B981';
      ctx.fillText(`TOTAL REBAR MASS = ${outputs.totalWeight ?? 0} ${wtUnit}`, 16, h - 22);
    };

    /**
     * 3D RUNNING BOND BRICK WALL SPECIMEN CONSTRUCION
     */
    const drawBrickWall3D = (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      inputs: any,
      outputs: any,
      project: typeof project3D
    ) => {
      const cx = w / 2;
      const cy = h / 2 + 10;
      
      ctx.strokeStyle = '#7C2D12'; // deep mortar brick edge
      ctx.lineWidth = 1;
      
      const rows = 10; // visual layers of bricks
      const cols = 5;  // count along wall
      
      const bw = 24;  // visual brick width
      const bh = 7;   // visual brick height
      const bd = 12;  // visual brick depth
      
      const startX = -((cols * bw) / 2);
      const startZ = -((rows * bh) / 2);
      
      for (let r = 0; r < rows; r++) {
        const bz = startZ + r * bh;
        const offset = (r % 2 === 0) ? 0 : bw / 2;
        
        for (let c = 0; c <= cols; c++) {
          const bx = startX + c * bw - offset;
          
          const makeBrickVertices = () => {
            return [
              [bx, 0, bz], [bx + bw - 1, 0, bz], [bx + bw - 1, bd, bz], [bx, bd, bz],
              [bx, 0, bz + bh - 1], [bx + bw - 1, 0, bz + bh - 1], [bx + bw - 1, bd, bz + bh - 1], [bx, bd, bz + bh - 1]
            ];
          };
          
          const proj = makeBrickVertices().map(v => project(v[0], v[1], v[2], cx, cy, 1.22, 100, 100, 100));
          
          ctx.fillStyle = (r % 2 === 1) ? '#C2410C' : '#EA580C'; // beautiful red-orange bricks
          
          // Front face drawing
          ctx.beginPath();
          ctx.moveTo(proj[0].x, proj[0].y);
          ctx.lineTo(proj[1].x, proj[1].y);
          ctx.lineTo(proj[5].x, proj[5].y);
          ctx.lineTo(proj[4].x, proj[4].y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          
          // Top face drawing
          ctx.beginPath();
          ctx.moveTo(proj[4].x, proj[4].y);
          ctx.lineTo(proj[5].x, proj[5].y);
          ctx.lineTo(proj[6].x, proj[6].y);
          ctx.lineTo(proj[7].x, proj[7].y);
          ctx.closePath();
          ctx.fillStyle = '#F97316';
          ctx.fill();
          ctx.stroke();
        }
      }
      
      // HUD layout overlays
      ctx.fillStyle = '#E2E8F0';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`BRICK QUANTITY MODEL: RUNNING BOND`, 16, 25);
      ctx.fillText(`REQUIRED BRICKS = ${outputs.totalBricksWithWaste ?? 0} units`, 16, h - 35);
      ctx.fillText(`CEMENT REQUIRED = ${outputs.cementBagsRequired ?? 0} bags`, 16, h - 22);
    };

    // Blueprint Truss Watermark when no calculator is selected
    const drawLogoWatermark2D = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 1.5;
      
      const cx = w / 2;
      const cy = h / 2;

      ctx.beginPath();
      ctx.moveTo(cx - 80, cy + 40);
      ctx.lineTo(cx, cy - 60);
      ctx.lineTo(cx + 80, cy + 40);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx - 80, cy + 40);
      ctx.lineTo(cx + 80, cy + 40);
      ctx.lineTo(cx, cy - 10);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx, cy - 60);
      ctx.lineTo(cx, cy + 40);
      ctx.stroke();

      ctx.fillStyle = '#475569';
      ctx.font = 'italic 10px monospace';
      const defaultText = 'SELECT CALCULATOR TO RE-INITIALIZE SIMULATIONS';
      ctx.fillText(defaultText, cx - ctx.measureText(defaultText).width / 2, cy + 75);
    };

    draw();
  }, [calculatorId, inputs, outputs, unitSystem, beamTab, yaw, pitch, zoom, showWireframeOnly, viewMode]);

  const isStructural = ['structural-beam', 'structural-deflection', 'structural-column', 'structural-slab'].includes(calculatorId);

  const has3DSupport = (
    ['concrete-volume', 'geotech-bearing', 'geotech-retaining'].includes(calculatorId) ||
    (isStructural && viewMode === '3d')
  );

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[320px] md:h-full min-h-[260px] backdrop-blur-xl bg-surface-1/70 dark:bg-surface-2/80 border border-border-subtle rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between"
    >
      {/* VISUAL ENGINE STATE HUB */}
      <div className="absolute top-3 right-4 flex items-center space-x-1.5 bg-surface-1/90 dark:bg-surface-2/90 px-2.5 py-1.5 rounded-lg border border-border-subtle backdrop-blur-md z-10 shadow-xs">
        <span className="w-1.5 h-1.5 bg-brand rounded-full mr-0.5"></span>
        <span className="text-[9px] font-mono font-bold text-brand dark:text-brand-light uppercase tracking-wider">
          {has3DSupport ? '3D MODEL READY' : 'CAD VIEW READY'}
        </span>
      </div>

      {/* OVERLAY ACTIONS BAR (HUD CAMERA PLATFORM) */}
      {has3DSupport && (
        <div className="absolute bottom-3 right-4 flex items-center space-x-1 bg-surface-1/95 dark:bg-surface-2/95 p-1 rounded-xl border border-border-subtle backdrop-blur-md z-10 shadow-xs">
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            title={autoRotate ? 'Stop Automated Orbit' : 'Automated 3D Orbit Spin'}
            className={`p-1.5 rounded-lg hover:bg-surface-2 dark:hover:bg-surface-3 transition-colors cursor-pointer text-xs ${autoRotate ? 'text-white bg-brand' : 'text-ink-muted'}`}
          >
            {autoRotate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom Camera In"
            className="p-1.5 rounded-lg hover:bg-surface-2 dark:hover:bg-surface-3 transition-colors text-ink-muted hover:text-ink dark:hover:text-ink-dark cursor-pointer text-xs"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Camera Out"
            className="p-1.5 rounded-lg hover:bg-surface-2 dark:hover:bg-surface-3 transition-colors text-ink-muted hover:text-ink dark:hover:text-ink-dark cursor-pointer text-xs"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowWireframeOnly(!showWireframeOnly)}
            title="Toggle Wireframe Blueprint Mode"
            className={`p-1.5 rounded-lg hover:bg-surface-2 dark:hover:bg-surface-3 transition-colors cursor-pointer text-xs ${showWireframeOnly ? 'text-white bg-brand' : 'text-ink-muted'}`}
          >
            <Compass className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-border-subtle mx-1"></div>

          <button
            type="button"
            onClick={handleResetCamera}
            title="Reset Camera Angle"
            className="p-1.5 rounded-lg hover:bg-surface-2 dark:hover:bg-surface-3 transition-colors text-ink-muted hover:text-ink dark:hover:text-ink-dark cursor-pointer text-xs"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2D / 3D VIEW SELECTOR */}
      <div className="absolute top-3 left-4 flex flex-col space-y-1.5 z-10 text-left">
        <div className="flex space-x-1 bg-surface-1/95 dark:bg-surface-2/95 p-0.5 rounded-xl border border-border-subtle backdrop-blur-md shadow-xs">
          <button
            type="button"
            onClick={() => setViewMode('2d')}
            className={`px-3 py-1 text-[10px] font-bold font-mono uppercase rounded-lg transition-all cursor-pointer ${viewMode === '2d' ? 'bg-brand text-white shadow-xs' : 'text-ink-muted hover:text-ink'}`}
          >
            2D
          </button>
          <button
            type="button"
            onClick={() => setViewMode('3d')}
            className={`px-3 py-1 text-[10px] font-bold font-mono uppercase rounded-lg transition-all cursor-pointer ${viewMode === '3d' ? 'bg-brand text-white shadow-xs' : 'text-ink-muted hover:text-ink'}`}
          >
            3D
          </button>
        </div>

        {/* SECONDARY BEAM LEVEL DIAGRAM TABS FOR 2D ANALYSIS */}
        {viewMode === '2d' && (calculatorId === 'structural-beam' || calculatorId === 'structural-deflection') && (
          <div className="flex space-x-0.5 bg-surface-1/90 dark:bg-surface-2/90 p-0.5 rounded-md border border-border-subtle w-fit">
            <button
              type="button"
              onClick={() => setBeamTab('profile')}
              className={`px-1.5 py-0.5 text-[8px] font-semibold font-mono uppercase rounded-sm transition-all cursor-pointer ${beamTab === 'profile' ? 'bg-brand text-white' : 'text-ink-muted hover:text-ink'}`}
            >
              Deflection
            </button>
            <button
              type="button"
              onClick={() => setBeamTab('sfd')}
              className={`px-1.5 py-0.5 text-[8px] font-semibold font-mono uppercase rounded-sm transition-all cursor-pointer ${beamTab === 'sfd' ? 'bg-[#B56F50]/20 text-[#B56F50]' : 'text-ink-muted hover:text-ink'}`}
            >
              SFD
            </button>
            <button
              type="button"
              onClick={() => setBeamTab('bmd')}
              className={`px-1.5 py-0.5 text-[8px] font-semibold font-mono uppercase rounded-sm transition-all cursor-pointer ${beamTab === 'bmd' ? 'bg-brand/20 text-brand' : 'text-ink-muted hover:text-ink'}`}
            >
              BMD
            </button>
          </div>
        )}
      </div>

      {/* DETAILED INTERACTIVE DRAG ADVICE TO USER */}
      {has3DSupport && (
        <div className="absolute top-10 left-4 pointer-events-none opacity-50 hover:opacity-100 transition-opacity">
          <div className="flex items-start space-x-1.5 text-slate-550 max-w-[200px]">
            <HelpCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-500" />
            <p className="text-[8px] font-mono leading-tight">
              DRAG OR SCROLL TO ROTATE / HOVER OR PINCH ON MOBILE TO CHIP SPECIMENS.
            </p>
          </div>
        </div>
      )}

      {/* LOWER RENDERING CORE */}
      <canvas 
        ref={canvasRef} 
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="w-full h-full cursor-grab active:cursor-grabbing outline-none" 
      />
    </div>
  );
}
