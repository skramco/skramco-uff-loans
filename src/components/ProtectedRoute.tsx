import { useAuth } from '../contexts/AuthContext';
import { useBorrowerSession } from '../contexts/BorrowerSessionContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { session: borrowerSession } = useBorrowerSession();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && !borrowerSession) {
    window.location.href = '/login';
    return null;
  }

  return <>{children}</>;
}
