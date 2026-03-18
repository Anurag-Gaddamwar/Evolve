'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { BotChatProvider, useBotChat } from './BotChatContext';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  {
    id: 'bot',
    href: '/bot',
    icon: '✦',
    isActive: (path: string) =>
      path === '/' || path === '/bot' || path.startsWith('/bot/'),
  },
  {
    id: 'analytics',
    href: '/analytics',
    icon: '◉',
    isActive: (path: string) =>
      path === '/analytics' || path.startsWith('/analytics/'),
  },
];

interface Props {
  title?: string;
  children: React.ReactNode;
  showSidebar?: boolean;
}

export default function AppSidebarShell({
  title = 'Evolve',
  children,
  showSidebar = true,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const isBotPage = pathname?.startsWith('/bot');

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const [userInitial, setUserInitial] = useState('U');

  const activePath = pathname || '';

  const handleNavigate = useCallback(
    (href: string) => router.push(href),
    [router]
  );

  // ================= USER =================
useEffect(() => {
  const loadUser = async () => {
    try {
      const res = await fetch('/api/users/me');
      if (!res.ok) return;

      const data = await res.json();

      const username = data?.data?.username || '';
      const email = data?.data?.email || '';

      const source = username || email;
      const initial = source ? source.charAt(0).toUpperCase() : 'U';

      setUserInitial(initial);
    } catch {
      // fallback stays "U"
    }
  };

  loadUser();
}, []);

  // ================= MOBILE =================
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ================= NAV BUTTON =================
  const NavButton = ({ item }: { item: (typeof navItems)[0] }) => {
    const isActive = item.isActive(activePath);

    return (
      <button
        onClick={() => handleNavigate(item.href)}
        className={`w-9 h-9 rounded-lg border text-[#d9d9d9] transition-colors flex items-center justify-center ${
          isActive
            ? 'border-[#3a3a3a] bg-[#242424] text-white'
            : 'border-[#333] hover:bg-[#232323]'
        }`}
      >
        {item.icon}
      </button>
    );
  };

  // ================= PROFILE =================
  const ProfileBtn = () => (
  <button
    onClick={() => handleNavigate('/profile')}
    className={`w-8 h-8 rounded-full text-[11px] font-semibold flex items-center justify-center transition-colors ${
      activePath.startsWith('/profile')
        ? 'bg-[#24a587] text-white'
        : 'bg-[#1f7f67] hover:opacity-95'
    }`}
    title="Profile"
  >
    {userInitial}
  </button>
);

  // ================= BOT CHAT SIDEBAR =================
  const BotSidebar = () => {
    const {
      filteredChats,
      createNewChat,
      chatSearch,
      setChatSearch,
      selectChat,
      activeChatId,
    } = useBotChat();

    return (
      <aside
        className={`transition-all duration-200 ${
          sidebarCollapsed ? 'w-0' : 'w-[260px]'
        } bg-[#171717] border-r border-[#2a2a2a] overflow-hidden`}
      >
        <div className="p-3 border-b border-[#2a2a2a]">
          <button
            onClick={createNewChat}
            className="w-full rounded-lg border border-[#3b3b3b] bg-[#1f1f1f] px-3 py-2 text-sm hover:bg-[#262626]"
          >
            + New chat
          </button>
        </div>

        <div className="p-3 border-b border-[#2a2a2a]">
          <input
            value={chatSearch}
            onChange={e => setChatSearch(e.target.value)}
            className="w-full rounded-lg bg-[#111] border border-[#2f2f2f] px-3 py-2 text-sm"
            placeholder="Search chats"
          />
        </div>

        <div className="p-2">
          {filteredChats.map(chat => (
            <div
              key={chat.id}
              onClick={() => selectChat(chat.id)}
              className={`p-2 rounded cursor-pointer ${
                chat.id === activeChatId
                  ? 'bg-[#242424]'
                  : 'hover:bg-[#1f1f1f]'
              }`}
            >
              {chat.title}
            </div>
          ))}
        </div>
      </aside>
    );
  };

  // ================= LAYOUT =================
  const Layout = () => (
    <div className="flex h-full bg-[#212121] text-[#ececec]">
      {/* LEFT SIDEBAR */}
      {showSidebar && !isMobile && (
        <aside className="flex w-[60px] border-r border-[#2a2a2a] bg-[#171717] flex-col items-center py-3">
          <div className="w-8 h-8 rounded-full bg-[#202020] flex items-center justify-center">
            ◎
          </div>

          {isBotPage && (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="mt-2 w-9 h-9 rounded-lg border border-[#333] hover:bg-[#232323]"
            >
              »
            </button>
          )}

          <div className="mt-auto flex flex-col gap-3 items-center">
            {navItems.map(item => (
              <NavButton key={item.id} item={item} />
            ))}

            <ProfileBtn />
          </div>
        </aside>
      )}

      {/* BOT SIDEBAR */}
      {isBotPage && !sidebarCollapsed && <BotSidebar />}

      {/* MAIN */}
      <section className="flex-1 flex flex-col">
        <header className="h-12 px-4 border-b border-[#2a2a2a] bg-[#171717] flex items-center">
          <span className="font-semibold text-[18px]">{title}</span>
        </header>

        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </section>
    </div>
  );

  return isBotPage ? (
    <BotChatProvider>
      <Layout />
    </BotChatProvider>
  ) : (
    <Layout />
  );
}