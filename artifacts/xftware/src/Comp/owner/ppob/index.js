import { CircularProgress, Stack, Typography } from '@mui/material';
import PPOBInformation from './ppobInformation';
import { BlockedView, OwnerCategories, OwnerOperators, OwnerVendorPreview, usePpobGate } from './settingTokovoucher';
import TransactionPpobContent from './transactionPpob';

const pages = {
  'ppob-info': PPOBInformation,
  'ppob-pay': TransactionPpobContent,
  'ppob-categories': OwnerCategories,
  'ppob-operators': OwnerOperators,
  'ppob-vendor-preview': OwnerVendorPreview,
};

export default function PpobPage({ activeSubPage }) {
  const { checking, allowed, message } = usePpobGate();

  const activePage = activeSubPage || 'ppob-info';
  const PageComponent = pages[activePage] || PPOBInformation;
  if (checking) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '50vh', gap: 2 }}>
        <CircularProgress />
        <Typography color="text.disabled">Checking access…</Typography>
      </Stack>
    );
  }

  if (!allowed) return <BlockedView title="Access denied!" subtitle={message || 'Fitur PPOB belum diaktifkan untuk bot ini.'} />;

  return <PageComponent />;
}
