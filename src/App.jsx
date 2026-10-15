import React, { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
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
import ReceiptGeneratorModal from './components/ReceiptGeneratorModal';
import ImageLightboxModal from './components/ImageLightboxModal';

function AppContent() {
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [activeLightbox, setActiveLightbox] = useState(null);
  const [lightboxList, setLightboxList] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const handleOpenReceipt = () => {
    setReceiptModalOpen(true);
  };

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

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#454545] selection:bg-primary selection:text-white">
      {/* Sticky Header Navigation */}
      <Navbar onOpenReceiptModal={handleOpenReceipt} />

      <main className="flex-1">
        {/* 1. Hero */}
        <Hero onOpenReceiptModal={handleOpenReceipt} />

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
        <HowYouCanHelp onOpenReceiptModal={handleOpenReceipt} />

        {/* 10. Official Bank & Donate Details */}
        <Donate onOpenReceiptModal={handleOpenReceipt} />

        {/* 11. Institutional Transparency */}
        <Transparency />

        {/* 12. News & Field Events */}
        <NewsEvents />

        {/* 13. Contact & Dual Gorakhpur Offices */}
        <Contact />
      </main>

      {/* 14. Footer */}
      <Footer onOpenReceiptModal={handleOpenReceipt} />

      {/* Persistent Floating Controls */}
      <FloatingWhatsApp />

      {/* Modals */}
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
      <AppContent />
    </LanguageProvider>
  );
}
