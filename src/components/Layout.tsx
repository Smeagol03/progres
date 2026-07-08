import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, FileSpreadsheet, LogOut, Home } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout() {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Daftar Paket', href: '/paket', icon: FileSpreadsheet },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-navy text-white flex flex-col fixed inset-y-0 left-0">
        <div className="h-16 flex items-center px-6 border-b border-navy-light">
          <Home className="w-6 h-6 text-gold mr-3" />
          <span className="font-display font-bold text-lg text-white">RTLH Monitor</span>
        </div>
        
        <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
                             (item.href !== '/' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
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
        </div>

        <div className="p-4 border-t border-navy-light">
          <div className="flex items-center mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-navy-light flex items-center justify-center text-sm font-medium mr-3 border border-gray-700">
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
      </div>

      {/* Main Content */}
      <div className="flex-1 pl-64">
        <main className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
