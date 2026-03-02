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
                            <div className="relative">
                                <label htmlFor="password" className="block text-sm font-medium theme-muted">Password</label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="theme-input mt-1 block w-full pr-10 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    required
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div className="relative">
                                <label htmlFor="confirm" className="block text-sm font-medium theme-muted">Confirm Password</label>
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    id="confirm"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="theme-input mt-1 block w-full pr-10 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    required
                                    placeholder="Re-enter password"
                                />
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
                            <p className="text-sm theme-muted">Remembered password? <Link href="/login" className="theme-accent hover:underline">Login</Link></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
