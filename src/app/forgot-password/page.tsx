'use client';
import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import AppSidebarShell from '../components/AppSidebarShell';

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
            toast.success('Reset link generated');
            // if token returned navigate to reset page
            if (res.data.hashedToken) {
                // encode token so special chars (slashes) don't break the path
                router.push(`/reset-password/${encodeURIComponent(res.data.hashedToken)}`);
            }
        } catch (err: any) {
            const msg = err?.response?.data?.error || err.message;
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppSidebarShell title="Forgot Password">
            <div className="min-h-full theme-text flex items-center justify-center">
            <div className="border border-[#2a2a2a] rounded-2xl sm:p-30 lg:px-40 md:p-20 theme-shadow bg-[#1a1a1a]">
                <div className="flex flex-col md:flex-row w-full max-w-6xl mx-auto">
                    <div className="md:w-1/2 rounded-2xl theme-surface p-8">
                        <div className="flex items-center justify-center mb-8">
                            <img src="/logo.png" alt="Logo" className="w-12 h-12 mr-2" />
                            <h1 className="text-2xl font-semibold">EVOLVE</h1>
                        </div>
                        <h2 className="text-3xl font-bold mb-6 text-center md:text-left">Forgot Password?</h2>
                        <p className="text-lg text-center md:text-left">Enter your email and we'll send a reset link.</p>
                    </div>
                    <div className="md:w-1/2 rounded-2xl theme-surface p-8">
                        <h2 className="text-3xl font-bold mb-6 text-center">Reset</h2>
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
                            {error && <p className="text-red-500 text-xs italic">{error}</p>}
                            <button
                                type="submit"
                                className="w-full py-2 px-4 theme-accent-bg cursor-pointer font-semibold rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-75"
                                disabled={!email || loading}
                            >
                                {loading ? '...' : 'Send Link'}
                            </button>
                        </form>
                        <div className="text-center mt-4">
                            <p className="text-sm theme-muted">Remembered password? <Link href="/login" className="theme-accent hover:underline">Login</Link></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </AppSidebarShell>
    );
}
