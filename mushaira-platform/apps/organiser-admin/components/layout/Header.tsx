'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { userApi } from '@/lib/api';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const [mobile, setMobile] = useState('');

  useEffect(() => {
    userApi
      .getProfile()
      .then(({ data }) => setMobile(data.data?.mobile_number ?? ''))
      .catch(() => {});
  }, []);

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 sticky top-0 z-10">
      <div>
        <h2 className="font-heading text-xl font-bold text-gray-900">{title}</h2>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors">
          <Bell size={18} />
        </button>
        {mobile && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center">
              <span className="text-xs font-bold text-white">O</span>
            </div>
            <span className="text-xs font-medium text-primary-600">{mobile}</span>
          </div>
        )}
      </div>
    </header>
  );
}
