import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Shield, Clock, Phone, X } from 'lucide-react';

export default function Hero() {
  const [schedulerOpen, setSchedulerOpen] = useState(false);

  return (
    <>
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1920")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent" />

        <div className="relative container-wide py-24 md:py-28">
          <div className="max-w-4xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6 leading-[1.15]">
              Know the numbers.<br />
              <span className="text-brand-400">Understand your options.</span><br />
              Move forward with certainty.
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl leading-relaxed">
              Get personalized options in ~3 minutes. Clear assumptions. No spam.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link
                to="/start"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-900 font-bold text-lg rounded-xl hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl group"
              >
                Get my options
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={() => setSchedulerOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-semibold text-lg rounded-xl hover:bg-white/10 transition-all"
              >
                <Phone className="w-5 h-5" />
                Talk to an expert
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-300">
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-accent-400 text-accent-400" />
                  ))}
                </div>
                <span>4.9/5 rating</span>
              </div>
              <span className="text-gray-500">|</span>
              <span>Thousands of borrowers helped</span>
              <span className="text-gray-500">|</span>
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                <span>Data encrypted in transit and at rest</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {schedulerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSchedulerOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-scale-in">
            <button
              onClick={() => setSchedulerOpen(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Talk to an expert</h3>
            <p className="text-gray-600 text-sm mb-6">
              Schedule a call at a time that works for you. No obligations, no pressure.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" placeholder="Your name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" placeholder="(555) 123-4567" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Best time to call</label>
                <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white">
                  <option>Morning (9am - 12pm)</option>
                  <option>Afternoon (12pm - 5pm)</option>
                  <option>Evening (5pm - 8pm)</option>
                </select>
              </div>
              <button className="w-full py-3 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors">
                Request a callback
              </button>
              <p className="text-xs text-gray-500 text-center">
                Or call us now at <a href="tel:855-95-32453" className="text-brand-600 font-medium">(855) 95-EAGLE</a>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
