import { useState } from 'react';
import AdminLoginPage from './AdminLoginPage';
import AdminDashboard from './AdminDashboard';

export default function AdminPage() {
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
    return <AdminLoginPage onLogin={handleLogin} />;
  }

  return <AdminDashboard password={password} onLogout={handleLogout} />;
}
