import { useState } from 'react';
import { Lock, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { adminLogin } from '../../services/adminService';

interface Props {
  onLogin: (password: string) => void;
}

export default function AdminLoginPage({ onLogin }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!password.trim()) {
      setError('Please enter the admin password.');
      return;
    }
    setLoading(true);

    const result = await adminLogin(password);
    if (result.success) {
      onLogin(password);
    } else {
      setError(result.error || 'Invalid password');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-800 border border-slate-700 mb-4">
            <ShieldCheck className="w-7 h-7 text-slate-400" />
          </div>
          <h1 className="text-xl font-bold text-white">Admin Access</h1>
          <p className="text-sm text-slate-500 mt-1">Restricted area</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-shadow"
              placeholder="Enter admin password"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 focus:ring-4 focus:ring-red-500/30 transition-all disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
