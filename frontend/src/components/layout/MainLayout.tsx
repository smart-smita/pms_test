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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div className={`app-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isCollapsed={sidebarCollapsed} />
      <div className="main-content" style={{ marginLeft: sidebarCollapsed ? '80px' : '265px', transition: 'margin-left 0.3s ease' }}>
        <Navbar 
          onToggleSidebar={() => {
            if (window.innerWidth < 1024) setSidebarOpen(!sidebarOpen);
            else setSidebarCollapsed(!sidebarCollapsed);
          }} 
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          currentPage={currentPage}
          onNavigate={onNavigate}
        />
        <main className="page-body">{children}</main>
      </div>
      
      {/* Sidebar overlay (tablet/mobile) */}
      {sidebarOpen && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 35, padding: 0 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Bottom Navigation — visible on tablet + mobile (≤1024px) via CSS */}
      <BottomNav currentPage={currentPage} onNavigate={(page) => { onNavigate(page); setSidebarOpen(false); }} />
    </div>
  );
};
