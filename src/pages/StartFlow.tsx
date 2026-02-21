import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Home, RefreshCw, Wallet, ArrowRight, ArrowLeft, ChevronDown,
  ChevronUp, Shield, CheckCircle2, Sparkles, DollarSign,
  Send, X, Mail, Lock, Loader2, Eye, EyeOff,
} from 'lucide-react';
import ComplianceFooter from '../components/layout/ComplianceFooter';
import { useAuth } from '../contexts/AuthContext';

type Intent = 'buy' | 'refi' | 'equity';
type PropertyType = 'single' | 'condo' | 'townhouse' | 'multi';
type CreditRange = 'excellent' | 'good' | 'fair' | 'below';

interface FlowData {
  intent: Intent | '';
  zip: string;
  propertyType: PropertyType | '';
  homePrice: string;
  downPayment: string;
  currentBalance: string;
  homeValue: string;
  creditRange: CreditRange | '';
  isVeteran: boolean;
}

const creditRanges: { value: CreditRange; label: string; range: string }[] = [
  { value: 'excellent', label: 'Excellent', range: '740+' },
  { value: 'good', label: 'Good', range: '700-739' },
  { value: 'fair', label: 'Fair', range: '660-699' },
  { value: 'below', label: 'Below Average', range: 'Below 660' },
];

function formatUSD(num: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
}

