'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  {
    id: 'bot',
    href: '/bot',
    icon: '✦',
    label: 'Bot',
    isActive: (path) => path === '/' || path === '/bot' || path.startsWith('/bot/'),
  },
  {
    id: 'analytics',
    href: '/analytics',
    icon: '◉',
    label: 'Analysis',
    isActive: (path) => path === '/analytics' || path.startsWith('/analytics/'),
  },
];

interface AppSidebarShellProps {
  title?: string;
  children: React.ReactNode;
  showSidebar?: boolean;
  showLogout?: boolean;
  headerLeft?: React.ReactNode;
}

export default function AppSidebarShell({ title = 'Evolve', children, showSidebar = true, showLogout = true, headerLeft = null }: AppSidebarShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [userInitial, setUserInitial] = useState('U');
  // start as mobile to avoid showing sidebar during hydration; update on mount
  const [isMobile, setIsMobile] = useState(true);
  const [mobileViewportTop, setMobileViewportTop] = useState(0);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile || typeof window === 'undefined') return;

    const viewport = window.visualViewport;
    if (!viewport) return;

    const syncViewportTop = () => {
      setMobileViewportTop(viewport.offsetTop || 0);
    };

    syncViewportTop();
    viewport.addEventListener('resize', syncViewportTop);
    viewport.addEventListener('scroll', syncViewportTop);
    return () => {
      viewport.removeEventListener('resize', syncViewportTop);
      viewport.removeEventListener('scroll', syncViewportTop);
    };
  }, [isMobile]);

  const effectiveShowSidebar = showSidebar && !isMobile;

  useEffect(() => {
    if (!showLogout) return;

    const loadUserInitial = async () => {
      try {
        const response = await fetch('/api/users/me', { method: 'GET' });
        if (!response.ok) return;

        const data = await response.json();
        const username = (data?.data?.username || '').toString().trim();
        const email = (data?.data?.email || '').toString().trim();

        const firstName = username ? username.split(/\s+/)[0] : '';
        const source = firstName || email;
        const initial = source ? source.charAt(0).toUpperCase() : 'U';
        setUserInitial(initial);
      } catch (_error) {
        // keep fallback initial
      }
    };

    loadUserInitial();
  }, [showLogout]);

  const handleNavigate = useCallback((href) => {
    router.push(href);
  }, [router]);
  const activePath = pathname || '';

  const navButtonClass = (isActive) =>
    `w-9 h-9 rounded-lg border text-[#d9d9d9] transition-colors ${
      isActive
        ? 'border-[#3a3a3a] bg-[#242424] text-white'
        : 'border-[#333] hover:bg-[#232323]'
    }`;

  return (
    <div
      className="h-full w-full overflow-x-hidden md:overflow-hidden bg-[#212121] text-[#ececec]"
    >
      <div className="min-h-full md:h-full w-full flex">
        {effectiveShowSidebar && (
          <aside className="flex h-full w-[60px] shrink-0 border-r border-[#2a2a2a] bg-[#171717] flex-col items-center py-3 gap-3">
            <div className="w-8 h-8 rounded-full bg-[#202020] border border-[#313131] flex items-center justify-center text-xs">◎</div>

            <div className="mt-auto flex flex-col items-center gap-3">
              <div className="mb-1 flex flex-col items-center">
                <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] uppercase tracking-[0.28em] text-[#7f7f7f]">
                  Features
                </span>
                <span className="text-[10px] text-[#7f7f7f] leading-none">↑</span>
              </div>

              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.href)}
                  className={navButtonClass(item.isActive(activePath))}
                  title={item.label}
                  aria-label={`Open ${item.label.toLowerCase()}`}
                >
                  {item.icon}
                </button>
              ))}

              <button
                onClick={() => handleNavigate('/profile')}
                className={`w-8 h-8 rounded-full text-[11px] font-semibold flex items-center justify-center transition-colors ${
                  activePath === '/profile' || activePath.startsWith('/profile/')
                    ? 'bg-[#24a587] text-white'
                    : 'bg-[#1f7f67] hover:opacity-95'
                }`}
                title="Profile"
                aria-label="Open profile"
              >
                {userInitial}
              </button>
            </div>
          </aside>
        )}

        <section className={`flex-1 min-w-0 min-h-0 flex flex-col bg-[#212121] ${effectiveShowSidebar ? '' : 'w-full'}`}>
          <header
            className="fixed top-0 inset-x-0 z-30 h-12 px-3 md:px-5 border-b border-[#2a2a2a] bg-[#171717] flex items-center justify-between md:static md:z-auto"
            style={isMobile ? { transform: `translateY(${mobileViewportTop}px)` } : undefined}
          >
            {/* optional left content (e.g. chat toggle) */}
            {headerLeft ? <div className="mr-2">{headerLeft}</div> : null}
            <div className="flex items-center gap-1 font-semibold text-[18px] md:text-[20px] leading-none">
              <span className="text-[19px] md:text-[21px]">{title}</span>
            </div>
            {showLogout && (
              <button
                onClick={async () => {
                  try {
                    await fetch('/api/users/logout', { method: 'GET' });
                    router.push('/login');
                  } catch (error) {
                    console.error('Logout failed:', error);
                  }
                }}
                className="rounded-lg border border-[#3a3a3a] bg-[#242424] px-3 py-1 text-sm hover:bg-[#2f2f2f] transition-colors"
              >
                Logout
              </button>
            )}
          </header>

          <div className="flex-1 min-h-0 overflow-visible md:overflow-y-auto app-scrollbar px-4 md:px-6 pt-[72px] md:pt-6 pb-24 md:py-6">
            {children}
          </div>

          {showSidebar && isMobile && (
            <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[#2a2a2a] bg-[#171717] px-3 py-2">
              <div className="grid grid-cols-3 gap-2">
                {navItems.map((item) => {
                  const active = item.isActive(activePath);
                  return (
                    <button
                      key={`mobile-${item.id}`}
                      onClick={() => handleNavigate(item.href)}
                      className={`h-11 rounded-lg border text-sm transition-colors ${
                        active
                          ? 'border-[#3a3a3a] bg-[#242424] text-white'
                          : 'border-[#333] text-[#d9d9d9] hover:bg-[#232323]'
                      }`}
                      aria-label={`Open ${item.label.toLowerCase()}`}
                    >
                      {item.label}
                    </button>
                  );
                })}
                <button
                  onClick={() => handleNavigate('/profile')}
                  className={`h-11 rounded-lg border text-sm transition-colors ${
                    activePath === '/profile' || activePath.startsWith('/profile/')
                      ? 'border-[#3a3a3a] bg-[#242424] text-white'
                      : 'border-[#333] text-[#d9d9d9] hover:bg-[#232323]'
                  }`}
                  aria-label="Open profile"
                >
                  Profile
                </button>
              </div>
            </nav>
          )}
        </section>

      </div>
    </div>
  );
}
