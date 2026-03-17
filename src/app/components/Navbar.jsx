"use client";
import React from 'react';
import { useTheme } from './ThemeProvider';

const Navbar = () => {
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/users/logout', { method: 'GET' });
      if (response.ok) {
        // Clear the token from the client-side as well
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
        window.location.replace('/login'); // Redirect to login page
      } else {
        console.error('Logout failed:', response.statusText);
      }
    } catch (error) {
      console.error('Logout failed:', error.message);
    }
  };

  const { theme, toggleTheme } = useTheme();

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  return (
    <nav className="theme-surface theme-text px-4 py-2 border-b theme-border theme-shadow z-20">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* left: logo */}
        <div className="flex items-center space-x-2">
          <img
            src="/logo.png"
            alt="Evolve"
            className="h-6 w-6"
          />
          <a href="/" className="font-semibold text-xl theme-text">
            Evolve
          </a>
        </div>

        {/* center: search (hidden on xs) */}
        <div className="flex-1 mx-4 hidden sm:block">
          <form action="/search" method="GET">
            <input
              type="text"
              name="q"
              placeholder="Search"
              className="w-full px-4 py-2 rounded-full theme-input"
            />
          </form>
        </div>

        {/* right: links/logout (hidden on small screens) */}
        <div className="hidden md:flex items-center space-x-4">
          <a href="/analytics" className="theme-link">Analyze</a>
          <div className="group relative">
            <div className="inline-flex items-center theme-link bg-gradient-to-r from-transparent via-[#4ade80]/20 to-transparent p-1 rounded-full group">
              Features
              <div className="inline-flex items-center ml-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 animate-spin theme-text/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="animation-duration: 2s;">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12v6a2 2 0 002 2h6a2 2 0 002-2v-6M5 12H3a2 2 0 00-2 2v4a2 2 0 002 2h4a2 2 0 002-2v-4a2 2 0 00-2-2z" />
                </svg>
                <div className="w-2 h-2 bg-gradient-to-r from-[#4ade80] to-[#059669] rounded-full ml-2 animate-ping absolute"></div>
                <div className="w-2 h-2 bg-gradient-to-r from-[#4ade80] to-[#059669] rounded-full ml-2 animate-pulse relative"></div>
              </div>
            </div>
            <div className="absolute left-0 top-full mt-2 w-48 bg-[#1a1a1a]/95 backdrop-blur-sm border border-[#2a2a2a] rounded-xl shadow-2xl opacity-0 invisible scale-95 -translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:scale-100 group-hover:translate-y-0 transition-all duration-300 ease-out z-50 p-1">
              <a href="/bot" className="flex items-center gap-2 px-4 py-3 theme-link hover:bg-[#2a2a2a]/50 rounded-lg transition-all duration-200">🤖 AI Bot</a>
              <a href="/analytics" className="flex items-center gap-2 px-4 py-3 theme-link hover:bg-[#2a2a2a]/50 rounded-lg transition-all duration-200">📊 Analytics</a>
              <a href="/profile" className="flex items-center gap-2 px-4 py-3 theme-link hover:bg-[#2a2a2a]/50 rounded-lg transition-all duration-200">👤 Profile</a>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="px-3 py-1 rounded-full border theme-border theme-surface theme-text text-sm"
          >
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <button onClick={handleLogout} className="theme-link">Logout</button>
        </div>

        {/* mobile hamburger */}
        <button
          onClick={() => setMobileMenuOpen((o) => !o)}
          className="md:hidden p-2 focus:outline-none"
          aria-label="Toggle menu"
        >
          <span className="block w-6 h-0.5 bg-current mb-1"></span>
          <span className="block w-6 h-0.5 bg-current mb-1"></span>
          <span className="block w-6 h-0.5 bg-current"></span>
        </button>
      </div>

      {/* mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#171717] border-t border-[#2a2a2a]">
          <div className="flex flex-col px-4 py-2 space-y-2">
            <a href="/analytics" className="theme-link block">Analyze</a>
            <a href="/bot" className="theme-link block">Imaginate</a>
            <a href="/profile" className="theme-link block">Profile</a>
            <button onClick={toggleTheme} className="px-3 py-1 rounded-full border theme-border theme-surface theme-text text-sm w-full text-left">
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <button onClick={handleLogout} className="theme-link block text-left">Logout</button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
