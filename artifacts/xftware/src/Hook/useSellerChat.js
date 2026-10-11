import { useState, useRef, useCallback, useEffect } from 'react';
import { reqOwner } from '@/lib/requestApi';
import { toast } from 'react-toastify';
import { useSocket } from '@/Context/SocketContext';

const MAX_MESSAGES = 200;

/**
 * Unified chat hook for both Seller and Reseller views.
 * Sessions where bot is the seller use role='seller'
 * Sessions where bot is the reseller use role='reseller'
 */
export function useSellerChat() {
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [replyTo, setReplyTo] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  
  const [totalUnread, setTotalUnread] = useState(0);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  
  const { socket } = useSocket();
  const activeSessionRef = useRef(activeSession);

  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  const scrollToBottom = useCallback((smooth = true) => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'instant' 
      });
    }, 100);
  }, []);

  // ─── Fetch unified seller & reseller sessions ────────
  const fetchSessions = useCallback(async () => {
    try {
      const res = await reqOwner({ action: 'v2GetUnifiedChatSessions' });
      if (!res.error && res.data) {
        setSessions(res.data);
        const total = res.data.reduce((sum, s) => sum + (s.unreadCount || 0), 0);
        setTotalUnread(total);
      }
    } catch (err) { /* silent */ }
  }, []);
  
  const fetchUnreadCount = useCallback(async () => {
    // Calculated directly in fetchSessions to optimize performance
  }, []);
  
  // ─── Messages ────────────────────────────────────────
  const fetchMessages = useCallback(async (sessionId, role, append = false, silent = false) => {
    if (!sessionId) return;
    if (!append && !silent) setMessagesLoading(true);
    else if (append) setLoadingMore(true);
    
    try {
      const params = { action: 'v2GetUnifiedChatMessages', sessionId, limit: 50 };
      if (append && messages.length > 0) {
        params.beforeId = messages[0]?.id;
      }
      
      const res = await reqOwner(params);
      if (!res.error && res.data?.rows) {
        if (append) {
          setMessages(prev => [...res.data.rows, ...prev]);
          setHasMore(res.data.hasMore);
          
          const container = messagesContainerRef.current;
          const prevHeight = container?.scrollHeight;
          setTimeout(() => {
            if (container && prevHeight) {
              container.scrollTop = container.scrollHeight - prevHeight;
            }
          }, 50);
        } else {
          setMessages(res.data.rows);
          setHasMore(res.data.hasMore);
          scrollToBottom(false);
        }
      }
    } catch (err) { /* silent */ }
    
    if (!append && !silent) setMessagesLoading(false);
    else if (append) setLoadingMore(false);
  }, [messages, scrollToBottom]);

  const openSession = useCallback((session) => {
    setActiveSession(session);
    activeSessionRef.current = session;
    setReplyTo(null);
    setPreviewImage(null);
    fetchMessages(session.sessionId, session.role);
  }, [fetchMessages]);

  const initResellerChat = useCallback(async (stockId, isCloned = false, productData = null) => {
    try {
      const action = isCloned ? 'v2InitClonedProductChat' : 'v2InitMarketplaceChat';
      const param = isCloned ? 'productId' : 'providerStockId';
      
      const res = await reqOwner({ 
        action, 
        [param]: stockId 
      });
      
      if (res.error) {
        toast.error(res.message || 'Gagal memulai chat');
        return false;
      }
      
      // Re-fetch sessions so it appears in the list
      await fetchSessions();
      
      // The session should now be in the list, but we can also just construct it manually
      // since we know it's a reseller role session
      const newSession = {
        sessionId: res.data.sessionId,
        role: 'reseller',
        peerName: res.data.sellerInfo?.name || 'Seller',
        peerLabel: 'Seller',
        product: res.data.productInfo,
        tempProductContext: productData,
      };
      
      openSession(newSession);
      return true;
    } catch (err) {
      toast.error('Gagal memulai chat');
      return false;
    }
  }, [fetchSessions, openSession]);

  const loadMoreMessages = useCallback(() => {
    if (!activeSession || loadingMore || !hasMore) return;
    fetchMessages(activeSession.sessionId, activeSession.role, true);
  }, [activeSession, loadingMore, hasMore, fetchMessages]);

  const sendMessage = useCallback(async (content, type = 'text', fileUrl = null) => {
    if (!activeSession || sending) return null;
    
    if (type === 'text' && !content?.trim()) return null;
    if (type === 'image' && !fileUrl) return null;
    
    const role = activeSession.role;
    const outDirection = role === 'seller' ? 'to_reseller' : 'to_seller';
    
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      session_id: activeSession.sessionId,
      message_type: type,
      content: content,
      file_url: fileUrl,
      reply_to_chat_id: replyTo?.id || null,
      direction: outDirection,
      is_read: false,
      createdAt: new Date().toISOString(),
      _isTemp: true,
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    setReplyTo(null);
    scrollToBottom();
    setSending(true);
    
    const action = 'v2SendUnifiedChatMessage';
    
    try {
      const res = await reqOwner({
        action,
        sessionId: activeSession.sessionId,
        type,
        content,
        fileUrl,
        replyToId: replyTo?.id || null,
      });
      
      if (res.error) {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        toast.error(res.message || 'Gagal mengirim pesan');
        setSending(false);
        return null;
      }
      
      const realMsg = res.data;
      setMessages(prev => prev.map(m => 
        m.id === tempId ? { ...realMsg, _isTemp: false } : m
      ));
      
      // Update session last message
      setSessions(prev => prev.map(s => 
        s.sessionId === activeSession.sessionId 
          ? { 
              ...s, 
              lastMessageAt: realMsg.createdAt,
              lastMessage: {
                content: type === 'image' ? '📎 Mengirim gambar' : (content || '').substring(0, 80),
                type,
                direction: outDirection,
                isFromSelf: true,
                isFromSeller: role === 'seller',
              }
            }
          : s
      ));
      
      setSending(false);
      return realMsg;
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast.error('Gagal mengirim pesan');
      setSending(false);
      return null;
    }
  }, [activeSession, sending, replyTo, scrollToBottom]);

  const uploadImage = useCallback(async (file) => {
    if (!file) return null;
    setUploading(true);
    
    const action = activeSession?.role === 'reseller' ? 'v2UploadChatImage' : 'v2UploadSellerChatImage';
    
    try {
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const fileBase64 = await base64Promise;
      
      const res = await reqOwner({
        action,
        fileBase64,
        filename: file.name,
        mimetype: file.type,
      });
      
      if (res.error) {
        toast.error(res.message || 'Gagal upload gambar');
        setUploading(false);
        return null;
      }
      
      setUploading(false);
      return res.data?.url;
    } catch (err) {
      toast.error('Gagal upload gambar');
      setUploading(false);
      return null;
    }
  }, [activeSession]);
  
  const cleanup = useCallback(() => {
    // No-op cleanup for backward compatibility
  }, []);

  // ─── Socket Connection and Listeners ────────────────
  useEffect(() => {
    setSessionsLoading(true);
    fetchSessions().finally(() => setSessionsLoading(false));
  }, [fetchSessions]);

  // Track if user is busy with search/filters to pause auto-reload (similar to transactionQRIS)
  useEffect(() => {
    if (!socket) return;
    socket.emit('ui_state', { isBusy: false });
  }, [socket]);

  // Listen for realtime reload from server
  useEffect(() => {
    if (!socket) return;
    const onReload = (data) => {
      if (
        data?.action?.includes('v2GetUnifiedChatSessions') || 
        data?.action?.includes('v2GetResellerChatSessions') || 
        data?.action?.includes('v2GetSellerChatSessions')
      ) {
        fetchSessions();
        if (activeSessionRef.current) {
          fetchMessages(activeSessionRef.current.sessionId, activeSessionRef.current.role, false, true);
        }
      }
    };
    socket.on('o2_reload', onReload);
    return () => socket.off('o2_reload', onReload);
  }, [socket, fetchSessions, fetchMessages]);

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages.length, scrollToBottom]);
  
  return {
    sessions, sessionsLoading, totalUnread,
    activeSession, messages, messagesLoading,
    sending, uploading, hasMore, loadingMore,
    replyTo, previewImage,
    messagesEndRef, messagesContainerRef,
    fetchSessions, openSession, closeSession: () => { setActiveSession(null); setMessages([]); cleanup(); },
    initResellerChat,
    sendMessage, loadMoreMessages, uploadImage,
    setReplyTo, setPreviewImage, scrollToBottom,
  };
}