export default function StartFlow() {
  const [params] = useSearchParams();
  const { signUp } = useAuth();
  const [step, setStep] = useState(1);
  const [showEmail, setShowEmail] = useState(false);
  const [checkEmailAddress, setCheckEmailAddress] = useState('');
  const [data, setData] = useState<FlowData>({
    intent: (params.get('intent') as Intent) || '',
    zip: '',
    propertyType: '',
    homePrice: '',
    downPayment: '',
    currentBalance: '',
    homeValue: '',
    creditRange: '',
    isVeteran: false,
  });

  useEffect(() => {
    const intent = params.get('intent') as Intent;
    if (intent && ['buy', 'refi', 'equity'].includes(intent)) {
      setData((d) => ({ ...d, intent }));
      if (intent) setStep(2);
    }
  }, []);

  const update = (patch: Partial<FlowData>) => setData((d) => ({ ...d, ...patch }));
  const goNext = () => setStep((s) => Math.min(s + 1, 5));
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  const canProceed = () => {
    switch (step) {
      case 1: return !!data.intent;
      case 2: return data.zip.length >= 5 && !!data.propertyType;
      case 3:
        if (data.intent === 'buy') return !!data.homePrice && !!data.downPayment;
        return !!data.homeValue && !!data.currentBalance;
      case 4: return true;
      default: return true;
    }
  };

  const price = parseFloat(data.homePrice) || 425000;
  const dp = parseFloat(data.downPayment) || 85000;
  const loan = data.intent === 'buy' ? price - dp : parseFloat(data.currentBalance) || 280000;
  const baseRate = data.creditRange === 'excellent' ? 6.125 : data.creditRange === 'good' ? 6.375 : data.creditRange === 'fair' ? 6.75 : 7.125;
  const rateAdj = data.isVeteran ? -0.25 : 0;
  const lowRate = baseRate + rateAdj;
  const highRate = lowRate + 0.625;
  const lowPayment = Math.round((loan * (lowRate / 100 / 12)) / (1 - Math.pow(1 + lowRate / 100 / 12, -360)));
  const highPayment = Math.round((loan * (highRate / 100 / 12)) / (1 - Math.pow(1 + highRate / 100 / 12, -360)));
  const tax = Math.round(price * 0.012 / 12);
  const insurance = Math.round(price * 0.004 / 12);
  const totalLow = lowPayment + tax + insurance;
  const totalHigh = highPayment + tax + insurance;
  const closingLow = Math.round(loan * 0.02);
  const closingHigh = Math.round(loan * 0.035);
  const ctcLow = data.intent === 'buy' ? dp + closingLow : closingLow;
  const ctcHigh = data.intent === 'buy' ? dp + closingHigh : closingHigh;

  const saveLeadData = () => {
    localStorage.setItem('uff_lead', JSON.stringify({
      ...data,
      results: { lowRate, highRate, totalLow, totalHigh, ctcLow, ctcHigh, loan },
      createdAt: new Date().toISOString(),
    }));
  };

  const handleCreateAccount = () => {
    saveLeadData();
    setStep(6);
  };

  const handleSignupSuccess = (email: string) => {
    setCheckEmailAddress(email);
    setStep(7);
  };

  const handleSkipToSignup = () => {
    saveLeadData();
    setStep(6);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <div className="container-narrow pt-8 pb-8">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <img src="/uff_logo.svg" alt="United Fidelity Funding Corp." className="h-8 w-auto" />
          </Link>
          {step <= 4 && (
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    s <= step ? 'w-8 bg-brand-500' : 'w-4 bg-gray-200'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className={`w-full mx-auto animate-fade-in-up ${step >= 6 ? 'max-w-3xl' : 'max-w-xl'}`} key={step}>
          {step === 1 && <StepGoal data={data} update={update} />}
          {step === 2 && <StepLocation data={data} update={update} />}
          {step === 3 && <StepFinancials data={data} update={update} />}
          {step === 4 && <StepCredit data={data} update={update} />}
          {step === 5 && (
            <StepResults
              lowRate={lowRate}
              highRate={highRate}
              totalLow={totalLow}
              totalHigh={totalHigh}
              ctcLow={ctcLow}
              ctcHigh={ctcHigh}
              loan={loan}
              tax={tax}
              insurance={insurance}
              onSave={handleCreateAccount}
              onEmailCapture={() => setShowEmail(true)}
            />
          )}
          {step === 6 && (
            <WelcomeSignup
              signUp={signUp}
              onSuccess={handleSignupSuccess}
            />
          )}
          {step === 7 && (
            <div className="max-w-md mx-auto text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-50 rounded-full mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h2>
              <p className="text-gray-600 mb-1">We sent a confirmation link to:</p>
              <p className="font-semibold text-brand-600 text-lg mb-6">{checkEmailAddress}</p>
              <div className="bg-gray-50 rounded-xl p-5 text-left mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">What happens next?</h4>
                <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                  <li>Click the confirmation link in your email</li>
                  <li>You'll be taken to your loan application</li>
                  <li>Your estimate data will be pre-filled</li>
                  <li>Complete your application at your own pace</li>
                </ol>
              </div>
              <p className="text-xs text-gray-400">
                Didn't get it? Check your spam folder. It may take a minute to arrive.
              </p>
            </div>
          )}

          {step <= 4 && (
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100">
              <button
                onClick={goBack}
                disabled={step === 1}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-0 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={goNext}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 disabled:bg-gray-200 disabled:text-gray-400 transition-all"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step <= 4 && (
            <button
              onClick={handleSkipToSignup}
              className="block mx-auto mt-4 text-xs text-gray-400 hover:text-brand-600 transition-colors underline underline-offset-2"
            >
              Skip — I already know what I need
            </button>
          )}

          <div className="flex items-center justify-center gap-2 mt-6 text-xs text-gray-400">
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span>No credit check. Your data is encrypted.</span>
          </div>
        </div>
      </div>

      <ComplianceFooter className="mt-auto" />

      {/* Email Summary Modal */}
      {showEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEmail(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 animate-scale-in">
            <button onClick={() => setShowEmail(false)} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <Mail className="w-10 h-10 text-brand-500 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Send me this summary</h3>
            <p className="text-sm text-gray-600 mb-4">We will email your personalized options. No spam, ever.</p>
            <input
              type="email"
              placeholder="you@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              onClick={() => setShowEmail(false)}
              className="w-full py-3 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors"
            >
              Send summary
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepGoal({ data, update }: { data: FlowData; update: (p: Partial<FlowData>) => void }) {
  const options: { value: Intent; icon: typeof Home; label: string; desc: string }[] = [
    { value: 'buy', icon: Home, label: 'Buy a home', desc: 'First-time or repeat buyer' },
    { value: 'refi', icon: RefreshCw, label: 'Refinance', desc: 'Lower rate, shorter term, or cash out' },
    { value: 'equity', icon: Wallet, label: 'Use my equity', desc: 'HELOC or home equity loan' },
  ];

  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">What are you looking to do?</h2>
      <p className="text-gray-600 mb-8">Pick the option that best describes your goal.</p>
      <div className="space-y-3">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => update({ intent: o.value })}
            className={`w-full flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left ${
              data.intent === o.value
                ? 'border-brand-500 bg-brand-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              data.intent === o.value ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              <o.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{o.label}</p>
              <p className="text-sm text-gray-500">{o.desc}</p>
            </div>
            {data.intent === o.value && (
              <CheckCircle2 className="w-5 h-5 text-brand-500 ml-auto" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepLocation({ data, update }: { data: FlowData; update: (p: Partial<FlowData>) => void }) {
  const types: { value: PropertyType; label: string }[] = [
    { value: 'single', label: 'Single Family' },
    { value: 'condo', label: 'Condo' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'multi', label: 'Multi-Family' },
  ];

  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
        {data.intent === 'buy' ? 'Where are you looking to buy?' : 'Where is the property?'}
      </h2>
      <p className="text-gray-600 mb-8">This helps us show accurate rates and taxes for your area.</p>
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">ZIP code</label>
          <input
            type="text"
            maxLength={5}
            value={data.zip}
            onChange={(e) => update({ zip: e.target.value.replace(/\D/g, '') })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            placeholder="Enter 5-digit ZIP"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Property type</label>
          <div className="grid grid-cols-2 gap-3">
            {types.map((t) => (
              <button
                key={t.value}
                onClick={() => update({ propertyType: t.value })}
                className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  data.propertyType === t.value
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepFinancials({ data, update }: { data: FlowData; update: (p: Partial<FlowData>) => void }) {
  const isBuy = data.intent === 'buy';

  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
        {isBuy ? 'About the purchase' : 'About your current mortgage'}
      </h2>
      <p className="text-gray-600 mb-8">Approximate numbers are fine -- we will refine later.</p>
      <div className="space-y-5">
        {isBuy ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Home price</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={data.homePrice}
                  onChange={(e) => update({ homePrice: e.target.value.replace(/[^0-9]/g, '') })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="425,000"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Down payment</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={data.downPayment}
                  onChange={(e) => update({ downPayment: e.target.value.replace(/[^0-9]/g, '') })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="85,000"
                />
              </div>
              {data.homePrice && data.downPayment && (
                <p className="text-sm text-gray-500 mt-1.5">
                  {Math.round((parseFloat(data.downPayment) / parseFloat(data.homePrice)) * 100)}% down
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Estimated home value</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={data.homeValue}
                  onChange={(e) => update({ homeValue: e.target.value.replace(/[^0-9]/g, '') })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="500,000"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Current mortgage balance</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={data.currentBalance}
                  onChange={(e) => update({ currentBalance: e.target.value.replace(/[^0-9]/g, '') })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="280,000"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StepCredit({ data, update }: { data: FlowData; update: (p: Partial<FlowData>) => void }) {
  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Almost there</h2>
      <p className="text-gray-600 mb-8">Optional info that helps us narrow down your options.</p>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Credit score range <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {creditRanges.map((cr) => (
              <button
                key={cr.value}
                onClick={() => update({ creditRange: cr.value })}
                className={`px-4 py-3 rounded-xl border-2 text-left transition-all ${
                  data.creditRange === cr.value
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="text-sm font-semibold text-gray-900">{cr.label}</p>
                <p className="text-xs text-gray-500">{cr.range}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <button
            onClick={() => update({ isVeteran: !data.isVeteran })}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
              data.isVeteran ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              data.isVeteran ? 'border-brand-500 bg-brand-500' : 'border-gray-300'
            }`}>
              {data.isVeteran && <CheckCircle2 className="w-4 h-4 text-white" />}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">Active military or veteran</p>
              <p className="text-xs text-gray-500">VA loans offer $0 down and no PMI</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function StepResults({
  lowRate, highRate, totalLow, totalHigh, ctcLow, ctcHigh, loan,
  tax, insurance, onSave, onEmailCapture,
}: {
  lowRate: number; highRate: number;
  totalLow: number; totalHigh: number;
  ctcLow: number; ctcHigh: number;
  loan: number; tax: number; insurance: number;
  onSave: () => void;
  onEmailCapture: () => void;
}) {
  const [showAssumptions, setShowAssumptions] = useState(false);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-success-50 text-success-700 text-sm font-medium rounded-full mb-4">
          <Sparkles className="w-4 h-4" />
          Your personalized estimate
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Here are your options</h2>
        <p className="text-gray-600">Based on what you told us. Ranges account for rate variability.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden mb-6">
        <div className="grid grid-cols-3 divide-x divide-gray-100">
          <div className="p-6 text-center">
            <p className="text-xs font-medium text-gray-500 mb-1">Monthly Payment</p>
            <p className="text-xl md:text-2xl font-bold text-gray-900">{formatUSD(totalLow)}</p>
            <p className="text-xs text-gray-400">to {formatUSD(totalHigh)}</p>
          </div>
          <div className="p-6 text-center">
            <p className="text-xs font-medium text-gray-500 mb-1">Rate Range</p>
            <p className="text-xl md:text-2xl font-bold text-gray-900">{lowRate.toFixed(3)}%</p>
            <p className="text-xs text-gray-400">to {highRate.toFixed(3)}%</p>
          </div>
          <div className="p-6 text-center">
            <p className="text-xs font-medium text-gray-500 mb-1">Cash to Close</p>
            <p className="text-xl md:text-2xl font-bold text-gray-900">{formatUSD(ctcLow)}</p>
            <p className="text-xs text-gray-400">to {formatUSD(ctcHigh)}</p>
          </div>
        </div>

        <div className="border-t border-gray-100 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Loan amount</p>
              <p className="font-semibold">{formatUSD(loan)}</p>
            </div>
            <div>
              <p className="text-gray-500">Term</p>
              <p className="font-semibold">30-year fixed</p>
            </div>
            <div>
              <p className="text-gray-500">Est. taxes</p>
              <p className="font-semibold">{formatUSD(tax)}/mo</p>
            </div>
            <div>
              <p className="text-gray-500">Est. insurance</p>
              <p className="font-semibold">{formatUSD(insurance)}/mo</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100">
          <button
            onClick={() => setShowAssumptions(!showAssumptions)}
            className="w-full flex items-center justify-between px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <span>View assumptions</span>
            {showAssumptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showAssumptions && (
            <div className="px-6 pb-4 text-sm text-gray-500 space-y-1.5 animate-fade-in">
              <p>Property tax: 1.2% of home value annually</p>
              <p>Homeowner insurance: 0.4% of home value annually</p>
              <p>HOA: Not included (varies by property)</p>
              <p>PMI: Not included (20%+ down assumed or VA eligible)</p>
              <p>Rates shown are estimates and subject to change</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onSave}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors text-lg"
        >
          Create my account
          <ArrowRight className="w-5 h-5" />
        </button>
        <button
          onClick={onEmailCapture}
          className="flex items-center justify-center gap-2 px-6 py-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-gray-300 transition-colors"
        >
          <Send className="w-4 h-4" />
          Send me this
        </button>
      </div>
    </div>
  );
}

function WelcomeSignup({
  signUp,
  onSuccess,
}: {
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: any }>;
  onSuccess: (email: string) => void;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const { error: signUpError } = await signUp(email.trim(), password, firstName.trim(), lastName.trim());
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message || 'Failed to create account.');
    } else {
      onSuccess(email.trim());
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Let's get your loan started
        </h2>
        <p className="text-gray-500 text-lg">
          Create a free account to begin your application. It only takes a minute.
        </p>
      </div>

      <div className="grid md:grid-cols-5 gap-8 items-start">
        {/* Value proposition */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center mt-0.5">
              <Shield className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Licensed in 39 states</h4>
              <p className="text-xs text-gray-500 mt-0.5">NMLS #34381 — a trusted, regulated lender since 2003.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center mt-0.5">
              <DollarSign className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Competitive rates</h4>
              <p className="text-xs text-gray-500 mt-0.5">We shop multiple investors to find you the best deal.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center mt-0.5">
              <Sparkles className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Save your progress</h4>
              <p className="text-xs text-gray-500 mt-0.5">Your application auto-saves. Come back anytime.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">No obligation</h4>
              <p className="text-xs text-gray-500 mt-0.5">Apply at your own pace. No commitment until you're ready.</p>
            </div>
          </div>
        </div>

        {/* Signup form */}
        <div className="md:col-span-3 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">First name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="John"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Last name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="Doe"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="you@email.com"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="At least 6 characters"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-70 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create my free account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-400">
            Already have an account?{' '}
            <a href="/login" className="text-brand-600 font-medium hover:text-brand-700">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
