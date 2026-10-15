import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import TrustLogo from './TrustLogo';
import { Menu, X, Heart, Globe, Phone, FileText } from 'lucide-react';

export const Navbar = ({ onOpenReceiptModal }) => {
  const { lang, toggleLanguage, t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '#about', label: t.nav.about },
    { href: '#sanskars', label: t.nav.sanskars },
    { href: '#guidelines', label: t.nav.guidelines },
    { href: '#programs', label: t.nav.programs },
    { href: '#gallery', label: t.nav.gallery },
    { href: '#team', label: t.nav.team },
    { href: '#contact', label: t.nav.contact },
  ];

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className={`sticky top-0 z-50 px-2 sm:px-4 lg:px-6 py-2 transition-all duration-300 ${
      isScrolled ? 'bg-white/85 backdrop-blur-md shadow-sm' : 'bg-[#FFF8EF]'
    }`}>
      <div className={`max-w-7xl mx-auto rounded-full transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-card border border-[#E9B44C]/40 py-2 px-3 sm:px-5'
          : 'bg-[#FFF8EF] shadow-card border border-[#E9B44C]/30 py-2 px-3 sm:px-5'
      }`}>
        <div className="flex items-center justify-between gap-2">
          
          {/* Brand Logo & Compact Title */}
          <a href="#" className="flex items-center gap-2 group flex-shrink-0" aria-label="Home">
            <TrustLogo className="w-8 h-8 sm:w-9 sm:h-9" showText={false} lang={lang} />
            <div className="flex flex-col text-left">
              <span className="font-black text-[#382719] leading-none text-xs sm:text-sm tracking-tight font-hindi-heading group-hover:text-primary transition-colors whitespace-nowrap">
                {lang === 'hi' ? 'राष्ट्रीय सनातन संस्कार सेवा संस्थान' : 'Rashtriya Sanatan Sanskar Seva Sansthan'}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="bg-primary text-white px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm">
                  {lang === 'hi' ? 'ट्रस्ट • गोरखपुर' : 'Trust • Gorakhpur'}
                </span>
              </div>
            </div>
          </a>

          {/* Desktop Navigation Links (Compact & Centered) */}
          <nav className="hidden xl:flex items-center gap-2.5 2xl:gap-4 flex-shrink" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-xs font-bold text-[#454545] hover:text-primary transition-colors py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary hover:after:w-full after:transition-all whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action CTAs: Language Toggle, Quick Receipt, and Saffron Orange Donate */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Language Toggle Button */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-[#E9B44C]/50 hover:border-primary bg-white hover:bg-[#FFF8EF] text-xs font-black text-[#382719] transition-all shadow-sm active:scale-95"
              aria-label={`Switch language to ${lang === 'en' ? 'Hindi' : 'English'}`}
            >
              <Globe className="w-3.5 h-3.5 text-secondary" />
              <span>{lang === 'en' ? 'हिंदी' : 'EN'}</span>
            </button>

            {/* Receipt Modal Trigger */}
            <button
              type="button"
              onClick={onOpenReceiptModal}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 hover:bg-primary hover:text-white text-primary text-xs font-black transition-all active:scale-95 shadow-sm"
              title="Generate Official Digital Receipt"
            >
              <FileText className="w-3.5 h-3.5 text-primary" />
              <span>{lang === 'hi' ? 'रसीद' : 'Receipt'}</span>
            </button>

            {/* Glowing Saffron Donate CTA */}
            <a
              href="#donate"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-primary hover:bg-secondary text-white font-black text-xs sm:text-sm shadow-saffron transition-all transform hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap border border-primary flex-shrink-0"
            >
              <Heart className="w-3.5 h-3.5 fill-white text-white" />
              <span>{t.nav.donate}</span>
            </a>

            {/* Mobile / Tablet Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-1.5 sm:p-2 rounded-full text-[#382719] hover:text-primary hover:bg-[#FFF8EF] focus:outline-none"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden mt-3 pt-3 pb-4 border-t border-[#E9B44C]/30 px-2 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-2 mb-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={handleLinkClick}
                  className="px-3 py-2 text-xs font-bold text-[#454545] bg-white hover:bg-[#FFF8EF] rounded-xl transition-colors flex items-center justify-between border border-[#E9B44C]/30"
                >
                  <span>{link.label}</span>
                  <span className="text-[#E9B44C] text-[10px]">→</span>
                </a>
              ))}
            </div>

            <div className="pt-2 border-t border-amber-200/60 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenReceiptModal();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-primary/20 bg-primary/10 text-primary font-bold text-xs shadow-sm"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? 'अपनी रसीद स्वयं प्राप्त करें' : 'Generate Digital Receipt'}</span>
              </button>

              <div className="flex items-center justify-between text-xs px-2 pt-1 text-gray-600 font-semibold">
                <a href="tel:+919794590044" className="flex items-center gap-1.5 text-primary hover:underline">
                  <Phone className="w-3 h-3" />
                  <span>9794590044</span>
                </a>
                <span>{lang === 'hi' ? 'रूस्तमपुर, गोरखपुर' : 'Rustampur, Gorakhpur'}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </header>
  );
};

export default Navbar;
