import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  Flag,
  Sparkles,
  GraduationCap,
  BookOpen,
  Landmark,
  HardHat,
  Award,
  CalendarHeart,
  Music,
  ShieldAlert,
  HeartHandshake,
  Coins,
  Ban,
  Globe,
  Gem,
  HandHelping,
  Quote,
  Phone,
  UserPlus,
  ArrowRight
} from 'lucide-react';

export const Objectives = ({ onOpenJoinModal }) => {
  const { lang, t } = useLanguage();

  const icons = [
    Flag,            // 01: National & Sanatan Interest
    Sparkles,        // 02: 16 Vedic Sanskars
    GraduationCap,   // 03: Education, Health, Security
    BookOpen,        // 04: Sacred Scriptures
    Landmark,        // 05: Temples as Community Hubs
    HardHat,         // 06: Workers & Scheme Workers
    Award,           // 07: Government Welfare Schemes
    CalendarHeart,   // 08: Sanatan Festivals
    Music,           // 09: Traditional Folk Songs
    ShieldAlert,     // 10: Vigilance & Administrative Aid
    HeartHandshake,  // 11: Joint Family & Zero Old-Age Homes
    Coins,           // 12: Freedom from Extravagance & Debt
    Ban,             // 13: De-Addiction & Health
    Globe,           // 14: Unified Sanatan Platform
    Gem,             // 15: Matrimonial Support
    HandHelping      // 16: Upliftment of Marginalized
  ];

  const objData = t.objectives || {};
  const items = objData.items || [];

  return (
    <section id="objectives" className="py-12 sm:py-16 lg:py-24 bg-[#FFFDF9] relative border-b border-[#E9B44C]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-4xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF8EF] border border-[#E9B44C]/60 text-secondary text-xs sm:text-sm font-extrabold uppercase tracking-wider shadow-xs mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>{objData.tag || (lang === 'hi' ? 'पावन संकल्प' : 'Sacred Mission')}</span>
          </div>

          {/* Tri-Slogan Banner from Leaflet */}
          <div className="my-2">
            <span className="inline-block px-4 sm:px-6 py-2 rounded-2xl bg-gradient-to-r from-primary via-accent to-secondary text-white font-black text-sm sm:text-lg tracking-wide shadow-saffron font-hindi-heading">
              {objData.motto || 'राष्ट्र हित ! सनातन हित !! परिवार हित !!!'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#382719] mt-4 font-hindi-heading leading-tight">
            {objData.title || (lang === 'hi' ? 'हमारा उद्देश्य — 16 पावन संकल्प' : 'Our Objectives — 16 Founding Pillars')}
          </h2>

          <p className="text-sm sm:text-base text-[#454545] mt-3 leading-relaxed font-medium max-w-3xl mx-auto">
            {objData.subtitle}
          </p>

          <div className="w-24 h-1.5 bg-gradient-to-r from-primary via-accent to-secondary mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Foundational Message Scroll / Preamble from Brochure */}
        <div className="max-w-4xl mx-auto mb-12 sm:mb-16">
          <div className="bg-[#FFF8EF] rounded-3xl p-6 sm:p-8 border border-[#E9B44C]/50 shadow-card relative overflow-hidden text-left">
            <div className="absolute -top-4 -right-4 w-28 h-28 bg-primary/5 rounded-full pointer-events-none"></div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 border border-primary/20">
                <Quote className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-secondary">
                  {lang === 'hi' ? 'संस्थान का संकल्प पत्र' : 'Trust Manifesto'}
                </span>
                <h3 className="text-base sm:text-lg font-black text-[#382719] font-hindi-heading leading-tight">
                  {objData.letterTitle || (lang === 'hi' ? 'प्रिय आत्मीय जन' : 'Dear Respected Well-Wishers')}
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#454545] leading-relaxed font-medium">
              {objData.letterBody}
            </p>

            <div className="mt-4 pt-4 border-t border-[#E9B44C]/30 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-hindi-heading font-black text-primary">
                {lang === 'hi' ? 'वन्दे मातरम् • राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट)' : 'Vande Mataram • Rashtriya Sanatan Sanskar Seva Sansthan (Trust)'}
              </span>
              <span className="text-[11px] text-[#666666] font-semibold">
                {lang === 'hi' ? 'रूस्तमपुर, गोरखपुर (उत्तर प्रदेश)' : 'Rustampur, Gorakhpur (U.P.)'}
              </span>
            </div>
          </div>
        </div>

        {/* 16 Objectives Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map((item, idx) => {
            const Icon = icons[idx % icons.length] || Sparkles;
            return (
              <div
                key={item.no || idx}
                className="bg-[#FFF8EF] hover:bg-[#FDF4E5] rounded-2xl p-5 sm:p-6 border border-[#E9B44C]/35 shadow-card hover:shadow-lift transition-all duration-300 flex flex-col justify-between text-left group hover:-translate-y-1 relative"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary text-white font-black flex items-center justify-center flex-shrink-0 shadow-saffron text-sm border border-primary">
                      {item.no}
                    </div>

                    <div className="w-8 h-8 rounded-lg bg-white/90 text-primary flex items-center justify-center border border-[#E9B44C]/40 group-hover:bg-primary group-hover:text-white transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="font-black text-[#382719] text-sm sm:text-base mb-2 group-hover:text-primary transition-colors font-hindi-heading leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs text-[#555555] leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E9B44C]/25 flex items-center justify-between text-[11px] font-bold text-secondary">
                  <span>{lang === 'hi' ? `उद्देश्य क्र. ${item.no}` : `Pillar ${item.no}`}</span>
                  <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">✦</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sincere Appeal & Closing Action from Brochure */}
        <div className="mt-12 sm:mt-16 bg-[#FFF8EF] rounded-3xl p-6 sm:p-8 border-2 border-[#E9B44C]/50 shadow-card text-left">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-3xl">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-white bg-primary mb-2 shadow-xs">
                {objData.appealTitle || (lang === 'hi' ? 'निवेदन' : 'Sincere Appeal')}
              </span>
              <h4 className="text-base sm:text-lg md:text-xl font-black text-[#382719] font-hindi-heading leading-tight mt-1">
                {lang === 'hi' 
                  ? 'सनातन धर्म के संस्कारों को बढ़ावा देने एवं जनकल्याण हेतु हमसे जुड़ें'
                  : 'Join Hands to Preserve Vedic Sanskars & Uplift Society'}
              </h4>
              <p className="text-xs sm:text-sm text-[#454545] mt-2 font-medium leading-relaxed">
                {objData.appealDesc}
              </p>
              
              {/* Official Helplines from Leaflet */}
              <div className="mt-4 pt-3 border-t border-[#E9B44C]/30 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#555555]">
                <span className="font-bold text-[#382719] flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  {lang === 'hi' ? 'प्रमुख संपर्क सूत्र:' : 'Key Helplines:'}
                </span>
                <span className="font-mono font-bold text-primary">9794590044</span>
                <span className="font-mono font-bold text-[#382719]">9026734887</span>
                <span className="font-mono font-bold text-[#382719]">9794342292</span>
                <span className="font-mono font-bold text-[#382719]">8126739211</span>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={onOpenJoinModal}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary hover:bg-secondary text-white font-bold text-xs sm:text-sm shadow-saffron transition-all transform hover:-translate-y-0.5 active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>{lang === 'hi' ? 'ट्रस्ट का सदस्य बनें' : 'Become a Member'}</span>
              </button>
              
              <Link
                to="/contact"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-full bg-white hover:bg-white/80 text-[#382719] font-bold text-xs sm:text-sm border border-[#E9B44C] shadow-xs transition-all"
              >
                <span>{lang === 'hi' ? 'कार्यालय संपर्क' : 'Contact Us'}</span>
                <ArrowRight className="w-4 h-4 text-primary" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Objectives;
