import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { usePageMeta } from '../hooks/usePageMeta';
import PageHeader from '../components/PageHeader';
import NewsEvents from '../sections/NewsEvents';
import { Megaphone, Calendar } from 'lucide-react';

export const EventsPage = () => {
  const { lang, t } = useLanguage();

  usePageMeta(
    lang === 'hi' ? 'समाचार एवं कार्यक्रम • गतिविधियां' : 'News & Events • Trust Updates',
    lang === 'hi'
      ? 'राष्ट्रीय सनातन संस्कार सेवा संस्थान के आगामी व विगत कार्यक्रम, श्रमिक जागरूकता शिविर, बैठकें एवं महत्वपूर्ण सूचनाएं।'
      : 'Stay updated with ground action, labor welfare camps, community meetings, and official announcements.'
  );

  return (
    <div className="flex flex-col">
      <PageHeader
        badge={lang === 'hi' ? 'जमीनी गतिविधियां' : 'Field Activities'}
        title={lang === 'hi' ? 'समाचार, सूचनाएं एवं आगामी कार्यक्रम' : 'News, Announcements & Field Events'}
        subtitle={lang === 'hi'
          ? 'गोरखपुर एवं पूर्वांचल में आयोजित शिविरों, बैठकों एवं ट्रस्ट के आधिकारिक संदेशों की अद्यतन जानकारी।'
          : 'Latest updates on ground camps, community meetings, and official trust declarations.'}
        breadcrumb={lang === 'hi' ? 'कार्यक्रम / सूचनाएं' : 'Events'}
      />

      {/* Full News & Events Section */}
      <NewsEvents />
    </div>
  );
};

export default EventsPage;
