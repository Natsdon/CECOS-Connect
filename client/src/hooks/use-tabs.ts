import { useState, useCallback } from 'react';

export interface Tab {
  id: string;
  title: string;
  icon: string;
  component: React.ComponentType<any>;
  props?: any;
  closable?: boolean;
}

export function useTabs() {
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'fas fa-tachometer-alt',
      component: () => null, // Will be set later
      closable: false
    }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('dashboard');

  const openTab = useCallback((tab: Omit<Tab, 'closable'>) => {
    const newTab = { ...tab, closable: true };
    setTabs(prevTabs => {
      const existingTab = prevTabs.find(t => t.id === tab.id);
      if (existingTab) {
        setActiveTabId(tab.id);
        return prevTabs;
      }
      return [...prevTabs, newTab];
    });
    setActiveTabId(tab.id);
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setTabs(prevTabs => {
      const newTabs = prevTabs.filter(tab => tab.id !== tabId);
      if (activeTabId === tabId && newTabs.length > 0) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      }
      return newTabs;
    });
  }, [activeTabId]);

  const switchTab = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  const closeAllTabs = useCallback(() => {
    setTabs(prevTabs => prevTabs.filter(tab => !tab.closable));
    setActiveTabId('dashboard');
  }, []);

  const getActiveTab = useCallback(() => {
    return tabs.find(tab => tab.id === activeTabId);
  }, [tabs, activeTabId]);

  return {
    tabs,
    activeTabId,
    openTab,
    closeTab,
    switchTab,
    closeAllTabs,
    getActiveTab
  };
}
