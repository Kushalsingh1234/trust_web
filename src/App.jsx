import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import Navbar from './components/Navbar';
import Footer from './sections/Footer';
import FloatingWhatsApp from './components/FloatingWhatsApp';

// Modals
import ReceiptGeneratorModal from './components/ReceiptGeneratorModal';
import HelpRequestModal from './components/HelpRequestModal';
import ImageLightboxModal from './components/ImageLightboxModal';
import JoinTrustModal from './components/JoinTrustModal';
import PaymentModal from './components/PaymentModal';
import VolunteerModal from './components/VolunteerModal';
import LoginModal from './components/LoginModal';

// Dedicated Pages
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ProgramsPage from './pages/ProgramsPage';
import DonatePage from './pages/DonatePage';
import MembershipPage from './pages/MembershipPage';
import EventsPage from './pages/EventsPage';
import GalleryPage from './pages/GalleryPage';
import TransparencyPage from './pages/TransparencyPage';
import ContactPage from './pages/ContactPage';
import MemberDashboard from './pages/MemberDashboard';
import AdminDashboard from './pages/AdminDashboard';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  // Modals state
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(() => {
    return typeof window !== 'undefined' && window.location.search.includes('modal=help');
  });
  const [joinModalOpen, setJoinModalOpen] = useState(() => {
    return typeof window !== 'undefined' && window.location.search.includes('modal=join');
  });
  const [paymentModalOpen, setPaymentModalOpen] = useState(() => {
    return typeof window !== 'undefined' && window.location.search.includes('modal=pay');
  });
  const [volunteerModalOpen, setVolunteerModalOpen] = useState(() => {
    return typeof window !== 'undefined' && window.location.search.includes('modal=volunteer');
  });
  const [loginModalOpen, setLoginModalOpen] = useState(() => {
    return typeof window !== 'undefined' && (location.pathname === '/login' || window.location.search.includes('modal=login'));
  });

  const [activeLightbox, setActiveLightbox] = useState(null);
  const [lightboxList, setLightboxList] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Lightbox controls
  const handleSelectImage = (img, index, list) => {
    setActiveLightbox(img);
    setLightboxIndex(index || 0);
    setLightboxList(list || [img]);
  };

  const handlePrevImage = () => {
    if (!lightboxList.length) return;
    const newIdx = (lightboxIndex - 1 + lightboxList.length) % lightboxList.length;
    setLightboxIndex(newIdx);
    setActiveLightbox(lightboxList[newIdx]);
  };

  const handleNextImage = () => {
    if (!lightboxList.length) return;
    const newIdx = (lightboxIndex + 1) % lightboxList.length;
    setLightboxIndex(newIdx);
    setActiveLightbox(lightboxList[newIdx]);
  };

  // Full-screen dashboards have their own internal layout and navigation
  if (location.pathname.startsWith('/admin')) {
    return <AdminDashboard onNavigateHome={() => navigate('/')} />;
  }

  if (location.pathname.startsWith('/member') || location.pathname.startsWith('/dashboard')) {
    return <MemberDashboard onNavigateHome={() => navigate('/')} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#454545] selection:bg-primary selection:text-white">
      {/* Scroll restoration on route transition */}
      <ScrollToTop />

      {/* Persistent Pinned Navigation Bar */}
      <Navbar
        onOpenReceiptModal={() => setReceiptModalOpen(true)}
        onOpenLoginModal={() => setLoginModalOpen(true)}
        onOpenJoinModal={() => setJoinModalOpen(true)}
        onNavigateMember={() => navigate('/member')}
        onNavigateAdmin={() => navigate('/admin')}
      />

      {/* Main Content Area Routed Per Page */}
      <main className="flex-1">
        <Routes>
          {/* 1. Lean Landing Page */}
          <Route
            path="/"
            element={
              <HomePage
                onOpenReceiptModal={() => setReceiptModalOpen(true)}
                onOpenHelpModal={() => setHelpModalOpen(true)}
                onOpenJoinModal={() => setJoinModalOpen(true)}
                onSelectImage={handleSelectImage}
              />
            }
          />

          {/* 2. Full Dedicated About Page (Story, Vision, Trustees, 16 Sanskars, Guidelines) */}
          <Route
            path="/about"
            element={
              <AboutPage
                onOpenJoinModal={() => setJoinModalOpen(true)}
              />
            }
          />

          {/* 3. Full Dedicated Programs Page (Labor welfare, Sanskars, Cow care, etc.) */}
          <Route
            path="/programs"
            element={
              <ProgramsPage
                onOpenHelpModal={() => setHelpModalOpen(true)}
                onOpenVolunteerModal={() => setVolunteerModalOpen(true)}
              />
            }
          />

          {/* 4. Full Dedicated Donate Page (Bank of India, Real QR, Tax Info, Receipt) */}
          <Route
            path="/donate"
            element={
              <DonatePage
                onOpenReceiptModal={() => setReceiptModalOpen(true)}
                onOpenPaymentModal={() => setPaymentModalOpen(true)}
              />
            }
          />

          {/* 5. Full Dedicated Membership Page (₹200 Rules, 3 Member Types, ID Privileges) */}
          <Route
            path="/membership"
            element={
              <MembershipPage
                onOpenJoinModal={() => setJoinModalOpen(true)}
                onOpenVolunteerModal={() => setVolunteerModalOpen(true)}
                onOpenReceiptModal={() => setReceiptModalOpen(true)}
              />
            }
          />
          <Route
            path="/join"
            element={
              <MembershipPage
                onOpenJoinModal={() => setJoinModalOpen(true)}
                onOpenVolunteerModal={() => setVolunteerModalOpen(true)}
                onOpenReceiptModal={() => setReceiptModalOpen(true)}
              />
            }
          />

          {/* 6. Full Dedicated Events & Announcements Page */}
          <Route
            path="/events"
            element={<EventsPage />}
          />
          <Route
            path="/news"
            element={<EventsPage />}
          />

          {/* 7. Full Dedicated Filterable Photo Gallery */}
          <Route
            path="/gallery"
            element={
              <GalleryPage
                onSelectImage={handleSelectImage}
              />
            }
          />

          {/* 8. Full Dedicated Institutional Transparency & Legal Certifications */}
          <Route
            path="/transparency"
            element={
              <TransparencyPage
                onOpenReceiptModal={() => setReceiptModalOpen(true)}
              />
            }
          />

          {/* 9. Full Dedicated Contact & Dual Gorakhpur Offices Page */}
          <Route
            path="/contact"
            element={<ContactPage />}
          />

          {/* Fallback to Home */}
          <Route
            path="*"
            element={
              <HomePage
                onOpenReceiptModal={() => setReceiptModalOpen(true)}
                onOpenHelpModal={() => setHelpModalOpen(true)}
                onOpenJoinModal={() => setJoinModalOpen(true)}
                onSelectImage={handleSelectImage}
              />
            }
          />
        </Routes>
      </main>

      {/* Shared Footer Layout */}
      <Footer
        onOpenReceiptModal={() => setReceiptModalOpen(true)}
        onOpenJoinModal={() => setJoinModalOpen(true)}
        onNavigateMember={() => navigate('/member')}
        onNavigateAdmin={() => navigate('/admin')}
      />

      {/* Floating Action Controls */}
      <FloatingWhatsApp />

      {/* Interactive System Modals Accessible from All Pages */}
      <JoinTrustModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        onOpenLogin={() => {
          setJoinModalOpen(false);
          setLoginModalOpen(true);
        }}
      />

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onOpenJoin={() => {
          setLoginModalOpen(false);
          setJoinModalOpen(true);
        }}
      />

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
      />

      <VolunteerModal
        isOpen={volunteerModalOpen}
        onClose={() => setVolunteerModalOpen(false)}
      />

      <HelpRequestModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />

      <ReceiptGeneratorModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
      />

      <ImageLightboxModal
        image={activeLightbox}
        onClose={() => setActiveLightbox(null)}
        onPrev={lightboxList.length > 1 ? handlePrevImage : null}
        onNext={lightboxList.length > 1 ? handleNextImage : null}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
