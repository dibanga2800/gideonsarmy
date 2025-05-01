'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const user = session?.user;

  console.log('Session data:', session);
  console.log('User data:', user);
  console.log('Is admin?', user?.isAdmin);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/auth/signin');
  };

  return (
    <header className="bg-primary text-white shadow mb-4">
      <nav className="navbar navbar-expand-lg navbar-dark">
        <div className="container-fluid">
          <Link 
            href={user?.isAdmin ? '/admin' : '/dashboard'}
            className="navbar-brand"
          >
            <span className="h4 mb-0">Gideon's Army</span>
          </Link>
          
          <button 
            className="navbar-toggler" 
            type="button" 
            onClick={() => setIsNavCollapsed(!isNavCollapsed)}
            aria-controls="navbarNav" 
            aria-expanded={!isNavCollapsed} 
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <div className={`collapse navbar-collapse ${isNavCollapsed ? '' : 'show'}`} id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <Link 
                  href="/dashboard" 
                  className={`nav-link ${pathname?.includes('/dashboard') ? 'active' : ''}`}
                >
                  Dashboard
                </Link>
              </li>
          
              {user?.isAdmin && (
                <>
                  <li className="nav-item">
                    <Link 
                      href="/admin" 
                      className={`nav-link ${pathname?.includes('/admin') ? 'active' : ''}`}
                    >
                      Admin Dashboard
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link 
                      href="/admin/members" 
                      className={`nav-link ${pathname?.includes('/admin/members') ? 'active' : ''}`}
                    >
                      Manage Members
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link 
                      href="/admin/users" 
                      className={`nav-link ${pathname?.includes('/admin/users') ? 'active' : ''}`}
                    >
                      Manage Users
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link 
                      href="/admin/payments" 
                      className={`nav-link ${pathname?.includes('/admin/payments') ? 'active' : ''}`}
                    >
                      Manage Payments
                    </Link>
                  </li>
                </>
              )}
            </ul>

            {user && (
              <div className="dropdown">
                <button
                  type="button"
                  className="btn btn-link text-white text-decoration-none dropdown-toggle d-flex align-items-center"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  aria-expanded={isProfileMenuOpen}
                >
                  {user.image ? (
                    <Image
                      className="rounded-circle me-2"
                      src={user.image}
                      alt=""
                      width={32}
                      height={32}
                    />
                  ) : (
                    <div className="d-flex align-items-center justify-content-center rounded-circle bg-white bg-opacity-25 text-white me-2"
                         style={{ width: '32px', height: '32px' }}>
                      <span className="small">
                        {user.name?.[0] || user.email[0] || '?'}
                      </span>
                    </div>
                  )}
                  <span className="d-none d-md-inline me-2">{user.name || user.email}</span>
                </button>

                {isProfileMenuOpen && (
                  <div className="dropdown-menu dropdown-menu-end show mt-2">
                    <Link
                      href="/profile"
                      className={`dropdown-item ${pathname?.includes('/profile') ? 'active' : ''}`}
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Your Profile
                    </Link>
                    {user.isAdmin && (
                      <Link
                        href="/admin"
                        className={`dropdown-item ${pathname?.includes('/admin') ? 'active' : ''}`}
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <div className="dropdown-divider"></div>
                    <button
                      onClick={handleLogout}
                      className="dropdown-item text-danger"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
} 