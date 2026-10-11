import { CircularProgress, Stack, Typography } from '@mui/material';
import SMMInformation from './smmInformation';
import { SmmCategories, SmmServices, useSmmGate } from './vendorSMM';
import { Lock } from '@mui/icons-material';
import TransactionSmm from './transactionSmm';

const pages = {
  'smm-info': SMMInformation,
  'smm-pay': TransactionSmm,
  'smm-vendor-kategori': SmmCategories,
  'smm-vendor-list': SmmServices,
};

export default function SmmPage({ activeSubPage }) {
  const { checking, allowed, message, notify } = useSmmGate();
  const activePage = activeSubPage || 'smm-info';
  const PageComponent = pages[activePage] || SMMInformation;

  if (checking) return <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '50vh', gap: 2 }}><CircularProgress /><Typography color="text.disabled">Checking access…</Typography></Stack>;
  if (!allowed) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '50vh', gap: 2 }}>
        <Lock sx={{ fontSize: 48, color: 'text.disabled' }} />
        <Typography color="text.disabled">{message || 'Fitur SMM tidak aktif untuk bot ini.'}</Typography>
      </Stack>
    );
  }
  
  return <PageComponent {...{ notify }} />;
}
