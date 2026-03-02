'use client';

import React from 'react';

/**
 * MobileHeader - A reusable header component for mobile screens
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.leftButton - Optional left button/element
 * @param {string} props.title - Title to display in the center (default: "Evolve")
 * @param {React.ReactNode} props.rightButton - Optional right button/element
 * @param {string} props.className - Optional additional CSS classes
 */
export default function MobileHeader({ 
  leftButton = null, 
  title = 'Evolve', 
  rightButton = null,
  className = ''
}) {
  return (
    <header className={`md:hidden fixed top-0 inset-x-0 z-30 h-14 border-b border-[#2a2a2a] bg-[#171717] px-4 flex items-center justify-between ${className}`}>
      <div className="flex items-center">
        {leftButton}
      </div>
      <div className="font-semibold text-[15px]">
        {title}
      </div>
      <div className="flex items-center">
        {rightButton}
      </div>
    </header>
  );
}
