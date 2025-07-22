import { Sidebar } from './Sidebar';
import { TabBar } from './TabBar';
import { useTabs } from '@/hooks/use-tabs';
import Dashboard from '@/pages/Dashboard';
import StudentProfile from '@/pages/StudentProfile';

export function Layout() {
  const { tabs, activeTabId, openTab, closeTab, switchTab, closeAllTabs, getActiveTab } = useTabs();

  // Make openTab available globally for child components
  (window as any).openTab = openTab;

  const componentRegistry = {
    StudentProfile,
  };

  const renderActiveTabContent = () => {
    const activeTab = getActiveTab();
    if (!activeTab) return <div>No tab selected</div>;
    
    if (activeTab.id === 'dashboard') {
      return <Dashboard />;
    }
    
    // Handle component by name (string) or direct component reference
    let Component;
    if (typeof activeTab.component === 'string') {
      Component = componentRegistry[activeTab.component as keyof typeof componentRegistry];
    } else {
      Component = activeTab.component;
    }
    
    if (!Component) {
      return <div>Component not found</div>;
    }
    
    return <Component {...(activeTab.props || {})} />;
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar openTab={openTab} activeTabId={activeTabId} />
      
      <div className="flex-1 flex flex-col">
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onSwitchTab={switchTab}
          onCloseTab={closeTab}
          onCloseAllTabs={closeAllTabs}
        />
        
        <div className="flex-1 overflow-auto">
          {renderActiveTabContent()}
        </div>
      </div>
    </div>
  );
}
