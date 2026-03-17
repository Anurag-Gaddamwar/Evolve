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
            <button className="flex items-center gap-1 theme-link">
              Features 
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 group-hover:-translate-y-0.5 group-hover:animate-bounce theme-text transition-all duration-300 ease-in-out" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="absolute left-0 top-full mt-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 min-w-max">
              <a href="/bot" className="block px-4 py-2 theme-link hover:bg-[#2a2a2a]">AI Bot</a>
              <a href="/analytics" className="block px-4 py-2 theme-link hover:bg-[#2a2a2a]">Analytics</a>
              <a href="/profile" className="block px-4 py-2 theme-link hover:bg-[#2a2a2a]">Profile</a>
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
