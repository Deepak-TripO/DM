import { Header } from '@/components/Header';
import { FinanceView } from '@/pages/finance/FinanceView';
import { useAppLayout } from '@/layouts/AppLayout';

export default function HomePage() {
  const { sidebarOpen, toggleSidebar } = useAppLayout();

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        onLogoClick={toggleSidebar}
        sidebarOpen={sidebarOpen}
      />
      <div className="p-4 md:p-6">
        <FinanceView />
      </div>
    </div>
  );
}
