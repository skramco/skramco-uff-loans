import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone, ChevronDown, Globe } from 'lucide-react';

const navLinks = [
  { label: 'Buy', href: '/buy' },
  { label: 'Refinance', href: '/refinance' },
  { label: 'Use Equity', href: '/equity' },
  { label: 'Rates', href: '/rates' },
  { label: 'Calculators', href: '/calculators' },
  { label: 'Learn', href: '/learn' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isHome = location.pathname === '/';
  const headerBg = scrolled || !isHome
    ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100'
    : 'bg-transparent';
  const textColor = scrolled || !isHome ? 'text-gray-900' : 'text-white';

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerBg}`}>
      <div className="container-wide">
        <div className="flex items-center justify-between h-16 md:h-18">
          <Link to="/" className="flex items-center shrink-0">
            <img
              src={scrolled || !isHome ? '/uff_logo.svg' : '/uff_logo_darkbg.svg'}
              alt="United Fidelity Funding Corp."
              className="h-10 md:h-12 w-auto transition-all"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-white/10 ${
                  location.pathname === link.href
                    ? scrolled || !isHome ? 'text-brand-600 bg-brand-50' : 'text-white bg-white/15'
                    : textColor
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <button className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition-colors ${textColor} opacity-70 hover:opacity-100`}>
              <Globe className="w-3.5 h-3.5" />
              ES
            </button>
            <a
              href="tel:855-95-32453"
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${textColor} hover:opacity-80`}
            >
              <Phone className="w-4 h-4" />
              <span className="hidden xl:inline">(855) 95-EAGLE</span>
            </a>
            <Link
              to="/login"
              className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${textColor} hover:opacity-80`}
            >
              Sign in
            </Link>
            <Link
              to="/start"
              className="text-sm font-semibold px-5 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
            >
              Get started
            </Link>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${textColor}`}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-xl animate-fade-in">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  location.pathname === link.href
                    ? 'text-brand-600 bg-brand-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <hr className="my-3 border-gray-100" />
            <Link
              to="/login"
              className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              Sign in
            </Link>
            <Link
              to="/start"
              className="block text-center px-4 py-3 text-sm font-semibold bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
            >
              Get started
            </Link>
            <a
              href="tel:855-95-32453"
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-500"
            >
              <Phone className="w-4 h-4" />
              (855) 95-EAGLE
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
