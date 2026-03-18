'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
const createInitialChat = () => ({ id: createId(), title: 'New chat', updatedAt: Date.now(), pinned: false, messages: [] });

const STOPWORDS = new Set(['the','a','an','and','or','but','if','then','so','to','of','in','on','for','with','at','from','is','am','are','was','were','be','been','being','it','this','that','these','those','i','you','we','they','he','she','my','your','our','their','me','him','her','them','do','does','did','can','could','should','would','will','just','about','what','which','who','when','where','why','how','hi','hello','yes','no','ok','okay','there','here','please']);

const deriveChatTitle = (messages = []) => {
  if (!Array.isArray(messages) || !messages.length) return 'New chat';
  const freq = new Map();
  messages.filter(m => (m.role==='user'||m.role==='assistant') && typeof m.text==='string').slice(-10)
    .forEach(m => m.text.toLowerCase().replace(/[^a-z0-9\\s]/g,' ').split(/\\s+/).filter(w => w.length>2 && !STOPWORDS.has(w)).forEach(w => freq.set(w,(freq.get(w)||0)+1)));
  const top = [...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([w])=>w);
  if (top.length) return top.map(w=>w[0].toUpperCase()+w.slice(1)).join(' • ').slice(0,48);
  const first = messages.find(m=>m.role==='user'&&typeof m.text==='string'&&m.text.trim());
  if (first) { const t=first.text.trim(); return t.slice(0,34)+(t.length>34?'…':''); }
  return 'New chat';
};

interface Chat {
  id: string;
  title: string;
  messages: Array<{id: string; role: 'user' | 'assistant'; text: string; createdAt: number}>;
  pinned: boolean;
  updatedAt: number;
}

interface BotChatContextType {
  chats: Chat[];
  activeChatId: string;
  filteredChats: Chat[];
  chatSearch: string;
  setChatSearch: (search: string) => void;
  createNewChat: () => void;
  deleteChat: (id: string) => void;
  togglePin: (id: string) => void;
  startRename: (id: string) => void;
  confirmRename: () => void;
  cancelRename: () => void;
  renameChatId: string;
  renameValue: string;
  setRenameValue: (value: string) => void;
  openMenuId: string;
  setOpenMenuId: (id: string) => void;
  selectChat: (id: string) => void;
  updateMessages: (updater: ((msgs: any[]) => any[]) | any[]) => void;
}

const BotChatContext = createContext<BotChatContextType | null>(null);

export const useBotChat = () => {
  const context = useContext(BotChatContext);
  if (!context) throw new Error('useBotChat must be used within BotChatProvider');
  return context;
};

interface BotChatProviderProps {
  children: ReactNode;
}

