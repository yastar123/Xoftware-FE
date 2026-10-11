import { useState, useCallback } from 'react';
import { reqOwner } from '@/lib/requestApi';
import { toast } from 'react-toastify';

export function useSellerChatAuth() {
  const [status, setStatus] = useState({
    loading: true,
    isConnected: false,
    hasPendingToken: false,
    connectedAt: null,
  });
  const [tokenData, setTokenData] = useState(null);
  const [requesting, setRequesting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await reqOwner({ action: 'getResellerChatStatus' });
      if (!res.error) {
        setStatus({
          loading: false,
          isConnected: res.data.isConnected,
          hasPendingToken: res.data.hasPendingToken,
          connectedAt: res.data.connectedAt,
        });
      }
    } catch (err) {
      setStatus(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const requestToken = useCallback(async () => {
    setRequesting(true);
    try {
      const res = await reqOwner({ action: 'requestConnectResellerChat' });
      if (res.error) {
        if (res.message.includes('sudah terhubung')) {
          setStatus(prev => ({ ...prev, isConnected: true, hasPendingToken: false }));
          toast.info('Bot sudah terhubung');
        } else {
          toast.error(res.message);
        }
      } else {
        setTokenData(res.data);
        setStatus(prev => ({ ...prev, isConnected: res.data.isConnected, hasPendingToken: !res.data.isConnected }));
        toast.success('Token berhasil dibuat');
      }
    } catch (err) {
      toast.error('Gagal membuat token');
    }
    setRequesting(false);
  }, []);

  const disconnect = useCallback(async () => {
    setDisconnecting(true);
    try {
      const res = await reqOwner({ action: 'disconnectResellerChat' });
      if (res.error) {
        toast.error(res.message);
      } else {
        setStatus({ loading: false, isConnected: false, hasPendingToken: false, connectedAt: null });
        setTokenData(null);
        toast.success('Bot berhasil diputuskan');
      }
    } catch (err) {
      toast.error('Gagal memutuskan koneksi');
    }
    setDisconnecting(false);
  }, []);

  return { status, tokenData, requesting, disconnecting, fetchStatus, requestToken, disconnect };
}