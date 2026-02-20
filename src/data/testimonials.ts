export interface Testimonial {
  name: string;
  location: string;
  text: string;
  rating: number;
  loanType: string;
}

export const testimonials: Testimonial[] = [
  {
    name: 'Sarah M.',
    location: 'Austin, TX',
    text: 'The entire process was transparent from day one. I always knew exactly where my loan stood and what was needed next. Closed in 22 days.',
    rating: 5,
    loanType: 'Purchase',
  },
  {
    name: 'David & Lisa R.',
    location: 'Denver, CO',
    text: 'We compared rates with three other lenders. United Fidelity had the best rate AND the clearest breakdown of costs. No surprises at closing.',
    rating: 5,
    loanType: 'Purchase',
  },
  {
    name: 'Marcus T.',
    location: 'Phoenix, AZ',
    text: 'Refinanced and saving $340/month. The calculator on the site was spot-on with the final numbers. That kind of accuracy builds trust.',
    rating: 5,
    loanType: 'Refinance',
  },
  {
    name: 'Jennifer K.',
    location: 'Orlando, FL',
    text: 'As a first-time buyer, I had a million questions. My loan officer was patient, explained everything in plain English, and never pressured me.',
    rating: 5,
    loanType: 'FHA Purchase',
  },
  {
    name: 'Robert & Anna W.',
    location: 'Nashville, TN',
    text: 'Used the HELOC to renovate our kitchen and bathrooms. The process was straightforward and the rate was competitive. Would recommend.',
    rating: 5,
    loanType: 'Home Equity',
  },
  {
    name: 'Michael S.',
    location: 'San Diego, CA',
    text: 'VA loan processed smoothly. The team understood the VA process inside and out. Closed on time with zero stress.',
    rating: 5,
    loanType: 'VA Purchase',
  },
];
