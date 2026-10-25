import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { usePageMeta } from '../hooks/usePageMeta';
import PageHeader from '../components/PageHeader';
import Donate from '../sections/Donate';

export const DonatePage = ({ onOpenReceiptModal, onOpenPaymentModal }) => {
  const { lang, t } = useLanguage();

  usePageMeta(
    lang === 'hi' ? 'समर्पण निधि एवं दान • आधिकारिक बैंक खाता व डिजिटल रसीद' : 'Donate & Samarpan Nidhi • Bank of India & Digital Receipt',
    lang === 'hi'
      ? 'राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट) के आधिकारिक बैंक ऑफ इंडिया खाते या UPI द्वारा सनातन धर्म प्रचार, गौ सेवा व संस्कार जागरण हेतु दान करें। डिजिटल रसीद प्राप्त करें।'
      : 'Support our national Sanatan Dharma mission, 16 Vedic Sanskars, and Gau Seva. Official Bank of India account transfer & instant digital trust receipts.'
  );

  return (
    <div className="flex flex-col">
      <PageHeader
        badge={lang === 'hi' ? 'पारदर्शी समर्पण निधि' : 'Official Trust Account'}
        title={lang === 'hi' ? 'समर्पण निधि, दान एवं बैंक विवरण' : 'Donate, Bank Details & Verification'}
        subtitle={lang === 'hi'
          ? 'बैंक ऑफ़ इण्डिया (Bank of India) में संस्था के अधिकृत खाते में प्रत्यक्ष सहयोग करें। १००% पारदर्शी लेखा-जोखा।'
          : 'Contribute directly to the verified Bank of India Trust account. Full accountability and digital receipt confirmation.'}
        breadcrumb={lang === 'hi' ? 'दान / समर्पण' : 'Donate'}
      />

      {/* Full Official Bank & Donate Details */}
      <Donate
        onOpenReceiptModal={onOpenReceiptModal}
        onOpenPaymentModal={onOpenPaymentModal}
      />
    </div>
  );
};

export default DonatePage;
