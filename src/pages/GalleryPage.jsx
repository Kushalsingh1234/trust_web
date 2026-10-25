import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { usePageMeta } from '../hooks/usePageMeta';
import PageHeader from '../components/PageHeader';
import Gallery from '../sections/Gallery';

export const GalleryPage = ({ onSelectImage }) => {
  const { lang, t } = useLanguage();

  usePageMeta(
    lang === 'hi' ? 'चित्र दीर्घा • सनातन सेवा एवं कार्यक्रमों की झलकियां' : 'Photo Gallery • Sanatan Dharma & Field Action',
    lang === 'hi'
      ? 'सनातन धर्म जागरण, 16 वैदिक संस्कार शिविर, श्रमिक जागरूकता सभाएं, ट्रस्ट कार्यालय एवं आधिकारिक अभिलेखों की चित्र दीर्घा।'
      : 'Explore authentic photos of Sanatan Dharma rallies, 16 Vedic Sanskars initiatives, labor welfare camps, and official documents.'
  );

  return (
    <div className="flex flex-col">
      <PageHeader
        badge={lang === 'hi' ? 'सचित्र प्रमाण' : 'Visual Documentation'}
        title={lang === 'hi' ? 'चित्र दीर्घा: जमीनी कार्य एवं प्रामाणिक प्रपत्र' : 'Photo Gallery: Field Work & Official Records'}
        subtitle={lang === 'hi'
          ? 'सनातन धर्म जागरण, वैदिक संस्कार शिविर, जनसंवाद, कार्यालय एवं प्रशासनिक पत्रों की विस्तृत चित्र दीर्घा।'
          : 'Authentic photos from Sanatan Dharma awareness rallies, Vedic sanskar camps, executive meetings, and community initiatives.'}
        breadcrumb={lang === 'hi' ? 'चित्र दीर्घा' : 'Gallery'}
      />

      {/* Full Gallery Section with Filters */}
      <Gallery onSelectImage={onSelectImage} />
    </div>
  );
};

export default GalleryPage;
