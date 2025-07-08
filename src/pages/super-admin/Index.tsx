
import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { OverviewPage } from '@/components/dashboard/OverviewPage';
import { VenuesPage } from '@/components/dashboard/VenuesPage';
import { UsersPage } from '@/components/dashboard/UsersPage';
import { AdminsPage } from '@/components/dashboard/AdminsPage';
import { PaymentsPage } from '@/components/dashboard/PaymentsPage';
import { ReportsPage } from '@/components/dashboard/ReportsPage';
import { ActivityPage } from '@/components/dashboard/ActivityPage';
import { SettingsPage } from '@/components/dashboard/SettingsPage';
import NotFound from './NotFound';

const Index = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<OverviewPage />} />
        <Route path="overview" element={<OverviewPage />} />
        <Route path="dashboard" element={<OverviewPage />} />
        <Route path="dashboard/*" element={<OverviewPage />} />
        <Route path="venues" element={<VenuesPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="admins" element={<AdminsPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </DashboardLayout>
  );
};

export default Index;
