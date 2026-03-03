'use client';
import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post('/api/users/forgotpassword', { email });
            // only navigate forward if backend confirmed a token was generated
            if (res?.data?.success) {
                setError(null);
                toast.success('OTP sent to email');
                router.push('/reset-password');
            } else {
                // email not registered; remain on page and show explicit error
                const msg = res?.data?.message || 'Email is not registered';
                setError(msg);
                // use error toast to emphasize
                toast.error(msg);
            }
        } catch (err: any) {
            const safe = err?.response?.data?.error || 'Request failed. Please try again.';
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
                        <h2 className="text-3xl font-bold mb-6 text-center md:text-left text-white">Forgot Password?</h2>
                        <p className="text-lg text-center md:text-left">Enter your email and we'll send a one-time code (OTP) to reset your password.</p>
                    </div>
                    <div className="w-full md:w-1/2 rounded-2xl theme-surface p-8">
                        {/* mobile header above form */}
                        <div className="flex flex-col items-center mb-6 md:hidden">
                          <img src="/logo.png" alt="Logo" className="w-10 h-10 mb-2" />
                          <h1 className="text-2xl font-semibold">EVOLVE</h1>
                          <h2 className="text-2xl font-bold mt-2">Forgot Password?</h2>
                          <p className="text-lg text-center mt-2">Enter your email and we'll send a one-time code (OTP) to reset your password.</p>
                        </div>
                        <h2 className="text-3xl font-bold mb-6 text-center text-white">Reset</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium theme-muted">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="theme-input mt-1 block w-full p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                                    required
                                    placeholder="Enter the email"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-2 px-4 theme-accent-bg cursor-pointer font-semibold rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-75"
                                disabled={!email || loading}
                            >
                                {loading ? '...' : 'Send OTP'}
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
