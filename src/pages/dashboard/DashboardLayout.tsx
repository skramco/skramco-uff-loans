import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, LogOut } from 'lucide-react';
import { useBorrowerSession } from '../../contexts/BorrowerSessionContext';
import { extractBorrower } from '../../services/loanDataHelpers';
import OverviewTab from './tabs/OverviewTab';
import FinancialsTab from './tabs/FinancialsTab';
import ConditionsTab from './tabs/ConditionsTab';
import DetailsTab from './tabs/DetailsTab';
import PreApprovalTab from './tabs/PreApprovalTab';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'financials', label: 'Financials' },
  { id: 'conditions', label: 'Conditions' },
  { id: 'details', label: 'Details' },
  { id: 'preapproval', label: 'Pre-Approval' },
] as const;

type TabId = typeof tabs[number]['id'];

export default function DashboardLayout() {
  const { session, logout } = useBorrowerSession();
  const navigate = useNavigate();
  const [active, setActive] = useState<TabId>('overview');

  if (!session) {
    navigate('/login', { replace: true });
    return null;
  }

  const loan = session.loan;
  const borrower = extractBorrower(loan);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderContent = () => {
    switch (active) {
      case 'overview': return <OverviewTab loan={loan} />;
      case 'financials': return <FinancialsTab loan={loan} />;
      case 'conditions': return <ConditionsTab loan={loan} />;
      case 'details': return <DetailsTab loan={loan} />;
      case 'preapproval': return <PreApprovalTab loan={loan} />;
      default: return <OverviewTab loan={loan} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-gray-50">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 text-gray-900 hover:text-gray-700 transition-colors">
            <img src="/uff_logo.svg" alt="UFF Logo" className="h-8 w-auto" />
            <div className="h-6 w-px bg-gray-200" />
            <span className="font-bold text-sm">Borrower Portal</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:block">{borrower.fullName}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {borrower.firstName || 'Borrower'}</h1>
          <p className="text-gray-500 text-sm mt-1">Here is your loan information and status updates.</p>
        </div>

        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                active === tab.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {renderContent()}
      </div>
    </div>
  );
}
