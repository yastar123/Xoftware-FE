import React, { useState } from 'react';
import { Box, Stack, Button, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import ChangeEmailPage from './changeEmail';
import SettingPassword from './password';
import SettingSecurityPin from './setPinWD';
import SettingBankAccounts from './bankAccount';
import SettingPaymentChannel from './paymentChannel';
import OwnerTelegramNotificationPage from './notification';
import ApiSettingPage from './apiSetting';
import WebhookSettingPage from './webhookSetting';
import TwoFactorAuthPage from './twoFactorAuth';
import QrisTemplatePage from './qrisTemplate';
import ResellerApiSettingPage from './resellerApi';

const pages = {
  'change-email': ChangeEmailPage,
  password: SettingPassword,
  'pin-wd': SettingSecurityPin,
  'bank-account': SettingBankAccounts,
  'payment-channel': SettingPaymentChannel,
  notification: OwnerTelegramNotificationPage,
  'api-key': ApiSettingPage,
  webhook: WebhookSettingPage,
  '2fa': TwoFactorAuthPage,
  'qris-template': QrisTemplatePage,
  'reseller-api': ResellerApiSettingPage,
};

function AccountSecurityPage() {
  const [activeTab, setActiveTab] = useState('change-email');

  const tabs = [
    { key: 'change-email', label: 'Ganti Email' },
    { key: 'password', label: 'Password' },
    { key: '2fa', label: '2FA Authenticator' },
    { key: 'pin-wd', label: 'PIN Withdraw' },
  ];

  const renderContent = () => {
    const PageComponent = pages[activeTab] || ChangeEmailPage;
    return <PageComponent />;
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        {tabs.map(tab => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setActiveTab(tab.key)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {tab.label}
          </Button>
        ))}
      </Stack>
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderContent()}
      </motion.div>
    </Box>
  );
}

function PaymentFinancePage() {
  const [activeTab, setActiveTab] = useState('bank-account');

  const tabs = [
    { key: 'bank-account', label: 'Rekening Bank' },
    { key: 'payment-channel', label: 'Channel Pembayaran' },
    { key: 'qris-template', label: 'Template QRIS' },
  ];

  const renderContent = () => {
    const PageComponent = pages[activeTab] || SettingBankAccounts;
    return <PageComponent />;
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        {tabs.map(tab => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setActiveTab(tab.key)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {tab.label}
          </Button>
        ))}
      </Stack>
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderContent()}
      </motion.div>
    </Box>
  );
}

function IntegrationApiPage() {
  const [activeTab, setActiveTab] = useState('api-key');

  const tabs = [
    { key: 'api-key', label: 'Manajemen API' },
    { key: 'webhook', label: 'Webhook' },
    { key: 'reseller-api', label: 'API Reseller (H2H)' },
  ];

  const renderContent = () => {
    const PageComponent = pages[activeTab] || ApiSettingPage;
    return <PageComponent />;
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        {tabs.map(tab => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setActiveTab(tab.key)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {tab.label}
          </Button>
        ))}
      </Stack>
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderContent()}
      </motion.div>
    </Box>
  );
}

export default function SettingPage({ activeSubPage }) {
  switch (activeSubPage) {
    case 'account-security':
      return <AccountSecurityPage />;
    case 'payment-finance':
      return <PaymentFinancePage />;
    case 'notification':
      return <OwnerTelegramNotificationPage />;
    case 'integration-api':
      return <IntegrationApiPage />;
    default:
      return <AccountSecurityPage />;
  }
}