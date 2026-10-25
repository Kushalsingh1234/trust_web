import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { 
  Coins, 
  Users, 
  HeartPulse, 
  Hammer, 
  Landmark, 
  Sparkles, 
  ShieldCheck, 
  HeartHandshake, 
  Quote, 
  ArrowRight, 
  FileText, 
  CheckCircle2 
} from 'lucide-react';

const iconMap = {
  coins: Coins,
  users: Users,
  heartPulse: HeartPulse,
  hammer: Hammer,
  landmark: Landmark,
  sparkles: Sparkles,
  shieldCheck: ShieldCheck,
  heartHandshake: HeartHandshake
};

export const VisionSocialReformation = () => {
  const { lang, t } = useLanguage();
  const visionData = t.socialVision;

  if (!visionData) return null;

  return (
    <section 
      id="social-vision" 
      className="py-14 sm:py-20 lg:py-24 bg-gradient-to-b from-[#FFFDF9] via-white to-[#FFF8EF] relative border-b border-[#E9B44C]/30 overflow-hidden"
    >
      {/* Background Subtle Watermarks / Ambient shapes */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-4xl mx-auto mb-10 sm:mb-14">
          <span className="inline-block text-xs sm:text-sm font-extrabold uppercase tracking-wider text-secondary bg-[#FFF8EF] border border-[#E9B44C]/60 px-4 py-1 rounded-full shadow-sm">
            {visionData.badge}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#382719] mt-3.5 leading-tight font-hindi-heading tracking-tight">
            {visionData.title}
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-[#454545] mt-3.5 max-w-3xl mx-auto leading-relaxed font-medium">
            {visionData.subtitle}
          </p>
          <div className="w-24 h-1.5 bg-gradient-to-r from-primary via-accent to-secondary mx-auto mt-5 rounded-full"></div>
        </div>

        {/* Guiding Quote Card */}
        <div className="max-w-4xl mx-auto mb-12 sm:mb-16">
          <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#FFF5E6] via-[#FFF8EF] to-[#FFF0D4] border-2 border-[#E9B44C]/50 shadow-md">
            <Quote className="w-10 h-10 sm:w-12 sm:h-12 text-primary/20 absolute -top-4 -left-2 sm:-top-5 sm:-left-3 pointer-events-none" />
            <p className="text-base sm:text-xl font-bold text-[#382719] leading-relaxed text-center font-hindi-heading italic">
              {visionData.quote}
            </p>
            <p className="text-xs sm:text-sm text-secondary font-extrabold text-center mt-3 tracking-wide">
              {visionData.quoteAuthor}
            </p>
          </div>
        </div>

        {/* Pillars Title Sub-heading */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <h3 className="text-xl sm:text-2xl font-black text-[#382719] font-hindi-heading">
            {visionData.pillarsTitle}
          </h3>
          <p className="text-xs sm:text-sm text-[#666666] mt-1.5">
            {visionData.pillarsSubtitle}
          </p>
        </div>

        {/* 8 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {visionData.pillars.map((pillar, idx) => {
            const Icon = iconMap[pillar.icon] || Sparkles;
            const number = String(idx + 1).padStart(2, '0');

            return (
              <div
                key={pillar.id}
                className="group relative rounded-2xl p-5 sm:p-6 bg-white border border-[#E9B44C]/35 hover:border-primary shadow-card hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1.5"
              >
                <div>
                  {/* Top Bar with Number & Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black text-secondary bg-[#FFF8EF] border border-[#E9B44C]/50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {pillar.tag}
                    </span>
                    <span className="text-xs font-mono font-black text-gray-400 group-hover:text-primary transition-colors">
                      #{number}
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 group-hover:bg-primary text-primary group-hover:text-white flex items-center justify-center flex-shrink-0 transition-colors duration-300 shadow-xs">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="font-black text-base sm:text-lg text-[#382719] group-hover:text-primary transition-colors leading-snug font-hindi-heading pt-1">
                      {pillar.title}
                    </h4>
                  </div>

                  {/* Detailed Description */}
                  <p className="text-xs sm:text-sm text-[#4A4A4A] leading-relaxed mt-2 text-left">
                    {pillar.desc}
                  </p>
                </div>

                {/* Impact Badge */}
                <div className="mt-5 pt-3.5 border-t border-[#E9B44C]/25 flex items-center gap-1.5 text-[11px] font-bold text-secondary">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="truncate">{pillar.impact}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Manifesto Callout */}
        <div className="mt-12 sm:mt-16 max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-[#382719] via-[#2A1D13] to-[#1F150D] text-white p-6 sm:p-10 shadow-2xl relative overflow-hidden text-center sm:text-left">
          <div className="absolute right-0 bottom-0 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-block px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-300 bg-white/10 border border-white/20 mb-2.5">
                {lang === 'hi' ? 'मार्गदर्शक ध्येय वाक्य' : 'Guiding Maxim'}
              </span>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black font-hindi-heading text-white">
                {visionData.manifestoCallout.title}
              </h3>
              <p className="mt-2.5 text-xs sm:text-sm text-gray-200 leading-relaxed font-normal">
                {visionData.manifestoCallout.desc}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 flex-shrink-0">
              <a
                href="#guidelines"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-primary hover:bg-secondary text-white font-bold text-xs sm:text-sm shadow-saffron transition-all transform hover:-translate-y-0.5 active:scale-95 text-center"
              >
                <span>{visionData.manifestoCallout.ctaGuidelines}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                to="/gallery"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white/10 hover:bg-white hover:text-[#382719] text-white font-bold text-xs sm:text-sm border border-white/30 transition-all text-center"
              >
                <FileText className="w-4 h-4 text-amber-300 group-hover:text-primary" />
                <span>{visionData.manifestoCallout.ctaCharter}</span>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default VisionSocialReformation;
