import { GraduationCap, User, LogOut, Gauge, Users, CalendarCheck, ClipboardList, TrendingUp, UserPlus, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTabs } from '@/hooks/use-tabs';
import Dashboard from '@/pages/Dashboard';
import StudentManagement from '@/pages/StudentManagement';
import AttendanceTracking from '@/pages/AttendanceTracking';
import ExamManagement from '@/pages/ExamManagement';
import GradeManagement from '@/pages/GradeManagement';
import Admissions from '@/pages/Admissions';
import UserPrivileges from '@/pages/UserPrivileges';

interface SidebarProps {
  openTab: (tab: any) => void;
  activeTabId: string;
}

export function Sidebar({ openTab, activeTabId }: SidebarProps) {
  const { user, logout } = useAuth();

  const menuItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: Gauge,
      component: Dashboard,
      roles: ['student', 'faculty', 'admin', 'epr_admin']
    },
    {
      id: 'students',
      title: 'Student Management',
      icon: Users,
      component: StudentManagement,
      roles: ['faculty', 'admin', 'epr_admin']
    },
    {
      id: 'attendance',
      title: 'Attendance Tracking',
      icon: CalendarCheck,
      component: AttendanceTracking,
      roles: ['faculty', 'admin', 'epr_admin']
    },
    {
      id: 'exams',
      title: 'Exam Management',
      icon: ClipboardList,
      component: ExamManagement,
      roles: ['faculty', 'admin', 'epr_admin']
    },
    {
      id: 'grades',
      title: 'Grade Management',
      icon: TrendingUp,
      component: GradeManagement,
      roles: ['faculty', 'admin', 'epr_admin']
    },
    {
      id: 'admissions',
      title: 'Admissions',
      icon: UserPlus,
      component: Admissions,
      roles: ['admin', 'epr_admin']
    },
    {
      id: 'privileges',
      title: 'User Privileges',
      icon: Shield,
      component: UserPrivileges,
      roles: ['epr_admin']
    }
  ];

  const handleOpenTab = (item: any) => {
    if (item.id === 'dashboard') return;
    
    openTab({
      id: item.id,
      title: item.title,
      icon: getIconClass(item.icon),
      component: item.component
    });
  };

  const getIconClass = (IconComponent: any): string => {
    const iconMap: { [key: string]: string } = {
      [Gauge.name]: 'fas fa-tachometer-alt',
      [Users.name]: 'fas fa-users',
      [CalendarCheck.name]: 'fas fa-calendar-check',
      [ClipboardList.name]: 'fas fa-clipboard-list',
      [TrendingUp.name]: 'fas fa-chart-line',
      [UserPlus.name]: 'fas fa-user-plus',
      [Shield.name]: 'fas fa-shield-alt'
    };
    return iconMap[IconComponent.name] || 'fas fa-circle';
  };

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role || '')
  );

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-burgundy-500 rounded-lg flex items-center justify-center">
            <GraduationCap className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">CECOS SIS</h1>
            <p className="text-xs text-gray-500">Learning Management</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-burgundy-100 rounded-full flex items-center justify-center">
            <User className="text-burgundy-600" size={16} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-1">
        {filteredMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleOpenTab(item)}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
              activeTabId === item.id
                ? 'bg-burgundy-50 text-burgundy-700 border border-burgundy-200'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <item.icon size={16} />
            <span className="text-sm font-medium">{item.title}</span>
          </button>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4">
        <Button
          onClick={logout}
          variant="ghost"
          className="w-full justify-start text-gray-700 hover:bg-gray-100"
        >
          <LogOut size={16} className="mr-2" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}
