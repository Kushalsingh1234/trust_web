import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { usePageMeta } from '../hooks/usePageMeta';
import PageHeader from '../components/PageHeader';
import NewsEvents from '../sections/NewsEvents';
import { Megaphone, Calendar } from 'lucide-react';

export const EventsPage = () => {
  const { lang, t } = useLanguage();

  usePageMeta(
    lang === 'hi' ? 'समाचार, गतिविधियां व कार्यक्रम • सनातन धर्म न्यास' : 'News & Activities • Sanatan Dharma Trust Events',
    lang === 'hi'
      ? 'राष्ट्रीय सनातन संस्कार सेवा संस्थान के राष्ट्रव्यापी कार्यक्रम, 16 वैदिक संस्कार उत्सव, श्रमिक जागरूकता शिविर एवं आधिकारिक घोषणाएं।'
      : 'Stay updated with national Sanatan initiatives, Vedic Sanskar celebrations, labor welfare camps, and official trust declarations.'
  );

  return (
    <div className="flex flex-col">
      <PageHeader
        badge={lang === 'hi' ? 'जमीनी गतिविधियां' : 'Field Activities'}
        title={lang === 'hi' ? 'समाचार, सूचनाएं एवं आगामी कार्यक्रम' : 'News, Announcements & Field Events'}
        subtitle={lang === 'hi'
          ? 'ट्रस्ट द्वारा आयोजित राष्ट्रव्यापी कार्यक्रमों, वैदिक संस्कार आयोजनों, बैठकों एवं आधिकारिक संदेशों की अद्यतन जानकारी।'
          : 'Latest updates on national awareness camps, Vedic Sanskar initiatives, and official declarations.'}
        breadcrumb={lang === 'hi' ? 'कार्यक्रम / सूचनाएं' : 'Events'}
      />

      {/* Full News & Events Section */}
      <NewsEvents />
    </div>
  );
};

export default EventsPage;
