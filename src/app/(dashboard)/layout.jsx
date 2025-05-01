'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);
  
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Don't render content if not authenticated
  if (status !== 'authenticated') {
    return null;
  }

  return (
    <div className="dashboard-container d-flex">
      {/* Sidebar */}
      <div className={`sidebar bg-dark text-white ${collapsed ? 'collapsed' : ''}`} style={{ 
        width: collapsed ? '60px' : '250px',
        minHeight: '100vh',
        transition: 'width 0.3s ease'
      }}>
        <div className="p-3 d-flex justify-content-between align-items-center">
          {!collapsed && <h5 className="m-0">Gideon's Army</h5>}
          <button 
            className="btn btn-sm btn-dark" 
            onClick={toggleSidebar}
          >
            <i className={`bi bi-chevron-${collapsed ? 'right' : 'left'}`}></i>
          </button>
        </div>
        
        <hr className="bg-secondary" />
        
        <ul className="nav flex-column">
          <li className="nav-item">
            <Link 
              href="/dashboard" 
              className={`nav-link ${pathname === '/dashboard' ? 'active bg-primary' : 'text-white'}`}
            >
              <i className="bi bi-speedometer2 me-2"></i>
              {!collapsed && 'Dashboard'}
            </Link>
          </li>
          {session?.user?.isAdmin && (
            <>
              <li className="nav-item">
                <Link 
                  href="/admin/members" 
                  className={`nav-link ${pathname.includes('/admin/members') ? 'active bg-primary' : 'text-white'}`}
                >
                  <i className="bi bi-people me-2"></i>
                  {!collapsed && 'Manage Members'}
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  href="/admin/users" 
                  className={`nav-link ${pathname.includes('/admin/users') ? 'active bg-primary' : 'text-white'}`}
                >
                  <i className="bi bi-person-badge me-2"></i>
                  {!collapsed && 'Manage Users'}
                </Link>
              </li>
            </>
          )}
          <li className="nav-item">
            <Link
              href="/"
              className="nav-link text-white"
            >
              <i className="bi bi-arrow-left me-2"></i>
              {!collapsed && 'Back to Home'}
            </Link>
          </li>
        </ul>
      </div>
      
      {/* Main content */}
      <div className="main-content flex-grow-1" style={{ 
        marginLeft: '0',
        transition: 'margin-left 0.3s ease'
      }}>
        <header className="bg-light border-bottom p-3">
          <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center">
              <h3 className="h5 mb-0">
                Gideon's Army Dues Management
              </h3>
              <div>
                <Link 
                  href="/profile" 
                  className="btn btn-outline-secondary btn-sm"
                >
                  <i className="bi bi-person-circle me-1"></i>
                  {session.user.name || session.user.email}
                </Link>
              </div>
            </div>
          </div>
        </header>
        
        <main className="py-3">
          {children}
        </main>
      </div>
    </div>
  );
} 