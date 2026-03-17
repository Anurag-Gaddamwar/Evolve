"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
const createInitialChat = () => ({ id: createId(), title: 'New chat', updatedAt: Date.now(), pinned: false, messages: [] });

// very lightweight inline markdown parser for **bold** and *italic* plus line breaks
const renderMessageText = (raw) => {
  if (!raw || typeof raw !== 'string') return raw;
  // escape HTML first
  let s = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // bold **text**
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // italic *text* (avoid converting inside bold markers)
  s = s.replace(/\*(?!\*)([^*]+?)\*(?!\*)/g, '<em>$1</em>');
  // preserve newlines
  s = s.replace(/\n/g, '<br/>');
  return <span dangerouslySetInnerHTML={{ __html: s }} />;
};

const STOPWORDS = new Set(['the','a','an','and','or','but','if','then','so','to','of','in','on','for','with','at','from','is','am','are','was','were','be','been','being','it','this','that','these','those','i','you','we','they','he','she','my','your','our','their','me','him','her','them','do','does','did','can','could','should','would','will','just','about','what','which','who','when','where','why','how','hi','hello','yes','no','ok','okay','there','here','please']);

const deriveChatTitle = (messages = []) => {
  if (!Array.isArray(messages) || !messages.length) return 'New chat';
  const freq = new Map();
  messages.filter(m => (m.role==='user'||m.role==='assistant') && typeof m.text==='string').slice(-10)
    .forEach(m => m.text.toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(w => w.length>2 && !STOPWORDS.has(w)).forEach(w => freq.set(w,(freq.get(w)||0)+1)));
  const top = [...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([w])=>w);
  if (top.length) return top.map(w=>w[0].toUpperCase()+w.slice(1)).join(' • ').slice(0,48);
  const first = messages.find(m=>m.role==='user'&&typeof m.text==='string'&&m.text.trim());
  if (first) { const t=first.text.trim(); return t.slice(0,34)+(t.length>34?'…':''); }
  return 'New chat';
};

// ── Module-level sub-components (NEVER inside render — causes unmount/remount → blur → keyboard closes) ──

const ChatActions = ({ chat, openMenuId, onRename, onPin, onDelete }) => {
  if (openMenuId !== chat.id) return null;
  return (
    <div className="absolute right-1 top-9 z-20 w-36 rounded-md border border-[#3a3a3a] bg-[#1c1c1c] shadow-lg" onClick={e=>e.stopPropagation()}>
      <button type="button" onClick={()=>onRename(chat.id)} className="w-full text-left px-3 py-2 text-sm hover:bg-[#2a2a2a] flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4 20h4l10-10-4-4L4 16v4z"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 6l4 4"/></svg>
        Rename
      </button>
      <button type="button" onClick={()=>onPin(chat.id)} className="w-full text-left px-3 py-2 text-sm hover:bg-[#2a2a2a] flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 4h6l-1 5 3 3H7l3-3-1-5z"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 12v8"/></svg>
        {chat.pinned ? 'Unpin' : 'Pin'}
      </button>
      <button type="button" onClick={()=>onDelete(chat.id)} className="w-full text-left px-3 py-2 text-sm hover:bg-[#2a2a2a] text-red-300 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18"/><path strokeLinecap="round" strokeLinejoin="round" d="M8 6V4h8v2"/><path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14H6L5 6"/><path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6M14 11v6"/></svg>
        Delete
      </button>
    </div>
  );
};

const ChatList = ({ filteredChats, activeChatId, openMenuId, mobile, onSelect, onMenuToggle, onRename, onPin, onDelete }) => {
  // group by month
  let lastMonth = '';
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });
  return (
    <div className="flex-1 min-h-0 overflow-y-auto app-scrollbar px-2 py-2" data-chat-actions-root>
      {filteredChats.map(chat => {
        const date = new Date(chat.updatedAt || chat.createdAt || Date.now());
        const month = fmt.format(date);
        const header = month !== lastMonth ? (
          <div key={month} className="text-xs text-[#9f9f9f] mt-2 mb-1">{month}</div>
        ) : null;
        lastMonth = month;
        return (
          <React.Fragment key={(mobile?'m-':'')+chat.id}>
            {header}
            <div
              className={`group relative flex items-center justify-between rounded-lg px-2 py-2 mb-1 cursor-pointer border ${chat.id===activeChatId?'bg-[#242424] border-[#3a3a3a]':'bg-transparent border-transparent hover:bg-[#1f1f1f]'}`}
              onClick={()=>onSelect(chat.id)}
            >
              <span className="text-sm truncate pr-2">
                {chat.pinned && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5 inline-block mr-1 align-[-2px]"><path strokeLinecap="round" strokeLinejoin="round" d="M9 4h6l-1 5 3 3H7l3-3-1-5z"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 12v8"/></svg>}
                {chat.title||'New chat'}
              </span>
              <button type="button" onClick={e=>{e.stopPropagation();onMenuToggle(chat.id);}} className="text-lg leading-none text-[#9f9f9f] hover:text-white px-1">⋯</button>
              <ChatActions chat={chat} openMenuId={openMenuId} onRename={onRename} onPin={onPin} onDelete={onDelete} />
            </div>
          </React.Fragment>
        );
      })}
      {filteredChats.length===0 && <div className="px-2 py-3 text-xs text-[#8f8f8f]">No chats found.</div>}
    </div>
  );
};

