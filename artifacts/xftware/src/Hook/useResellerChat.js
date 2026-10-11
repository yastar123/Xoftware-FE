import { useState, useRef, useCallback, useEffect } from 'react';
import { reqOwner } from '@/lib/requestApi';
import { toast } from 'react-toastify';

const POLLING_INTERVAL = 5000;
const MAX_MESSAGES = 200;

export function useResellerChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [sellerInfo, setSellerInfo] = useState(null);
  const [productInfo, setProductInfo] = useState(null);
  const [isAlreadyCloned, setIsAlreadyCloned] = useState(false);
  const [clonedProductId, setClonedProductId] = useState(null);
  const [providerStockId, setProviderStockId] = useState(null);
  
  const [replyTo, setReplyTo] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const pollingRef = useRef(null);
  const abortRef = useRef(new AbortController());
  
  const scrollToBottom = useCallback((smooth = true) => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'instant' 
      });
    }, 100);
  }, []);
  
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);
  
  const startPolling = useCallback((sid) => {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const res = await reqOwner({ 
          action: 'v2GetResellerChatMessages', 
          sessionId: sid, 
          limit: 10 
        });
        if (!res.error && res.data?.rows) {
          setMessages(prev => {
            const newMsgs = res.data.rows.filter((nm) =>
                !prev.some(pm => pm.id === nm.id) && nm.message_type !== 'system'
            );
            if (newMsgs.length > 0) {
              return [...prev, ...newMsgs].slice(-MAX_MESSAGES);
            }
            return prev;
          });
        }
      } catch (err) {
      }
    }, POLLING_INTERVAL);
  }, [stopPolling]);
  
  const initChat = useCallback(async (stockId, isCloned = false) => {
    setInitializing(true);
    setMessages([]);
    setReplyTo(null);
    setPreviewImage(null);
    abortRef.current.abort();
    abortRef.current = new AbortController();
    
    try {
      const action = isCloned ? 'v2InitClonedProductChat' : 'v2InitMarketplaceChat';
      const param = isCloned ? 'productId' : 'providerStockId';
      
      const res = await reqOwner({ 
        action, 
        [param]: stockId 
      }, { signal: abortRef.current.signal });
      
      if (res.error) {
        toast.error(res.message || 'Gagal memulai chat');
        setInitializing(false);
        return false;
      }
      
      const data = res.data;
      setSessionId(data.sessionId);
      setSellerInfo(data.sellerInfo);
      setProductInfo(data.productInfo);
      setIsAlreadyCloned(data.isAlreadyCloned);
      setClonedProductId(data.clonedProductId);
      setProviderStockId(data.providerStockId);
      setIsOpen(true);
      const msgRes = await reqOwner({ 
        action: 'v2GetResellerChatMessages', 
        sessionId: data.sessionId, 
        limit: 50 
      });
      
      if (!msgRes.error && msgRes.data?.rows) {
        setMessages(msgRes.data.rows);
        setHasMore(msgRes.data.hasMore);
        scrollToBottom(false);
      }
      
      startPolling(data.sessionId);
      setInitializing(false);
      return true;
    } catch (err) {
      if (err?.name !== 'AbortError') {
        toast.error('Gagal memulai chat');
      }
      setInitializing(false);
      return false;
    }
  }, [startPolling, scrollToBottom]);
  
  const loadMoreMessages = useCallback(async () => {
    if (!sessionId || loadingMore || !hasMore) return;
    setLoadingMore(true);
    
    try {
      const oldestMsg = messages[0];
      const res = await reqOwner({ 
        action: 'v2GetResellerChatMessages', 
        sessionId, 
        limit: 30,
        beforeId: oldestMsg?.id 
      });
      
      if (!res.error && res.data?.rows) {
        setMessages(prev => [...res.data.rows, ...prev]);
        setHasMore(res.data.hasMore);
        const container = messagesContainerRef.current;
        const prevHeight = container?.scrollHeight;
        setTimeout(() => {
          if (container && prevHeight) {
            container.scrollTop = container.scrollHeight - prevHeight;
          }
        }, 50);
      }
    } catch (err) {
      // Silent
    }
    setLoadingMore(false);
  }, [sessionId, loadingMore, hasMore, messages]);
  
  const sendMessage = useCallback(async (content, type = 'text', fileUrl = null) => {
    if (!sessionId || sending) return null;
    
    if (type === 'text' && !content?.trim()) return null;
    if (type === 'image' && !fileUrl) return null;
    
    // Optimistic update
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      session_id: sessionId,
      message_type: type,
      content: content,
      file_url: fileUrl,
      reply_to_chat_id: replyTo?.id || null,
      direction: 'to_seller',
      is_read: false,
      createdAt: new Date().toISOString(),
      _isTemp: true,
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    setReplyTo(null);
    scrollToBottom();
    setSending(true);
    
    try {
      const res = await reqOwner({
        action: 'v2SendResellerMessage',
        sessionId,
        type,
        content,
        fileUrl,
        replyToId: replyTo?.id || null,
      });
      
      if (res.error) {
        // Remove optimistic and show error
        setMessages(prev => prev.filter(m => m.id !== tempId));
        toast.error(res.message || 'Gagal mengirim pesan');
        setSending(false);
        return null;
      }
      const realMsg = res.data;
      setMessages(prev => prev.map(m => 
        m.id === tempId ? { ...realMsg, _isTemp: false } : m
      ));
      
      setSending(false);
      return realMsg;
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast.error('Gagal mengirim pesan');
      setSending(false);
      return null;
    }
  }, [sessionId, sending, replyTo, scrollToBottom]);
  
  const uploadImage = useCallback(async (file) => {
    if (!file) return null;
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await reqOwner({
        action: 'v2UploadChatImage',
      }, {
        method: 'POST',
        body: formData,
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
  }, []);
  
  const closeChat = useCallback(() => {
    stopPolling();
    setIsOpen(false);
    setSessionId(null);
    setMessages([]);
    setSellerInfo(null);
    setProductInfo(null);
    setReplyTo(null);
    setPreviewImage(null);
    abortRef.current.abort();
  }, [stopPolling]);
  
  useEffect(() => {
    return () => {
      stopPolling();
      abortRef.current.abort();
    };
  }, [stopPolling]);
  
  return {
    // State
    isOpen,
    loading,
    sending,
    uploading,
    initializing,
    sessionId,
    messages,
    hasMore,
    loadingMore,
    sellerInfo,
    productInfo,
    isAlreadyCloned,
    clonedProductId,
    providerStockId,
    replyTo,
    previewImage,
    messagesEndRef,
    messagesContainerRef,
    initChat,
    closeChat,
    sendMessage,
    loadMoreMessages,
    uploadImage,
    setReplyTo,
    setPreviewImage,
    scrollToBottom,
  };
}