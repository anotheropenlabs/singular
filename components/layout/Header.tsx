'use client';

import { LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface HeaderProps {
  username: string;
}

export default function Header({ username }: HeaderProps) {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 flex items-center justify-between">
      <div className="text-white/50 text-sm">
        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
            <User className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-white text-sm font-medium">{username}</span>
        </button>
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
