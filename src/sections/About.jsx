import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Target, Eye, Quote, MapPin, Building, ShieldCheck, User, UserCheck } from 'lucide-react';

export const About = () => {
  const { lang, t } = useLanguage();

  return (
    <section id="about" className="py-12 sm:py-16 lg:py-24 bg-white relative border-b border-[#E9B44C]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-secondary bg-[#FFF8EF] border border-[#E9B44C]/60 px-4 py-1 rounded-full shadow-sm">
            {t.about.tag}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#382719] mt-3.5 leading-tight font-hindi-heading">
            {t.about.title}
          </h2>
          <div className="w-20 h-1.5 bg-gradient-to-r from-primary via-accent to-secondary mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Story & Vision/Mission Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Left Text Narrative */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-left">
            <p className="text-sm sm:text-lg text-[#382719] leading-relaxed font-semibold">
              {t.about.desc1}
            </p>
            <p className="text-xs sm:text-base text-[#454545] leading-relaxed font-normal">
              {t.about.desc2}
            </p>

            {/* Mission & Vision Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-1 sm:pt-2">
              <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF8EF] border border-[#E9B44C]/35 shadow-card hover:shadow-card-hover transition-all">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary flex-shrink-0">
                    <Target className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-[#382719] text-base font-hindi-heading">
                    {t.about.missionTitle}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-[#454545] leading-relaxed">
                  {t.about.missionDesc}
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF8EF] border border-[#E9B44C]/35 shadow-card hover:shadow-card-hover transition-all">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="p-2 rounded-xl bg-accent/20 text-secondary flex-shrink-0">
                    <Eye className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-[#382719] text-base font-hindi-heading">
                    {t.about.visionTitle}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-[#454545] leading-relaxed">
                  {t.about.visionDesc}
                </p>
              </div>
            </div>

            {/* Registered Locations List */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF8EF] border border-[#E9B44C]/35 shadow-card space-y-2.5 text-xs sm:text-sm text-[#454545]">
              <div className="flex items-start gap-2.5">
                <Building className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-black text-[#382719]">
                    {lang === 'hi' ? 'मुख्य कार्यालय:' : 'Head Office:'}
                  </span>{' '}
                  <span className="font-medium text-[#454545]">
                    {lang === 'hi'
                      ? 'शिवाजीनगर सेक्टर-2 (बागरानी) महुईसुघरपुर रूस्तमपुर, गोरखपुर, उ.प्र. - 273016'
                      : 'Shivaji Nagar Sector-2 (Bagrani), Mahuisugharpur, Rustampur, Gorakhpur, UP - 273016'}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-black text-[#382719]">
                    {lang === 'hi' ? 'सम्पर्क एवं सहयोग कार्यस्थल:' : 'Contact & Support Office:'}
                  </span>{' '}
                  <span className="font-medium text-[#454545]">
                    {lang === 'hi'
                      ? 'साकेत नगर (मधुर शहनाई लॉन के सामने) रूस्तमपुर, गोरखपुर'
                      : 'Saket Nagar (In front of Madhur Shehnai Lawn), Rustampur, Gorakhpur'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Message Card with Real Photos */}
          <div className="lg:col-span-5 space-y-3.5 sm:space-y-4">
            {/* Bajrangi Dubey Message Card */}
            <div className="bg-[#FFF8EF] p-4 sm:p-6 rounded-3xl border border-[#E9B44C]/50 shadow-card hover:shadow-card-hover transition-all relative text-left">
              <Quote className="w-8 h-8 sm:w-10 sm:h-10 text-accent/40 absolute top-4 right-4 pointer-events-none" />
              
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <img
                  src="/images/avatars/bajrangi_dubey.jpg"
                  alt="Bajrangi Dubey"
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-primary object-cover object-top shadow-md ring-2 ring-primary/20 bg-white flex-shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="font-black text-base sm:text-lg text-[#382719] font-hindi-heading truncate">
                    {t.about.leaderName}
                  </h4>
                  <p className="text-xs font-bold text-primary truncate">
                    {t.about.leaderRole}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-[#454545] font-medium">
                    {lang === 'hi' ? 'जिला अध्यक्ष (भारतीय मजदूर संघ)' : 'District President (BMS Gorakhpur)'}
                  </p>
                </div>
              </div>

              <blockquote className="text-xs sm:text-sm text-[#454545] italic leading-relaxed border-l-2 border-primary pl-3">
                {t.about.leadershipQuote}
              </blockquote>
            </div>

            {/* K. N. Sharma Mentor Card */}
            <div className="bg-[#FFF8EF] p-4 sm:p-5 rounded-2xl border border-[#E9B44C]/35 shadow-card text-left flex items-center gap-3 sm:gap-4">
              <img
                src="/images/avatars/kn_sharma.jpg"
                alt="K. N. Sharma"
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-secondary object-cover object-top shadow-sm flex-shrink-0 ring-2 ring-secondary/20 bg-white"
              />
              <div className="min-w-0">
                <h4 className="font-extrabold text-sm sm:text-base text-[#382719] font-hindi-heading truncate">
                  {t.about.advisorName}
                </h4>
                <p className="text-xs font-bold text-primary truncate">
                  {t.about.advisorRole}
                </p>
                <p className="text-[10px] sm:text-[11px] text-[#454545] mt-0.5 sm:mt-1 font-medium leading-normal line-clamp-2">
                  {lang === 'hi' 
                    ? '12 सनातनी पारिवारिक नियमों एवं सामाजिक सुधार के वरिष्ठ मार्गदर्शक।' 
                    : 'Senior institutional ideologue steering the 12 social reform guidelines.'}
                </p>
              </div>
            </div>

            {/* National President Card */}
            <div className="bg-[#FFF8EF] p-3.5 sm:p-4 rounded-2xl border border-[#E9B44C]/35 shadow-card text-left flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-[#E9B44C]/70 bg-white text-primary flex items-center justify-center shadow-sm flex-shrink-0 ring-2 ring-[#E9B44C]/25">
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold text-secondary uppercase tracking-wider block">
                    {lang === 'hi' ? 'राष्ट्रीय अध्यक्ष/न्यासी' : 'National President / Trustee'}
                  </span>
                  <span className="font-black text-sm sm:text-base text-[#382719] font-hindi-heading truncate block">
                    {t.about.presidentName}
                  </span>
                </div>
              </div>
              <a
                href="tel:9336378327"
                className="text-center text-xs font-mono font-black text-primary hover:text-white bg-white hover:bg-primary px-3 py-2 sm:py-1.5 rounded-full border border-[#E9B44C]/40 shadow-sm transition-colors flex-shrink-0"
              >
                मो. 9336378327
              </a>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
