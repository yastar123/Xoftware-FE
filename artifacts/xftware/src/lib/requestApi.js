import Config from '@/config';
import Cookies from 'js-cookie';

const emitSocket = (event, data) => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.__socket && window.__socket.connected) {
      const socket = window.__socket;
      const payloadString = JSON.stringify(data);
      const CHUNK_SIZE = 512 * 1024; // 512KB per potongan

      if (payloadString.length > CHUNK_SIZE) {
        const transferId = `TX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log(`[Socket] Sending large data via chunking: ${transferId} (${payloadString.length} bytes)`);

        socket.emit('chunk_start', {
          transferId,
          totalSize: payloadString.length
        });

        for (let i = 0; i < payloadString.length; i += CHUNK_SIZE) {
          const chunk = payloadString.slice(i, i + CHUNK_SIZE);
          socket.emit('chunk_data', { transferId, chunk });
        }

        const handleAuthResponse = (res) => {
          if (res && (res.code === 401 || res.code === 403)) {
            const msg = String(res.message || '');
            if (
              msg.includes('Sesi') ||
              msg.includes('login kembali') ||
              msg.includes('kata sandi') ||
              msg.includes('kedaluarsa') ||
              msg.includes('Token tidak valid') ||
              msg.includes('Account suspended')
            ) {
              Cookies.remove('__access__token__', { path: '/' });
              Cookies.remove('__access__token__');
              if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                sessionStorage.setItem('logout_reason', msg);
                window.location.href = '/login';
              }
            }
          }
          return res;
        };

        socket.emit('chunk_end', { transferId, eventName: event }, (res) => {
          resolve(handleAuthResponse(res));
        });
      } else {
        socket.emit(event, data, (res) => {
          if (res && (res.code === 401 || res.code === 403)) {
            const msg = String(res.message || '');
            if (
              msg.includes('Sesi') ||
              msg.includes('login kembali') ||
              msg.includes('kata sandi') ||
              msg.includes('kedaluarsa') ||
              msg.includes('Token tidak valid') ||
              msg.includes('Account suspended')
            ) {
              Cookies.remove('__access__token__', { path: '/' });
              Cookies.remove('__access__token__');
              if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                sessionStorage.setItem('logout_reason', msg);
                window.location.href = '/login';
              }
            }
          }
          resolve(res);
        });
      }
    } else {
      console.error('[Socket] Connection not available for event:', event);
      resolve({ error: true, code: 0, message: 'Koneksi terputus. Sedang mencoba menghubungkan kembali...' });
    }
  });
};

/**
 * Endpoint Khusus Cek Sesi (HTTP)
 * Digunakan saat inisialisasi halaman (SSR/Initial Mount) sebelum socket terhubung.
 */
export const reqCheckSession = async (role = 'owner') => {
  const token = Cookies.get('__access__token__');
  if (!token) return { error: true, code: 401, message: 'No token' };

  try {
    const endpoint = `${Config.NEXT_PUBLIC_API}/v2/owner/auth/check`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'check', role }),
    });
    return await res.json();
  } catch (er) {
    return { error: true, message: er.message };
  }
};

export const reqDev = async (data) => {
  return await emitSocket('d2', data);
};

export const reqOwner = async (data) => {
  return await emitSocket('o2', data);
};

/**
 * Endpoint Khusus Service (HTTP)
 */
export const reqApiHttp = async (path, data = {}, opts = {}) => {
  try {
    const endpoint = `${Config.NEXT_PUBLIC_API}/v2${path}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'user-agent': typeof window !== 'undefined' ? window.navigator.userAgent : 'node',
      },
      body: JSON.stringify(data),
      ...opts,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return { error: true, code: res.status, message: json?.message || `HTTP ${res.status}`, data: json };
    }
    return json;
  } catch (er) {
    return { error: true, code: 0, message: er?.message || 'Network error' };
  }
};