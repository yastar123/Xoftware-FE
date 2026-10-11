import TransactionContent from './transaction';
import MutationMerchant from './mutationQRIS';


const pages = {
  'qris-pay': TransactionContent,
  'mutation-pay': MutationMerchant,

};

export default function TransactionPage({ activeSubPage }) {
  const activePage = activeSubPage || 'qris-pay';
  const PageComponent = pages[activePage] || TransactionContent;
  return <PageComponent />;
}