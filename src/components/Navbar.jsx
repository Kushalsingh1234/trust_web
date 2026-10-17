import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import TrustLogo from './TrustLogo';
import { Menu, X, Globe, User, UserPlus } from 'lucide-react';

export const Navbar = ({
  onOpenReceiptModal,
  onOpenLoginModal,
  onOpenJoinModal,
  onNavigateMember,
  onNavigateAdmin
}) => {
  const { lang, toggleLanguage, t } = useLanguage();
  const { currentUser, userProfile, isAdmin } = useAuth();
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
          : 'bg-[#FFF8EF] sm:bg-transparent border-b border-[#E9B44C]/20 sm:border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand Logo & Name */}
        <a href="#" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0 min-w-0" aria-label="Home">
          <TrustLogo className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" showText={false} lang={lang} />
          <div className="flex items-center truncate">
            <span className="font-extrabold text-[#382719] text-sm sm:text-lg md:text-xl tracking-tight font-hindi-heading group-hover:text-primary transition-colors truncate">
              {lang === 'hi' ? 'सनातन संस्कार ' : 'Sanatan Sanskar '}
              <span className="text-primary font-black">
                {lang === 'hi' ? 'ट्रस्ट' : 'Trust'}
              </span>
            </span>
          </div>
        </a>

        {/* Center Navigation Links */}
        <nav className="hidden xl:flex items-center gap-6 2xl:gap-7" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-bold text-[#454545] hover:text-primary transition-colors flex items-center py-1 group/item"
            >
              <span>{link.label}</span>
              {link.badge && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider text-secondary bg-white border border-[#E9B44C]/60 ml-2 uppercase shadow-sm group-hover/item:border-primary">
                  {link.badge}
                </span>
              )}
            </a>
          ))}

          {/* Direct Join Link in Header */}
          <button
            type="button"
            onClick={onOpenJoinModal}
            className="text-sm font-bold text-primary hover:text-secondary transition-colors flex items-center gap-1 py-1"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'सदस्य बनें' : 'Join'}</span>
          </button>
        </nav>

        {/* Right Actions: Language Toggle, Member/Login */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          {/* Language Toggle Button */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold text-[#382719] hover:text-primary bg-white hover:bg-[#FFF8EF] border border-[#E9B44C]/40 shadow-sm transition-all active:scale-95"
            aria-label={`Switch language to ${lang === 'en' ? 'Hindi' : 'English'}`}
          >
            <Globe className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
            <span>{lang === 'en' ? 'हिंदी' : 'EN'}</span>
          </button>

          {/* Member Login / Dashboard Button */}
          {currentUser ? (
            <button
              type="button"
              onClick={onNavigateMember}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#382719] hover:text-primary bg-white hover:bg-[#FFF8EF] border border-[#E9B44C]/50 shadow-sm transition-all"
              title="Open Member Portal"
            >
              <User className="w-3.5 h-3.5 text-primary" />
              <span>{lang === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenLoginModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#382719] hover:text-primary bg-white hover:bg-[#FFF8EF] border border-[#E9B44C]/50 shadow-sm transition-all"
              title="Member or Admin Login"
            >
              <User className="w-3.5 h-3.5 text-secondary" />
              <span>{lang === 'hi' ? 'लॉगिन' : 'Login'}</span>
            </button>
          )}


          {/* Mobile / Tablet Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-1.5 sm:p-2 rounded-xl text-[#382719] hover:bg-white/60 transition-colors focus:outline-none"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Overlay Backdrop */}
          <div 
            className="fixed inset-0 top-16 bg-black/40 backdrop-blur-xs xl:hidden z-40"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="relative z-50 xl:hidden border-t border-[#E9B44C]/25 bg-[#FFF8EF] px-4 pt-3 pb-6 space-y-3 shadow-xl max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={handleLinkClick}
                  className="px-3 py-3 text-sm font-bold text-[#454545] hover:text-primary hover:bg-white rounded-xl transition-colors flex items-center justify-between min-h-[44px]"
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

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenJoinModal();
                }}
                className="px-3 py-3 text-sm font-bold text-primary hover:bg-white rounded-xl transition-colors flex items-center justify-between text-left min-h-[44px]"
              >
                <span>{lang === 'hi' ? 'सदस्यता आवेदन (Join Trust)' : 'Apply for Membership'}</span>
                <span className="text-primary text-xs">→</span>
              </button>
            </div>

            <div className="pt-3 border-t border-[#E9B44C]/25 flex flex-col gap-2.5">
              {currentUser ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigateMember();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-white font-bold text-sm shadow-sm transition-all min-h-[44px]"
                >
                  <User className="w-4 h-4" />
                  <span>{lang === 'hi' ? 'सदस्य डैशबोर्ड खोलें' : 'Open Member Dashboard'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenLoginModal();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-[#E9B44C] bg-white text-[#382719] hover:bg-[#FFF8EF] font-bold text-sm shadow-sm transition-all min-h-[44px]"
                >
                  <User className="w-4 h-4 text-primary" />
                  <span>{lang === 'hi' ? 'सदस्य / व्यवस्थापक लॉगिन' : 'Member / Admin Login'}</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Navbar;
