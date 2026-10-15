import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Heart, UserPlus, ShieldCheck, MapPin, Award, ArrowDown } from 'lucide-react';

export const Hero = ({ onOpenReceiptModal }) => {
  const { lang, t } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-hero-ivory min-h-[calc(100vh-68px)] lg:min-h-[calc(100vh-76px)] flex flex-col justify-center py-8 sm:py-12 lg:py-16 border-b border-[#E9B44C]/30">
      {/* Decorative Sunburst Golden Glow Elements */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#E9B44C]/15 rounded-full blur-3xl pointer-events-none -mt-20"></div>
      <div className="absolute bottom-0 left-10 w-96 h-96 bg-[#E87516]/10 rounded-full blur-3xl pointer-events-none -mb-20"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Heading, Mission, Badges & CTAs */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-left">
            {/* Trust Identity Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF8EF] border border-[#E9B44C]/70 text-[#382719] font-bold text-xs sm:text-sm shadow-sm">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>{t.hero.badge}</span>
            </div>

            {/* Main Title */}
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#382719] leading-[1.15] tracking-tight font-hindi-heading">
                {t.hero.title}
              </h1>
            </div>

            {/* Subtitle / Mission */}
            <p className="text-sm sm:text-base md:text-lg text-[#454545] leading-relaxed max-w-2xl font-medium">
              {t.hero.subtitle}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href="#donate"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-primary hover:bg-secondary text-white font-black text-sm sm:text-base shadow-saffron transition-all transform hover:-translate-y-0.5 active:translate-y-0 border border-primary"
              >
                <Heart className="w-5 h-5 fill-white text-white" />
                <span>{t.hero.donateBtn}</span>
              </a>

              <button
                type="button"
                onClick={onOpenReceiptModal}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-secondary hover:bg-primary text-white font-bold text-sm sm:text-base shadow-deep-saffron transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <UserPlus className="w-5 h-5" />
                <span>{t.hero.joinBtn}</span>
              </button>

              <a
                href="#programs"
                className="inline-flex items-center gap-1.5 px-4 py-3 rounded-full text-xs sm:text-sm font-bold text-[#382719] hover:text-primary transition-colors bg-white/90 border border-[#E9B44C]/40"
              >
                <span>{t.hero.exploreWork}</span>
                <ArrowDown className="w-4 h-4 text-primary" />
              </a>
            </div>

            {/* Small Trust Verification Badges */}
            <div className="pt-4 border-t border-[#E9B44C]/30 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 text-xs bg-white/90 p-2 rounded-xl border border-[#E9B44C]/30">
                <ShieldCheck className="w-4 h-4 text-trust-green flex-shrink-0" />
                <div>
                  <span className="font-extrabold block text-[#382719]">{t.hero.badges.reg}</span>
                  <span className="text-[10px] text-[#454545] font-mono font-medium">{t.hero.badges.regNo}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs bg-white/90 p-2 rounded-xl border border-[#E9B44C]/30">
                <Award className="w-4 h-4 text-primary flex-shrink-0" />
                <div>
                  <span className="font-extrabold block text-[#382719]">80G / 12A Status</span>
                  <span className="text-[10px] text-secondary font-bold">{t.hero.badges.taxStatus}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs bg-white/90 p-2 rounded-xl border border-[#E9B44C]/30 col-span-2 sm:col-span-1">
                <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
                <div>
                  <span className="font-extrabold block text-[#382719]">{t.hero.badges.location}</span>
                  <span className="text-[10px] text-[#454545] font-semibold">Gorakhpur 273016</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Showcase with Real Photos */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Outer Golden decorative aura */}
              <div className="absolute -inset-2.5 bg-gradient-to-tr from-accent/50 via-primary/30 to-secondary/30 rounded-3xl blur-md opacity-60"></div>
              
              {/* Main Card with Real Event Collage */}
              <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <img
                    src="/images/gallery/shramik_camp_collage.jpg"
                    alt="Shramik Jagrookta Abhiyan Camp Gorakhpur"
                    className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"></div>
                  
                  {/* Floating Caption on Image */}
                  <div className="absolute bottom-3 left-3 right-3 text-white text-left">
                    <span className="bg-secondary text-gray-950 font-black text-[10px] uppercase px-2 py-0.5 rounded-full tracking-wider shadow">
                      {lang === 'hi' ? 'जमीनी कार्यक्रम' : 'Ground Action'}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold mt-1 line-clamp-1 drop-shadow">
                      {lang === 'hi' 
                        ? 'श्रमिक जागरूकता अभियान • आजाद चौक, गोरखपुर' 
                        : 'Labor Welfare Awareness Campaign, Gorakhpur'}
                    </h3>
                  </div>
                </div>

                {/* Card Sub-strip with Bank Verification info */}
                <div className="p-4 bg-[#FFF8EF] border-t border-[#E9B44C]/30 flex items-center justify-between text-left">
                  <div className="flex items-center gap-3">
                    <img
                      src="/images/avatars/bajrangi_dubey.jpg"
                      alt="Bajrangi Dubey"
                      className="w-11 h-11 rounded-full border-2 border-primary object-cover shadow-sm"
                    />
                    <div>
                      <p className="text-xs font-bold text-[#382719]">
                        {lang === 'hi' ? 'बजरंगी दूबे' : 'Bajrangi Dubey'}
                      </p>
                      <p className="text-[11px] text-[#454545] font-medium">
                        {lang === 'hi' ? 'महामंत्री / प्रबंधक (RSSSST)' : 'General Secretary / Manager'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-[#666666] block uppercase font-bold tracking-wider">
                      {lang === 'hi' ? 'वार्षिक सदस्यता' : 'Membership'}
                    </span>
                    <span className="text-sm font-extrabold text-primary">
                      ₹200 / {lang === 'hi' ? 'वर्ष' : 'yr'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Badge: 16 Sanskars */}
              <div className="absolute -bottom-4 -left-3 sm:-left-6 bg-white p-2.5 rounded-xl shadow-card border border-[#E9B44C]/40 flex items-center gap-2 max-w-[200px]">
                <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  १६
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-extrabold text-[#382719] uppercase tracking-tight">
                    {lang === 'hi' ? 'षोडश संस्कार' : '16 Vedic Sanskars'}
                  </p>
                  <p className="text-[9px] text-[#454545] font-medium">
                    {lang === 'hi' ? 'सुलभ व पवित्र विधान' : 'Authentic Life Rites'}
                  </p>
                </div>
              </div>

              {/* Floating Badge: Bank of India */}
              <div className="absolute -top-3 -right-2 sm:-right-4 bg-white px-3 py-1.5 rounded-xl shadow-card border border-[#E9B44C]/40 text-left">
                <span className="text-[9px] text-[#666666] block uppercase font-bold">
                  {lang === 'hi' ? 'अधिकृत बैंक' : 'Official Bank'}
                </span>
                <span className="text-xs font-black text-primary">
                  Bank of India
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
