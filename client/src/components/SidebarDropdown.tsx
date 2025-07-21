import { useState, useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

interface DropdownOption {
  id: string;
  title: string;
  component: any;
}

interface SidebarDropdownProps {
  title: string;
  icon: any;
  options: DropdownOption[];
  openTab: (tab: any) => void;
  activeTabId: string;
  isActive: boolean;
}

export function SidebarDropdown({ 
  title, 
  icon: IconComponent, 
  options, 
  openTab, 
  activeTabId,
  isActive 
}: SidebarDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOptionClick = (option: DropdownOption) => {
    openTab({
      id: option.id,
      title: option.title,
      icon: 'fas fa-users',
      component: option.component
    });
    setIsOpen(false);
  };

  const getDropdownPosition = () => {
    if (!buttonRef.current) return { top: 0, left: 0 };
    
    const rect = buttonRef.current.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.right + 8
    };
  };

  const position = getDropdownPosition();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors group ${
          isActive
            ? 'bg-burgundy-50 text-burgundy-700 border border-burgundy-200'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <IconComponent size={16} />
        <span className="text-sm font-medium flex-1">{title}</span>
        <ChevronRight 
          size={14} 
          className={`transition-transform ${isOpen ? 'rotate-90' : ''} ${
            isActive ? 'text-burgundy-500' : 'text-gray-400'
          }`} 
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          {/* Dropdown Menu */}
          <div
            className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-48"
            style={{
              top: position.top,
              left: position.left
            }}
          >
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleOptionClick(option)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                  activeTabId === option.id
                    ? 'bg-burgundy-50 text-burgundy-700'
                    : 'text-gray-700'
                }`}
              >
                {option.title}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}