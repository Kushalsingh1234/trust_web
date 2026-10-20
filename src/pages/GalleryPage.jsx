import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { usePageMeta } from '../hooks/usePageMeta';
import PageHeader from '../components/PageHeader';
import Gallery from '../sections/Gallery';

export const GalleryPage = ({ onSelectImage }) => {
  const { lang, t } = useLanguage();

  usePageMeta(
    lang === 'hi' ? 'चित्र दीर्घा • जमीनी कार्यक्रमों की झलकियां' : 'Photo Gallery • Field Action',
    lang === 'hi'
      ? 'श्रमिक जागरूकता शिविर, आजाद चौक जनसभा, कार्यालय बोर्ड, आधिकारिक पत्र एवं रसीद प्रपत्रों का चित्र संग्रह।'
      : 'Explore authentic photos of ground camps, labor rallies, office boards, and public service documents.'
  );

  return (
    <div className="flex flex-col">
      <PageHeader
        badge={lang === 'hi' ? 'सचित्र प्रमाण' : 'Visual Documentation'}
        title={lang === 'hi' ? 'चित्र दीर्घा: जमीनी कार्य एवं प्रामाणिक प्रपत्र' : 'Photo Gallery: Field Work & Official Records'}
        subtitle={lang === 'hi'
          ? 'आजाद चौक गोरखपुर में आयोजित शिविर, जनसंवाद, कार्यालय एवं प्रशासनिक पत्रों की विस्तृत चित्र दीर्घा।'
          : 'Authentic photos from Gorakhpur ground rallies, office premises, and legal correspondence.'}
        breadcrumb={lang === 'hi' ? 'चित्र दीर्घा' : 'Gallery'}
      />

      {/* Full Gallery Section with Filters */}
      <Gallery onSelectImage={onSelectImage} />
    </div>
  );
};

export default GalleryPage;
