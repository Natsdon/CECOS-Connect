import { X, Minus, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTabs, Tab } from '@/hooks/use-tabs';

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string;
  onSwitchTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onCloseAllTabs: () => void;
}

export function TabBar({ tabs, activeTabId, onSwitchTab, onCloseTab, onCloseAllTabs }: TabBarProps) {
  return (
    <div className="bg-white border-b border-gray-200 flex items-center px-4">
      <div className="flex-1 flex items-center space-x-1 py-2 overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center rounded-t-lg px-4 py-2 max-w-xs cursor-pointer transition-colors ${
              tab.id === activeTabId
                ? 'bg-gray-50 border border-gray-200 border-b-white'
                : 'border-b border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => onSwitchTab(tab.id)}
          >
            <i className={`${tab.icon} text-sm mr-2 ${
              tab.id === activeTabId ? 'text-burgundy-600' : 'text-gray-500'
            }`}></i>
            <span className={`text-sm truncate ${
              tab.id === activeTabId ? 'font-medium text-gray-900' : 'text-gray-600'
            }`}>
              {tab.title}
            </span>
            {tab.closable && (
              <button
                className="ml-2 text-gray-400 hover:text-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCloseAllTabs}
          className="p-2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
