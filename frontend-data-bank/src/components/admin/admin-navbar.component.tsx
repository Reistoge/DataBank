import { FiUsers, FiGrid, FiLogOut, FiActivity } from 'react-icons/fi';
import type { AdminView } from '../../types/admin.types';

interface AdminNavbarProps {
  currentView: AdminView;
  setView: (v: AdminView) => void;
  onLogout: () => void;
}

export function AdminNavbar({ currentView, setView, onLogout }: AdminNavbarProps) {
  const navItems = [
    { id: 'ACCOUNTS', label: 'Accounts', icon: <FiUsers /> },
    { id: 'TRANSACTIONS', label: 'Transactions', icon: <FiActivity /> },
    { id: 'LOGS', label: 'System Logs', icon: <FiGrid /> },
  ];

  return (
    <div className="bg-white/10 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-white">Admin Portal</h1>
            <div className="flex space-x-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setView(item.id as AdminView)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    currentView === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="text-gray-300 hover:text-white flex items-center gap-2 px-3 py-2 rounded-md hover:bg-red-500/20 transition-colors"
          >
            <FiLogOut />
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}