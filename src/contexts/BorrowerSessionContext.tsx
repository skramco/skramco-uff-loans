import { createContext, useContext, useState, useEffect } from 'react';

interface BorrowerSession {
  loanNumber: string;
  loan: any;
}

interface BorrowerSessionContextType {
  session: BorrowerSession | null;
  login: (loanNumber: string, loan: any) => void;
  logout: () => void;
}

const SESSION_KEY = 'borrowerSession';

const BorrowerSessionContext = createContext<BorrowerSessionContextType | undefined>(undefined);

export function BorrowerSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<BorrowerSession | null>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (session) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [session]);

  function login(loanNumber: string, loan: any) {
    setSession({ loanNumber, loan });
  }

  function logout() {
    setSession(null);
  }

  return (
    <BorrowerSessionContext.Provider value={{ session, login, logout }}>
      {children}
    </BorrowerSessionContext.Provider>
  );
}

export function useBorrowerSession() {
  const context = useContext(BorrowerSessionContext);
  if (context === undefined) {
    throw new Error('useBorrowerSession must be used within a BorrowerSessionProvider');
  }
  return context;
}
