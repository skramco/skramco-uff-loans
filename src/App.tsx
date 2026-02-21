import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { BorrowerSessionProvider } from './contexts/BorrowerSessionContext';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import StartFlow from './pages/StartFlow';
import LandingPage from './pages/LandingPage';
import RatesPage from './pages/RatesPage';
import CalculatorsPage from './pages/CalculatorsPage';
import LearnPage from './pages/LearnPage';
import ArticlePage from './pages/ArticlePage';
import ReviewsPage from './pages/ReviewsPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './components/RegisterPage';
import ApplicationPage from './components/application/ApplicationPage';
import MyLoanPage from './pages/MyLoanPage';
import AdminPage from './components/admin/AdminPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
    <BorrowerSessionProvider>
      <ScrollToTop />
      <Routes>
        <Route path="/start" element={<StartFlow />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/apply" element={<ApplicationPage />} />
        <Route path="/dashboard" element={<MyLoanPage />} />
        <Route path="/my-loan" element={<MyLoanPage />} />
        <Route path="/admin" element={<AdminPage />} />

        <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
        <Route path="/buy" element={<PublicLayout><LandingPage intent="buy" /></PublicLayout>} />
        <Route path="/refinance" element={<PublicLayout><LandingPage intent="refi" /></PublicLayout>} />
        <Route path="/equity" element={<PublicLayout><LandingPage intent="equity" /></PublicLayout>} />
        <Route path="/rates" element={<PublicLayout><RatesPage /></PublicLayout>} />
        <Route path="/calculators" element={<PublicLayout><CalculatorsPage /></PublicLayout>} />
        <Route path="/learn" element={<PublicLayout><LearnPage /></PublicLayout>} />
        <Route path="/learn/:slug" element={<PublicLayout><ArticlePage /></PublicLayout>} />
        <Route path="/reviews" element={<PublicLayout><ReviewsPage /></PublicLayout>} />
        <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />

        <Route path="*" element={<PublicLayout><HomePage /></PublicLayout>} />
      </Routes>
    </BorrowerSessionProvider>
    </AuthProvider>
  );
}
