import { useState } from 'react';
import AdminLoginPage from '../../components/admin/AdminLoginPage';
import VestaPushDashboard from '../../components/admin/VestaPushDashboard';

const SESSION_KEY = 'vestaOpsPassword';

/** Hidden internal route — not linked from public site navigation. */
export default function VestaOpsPage() {
  const [password, setPassword] = useState<string | null>(() => {
    return sessionStorage.getItem(SESSION_KEY);
  });

  function handleLogin(pw: string) {
    sessionStorage.setItem(SESSION_KEY, pw);
    setPassword(pw);
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    setPassword(null);
  }

  if (!password) {
    return (
      <AdminLoginPage
        onLogin={handleLogin}
        title="Vesta ops"
        subtitle="Internal access only"
      />
    );
  }

  return <VestaPushDashboard password={password} onLogout={handleLogout} />;
}
