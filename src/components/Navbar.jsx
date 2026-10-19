import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import TrustLogo from './TrustLogo';
import { Menu, X, Globe, User, Heart, UserPlus } from 'lucide-react';

export const Navbar = ({
  onOpenReceiptModal,
  onOpenLoginModal,
  onOpenJoinModal,
  onNavigateMember,
  onNavigateAdmin
}) => {
  const { lang, toggleLanguage, t } = useLanguage();
  const { currentUser } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Primary Navigation Route Links
  const navLinks = [
    { to: '/', label: lang === 'hi' ? 'मुख्य पृष्ठ' : 'Home' },
    { to: '/about', label: lang === 'hi' ? 'परिचय' : 'About' },
    { to: '/programs', label: lang === 'hi' ? 'सेवा प्रकल्प' : 'Programs' },
    { to: '/events', label: lang === 'hi' ? 'कार्यक्रम' : 'Events' },
    { to: '/gallery', label: lang === 'hi' ? 'चित्र दीर्घा' : 'Gallery' },
    { to: '/contact', label: lang === 'hi' ? 'सम्पर्क' : 'Contact' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 w-full bg-[#FFF8EF]/95 backdrop-blur-md shadow-[0_2px_12px_rgba(56,39,25,0.06)] border-b border-[#E9B44C]/30 transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-20 flex items-center justify-between gap-1.5 sm:gap-4">
        
        {/* Brand Logo & Name */}
        <Link 
          to="/" 
          className="flex items-center gap-2 sm:gap-3 group flex-shrink-0 min-w-0" 
          aria-label="Home"
        >
          <TrustLogo className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" showText={false} lang={lang} />
          <div className="flex items-center min-w-0">
            <span className="font-extrabold text-[#382719] text-xs sm:text-lg md:text-xl tracking-tight font-hindi-heading group-hover:text-primary transition-colors truncate">
              {lang === 'hi' ? 'सनातन संस्कार ' : 'Sanatan Sanskar '}
              <span className="text-primary font-black">
                {lang === 'hi' ? 'ट्रस्ट' : 'Trust'}
              </span>
            </span>
          </div>
        </Link>

        {/* Center Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2" aria-label="Main Navigation">
          {navLinks.map((link) => {
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-1 ${
                  active
                    ? 'text-primary font-black bg-white shadow-xs border border-[#E9B44C]/50'
                    : 'text-[#454545] font-bold hover:text-primary hover:bg-white/50'
                }`}
              >
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Highlighted CTAs, Language Toggle, Login */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          
          {/* Highlighted "Become a Member" Button */}
          <Link
            to="/membership"
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-[#382719] hover:text-primary bg-white hover:bg-[#FFF8EF] border border-[#E9B44C] shadow-xs transition-all active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5 text-primary" />
            <span>{lang === 'hi' ? 'सदस्य बनें' : 'Join'}</span>
          </Link>

          {/* Highlighted "Donate" Button */}
          <Link
            to="/donate"
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-xs font-black text-white bg-gradient-to-r from-primary via-[#EA6F0B] to-[#D65900] hover:from-secondary hover:to-primary shadow-saffron transition-all transform hover:-translate-y-0.5 active:scale-95"
          >
            <Heart className="w-3.5 h-3.5 fill-white text-white flex-shrink-0" />
            <span>{lang === 'hi' ? 'दान / समर्पण' : 'Donate'}</span>
          </Link>

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
            <Link
              to="/member"
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold text-[#382719] hover:text-primary bg-white hover:bg-[#FFF8EF] border border-[#E9B44C]/50 shadow-sm transition-all"
              title="Open Member Portal"
            >
              <User className="w-3.5 h-3.5 text-primary" />
              <span className="hidden md:inline">{lang === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={onOpenLoginModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold text-[#382719] hover:text-primary bg-white hover:bg-[#FFF8EF] border border-[#E9B44C]/50 shadow-sm transition-all"
              title="Member or Admin Login"
            >
              <User className="w-3.5 h-3.5 text-secondary" />
              <span className="hidden md:inline">{lang === 'hi' ? 'लॉगिन' : 'Login'}</span>
            </button>
          )}

          {/* Mobile Menu Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 sm:p-2 rounded-xl text-[#382719] hover:bg-white/60 transition-colors focus:outline-none"
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
            className="fixed inset-0 top-14 sm:top-20 bg-black/40 backdrop-blur-xs lg:hidden z-40"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="relative z-50 lg:hidden border-t border-[#E9B44C]/25 bg-[#FFF8EF] px-4 pt-3 pb-6 space-y-3 shadow-xl max-h-[calc(100vh-3.5rem)] sm:max-h-[calc(100vh-5rem)] overflow-y-auto">
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => {
                const active = isActive(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-3 text-sm rounded-xl transition-colors flex items-center justify-between min-h-[44px] ${
                      active
                        ? 'bg-white text-primary font-black border border-[#E9B44C]/50 shadow-xs'
                        : 'text-[#454545] font-bold hover:text-primary hover:bg-white'
                    }`}
                  >
                    <span>{link.label}</span>
                    <span className="text-primary text-xs">→</span>
                  </Link>
                );
              })}

              {/* Dedicated Membership Link in Mobile */}
              <Link
                to="/membership"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-3 text-sm rounded-xl transition-colors flex items-center justify-between min-h-[44px] ${
                  isActive('/membership')
                    ? 'bg-white text-primary font-black border border-[#E9B44C]/50 shadow-xs'
                    : 'text-[#382719] font-bold hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-primary" />
                  <span>{lang === 'hi' ? 'सदस्यता विधान एवं आवेदन' : 'Membership Application'}</span>
                </div>
                <span className="text-secondary font-mono font-bold text-xs">₹200/yr</span>
              </Link>

              {/* Transparency Link in Mobile */}
              <Link
                to="/transparency"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-3 text-sm rounded-xl transition-colors flex items-center justify-between min-h-[44px] ${
                  isActive('/transparency')
                    ? 'bg-white text-primary font-black border border-[#E9B44C]/50 shadow-xs'
                    : 'text-[#382719] font-bold hover:bg-white'
                }`}
              >
                <span>{lang === 'hi' ? 'पारदर्शिता एवं पंजीकरण प्रमाण' : 'Transparency & Registration'}</span>
                <span className="text-primary text-xs">→</span>
              </Link>
            </div>

            {/* Action buttons inside mobile drawer */}
            <div className="pt-3 border-t border-[#E9B44C]/25 flex flex-col gap-2.5">
              <Link
                to="/donate"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-sm shadow-sm transition-all min-h-[44px]"
              >
                <Heart className="w-4 h-4 fill-white text-white" />
                <span>{lang === 'hi' ? 'समर्पण निधि / दान करें' : 'Donate Now'}</span>
              </Link>

              {currentUser ? (
                <Link
                  to="/member"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white border border-[#E9B44C] text-[#382719] font-bold text-sm shadow-sm transition-all min-h-[44px]"
                >
                  <User className="w-4 h-4 text-primary" />
                  <span>{lang === 'hi' ? 'सदस्य डैशबोर्ड खोलें' : 'Open Member Dashboard'}</span>
                </Link>
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
