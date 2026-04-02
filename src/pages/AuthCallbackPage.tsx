import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

function safeNext(raw: string | null, fallback: string): string {
  if (!raw) return fallback;
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback;
  try {
    const u = new URL(raw, 'https://uff.loans');
    if (u.origin !== 'https://uff.loans') return fallback;
    return u.pathname + u.search + u.hash;
  } catch {
    return fallback;
  }
}

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Signing you in…');

  useEffect(() => {
    let cancelled = false;

    const hasLead = typeof window !== 'undefined' && !!localStorage.getItem('uff_lead');
    const fallback = hasLead ? '/apply' : '/my-loan';
    const target = safeNext(searchParams.get('next'), fallback);

    const finish = (path: string) => {
      navigate(path, { replace: true });
    };

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        if (session?.user) {
          finish(target);
          return;
        }

        await new Promise<void>((resolve) => {
          let timeoutId: ReturnType<typeof setTimeout>;
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
            if (
              sess?.user &&
              (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')
            ) {
              window.clearTimeout(timeoutId);
              subscription.unsubscribe();
              resolve();
            }
          });
          timeoutId = window.setTimeout(() => {
            subscription.unsubscribe();
            resolve();
          }, 6000);
        });

        if (cancelled) return;
        const { data: { session: after } } = await supabase.auth.getSession();
        if (after?.user) {
          finish(target);
          return;
        }

        setMessage('We could not finish sign-in from this link. Try the login page.');
        window.setTimeout(() => {
          if (!cancelled) finish('/login');
        }, 3500);
      } catch {
        if (!cancelled) finish('/login');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center text-gray-600 flex flex-col items-center gap-3 max-w-sm">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" aria-hidden />
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
}
