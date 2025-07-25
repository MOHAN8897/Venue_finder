
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { OverviewPage as SuperadminOverviewPage } from '@/components/dashboard/OverviewPage';
import { VenuesPage as SuperadminVenuesPage } from '@/components/dashboard/VenuesPage';
import { UsersPage as SuperadminUsersPage } from '@/components/dashboard/UsersPage';
import { AdminsPage as SuperadminAdminsPage } from '@/components/dashboard/AdminsPage';
import { PaymentsPage as SuperadminPaymentsPage } from '@/components/dashboard/PaymentsPage';
import { ReportsPage as SuperadminReportsPage } from '@/components/dashboard/ReportsPage';
import { ActivityPage as SuperadminActivityPage } from '@/components/dashboard/ActivityPage';
import { SettingsPage as SuperadminSettingsPage } from '@/components/dashboard/SettingsPage';
import NotFound from './NotFound';

const Index = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<SuperadminOverviewPage />} />
        <Route path="dashboard" element={<Navigate to="/super-admin/superadmin-overview" replace />} />
        <Route path="superadmin-overview" element={<SuperadminOverviewPage />} />
        <Route path="superadmin-dashboard" element={<SuperadminOverviewPage />} />
        <Route path="superadmin-dashboard/*" element={<SuperadminOverviewPage />} />
        <Route path="superadmin-venues" element={<SuperadminVenuesPage />} />
        <Route path="superadmin-users" element={<SuperadminUsersPage />} />
        <Route path="superadmin-admins" element={<SuperadminAdminsPage />} />
        <Route path="superadmin-payments" element={<SuperadminPaymentsPage />} />
        <Route path="superadmin-reports" element={<SuperadminReportsPage />} />
        <Route path="superadmin-activity" element={<SuperadminActivityPage />} />
        <Route path="superadmin-settings" element={<SuperadminSettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </DashboardLayout>
  );
};

export default Index;