const InputBar = React.forwardRef(({ value, onChange, onKeyDown, onSend, isSending }, ref) => (
  <div className="rounded-[26px] border border-[#3a3a3a] bg-[#2a2a2a] px-3 py-2 flex items-end gap-2 shadow-lg">
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onTouchMove={e=>e.stopPropagation()}
      rows={1}
      placeholder="Ask about content, growth, or YouTube strategy…"
      className="w-full bg-transparent outline-none resize-none text-[#ececec] placeholder:text-[#a4a4a4] leading-6 py-1 min-h-[20px] max-h-[200px] overflow-y-auto app-scrollbar"
      style={{ overscrollBehavior:'contain', WebkitOverflowScrolling:'touch' }}
    />
    <button onClick={onSend} disabled={isSending||!value.trim()} className="h-9 w-9 shrink-0 rounded-full bg-[#e5e5e5] disabled:opacity-45 self-end flex items-center justify-center" aria-label="Send">
      {isSending
        ? <svg className="w-4 h-4 animate-spin text-[#1a1a1a]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
        : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7"/></svg>
      }
    </button>
  </div>
));
InputBar.displayName = 'InputBar';

// ── Main component ──────────────────────────────────────────────────────────

export default function BotChat() {
  // AppSidebarShell moved to layout - pure content only
  const router = useRouter();
  const [isMounted, setIsMounted]               = useState(false);
  const [chats, setChats]                       = useState([]);
  const [activeChatId, setActiveChatId]         = useState('');
  const [chatSessionId, setChatSessionId]       = useState('');
  const [userInitial, setUserInitial]           = useState('U');
  const [input, setInput]                       = useState('');
  const [chatSearch, setChatSearch]             = useState('');
  const [isSending, setIsSending]               = useState(false);
  const [error, setError]                       = useState('');
  const [copiedId, setCopiedId]                 = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [isMobile, setIsMobile]                 = useState(false);
  const [isMobileDevice, setIsMobileDevice]     = useState(false);
  const [openMenuId, setOpenMenuId]             = useState('');
  const [renameChatId, setRenameChatId]         = useState('');
  const [renameValue, setRenameValue]           = useState('');
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [hasLoadedChats, setHasLoadedChats]     = useState(false);
  const [touchStartX, setTouchStartX]           = useState(0);
  // Only used for showing/hiding nav bar — layout is handled via DOM refs
  const [keyboardOpen, setKeyboardOpen]         = useState(false);
  const [isLoggingOut, setIsLoggingOut]        = useState(false);

  const msgContainerRef  = useRef(null);
  const desktopMsgRef    = useRef(null);
  const mobileMsgRef     = useRef(null);
  const inputRef         = useRef(null);
  const inputWrapRef     = useRef(null); // the div wrapping InputBar on mobile
  const navRef           = useRef(null); // mobile bottom nav
  const stickToBottomRef = useRef(true);
  const keyboardOpenRef  = useRef(false);
  const kbTimerRef       = useRef(null);
  const mobileLayoutApplyRef = useRef(null);

  const setDesktopMsgRef = useCallback((node) => {
    desktopMsgRef.current = node;
    if (!isMobile) msgContainerRef.current = node;
  }, [isMobile]);

  const setMobileMsgRef = useCallback((node) => {
    mobileMsgRef.current = node;
    if (isMobile) msgContainerRef.current = node;
  }, [isMobile]);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    const checkWidth = () => setIsMobile(window.innerWidth < 768);
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  useEffect(() => {
    // simple UA check for phones/tablets
    const ua = navigator.userAgent || ''; 
    setIsMobileDevice(/Mobi|Android|iPhone|iPad|iPod/i.test(ua));
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // THE ONLY RIGHT WAY TO HANDLE MOBILE KEYBOARD WITHOUT BREAKING ANYTHING:
  //
  // Strategy: position:fixed for EVERYTHING on mobile.
  //   • Header:        fixed top:0          — never moves, ever
  //   • MsgContainer:  fixed top:48px, bottom changes via DOM ref
  //   • InputWrap:     fixed bottom changes via DOM ref (sits above keyboard)
  //   • NavBar:        fixed bottom:0, hidden when keyboard open
  //
  // On visualViewport resize → directly set bottom values via DOM refs.
  // Zero React state changes for layout → zero re-renders → focus never lost.
  //
  // The only React state we set is keyboardOpen (debounced 200ms, after
  // keyboard animation ends) just to toggle the nav bar visibility.
  // ─────────────────────────────────────────────────────────────────────────
  const HEADER_H = 48;
  const NAV_H    = 61;
  const INPUT_H  = 64; // approximate input bar + padding height

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vv = window.visualViewport;

    const applyLayout = () => {
      if (window.innerWidth >= 768) return; // desktop handles itself via flexbox

      const vvHeight    = vv ? vv.height    : window.innerHeight;
      const windowH     = window.innerHeight;
      const kbHeight    = Math.max(0, windowH - vvHeight);
      const kbIsOpen    = kbHeight > 120;

      // Input bar: sits directly above keyboard (or above nav when closed)
      const inputBottom = kbIsOpen ? kbHeight : NAV_H;
      if (inputWrapRef.current) {
        inputWrapRef.current.style.bottom = inputBottom + 'px';
      }

      const inputHeight = inputWrapRef.current ? inputWrapRef.current.offsetHeight : INPUT_H;

      // Message container: fills space between header and input bar
      const msgBottom = inputBottom + inputHeight;
      if (msgContainerRef.current) {
        msgContainerRef.current.style.bottom = msgBottom + 'px';
      }

      // Nav bar: hide instantly when keyboard opens, show when closes
      if (navRef.current) {
        navRef.current.style.display = kbIsOpen ? 'none' : 'block';
      }

      // Scroll to bottom if we were already there
      if (stickToBottomRef.current) {
        requestAnimationFrame(() => {
          const el = msgContainerRef.current;
          if (el) el.scrollTop = el.scrollHeight;
        });
      }

      // Debounced React state — only for nav conditional render
      if (kbIsOpen !== keyboardOpenRef.current) {
        keyboardOpenRef.current = kbIsOpen;
        clearTimeout(kbTimerRef.current);
        kbTimerRef.current = setTimeout(() => setKeyboardOpen(kbIsOpen), 200);
      }
    };

    if (vv) {
      vv.addEventListener('resize', applyLayout);
      vv.addEventListener('scroll', applyLayout);
    } else {
      window.addEventListener('resize', applyLayout);
    }
    // Run once on mount to set initial layout
    applyLayout();
    mobileLayoutApplyRef.current = applyLayout;

    return () => {
      if (vv) { vv.removeEventListener('resize', applyLayout); vv.removeEventListener('scroll', applyLayout); }
      else window.removeEventListener('resize', applyLayout);
      clearTimeout(kbTimerRef.current);
    };
  }, []); // empty — never re-runs, never re-subscribes, never causes blur

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth >= 768) return;
    mobileLayoutApplyRef.current?.();
  }, [error, input]);

  const closeMobileHistory = useCallback(() => setMobileHistoryOpen(false), []);
  const SESSION_KEY     = 'evolve_bot_session_active';
  const ACTIVE_CHAT_KEY = 'evolve_bot_active_chat_id';

  const goToProfile   = useCallback(() => { closeMobileHistory(); router.push('/profile');   }, [closeMobileHistory, router]);
  const goToAnalytics = useCallback(() => { closeMobileHistory(); router.push('/analytics'); }, [closeMobileHistory, router]);
  const goToBot       = useCallback(() => { closeMobileHistory(); router.push('/bot');       }, [closeMobileHistory, router]);

  useEffect(() => { setChatSessionId(createId()); }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/users/me'); if (!r.ok) return;
        const d = await r.json();
        const src = ((d?.data?.username||'').trim().split(/\s+/)[0]) || (d?.data?.email||'').trim();
        setUserInitial(src ? src[0].toUpperCase() : 'U');
      } catch (e) {
        console.error('user initial load failed', e);
        toast.error('Unable to load user info');
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      let hc = null;
      try {
        const r = await fetch('/api/users/chats');
        if (r.status===401) { router.push('/login'); return; }
        if (r.ok) { const d=await r.json(); const s=Array.isArray(d?.chats)?d.chats:[]; if(s.length) hc=s; }
      } catch (e) { console.error('chat load error', e); toast.error('Failed to load chats'); }

      // Check if we just arrived from login or password reset
      const justLoggedIn = sessionStorage.getItem('evolve_new_chat_on_login');
      if (justLoggedIn) {
        try { sessionStorage.removeItem('evolve_new_chat_on_login'); } catch {};
      }

      // If we just logged in and have existing chats with an empty one, reuse it
      if (justLoggedIn && hc && hc.length > 0) {
        const empty = hc.find(c => !c.messages?.length);
        if (empty) {
          setChats(hc);
          setActiveChatId(empty.id);
          sessionStorage.setItem(ACTIVE_CHAT_KEY, empty.id);
          sessionStorage.setItem(SESSION_KEY, 'true');
          setHasLoadedChats(true);
          return;
        }
      }

      if (!hc) hc = [createInitialChat()];
      setChats(hc);

      const existing = sessionStorage.getItem(SESSION_KEY);
      const storedId = sessionStorage.getItem(ACTIVE_CHAT_KEY);
      if (!existing || justLoggedIn) {
        sessionStorage.setItem(SESSION_KEY,'true');
        // Create new chat
        const nc = createInitialChat();
        setChats(prev => [nc, ...hc]);
        setActiveChatId(nc.id);
        sessionStorage.setItem(ACTIVE_CHAT_KEY,nc.id);
      } else {
        const exists = storedId && hc.some(c => c.id === storedId);
        setActiveChatId(exists ? storedId : hc[0]?.id || '');
      }
      setHasLoadedChats(true);
    })();
  }, [router]);

  useEffect(() => { if (hasLoadedChats&&activeChatId) sessionStorage.setItem(ACTIVE_CHAT_KEY,activeChatId); }, [activeChatId,hasLoadedChats]);
  useEffect(() => {
    if (!hasLoadedChats||!activeChatId) return;
    fetch('/api/users/chats',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({chats})})
      .then(r=>{ if(!r.ok) throw new Error('save failed'); })
      .catch(e=>{ console.error('autosave error',e); toast.error('Failed to save chats'); });
  }, [chats,hasLoadedChats,activeChatId]);

  useEffect(() => { stickToBottomRef.current=true; setShowJumpToLatest(false); setOpenMenuId(''); }, [activeChatId]);

  useEffect(() => {
    const ta=inputRef.current; if(!ta) return;
    ta.style.height='auto';
    ta.style.height=Math.min(ta.scrollHeight,200)+'px';
    ta.style.overflowY=ta.scrollHeight>200?'auto':'hidden';
  }, [input]);

  useEffect(() => {
    if (!error) return;
    if (!stickToBottomRef.current) return;
    requestAnimationFrame(() => {
      const el = msgContainerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, [error]);

  useEffect(() => {
    const outside = e => { if(!openMenuId) return; if(!e.target?.closest('[data-chat-actions-root]')) setOpenMenuId(''); };
    const esc = e => { if(e.key==='Escape') setOpenMenuId(''); };
    document.addEventListener('mousedown',outside);
    document.addEventListener('keydown',esc);
    return () => { document.removeEventListener('mousedown',outside); document.removeEventListener('keydown',esc); };
  }, [openMenuId]);

  const activeChat     = useMemo(() => chats.find(c=>c.id===activeChatId), [chats,activeChatId]);
  const activeMessages = activeChat?.messages || [];

  const filteredChats = useMemo(() => {
    const q = chatSearch.trim().toLowerCase();
    const sorted = [...chats].sort((a,b)=>(Number(!!b.pinned)-Number(!!a.pinned))||((b.updatedAt||0)-(a.updatedAt||0)));
    return q ? sorted.filter(c=>(c.title||'').toLowerCase().includes(q)) : sorted;
  }, [chatSearch,chats]);

  const scrollToLatest = useCallback((smooth=true) => {
    const el=msgContainerRef.current;
    if(el) el.scrollTo({top:el.scrollHeight,behavior:smooth?'smooth':'auto'});
  }, []);

  const handleScroll = (el) => {
    if(!el) return;
    const atBottom = el.scrollHeight-(el.scrollTop+el.clientHeight)<72;
    stickToBottomRef.current=atBottom;
    setShowJumpToLatest(!atBottom);
  };

  useEffect(() => {
    if(stickToBottomRef.current) { requestAnimationFrame(()=>scrollToLatest(false)); setShowJumpToLatest(false); }
  }, [activeMessages,isSending,scrollToLatest]);

  const isChatEmpty = c => !c?.messages?.length;

  const createNewChat = useCallback(() => {
    try {
      const active=chats.find(c=>c.id===activeChatId);
      // Only one empty chat allowed - if current is empty, just switch to it
      if(active&&isChatEmpty(active)) { setError(''); toast('Switched to existing empty chat'); return; }
      // Find any existing empty chat (not the active one) and switch to it
      const empty=chats.find(c=>c.id!==activeChatId&&isChatEmpty(c));
      if(empty) { setActiveChatId(empty.id); setError(''); toast('Reusing empty chat'); return; }
      // Only create a new chat if the current one has messages
      const nc=createInitialChat();
      setChats(p=>[nc,...p]); setActiveChatId(nc.id); closeMobileHistory();
      stickToBottomRef.current=true; setShowJumpToLatest(false); setInput(''); setError('');
      toast.success('New chat created');
    } catch (e) {
      console.error('createNewChat error', e);
      toast.error('Failed to create chat');
    }
  }, [chats,activeChatId,closeMobileHistory]);

  const deleteChat = useCallback(id => {
    console.log('chat deleted', id);
    toast.success('Chat deleted');
    setOpenMenuId('');
    try {
      setChats(prev => {
        const f=prev.filter(c=>c.id!==id);
        if(f.length) { if(activeChatId===id) setActiveChatId(f[0].id); return f; }
        const fb=createInitialChat(); setActiveChatId(fb.id); return [fb];
      });
    } catch (e) {
      console.error('deleteChat failure', e);
    toast.error('Failed to delete chat');
      console.error('deleteChat error', e);
    }
  }, [activeChatId]);

  const startRename   = useCallback(id => { const t=chats.find(c=>c.id===id); if(!t) return; setRenameChatId(id); setRenameValue(t.title||'New chat'); setOpenMenuId(''); }, [chats]);
  const confirmRename = useCallback(() => {
    const v = renameValue.trim();
    if (!renameChatId || !v) {
      setRenameChatId(''); setRenameValue('');
      return;
    }
    // prevent duplicate titles (case-insensitive)
    const other = chats.find(c => c.id !== renameChatId && (c.title||'').toLowerCase() === v.toLowerCase());
    if (other) {
      console.log('rename prevented: duplicate title', v);
      // display via toast rather than chat error area
      toast.error('A chat with that name already exists.');
      return;
    }
    setChats(p => p.map(c => c.id === renameChatId ? { ...c, title: v.slice(0,48) } : c));
    setRenameChatId(''); setRenameValue('');
  }, [renameChatId,renameValue,chats]);
  const cancelRename  = useCallback(() => { setRenameChatId(''); setRenameValue(''); }, []);
  const togglePin     = useCallback(id => {
    console.log('togglePin success', id);
    toast.success('Chat pinned state updated');
    try {
      setChats(p=>p.map(c=>c.id===id?{...c,pinned:!c.pinned}:c));
      setOpenMenuId('');
    } catch (e) {
      console.error('togglePin failure', e);
      toast.error('Failed to update pin');
      console.error('togglePin error', e);
    }
  }, []);
  const handleMenuToggle = useCallback(id => { setOpenMenuId(p=>p===id?'':id); }, []);
  const handleChatSelect = useCallback((id,closeMobile=false) => { 
    // When selecting a different chat, remove the current empty chat if it has no messages
    const currentChat = chats.find(c => c.id === activeChatId);
    if (currentChat && isChatEmpty(currentChat) && id !== activeChatId) {
      setChats(prev => prev.filter(c => c.id !== activeChatId));
    }
    setActiveChatId(id); 
    if(closeMobile) closeMobileHistory(); 
  }, [chats, activeChatId, closeMobileHistory]);

  const updateMsgs = (chatId, updater) => {
    setChats(prev=>prev.map(c=>{
      if(c.id!==chatId) return c;
      const next=typeof updater==='function'?updater(c.messages):updater;
      return {...c,messages:next,title:deriveChatTitle(next),updatedAt:Date.now()};
    }));
  };

  const handleSend = useCallback(async () => {
    const msg=input.trim();
    if(!msg||!activeChatId||isSending) return;
    // Define tid before try block to ensure it's available in catch
    const tid = activeChatId;
    try {
      closeMobileHistory(); setError(''); setInput(''); setIsSending(true);
      stickToBottomRef.current=true;
      requestAnimationFrame(()=>{ const el=msgContainerRef.current; if(el) el.scrollTop=el.scrollHeight; });

      const userMsg={id:createId(),role:'user',text:msg,createdAt:Date.now()};
      const snap=chats.find(c=>c.id===tid);
      const history=(snap?.messages||[]).filter(m=>(m.role==='user'||m.role==='assistant')&&typeof m.text==='string').map(m=>({from:m.role==='assistant'?'assistant':'user',text:m.text})).slice(-10);
      updateMsgs(tid,p=>[...p,userMsg]);
      const api=process.env.NEXT_PUBLIC_BACKEND_URL||'http://localhost:3001';
      const r=await fetch(`${api}/api/bot-response`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userRequest:msg,chatSessionId,chatId:tid,chatHistory:history})});
      if(!r.ok) throw new Error('bad');
      const d=await r.json();
      const txt=(d.text||'I could not generate a response.').replace(/Assistant:/g,'').trim();
      updateMsgs(tid,p=>[...p,{id:createId(),role:'assistant',text:txt,createdAt:Date.now()}]);
      setTimeout(()=>{ stickToBottomRef.current=true; const el=msgContainerRef.current; if(el) el.scrollTop=el.scrollHeight; },80);
    } catch(e) {
      toast.error('Unable to fetch bot response');
      setError('Error generating response. Please try again.');
      updateMsgs(tid,p=>[...p,{id:createId(),role:'assistant',text:'Sorry, I could not respond right now.',createdAt:Date.now()}]);
      console.error('handleSend error', e);
    } finally { setIsSending(false); }
  }, [input,activeChatId,isSending,chats,chatSessionId,closeMobileHistory]);

  const handleKeyDown = useCallback(e => {
    // Send on Enter key (both desktop and mobile) unless shift is pressed
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleInputChange = useCallback(e => {
    setInput(e.target.value);
    const ta=inputRef.current; if(!ta) return;
    ta.style.height='auto';
    ta.style.height=Math.min(ta.scrollHeight,200)+'px';
    ta.style.overflowY=ta.scrollHeight>200?'auto':'hidden';
  }, []);

  if (!isMounted) return <div style={{position:'fixed',inset:0,background:'#212121'}} />;

  const chatListProps = { filteredChats, activeChatId, openMenuId, onRename:startRename, onPin:togglePin, onDelete:deleteChat, onMenuToggle:handleMenuToggle };

  return (
    <div style={{ position:'fixed', inset:0, background:'#212121', overflow:'hidden', color:'#ececec' }}>

      {/* ── Desktop layout (unchanged — pure flexbox, no fixed positioning needed) ── */}
      <div className="hidden md:flex h-full w-full overflow-hidden">
        {/* Icon sidebar */}
        <aside className="h-full w-[60px] shrink-0 border-r border-[#2a2a2a] bg-[#171717] flex flex-col items-center py-3 gap-3">
          <div className="w-8 h-8 rounded-full bg-[#202020] border border-[#313131] flex items-center justify-center text-xs">◎</div>
          <button onClick={()=>setSidebarCollapsed(p=>!p)} className="w-9 h-9 rounded-lg border border-[#333] text-[#d9d9d9] hover:bg-[#232323]">{sidebarCollapsed?'»':'«'}</button>
          <div className="mt-auto flex flex-col items-center gap-3">
            <div className="mb-1 flex flex-col items-center">
              <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] uppercase tracking-[0.28em] text-[#7f7f7f]">Features</span>
              <span className="text-[10px] text-[#7f7f7f]">↑</span>
            </div>
            <button onClick={goToBot}       className="w-9 h-9 rounded-lg border border-[#333] text-[#d9d9d9] hover:bg-[#232323]">✦</button>
            <button onClick={goToAnalytics} className="w-9 h-9 rounded-lg border border-[#333] text-[#d9d9d9] hover:bg-[#232323]">◉</button>
            <button onClick={goToProfile}   className="w-8 h-8 rounded-full bg-[#1f7f67] text-[11px] font-semibold flex items-center justify-center hover:opacity-95">{userInitial}</button>
          </div>
        </aside>
        {/* Chat list sidebar */}
        <aside className={`h-full shrink-0 border-r border-[#2a2a2a] bg-[#171717] transition-all duration-200 overflow-hidden ${sidebarCollapsed?'w-0':'w-[245px]'}`}>
          <div className="h-full flex flex-col">
            <div className="h-14 px-4 border-b border-[#2a2a2a] flex items-center"><span className="font-semibold text-[15px]">Evolve</span></div>
            <div className="p-3 border-b border-[#2a2a2a]"><button onClick={createNewChat} className="w-full rounded-lg border border-[#3b3b3b] bg-[#1f1f1f] px-3 py-2 text-sm text-left hover:bg-[#262626]">+ New chat</button></div>
            <div className="px-3 py-3 border-b border-[#2a2a2a]"><input value={chatSearch} onChange={e=>setChatSearch(e.target.value)} className="w-full rounded-lg bg-[#111] border border-[#2f2f2f] px-3 py-2 text-sm text-[#d6d6d6] placeholder:text-[#a0a0a0] outline-none" placeholder="Search chats" /></div>
            <div className="px-3 pt-3 text-xs uppercase tracking-wide text-[#9f9f9f]">Your chats</div>
            <ChatList {...chatListProps} onSelect={id=>handleChatSelect(id,false)} />
          </div>
        </aside>
        {/* Main */}
        <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-[#212121]">
          <header className="shrink-0 h-12 px-4 border-b border-[#2a2a2a] bg-[#171717] flex items-center justify-between">
            <span className="font-semibold text-[20px]">Evolve</span>
            <button onClick={async()=>{if(isLoggingOut) return; setIsLoggingOut(true); try{sessionStorage.removeItem(SESSION_KEY);const r=await fetch('/api/users/logout',{method:'GET'}); if(!r.ok) throw new Error('logout failed'); toast.success('Logged out'); router.push('/login');}catch(e){console.error(e);toast.error('Logout failed');}finally{setIsLoggingOut(false);}}} disabled={isLoggingOut} className="border border-[#3a3a3a] bg-[#242424] rounded-lg px-3 py-1 text-sm hover:bg-[#2f2f2f] disabled:opacity-50">{isLoggingOut ? '...' : 'Logout'}</button>
          </header>
          <div ref={setDesktopMsgRef} onScroll={e=>handleScroll(e.currentTarget)} className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            <div className="max-w-[900px] mx-auto px-6 py-8 flex flex-col gap-5">
              {activeMessages.length===0 && <div className="text-center text-[#a5a5a5] mt-20">Start a new conversation</div>}
              {activeMessages.map(m=>(
                <div key={m.id} className={`group flex ${m.role==='user'?'justify-end':'justify-start'}`}>
                  <div className="relative max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-base leading-7" style={{background:m.role==='user'?'#2d2d2d':'#2a2a2a',color:m.role==='user'?'#f3f3f3':'#ededed',border:m.role==='assistant'?'1px solid #383838':'none'}}>
                    {renderMessageText(m.text)}
                    <button onClick={()=>{navigator.clipboard.writeText(m.text||'');setCopiedId(m.id);setTimeout(()=>setCopiedId(''),2000);}} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{background:'none',border:'none',cursor:'pointer',padding:2}} aria-label="Copy">
                      {copiedId===m.id?<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#4ade80" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>:<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#a0a0a0" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 114 0m-4 0h4"/></svg>}
                    </button>
                  </div>
                </div>
              ))}
{isSending && <div className="flex"><div className="rounded-2xl px-4 py-3 text-base bg-[#2a2a2a] border border-[#383838] text-[#bdbdbd] flex items-center gap-2"><span className="flex gap-1"><span className="w-2 h-2 bg-[#a8a8a8] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span><span className="w-2 h-2 bg-[#a8a8a8] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span><span className="w-2 h-2 bg-[#a8a8a8] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span></span>Thinking...</div></div>}
            </div>
          </div>
          <div className="shrink-0 px-6 py-3 bg-[#212121]">
            <div className="max-w-[900px] mx-auto" style={{ position:'relative' }}>
              {showJumpToLatest && (
                <button
                  onClick={()=>{stickToBottomRef.current=true;scrollToLatest();}}
                  className="text-xs rounded-full border border-[#3a3a3a] bg-[#2a2a2a] px-3 py-1 text-[#c8c8c8] hover:text-white shadow-[0_6px_18px_rgba(0,0,0,0.35)]"
                  style={{ position:'absolute', top:-32, left:'50%', transform:'translateX(-50%)', zIndex:40 }}
                >Jump to latest</button>
              )}
              <InputBar ref={inputRef} value={input} onChange={handleInputChange} onKeyDown={handleKeyDown} onSend={handleSend} isSending={isSending} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile layout — all layers are position:fixed ── */}
      <div className="md:hidden">

        {/*
          HEADER — fixed top:0, always visible, never affected by keyboard.
          z-index:30 so it sits above message content.
        */}
        <header style={{ position:'fixed', top:0, left:0, right:0, height:HEADER_H, zIndex:30, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 14px', borderBottom:'1px solid #2a2a2a', background:'#171717' }}>
          <span style={{ fontWeight:600, fontSize:18 }}>Evolve</span>
          <button onClick={async()=>{if(isLoggingOut) return; setIsLoggingOut(true); try{sessionStorage.removeItem(SESSION_KEY);const r=await fetch('/api/users/logout',{method:'GET'}); if(!r.ok) throw new Error('logout failed'); toast.success('Logged out'); router.push('/login');}catch(e){console.error(e);toast.error('Logout failed');}finally{setIsLoggingOut(false);}}} disabled={isLoggingOut} style={{ border:'1px solid #3a3a3a', background:'#242424', borderRadius:8, padding:'4px 12px', fontSize:14, color:'#ececec', cursor:isLoggingOut?'not-allowed':'pointer', opacity:isLoggingOut?0.5:1 }}>{isLoggingOut ? '...' : 'Logout'}</button>
        </header>

        {/*
          MESSAGE CONTAINER — fixed, top starts below header.
          bottom is set dynamically via DOM ref in the visualViewport listener.
          Initial bottom = NAV_H + INPUT_H so content is never hidden.
        */}
        <div
          ref={setMobileMsgRef}
          onScroll={e=>handleScroll(e.currentTarget)}
          style={{ position:'fixed', top:HEADER_H, left:0, right:0, bottom: NAV_H + INPUT_H, overflowY:'auto', overscrollBehavior:'contain' }}
        >
          <div style={{ maxWidth:900, margin:'0 auto', padding:'24px 16px 8px', display:'flex', flexDirection:'column', gap:16 }}>
            {activeMessages.length===0 && <div style={{ textAlign:'center', color:'#a5a5a5', marginTop:80 }}>Start a new conversation</div>}
            {activeMessages.map(m=>(
              <div key={m.id} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start' }}>
                <div className="group" style={{ position:'relative', maxWidth:'85%', whiteSpace:'pre-wrap', borderRadius:18, padding:'10px 14px', fontSize:15, lineHeight:'24px', background:m.role==='user'?'#2d2d2d':'#2a2a2a', color:m.role==='user'?'#f3f3f3':'#ededed', border:m.role==='assistant'?'1px solid #383838':'none' }}>
                  {renderMessageText(m.text)}
                  <button onClick={()=>{navigator.clipboard.writeText(m.text||'');setCopiedId(m.id);setTimeout(()=>setCopiedId(''),2000);}} className="opacity-0 group-hover:opacity-100" style={{ position:'absolute', top:4, right:4, background:'none', border:'none', cursor:'pointer', padding:2 }} aria-label="Copy">
                    {copiedId===m.id?<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#4ade80" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>:<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#a0a0a0" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 114 0m-4 0h4"/></svg>}
                  </button>
                </div>
              </div>
            ))}
{isSending && <div style={{ display:'flex' }}><div style={{ borderRadius:18, padding:'10px 14px', fontSize:15, background:'#2a2a2a', border:'1px solid #383838', color:'#bdbdbd', display:'flex', alignItems:'center', gap:8 }}><span style={{ display:'flex', gap:4 }}><span style={{ width:8, height:8, background:'#a8a8a8', borderRadius:'50%', animation:'bounce 1s infinite', animationDelay:'0ms' }}></span><span style={{ width:8, height:8, background:'#a8a8a8', borderRadius:'50%', animation:'bounce 1s infinite', animationDelay:'150ms' }}></span><span style={{ width:8, height:8, background:'#a8a8a8', borderRadius:'50%', animation:'bounce 1s infinite', animationDelay:'300ms' }}></span></span>Thinking...</div></div>}
          </div>
        </div>

        {/*
          INPUT BAR — fixed, bottom is set dynamically via DOM ref.
          Initial bottom = NAV_H (above nav bar).
          When keyboard opens → bottom = keyboardHeight (directly above keyboard).
          z-index:20 so it's above messages but below header.
        */}
        <div
          ref={inputWrapRef}
          style={{ position:'fixed', left:0, right:0, bottom:NAV_H, zIndex:20, padding:'6px 14px 8px', background:'#212121' }}
        >
          <div style={{ maxWidth:900, margin:'0 auto', position:'relative' }}>
            {showJumpToLatest && (
              <button
                onClick={()=>{stickToBottomRef.current=true;scrollToLatest();}}
                style={{ position:'absolute', top:-46, left:'50%', transform:'translateX(-50%)', zIndex:60, fontSize:12, borderRadius:999, border:'1px solid #3a3a3a', background:'#2a2a2a', padding:'4px 12px', color:'#c8c8c8', cursor:'pointer', boxShadow:'0 8px 20px rgba(0,0,0,0.45)' }}
              >Jump to latest</button>
            )}
            <InputBar ref={inputRef} value={input} onChange={handleInputChange} onKeyDown={handleKeyDown} onSend={handleSend} isSending={isSending} />
          </div>
        </div>

        {/*
          BOTTOM NAV — fixed bottom:0.
          Hidden via display:none (set directly via navRef) when keyboard opens,
          not via React state, so no re-render happens.
        */}
        <nav
          ref={navRef}
          style={{ position:'fixed', bottom:0, left:0, right:0, height:NAV_H, zIndex:10, borderTop:'1px solid #2a2a2a', background:'#171717', padding:'8px 12px' }}
        >
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            {[{l:'Assistant',a:goToBot,active:true},{l:'Analysis',a:goToAnalytics},{l:'Profile',a:goToProfile}].map(({l,a,active})=>(
              <button key={l} onClick={a} style={{ height:44, borderRadius:8, border:`1px solid ${active?'#3a3a3a':'#333'}`, background:active?'#242424':'transparent', color:active?'#fff':'#d9d9d9', fontSize:14, cursor:'pointer' }}>{l}</button>
            ))}
          </div>
        </nav>

        {/* Swipe handle */}
        {!keyboardOpen && (
          <button
            onTouchStart={e=>e.touches[0]&&setTouchStartX(e.touches[0].clientX)}
            onTouchEnd={e=>{ if(e.changedTouches[0]&&e.changedTouches[0].clientX-touchStartX>50) setMobileHistoryOpen(true); }}
            onClick={()=>setMobileHistoryOpen(p=>!p)}
            style={{ position:'fixed', left:mobileHistoryOpen?280:0, top:'50%', transform:'translateY(-50%)', zIndex:50, height:80, width:24, background:'rgba(42,42,42,0.4)', backdropFilter:'blur(4px)', border:'none', borderRight:'1px solid rgba(58,58,58,0.5)', borderRadius:'0 8px 8px 0', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'left 0.3s' }}
            aria-label={mobileHistoryOpen?'Close chats':'Open chats'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#d9d9d9" strokeWidth="2" style={{ width:16, height:16, transform:mobileHistoryOpen?'rotate(180deg)':'none', transition:'transform 0.3s' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        )}

        {/* History drawer */}
        <div
          style={{ position:'fixed', inset:0, zIndex:40, background:mobileHistoryOpen?'rgba(0,0,0,0.6)':'rgba(0,0,0,0)', pointerEvents:mobileHistoryOpen?'auto':'none', transition:'background 0.3s' }}
          onClick={closeMobileHistory}
        >
          <div style={{ height:'100%', width:280, maxWidth:'85vw', background:'#171717', borderRight:'1px solid #2a2a2a', display:'flex', flexDirection:'column', transform:mobileHistoryOpen?'translateX(0)':'translateX(-100%)', transition:'transform 0.3s' }} onClick={e=>e.stopPropagation()}>
            <div style={{ height:56, padding:'0 16px', borderBottom:'1px solid #2a2a2a', display:'flex', alignItems:'center' }}><span style={{ fontWeight:600, fontSize:15 }}>Evolve</span></div>
            <div style={{ padding:12, borderBottom:'1px solid #2a2a2a' }}><button onClick={createNewChat} style={{ width:'100%', borderRadius:8, border:'1px solid #3b3b3b', background:'#1f1f1f', padding:'8px 12px', fontSize:14, color:'#ececec', textAlign:'left', cursor:'pointer' }}>+ New chat</button></div>
            <div style={{ padding:12, borderBottom:'1px solid #2a2a2a' }}><input value={chatSearch} onChange={e=>setChatSearch(e.target.value)} style={{ width:'100%', borderRadius:8, border:'1px solid #2f2f2f', background:'#111', padding:'8px 12px', fontSize:14, color:'#d6d6d6', outline:'none', boxSizing:'border-box' }} placeholder="Search chats" /></div>
            <div style={{ padding:'12px 12px 4px', fontSize:11, textTransform:'uppercase', letterSpacing:'0.1em', color:'#9f9f9f' }}>Your chats</div>
            <ChatList {...chatListProps} mobile onSelect={id=>handleChatSelect(id,true)} />
          </div>
        </div>
      </div>

      {/* Rename modal */}
      {renameChatId && (
        <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={cancelRename}>
          <div style={{ width:'100%', maxWidth:448, borderRadius:12, border:'1px solid #3a3a3a', background:'#1c1c1c', padding:16 }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ fontWeight:600, fontSize:15, marginBottom:12, color:'#ececec' }}>Rename chat</h3>
            <input value={renameValue} onChange={e=>setRenameValue(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')confirmRename();if(e.key==='Escape')cancelRename();}} style={{ width:'100%', borderRadius:8, border:'1px solid #2f2f2f', background:'#111', padding:'8px 12px', fontSize:14, color:'#d6d6d6', outline:'none', boxSizing:'border-box' }} placeholder="Enter chat name" autoFocus />
            <div style={{ marginTop:16, display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button type="button" onClick={cancelRename}  style={{ border:'1px solid #343434', borderRadius:6, padding:'6px 12px', fontSize:14, background:'none', color:'#ececec', cursor:'pointer' }}>Cancel</button>
              <button type="button" onClick={confirmRename} style={{ border:'none', borderRadius:6, padding:'6px 12px', fontSize:14, background:'#3b3b3b', color:'#fff', cursor:'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}