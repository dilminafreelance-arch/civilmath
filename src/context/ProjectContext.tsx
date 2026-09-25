import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export interface ProjectItemMetrics {
  concreteM3?: number;
  steelKg?: number;
  bricksCount?: number;
  dryMortarM3?: number;
  cost?: number;
}

export interface ProjectItem {
  id: string;
  calculatorId: string;
  title: string;
  category: string;
  quantity: number;
  unitSystem: 'metric' | 'imperial';
  metrics: ProjectItemMetrics;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  clientName?: string;
  engineerName?: string;
  location?: string;
  createdAt: string;
  items: ProjectItem[];
}

interface ProjectContextType {
  project: Project;
  addItemToProject: (item: Omit<ProjectItem, 'id' | 'createdAt'>) => void;
  removeItemFromProject: (id: string) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  updateProjectDetails: (details: Partial<Pick<Project, 'name' | 'clientName' | 'engineerName' | 'location'>>) => void;
  clearProject: () => void;
  isBOQDrawerOpen: boolean;
  setIsBOQDrawerOpen: (open: boolean) => void;
  toggleBOQDrawer: () => void;
  totals: {
    totalConcreteM3: number;
    totalSteelKg: number;
    totalBricks: number;
    totalCost: number;
    itemCount: number;
  };
}

const STORAGE_KEY = 'civilmath_active_project';

const DEFAULT_PROJECT: Project = {
  id: 'project-default',
  name: 'General Structural Project',
  clientName: 'Client Project',
  engineerName: 'Site Engineer',
  location: 'Site 1',
  createdAt: new Date().toISOString(),
  items: []
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [project, setProject] = useState<Project>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load project from localStorage', e);
    }
    return DEFAULT_PROJECT;
  });

  const [isBOQDrawerOpen, setIsBOQDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } catch (e) {
      console.error('Failed to save project to localStorage', e);
    }
  }, [project]);

  const addItemToProject = useCallback((item: Omit<ProjectItem, 'id' | 'createdAt'>) => {
    const newItem: ProjectItem = {
      ...item,
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      createdAt: new Date().toISOString()
    };
    setProject(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  }, []);

  const removeItemFromProject = useCallback((id: string) => {
    setProject(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== id)
    }));
  }, []);

  const updateItemQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromProject(id);
      return;
    }
    setProject(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === id ? { ...i, quantity } : i)
    }));
  }, [removeItemFromProject]);

  const updateProjectDetails = useCallback((details: Partial<Pick<Project, 'name' | 'clientName' | 'engineerName' | 'location'>>) => {
    setProject(prev => ({
      ...prev,
      ...details
    }));
  }, []);

  const clearProject = useCallback(() => {
    setProject({
      ...DEFAULT_PROJECT,
      id: 'project_' + Date.now(),
      createdAt: new Date().toISOString(),
      items: []
    });
  }, []);

  const toggleBOQDrawer = useCallback(() => {
    setIsBOQDrawerOpen(prev => !prev);
  }, []);

  const totals = useMemo(() => {
    let totalConcreteM3 = 0;
    let totalSteelKg = 0;
    let totalBricks = 0;
    let totalCost = 0;

    project.items.forEach(item => {
      const q = item.quantity || 1;
      if (item.metrics.concreteM3) {
        totalConcreteM3 += item.metrics.concreteM3 * q;
      }
      if (item.metrics.steelKg) {
        totalSteelKg += item.metrics.steelKg * q;
      }
      if (item.metrics.bricksCount) {
        totalBricks += item.metrics.bricksCount * q;
      }
      if (item.metrics.cost) {
        totalCost += item.metrics.cost * q;
      }
    });

    return {
      totalConcreteM3: parseFloat(totalConcreteM3.toFixed(2)),
      totalSteelKg: parseFloat(totalSteelKg.toFixed(1)),
      totalBricks: Math.round(totalBricks),
      totalCost: parseFloat(totalCost.toFixed(2)),
      itemCount: project.items.length
    };
  }, [project.items]);

  const value = useMemo(() => ({
    project,
    addItemToProject,
    removeItemFromProject,
    updateItemQuantity,
    updateProjectDetails,
    clearProject,
    isBOQDrawerOpen,
    setIsBOQDrawerOpen,
    toggleBOQDrawer,
    totals
  }), [project, addItemToProject, removeItemFromProject, updateItemQuantity, updateProjectDetails, clearProject, isBOQDrawerOpen, toggleBOQDrawer, totals]);

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
