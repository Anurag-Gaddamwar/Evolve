"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const createInitialChat = () => ({
  id: createId(),
  title: 'New chat',
  updatedAt: Date.now(),
  pinned: false,
  messages: [],
});

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'so', 'to', 'of', 'in', 'on', 'for', 'with', 'at', 'from',
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'it', 'this', 'that', 'these', 'those', 'i', 'you',
  'we', 'they', 'he', 'she', 'my', 'your', 'our', 'their', 'me', 'him', 'her', 'them', 'do', 'does', 'did',
  'can', 'could', 'should', 'would', 'will', 'just', 'about', 'what', 'which', 'who', 'when', 'where', 'why',
  'how', 'hi', 'hello', 'yes', 'no', 'ok', 'okay', 'there', 'here', 'please'
]);

const deriveChatTitle = (messages = []) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    return 'New chat';
  }

  const relevant = messages
    .filter((msg) => (msg.role === 'user' || msg.role === 'assistant') && typeof msg.text === 'string')
    .slice(-10);

  const frequency = new Map();
  for (const msg of relevant) {
    const words = msg.text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOPWORDS.has(word));

    for (const word of words) {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    }
  }

  const topWords = [...frequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word);

  if (topWords.length > 0) {
    return topWords
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' • ')
      .slice(0, 48);
  }

  const firstUserMessage = messages.find((msg) => msg.role === 'user' && typeof msg.text === 'string' && msg.text.trim());
  if (firstUserMessage) {
    const text = firstUserMessage.text.trim();
    return `${text.slice(0, 34)}${text.length > 34 ? '…' : ''}`;
  }

  return 'New chat';
};

