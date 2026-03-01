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

        {/* center: search */}
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

        {/* right: links/logout */}
        <div className="flex items-center space-x-4">
          <a href="/analytics" className="theme-link">Analyze</a>
          <a href="/bot" className="theme-link">Imaginate</a>
          <a href="/profile" className="theme-link">Profile</a>
          <button
            onClick={toggleTheme}
            className="px-3 py-1 rounded-full border theme-border theme-surface theme-text text-sm"
          >
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <button onClick={handleLogout} className="theme-link">Logout</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
