import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiGrid } from 'react-icons/fi';
import { AdminNavbar } from '../components/admin/admin-navbar.component';
import { AccountPanel } from '../components/admin/account-panel.component';
import { TransactionPanel } from '../components/admin/transaction-panel.component';
import type { AdminView } from '../types/admin.types';

function AdminPanel() {
  const [currentView, setCurrentView] = useState<AdminView>('ACCOUNTS');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black flex flex-col">
      <AdminNavbar 
        currentView={currentView} 
        setView={setCurrentView} 
        onLogout={() => navigate('/dashboard')} 
      />

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {currentView === 'ACCOUNTS' && (
            <AccountPanel key="accounts" />
          )}
          
          {currentView === 'TRANSACTIONS' && (
            <TransactionPanel key="transactions" />
          )}

          {currentView === 'LOGS' && (
            <motion.div
              key="logs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center h-full text-white/50"
            >
              <div className="text-center">
                <FiGrid className="text-6xl mx-auto mb-4" />
                <h2 className="text-2xl font-bold">System Logs</h2>
                <p>Coming soon...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="text-center py-6">
        <a
          href="https://github.com/Reistoge/DataBank"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-white transition-colors duration-200"
        >
          @DataBank
        </a>
      </footer>
    </div>
  );
}

export default AdminPanel;
