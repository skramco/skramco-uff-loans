import { Phone, Mail, MapPin, Clock, Send } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="pt-20">
      <section className="bg-gradient-to-b from-gray-900 to-gray-800 text-white py-16 md:py-24">
        <div className="container-wide">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Get in touch</h1>
          <p className="text-xl text-gray-300 max-w-2xl">
            Have a question? Need help? We are here and we actually pick up the phone.
          </p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-wide">
          <div className="grid lg:grid-cols-5 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact info</h2>
                <div className="space-y-5">
                  <a href="tel:1-800-555-0199" className="flex items-start gap-4 group">
                    <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-brand-100 transition-colors">
                      <Phone className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">(800) 555-0199</p>
                      <p className="text-sm text-gray-500">Mon-Fri 8am-8pm, Sat 9am-5pm ET</p>
                    </div>
                  </a>
                  <a href="mailto:info@unitedfidelityfunding.com" className="flex items-start gap-4 group">
                    <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-brand-100 transition-colors">
                      <Mail className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">info@unitedfidelityfunding.com</p>
                      <p className="text-sm text-gray-500">We respond within 1 business day</p>
                    </div>
                  </a>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">123 Financial District</p>
                      <p className="text-sm text-gray-500">Los Angeles, CA 90012</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-gray-50 rounded-2xl p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Send us a message</h2>
                <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">First name</label>
                      <input type="text" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Last name</label>
                      <input type="text" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <input type="email" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                    <input type="tel" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Topic</label>
                    <select className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                      <option>General inquiry</option>
                      <option>New loan question</option>
                      <option>Existing loan question</option>
                      <option>Rate quote request</option>
                      <option>Complaint</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                    <textarea rows={4} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white resize-none" />
                  </div>
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Send message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
