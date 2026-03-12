import React, { createContext, useContext, useState, useCallback } from 'react';

const TabNavigationContext = createContext();

export const TabNavigationProvider = ({ children }) => {
  const [tabStacks, setTabStacks] = useState({
    home: ['/Home'],
    search: ['/Listings'],
    messages: ['/Messages'],
    profile: ['/Profile'],
  });
  const [activeTab, setActiveTab] = useState('home');

  const pushToTab = useCallback((tab, path) => {
    setTabStacks(prev => ({
      ...prev,
      [tab]: [...(prev[tab] || [path]), path],
    }));
    setActiveTab(tab);
  }, []);

  const popFromTab = useCallback((tab) => {
    setTabStacks(prev => {
      const stack = prev[tab] || ['/Home'];
      return {
        ...prev,
        [tab]: stack.length > 1 ? stack.slice(0, -1) : stack,
      };
    });
  }, []);

  const switchTab = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const getTabHistory = useCallback((tab) => {
    return tabStacks[tab] || [];
  }, [tabStacks]);

  return (
    <TabNavigationContext.Provider value={{
      activeTab,
      tabStacks,
      pushToTab,
      popFromTab,
      switchTab,
      getTabHistory,
    }}>
      {children}
    </TabNavigationContext.Provider>
  );
};

export const useTabNavigation = () => {
  const context = useContext(TabNavigationContext);
  if (!context) {
    throw new Error('useTabNavigation must be used within TabNavigationProvider');
  }
  return context;
};