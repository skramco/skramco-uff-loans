import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Loader2, Hash, MapPin, Phone } from 'lucide-react';
import { borrowerLogin } from '../services/vestaService';
import { useBorrowerSession } from '../contexts/BorrowerSessionContext';

type VerifyMethod = 'zip' | 'phone';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useBorrowerSession();

  const [loanNumber, setLoanNumber] = useState('');
  const [verifyMethod, setVerifyMethod] = useState<VerifyMethod>('zip');
  const [zipCode, setZipCode] = useState('');
  const [phoneLast4, setPhoneLast4] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!loanNumber.trim()) {
      setError('Please enter your loan number.');
      return;
    }

    if (verifyMethod === 'zip' && zipCode.length < 5) {
      setError('Please enter a valid 5-digit ZIP code.');
      return;
    }

    if (verifyMethod === 'phone' && phoneLast4.length !== 4) {
      setError('Please enter the last 4 digits of your phone number.');
      return;
    }

    setLoading(true);
    try {
      const result = await borrowerLogin(
        loanNumber.trim(),
        verifyMethod === 'zip' ? zipCode.trim() : undefined,
        verifyMethod === 'phone' ? phoneLast4.trim() : undefined,
      );

      if (result.success && result.loan) {
        login(loanNumber.trim(), result.loan);
        navigate('/dashboard');
      } else {
        setError(result.error || 'Unable to verify your information. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-center p-4">
      <Link to="/" className="mb-10">
        <img src="/uff_logo.svg" alt="United Fidelity Funding Corp." className="h-12 w-auto" />
      </Link>

      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Borrower Portal</h1>
          <p className="text-gray-600 text-sm mb-8">
            Track your loan, complete tasks, and upload documents. Enter your loan number and verify your identity to get started.
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Loan number</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={loanNumber}
                  onChange={(e) => setLoanNumber(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="e.g. 2025-001234"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Verify your identity</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setVerifyMethod('zip')}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                    verifyMethod === 'zip'
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  Property ZIP
                </button>
                <button
                  type="button"
                  onClick={() => setVerifyMethod('phone')}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                    verifyMethod === 'phone'
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  Phone (last 4)
                </button>
              </div>

              {verifyMethod === 'zip' ? (
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    maxLength={5}
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    placeholder="Property ZIP code"
                    disabled={loading}
                  />
                </div>
              ) : (
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    maxLength={4}
                    value={phoneLast4}
                    onChange={(e) => setPhoneLast4(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    placeholder="Last 4 digits of mobile number"
                    disabled={loading}
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-70 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Access my loan
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have a loan number?{' '}
            <Link to="/start" className="text-brand-600 font-medium hover:text-brand-700">
              Get started
            </Link>
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-gray-400">
          <Shield className="w-3.5 h-3.5" />
          <span>Secured with 256-bit encryption</span>
        </div>
      </div>
    </div>
  );
}
