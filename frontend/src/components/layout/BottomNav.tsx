import React from 'react';
import { Home, Users, CheckSquare, MapPin, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentPage, onNavigate }) => {
  const { hasPermission } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home, isAllowed: true },
    { id: 'employees', label: 'Employees', icon: Users, isAllowed: hasPermission('employees', 'view') },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, isAllowed: hasPermission('tasks', 'view') },
    { id: 'attendance', label: 'Attendance', icon: MapPin, isAllowed: hasPermission('attendance', 'view') },
    { id: 'reports', label: 'More', icon: MoreHorizontal, isAllowed: true }, // Using reports/menu for "More"
  ];

  const visibleItems = navItems.filter((item) => item.isAllowed).slice(0, 5); // Max 5 items for mobile bottom nav

  return (
    <nav className="bottom-nav-bar">
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPage === item.id;
        
        return (
          <button
            key={item.id}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <Icon size={24} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
