import { Sidebar } from './Sidebar';
import { TabBar } from './TabBar';
import { useTabs } from '@/hooks/use-tabs';
import Dashboard from '@/pages/Dashboard';

export function Layout() {
  const { tabs, activeTabId, openTab, closeTab, switchTab, closeAllTabs, getActiveTab } = useTabs();

  const renderActiveTabContent = () => {
    const activeTab = getActiveTab();
    if (!activeTab) return <div>No tab selected</div>;
    
    if (activeTab.id === 'dashboard') {
      return <Dashboard />;
    }
    
    const Component = activeTab.component;
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
