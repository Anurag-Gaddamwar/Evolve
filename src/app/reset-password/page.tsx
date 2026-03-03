'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function ResetPasswordOTPPage() {
    const router = useRouter();
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post('/api/users/resetpassword', { token: otp, password });
            const msg = res?.data?.message || 'Password has been reset';
            toast.success(msg);
            const returnedEmail = res?.data?.email;
            if (returnedEmail) {
                try {
                    await axios.post('/api/users/login', { email: returnedEmail, password });
                    window.location.replace('/');
                    return;
                } catch {
                    // ignore
                }
            }
            setTimeout(() => router.push('/login'), 2000);
        } catch (err: any) {
            const safe = err?.response?.data?.error || 'Unable to reset password. Please try again.';
            setError(safe);
            toast.error(safe);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full theme-text flex items-center justify-center">
            <div className="border border-[#2a2a2a] rounded-2xl p-6 sm:p-10 md:p-20 lg:px-40 theme-shadow bg-[#1a1a1a] mx-4 sm:mx-auto">
                <div className="flex flex-col md:flex-row w-full max-w-6xl mx-auto">
                    <div className="hidden md:flex md:w-1/2 rounded-2xl theme-surface p-8">
                        <div className="flex items-center justify-center mb-8">
                            <img src="/logo.png" alt="Logo" className="w-12 h-12 mr-2" />
                            <h1 className="text-2xl font-semibold">EVOLVE</h1>
                        </div>
                        <h2 className="text-3xl font-bold mb-6 text-center md:text-left text-white">Reset Password</h2>
                        <p className="text-lg text-center md:text-left">Provide the one-time code sent to your email and choose a new password.</p>
                    </div>
                    <div className="w-full md:w-1/2 rounded-2xl theme-surface p-8">
                        {/* mobile header above form */}
                        <div className="flex flex-col items-center mb-6 md:hidden">
                          <img src="/logo.png" alt="Logo" className="w-10 h-10 mb-2" />
                          <h1 className="text-2xl font-semibold">EVOLVE</h1>
                          <h2 className="text-2xl font-bold mt-2">Reset Password</h2>
                          <p className="text-lg text-center mt-2">Provide the one-time code sent to your email and choose a new password.</p>
                        </div>
                        <h2 className="text-3xl font-bold mb-6 text-center text-white">New Password</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                <label htmlFor="otp" className="block text-sm font-medium theme-muted">OTP code</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="\d*"
                                    maxLength={6}
                                    id="otp"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="theme-input mt-1 block w-full p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    required
                                    placeholder="Enter 6-digit code"
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium theme-muted">Password</label>
                                <div className="relative mt-1">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="theme-input block w-full pr-12 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        required
                                        placeholder="••••••••"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowPassword(p=>!p)}
                                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-200"
                                      tabIndex={-1}
                                    >
                                      {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.269-2.943-9.543-7a9.968 9.968 0 012.223-3.502M9.879 9.879A3 3 0 0114.121 14.12" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.225 6.225l11.55 11.55" />
                                        </svg>
                                      ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                      )}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="confirm" className="block text-sm font-medium theme-muted">Confirm Password</label>
                                <div className="relative mt-1">
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        id="confirm"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="theme-input block w-full pr-12 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        required
                                        placeholder="Re-enter password"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowConfirm(p=>!p)}
                                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-200"
                                      tabIndex={-1}
                                    >
                                      {showConfirm ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.269-2.943-9.543-7a9.968 9.968 0 012.223-3.502M9.879 9.879A3 3 0 0114.121 14.12" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.225 6.225l11.55 11.55" />
                                        </svg>
                                      ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                      )}
                                    </button>
                                </div>
                            </div>
                                            <button
                                type="submit"
                                className="w-full py-2 px-4 theme-accent-bg cursor-pointer text-white font-semibold rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-75"
                                disabled={!otp || !password || !confirmPassword || loading}
                            >
                                {loading ? '...' : 'Reset Password'}
                            </button>
                        </form>
                        <div className="text-center mt-4">
                            <p className="text-sm text-gray-300">Remembered password? <Link href="/login" className="text-gray-300 hover:text-white underline">Login</Link></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}