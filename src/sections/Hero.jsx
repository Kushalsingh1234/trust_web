import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import TrustLogo from '../components/TrustLogo';
import { Heart, UserPlus, ShieldCheck, MapPin, Award, HandHeart, Users, BookOpen, Sparkles, Phone } from 'lucide-react';

export const Hero = ({ onOpenReceiptModal, onOpenHelpModal, onOpenJoinModal }) => {
  const { lang, t } = useLanguage();

  const visualCardContent = (
    <div className="relative flex flex-col items-center justify-center text-center select-none py-2 sm:py-6 lg:py-8">
      {/* Concentric Logo Centerpiece */}
      <div className="relative flex items-center justify-center">
        {/* Ambient Celestial Glowing Aura - Exact Center of Logo (Pulse only on desktop) */}
        <div className="absolute w-[125%] h-[125%] rounded-full bg-gradient-to-tr from-[#E87516]/20 via-[#E9B44C]/25 to-amber-200/15 blur-3xl pointer-events-none -z-10 opacity-75 md:opacity-100 md:animate-pulse"></div>

        {/* Subtle Concentric Dashed Ring - Desktop Only Rotation */}
        <div className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none -z-10">
          <div className="w-[114%] h-[114%] rounded-full border border-dashed border-[#E9B44C]/35 md:animate-[spin_80s_linear_infinite_reverse]"></div>
        </div>

        {/* The Big Freestanding Emblem */}
        <div className="relative group cursor-pointer transform md:hover:scale-105 transition-all duration-500">
          <div className="hidden md:block absolute -inset-4 bg-gradient-to-r from-primary/25 to-accent/25 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <TrustLogo 
            className="w-56 h-56 sm:w-64 sm:h-64 lg:w-80 lg:h-80 drop-shadow-[0_16px_36px_rgba(200,93,19,0.28)]" 
            showText={false} 
            animated={true}
            hasBackground={false}
            lang={lang} 
          />
        </div>
      </div>

      {/* Sacred Trust Motto Badge */}
      <div className="mt-5 sm:mt-6 z-10">
        <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-white/95 backdrop-blur-sm border border-[#E9B44C]/65 shadow-xs text-xs sm:text-sm font-black text-secondary tracking-wide uppercase hover:border-primary transition-colors">
          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></span>
          <span>राष्ट्र हित ! • सनातन हित !! • परिवार हित !!!</span>
        </div>
      </div>

      {/* Trust Title & Location */}
      <div className="mt-3 max-w-sm sm:max-w-md z-10 px-2">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-[#2E1E12] tracking-tight leading-tight font-hindi-heading">
          {lang === 'hi' 
            ? 'राष्ट्रीय सनातन संस्कार सेवा संस्थान' 
            : 'Rashtriya Sanatan Sanskar Seva Sansthan'}
        </h2>
        <p className="text-xs sm:text-sm font-extrabold text-primary mt-1 tracking-wide">
          {lang === 'hi' 
            ? 'पंजीकृत लोक धर्मार्थ न्यास (ट्रस्ट) • गोरखपुर, उत्तर प्रदेश' 
            : 'Registered Public Charitable Trust • Gorakhpur, UP'}
        </p>
        <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#E9B44C] to-transparent mx-auto mt-2"></div>
      </div>
    </div>
  );

  return (
    <>
      {/* Front Page Hero Section: Clean, rich, no images on initial mobile fold */}
      <section className="relative overflow-hidden bg-transparent min-h-[calc(100dvh-3.5rem)] sm:min-h-[calc(100dvh-5rem)] lg:min-h-[calc(100vh-5rem)] flex flex-col justify-between py-4 sm:py-7 lg:py-12 border-b border-[#E9B44C]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full my-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Heading, Mission, 4 Pillars, Badges & CTAs */}
            <div className="lg:col-span-7 space-y-3.5 sm:space-y-4 text-left">
              {/* Sacred Ribbon & Trust Status */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/10 via-white to-amber-500/10 border border-[#E9B44C]/60 text-primary font-bold text-[11px] sm:text-xs shadow-xs">
                  <span className="font-hindi-heading">॥ ॐ धर्मो रक्षति रक्षितः ॥</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 border border-[#E9B44C]/60 text-[#382719] font-bold text-[11px] sm:text-xs shadow-xs max-w-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 md:animate-pulse flex-shrink-0"></span>
                  <span className="truncate">{t.hero.badge}</span>
                </div>
              </div>

              {/* Main Title with Elegant Saffron Accent */}
              <div>
                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#382719] leading-[1.2] sm:leading-[1.15] tracking-tight font-hindi-heading">
                  {lang === 'hi' ? (
                    <>
                      राष्ट्रीय <span className="text-primary font-black bg-gradient-to-r from-primary via-[#EA6F0B] to-[#D65900] bg-clip-text text-transparent">सनातन संस्कार</span> सेवा संस्थान
                    </>
                  ) : (
                    <>
                      Rashtriya <span className="text-primary font-black bg-gradient-to-r from-primary via-[#EA6F0B] to-[#D65900] bg-clip-text text-transparent">Sanatan Sanskar</span> Seva Sansthan
                    </>
                  )}
                </h1>
                <p className="text-xs sm:text-base text-[#523e2b] leading-relaxed max-w-2xl font-medium mt-1.5">
                  {t.hero.subtitle}
                </p>
              </div>

              {/* Four Sacred Pillars of Seva Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 pt-0.5">
                {/* Pillar 1: 16 Sanskars */}
                <Link
                  to="/about"
                  className="p-2 sm:p-2.5 rounded-xl bg-white/85 hover:bg-white border border-[#E9B44C]/40 hover:border-primary shadow-xs transition-all text-left group"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] group-hover:bg-primary group-hover:text-white transition-colors">
                      १६
                    </span>
                    <span className="font-extrabold text-[11px] sm:text-xs text-[#382719] group-hover:text-primary transition-colors">
                      {lang === 'hi' ? 'षोडश संस्कार' : '16 Sanskars'}
                    </span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-[#666666] leading-tight font-medium">
                    {lang === 'hi' ? 'सुलभ, किफायती व वैदिक विधान' : 'Affordable Vedic Life Rites'}
                  </p>
                </Link>

                {/* Pillar 2: Labor Welfare */}
                <Link
                  to="/programs"
                  className="p-2 sm:p-2.5 rounded-xl bg-white/85 hover:bg-white border border-[#E9B44C]/40 hover:border-primary shadow-xs transition-all text-left group"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Users className="w-3 h-3" />
                    </div>
                    <span className="font-extrabold text-[11px] sm:text-xs text-[#382719] group-hover:text-primary transition-colors">
                      {lang === 'hi' ? 'श्रमिक कल्याण' : 'Labor Welfare'}
                    </span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-[#666666] leading-tight font-medium">
                    {lang === 'hi' ? 'मजदूर अधिकार एवं सहायता' : 'Grassroots Worker Support'}
                  </p>
                </Link>

                {/* Pillar 3: Family Reform Guidelines */}
                <Link
                  to="/about"
                  className="p-2 sm:p-2.5 rounded-xl bg-white/85 hover:bg-white border border-[#E9B44C]/40 hover:border-primary shadow-xs transition-all text-left group"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-5 h-5 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-700 group-hover:text-white transition-colors">
                      <BookOpen className="w-3 h-3" />
                    </div>
                    <span className="font-extrabold text-[11px] sm:text-xs text-[#382719] group-hover:text-primary transition-colors">
                      {lang === 'hi' ? '१२ आग्रह नियम' : '12 Guidelines'}
                    </span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-[#666666] leading-tight font-medium">
                    {lang === 'hi' ? 'संयुक्त परिवार व सादगी संकल्प' : 'Moral Family Culture'}
                  </p>
                </Link>

                {/* Pillar 4: Membership */}
                <button
                  type="button"
                  onClick={onOpenJoinModal}
                  className="p-2 sm:p-2.5 rounded-xl bg-white/85 hover:bg-white border border-[#E9B44C]/40 hover:border-primary shadow-xs transition-all text-left group"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-5 h-5 rounded-md bg-orange-50 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                      <Sparkles className="w-3 h-3" />
                    </div>
                    <span className="font-extrabold text-[11px] sm:text-xs text-[#382719] group-hover:text-primary transition-colors">
                      {lang === 'hi' ? '₹२०० सदस्यता' : 'Membership'}
                    </span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-[#666666] leading-tight font-medium">
                    {lang === 'hi' ? 'वार्षिक सहयोग व सेवा सदस्यता' : '₹200/yr Annual Membership'}
                  </p>
                </button>
              </div>

              {/* Action Buttons: Primary Full-Width on Mobile, Companion Grid */}
              <div className="space-y-2.5 sm:space-y-0 sm:flex sm:flex-row sm:items-center sm:gap-3 pt-1">
                {/* Primary Action: Donate */}
                <Link
                  to="/donate"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-full bg-gradient-to-r from-primary via-[#EA6F0B] to-[#D65900] hover:from-secondary hover:to-primary text-white font-black text-sm sm:text-base shadow-saffron transition-all transform hover:-translate-y-0.5 active:scale-[0.98] border border-primary/20 text-center"
                >
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-white text-white flex-shrink-0" />
                  <span>{t.hero.donateBtn}</span>
                </Link>

                {/* Secondary Companion Actions: 2 columns on mobile, row on desktop */}
                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3">
                  <button
                    type="button"
                    onClick={onOpenJoinModal}
                    className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-6 py-2.5 sm:py-3.5 rounded-xl sm:rounded-full bg-secondary hover:bg-primary text-white font-bold text-xs sm:text-base shadow-deep-saffron transition-all transform hover:-translate-y-0.5 active:scale-[0.98] text-center"
                  >
                    <UserPlus className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{lang === 'hi' ? 'सदस्य बनें' : 'Join Member'}</span>
                  </button>

                  <button
                    type="button"
                    id="hero-ask-help-btn"
                    aria-label="Ask for Help"
                    onClick={onOpenHelpModal}
                    className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-5 py-2.5 sm:py-3.5 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold text-[#382719] hover:text-primary transition-all bg-white hover:bg-[#FFF8EF] border-2 border-[#E9B44C] shadow-xs hover:shadow-sm transform hover:-translate-y-0.5 active:scale-[0.98] text-center"
                  >
                    <HandHeart className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="truncate">{lang === 'hi' ? 'सहायता मांगें' : 'Ask for Help'}</span>
                  </button>
                </div>
              </div>

              {/* Small Trust Verification Badges: Untruncated 3-column micro-cards */}
              <div className="pt-2 sm:pt-3 border-t border-[#E9B44C]/30 grid grid-cols-3 gap-2 sm:gap-3">
                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1 sm:gap-2 text-xs bg-white/95 p-2 sm:p-2.5 rounded-xl border border-[#E9B44C]/30 shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div className="min-w-0 w-full">
                    <span className="font-extrabold block text-[#382719] text-[11px] sm:text-xs leading-tight">
                      {lang === 'hi' ? 'पंजीकृत ट्रस्ट' : 'Regd. Trust'}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-[#666666] font-medium block leading-tight mt-0.5 truncate">
                      Gorakhpur, UP
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1 sm:gap-2 text-xs bg-white/95 p-2 sm:p-2.5 rounded-xl border border-[#E9B44C]/30 shadow-xs">
                  <Award className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="min-w-0 w-full">
                    <span className="font-extrabold block text-[#382719] text-[11px] sm:text-xs leading-tight">
                      80G / 12A
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-amber-700 font-bold block leading-tight mt-0.5 truncate">
                      {lang === 'hi' ? 'प्रक्रियाधीन' : 'In Process'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1 sm:gap-2 text-xs bg-white/95 p-2 sm:p-2.5 rounded-xl border border-[#E9B44C]/30 shadow-xs">
                  <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
                  <div className="min-w-0 w-full">
                    <span className="font-extrabold block text-[#382719] text-[11px] sm:text-xs leading-tight">
                      {lang === 'hi' ? 'रूस्तमपुर' : 'Rustampur'}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-[#666666] font-semibold block leading-tight mt-0.5 truncate">
                      Gorakhpur 273016
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct Helpline Bar */}
              <div className="flex items-center justify-between gap-2 p-2 sm:p-2.5 rounded-xl bg-white/90 border border-[#E9B44C]/35 shadow-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-[10px] text-[#666666] font-bold uppercase tracking-wider leading-none">
                      {lang === 'hi' ? 'मार्गदर्शन एवं सहायता हेल्पलाइन' : 'Helpline & Inquiries'}
                    </p>
                    <p className="text-xs font-mono font-black text-[#382719] leading-tight mt-0.5 truncate">
                      +91 9794590044 • 9135218839
                    </p>
                  </div>
                </div>
                <a
                  href="tel:9794590044"
                  className="px-2.5 py-1 rounded-lg bg-primary hover:bg-secondary text-white text-[10px] font-black uppercase tracking-wider shadow-xs flex-shrink-0 transition-colors"
                >
                  {lang === 'hi' ? 'कॉल करें' : 'Call'}
                </a>
              </div>

            </div>

            {/* Desktop Only: Hero Visual Showcase in Right Column */}
            <div className="hidden lg:block lg:col-span-5 relative mt-4 lg:mt-0">
              {visualCardContent}
            </div>

          </div>
        </div>

        {/* Mobile-only Scroll Indicator at bottom of front page fold - Clean static on mobile */}
        <div className="lg:hidden flex flex-col items-center justify-center gap-0.5 text-[11px] text-[#8C6D53] font-bold pt-2">
          <span>{lang === 'hi' ? 'नीचे फ़ोटो व विस्तृत विवरण देखें ↓' : 'Scroll down to explore photos & programs ↓'}</span>
        </div>
      </section>

      {/* Mobile-only After-Scroll Section: Reveals the real photo showcase after scrolling down */}
      <section className="lg:hidden bg-[#FFF8EF] px-4 py-8 border-b border-[#E9B44C]/30">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-secondary bg-white border border-[#E9B44C]/60 px-3 py-0.5 rounded-full shadow-xs">
              {lang === 'hi' ? 'आधिकारिक ट्रस्ट परिचय एवं प्रतीक' : 'Trust Leadership & Official Emblem'}
            </span>
          </div>
          {visualCardContent}
        </div>
      </section>
    </>
  );
};

export default Hero;
