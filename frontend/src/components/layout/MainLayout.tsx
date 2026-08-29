import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';

interface MainLayoutProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ currentPage, onNavigate, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div className="app-container">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Navbar 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          currentPage={currentPage}
          onNavigate={onNavigate}
        />
        <main className="page-body">{children}</main>
      </div>
      
      {/* Mobile Overlay for Sidebar */}
      {sidebarOpen && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 35, padding: 0 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <BottomNav currentPage={currentPage} onNavigate={onNavigate} />
    </div>
  );
};
