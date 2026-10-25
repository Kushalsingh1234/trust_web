import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { usePageMeta } from '../hooks/usePageMeta';
import PageHeader from '../components/PageHeader';
import Transparency from '../sections/Transparency';
import { FileText, ShieldCheck, Heart } from 'lucide-react';

export const TransparencyPage = ({ onOpenReceiptModal }) => {
  const { lang, t } = useLanguage();

  usePageMeta(
    lang === 'hi' ? 'पारदर्शिता, पंजीकरण एवं वैधानिक प्रमाणन • सनातन धर्म न्यास' : 'Transparency, Governance & Legal Registrations • Sanatan Dharma Trust',
    lang === 'hi'
      ? 'राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट) का वैधानिक पंजीकरण, 12A व 80G स्थिति, बैंक ऑफ इंडिया अधिकृत खाता एवं पारदर्शिता लेखा-परीक्षण।'
      : 'Review verified registration, 12A and 80G compliance status, Bank of India official account statements, and annual audit governance.'
  );

  return (
    <div className="flex flex-col">
      <PageHeader
        badge={lang === 'hi' ? 'संस्थागत सत्यनिष्ठा' : 'Institutional Integrity'}
        title={lang === 'hi' ? 'पारदर्शिता, पंजीकरण एवं वैधानिक प्रमाणन' : 'Transparency, Governance & Legal Certifications'}
        subtitle={lang === 'hi'
          ? 'भारतीय लोक धर्मार्थ न्यास अधिनियम अंतर्गत पंजीकृत। बैंक ऑफ इंडिया खाता बही से प्रत्येक लेनदेन का शत-प्रतिशत मिलान।'
          : 'Registered under Indian Public Charitable Trust Act. 100% accountable with Bank of India bank ledger matching.'}
        breadcrumb={lang === 'hi' ? 'पारदर्शिता' : 'Transparency'}
      />

      {/* Full Transparency Section */}
      <Transparency />

      {/* Verification Actions Banner */}
      <section className="py-12 bg-white border-t border-[#E9B44C]/30 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-[#FFF8EF] rounded-2xl p-6 sm:p-8 border border-[#E9B44C]/50 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-secondary bg-white px-2.5 py-0.5 rounded-full border border-[#E9B44C]/40">
                {lang === 'hi' ? 'ऑनलाइन सत्यापन' : 'Digital Verification'}
              </span>
              <h3 className="text-base sm:text-lg font-black text-[#382719] font-hindi-heading mt-1.5">
                {lang === 'hi' ? 'अपनी दान अथवा सदस्यता रसीद ऑनलाइन सत्यापित करें' : 'Verify Donation or Membership Receipts Online'}
              </h3>
              <p className="text-xs text-[#555555] mt-1 max-w-xl">
                {lang === 'hi'
                  ? 'ट्रस्ट का आधिकारिक वाटरमार्क, रसीद क्रमांक एवं बैंक ऑफ इंडिया सत्यापन सहित डिजिटल रसीद सृजित करें।'
                  : 'Generate and check official digitally watermarked receipts with General Secretary endorsement.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
              <Link
                to="/donate"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
              >
                <Heart className="w-4 h-4 text-white" />
                <span>{lang === 'hi' ? 'समर्पण निधि' : 'Donate'}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TransparencyPage;
