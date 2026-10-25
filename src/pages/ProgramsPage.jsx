import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { usePageMeta } from '../hooks/usePageMeta';
import PageHeader from '../components/PageHeader';
import Programs from '../sections/Programs';
import { HandHeart, Users, ArrowRight } from 'lucide-react';

export const ProgramsPage = ({ onOpenHelpModal, onOpenVolunteerModal }) => {
  const { lang, t } = useLanguage();

  usePageMeta(
    lang === 'hi' ? '१६ वैदिक संस्कार व सेवा प्रकल्प • सनातन धर्म न्यास' : '16 Vedic Sanskars & Welfare Programs • Sanatan Dharma Trust',
    lang === 'hi'
      ? '१६ वैदिक षोडश संस्कार (गर्भाधान से अंत्येष्टि), सनातन धर्म जागरण, गौ सेवा, वेद-गीता स्वाध्याय एवं असंगठित श्रमिक कल्याण प्रकल्प।'
      : 'Comprehensive facilitation of 16 Vedic Sanskars, sacred scriptural education, Gau Seva (cow care), and grassroots labor welfare across India.'
  );

  return (
    <div className="flex flex-col">
      <PageHeader
        badge={lang === 'hi' ? 'सेवा एवं सामाजिक कार्य' : 'Community & Social Work'}
        title={lang === 'hi' ? 'सेवा प्रकल्प, जनहित योजनाएं एवं शिविर' : 'Welfare Programs, Initiatives & Camps'}
        subtitle={lang === 'hi'
          ? 'असंगठित श्रमिकों के अधिकारों की रक्षा, वैदिक संस्कृति का पुनर्जागरण एवं लोक कल्याणकारी कार्य।'
          : 'Upholding rights for unorganized workers, rejuvenating Vedic heritage, and community empowerment.'}
        breadcrumb={lang === 'hi' ? 'प्रकल्प' : 'Programs'}
      />

      {/* Full Programs & Initiatives */}
      <Programs />

      {/* Dedicated Help & Volunteer Assistance Banner */}
      <section className="py-12 bg-white border-t border-[#E9B44C]/30 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-[#FFF8EF] rounded-2xl p-6 sm:p-8 border border-[#E9B44C]/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 text-left">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-secondary bg-white px-2.5 py-0.5 rounded-full border border-[#E9B44C]/40">
                {lang === 'hi' ? 'सहायता एवं सहभागिता' : 'Support & Participate'}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-[#382719] font-hindi-heading mt-1.5">
                {lang === 'hi' ? 'क्या आपको किसी सहायता की आवश्यकता है?' : 'Do You Need Assistance or Guidance?'}
              </h3>
              <p className="text-xs text-[#555555] mt-1 max-w-xl">
                {lang === 'hi'
                  ? 'श्रमिक योजनाओं, संस्कार विधान या विधिक मार्गदर्शन हेतु ट्रस्ट कार्यालय से निःशुल्क सहायता प्राप्त करें।'
                  : 'Get guidance on labor welfare schemes, sanskar facilitation, or community assistance directly.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={onOpenHelpModal}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
              >
                <HandHeart className="w-4 h-4" />
                <span>{lang === 'hi' ? 'सहायता मांगें' : 'Request Help'}</span>
              </button>

              <button
                type="button"
                onClick={onOpenVolunteerModal}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-white hover:bg-[#FFF8EF] text-[#382719] font-bold text-xs sm:text-sm border border-[#E9B44C] shadow-xs transition-all"
              >
                <Users className="w-4 h-4 text-primary" />
                <span>{lang === 'hi' ? 'स्वयंसेवक बनें' : 'Volunteer'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProgramsPage;
