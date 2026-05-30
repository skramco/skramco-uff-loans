import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLoginPage from '../../components/admin/AdminLoginPage';
import MarketingAdminLayout from '../../components/admin/marketing/MarketingAdminLayout';
import MarketingDashboard from '../../components/admin/marketing/MarketingDashboard';
import CampaignList from '../../components/admin/marketing/CampaignList';
import CampaignDetail from '../../components/admin/marketing/CampaignDetail';
import TemplateList from '../../components/admin/marketing/TemplateList';
import MarketingSettingsPage from '../../components/admin/marketing/MarketingSettings';
import MetricsDashboard from '../../components/admin/marketing/MetricsDashboard';

export default function MarketingAdminPage() {
  const [password, setPassword] = useState<string | null>(() => {
    return sessionStorage.getItem('adminPassword');
  });

  function handleLogin(pw: string) {
    sessionStorage.setItem('adminPassword', pw);
    setPassword(pw);
  }

  function handleLogout() {
    sessionStorage.removeItem('adminPassword');
    setPassword(null);
  }

  if (!password) {
    return (
      <AdminLoginPage
        onLogin={handleLogin}
        title="UFF Marketing Admin"
        subtitle="Sign in to manage marketing campaigns"
      />
    );
  }

  return (
    <Routes>
      <Route element={<MarketingAdminLayout onLogout={handleLogout} />}>
        <Route index element={<MarketingDashboard password={password} />} />
        <Route path="campaigns" element={<CampaignList password={password} />} />
        <Route path="campaigns/:id" element={<CampaignDetail password={password} />} />
        <Route path="templates" element={<TemplateList password={password} />} />
        <Route path="settings" element={<MarketingSettingsPage password={password} />} />
        <Route path="metrics" element={<MetricsDashboard password={password} />} />
        <Route path="*" element={<Navigate to="/admin/marketing" replace />} />
      </Route>
    </Routes>
  );
}
