'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api';
import { auth } from '@/lib/auth';
import { getErrorMessage } from '@/lib/utils';

function VerifyForm() {
  const searchParams = useSearchParams();
  const mobile = searchParams.get('mobile') ?? '';
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (timer === 0) return;
    const t = setTimeout(() => setTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const handleChange = (val: string, i: number) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...digits];
    next[i] = val.slice(-1);
    setDigits(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
    if (!val && i > 0) inputs.current[i - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = digits.join('');
    if (code.length !== 6) { toast.error('Enter the complete 6-digit OTP'); return; }
    setLoading(true);
    try {
      const { data } = await authApi.verifyOtp(mobile, code);
      auth.setTokens(data.data.access_token, data.data.refresh_token);
      toast.success('Signed in');
      router.replace('/');
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDigits(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    try {
      await authApi.sendOtp(mobile);
      setDigits(['', '', '', '', '', '']);
      setTimer(60);
      toast.success('OTP resent');
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="font-heading text-5xl text-gold font-bold tracking-wide">Mushaira</h1>
      </div>
      <div className="bg-white rounded-3xl p-8 shadow-2xl">
        <h2 className="font-heading text-2xl font-bold text-gray-900 mb-1">Enter OTP</h2>
        <p className="text-sm text-gray-500 mb-6">
          Sent to <span className="font-semibold text-navy">{mobile}</span>
        </p>
        <div className="flex gap-2 justify-between mb-6">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              value={d}
              onChange={(e) => handleChange(e.target.value, i)}
              onKeyDown={(e) => { if (e.key === 'Backspace' && !d && i > 0) inputs.current[i - 1]?.focus(); }}
              maxLength={1}
              autoFocus={i === 0}
              className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-colors ${
                d ? 'border-navy bg-navy/5 text-navy' : 'border-gray-200 bg-gray-50'
              } focus:border-navy`}
            />
          ))}
        </div>
        <Button onClick={handleVerify} loading={loading} size="lg" className="w-full mb-3">
          Verify & Sign In
        </Button>
        <button onClick={handleResend} disabled={timer > 0} className="w-full text-sm font-semibold text-center py-2 disabled:text-gray-400 text-navy hover:underline">
          {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
        </button>
        <button onClick={() => router.back()} className="w-full text-sm text-gray-400 hover:text-gray-600 text-center mt-1">
          Change Number
        </button>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return <Suspense><VerifyForm /></Suspense>;
}
