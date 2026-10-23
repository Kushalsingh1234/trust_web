import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import TrustLogo from './TrustLogo';
import MemberBadge from './MemberBadge';
import {
  Menu,
  X,
  Globe,
  User,
  Heart,
  UserPlus,
  Download,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  ShieldCheck,
  Shield
} from 'lucide-react';

export const Navbar = ({
  onOpenReceiptModal,
  onOpenLoginModal,
  onOpenJoinModal,
  onNavigateMember,
  onNavigateAdmin
}) => {
  const { lang, toggleLanguage, t } = useLanguage();
  const { currentUser, userProfile, isAdmin, logout } = useAuth();
  const isMember = Boolean(userProfile?.isMember === true);
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  // Click outside listener for profile dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setProfileDropdownOpen(false);
      toast.info(lang === 'hi' ? 'सफलतापूर्वक लॉगआउट किया गया।' : 'Logged out successfully.');
      navigate('/');
    } catch (err) {
      toast.error('Logout failed: ' + err.message);
    }
  };

  // Primary Navigation Route Links
  const navLinks = [
    { 
      to: currentUser ? '/dashboard' : '/', 
      label: lang === 'hi' ? (currentUser ? 'डैशबोर्ड' : 'मुख्य पृष्ठ') : (currentUser ? 'Dashboard' : 'Home') 
    },
    { to: '/about', label: lang === 'hi' ? 'परिचय' : 'About' },
    { to: '/programs', label: lang === 'hi' ? 'सेवा प्रकल्प' : 'Programs' },
    { to: '/events', label: lang === 'hi' ? 'कार्यक्रम' : 'Events' },
    { to: '/gallery', label: lang === 'hi' ? 'चित्र दीर्घा' : 'Gallery' },
    { to: '/contact', label: lang === 'hi' ? 'सम्पर्क' : 'Contact' },
  ];

  const isActive = (path) => {
    if (path === '/' || path === '/dashboard' || path === '/admin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 w-full max-w-full bg-[#FFF8EF]/95 backdrop-blur-md shadow-[0_2px_12px_rgba(56,39,25,0.06)] border-b border-[#E9B44C]/30 transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4">
        
        {/* Brand Logo & Name */}
        <Link 
          to={currentUser ? "/dashboard" : "/"} 
          className="flex items-center gap-2 sm:gap-3 group flex-shrink-0 min-w-0" 
          aria-label={currentUser ? "Dashboard" : "Home"}
        >
          <TrustLogo className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" showText={false} lang={lang} />
          <div className="flex items-center min-w-0">
            <span className="font-extrabold text-[#382719] text-xs sm:text-base lg:text-lg tracking-tight font-hindi-heading group-hover:text-primary transition-colors truncate">
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

        {/* Right Actions: Language Toggle, Login & Hamburger Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          
          {/* Language Toggle Button */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold text-[#382719] hover:text-primary bg-white hover:bg-[#FFF8EF] border border-[#E9B44C]/40 shadow-xs transition-all active:scale-95 whitespace-nowrap cursor-pointer"
            aria-label={`Switch language to ${lang === 'en' ? 'Hindi' : 'English'}`}
          >
            <Globe className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
            <span>{lang === 'en' ? 'हिंदी' : 'English'}</span>
          </button>

          {/* User Auth Section: Login / Sign Up vs Profile Dropdown */}
          {currentUser ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold text-[#382719] hover:text-primary bg-white hover:bg-[#FFF8EF] border border-[#E9B44C]/60 shadow-xs transition-all active:scale-95"
                aria-expanded={profileDropdownOpen}
                aria-haspopup="true"
              >
                <div className="w-6 h-6 rounded-full bg-primary text-white font-black text-[11px] flex items-center justify-center flex-shrink-0">
                  {(userProfile?.fullName || userProfile?.username || 'U').charAt(0).toUpperCase()}
                </div>
                {(isMember && userProfile?.category) && (
                  <MemberBadge
                    category={userProfile.category}
                    memberId={userProfile?.memberId}
                    variant="inline"
                    showId={false}
                    lang={lang}
                  />
                )}
                <span className="hidden md:inline font-bold max-w-[110px] truncate">
                  {userProfile?.fullName?.split(' ')[0] || userProfile?.username || 'Profile'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-secondary transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-[#E9B44C]/40 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Dropdown Header */}
                  <div className="px-4 py-3 border-b border-[#E9B44C]/20 bg-[#FFF8EF]/50">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(isMember && userProfile?.category) && (
                        <MemberBadge
                          category={userProfile.category}
                          memberId={userProfile?.memberId}
                          variant="inline"
                          lang={lang}
                        />
                      )}
                      <p className="font-bold text-sm text-[#382719] truncate">
                        {userProfile?.fullName || 'User'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs font-mono text-secondary">
                        @{userProfile?.username || 'user'}
                      </p>
                    </div>
                  </div>

                  {/* Menu Links */}
                  <div className="py-1">
                    <Link
                      to="/dashboard"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-[#382719] hover:bg-[#FFF8EF] hover:text-primary transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-primary" />
                      <span>{lang === 'hi' ? 'मेरा डैशबोर्ड' : 'My Dashboard'}</span>
                    </Link>
                  </div>

                  {/* Logout Button */}
                  <div className="pt-1 border-t border-[#E9B44C]/20">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>{lang === 'hi' ? 'लॉगआउट करें' : 'Logout'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold text-[#382719] hover:text-primary bg-white hover:bg-[#FFF8EF] border border-[#E9B44C]/60 shadow-xs transition-all active:scale-95 whitespace-nowrap flex-shrink-0"
              title={lang === 'hi' ? 'खाते में लॉगिन करें' : 'Sign in to Account'}
            >
              <User className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
              <span>{lang === 'hi' ? 'लॉगिन' : 'Login'}</span>
            </Link>
          )}
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
        <>
          {/* Overlay Backdrop */}
          <div 
            className="fixed inset-0 top-14 sm:top-20 bg-black/40 backdrop-blur-xs lg:hidden z-40"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="relative z-50 lg:hidden border-t border-[#E9B44C]/25 bg-[#FFF8EF] px-4 pt-3 pb-6 space-y-3 shadow-xl max-h-[calc(100vh-3.5rem)] sm:max-h-[calc(100vh-5rem)] overflow-y-auto">
            
            {/* User card if logged in (Mobile) */}
            {currentUser && (
              <div className="p-3 rounded-2xl bg-white border border-[#E9B44C]/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-primary text-white font-black text-xs flex items-center justify-center">
                    {(userProfile?.fullName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold text-xs text-[#382719] truncate">{userProfile?.fullName}</p>
                      {isMember && userProfile?.category && (
                        <MemberBadge memberId={userProfile?.memberId} variant="compact" />
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-secondary">@{userProfile?.username}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

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
              {isMember ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-3 text-sm rounded-xl transition-colors flex items-center justify-between min-h-[44px] bg-emerald-50/70 text-emerald-950 font-bold border border-emerald-300"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>{lang === 'hi' ? 'सक्रिय सदस्यता डैशबोर्ड' : 'Active Membership Dashboard'}</span>
                  </div>
                  <span className="text-emerald-700 text-xs">→</span>
                </Link>
              ) : (
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
                  <span className="text-secondary font-mono font-bold text-xs">{lang === 'hi' ? '₹200/वर्ष' : '₹200/yr'}</span>
                </Link>
              )}

              {/* Dashboard Link in Mobile (if logged in) */}
              {currentUser && (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-3 text-sm rounded-xl transition-colors flex items-center justify-between min-h-[44px] ${
                    isActive('/dashboard')
                      ? 'bg-white text-primary font-black border border-[#E9B44C]/50 shadow-xs'
                      : 'text-[#382719] font-bold hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4 text-primary" />
                    <span>{lang === 'hi' ? 'मेरा डैशबोर्ड' : 'My Dashboard'}</span>
                  </div>
                  <span className="text-primary text-xs">→</span>
                </Link>
              )}

            </div>

            {/* Action buttons inside mobile drawer */}
            <div className="pt-3 border-t border-[#E9B44C]/25 flex flex-col gap-2.5">
              {/* Language Switcher inside mobile drawer */}
              <button
                type="button"
                onClick={() => {
                  toggleLanguage();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl bg-white border border-[#E9B44C]/50 text-[#382719] text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-secondary" />
                  <span>{lang === 'hi' ? 'भाषा बदलें (Language)' : 'Switch Language'}</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-black">
                  {lang === 'en' ? 'हिंदी' : 'English'}
                </span>
              </button>

              <Link
                to="/donate"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-sm shadow-sm transition-all min-h-[44px]"
              >
                <Heart className="w-4 h-4 fill-white text-white" />
                <span>{lang === 'hi' ? 'समर्पण निधि / दान करें' : 'Donate Now'}</span>
              </Link>

              {!currentUser && (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-[#E9B44C] bg-white text-[#382719] hover:bg-[#FFF8EF] font-bold text-sm shadow-sm transition-all min-h-[44px]"
                >
                  <User className="w-4 h-4 text-primary" />
                  <span>{lang === 'hi' ? 'लॉगिन' : 'Login'}</span>
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Navbar;
