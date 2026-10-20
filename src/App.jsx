import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Hero from './sections/Hero';
import About from './sections/About';
import Sanskars from './sections/Sanskars';
import Guidelines from './sections/Guidelines';
import Programs from './sections/Programs';
import Impact from './sections/Impact';
import Gallery from './sections/Gallery';
import Trustees from './sections/Trustees';
import HowYouCanHelp from './sections/HowYouCanHelp';
import Donate from './sections/Donate';
import Transparency from './sections/Transparency';
import NewsEvents from './sections/NewsEvents';
import Contact from './sections/Contact';
import Footer from './sections/Footer';
import FloatingWhatsApp from './components/FloatingWhatsApp';

// Modals & Portals
import ReceiptGeneratorModal from './components/ReceiptGeneratorModal';
import HelpRequestModal from './components/HelpRequestModal';
import ImageLightboxModal from './components/ImageLightboxModal';
import JoinTrustModal from './components/JoinTrustModal';
import PaymentModal from './components/PaymentModal';
import VolunteerModal from './components/VolunteerModal';
import LoginModal from './components/LoginModal';

import { useAuth } from './context/AuthContext';

// Dedicated Sub-Pages
import MemberDashboard from './pages/MemberDashboard';
import AdminDashboard from './pages/AdminDashboard';

function AppContent() {
  const { currentUser, isAdmin, loading } = useAuth();

  // Current route pathname tracking
  const [currentPath, setCurrentPath] = useState(() => {
    return typeof window !== 'undefined' ? window.location.pathname : '/';
  });

  // Track if a logged-in user explicitly wants to preview the public site
  const [viewPublicSite, setViewPublicSite] = useState(false);

  // Modals state
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(() => {
    return typeof window !== 'undefined' && window.location.search.includes('modal=help');
  });
  const [joinModalOpen, setJoinModalOpen] = useState(() => {
    return typeof window !== 'undefined' && (window.location.pathname === '/join' || window.location.search.includes('modal=join'));
  });
  const [paymentModalOpen, setPaymentModalOpen] = useState(() => {
    return typeof window !== 'undefined' && window.location.search.includes('modal=pay');
  });
  const [volunteerModalOpen, setVolunteerModalOpen] = useState(() => {
    return typeof window !== 'undefined' && (window.location.pathname === '/volunteer' || window.location.search.includes('modal=volunteer'));
  });
  const [loginModalOpen, setLoginModalOpen] = useState(() => {
    return typeof window !== 'undefined' && (window.location.pathname === '/login' || window.location.search.includes('modal=login'));
  });

  const [activeLightbox, setActiveLightbox] = useState(null);
  const [lightboxList, setLightboxList] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Synchronize browser history / popstate
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Lightbox controls
  const handleSelectImage = (img, index, list) => {
    setActiveLightbox(img);
    setLightboxIndex(index);
    setLightboxList(list);
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

  // Brand loader while auth state restores from browser storage
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8EF] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-[#382719] font-hindi-heading animate-pulse">
          राष्ट्रीय सनातन संस्कार सेवा संस्थान...
        </p>
      </div>
    );
  }

  // If a member, help seeker, or admin is logged in, the landing page is not shown to them;
  // their dashboard is shown instead (unless they explicitly click to view public site).
  if (currentUser && !viewPublicSite) {
    if (isAdmin || currentPath === '/admin') {
      return (
        <AdminDashboard
          onNavigateHome={() => {
            setViewPublicSite(true);
            navigateTo('/');
          }}
        />
      );
    }
    return (
      <MemberDashboard
        onNavigateHome={() => {
          setViewPublicSite(true);
          navigateTo('/');
        }}
      />
    );
  }

  // Route 1: Administrator Dashboard (Explicit URL)
  if (currentPath === '/admin') {
    return (
      <AdminDashboard
        onNavigateHome={() => {
          setViewPublicSite(true);
          navigateTo('/');
        }}
      />
    );
  }

  // Route 2: Member Portal Dashboard (Explicit URL)
  if (currentPath === '/member' || currentPath === '/dashboard') {
    return (
      <MemberDashboard
        onNavigateHome={() => {
          setViewPublicSite(true);
          navigateTo('/');
        }}
      />
    );
  }

  // Route 3: Main Landing Page
  return (
    <div className="min-h-screen flex flex-col bg-white text-[#454545] selection:bg-primary selection:text-white overflow-x-hidden w-full max-w-full">
      {/* Top Screen: Navbar & Hero unified on Warm Ivory #FFF8EF */}
      <div className="bg-[#FFF8EF] relative overflow-x-hidden w-full">
        <Navbar
          onOpenReceiptModal={() => setReceiptModalOpen(true)}
          onOpenLoginModal={() => setLoginModalOpen(true)}
          onOpenJoinModal={() => setJoinModalOpen(true)}
          onNavigateMember={() => {
            setViewPublicSite(false);
            navigateTo('/member');
          }}
          onNavigateAdmin={() => {
            setViewPublicSite(false);
            navigateTo('/admin');
          }}
        />
        <Hero
          onOpenReceiptModal={() => setReceiptModalOpen(true)}
          onOpenHelpModal={() => setHelpModalOpen(true)}
          onOpenJoinModal={() => setJoinModalOpen(true)}
        />
      </div>

      <main className="flex-1 w-full overflow-x-hidden">
        {/* 2. About Us & Leadership */}
        <About />

        {/* 3. 16 Vedic Sanskars (षोडश संस्कार) */}
        <Sanskars />

        {/* 4. 12 Family Guidelines (हमारा आग्रह) */}
        <Guidelines />

        {/* 5. Core Programs & Pillars */}
        <Programs />

        {/* 6. Impact Counters */}
        <Impact />

        {/* 7. Gallery with Masonry & Filters */}
        <Gallery onSelectImage={handleSelectImage} />

        {/* 8. Trustees & Executive Council */}
        <Trustees />

        {/* 9. How You Can Help */}
        <HowYouCanHelp
          onOpenReceiptModal={() => setReceiptModalOpen(true)}
          onOpenJoinModal={() => setJoinModalOpen(true)}
          onOpenVolunteerModal={() => setVolunteerModalOpen(true)}
        />

        {/* 10. Official Bank & Donate Details */}
        <Donate
          onOpenReceiptModal={() => setReceiptModalOpen(true)}
          onOpenPaymentModal={() => setPaymentModalOpen(true)}
        />

        {/* 11. Institutional Transparency */}
        <Transparency />

        {/* 12. News & Field Events (Dynamic from Firestore) */}
        <NewsEvents />

        {/* 13. Contact & Dual Gorakhpur Offices */}
        <Contact />
      </main>

      {/* 14. Footer with Quick Portal & Legal Links */}
      <Footer
        onOpenReceiptModal={() => setReceiptModalOpen(true)}
        onOpenJoinModal={() => setJoinModalOpen(true)}
        onNavigateMember={() => {
          setViewPublicSite(false);
          navigateTo('/member');
        }}
        onNavigateAdmin={() => {
          setViewPublicSite(false);
          navigateTo('/admin');
        }}
      />

      {/* Persistent Floating Controls */}
      <FloatingWhatsApp />

      {/* Interactive System Modals */}
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
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
