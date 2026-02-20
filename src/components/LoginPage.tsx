import { useState, useEffect } from 'react';
import { useBorrowerSession } from '../contexts/BorrowerSessionContext';
import { borrowerLogin } from '../services/vestaService';
import { FileText, MapPin, AlertCircle, ArrowRight, ArrowLeft, Loader2, ShieldCheck, Phone } from 'lucide-react';

export default function LoginPage() {
  const { session } = useBorrowerSession();
  const [step, setStep] = useState<1 | 2>(1);
  const [loanNumber, setLoanNumber] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phoneLast4, setPhoneLast4] = useState('');
  const [noZipCode, setNoZipCode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useBorrowerSession();

  useEffect(() => {
    if (session) {
      window.location.href = '/dashboard';
    }
  }, [session]);

  function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!loanNumber.trim()) {
      setError('Please enter your loan number.');
      return;
    }
    setStep(2);
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const hasZip = !noZipCode && zipCode.trim().length > 0;
    const hasPhone = phoneLast4.trim().length > 0;

    if (!hasZip && !hasPhone) {
      setError(
        noZipCode
          ? 'Please enter the last 4 digits of your mobile phone number.'
          : 'Please enter your property zip code or the last 4 digits of your mobile phone number.'
      );
      return;
    }

    if (noZipCode && !hasPhone) {
      setError('Since you don\'t have a property address, the last 4 digits of your mobile phone number are required.');
      return;
    }

    if (hasPhone && phoneLast4.trim().length !== 4) {
      setError('Please enter exactly 4 digits for your phone number.');
      return;
    }

    setLoading(true);

    const result = await borrowerLogin(
      loanNumber.trim(),
      hasZip ? zipCode.trim() : undefined,
      hasPhone ? phoneLast4.trim() : undefined
    );

    if (result.success && result.loan) {
      login(loanNumber.trim(), result.loan);
      window.location.href = '/dashboard';
    } else {
      setError(result.error || 'Unable to verify your loan. Please try again.');
      if (result.zipMismatch) {
        setStep(1);
        setZipCode('');
        setPhoneLast4('');
      }
      setLoading(false);
    }
  }

  function handleBack() {
    setStep(1);
    setZipCode('');
    setPhoneLast4('');
    setNoZipCode(false);
    setError('');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100/30 to-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-8 py-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white/15 backdrop-blur-sm rounded-xl mb-4">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Borrower Portal</h1>
            <p className="text-red-100 text-sm">
              Access your loan information securely
            </p>
          </div>

          <div className="px-8 pt-6 pb-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    step >= 1
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  1
                </div>
                <span className={`text-sm font-medium ${step >= 1 ? 'text-gray-900' : 'text-gray-400'}`}>
                  Loan Number
                </span>
              </div>
              <div className="h-px flex-1 bg-gray-200 max-w-[40px]" />
              <div className="flex items-center gap-2 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    step >= 2
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  2
                </div>
                <span className={`text-sm font-medium ${step >= 2 ? 'text-gray-900' : 'text-gray-400'}`}>
                  Verify
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mx-8 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 leading-relaxed">{error}</p>
            </div>
          )}

          <div className="px-8 pb-8">
            {step === 1 && (
              <form onSubmit={handleStep1} className="space-y-5">
                <div>
                  <label htmlFor="loanNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Loan Number
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="loanNumber"
                      type="text"
                      value={loanNumber}
                      onChange={(e) => setLoanNumber(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-shadow"
                      placeholder="Enter your loan number"
                      autoFocus
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    This was provided when your loan application was submitted.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-red-600 text-white py-3.5 px-4 rounded-xl font-semibold hover:bg-red-700 focus:ring-4 focus:ring-red-200 transition-all flex items-center justify-center gap-2"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleStep2} className="space-y-5">
                <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3 mb-1">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Loan Number</p>
                    <p className="text-sm font-semibold text-gray-900">{loanNumber}</p>
                  </div>
                </div>

                <div>
                  <label htmlFor="zipCode" className={`block text-sm font-medium mb-2 ${noZipCode ? 'text-gray-400' : 'text-gray-700'}`}>
                    Property Zip Code
                  </label>
                  <div className="relative">
                    <MapPin className={`absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 ${noZipCode ? 'text-gray-300' : 'text-gray-400'}`} />
                    <input
                      id="zipCode"
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      disabled={noZipCode}
                      className={`w-full pl-11 pr-4 py-3.5 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-gray-400 transition-all ${
                        noZipCode
                          ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'border-gray-300 text-gray-900'
                      }`}
                      placeholder="Enter the subject property zip code"
                      maxLength={10}
                      autoFocus={!noZipCode}
                    />
                  </div>
                  <label className="flex items-center gap-2 mt-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={noZipCode}
                      onChange={(e) => {
                        setNoZipCode(e.target.checked);
                        if (e.target.checked) setZipCode('');
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">
                      I don't have a property address yet
                    </span>
                  </label>
                </div>

                <div className="relative flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                    {noZipCode ? 'then verify with' : 'and / or'}
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <div>
                  <label htmlFor="phoneLast4" className="block text-sm font-medium text-gray-700 mb-2">
                    Last 4 Digits of Mobile Phone
                    {noZipCode && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="phoneLast4"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={phoneLast4}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setPhoneLast4(val);
                      }}
                      className="w-full pl-11 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-shadow"
                      placeholder="Last 4 digits"
                      maxLength={4}
                      autoFocus={noZipCode}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    The mobile number you provided on your loan application.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={loading}
                    className="flex-shrink-0 bg-gray-100 text-gray-700 py-3.5 px-5 rounded-xl font-semibold hover:bg-gray-200 focus:ring-4 focus:ring-gray-200 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-red-600 text-white py-3.5 px-4 rounded-xl font-semibold hover:bg-red-700 focus:ring-4 focus:ring-red-200 transition-all flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Sign In'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">
            Back to home
          </a>
        </div>
      </div>
    </div>
  );
}
