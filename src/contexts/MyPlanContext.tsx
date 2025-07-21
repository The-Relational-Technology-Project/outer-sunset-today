import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface PlanEvent {
  id: string;
  title: string;
  time: string;
  location: string;
  description: string;
  category: string;
  date?: string;
  isToday?: boolean;
  notes?: string;
}

interface MyPlanContextType {
  planEvents: PlanEvent[];
  addToPlan: (event: PlanEvent) => void;
  removeFromPlan: (eventId: string) => void;
  updateEventNotes: (eventId: string, notes: string) => void;
  clearPlan: () => void;
  isInPlan: (eventId: string) => boolean;
}

const MyPlanContext = createContext<MyPlanContextType | undefined>(undefined);

export const useMyPlan = () => {
  const context = useContext(MyPlanContext);
  if (!context) {
    throw new Error('useMyPlan must be used within a MyPlanProvider');
  }
  return context;
};

interface MyPlanProviderProps {
  children: ReactNode;
}

export const MyPlanProvider: React.FC<MyPlanProviderProps> = ({ children }) => {
  const [planEvents, setPlanEvents] = useState<PlanEvent[]>([]);

  const addToPlan = (event: PlanEvent) => {
    setPlanEvents(prev => {
      if (prev.some(e => e.id === event.id)) return prev;
      return [...prev, { ...event, notes: '' }];
    });
  };

  const removeFromPlan = (eventId: string) => {
    setPlanEvents(prev => prev.filter(event => event.id !== eventId));
  };

  const updateEventNotes = (eventId: string, notes: string) => {
    setPlanEvents(prev => 
      prev.map(event => 
        event.id === eventId ? { ...event, notes } : event
      )
    );
  };

  const clearPlan = () => {
    setPlanEvents([]);
  };

  const isInPlan = (eventId: string) => {
    return planEvents.some(event => event.id === eventId);
  };

  return (
    <MyPlanContext.Provider value={{
      planEvents,
      addToPlan,
      removeFromPlan,
      updateEventNotes,
      clearPlan,
      isInPlan
    }}>
      {children}
    </MyPlanContext.Provider>
  );
};