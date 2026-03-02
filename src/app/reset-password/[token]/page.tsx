'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function ResetPasswordPage() {
    const router = useRouter();
    const params = useParams();
    // token may be URI-encoded in the url
    const token = params?.token ? decodeURIComponent(Array.isArray(params.token) ? params.token[0] : params.token) : '';
    const [otp, setOtp] = useState('');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const payload: any = { token, password };
            if (otp) payload.token = otp; // when using OTP override token
            const res = await axios.post('/api/users/resetpassword', payload);
            const msg = res?.data?.message || 'Password has been reset';
            toast.success(msg);
            setSuccessMsg(msg);
            setTimeout(() => router.push('/login'), 2000);
        } catch (err: any) {
            const msg = err?.response?.data?.error || err.message;
            setError(msg);
            toast.error(msg);
            if (msg && msg.toLowerCase().includes('invalid')) {
                router.push('/forgot-password');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full theme-text flex items-center justify-center">
            <div className="border border-[#2a2a2a] rounded-2xl p-6 sm:p-10 md:p-20 lg:px-40 theme-shadow bg-[#1a1a1a] mx-4 sm:mx-auto">
                <div className="flex flex-col md:flex-row w-full max-w-6xl mx-auto">
                    <div className="md:w-1/2 rounded-2xl theme-surface p-8">
                        <div className="flex items-center justify-center mb-8">
                            <img src="/logo.png" alt="Logo" className="w-12 h-12 mr-2" />
                            <h1 className="text-2xl font-semibold">EVOLVE</h1>
                        </div>
                        <h2 className="text-3xl font-bold mb-6 text-center md:text-left">Reset Password</h2>
                        <p className="text-lg text-center md:text-left">Enter a new password for your account.</p>
                    </div>
                    <div className="md:w-1/2 rounded-2xl theme-surface p-8">
                        <h2 className="text-3xl font-bold mb-6 text-center">New Password</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {successMsg && <p className="text-green-400 text-sm text-center">{successMsg}</p>}
                            {!token && (
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
                            )}
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
                                        placeholder="Enter new password"
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
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
                                          <path d="M13.875 18.825l-1.35-1.35a4.992 4.992 0 01-3.525 1.65A4.992 4.992 0 016 14.325c0-1.32.51-2.52 1.35-3.425L5.475 7.05A9.964 9.964 0 002 11.25c3 3.75 6.75 5.25 10 5.25a9.977 9.977 0 005.5-1.5l-2.625-2.625zm4.95-4.95L18 11.25a4.992 4.992 0 01-1.65 3.525 4.992 4.992 0 01-3.525 1.65 4.992 4.992 0 01-3.525-1.65l-1.35 1.35a7.485 7.485 0 004.875 1.8c3.25 0 7-1.5 10-5.25a9.964 9.964 0 00-3.475-4.575z" fill="currentColor"/>
                                          <path d="M12 9a3 3 0 003 3c.795 0 1.52-.315 2.05-.825l1.425 1.425A4.992 4.992 0 0112 15a4.992 4.992 0 01-3.525-1.65l1.425-1.425A2.996 2.996 0 0012 9z" fill="currentColor"/>
                                        </svg>
                                      ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
                                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 13c-3.04 0-5.5-2.46-5.5-5.5S8.96 6.5 12 6.5s5.5 2.46 5.5 5.5S15.04 17.5 12 17.5z" fill="currentColor"/>
                                          <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
                                        </svg>
                                      )}
                                    </button>
                                </div>
                            </div>
                            {error && <p className="text-red-500 text-xs italic">{error}</p>}
                            <button
                                type="submit"
                                className="w-full py-2 px-4 theme-accent-bg cursor-pointer text-white font-semibold rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-75"
                                disabled={!password || !confirmPassword || loading}
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
