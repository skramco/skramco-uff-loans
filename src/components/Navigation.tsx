import { Home, Calculator, BookOpen, FileText, Menu, X, LogIn } from 'lucide-react';
import { useState } from 'react';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'programs', label: 'Loan Programs', icon: FileText },
    { id: 'calculators', label: 'Calculators', icon: Calculator },
    { id: 'education', label: 'Resources', icon: BookOpen },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center cursor-pointer" onClick={() => onNavigate('home')}>
            <img
              src="/uff_logo.svg"
              alt="United Fidelity Funding Corp"
              className="h-12 sm:h-14"
            />
          </div>

          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    currentPage === item.id
                      ? 'bg-red-50 text-red-600 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
            <a
              href="/login"
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span className="font-medium">Borrower Login</span>
            </a>
            <button
              onClick={() => onNavigate('apply')}
              className="ml-4 px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 hover:shadow-lg transition-all"
            >
              Get Started
            </button>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-2 px-4 py-3 rounded-lg transition-all ${
                    currentPage === item.id
                      ? 'bg-red-50 text-red-600 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
            <a
              href="/login"
              className="w-full flex items-center space-x-2 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span className="font-medium">Borrower Login</span>
            </a>
            <button
              onClick={() => {
                onNavigate('apply');
                setMobileMenuOpen(false);
              }}
              className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 hover:shadow-lg transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