function BotChat() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState('');
  const [chatSessionId, setChatSessionId] = useState('');
  const [userInitial, setUserInitial] = useState('U');
  const [input, setInput] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [mobileViewportTop, setMobileViewportTop] = useState(0);
  const [openMenuChatId, setOpenMenuChatId] = useState('');
  const [renameChatId, setRenameChatId] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [hasLoadedChats, setHasLoadedChats] = useState(false);
  const messageContainerRef = useRef(null);
  const inputRef = useRef(null);
  const shouldStickToBottomRef = useRef(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

    const detectKeyboard = () => {
      const keyboardOpen = window.innerHeight - viewport.height > 120;
      setIsKeyboardOpen(keyboardOpen);
      setMobileViewportTop(viewport.offsetTop || 0);
    };

    detectKeyboard();
    viewport.addEventListener('resize', detectKeyboard);
    viewport.addEventListener('scroll', detectKeyboard);
    return () => {
      viewport.removeEventListener('resize', detectKeyboard);
      viewport.removeEventListener('scroll', detectKeyboard);
    };
  }, [isMobile]);

  const closeMobileHistory = useCallback(() => {
    setIsMobileHistoryOpen(false);
  }, []);

  const goToProfile = useCallback(() => {
    closeMobileHistory();
    router.push('/profile');
  }, [closeMobileHistory, router]);

  const goToAnalytics = useCallback(() => {
    closeMobileHistory();
    router.push('/analytics');
  }, [closeMobileHistory, router]);

  const goToBot = useCallback(() => {
    closeMobileHistory();
    router.push('/bot');
  }, [closeMobileHistory, router]);

  useEffect(() => {
    setChatSessionId(createId());
  }, []);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    const loadChats = async () => {
      let hydratedChats = null;
      try {
        const response = await fetch('/api/users/chats', { method: 'GET' });
        if (response.status === 401) {
          router.push('/login');
          return;
        }

        if (response.ok) {
          const data = await response.json();
          const serverChats = Array.isArray(data?.chats) ? data.chats : [];
          if (serverChats.length) {
            hydratedChats = serverChats;
          }
        }
      } catch (_error) {
        // fallback to initial local in-memory chat
      }

      if (!hydratedChats) {
        const initial = createInitialChat();
        hydratedChats = [initial];
      }

      setChats(hydratedChats);
      setActiveChatId(hydratedChats[0]?.id || '');
      setHasLoadedChats(true);
    };

    loadChats();
  }, [router]);

  useEffect(() => {
    if (!hasLoadedChats) return;
    if (!activeChatId) return;
    if (!Array.isArray(chats)) return;

    const saveChats = async () => {
      try {
        await fetch('/api/users/chats', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ chats }),
        });
      } catch (_error) {
        // ignore save errors; user can continue chatting
      }
    };

    saveChats();
  }, [chats, hasLoadedChats, activeChatId]);

  useEffect(() => {
    shouldStickToBottomRef.current = true;
    setShowJumpToLatest(false);
    setOpenMenuChatId('');
  }, [activeChatId]);

  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const maxHeight = 260;
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [input]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!openMenuChatId) return;
      const clickedInsideMenu = event.target?.closest?.('[data-chat-actions-root="true"]');
      if (!clickedInsideMenu) {
        setOpenMenuChatId('');
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpenMenuChatId('');
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [openMenuChatId]);

  const activeChat = useMemo(() => chats.find((chat) => chat.id === activeChatId), [chats, activeChatId]);
  const activeMessages = activeChat?.messages || [];
  const filteredChats = useMemo(() => {
    const query = chatSearch.trim().toLowerCase();
    const sorted = chats
      .slice()
      .sort((a, b) => {
        const pinDiff = Number(!!b.pinned) - Number(!!a.pinned);
        if (pinDiff !== 0) return pinDiff;
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      });
    if (!query) return sorted;
    return sorted.filter((chat) => (chat.title || '').toLowerCase().includes(query));
  }, [chatSearch, chats]);

  const isChatEmpty = useCallback((chat) => !chat?.messages || chat.messages.length === 0, []);

  const scrollToLatest = useCallback((smooth = true) => {
    const container = messageContainerRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  const handleMessageScroll = () => {
    const container = messageContainerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - (container.scrollTop + container.clientHeight);
    const atBottom = distanceFromBottom < 72;
    shouldStickToBottomRef.current = atBottom;
    setShowJumpToLatest(!atBottom);
  };

  useEffect(() => {
    if (shouldStickToBottomRef.current) {
      requestAnimationFrame(() => scrollToLatest(false));
      setShowJumpToLatest(false);
    }
  }, [activeMessages.length, isSending, scrollToLatest]);

  const createNewChat = () => {
    const active = chats.find((chat) => chat.id === activeChatId);
    if (active && isChatEmpty(active)) {
      setActiveChatId(active.id);
      setError('');
      return;
    }

    const existingEmpty = chats.find((chat) => chat.id !== activeChatId && isChatEmpty(chat));
    if (existingEmpty) {
      setActiveChatId(existingEmpty.id);
      setError('');
      return;
    }

    const newChat = createInitialChat();
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    closeMobileHistory();
    shouldStickToBottomRef.current = true;
    setShowJumpToLatest(false);
    setInput('');
    setError('');
  };

  const deleteChat = (chatId) => {
    setOpenMenuChatId('');
    // keep history open when user deletes a chat
    setChats((prev) => {
      const filtered = prev.filter((chat) => chat.id !== chatId);
      if (filtered.length) {
        if (activeChatId === chatId) {
          setActiveChatId(filtered[0].id);
        }
        return filtered;
      }
      const fallback = createInitialChat();
      setActiveChatId(fallback.id);
      return [fallback];
    });
  };

  const startRenameChat = (chatId) => {
    const target = chats.find((chat) => chat.id === chatId);
    if (!target) return;

    setRenameChatId(chatId);
    setRenameValue(target.title || 'New chat');
    setOpenMenuChatId('');
  };

  const confirmRenameChat = () => {
    const chatId = renameChatId;
    const trimmed = renameValue.trim();
    if (!chatId || !trimmed) {
      setRenameChatId('');
      setRenameValue('');
      return;
    }

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === renameChatId
          ? { ...chat, title: trimmed.slice(0, 48), updatedAt: Date.now() }
          : chat
      )
    );
    setRenameChatId('');
    setRenameValue('');
  };

  const cancelRenameChat = () => {
    setRenameChatId('');
    setRenameValue('');
  };

  const togglePinChat = (chatId) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? { ...chat, pinned: !chat.pinned }
          : chat
      )
    );
    setOpenMenuChatId('');
  };

  const updateChatMessages = (chatId, updater) => {
    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== chatId) return chat;
        const nextMessages = typeof updater === 'function' ? updater(chat.messages) : updater;
        const title = deriveChatTitle(nextMessages);
        return {
          ...chat,
          messages: nextMessages,
          title,
          updatedAt: Date.now(),
        };
      })
    );
  };

  const handleSendClick = async () => {
    const message = input.trim();
    if (!message || !activeChatId || isSending) return;

    closeMobileHistory();
    setError('');
    setInput('');
    setIsSending(true);
    shouldStickToBottomRef.current = true;

    const userMessage = {
      id: createId(),
      role: 'user',
      text: message,
      createdAt: Date.now(),
    };

    const targetChatId = activeChatId;
    const chatSnapshot = chats.find((chat) => chat.id === targetChatId);
    const priorHistory = (chatSnapshot?.messages || [])
      .filter(
        (msg) =>
          (msg.role === 'user' || msg.role === 'assistant') &&
          typeof msg.text === 'string'
      )
      .map((msg) => ({
        from: msg.role === 'assistant' ? 'assistant' : 'user',
        text: msg.text,
      }))
      .slice(-20);

    updateChatMessages(targetChatId, (prev) => [...prev, userMessage]);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/bot-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userRequest: message,
          chatSessionId,
          chatId: targetChatId,
          chatHistory: priorHistory,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const assistantText = (data.text || 'I could not generate a response.').replace(/Assistant:/g, '').trim();

      updateChatMessages(targetChatId, (prev) => [
        ...prev,
        {
          id: createId(),
          role: 'assistant',
          text: assistantText,
          createdAt: Date.now(),
        },
      ]);
    } catch (requestError) {
      setError('Error generating response. Please try again.');
      updateChatMessages(targetChatId, (prev) => [
        ...prev,
        {
          id: createId(),
          role: 'assistant',
          text: 'Sorry, I could not respond right now. Please try again.',
          createdAt: Date.now(),
        },
      ]);
      console.error('Error fetching bot response:', requestError);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendClick();
    }
  };

  const handleInputChange = (event) => {
    const nextValue = event.target.value;
    setInput(nextValue);

    const textarea = inputRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const maxHeight = 260;
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  };

  if (!isMounted) {
    return <div className="h-screen w-full bg-[#212121]" style={{ height: '100dvh' }} />;
  }

  return (
    <div
      className="h-screen w-full overflow-hidden bg-[#212121] text-[#ececec]"
      style={{ height: '100dvh' }}
    >
      <div className="h-full w-full flex">
        <aside className="hidden md:flex h-full w-[60px] shrink-0 border-r border-[#2a2a2a] bg-[#171717] flex-col items-center py-3 gap-3">
          <div className="w-8 h-8 rounded-full bg-[#202020] border border-[#313131] flex items-center justify-center text-xs">◎</div>
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && window.innerWidth < 768) {
                setIsMobileHistoryOpen((prev) => !prev);
                return;
              }
              setIsSidebarCollapsed((prev) => !prev);
            }}
            className="w-9 h-9 rounded-lg border border-[#333] text-[#d9d9d9] hover:bg-[#232323]"
            title={isMobileHistoryOpen ? 'Close chats' : 'Open chats'}
            aria-label={isMobileHistoryOpen ? 'Close chats' : 'Open chats'}
          >
            {(typeof window !== 'undefined' && window.innerWidth < 768)
              ? (isMobileHistoryOpen ? '»' : '«')
              : (isSidebarCollapsed ? '»' : '«')}
          </button>

          <div className="mt-auto flex flex-col items-center gap-3">
            <div className="mb-1 flex flex-col items-center">
              <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] uppercase tracking-[0.28em] text-[#7f7f7f]">
                Features
              </span>
              <span className="text-[10px] text-[#7f7f7f] leading-none">↑</span>
            </div>
            <button
              onClick={goToBot}
              className="w-9 h-9 rounded-lg border border-[#333] text-[#d9d9d9] hover:bg-[#232323]"
              title="Open bot"
              aria-label="Open bot"
            >
              ✦
            </button>
            <button
              onClick={goToAnalytics}
              className="w-9 h-9 rounded-lg border border-[#333] text-[#d9d9d9] hover:bg-[#232323]"
              title="Open analysis"
              aria-label="Open analysis"
            >
              ◉
            </button>

          <button
            onClick={goToProfile}
            className="w-8 h-8 rounded-full bg-[#1f7f67] text-[11px] font-semibold flex items-center justify-center hover:opacity-95"
            title="Profile"
            aria-label="Open profile"
          >
            {userInitial}
          </button>
          </div>
        </aside>

        <aside
          className={`hidden md:block h-full shrink-0 border-r border-[#2a2a2a] bg-[#171717] transition-all duration-200 overflow-hidden ${
            isSidebarCollapsed ? 'w-0' : 'w-[245px]'
          }`}
        >
          <div className="h-full flex flex-col">
            <div className="h-14 px-4 border-b border-[#2a2a2a] flex items-center justify-between">
              <div className="font-semibold text-[15px]">Evolve</div>
            </div>

            <div className="p-3 border-b border-[#2a2a2a]">
              <button
                onClick={createNewChat}
                className="w-full rounded-lg border border-[#3b3b3b] bg-[#1f1f1f] px-3 py-2 text-sm text-left hover:bg-[#262626]"
              >
                + New chat
              </button>
            </div>

            <div className="px-3 py-3 border-b border-[#2a2a2a]">
              <input
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                className="w-full rounded-lg bg-[#111] border border-[#2f2f2f] px-3 py-2 text-sm text-[#d6d6d6] placeholder:text-[#a0a0a0] outline-none"
                placeholder="Search chats"
              />
            </div>

            <div className="px-3 pt-3 text-xs uppercase tracking-wide text-[#9f9f9f]">Your chats</div>
            <div className="flex-1 min-h-0 overflow-y-auto app-scrollbar px-2 py-2">
              <div data-chat-actions-root="true">
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`group relative flex items-center justify-between rounded-lg px-2 py-2 mb-1 cursor-pointer border ${
                    chat.id === activeChatId
                      ? 'bg-[#242424] border-[#3a3a3a]'
                      : 'bg-transparent border-transparent hover:bg-[#1f1f1f]'
                  }`}
                  onClick={() => setActiveChatId(chat.id)}
                >
                  <span className="text-sm truncate pr-2">
                    {chat.pinned && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="w-3.5 h-3.5 inline-block mr-1 align-[-2px]"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 4h6l-1 5 3 3H7l3-3-1-5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v8" />
                      </svg>
                    )}
                    {chat.title || 'New chat'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuChatId((prev) => (prev === chat.id ? '' : chat.id));
                    }}
                    className="text-lg leading-none text-[#9f9f9f] hover:text-white px-1"
                    aria-label={`Open actions for ${chat.title || 'chat'}`}
                    title="Chat actions"
                  >
                    ⋯
                  </button>

                  {openMenuChatId === chat.id && (
                    <div
                      className="absolute right-1 top-9 z-20 w-36 rounded-md border border-[#3a3a3a] bg-[#1c1c1c] shadow-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => startRenameChat(chat.id)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-[#2a2a2a] flex items-center gap-2"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="w-4 h-4"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h4l10-10-4-4L4 16v4z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6l4 4" />
                        </svg>
                        <span>Rename</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => togglePinChat(chat.id)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-[#2a2a2a] flex items-center gap-2"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="w-4 h-4"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 4h6l-1 5 3 3H7l3-3-1-5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v8" />
                        </svg>
                        <span>{chat.pinned ? 'Unpin' : 'Pin'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteChat(chat.id)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-[#2a2a2a] text-red-300 flex items-center gap-2"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="w-4 h-4"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 6V4h8v2" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14H6L5 6" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6M14 11v6" />
                        </svg>
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
              </div>
              {filteredChats.length === 0 && (
                <div className="px-2 py-3 text-xs text-[#8f8f8f]">No chats found.</div>
              )}
            </div>
          </div>
        </aside>

        <section className="flex-1 min-w-0 min-h-0 flex flex-col bg-[#212121]">
          <header
            className="fixed top-0 inset-x-0 z-30 h-14 px-4 md:px-6 border-b border-[#2a2a2a] bg-[#212121] flex items-center md:justify-start md:static md:z-auto"
            style={isMobile ? { transform: `translateY(${mobileViewportTop}px)` } : undefined}
          >
            <div className="flex items-center gap-2 font-semibold text-[28px] md:text-[30px] leading-none">
              <span className="text-[29px] md:text-[31px]">Content Assistant</span>
            </div>
            <button
              onClick={async () => {
                try {
                  await fetch('/api/users/logout', { method: 'GET' });
                  router.push('/login');
                } catch (error) {
                  console.error('Logout failed:', error);
                }
              }}
              className="ml-auto rounded-lg border border-[#3a3a3a] bg-[#242424] px-3 py-1 text-sm hover:bg-[#2f2f2f] transition-colors"
            >
              Logout
            </button>
          </header>

          <div
            ref={messageContainerRef}
            onScroll={handleMessageScroll}
            className={`flex-1 min-h-0 overflow-y-auto app-scrollbar ${
              isMobile ? (isKeyboardOpen ? 'pt-14 pb-[88px]' : 'pt-14 pb-[150px]') : 'pb-0'
            }`}
          >
            <div className="max-w-[900px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-5">
              {activeMessages.length === 0 && (
                <div className="text-center text-[#a5a5a5] mt-20">
                  Start a new conversation
                </div>
              )}

              {activeMessages.map((message) => (
                <div key={message.id} className={`w-full ${message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`}>
                  <div
                    className={`max-w-[85%] md:max-w-3xl whitespace-pre-wrap rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 text-[15px] md:text-base leading-6 md:leading-8 ${
                      message.role === 'user'
                        ? 'bg-[#2d2d2d] text-[#f3f3f3]'
                        : 'bg-[#2a2a2a] text-[#ededed] border border-[#383838]'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}

              {isSending && (
                <div className="w-full flex justify-start">
                  <div className="max-w-[85%] md:max-w-3xl rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 text-[15px] md:text-base leading-6 md:leading-8 bg-[#2a2a2a] border border-[#383838] text-[#bdbdbd]">
                    Thinking...
                  </div>
                </div>
              )}

              {showJumpToLatest && (
                <div className={`sticky ${isMobile ? (isKeyboardOpen ? 'bottom-[88px]' : 'bottom-[120px]') : 'bottom-2'} flex justify-center`}>
                  <button
                    onClick={() => {
                      shouldStickToBottomRef.current = true;
                      scrollToLatest();
                    }}
                    className="text-xs rounded-full border border-[#3a3a3a] bg-[#2a2a2a] px-3 py-1 text-[#c8c8c8] hover:text-white"
                  >
                    Jump to latest
                  </button>
                </div>
              )}
            </div>
          </div>

          {!isMobile && (
          <div className="shrink-0 border-t border-[#2a2a2a] px-4 md:px-6 py-4">
            <div className="max-w-[900px] mx-auto">
              <div className="rounded-[26px] border border-[#3a3a3a] bg-[#2a2a2a] px-4 py-3 flex items-end gap-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Ask Evolve"
                  className="w-full bg-transparent outline-none resize-none text-[#ececec] placeholder:text-[#a4a4a4] leading-7 py-1.5 min-h-[28px] max-h-[260px] overflow-y-auto app-scrollbar"
                />
                <button
                  onClick={handleSendClick}
                  disabled={isSending || !input.trim()}
                  className="h-11 min-w-11 rounded-full bg-[#3b3b3b] px-4 text-sm text-white disabled:opacity-45 self-end"
                >
                  Send
                </button>
              </div>
              {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
            </div>
          </div>
          )}
        </section>

        {isMobile && (
          <div className={`md:hidden fixed inset-x-0 ${isKeyboardOpen ? 'bottom-0' : 'bottom-[61px]'} z-30 border-t border-[#2a2a2a] bg-[#212121] px-4 py-3`}>
            <div className="max-w-[900px] mx-auto">
              <div className="rounded-[26px] border border-[#3a3a3a] bg-[#2a2a2a] px-4 py-3 flex items-end gap-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Ask Evolve"
                  className="w-full bg-transparent outline-none resize-none text-[#ececec] placeholder:text-[#a4a4a4] leading-7 py-1.5 min-h-[28px] max-h-[260px] overflow-y-auto app-scrollbar"
                />
                <button
                  onClick={handleSendClick}
                  disabled={isSending || !input.trim()}
                  className="h-11 min-w-11 rounded-full bg-[#3b3b3b] px-4 text-sm text-white disabled:opacity-45 self-end"
                >
                  Send
                </button>
              </div>
              {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
            </div>
          </div>
        )}

        {isMobile && !isKeyboardOpen && (
          <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-[61px] border-t border-[#2a2a2a] bg-[#171717] px-3 py-2">
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setIsMobileHistoryOpen(true)}
                className="h-11 rounded-lg border border-[#333] text-[#d9d9d9] hover:bg-[#232323] text-sm"
                aria-label="Open chats"
              >
                Chats
              </button>
              <button
                onClick={goToBot}
                className="h-11 rounded-lg border border-[#3a3a3a] bg-[#242424] text-white text-sm"
                aria-label="Open assistant"
              >
                Assistant
              </button>
              <button
                onClick={goToAnalytics}
                className="h-11 rounded-lg border border-[#333] text-[#d9d9d9] hover:bg-[#232323] text-sm"
                aria-label="Open analysis"
              >
                Analysis
              </button>
              <button
                onClick={goToProfile}
                className="h-11 rounded-lg border border-[#333] text-[#d9d9d9] hover:bg-[#232323] text-sm"
                aria-label="Open profile"
              >
                Profile
              </button>
            </div>
          </nav>
        )}

        <div
          className={`md:hidden fixed inset-0 z-40 transition-opacity duration-200 ${
            isMobileHistoryOpen ? 'opacity-100 pointer-events-auto bg-black/60' : 'opacity-0 pointer-events-none bg-black/0'
          }`}
          onClick={closeMobileHistory}
        >
          <div
            className={`h-full w-[280px] max-w-[85vw] bg-[#171717] border-r border-[#2a2a2a] flex flex-col transform transition-transform duration-250 ease-out ${
              isMobileHistoryOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
              <div className="h-14 px-4 border-b border-[#2a2a2a] flex items-center justify-between">
                <div className="font-semibold text-[15px]">Evolve</div>
                <button
                  onClick={closeMobileHistory}
                  className="text-xs rounded-md border border-[#343434] px-2 py-1 hover:bg-[#222]"
                  aria-label="Close chats"
                >
                  Close
                </button>
              </div>

              <div className="p-3 border-b border-[#2a2a2a]">
                <button
                  onClick={createNewChat}
                  className="w-full rounded-lg border border-[#3b3b3b] bg-[#1f1f1f] px-3 py-2 text-sm text-left hover:bg-[#262626]"
                >
                  + New chat
                </button>
              </div>

              <div className="px-3 py-3 border-b border-[#2a2a2a]">
                <input
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  className="w-full rounded-lg bg-[#111] border border-[#2f2f2f] px-3 py-2 text-sm text-[#d6d6d6] placeholder:text-[#a0a0a0] outline-none"
                  placeholder="Search chats"
                />
              </div>

              <div className="px-3 pt-3 text-xs uppercase tracking-wide text-[#9f9f9f]">Your chats</div>
              <div className="flex-1 min-h-0 overflow-y-auto app-scrollbar px-2 py-2">
                <div data-chat-actions-root="true">
                {filteredChats.map((chat) => (
                  <div
                    key={`m-${chat.id}`}
                    className={`group relative flex items-center justify-between rounded-lg px-2 py-2 mb-1 cursor-pointer border ${
                      chat.id === activeChatId
                        ? 'bg-[#242424] border-[#3a3a3a]'
                        : 'bg-transparent border-transparent hover:bg-[#1f1f1f]'
                    }`}
                    onClick={() => {
                      setActiveChatId(chat.id);
                      closeMobileHistory();
                    }}
                  >
                    <span className="text-sm truncate pr-2">
                      {chat.pinned && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="w-3.5 h-3.5 inline-block mr-1 align-[-2px]"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 4h6l-1 5 3 3H7l3-3-1-5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v8" />
                        </svg>
                      )}
                      {chat.title || 'New chat'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuChatId((prev) => (prev === chat.id ? '' : chat.id));
                      }}
                      className="text-lg leading-none text-[#9f9f9f] hover:text-white px-1"
                      aria-label={`Open actions for ${chat.title || 'chat'}`}
                      title="Chat actions"
                    >
                      ⋯
                    </button>

                    {openMenuChatId === chat.id && (
                      <div
                        className="absolute right-1 top-9 z-20 w-36 rounded-md border border-[#3a3a3a] bg-[#1c1c1c] shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => startRenameChat(chat.id)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-[#2a2a2a] flex items-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h4l10-10-4-4L4 16v4z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6l4 4" />
                          </svg>
                          <span>Rename</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => togglePinChat(chat.id)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-[#2a2a2a] flex items-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 4h6l-1 5 3 3H7l3-3-1-5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v8" />
                          </svg>
                          <span>{chat.pinned ? 'Unpin' : 'Pin'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteChat(chat.id)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-[#2a2a2a] text-red-300 flex items-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 6V4h8v2" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14H6L5 6" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6M14 11v6" />
                          </svg>
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                </div>
                {filteredChats.length === 0 && (
                  <div className="px-2 py-3 text-xs text-[#8f8f8f]">No chats found.</div>
                )}
              </div>
          </div>
        </div>

        {renameChatId && (
          <div
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4"
            onClick={cancelRenameChat}
          >
            <div
              className="w-full max-w-md rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-semibold mb-3">Rename chat</h3>
              <input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmRenameChat();
                  if (e.key === 'Escape') cancelRenameChat();
                }}
                className="w-full rounded-lg bg-[#111] border border-[#2f2f2f] px-3 py-2 text-sm text-[#d6d6d6] placeholder:text-[#a0a0a0] outline-none"
                placeholder="Enter chat name"
                autoFocus
              />
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelRenameChat}
                  className="rounded-md border border-[#343434] px-3 py-1.5 text-sm hover:bg-[#222]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmRenameChat}
                  className="rounded-md bg-[#3b3b3b] px-3 py-1.5 text-sm text-white hover:opacity-90"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BotChat;
