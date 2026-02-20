import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Upload, Clock, TrendingDown, Bell } from 'lucide-react';

export default function CockpitPreview() {
  return (
    <section className="section-padding bg-gray-50">
      <div className="container-wide">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-700 text-sm font-medium rounded-full mb-6">
              <Bell className="w-3.5 h-3.5" />
              Mortgage Cockpit
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Your loan, your dashboard.{' '}
              <span className="text-brand-600">Total visibility.</span>
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Track your estimated payment, see what documents are needed, follow your timeline
              to closing, and message your loan officer -- all in one place.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors group"
            >
              See how it works
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-900 px-6 py-4 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="text-gray-300 text-xs ml-2 font-medium">Mortgage Cockpit</span>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Est. Payment</p>
                    <p className="text-xl font-bold text-gray-900">$2,145 - $2,380</p>
                    <p className="text-xs text-gray-400">per month</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Rate Range</p>
                    <p className="text-xl font-bold text-gray-900">6.25% - 6.875%</p>
                    <p className="text-xs text-gray-400">30-yr fixed</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Cash to Close</p>
                    <p className="text-xl font-bold text-gray-900">$14.2k - $18.5k</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Timeline</p>
                    <p className="text-xl font-bold text-gray-900">~21 days</p>
                    <p className="text-xs text-gray-400">to close</p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-700 mb-3">Tasks</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-success-500" />
                      <span className="text-gray-500 line-through">Complete application</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Upload className="w-4 h-4 text-accent-500" />
                      <span className="text-gray-800 font-medium">Upload pay stubs</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="w-4 h-4 text-gray-300" />
                      <span className="text-gray-400">Sign disclosures</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-brand-100 rounded-full opacity-40 blur-2xl" />
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-accent-100 rounded-full opacity-40 blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