export const BotChatProvider: React.FC<BotChatProviderProps> = ({ children }) => {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const [openMenuId, setOpenMenuId] = useState('');
  const [renameChatId, setRenameChatId] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [hasLoadedChats, setHasLoadedChats] = useState(false);

  const filteredChats = useMemo(() => {
    const q = chatSearch.trim().toLowerCase();
    const sorted = [...chats].sort((a,b)=>(Number(!!b.pinned)-Number(!!a.pinned))||((b.updatedAt||0)-(a.updatedAt||0)));
    return q ? sorted.filter(c=>(c.title||'').toLowerCase().includes(q)) : sorted;
  }, [chatSearch, chats]);

  const selectChat = useCallback((id: string) => {
    setActiveChatId(id);
    setOpenMenuId('');
  }, []);

  const updateMessages = useCallback((updater: ((msgs: any[]) => any[]) | any[]) => {
    setChats(prev => prev.map(c => {
      if (c.id !== activeChatId) return c;
      const next = typeof updater === 'function' ? updater(c.messages) : updater;
      return { ...c, messages: next, title: deriveChatTitle(next), updatedAt: Date.now() };
    }));
  }, [activeChatId]);

  const createNewChat = useCallback(() => {
    const active = chats.find(c => c.id === activeChatId);
    if (active && active.messages.length === 0) {
      toast('Switched to existing empty chat');
      return;
    }
    const empty = chats.find(c => c.id !== activeChatId && c.messages.length === 0);
    if (empty) {
      setActiveChatId(empty.id);
      toast('Reusing empty chat');
      return;
    }
    const nc = createInitialChat();
    setChats(p => [nc, ...p]);
    setActiveChatId(nc.id);
    toast.success('New chat created');
  }, [chats, activeChatId]);

  const deleteChat = useCallback((id: string) => {
    toast.success('Chat deleted');
    setOpenMenuId('');
    setChats(prev => {
      const f = prev.filter(c => c.id !== id);
      if (f.length) {
        if (activeChatId === id) setActiveChatId(f[0].id);
        return f;
      }
      const fb = createInitialChat();
      setActiveChatId(fb.id);
      return [fb];
    });
  }, [activeChatId]);

  const togglePin = useCallback((id: string) => {
    toast.success('Chat pinned state updated');
    setChats(p => p.map(c => c.id === id ? { ...c, pinned: !c.pinned } : c));
    setOpenMenuId('');
  }, []);

  const startRename = useCallback((id: string) => {
    const t = chats.find(c => c.id === id);
    if (!t) return;
    setRenameChatId(id);
    setRenameValue(t.title || 'New chat');
    setOpenMenuId('');
  }, [chats]);

  const confirmRename = useCallback(() => {
    const v = renameValue.trim();
    if (!renameChatId || !v) {
      setRenameChatId('');
      setRenameValue('');
      return;
    }
    const other = chats.find(c => c.id !== renameChatId && (c.title || '').toLowerCase() === v.toLowerCase());
    if (other) {
      toast.error('A chat with that name already exists.');
      return;
    }
    setChats(p => p.map(c => c.id === renameChatId ? { ...c, title: v.slice(0, 48) } : c));
    setRenameChatId('');
    setRenameValue('');
  }, [renameChatId, renameValue, chats]);

  const cancelRename = useCallback(() => {
    setRenameChatId('');
    setRenameValue('');
  }, []);

  // Load chats on mount
  useEffect(() => {
    const loadChats = async () => {
      try {
        const r = await fetch('/api/users/chats');
        if (r.status === 401) {
          router.push('/login');
          return;
        }
        if (r.ok) {
          const d = await r.json();
          const s = Array.isArray(d?.chats) ? d.chats : [];
          setChats(s.length ? s : [createInitialChat()]);
        }
        // Session logic...
        const SESSION_KEY = 'evolve_bot_session_active';
        const ACTIVE_CHAT_KEY = 'evolve_bot_active_chat_id';
        const existing = sessionStorage.getItem(SESSION_KEY);
        const storedId = sessionStorage.getItem(ACTIVE_CHAT_KEY);
        const justLoggedIn = sessionStorage.getItem('evolve_new_chat_on_login');
        if (justLoggedIn) sessionStorage.removeItem('evolve_new_chat_on_login');

        if (existing && !justLoggedIn && storedId) {
          const exists = chats.some(c => c.id === storedId);
          setActiveChatId(exists ? storedId : chats[0]?.id || '');
        }
        setHasLoadedChats(true);
      } catch (e) {
        console.error('chat load error', e);
        toast.error('Failed to load chats');
        setHasLoadedChats(true);
      }
    };
    loadChats();
  }, [router]);

  // Autosave
  useEffect(() => {
    if (!hasLoadedChats || !activeChatId) return;
    fetch('/api/users/chats', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chats }),
    }).catch(e => {
      console.error('autosave error', e);
      toast.error('Failed to save chats');
    });
  }, [chats, hasLoadedChats, activeChatId]);

  const value = {
    chats,
    activeChatId,
    filteredChats,
    chatSearch,
    setChatSearch,
    createNewChat,
    deleteChat,
    togglePin,
    startRename,
    confirmRename,
    cancelRename,
    renameChatId,
    renameValue,
    setRenameValue,
    openMenuId,
    setOpenMenuId,
    selectChat,
    updateMessages,
  };

  return <BotChatContext.Provider value={value}>{children}</BotChatContext.Provider>;
};

