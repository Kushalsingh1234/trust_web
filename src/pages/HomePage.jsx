import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { usePageMeta } from '../hooks/usePageMeta';
import Hero from '../sections/Hero';
import Impact from '../sections/Impact';
import { 
  ArrowRight, 
  Heart, 
  UserPlus, 
  Sparkles, 
  ShieldCheck, 
  Users, 
  BookOpen, 
  Image as ImageIcon 
} from 'lucide-react';

export const HomePage = ({
  onOpenReceiptModal,
  onOpenHelpModal,
  onOpenJoinModal,
  onSelectImage
}) => {
  const { lang, t } = useLanguage();
  const { currentUser, userProfile } = useAuth();
  const isMember = Boolean(userProfile?.isMember === true);

  usePageMeta(
    lang === 'hi' 
      ? 'सनातन धर्म न्यास • राष्ट्र हित, सनातन हित, परिवार हित' 
      : 'Premier Hindu Sanatan Dharma & Vedic Sanskar Trust',
    lang === 'hi' 
      ? 'राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट)। 16 वैदिक षोडश संस्कार, सनातन धर्म ग्रंथ अध्ययन, गौ सेवा एवं सामाजिक समरसता हेतु समर्पित अखिल भारतीय न्यास।'
      : 'Rashtriya Sanatan Sanskar Seva Sansthan (Trust) - A premier national Hindu Sanatan Dharma Trust dedicated to 16 Vedic Sanskars, scriptural wisdom, Gau Seva, and grassroots social upliftment.'
  );

  // 3 Featured Programs for Lean Landing Page
  const featuredPrograms = [
    {
      id: 'labor',
      icon: Users,
      title: lang === 'hi' ? 'श्रमिक कल्याण एवं जागरूकता अभियान' : 'Labor Welfare & Awareness Campaign',
      desc: lang === 'hi' 
        ? 'भवन निर्माण, असंगठित श्रमिकों को शासन की कल्याणकारी योजनाओं (PM-SYM, ई-श्रम, छात्रवृत्ति) से जोड़ना एवं जागरूकता शिविर।'
        : 'Connecting unorganized and construction workers with welfare schemes (PM-SYM, e-Shram) and labor awareness camps.',
      tag: lang === 'hi' ? 'जमीनी सेवा' : 'Field Work',
      link: '/programs'
    },
    {
      id: 'sanskars',
      icon: Sparkles,
      title: lang === 'hi' ? '१६ षोडश संस्कार सुलभ विधान' : '16 Vedic Sanskars Facilitation',
      desc: lang === 'hi' 
        ? 'गर्भाधान से अंत्येष्टि तक के समस्त सनातन 16 संस्कारों को प्रत्येक सनातनी परिवार हेतु शास्त्रसम्मत, सुलभ व पवित्र रूप से संपन्न कराना।'
        : 'Facilitating all 16 Vedic life rites from birth to elder ceremonies authentically for every Sanatan household.',
      tag: lang === 'hi' ? 'वैदिक धरोहर' : 'Vedic Heritage',
      link: '/programs'
    },
    {
      id: 'cow-culture',
      icon: BookOpen,
      title: lang === 'hi' ? 'गौ सेवा, योग एवं सनातन स्वाध्याय' : 'Cow Protection, Yoga & Study',
      desc: lang === 'hi' 
        ? 'सनातन धर्म ग्रंथों का अध्ययन-अध्यापन, योग प्रशिक्षण, गौ सेवा एवं भारतीय जीवन मूल्यों का पुनर्जागरण।'
        : 'Teaching sacred scriptures, yoga instruction, cow protection, and cultural spiritual awakening.',
      tag: lang === 'hi' ? 'सांस्कृतिक जागरण' : 'Cultural Revival',
      link: '/programs'
    }
  ];

  // 6 Featured Gallery Photos for Lean Preview
  const previewGallery = [
    {
      src: '/images/gallery/kanya_pujan_navratri_1.jpg',
      title: lang === 'hi' ? 'कन्या पूजन एवं महाप्रसाद • नवरात्रि' : 'Kanya Pujan & Feast • Navratri',
      caption: lang === 'hi'
        ? 'नवरात्रि के अवसर पर ट्रस्ट द्वारा कन्या पूजन एवं भोजन कार्यक्रम दिनांक 19 अक्टूबर 2026 — समस्त कन्याओं का वैदिक पूजन, वंदन एवं सात्विक महाप्रसाद वितरण।'
        : 'Kanya Pujan and Feast program organized by the Trust on the sacred occasion of Navratri on 19 October 2026 — Vedic worship, blessing rituals, and serving traditional festive feast to young girls.',
      cat: lang === 'hi' ? 'कन्या पूजन' : 'Kanya Pujan'
    },
    {
      src: '/images/gallery/munjeshwar_rudrabhishek_puja.jpg',
      title: lang === 'hi' ? 'रुद्राभिषेक पूजन • बाबा मुंजेश्वर नाथ' : 'Rudrabhishek Puja • Baba Munjeshwar Nath',
      caption: lang === 'hi'
        ? 'ट्रस्ट द्वारा बाबा मुंजेश्वर नाथ शिव मंदिर भौवापार सेवई बाजार गोरखपुर में रुद्राभिषेक एवं भंडारा का आयोजन दिनांक 18 अगस्त 2026 — राष्ट्रीय मंत्री/प्रबन्धक बजरंगी दूबे वैदिक विधान से रक्षा सूत्र व संकल्प पूजन कराते हुए।'
        : 'Rudrabhishek and Bhandara organized by the Trust at Baba Munjeshwar Nath Shiv Temple, Bhowapar, Sewai Bazar, Gorakhpur on 18 August 2026 — Rashtriya Mantri / Prabandhak Bajrangi Dubey performing sacred Vedic rituals.',
      cat: lang === 'hi' ? 'धार्मिक अनुष्ठान' : 'Vedic Ritual'
    },
    {
      src: '/images/gallery/trust_objectives.jpg',
      title: lang === 'hi' ? 'हमारा उद्देश्य • 16 प्रमुख संकल्प एवं लक्ष्य' : 'Our Mission • 16 Core Objectives Charter',
      caption: lang === 'hi'
        ? 'सनातन धर्म के 16 संस्कार, राष्ट्र हित, स्वावलंबन, शिक्षा-स्वास्थ्य एवं कमजोर सनातनियों के सहयोग हेतु 16 मुख्य उद्देश्यों का मूल पत्रक।'
        : 'Official charter documenting 16 institutional goals: Sanatan revival, 16 Sanskars, education, healthcare, and economic self-reliance.',
      cat: lang === 'hi' ? 'उद्देश्य पत्रक' : 'Charter'
    },
    {
      src: '/images/gallery/trust_manifesto_advisor.jpg',
      title: lang === 'hi' ? 'हमारा आग्रह • 12 सामाजिक एवं पारिवारिक नियम' : 'Our Appeal • 12 Social Resolutions Charter',
      caption: lang === 'hi'
        ? 'राष्ट्रीय सलाहकार के. एन. शर्मा एवं राष्ट्रीय मंत्री/प्रबन्धक बजरंगी दूबे के सानिध्य में जारी 12 सामाजिक आचरण, दिखावे से बचाव व संगठन का मूल संकल्प पत्रक।'
        : 'Official publication presenting Rashtriya Salahkar K. N. Sharma, Rashtriya Mantri / Prabandhak Bajrangi Dubey, and the 12 social reform & family guidelines.',
      cat: lang === 'hi' ? 'आग्रह पत्रक' : 'Manifesto'
    },
    {
      src: '/images/gallery/shramik_camp_collage.jpg',
      title: lang === 'hi' ? 'श्रमिक जागरूकता शिविर • आजाद चौक' : 'Labor Awareness Camp, Azad Chowk',
      caption: lang === 'hi'
        ? 'राष्ट्रीय मंत्री/प्रबन्धक बजरंगी दूबे चंद्रशेखर आजाद चौक गोरखपुर पर निर्माण श्रमिकों को ई-श्रम व कल्याणकारी योजनाओं की जानकारी देते हुए।'
        : 'Rashtriya Mantri / Prabandhak Bajrangi Dubey addressing unorganized labor on government welfare schemes in Gorakhpur.',
      cat: lang === 'hi' ? 'अभियान' : 'Campaign'
    },
    {
      src: '/images/gallery/receipt_samarpan_nidhi.jpg',
      title: lang === 'hi' ? 'पारदर्शी बैंक अधिकृत समर्पण रसीद' : 'Bank of India Verified Receipt',
      caption: lang === 'hi'
        ? 'बैंक ऑफ़ इण्डिया खाता संख्या व भारत के मानचित्र के साथ आधिकारिक समर्पण निधि (दान) रसीद प्रारूप।'
        : 'Official Bank of India account receipt form with watermark India map and manager endorsement.',
      cat: lang === 'hi' ? 'पारदर्शिता' : 'Transparency'
    }
  ];

  return (
    <div className="flex flex-col">
      {/* 1. Hero Section (Includes the big freestanding logo and top CTAs) */}
      <div className="pt-14 sm:pt-20 bg-hero-ivory bg-mandala-subtle relative">
        <Hero
          onOpenReceiptModal={onOpenReceiptModal}
          onOpenHelpModal={onOpenHelpModal}
          onOpenJoinModal={onOpenJoinModal}
        />
      </div>

      {/* 2. Lean "About Us" Teaser (2-3 lines max with Read More link) */}
      <section className="py-12 sm:py-16 bg-white border-b border-[#E9B44C]/30 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-secondary bg-[#FFF8EF] border border-[#E9B44C]/60 mb-3 shadow-xs">
            {lang === 'hi' ? 'हमारा परिचय एवं संकल्प' : 'Who We Are'}
          </span>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#382719] font-hindi-heading tracking-tight leading-tight max-w-3xl mx-auto">
            {lang === 'hi'
              ? 'राष्ट्र हित, सनातन हित और परिवार हित को समर्पित पंजीकृत लोक धर्मार्थ न्यास'
              : 'Dedicated to National Welfare, Sanatan Values, and Family Upliftment'}
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#454545] leading-relaxed max-w-2xl mx-auto">
            {lang === 'hi'
              ? 'राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट) सनातन धर्म, राष्ट्र निर्माण एवं मानव कल्याण को समर्पित एक प्रतिष्ठित पंजीकृत न्यास है। हमारा पावन संकल्प सनातन धर्म के १६ संस्कारों को प्रत्येक सनातनी परिवार हेतु सुलभ कराना, वैदिक ग्रंथों का प्रचार-प्रसार और असंगठित समाज को सशक्त बनाना है।'
              : 'Rashtriya Sanatan Sanskar Seva Sansthan (Trust) is a premier registered Hindu Sanatan Dharma Trust dedicated to facilitating the sacred 16 Vedic life rites, advancing scriptural wisdom, and uplifting grassroots communities across India.'}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/about"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary hover:bg-secondary text-white font-bold text-xs sm:text-sm shadow-saffron transition-all transform hover:-translate-y-0.5 active:scale-95"
            >
              <span>{lang === 'hi' ? 'विस्तार से जानें (Read More)' : 'Read Full Story'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/transparency"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#FFF8EF] hover:bg-white text-[#382719] font-bold text-xs sm:text-sm border border-[#E9B44C]/50 shadow-xs transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>{lang === 'hi' ? 'ट्रस्ट पंजीकरण एवं प्रमाणन' : 'Trust Registration'}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Impact Numbers Strip (4 Stats Max) */}
      <Impact />

      {/* 4. Featured Programs (3 Cards linking to /programs) */}
      <section className="py-12 sm:py-16 bg-[#FFFDF9] border-b border-[#E9B44C]/30 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto mb-8 sm:mb-10">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-secondary bg-white border border-[#E9B44C]/60 mb-2 shadow-xs">
              {lang === 'hi' ? 'प्रमुख सेवा प्रकल्प' : 'Featured Causes'}
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#382719] font-hindi-heading tracking-tight">
              {lang === 'hi' ? 'समाज एवं सनातन धर्म हेतु हमारे मुख्य कार्य' : 'Core Initiatives for Sanatan & Society'}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#666666]">
              {lang === 'hi' 
                ? 'जमीनी स्तर पर श्रमिकों की सहायता और सनातन वैदिक संस्कारों का संरक्षण।'
                : 'Direct on-ground labor support and Vedic cultural preservation.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {featuredPrograms.map((prog) => {
              const IconComp = prog.icon;
              return (
                <div
                  key={prog.id}
                  className="bg-white rounded-2xl p-6 border border-[#E9B44C]/35 shadow-card hover:shadow-xl hover:border-primary transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                        <IconComp className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FFF8EF] border border-[#E9B44C]/40 text-secondary">
                        {prog.tag}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-[#382719] font-hindi-heading group-hover:text-primary transition-colors leading-snug mb-2">
                      {prog.title}
                    </h3>
                    <p className="text-xs text-[#555555] leading-relaxed">
                      {prog.desc}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                    <Link
                      to={prog.link}
                      className="font-bold text-primary group-hover:text-secondary flex items-center gap-1 transition-colors"
                    >
                      <span>{lang === 'hi' ? 'विवरण देखें' : 'Learn More'}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8">
            <Link
              to="/programs"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-[#FFF8EF] text-[#382719] hover:text-primary font-bold text-xs sm:text-sm border-2 border-[#E9B44C] shadow-sm transition-all"
            >
              <span>{lang === 'hi' ? 'सभी सेवा प्रकल्प एवं योजनाएं देखें →' : 'Explore All Programs & Pillars →'}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Featured Gallery Preview (6 Photos linking to /gallery) */}
      <section className="py-12 sm:py-16 bg-white border-b border-[#E9B44C]/30 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto mb-8 sm:mb-10">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-secondary bg-[#FFF8EF] border border-[#E9B44C]/60 mb-2 shadow-xs">
              {lang === 'hi' ? 'जमीनी झलक एवं मूल संकल्प' : 'Visual Highlights & Charters'}
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#382719] font-hindi-heading tracking-tight">
              {lang === 'hi' ? 'चित्र दीर्घा: सेवा, संकल्प व जागरूकता शिविर' : 'Field Work, Charters & Camp Showcase'}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#555555]">
              {lang === 'hi'
                ? 'ट्रस्ट के आधिकारिक संकल्प पत्रक, उद्देश्य, सेवा शिविर एवं प्रामाणिक प्रपत्रों की झलक।'
                : 'A curated glimpse of official trust manifestos, field camps, and verified records.'}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
            {previewGallery.map((item, idx) => {
              const webpSrc = item.src.replace(/\.(jpg|png)$/, '.webp');
              return (
                <div
                  key={idx}
                  onClick={() => onSelectImage && onSelectImage(item, idx, previewGallery)}
                  className="group relative rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-[#E9B44C]/35 aspect-[4/3] bg-[#FFF8EF] cursor-pointer transition-all duration-300 hover:-translate-y-1"
                >
                  <picture>
                    <source srcSet={webpSrc} type="image/webp" />
                    <img
                      src={item.src}
                      alt={item.title}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = item.src;
                      }}
                    />
                  </picture>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-90 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5 sm:p-4 text-left">
                    <span className="text-[9px] sm:text-[10px] font-black text-secondary uppercase tracking-wider mb-0.5 sm:mb-1">
                      {item.cat}
                    </span>
                    <p className="text-[11px] sm:text-sm font-bold text-white line-clamp-1 group-hover:text-amber-200 transition-colors">
                      {item.title}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8">
            <Link
              to="/gallery"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#FFF8EF] hover:bg-white text-[#382719] hover:text-primary font-bold text-xs sm:text-sm border border-[#E9B44C]/60 shadow-xs transition-all"
            >
              <ImageIcon className="w-4 h-4 text-primary" />
              <span>{lang === 'hi' ? 'पूरी चित्र दीर्घा देखें (View Full Gallery) →' : 'View Complete Gallery →'}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Final High-Impact CTA Banner for Donating / Joining */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-[#FFF5E6] via-[#FFF8EF] to-[#FFE9CC] border-b border-[#E9B44C]/30 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider text-secondary bg-white border border-[#E9B44C]/60 mb-3 shadow-xs">
            {lang === 'hi' ? 'सेवा व समर्पण का अवसर' : 'Join Hands in Service'}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#382719] font-hindi-heading tracking-tight leading-tight max-w-3xl mx-auto">
            {lang === 'hi'
              ? 'सनातन धर्म, वैदिक संस्कारों व समाज कल्याण हेतु अपना योगदान दें'
              : 'Contribute to Sanatan Dharma, Vedic Heritage & Social Welfare'}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#454545] max-w-2xl mx-auto leading-relaxed">
            {lang === 'hi'
              ? 'चाहे ₹200 वार्षिक सदस्यता हो या बैंक ऑफ इंडिया खाते में समर्पण निधि — आपका प्रत्येक सहयोग प्रत्यक्ष रूप से सनातन समाज को सशक्त बनाता है।'
              : 'Whether an annual membership of ₹200 or direct trust account donation — every contribution directly strengthens Sanatan community service.'}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/donate"
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 rounded-full bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white font-black text-sm sm:text-base shadow-saffron transition-all transform hover:-translate-y-0.5 active:scale-95"
            >
              <Heart className="w-4 h-4 fill-white text-white flex-shrink-0" />
              <span>{lang === 'hi' ? 'समर्पण निधि / दान करें' : 'Donate Now'}</span>
            </Link>

            {isMember ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 rounded-full bg-white hover:bg-emerald-50 text-emerald-800 hover:text-emerald-950 font-black text-sm sm:text-base border-2 border-emerald-500 shadow-sm transition-all transform hover:-translate-y-0.5 active:scale-95"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{lang === 'hi' ? 'सदस्यता सक्रिय (डैशबोर्ड देखें)' : 'Active Member (View Dashboard)'}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={onOpenJoinModal}
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 rounded-full bg-white hover:bg-[#FFF8EF] text-[#382719] hover:text-primary font-black text-sm sm:text-base border-2 border-[#E9B44C] shadow-sm transition-all transform hover:-translate-y-0.5 active:scale-95"
              >
                <UserPlus className="w-4 h-4 text-primary flex-shrink-0" />
                <span>{lang === 'hi' ? 'सदस्य बनें (₹200/वर्ष)' : 'Join Member (₹200/yr)'}</span>
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
