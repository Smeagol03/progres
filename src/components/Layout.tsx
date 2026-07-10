import { useState } from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useReadOnly } from '../contexts/ReadOnlyContext';
import { LayoutDashboard, FileSpreadsheet, LogOut, Home, Menu, Eye } from 'lucide-react';
import { cn } from '../lib/utils';
import ShareSettings from './ShareSettings';

export default function Layout() {
  const { isReadOnly, ready: readOnlyReady } = useReadOnly();
  const { user, loading: authLoading, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loading = authLoading || !readOnlyReady;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
      </div>
    );
  }

  const isAuthenticated = !!user;

  // Only redirect to login if not in read-only mode and not authenticated
  if (!isReadOnly && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Daftar Paket', href: '/paket', icon: FileSpreadsheet },
  ];

  const sidebarContent = (
    <>
      <div className="h-16 flex items-center px-6 border-b border-navy-light">
        <Home className="w-6 h-6 text-gold mr-3 shrink-0" />
        <span className="font-display font-bold text-lg text-white">RTLH Monitor</span>
      </div>

      {isReadOnly && (
        <div className="mx-4 mt-4 px-3 py-2 bg-gold/15 border border-gold/30 rounded-lg flex items-center gap-2">
          <Eye className="w-4 h-4 text-gold shrink-0" />
          <span className="text-xs font-medium text-gold">Mode Read-only</span>
        </div>
      )}

      <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href ||
                           (item.href !== '/' && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors group",
                isActive
                  ? "bg-navy-light text-gold"
                  : "text-gray-300 hover:bg-navy-light/50 hover:text-white"
              )}
            >
              <item.icon className={cn(
                "mr-3 flex-shrink-0 h-5 w-5",
                isActive ? "text-gold" : "text-gray-400 group-hover:text-gray-300"
              )} />
              {item.name}
            </Link>
          );
        })}

        {isAuthenticated && !isReadOnly && <ShareSettings />}
      </div>

      {isAuthenticated && !isReadOnly && (
        <div className="p-4 border-t border-navy-light">
          <div className="flex items-center mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-navy-light flex items-center justify-center text-sm font-medium mr-3 border border-gray-700 shrink-0">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-white">Administrator</p>
              <p className="text-xs truncate text-gray-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-navy-light hover:text-white transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-400" />
            Keluar
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {isReadOnly && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gold/90 text-navy text-center text-xs font-semibold py-1.5 tracking-wider flex items-center justify-center gap-2">
          <Eye className="w-3.5 h-3.5" />
          Mode Read-only — Data tidak bisa diubah
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:flex lg:flex-col w-64 bg-navy text-white fixed inset-y-0 left-0 z-30",
        isReadOnly && "top-7"
      )}>
        {sidebarContent}
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          <div className={cn(
            "fixed inset-y-0 left-0 w-64 bg-navy text-white z-50 animate-in slide-in-from-left duration-300",
            isReadOnly && "top-7"
          )}>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Top bar for mobile */}
      <div className={cn(
        "fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:hidden z-20 shadow-sm transition-all",
        isReadOnly && "top-7"
      )}>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-navy mr-3"
          aria-label="Buka menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <Home className="w-5 h-5 text-gold mr-2 shrink-0" />
        <span className="font-display font-bold text-navy">RTLH Monitor</span>
      </div>

      {/* Main Content */}
      <div className={cn(
        "flex-1 lg:pl-64 pt-16 lg:pt-0",
        isReadOnly && "pt-20 lg:pt-7"
      )}>
        <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
