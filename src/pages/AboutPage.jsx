import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { usePageMeta } from '../hooks/usePageMeta';
import PageHeader from '../components/PageHeader';
import About from '../sections/About';
import Objectives from '../sections/Objectives';
import VisionSocialReformation from '../sections/VisionSocialReformation';
import Trustees from '../sections/Trustees';
import Sanskars from '../sections/Sanskars';
import Guidelines from '../sections/Guidelines';
import { Heart, UserPlus, Target, BookOpen, Sparkles, Users, Compass, Eye } from 'lucide-react';

export const AboutPage = ({ onOpenJoinModal }) => {
  const { lang, t } = useLanguage();
  const location = useLocation();

  usePageMeta(
    lang === 'hi' ? 'हमारे विषय में • सनातन धर्म न्यास, उद्देश्य व संकल्प' : 'About Us • National Hindu Sanatan Dharma Trust & Vision',
    lang === 'hi'
      ? 'राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट) का परिचय, 16 पावन उद्देश्य, प्रबंधकारिणी समिति, 16 वैदिक संस्कार एवं पारिवारिक द्वादश सूत्र।'
      : 'Learn about Rashtriya Sanatan Sanskar Seva Sansthan (Trust), our 16 core objectives, executive trustees, 16 Vedic Sanskars mission, and 12 family guidelines.'
  );

  // Smooth scroll to anchor hash on load or hash change
  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  }, [location.hash]);

  const jumpNav = [
    { href: '#about', label: lang === 'hi' ? 'संस्थान परिचय' : 'About Us', icon: Compass },
    { href: '#objectives', label: lang === 'hi' ? 'हमारा उद्देश्य (16 सूत्र)' : 'Our Objectives (16)', icon: Target, highlight: true },
    { href: '#social-vision', label: lang === 'hi' ? 'सामाजिक पुनर्जागरण' : 'Social Vision', icon: Eye },
    { href: '#trustees', label: lang === 'hi' ? 'मार्गदर्शक व न्यासी' : 'Executive Trustees', icon: Users },
    { href: '#sanskars', label: lang === 'hi' ? '16 वैदिक संस्कार' : '16 Vedic Sanskars', icon: Sparkles },
    { href: '#guidelines', label: lang === 'hi' ? 'हमारा आग्रह (12 नियम)' : 'Our Guidelines (12)', icon: BookOpen }
  ];

  return (
    <div className="flex flex-col">
      {/* Page Header */}
      <PageHeader
        badge={lang === 'hi' ? 'सनातन धर्म न्यास परिचय' : 'National Trust Heritage & Vision'}
        title={lang === 'hi' ? 'हमारे विषय में: संकल्प, नेतृत्व एवं वैदिक संस्कार' : 'About Us: Mission, Leadership & Vedic Rites'}
        subtitle={lang === 'hi' 
          ? 'राष्ट्र हित, सनातन हित और परिवार हित को समर्पित भारत का अग्रणी सनातन धर्म व वैदिक संस्कार न्यास।'
          : 'A premier national Hindu Sanatan Dharma and Vedic Sanskar trust dedicated to cultural revival, nation building, and family harmony.'}
        breadcrumb={lang === 'hi' ? 'परिचय' : 'About'}
      />

      {/* Quick Jump Bar for Pillars */}
      <div className="sticky top-14 sm:top-16 z-30 bg-[#FFF8EF]/95 backdrop-blur-md border-b border-[#E9B44C]/30 py-2.5 px-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-start sm:justify-center gap-2 overflow-x-auto no-scrollbar">
          {jumpNav.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  item.highlight
                    ? 'bg-primary text-white shadow-saffron hover:bg-secondary'
                    : 'bg-white hover:bg-[#FFF8EF] text-[#382719] border border-[#E9B44C]/40 hover:border-primary'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${item.highlight ? 'text-white' : 'text-primary'}`} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </div>
      </div>

      {/* 1. Full Story, Vision & Mission Overview */}
      <About />

      {/* 2. 16 Core Objectives (हमारा उद्देश्य) from Official Leaflet */}
      <Objectives onOpenJoinModal={onOpenJoinModal} />

      {/* 3. Detailed Vision: Social Reformation & Cultural Revival */}
      <VisionSocialReformation />

      {/* 4. Executive Council & Trustees */}
      <Trustees />

      {/* 5. 16 Vedic Sanskars Facilitation */}
      <Sanskars />

      {/* 6. 12 Family Guidelines (हमारा आग्रह) */}
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
