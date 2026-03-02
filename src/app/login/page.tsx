'use client'
// login-page.tsx
import Link from "next/link";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

interface User {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [user, setUser] = useState<User>({
    email: "",
    password: "",
  });
  const [buttonDisabled, setButtonDisabled] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null); // State for error handling
  const [loading, setLoading] = useState<boolean>(false); // State for loading indicator
  const [showPassword, setShowPassword] = useState(false);

  const onLogin = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    setLoading(true); // Set loading to true when login button is clicked

    try {
      const response = await axios.post("/api/users/login", user);
      // console.log("Login success", response.data);
      toast.success("Login success");
      // mark that we just logged in so bot page can open a fresh chat
      try { sessionStorage.setItem('evolve_new_chat_on_login','true'); } catch {};
      window.location.replace("/");
    } catch (error: any) {
      // console.log("Login failed", error.message);
      setError("Login failed. Please check your credentials."); // Set the error message
      toast.error(error.message);
    } finally {
      setLoading(false); // Reset loading state after login attempt
    }
  };

  useEffect(() => {
    setButtonDisabled(!(user.email && user.password));
  }, [user]);


  return (
      <div className="h-full theme-text flex items-center justify-center">
      <div className="border border-[#2a2a2a] rounded-2xl p-6 sm:p-10 md:p-20 lg:px-40 theme-shadow bg-[#1a1a1a] mx-4 sm:mx-auto">
        <div className="flex flex-col md:flex-row w-full max-w-6xl mx-auto">
          {/* Left half with welcoming message and quote (hidden on small) */}
          <div className="hidden md:flex md:w-1/2 rounded-2xl theme-surface p-8 flex-col justify-center">
            {/* Logo and website name */}
            <div className="flex items-center justify-center mb-8">
              <img src="/logo.png" alt="Logo" className="w-12 h-12 mr-2" /> 
              <h1 className="text-2xl font-semibold">EVOLVE</h1>
            </div>
            <h2 className="text-3xl font-bold mb-6 text-left">Welcome back!</h2>
            <p className="text-lg text-left">Login to access your creator toolkit.</p>
          </div>
          {/* Right half with login form */}
          <div className="w-full md:w-1/2 rounded-2xl theme-surface p-8">
            {/* mobile header above form */}
            <div className="flex flex-col items-center mb-6 md:hidden">
              <img src="/logo.png" alt="Logo" className="w-10 h-10 mb-2" />
              <h1 className="text-2xl font-semibold">EVOLVE</h1>
              <h2 className="text-2xl font-bold mt-2">Welcome back!</h2>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Login</h2>
            <form className="space-y-4">
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
                  placeholder="Enter the email"
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
                    placeholder="Enter the password"
                    autoComplete='current-password'
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-200"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      // eye-off (Heroicons)
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.269-2.943-9.543-7a9.968 9.968 0 012.223-3.502M9.879 9.879A3 3 0 0114.121 14.12" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.225 6.225l11.55 11.55" />
                      </svg>
                    ) : (
                      // eye (Heroicons)
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              {error && <p className="text-red-500 text-xs italic">{error}</p>} 
              <button
                onClick={onLogin}
                className="w-full py-2 px-4 theme-accent-bg cursor-pointer font-semibold rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-75"
                disabled={buttonDisabled || loading} 
              >
                {loading ? "..." : "Login"} 
              </button>
            </form>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-sm theme-muted">
              <p className="text-gray-300">Don't have an account? <Link href="/signup" className="text-gray-300 hover:text-white underline">Sign Up</Link></p>
              <p><Link href="/forgot-password" className="text-gray-300 hover:text-white underline">Forgot Password?</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  
}
