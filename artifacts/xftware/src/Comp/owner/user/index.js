import MutationSection from "./mutation";
import UsersManagePage from "./user";

const pages = {
  'user-info': UsersManagePage,
  'user-mutation': MutationSection,
};

export default function SmmPage({ activeSubPage }) {
  const activePage = activeSubPage || 'user-info';
  const PageComponent = pages[activePage] || UsersManagePage;
  
  return <PageComponent />;
}
