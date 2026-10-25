import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { usePageMeta } from '../hooks/usePageMeta';
import PageHeader from '../components/PageHeader';
import Contact from '../sections/Contact';

export const ContactPage = () => {
  const { lang, t } = useLanguage();

  usePageMeta(
    lang === 'hi' ? 'सम्पर्क एवं केंद्रीय कार्यालय • सनातन धर्म न्यास' : 'Contact Us & National Headquarters • Sanatan Dharma Trust',
    lang === 'hi'
      ? 'राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट) के केंद्रीय पंजीकृत कार्यालय, आधिकारिक सम्पर्क सूत्र, हेल्पलाइन एवं ऑनलाइन सन्देश केंद्र।'
      : 'Connect with Rashtriya Sanatan Sanskar Seva Sansthan (Trust). National headquarters, contact numbers, email, and direct public assistance.'
  );

  return (
    <div className="flex flex-col">
      <PageHeader
        badge={lang === 'hi' ? 'सम्पर्क एवं मार्गदर्शन' : 'National Headquarters & Contact'}
        title={lang === 'hi' ? 'कार्यालय पता एवं सम्पर्क सूत्र' : 'Our Offices & Direct Contact'}
        subtitle={lang === 'hi'
          ? 'हमारे पंजीकृत केंद्रीय कार्यालय से सम्पर्क करें अथवा किसी भी प्रश्न, वैदिक संस्कार मार्गदर्शन व सहायता हेतु सीधे सन्देश भेजें।'
          : 'Reach out to our registered headquarters or connect directly for 16 Vedic Sanskars guidance, membership, and assistance.'}
        breadcrumb={lang === 'hi' ? 'सम्पर्क' : 'Contact'}
      />

      {/* Full Contact Section */}
      <Contact />
    </div>
  );
};

export default ContactPage;
