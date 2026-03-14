'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
      toast.error('Enter a valid mobile number with country code (e.g. +919876543210)');
      return;
    }

    setLoading(true);
    try {
      await authApi.sendOtp(trimmed);
      toast.success('OTP sent successfully');
      router.push(`/auth/verify?mobile=${encodeURIComponent(trimmed)}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Branding */}
      <div className="text-center mb-8">
        <h1 className="font-heading text-5xl text-gold font-bold tracking-wide">
          Mushaira
        </h1>
        <p className="text-white/60 text-sm mt-2">
          Organiser Dashboard
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl p-8 shadow-2xl">
        <h2 className="font-heading text-2xl font-bold text-gray-900 mb-1">
          Welcome Back
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Enter your registered mobile number to sign in.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Mobile Number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="+919876543210"
            hint="Include country code (e.g. +91 for India)"
            type="tel"
            autoFocus
            maxLength={16}
          />
          <Button
            type="submit"
            loading={loading}
            size="lg"
            className="w-full"
          >
            Send OTP
          </Button>
        </form>
      </div>

      <p className="text-center text-white/40 text-xs mt-6">
        Access restricted to registered organisers only
      </p>
    </div>
  );
}
