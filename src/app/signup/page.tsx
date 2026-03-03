'use client';
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; 
import axios from "axios";
import { toast } from "react-hot-toast";

export default function SignupPage() {
    const router = useRouter(); 
    const [user, setUser] = useState({
        username: "",
        email: "",
        password: "",
        channelId: "", 
    });
    const [showPassword, setShowPassword] = useState(false);
    const [buttonDisabled, setButtonDisabled] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onSignup = async () => {
        try {
            setLoading(true);
            const response = await axios.post("/api/users/signup", user); 
            // console.log("Signup success", response.data);
            toast.success('Account created successfully. Please check your email for a verification code.');
            sessionStorage.setItem('postSignupEmail', user.email);
            sessionStorage.setItem('postSignupPassword', user.password);
            router.push(`/verifyemail?email=${encodeURIComponent(user.email)}`);
        } catch (err: any) {
            // axios error may not have response or data
            const serverMsg = err?.response?.data?.error;
            const safe = serverMsg || 'Signup failed. Please try again.';
            // console.log("Signup failed", safe);
            setError(safe);
            toast.error(safe);
        } finally {
            setLoading(false);
        }
    };
    

    useEffect(() => {
        // Check if all fields are filled to enable the button
        const isFormValid = user.username.trim() !== "" && user.email.trim() !== "" && user.password.trim() !== "" && user.channelId.trim() !== ""; // Include channelId in the validation
        setButtonDisabled(!isFormValid);
    }, [user]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSignup();
    };

        return (
            <div className="h-full theme-text flex items-center justify-center">
            <div className="border border-[#2a2a2a] shadow-lg rounded-2xl p-6 sm:p-10 md:p-20 lg:px-40 theme-shadow bg-[#1a1a1a] mx-4 sm:mx-auto">
          <div className="flex flex-col md:flex-row w-full max-w-6xl mx-auto">
            {/* Left half with welcoming message and quote */}
                        <div className="hidden md:flex md:w-1/2 rounded-2xl theme-surface p-8 flex flex-col justify-center">
              {/* Logo and website name */}
              <div className="flex items-center justify-center mb-8">
                <img src="/logo.png" alt="Logo" className="w-12 h-12 mr-2" /> 
                <h1 className="text-2xl font-semibold">EVOLVE</h1>
              </div>
              <p className="text-lg text-center md:text-left">Join Evolve to manage your AI workflows and analytics.</p>
            </div>
                        {/* Right half with signup form */}
                        <div className="w-full md:w-1/2 rounded-2xl theme-surface p-8">
                            {/* mobile header above form */}
                            <div className="flex flex-col items-center mb-6 md:hidden">
                              <img src="/logo.png" alt="Logo" className="w-10 h-10 mb-2" />
                              <h1 className="text-2xl font-semibold">EVOLVE</h1>
                              <p className="text-lg text-center mt-2">Join Evolve to manage your AI workflows and analytics.</p>
                            </div>
                            <h2 className="text-3xl font-bold mb-6 text-center">Create your account</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">

                                {/* Email input */}
                                <div>
                                    <label htmlFor="username" className="block text-sm font-medium theme-muted">Username</label>
                                    <input
                                        type="username"
                                        id="username"
                                        value={user.username}
                                        onChange={(e) => setUser({ ...user, username: e.target.value })}
                                        className="theme-input mt-1 block w-full p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                                        required
                                        placeholder='your username'
                                        autoComplete='current-username'
                                    />
                                </div>
                                {/* Email input */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium theme-muted">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={user.email}
                                        onChange={(e) => setUser({ ...user, email: e.target.value })}
                                        className="theme-input mt-1 block w-full p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                                        required
                                        placeholder='you@example.com'
                                        autoComplete='current-email'
                                    />
                                </div>
                                {/* Password input */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium theme-muted">Password</label>
                                    <div className="relative mt-1">
                                      <input
                                          type={showPassword ? 'text' : 'password'}
                                          id="password"
                                          value={user.password}
                                          onChange={(e) => setUser({ ...user, password: e.target.value })}
                                          className="theme-input block w-full pr-12 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                                          required
                                          placeholder='••••••••'
                                          autoComplete='current-password'
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
                                {/* Channel ID input */}
                                <div>
                                    <label htmlFor="channelId" className="block text-sm font-medium theme-muted">Channel ID (optional)</label>
                                    <input
                                        type="text"
                                        id="channelId"
                                        value={user.channelId}
                                        onChange={(e) => setUser({ ...user, channelId: e.target.value })}
                                        className="theme-input mt-1 block w-full p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                                        required
                                        placeholder='Your YouTube channel ID'
                                    />
                                </div>
                                <button type="submit" className="w-full py-2 px-4 theme-accent-bg font-semibold rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-75 cursor-pointer" disabled={buttonDisabled} >
                                    {loading ? "..." : "Sign Up"}
                                </button>
                            </form>
                            <div className="text-center mt-4">
                                <p className="text-sm text-gray-300">Already have an account? <Link href="/login" className="text-gray-300 hover:text-white underline">Login</Link></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    );
};
