import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import TrustLogo from './TrustLogo';
import { Menu, X, Globe, User } from 'lucide-react';

export const Navbar = ({
  onOpenLoginModal,
  onNavigateMember,
  onNavigateAdmin
}) => {
  const { lang, toggleLanguage, t } = useLanguage();
  const { currentUser, isAdmin } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Core nav links
  const navLinks = [
    { href: '#about', label: t.nav.about },
    { 
      href: '#sanskars', 
      label: t.nav.sanskars, 
      badge: lang === 'hi' ? 'वैदिक' : 'VEDIC' 
    },
    { href: '#programs', label: t.nav.programs },
    { href: '#gallery', label: t.nav.gallery },
    { href: '#news', label: lang === 'hi' ? 'सूचनाएं' : 'News' },
    { href: '#contact', label: t.nav.contact },
  ];

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled 
          ? 'bg-[#FFF8EF]/95 backdrop-blur-md shadow-sm border-b border-[#E9B44C]/30' 
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand Logo & Name */}
        <a href="#" className="flex items-center gap-2 sm:gap-2.5 group min-w-0" aria-label="Home">
          <TrustLogo className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" showText={false} lang={lang} />
          <div className="flex items-center min-w-0">
            <span className="font-extrabold text-[#382719] text-sm sm:text-base lg:text-lg tracking-tight font-hindi-heading group-hover:text-primary transition-colors truncate">
              {lang === 'hi' ? 'सनातन संस्कार ' : 'Sanatan Sanskar '}
              <span className="text-primary font-black">
                {lang === 'hi' ? 'ट्रस्ट' : 'Trust'}
              </span>
            </span>
          </div>
        </a>

        {/* Center Navigation Links - Desktop & Laptop */}
        <nav className="hidden lg:flex items-center gap-5 xl:gap-7" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-bold text-[#454545] hover:text-primary transition-colors flex items-center py-1 group/item whitespace-nowrap"
            >
              <span>{link.label}</span>
              {link.badge && (
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold tracking-wider text-secondary bg-white border border-[#E9B44C]/60 ml-1.5 uppercase shadow-sm group-hover/item:border-primary">
                  {link.badge}
                </span>
              )}
            </a>
          ))}
        </nav>

        {/* Right Actions: Language Toggle & Login / Dashboard (Always visible, uncluttered) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          {/* Language Toggle Button */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl text-xs font-bold text-[#382719] hover:text-primary bg-white hover:bg-[#FFF8EF] border border-[#E9B44C]/40 shadow-sm transition-all active:scale-95 whitespace-nowrap"
            aria-label={`Switch language to ${lang === 'en' ? 'Hindi' : 'English'}`}
          >
            <Globe className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
            <span>{lang === 'en' ? 'हिंदी' : 'EN'}</span>
          </button>

          {/* Member Login / Sign Up or Dashboard Button */}
          {currentUser ? (
            <button
              type="button"
              onClick={isAdmin ? onNavigateAdmin : onNavigateMember}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-secondary border border-primary shadow-sm transition-all whitespace-nowrap"
              title={isAdmin ? "Open Admin Dashboard" : "Open Member Dashboard"}
            >
              <User className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{lang === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenLoginModal}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold text-[#382719] hover:text-primary bg-white hover:bg-[#FFF8EF] border border-[#E9B44C]/50 shadow-sm transition-all whitespace-nowrap"
              title="Member or Admin Login / Sign Up"
            >
              <User className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
              <span>
                {lang === 'hi' ? 'लॉगिन' : 'Login'}
                <span className="hidden sm:inline"> / {lang === 'hi' ? 'साइन अप' : 'Sign Up'}</span>
              </span>
            </button>
          )}

          {/* Mobile / Tablet Menu Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 sm:p-2 rounded-xl text-[#382719] hover:bg-white/60 transition-colors focus:outline-none"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E9B44C]/25 bg-[#FFF8EF] px-4 pt-3 pb-5 space-y-2 animate-in slide-in-from-top-2 duration-200 shadow-md">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={handleLinkClick}
                className="px-3 py-2 text-sm font-bold text-[#454545] hover:text-primary hover:bg-white rounded-xl transition-colors flex items-center justify-between"
              >
                <span>{link.label}</span>
                {link.badge ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold text-secondary bg-white border border-[#E9B44C]/50">
                    {link.badge}
                  </span>
                ) : (
                  <span className="text-[#E9B44C] text-xs">→</span>
                )}
              </a>
            ))}
          </div>

          <div className="pt-2 border-t border-[#E9B44C]/25">
            {currentUser ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (isAdmin) onNavigateAdmin();
                  else onNavigateMember();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-primary text-white font-bold text-xs shadow-sm transition-all"
              >
                <User className="w-4 h-4" />
                <span>{lang === 'hi' ? 'डैशबोर्ड खोलें' : 'Open Dashboard'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLoginModal();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-[#E9B44C] bg-white text-[#382719] hover:bg-[#FFF8EF] font-bold text-xs shadow-sm transition-all"
              >
                <User className="w-4 h-4 text-primary" />
                <span>{lang === 'hi' ? 'सदस्य / व्यवस्थापक लॉगिन व पंजीकरण' : 'Login / Create Account'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
