import React from 'react';
import SearchDomain from './search';
import ManageDomain from './manage';
import BillingDomain from './billing';

const pages = {
  'cari': SearchDomain,
  'manage': ManageDomain,
  'billing': BillingDomain,
};

export default function DomainProviderPage({ activeSubPage, setOnResumeReady }) {
  const activePage = activeSubPage || 'cari';
  const PageComponent = pages[activePage] || SearchDomain;
  return <PageComponent setOnResumeReady={setOnResumeReady} />;
}
