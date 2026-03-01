'use client';
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; 
import axios from "axios";
import { toast } from "react-hot-toast";
import AppSidebarShell from "../components/AppSidebarShell";

export default function SignupPage() {
    const router = useRouter(); 
    const [user, setUser] = useState({
        username: "",
        email: "",
        password: "",
        channelId: "", 
    });
    const [buttonDisabled, setButtonDisabled] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onSignup = async () => {
        try {
            setLoading(true);
            const response = await axios.post("/api/users/signup", user); 
            console.log("Signup success", response.data);
            router.push("/");
        } catch (err: any) {
            // axios error may not have response or data
            const message = err?.response?.data?.error || err.message || 'Signup failed';
            console.log("Signup failed", message);
            setError(message);
            toast.error(message);
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
            <AppSidebarShell title="Sign Up" showSidebar={false} showLogout={false}>
            <div className="min-h-full theme-text flex items-center justify-center">
            <div className= "border border-[#2a2a2a] shadow-lg rounded-2xl sm:p-30 lg:px-40 md:p-20 theme-shadow bg-[#1a1a1a]">
          <div className="flex flex-col md:flex-row w-full max-w-6xl mx-auto">
            {/* Left half with welcoming message and quote */}
                        <div className="md:w-1/2 rounded-2xl theme-surface p-8 flex flex-col justify-center">
              {/* Logo and website name */}
              <div className="flex items-center justify-center mb-8">
                <img src="/logo.png" alt="Logo" className="w-12 h-12 mr-2" /> 
                <h1 className="text-2xl font-semibold">EVOLVE</h1>
              </div>
              <h2 className="text-3xl font-bold mb-6 text-center md:text-left">Create an Account</h2>
              <p className="text-lg text-center md:text-left">Create your creator account and start analyzing videos.</p>
            </div>
                        {/* Right half with signup form */}
                        <div className="md:w-1/2 rounded-2xl theme-surface p-8">
                            <h2 className="text-3xl font-bold mb-6 text-center">Sign Up</h2>
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
                                        placeholder='Enter the username'
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
                                        placeholder='Enter the email'
                                        autoComplete='current-email'
                                    />
                                </div>
                                {/* Password input */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium theme-muted">Password</label>
                                    <input
                                        type="password"
                                        id="password"
                                        value={user.password}
                                        onChange={(e) => setUser({ ...user, password: e.target.value })}
                                        className="theme-input mt-1 block w-full p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                                        required
                                        placeholder='Enter the password'
                                        autoComplete='current-password'
                                    />
                                </div>
                                {/* Channel ID input */}
                                <div>
                                    <label htmlFor="channelId" className="block text-sm font-medium theme-muted">Channel ID</label>
                                    <input
                                        type="text"
                                        id="channelId"
                                        value={user.channelId}
                                        onChange={(e) => setUser({ ...user, channelId: e.target.value })}
                                        className="theme-input mt-1 block w-full p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                                        required
                                        placeholder='Enter the channel ID'
                                    />
                                </div>
                                {error && <p className="text-red-500 text-xs italic">{error}</p>}
                                <button type="submit" className="w-full py-2 px-4 theme-accent-bg font-semibold rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-75 cursor-pointer" disabled={buttonDisabled} >
                                    {loading ? "..." : "Sign Up"}
                                </button>
                            </form>
                            <div className="text-center mt-4">
                                <p className="text-sm theme-muted">Already have an account? <Link href="/login" className="theme-accent hover:underline">Login</Link></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </AppSidebarShell>
    );
};
