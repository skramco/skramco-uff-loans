import { useState, useEffect } from 'react';
import { Users, Shield, TrendingUp, Clock, Award, Heart, ArrowRight } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

const heroImages = [
  'https://images.pexels.com/photos/1546168/pexels-photo-1546168.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=1920',
];

export default function HomePage({ onNavigate }: HomePageProps) {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Users,
      title: 'Expert Guidance',
      description: 'Experienced mortgage professionals dedicated to guiding you through every step of your home financing journey',
      color: 'from-red-600 to-red-700',
    },
    {
      icon: Shield,
      title: 'Trusted & Secure',
      description: 'Bank-level security and complete transparency protecting your sensitive information throughout the process',
      color: 'from-gray-600 to-gray-700',
    },
    {
      icon: TrendingUp,
      title: 'Competitive Rates',
      description: 'Access to excellent rates and flexible loan programs designed to make homeownership achievable',
      color: 'from-red-600 to-red-700',
    },
    {
      icon: Clock,
      title: 'Efficient Process',
      description: 'Streamlined application and closing process with an average of 15 days to close',
      color: 'from-gray-600 to-gray-700',
    },
    {
      icon: Award,
      title: 'Proven Excellence',
      description: 'Over two decades of unwavering commitment to delivering exceptional mortgage experiences',
      color: 'from-red-600 to-red-700',
    },
    {
      icon: Heart,
      title: 'Client-Focused',
      description: 'We listen, believe in you, and work tirelessly to turn your homeownership dreams into reality',
      color: 'from-gray-600 to-gray-700',
    },
  ];

  const stats = [
    { value: '20+', label: 'Years of Excellence' },
    { value: '$10B+', label: 'Loans Funded' },
    { value: '98%', label: 'Client Satisfaction' },
    { value: '15 Days', label: 'Average Close' },
  ];

  const process = [
    { step: '1', title: 'Start Your Application', description: 'Complete our secure online application at your convenience' },
    { step: '2', title: 'Get Pre-Approved', description: 'Work with our team to get pre-approved and understand your options' },
    { step: '3', title: 'Find Your Home', description: 'Shop confidently with a clear understanding of your budget' },
    { step: '4', title: 'Close with Confidence', description: 'We guide you through closing so you can focus on your new beginning' },
  ];

  return (
    <div className="min-h-screen">
      <section className="relative bg-gray-900 text-white pt-24 pb-20 overflow-hidden min-h-[600px] flex items-center">
        {heroImages.map((src, index) => (
          <div
            key={index}
            className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out"
            style={{ opacity: index === currentImage ? 1 : 0 }}
          >
            <img
              src={src}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/85 to-gray-900/75"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-gray-900/40"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative w-full">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              United in Excellence,{' '}
              <span className="text-red-500">
                Driven by Fidelity
              </span>
            </h1>

            <div className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed max-w-3xl mx-auto space-y-4">
              <p className="font-medium">
                For more than two decades, we have stood unwavering, unbroken, and utterly committed to excellence.
              </p>
              <p>
                Today, we stand united--stronger and more driven than ever--to deliver nothing less than the world's finest mortgage experience.
              </p>
              <p>
                Every day, we pledge unshakable fidelity to our customers, our employees, and the very future of homeownership.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => onNavigate('apply')}
                className="px-8 py-4 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 hover:shadow-2xl transition-all flex items-center space-x-2 group"
              >
                <span>Start Your Application</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => onNavigate('calculators')}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-bold rounded-lg hover:bg-white/20 transition-all border-2 border-white/30"
              >
                Explore Calculators
              </button>
            </div>

            <div className="flex justify-center gap-2 mt-8">
              {heroImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImage(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentImage
                      ? 'bg-red-500 w-6'
                      : 'bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-red-600 mb-2">{stat.value}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose United Fidelity Funding?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We combine decades of expertise with unwavering dedication to deliver exceptional mortgage experiences that make homeownership achievable.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white p-8 rounded-xl shadow-sm hover:shadow-xl transition-all border border-gray-100 group"
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Your Path to Homeownership
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A clear, straightforward process designed around your needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {process.map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-gradient-to-br from-gray-50 to-red-50 p-8 rounded-xl border-2 border-gray-200 hover:border-red-400 transition-all">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </div>
                {index < process.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-red-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-gray-800 to-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Make Your Dream Home a Reality?
          </h2>
          <p className="text-xl text-gray-200 mb-8">
            We hear you, we believe in you, and we're ready to rise above all challenges to ensure your dreams become reality.
          </p>
          <button
            onClick={() => onNavigate('apply')}
            className="px-10 py-4 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 hover:shadow-2xl transition-all inline-flex items-center space-x-2 group"
          >
            <span>Get Started Today</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>
    </div>
  );
}
