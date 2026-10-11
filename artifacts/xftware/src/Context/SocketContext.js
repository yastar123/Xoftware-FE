import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import parser from 'socket.io-msgpack-parser';
import Cookies from 'js-cookie';
import Config from '@/config';

const SocketContext = createContext({
  socket: null,
  connected: false,
  emit: () => { },
  reconnect: () => { },
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = React.useRef(null);

  const initSocket = useCallback(() => {
    const token = Cookies.get('__access__token__');
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    if (socketRef.current && socketRef.current.connected) return;

    // Disconnect any existing disconnected socket before creating a new one
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socketUrl = Config.NEXT_PUBLIC_API.startsWith('http')
      ? Config.NEXT_PUBLIC_API
      : (typeof window !== 'undefined' ? window.location.origin : '');

    const socketPath = '/ws';

    const newSocket = io(socketUrl, {
      path: socketPath,
      parser,
      auth: {
        token: `Bearer ${token}`
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected:', newSocket.id);
      setConnected(true);
      window.__socket = newSocket;
    });

    newSocket.on('force_logout', (data) => {
      console.warn('[Socket] Force logout event received:', data);
      Cookies.remove('__access__token__', { path: '/' });
      Cookies.remove('__access__token__');
      setConnected(false);
      window.__socket = null;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (typeof window !== 'undefined') {
        const reason = data?.message || 'Sesi Anda telah berakhir karena password telah diubah. Silakan login kembali.';
        sessionStorage.setItem('logout_reason', reason);
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setConnected(false);
      window.__socket = null;
    });

    newSocket.on('connect_error', (err) => {
      console.error('[Socket] Connection Error:', err.message);
      setConnected(false);
      window.__socket = null;
      const msg = String(err.message || '');
      if (
        msg.includes('Sesi') ||
        msg.includes('kedaluarsa') ||
        msg.includes('kata sandi') ||
        msg.includes('Token tidak valid') ||
        msg.includes('Authentication token required') ||
        msg.includes('Account suspended')
      ) {
        Cookies.remove('__access__token__', { path: '/' });
        Cookies.remove('__access__token__');
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          sessionStorage.setItem('logout_reason', msg);
          window.location.href = '/login';
        }
      }
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
  }, []);

  useEffect(() => {
    initSocket();

    // Cleanup on unmount using the ref to avoid stale closure
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [initSocket]);

  // Handle visibility change and network online events for reconnection
  useEffect(() => {
    const handleReconnection = () => {
      if (socketRef.current && !socketRef.current.connected) {
        console.log('[Socket] Forcing reconnection (visibility/online event)...');
        socketRef.current.disconnect();
        setTimeout(() => {
          if (socketRef.current) socketRef.current.connect();
        }, 300);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleReconnection();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleReconnection);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleReconnection);
    };
  }, []);

  // Monitor token changes (e.g. login/logout)
  useEffect(() => {
    const interval = setInterval(() => {
      const token = Cookies.get('__access__token__');
      if (!token && socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
      } else if (token && !socketRef.current) {
        initSocket();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [initSocket]);

  const emit = useCallback((event, payload, callback) => {
    if (!socketRef.current || !socketRef.current.connected) {
      console.warn('[Socket] Not connected, cannot emit:', event);
      if (callback) callback({ error: true, message: 'Socket not connected', code: 0 });
      return;
    }

    socket.emit(event, payload, (res) => {
      if (callback) callback(res);
    });
  }, [socket, connected]);

  // Force reconnect: disconnect current socket and reinitialize
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
    }
    setTimeout(() => {
      initSocket();
    }, 300);
  }, [initSocket]);

  return (
    <SocketContext.Provider value={{ socket, connected, emit, reconnect }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
