import { useState } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { SmartToy } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { reqOwner } from '@/lib/requestApi';
import { fileToBase64 } from '@/lib/helper';
import ServiceInfoPage from './layanan';
import BotWhatsAppConfig from './botWhatsapp';
import BotTelegramConfig from './botTelegram';
import { useEffect } from 'react';

export default function BotManage({ activeSubPage }) {
  const activePage = activeSubPage || 'layanan';
  const [loading, setLoading] = useState(false);
  const [allowTele, setAllowTele] = useState(false);
  const [teleStatus, setTeleStatus] = useState(null);
  const [form, setForm] = useState({});
  const [formInitialized, setFormInitialized] = useState(false);

  useEffect(() => {
    fetchBotInfo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBotInfo = async () => {
    try {
      const res = await reqOwner({ action: 'getInformationBot' });
      if (res?.error) return toast.error(res.message);
      const data = res.data || {};
      setAllowTele(!!data.allowTelegramBot);
      setTeleStatus(data.allowTelegramBot ? data.isTelegramOnline : null);
      if (!formInitialized) {
        setForm({
          telegramToken: data.telegramToken || '',
          telegramOwner: data.ownerTelegramId || '',
          telegramGuideDeposit: data.telegramGuideDeposit || '',
          telegramThumbnail: data.telegramThumbnail || '',
        });
        setFormInitialized(true);
      }
    } catch {
      toast.error('Gagal mengambil informasi bot');
    }
  };

  const handleChange = field => e => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleUpdateTele = async () => {
    setLoading(true);
    setFormInitialized(true);
    try {
      const payload = {
        action: 'updateInformationBot',
        telegramToken: form.telegramToken,
        ownerTelegramId: form.telegramOwner,
        telegramGuideDeposit: form.telegramGuideDeposit || '',
        telegramThumbnail: form.telegramThumbnail || '',
      };
      const res = await reqOwner(payload);
      toast[res.error ? 'error' : 'success'](res.message || 'Berhasil update konfigurasi bot');
      await fetchBotInfo();
    } catch {
      toast.error('Gagal update informasi bot');
    } finally {
      setLoading(false);
    }
  };

  const handleActionTele = async command => {
    setLoading(true);
    try {
      const res = await reqOwner({ action: 'actionBotTele', command });
      toast.success(res.message);
      setTeleStatus(res.data?.status);
    } catch {
      toast.error('Gagal memproses aksi');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadThumbnail = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    const res = await reqOwner({ action: 'uploadImage', thumbnailBuffer: base64 });
    if (!res.error) {
      toast.success('Upload thumbnail berhasil');
      setForm(prev => ({ ...prev, telegramThumbnail: res.data }));
    } else {
      toast.error(res.message || 'Gagal upload thumbnail');
    }
  };

  switch (activePage) {
    case 'layanan':
      return <ServiceInfoPage />;
    case 'bot-wa':
      return <BotWhatsAppConfig />;
    case 'bot-telegram':
      if (!allowTele) {
        return (
          <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 400, gap: 2 }}>
            <SmartToy sx={{ fontSize: 48, color: 'text.disabled' }} />
            <Typography color="text.disabled">Bot tidak diaktifkan untuk Telegram.</Typography>
          </Stack>
        );
      }
      return (
        <BotTelegramConfig
          form={form}
          loading={loading}
          teleStatus={teleStatus}
          handleChange={handleChange}
          handleUpdate={handleUpdateTele}
          handleUploadThumbnail={handleUploadThumbnail}
          handleAction={(type, command) => handleActionTele(command)}
        />
      );
    default:
      return <ServiceInfoPage />;
  }
}