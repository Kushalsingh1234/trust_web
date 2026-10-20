import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { usePageMeta } from '../hooks/usePageMeta';
import PageHeader from '../components/PageHeader';
import About from '../sections/About';
import Trustees from '../sections/Trustees';
import Sanskars from '../sections/Sanskars';
import Guidelines from '../sections/Guidelines';
import { Heart, UserPlus } from 'lucide-react';

export const AboutPage = ({ onOpenJoinModal }) => {
  const { lang, t } = useLanguage();

  usePageMeta(
    lang === 'hi' ? 'हमारे विषय में • परिचय, दृष्टि व नेतृत्व' : 'About Us • Vision & Leadership',
    lang === 'hi'
      ? 'राष्ट्रीय सनातन संस्कार सेवा संस्थान का परिचय, प्रबंधकारिणी समिति, ट्रस्टीगण, 16 वैदिक संस्कार एवं पारिवारिक द्वादश सूत्र।'
      : 'Learn about Rashtriya Sanatan Sanskar Seva Sansthan, executive trustees, 16 Vedic Sanskars, and guiding principles.'
  );

  return (
    <div className="flex flex-col">
      {/* Page Header */}
      <PageHeader
        badge={lang === 'hi' ? 'संस्था परिचय एवं दर्शन' : 'Trust Heritage & Vision'}
        title={lang === 'hi' ? 'हमारे विषय में: संकल्प, नेतृत्व एवं वैदिक संस्कार' : 'About Us: Mission, Leadership & Vedic Rites'}
        subtitle={lang === 'hi' 
          ? 'राष्ट्र हित, सनातन हित और परिवार हित को समर्पित गोरखपुर में पंजीकृत लोक धर्मार्थ न्यास।'
          : 'A registered public charitable trust in Gorakhpur dedicated to nation, culture, and family harmony.'}
        breadcrumb={lang === 'hi' ? 'परिचय' : 'About'}
      />

      {/* 1. Full Story, Vision & Mission */}
      <About />

      {/* 2. Executive Council & Trustees */}
      <Trustees />

      {/* 3. 16 Vedic Sanskars Facilitation */}
      <Sanskars />

      {/* 4. 12 Family Guidelines (हमारा आग्रह) */}
      <Guidelines />

      {/* Page Bottom CTA */}
      <section className="py-12 bg-[#FFF8EF] border-t border-[#E9B44C]/30 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h3 className="text-xl sm:text-2xl font-black text-[#382719] font-hindi-heading">
            {lang === 'hi' ? 'हमारे इस पावन अभियान से जुड़ें' : 'Join Our Sacred Mission'}
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-[#555555]">
            {lang === 'hi' 
              ? 'ट्रस्ट के सदस्य बनें या समर्पण निधि से जनकल्याणकारी कार्यों में सहयोग करें।'
              : 'Become a registered member or support our welfare initiatives with donation.'}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/donate"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary hover:bg-secondary text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>{lang === 'hi' ? 'समर्पण निधि दें' : 'Donate Now'}</span>
            </Link>
            <button
              type="button"
              onClick={onOpenJoinModal}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-[#FFF8EF] text-[#382719] font-bold text-xs sm:text-sm border border-[#E9B44C] shadow-xs transition-all"
            >
              <UserPlus className="w-4 h-4 text-primary" />
              <span>{lang === 'hi' ? 'सदस्यता आवेदन' : 'Apply for Membership'}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
