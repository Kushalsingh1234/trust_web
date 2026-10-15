import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Sun, HardHat, BookOpen, Landmark, HeartHandshake, Users, ArrowUpRight } from 'lucide-react';

export const Programs = () => {
  const { lang, t } = useLanguage();

  const iconMap = {
    Sun: Sun,
    HardHat: HardHat,
    BookOpen: BookOpen,
    Landmark: Landmark,
    HeartHandshake: HeartHandshake,
    Users: Users
  };

  return (
    <section id="programs" className="py-16 lg:py-24 bg-[#FFF8EF] relative border-b border-[#E9B44C]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-secondary bg-white border border-[#E9B44C]/60 px-4 py-1 rounded-full shadow-sm">
            {t.programs.tag}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#382719] mt-3.5 font-hindi-heading">
            {t.programs.title}
          </h2>
          <p className="text-sm sm:text-base text-[#454545] mt-3 leading-relaxed font-medium">
            {t.programs.subtitle}
          </p>
          <div className="w-20 h-1.5 bg-gradient-to-r from-primary via-accent to-secondary mx-auto mt-4 rounded-full"></div>
        </div>

        {/* 6 Key Program Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.programs.list.map((prog) => {
            const Icon = iconMap[prog.icon] || Sun;
            return (
              <div
                key={prog.id}
                className="bg-white rounded-3xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 border border-[#E9B44C]/35 flex flex-col justify-between group hover:-translate-y-1 text-left"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF8EF] text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors border border-[#E9B44C]/40 shadow-sm">
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="font-black text-[#382719] text-lg sm:text-xl mb-2.5 font-hindi-heading leading-snug group-hover:text-primary transition-colors">
                    {prog.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#454545] leading-relaxed font-normal">
                    {prog.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E9B44C]/20 flex items-center justify-between text-xs font-black text-secondary group-hover:text-primary">
                  <span>{lang === 'hi' ? 'सहयोग व सेवा उपलब्ध' : 'Available for Community'}</span>
                  <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Highlight Banner on Shramik & BOCW Schemes */}
        <div className="mt-12 bg-gradient-to-r from-[#382719] via-[#302319] to-[#241911] text-white rounded-3xl p-6 sm:p-8 shadow-card border border-[#E9B44C]/40 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#E87516]/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
            <div className="lg:col-span-8 space-y-2">
              <span className="bg-primary text-white font-black text-xs uppercase px-3 py-1 rounded-full shadow-sm tracking-wider">
                {lang === 'hi' ? 'विशेष जनकल्याण शिविर' : 'Special Labor Welfare Camp'}
              </span>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black font-hindi-heading text-accent pt-1">
                {lang === 'hi'
                  ? 'उ.प्र. भवन एवं अन्य सन्निर्माण कर्मकार कल्याण बोर्ड योजनाएँ'
                  : 'UP BOCW Construction Laborer Social Welfare Schemes'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-normal">
                {lang === 'hi'
                  ? 'मातृत्व, शिशु एवं बालिका मदद, संत रविदास शिक्षा, अटल आवासीय विद्यालय, कौशल विकास, कन्या विवाह सहायता, महात्मा गांधी पेंशन तथा पीएम श्रम योगी मान-धन योजना की संपूर्ण जानकारी व निःशुल्क सहायता।'
                  : 'Comprehensive support and registration for maternity aid, child welfare, Atal residential school admissions, skill upgrade, and labor pension schemes.'}
              </p>
            </div>

            <div className="lg:col-span-4 flex items-center lg:justify-end">
              <a
                href="#contact"
                className="px-6 py-3.5 rounded-full bg-primary hover:bg-secondary text-white font-black text-xs sm:text-sm shadow-saffron transition-transform active:scale-95 border border-primary"
              >
                {lang === 'hi' ? 'शिविर जानकारी प्राप्त करें' : 'Inquire for Welfare Camp'}
              </a>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Programs;
