import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Menu, Sun, Moon, Search, Bell, Maximize, ChevronDown, User as UserIcon, Check } from 'lucide-react';
import { apiRequest } from '../../services/api';

interface NavbarProps {
  onToggleSidebar: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, theme = 'dark', onToggleTheme, currentPage = 'Dashboard', onNavigate }) => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  
  const pageTitle = currentPage.charAt(0).toUpperCase() + currentPage.slice(1);

  const fetchNotifications = async () => {
    const res = await apiRequest<any[]>('/notifications');
    if (res.success && res.data) {
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.is_read).length);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const markAllAsRead = async () => {
    await apiRequest('/notifications/mark-all-read', { method: 'PUT' });
    fetchNotifications();
    setShowNotifMenu(false);
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileRef, notifRef]);

  // Listen for sidebar click
  useEffect(() => {
    const handleToggle = () => setShowNotifMenu(prev => !prev);
    document.addEventListener('toggleNotifications', handleToggle);
    return () => document.removeEventListener('toggleNotifications', handleToggle);
  }, []);

  return (
    <header className="top-navbar" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.75rem 1.5rem',
      backgroundColor: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-color)',
      height: '70px',
      position: 'sticky',
      top: 0,
      zIndex: 20
    }}>
      {/* Left Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <button 
          className="hamburger-btn" 
          onClick={onToggleSidebar}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: '0'
          }}
        >
          <Menu size={24} />
        </button>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
            {pageTitle}
          </h2>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Welcome back, {user?.name || 'User'} 👋
          </span>
        </div>
      </div>

      {/* Right Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        
        {/* Search Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(150, 150, 150, 0.1)',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          color: '#94a3b8',
          fontSize: '0.85rem'
        }} className="navbar-search">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Search (Ctrl+/)" 
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              width: '120px'
            }}
          />
        </div>

        {/* Action Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', color: '#94a3b8' }}>
          {/* Theme Toggle */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 0
              }}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )}

          {/* Notifications */}
          <div style={{ position: 'relative', cursor: 'pointer' }} ref={notifRef}>
            <div onClick={() => setShowNotifMenu(!showNotifMenu)}>
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--bg-card)'
                }}>
                  {unreadCount}
                </span>
              )}
            </div>

            {/* Notification Dropdown Menu */}
            {showNotifMenu && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 15px)',
                right: '-10px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                width: '320px',
                maxHeight: '400px',
                overflowY: 'auto',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} style={{ background: 'transparent', border: 'none', color: '#6366f1', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Check size={14} /> Mark all read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.notification_id} style={{
                      padding: '1rem',
                      borderBottom: '1px solid var(--border-color)',
                      background: n.is_read ? 'transparent' : 'rgba(99, 102, 241, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem'
                    }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: n.is_read ? 'var(--text-primary)' : '#6366f1' }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4 }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Fullscreen */}
          <Maximize size={18} style={{ cursor: 'pointer' }} />
        </div>

        {/* User Profile */}
        {user && (
          <div style={{ position: 'relative' }} ref={profileRef}>
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                cursor: 'pointer',
                marginLeft: '0.5rem'
              }}
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '1rem'
                  }}
                >
                  {user.name.charAt(0)}
                </div>
                {/* Online indicator */}
                <div style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  width: '10px',
                  height: '10px',
                  background: '#10b981',
                  borderRadius: '50%',
                  border: '2px solid var(--bg-card)'
                }} />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    {user.role_name}
                  </div>
                </div>
                <ChevronDown size={14} color="#94a3b8" />
              </div>
            </div>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: '0',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '0.5rem',
                minWidth: '180px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                zIndex: 50
              }}>
                <button 
                  onClick={() => { setShowProfileMenu(false); if (onNavigate) onNavigate('settings'); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left' }}
                >
                  <UserIcon size={16} /> My Profile
                </button>
                <button 
                  onClick={() => { setShowProfileMenu(false); logout(); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', textAlign: 'left' }}
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
