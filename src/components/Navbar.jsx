import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import TrustLogo from './TrustLogo';
import { Menu, X, Globe, FileText, ArrowRight } from 'lucide-react';

export const Navbar = ({ onOpenReceiptModal }) => {
  const { lang, toggleLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Simplified, uncluttered core links matching the reference layout
  const navLinks = [
    { href: '#about', label: t.nav.about },
    { 
      href: '#sanskars', 
      label: t.nav.sanskars, 
      badge: lang === 'hi' ? 'वैदिक' : 'VEDIC' 
    },
    { href: '#programs', label: t.nav.programs },
    { href: '#gallery', label: t.nav.gallery },
    { href: '#contact', label: t.nav.contact },
  ];

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header 
      className="sticky top-0 z-50 w-full bg-[#302319] border-b border-[#E9B44C]/25 shadow-lg transition-all"
      style={{
        backgroundImage: 'radial-gradient(rgba(233, 180, 76, 0.16) 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Name (matching reference two-tone brand style) */}
        <a href="#" className="flex items-center gap-2.5 sm:gap-3 group flex-shrink-0" aria-label="Home">
          <TrustLogo className="w-9 h-9 sm:w-10 sm:h-10" showText={false} lang={lang} />
          <div className="flex items-center">
            <span className="font-extrabold text-white text-base sm:text-lg md:text-xl tracking-tight font-hindi-heading group-hover:text-primary transition-colors">
              {lang === 'hi' ? 'सनातन संस्कार ' : 'Sanatan Sanskar '}
              <span className="text-primary font-black">
                {lang === 'hi' ? 'ट्रस्ट' : 'Trust'}
              </span>
            </span>
          </div>
        </a>

        {/* Center Navigation Links (Clean, Focused, Unwanted fields removed) */}
        <nav className="hidden xl:flex items-center gap-7 2xl:gap-8" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-white/85 hover:text-white transition-colors flex items-center py-1 group/item"
            >
              <span>{link.label}</span>
              {link.badge && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider text-accent bg-accent/15 border border-accent/40 ml-2 uppercase shadow-sm group-hover/item:border-accent">
                  {link.badge}
                </span>
              )}
            </a>
          ))}
        </nav>

        {/* Right Actions: Language Toggle, Quick Receipt, and Saffron CTA Button with Arrow */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Language Toggle Button */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 transition-all active:scale-95"
            aria-label={`Switch language to ${lang === 'en' ? 'Hindi' : 'English'}`}
          >
            <Globe className="w-3.5 h-3.5 text-accent" />
            <span>{lang === 'en' ? 'हिंदी' : 'EN'}</span>
          </button>

          {/* Quick Receipt Modal Trigger */}
          <button
            type="button"
            onClick={onOpenReceiptModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-accent hover:text-white bg-accent/10 hover:bg-accent/20 border border-accent/30 transition-all active:scale-95"
            title="Generate Official Digital Receipt"
          >
            <FileText className="w-3.5 h-3.5 text-accent" />
            <span>{lang === 'hi' ? 'रसीद' : 'Receipt'}</span>
          </button>

          {/* Saffron CTA Button with Arrow (Exact style from reference screenshot) */}
          <a
            href="#donate"
            className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs sm:text-sm shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap group"
          >
            <span>{t.nav.donate}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </a>

          {/* Mobile / Tablet Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded-xl text-white hover:bg-white/10 transition-colors focus:outline-none"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-[#E9B44C]/25 bg-[#302319] px-4 pt-3 pb-5 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={handleLinkClick}
                className="px-3 py-2.5 text-sm font-bold text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-colors flex items-center justify-between"
              >
                <span>{link.label}</span>
                {link.badge ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold text-accent bg-accent/20 border border-accent/40">
                    {link.badge}
                  </span>
                ) : (
                  <span className="text-[#E9B44C] text-xs">→</span>
                )}
              </a>
            ))}
          </div>

          <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenReceiptModal();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-accent/40 bg-accent/15 text-accent hover:text-white font-bold text-xs"
            >
              <FileText className="w-4 h-4" />
              <span>{lang === 'hi' ? 'ऑनलाइन डिजिटल रसीद सृजन' : 'Generate Digital Receipt'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
