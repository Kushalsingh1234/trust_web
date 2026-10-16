import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Heart, UserPlus, Users, Share2, ArrowRight } from 'lucide-react';

export const HowYouCanHelp = ({ onOpenReceiptModal, onOpenJoinModal, onOpenVolunteerModal }) => {
  const { lang, t } = useLanguage();

  const handleShare = () => {
    const text = lang === 'hi'
      ? 'राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट) - 16 संस्कारों का जागरण एवं जनकल्याण। अधिक जानकारी एवं सहयोग हेतु देखें: '
      : 'Rashtriya Sanatan Sanskar Seva Sansthan (Trust) - Preserving 16 Vedic Sanskars & Laborer Welfare: ';
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: 'RSSSST Trust', text, url }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + url)}`, '_blank');
    }
  };

  return (
    <section id="how-to-help" className="py-16 lg:py-24 bg-white relative border-b border-[#E9B44C]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-secondary bg-[#FFF8EF] border border-[#E9B44C]/60 px-4 py-1 rounded-full shadow-sm">
            {t.howToHelp.tag}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#382719] mt-3.5 font-hindi-heading">
            {t.howToHelp.title}
          </h2>
          <p className="text-sm sm:text-base text-[#454545] mt-3 leading-relaxed font-medium">
            {t.howToHelp.subtitle}
          </p>
          <div className="w-20 h-1.5 bg-gradient-to-r from-primary via-accent to-secondary mx-auto mt-4 rounded-full"></div>
        </div>

        {/* 4 Helping Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* 1. Samarpan Nidhi */}
          <div className="bg-[#FFF8EF] rounded-3xl p-6 border border-[#E9B44C]/35 flex flex-col justify-between shadow-card hover:shadow-card-hover transition-all duration-300 text-left hover:-translate-y-1">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white text-primary flex items-center justify-center mb-4 border border-[#E9B44C]/30 shadow-sm">
                <Heart className="w-6 h-6 fill-primary text-primary" />
              </div>
              <h3 className="font-black text-[#382719] text-lg mb-2 font-hindi-heading">
                {t.howToHelp.cards[0].title}
              </h3>
              <p className="text-xs sm:text-sm text-[#454545] leading-relaxed font-normal">
                {t.howToHelp.cards[0].desc}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#E9B44C]/25">
              <a
                href="#donate"
                className="inline-flex items-center gap-1.5 text-xs font-black text-secondary hover:text-primary transition-colors"
              >
                <span>{t.howToHelp.cards[0].action}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* 2. Membership */}
          <div className="bg-[#FFF8EF] rounded-3xl p-6 border-2 border-primary/50 flex flex-col justify-between shadow-card hover:shadow-card-hover transition-all duration-300 text-left relative overflow-hidden hover:-translate-y-1">
            <div className="absolute top-3 right-3 bg-primary text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shadow-sm">
              ₹200/yr
            </div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white text-secondary flex items-center justify-center mb-4 border border-primary/30 shadow-sm">
                <UserPlus className="w-6 h-6" />
              </div>
              <h3 className="font-black text-[#382719] text-lg mb-2 font-hindi-heading">
                {t.howToHelp.cards[1].title}
              </h3>
              <p className="text-xs sm:text-sm text-[#454545] leading-relaxed font-normal">
                {t.howToHelp.cards[1].desc}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#E9B44C]/25">
              <button
                type="button"
                onClick={onOpenJoinModal}
                className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:text-secondary transition-colors"
              >
                <span>{t.howToHelp.cards[1].action}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3. Volunteer */}
          <div className="bg-[#FFF8EF] rounded-3xl p-6 border border-[#E9B44C]/35 flex flex-col justify-between shadow-card hover:shadow-card-hover transition-all duration-300 text-left hover:-translate-y-1">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white text-primary flex items-center justify-center mb-4 border border-[#E9B44C]/30 shadow-sm">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-black text-[#382719] text-lg mb-2 font-hindi-heading">
                {t.howToHelp.cards[2].title}
              </h3>
              <p className="text-xs sm:text-sm text-[#454545] leading-relaxed font-normal">
                {t.howToHelp.cards[2].desc}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#E9B44C]/25">
              <button
                type="button"
                onClick={onOpenVolunteerModal}
                className="inline-flex items-center gap-1.5 text-xs font-black text-secondary hover:text-primary transition-colors"
              >
                <span>{t.howToHelp.cards[2].action}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 4. Spread the Word */}
          <div className="bg-[#FFF8EF] rounded-3xl p-6 border border-[#E9B44C]/35 flex flex-col justify-between shadow-card hover:shadow-card-hover transition-all duration-300 text-left hover:-translate-y-1">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white text-trust-green flex items-center justify-center mb-4 border border-green-200 shadow-sm">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="font-black text-[#382719] text-lg mb-2 font-hindi-heading">
                {t.howToHelp.cards[3].title}
              </h3>
              <p className="text-xs sm:text-sm text-[#454545] leading-relaxed font-normal">
                {t.howToHelp.cards[3].desc}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#E9B44C]/25">
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 text-xs font-black text-trust-green hover:text-green-800 transition-colors"
              >
                <span>{t.howToHelp.cards[3].action}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default HowYouCanHelp;
