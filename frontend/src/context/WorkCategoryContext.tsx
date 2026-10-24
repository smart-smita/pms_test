import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../services/api';

export type WorkCategoryType = 'material' | 'labour' | 'both';

interface WorkCategoryContextType {
  workCategory: WorkCategoryType;
  isMaterialEnabled: boolean;
  isLabourEnabled: boolean;
  isLoading: boolean;
  refreshWorkCategory: () => Promise<void>;
  updateWorkCategory: (category: WorkCategoryType) => Promise<{ success: boolean; message?: string }>;
}

const WorkCategoryContext = createContext<WorkCategoryContextType | undefined>(undefined);

export const WorkCategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workCategory, setWorkCategoryState] = useState<WorkCategoryType>(() => {
    const saved = localStorage.getItem('global_work_category');
    if (saved === 'material' || saved === 'labour' || saved === 'both') {
      return saved;
    }
    return 'both';
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshWorkCategory = useCallback(async () => {
    try {
      const res = await apiRequest<{ work_category: WorkCategoryType }>('/settings/work-category');
      if (res.success && res.data?.work_category) {
        const cat = res.data.work_category;
        setWorkCategoryState(cat);
        localStorage.setItem('global_work_category', cat);
      }
    } catch (e) {
      console.error('Failed to load work category setting:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshWorkCategory();
  }, [refreshWorkCategory]);

  const updateWorkCategory = async (category: WorkCategoryType): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await apiRequest<{ work_category: WorkCategoryType }>('/settings/work-category', {
        method: 'PUT',
        body: JSON.stringify({ work_category: category }),
      });
      if (res.success) {
        setWorkCategoryState(category);
        localStorage.setItem('global_work_category', category);
        return { success: true, message: res.message || 'Work category settings updated successfully.' };
      }
      return { success: false, message: res.message || 'Failed to update work category.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'An unexpected error occurred.' };
    }
  };

  const isMaterialEnabled = workCategory === 'material' || workCategory === 'both';
  const isLabourEnabled = workCategory === 'labour' || workCategory === 'both';

  return (
    <WorkCategoryContext.Provider
      value={{
        workCategory,
        isMaterialEnabled,
        isLabourEnabled,
        isLoading,
        refreshWorkCategory,
        updateWorkCategory,
      }}
    >
      {children}
    </WorkCategoryContext.Provider>
  );
};

export const useWorkCategory = () => {
  const context = useContext(WorkCategoryContext);
  if (!context) {
    throw new Error('useWorkCategory must be used within WorkCategoryProvider');
  }
  return context;
};
