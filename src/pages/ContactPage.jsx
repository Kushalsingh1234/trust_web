import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { usePageMeta } from '../hooks/usePageMeta';
import PageHeader from '../components/PageHeader';
import Contact from '../sections/Contact';

export const ContactPage = () => {
  const { lang, t } = useLanguage();

  usePageMeta(
    lang === 'hi' ? 'सम्पर्क एवं कार्यालय विवरण • गोरखपुर' : 'Contact Us & Trust Offices • Gorakhpur',
    lang === 'hi'
      ? 'राष्ट्रीय सनातन संस्कार सेवा संस्थान के प्रधान कार्यालय एवं सम्पर्क कार्यालय का पता, फोन नम्बर एवं ऑनलाइन संदेश प्रपत्र।'
      : 'Get in touch with Rashtriya Sanatan Sanskar Seva Sansthan. Head office, contact office in Gorakhpur, phone numbers and direct message.'
  );

  return (
    <div className="flex flex-col">
      <PageHeader
        badge={lang === 'hi' ? 'सम्पर्क सूत्र' : 'Get In Touch'}
        title={lang === 'hi' ? 'कार्यालय पता एवं सम्पर्क सूत्र' : 'Our Offices & Direct Contact'}
        subtitle={lang === 'hi'
          ? 'गोरखपुर स्थित हमारे कार्यालयों में पधारें अथवा किसी भी प्रश्न, सहायता व सुझाव हेतु सीधे सम्पर्क करें।'
          : 'Visit our offices in Gorakhpur or reach out directly for inquiries, volunteer work, or assistance.'}
        breadcrumb={lang === 'hi' ? 'सम्पर्क' : 'Contact'}
      />

      {/* Full Contact Section */}
      <Contact />
    </div>
  );
};

export default ContactPage;
