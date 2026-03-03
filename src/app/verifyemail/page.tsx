"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlToken = searchParams.get('token') || '';
  const initialEmail = searchParams.get('email') || '';

  const [token, setToken] = useState(urlToken);
  const [email, setEmail] = useState(initialEmail);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const res = await axios.post('/api/users/verifyemail', { token });
      const msg = res?.data?.message || 'Email verified';
      toast.success(msg);
      const storedEmail = sessionStorage.getItem('postSignupEmail');
      const storedPwd = sessionStorage.getItem('postSignupPassword');
      if (storedEmail && storedPwd) {
        try {
          await axios.post(
            '/api/users/login',
            { email: storedEmail, password: storedPwd },
            { withCredentials: true }
          );
          sessionStorage.removeItem('postSignupEmail');
          sessionStorage.removeItem('postSignupPassword');
        } catch (loginErr) {
          console.warn('Auto-login failed after verify', loginErr);
          toast.error('Auto-login failed, please sign in');
        }
      }
      // always send user to home; if not logged in, homepage will redirect to login via middleware
      window.location.replace('/');
    } catch (err: any) {
      const safe = err?.response?.data?.error || 'Verification failed';
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Email not specified");
      return;
    }
    try {
      await axios.post('/api/users/resendverify', { email });
      toast.success('Verification code resent');
      setResendCooldown(60);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to resend');
    }
  };

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => setResendCooldown(c => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  return (
    <div className="h-full theme-text flex items-center justify-center">
      <div className="border border-[#2a2a2a] rounded-2xl p-6 sm:p-10 md:p-20 lg:px-40 theme-shadow bg-[#1a1a1a] mx-4 sm:mx-auto">
        <div className="max-w-md mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center text-white">Verify Your Email</h2>
          <p className="text-sm text-[#a0a0a0] mb-4">
            {urlToken ? (
              <>A verification token was detected in the link.&nbsp;</>
            ) : (
              <>Please enter the code or token you received by email.</>
            )}
          </p>
          {email && <p className="text-sm text-[#ccc]">Email: {email}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="token" className="block text-sm font-medium theme-muted">Token / OTP</label>
              <input
                type="text"
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value.trim())}
                className="theme-input mt-1 block w-full p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                required
                placeholder="Enter code or click link"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 theme-accent-bg cursor-pointer font-semibold rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-75"
              disabled={!token || loading}
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
            {email && (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="w-full mt-2 py-2 px-4 bg-[#444] text-sm rounded-lg disabled:opacity-50"
              >
                {resendCooldown > 0 ? `Resend code (${resendCooldown})` : 'Resend code'}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
