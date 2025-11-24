import { useState } from 'react';
import type { AccountAdminResponse } from '../../services/dto/account.types';
import { displayAllAccountResponseComponentInputAdmin } from '../display-account.component';
import type { AccountRowProps } from '../../types/admin.types';

export function AccountRow({ accountAdmin, onDelete, onUpdate }: AccountRowProps) {
  const [temp, setTemp] = useState<AccountAdminResponse>(accountAdmin);

  const handleReset = () => {
    setTemp({ ...accountAdmin });
  };

  const handleValueChange = (key: string, value: any) => {
    setTemp((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="group bg-white/10 backdrop-blur-sm rounded-lg p-3 hover:bg-white/20 transition-all duration-200 flex flex-col h-full min-h-[280px] border border-white/5 hover:border-white/20">
      {/* Account Info Display */}
      <div className="flex-1 mb-3">
        <div className="text-xs text-gray-300 mb-2 flex-shrink-0 flex justify-between">
          <span>Created: {new Date(accountAdmin.createdAt).toLocaleDateString()}</span>
          <span className={`px-2 py-0.5 rounded text-[10px] ${accountAdmin.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
            {accountAdmin.isActive ? 'ACTIVE' : 'INACTIVE'}
          </span>
        </div>
        <div className="flex-1 overflow-hidden">
          {displayAllAccountResponseComponentInputAdmin(
            temp,
            '',
            'text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 block',
            'text-sm font-semibold text-gray-900 rounded p-2 bg-white/90 w-full mb-2 block focus:ring-2 focus:ring-blue-500 outline-none',
            'space-y-2',
            handleValueChange,
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0 mt-auto">
        <button
          type="button"
          className="text-xs bg-red-600 hover:bg-red-700 text-white rounded-md p-2 shadow-sm transition-colors"
          onClick={() => onDelete?.(temp)}
        >
          Delete
        </button>
        <button
          type="button"
          className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md p-2 shadow-sm transition-colors"
          onClick={() => onUpdate?.(temp)}
        >
          Update
        </button>
        <button
          type="button"
          className="text-xs bg-gray-600 hover:bg-gray-700 text-white rounded-md p-2 shadow-sm transition-colors"
          onClick={handleReset}
        >
          Reset
        </button>
      </div>
    </div>
  );
}