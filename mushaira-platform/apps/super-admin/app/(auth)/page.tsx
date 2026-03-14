'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';

export default function LoginPage() {
  const [mobile, setMobile] = useState('+91');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = mobile.trim();
    if (!/^\+[1-9]\d{6,14}$/.test(trimmed)) {
      toast.error('Enter a valid mobile number with country code');
      return;
    }
    setLoading(true);
    try {
      await authApi.sendOtp(trimmed);
      toast.success('OTP sent');
      router.push(`/auth/verify?mobile=${encodeURIComponent(trimmed)}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8 space-y-2">
        <h1 className="font-heading text-5xl text-gold font-bold tracking-wide">Mushaira</h1>
        <div className="flex items-center justify-center gap-2 text-white/50 text-sm">
          <ShieldAlert size={14} />
          <span>Super Admin Console</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-2xl">
        <h2 className="font-heading text-2xl font-bold text-gray-900 mb-1">Restricted Access</h2>
        <p className="text-sm text-gray-500 mb-6">
          Only authorised Super Admin accounts can sign in here.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Mobile Number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="+919999999999"
            hint="Registered Super Admin mobile number"
            type="tel"
            autoFocus
            maxLength={16}
          />
          <Button type="submit" loading={loading} size="lg" className="w-full">
            Send OTP
          </Button>
        </form>
      </div>
    </div>
  );
}
