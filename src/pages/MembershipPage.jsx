import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { usePageMeta } from '../hooks/usePageMeta';
import PageHeader from '../components/PageHeader';
import HowYouCanHelp from '../sections/HowYouCanHelp';
import { ShieldCheck, Award, CreditCard, UserCheck, Calendar, BookOpen, UserPlus } from 'lucide-react';

export const MembershipPage = ({ onOpenJoinModal, onOpenVolunteerModal, onOpenReceiptModal }) => {
  const { lang, t } = useLanguage();

  usePageMeta(
    lang === 'hi' ? 'ट्रस्ट सदस्यता • वार्षिक सदस्यता एवं अधिकार' : 'Trust Membership • Annual Registration',
    lang === 'hi'
      ? 'राष्ट्रीय सनातन संस्कार सेवा संस्थान की ₹200 वार्षिक सदस्यता लें। डिजिटल परिचय पत्र, कैलेंडर एवं संस्थागत अधिकार प्राप्त करें।'
      : 'Become an annual member of Rashtriya Sanatan Sanskar Seva Sansthan (₹200/yr). Get digital ID card and participate in trust activities.'
  );

  const memberBenefits = [
    {
      icon: Award,
      title: lang === 'hi' ? 'आधिकारिक डिजिटल पहचान पत्र' : 'Official Digital ID Card',
      desc: lang === 'hi' 
        ? 'सत्यापन उपरांत ट्रस्ट का आधिकारिक फोटो युक्त सदस्यता परिचय पत्र एवं विशिष्ट सदस्यता क्रमांक।'
        : 'Photo-verified membership identity card with unique registration ID issued digitally.'
    },
    {
      icon: Calendar,
      title: lang === 'hi' ? 'वार्षिक कैलेंडर एवं पाक्षिक पत्रिका' : 'Annual Calendar & Magazine',
      desc: lang === 'hi'
        ? 'ट्रस्ट द्वारा प्रकाशित वार्षिक सनातन पंचांग/कैलेंडर एवं सूचना पत्रक की निःशुल्क प्रति।'
        : 'Complimentary annual Sanatan calendar, event publications, and news bulletin.'
    },
    {
      icon: UserCheck,
      title: lang === 'hi' ? 'संस्कार व कल्याण योजनाओं में प्राथमिकता' : 'Priority Sanskar Facilitation',
      desc: lang === 'hi'
        ? '१६ संस्कारों के आयोजन, श्रमिक योजनाओं के पंजीकरण एवं विधिक मार्गदर्शन में संस्था द्वारा विशेष सहयोग।'
        : 'Priority assistance in organizing Vedic life rites, social welfare enrollments, and advisory.'
    },
    {
      icon: ShieldCheck,
      title: lang === 'hi' ? 'साधारण सभा में सहभागिता' : 'General Assembly Rights',
      desc: lang === 'hi'
        ? 'ट्रस्ट की सामान्य बैठकों, विचार गोष्ठियों एवं वार्षिक सम्मेलनों में सम्मिलित होने का अधिकार।'
        : 'Right to attend general meetings, philosophical forums, and annual conferences.'
    }
  ];

  const memberTypes = [
    {
      badge: lang === 'hi' ? 'प्रकार (अ)' : 'Type (A)',
      title: lang === 'hi' ? 'आभावग्रस्त / सामान्य सनातनी बंधु' : 'Sanatan Beneficiary Member',
      desc: lang === 'hi'
        ? 'सनातन धर्म को मानने वाले ऐसे गरीब, श्रमिक एवं अभावग्रस्त सनातनी बंधु जो ट्रस्ट द्वारा सहयोग व मार्गदर्शन पाना चाहते हैं।'
        : 'Sanatan followers, unorganized laborers, and needy families seeking direct welfare support.'
    },
    {
      badge: lang === 'hi' ? 'प्रकार (ब)' : 'Type (B)',
      title: lang === 'hi' ? 'समर्थ / उद्योगपति / अधिकारी वर्ग' : 'Patron & Supporter Member',
      desc: lang === 'hi'
        ? 'सनातन धर्म को मजबूत करने के लिए आर्थिक एवं संस्थागत सहयोग प्रदान करने वाले दानदाता व उद्यमी।'
        : 'Enterprises, professionals, and donors providing financial and institutional patronage.'
    },
    {
      badge: lang === 'hi' ? 'प्रकार (स)' : 'Type (C)',
      title: lang === 'hi' ? 'सक्रिय समाज सेवी / स्वयंसेवक' : 'Active Seva Volunteer',
      desc: lang === 'hi'
        ? 'जिनके पास पर्याप्त समय है और जन-जन से संपर्क करके सनातनियों को जागरूक करने का कार्य करना चाहते हैं।'
        : 'Individuals with dedicated time to conduct ground campaigns and awaken communities.'
    }
  ];

  return (
    <div className="flex flex-col">
      <PageHeader
        badge={lang === 'hi' ? 'सक्रिय सहभागिता' : 'Active Membership'}
        title={lang === 'hi' ? 'वार्षिक सदस्यता एवं सहभागी अधिकार' : 'Trust Membership & Annual Registration'}
        subtitle={lang === 'hi'
          ? 'मात्र ₹200 वार्षिक सदस्यता शुल्क के साथ सनातन धर्म व श्रमिक कल्याण के महाअभियान का अभिन्न अंग बनें।'
          : 'Join the noble cause of Sanatan values and social welfare with an annual contribution of ₹200.'}
        breadcrumb={lang === 'hi' ? 'सदस्यता' : 'Membership'}
      />

      {/* Membership Plan & Fee Card */}
      <section className="py-12 bg-white border-b border-[#E9B44C]/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-[#FFF8EF] via-[#FFF5E6] to-[#FFE9CC] rounded-3xl p-6 sm:p-10 border-2 border-[#E9B44C]/60 shadow-card flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="space-y-3">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-secondary bg-white border border-[#E9B44C]/60">
                {lang === 'hi' ? 'विधान एवं शुल्क' : 'Official Subscription'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#382719] font-hindi-heading">
                {lang === 'hi' ? 'ट्रस्ट वार्षिक सदस्यता शुल्क' : 'Annual Membership Subscription'}
              </h2>
              <p className="text-xs sm:text-sm text-[#454545] max-w-xl leading-relaxed">
                {lang === 'hi'
                  ? 'ट्रस्ट के संविधान के अनुसार प्रत्येक सदस्य का वार्षिक सदस्यता शुल्क ₹200/- (दो सौ रुपये मात्र) निर्धारित है। सदस्यता ऑनलाइन फॉर्म भरकर बैंक खाते में शुल्क जमा करके प्राप्त की जा सकती है।'
                  : 'In accordance with the Trust charter, annual membership is ₹200/year. Fill the online form and submit the bank transfer to receive your membership confirmation.'}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border-2 border-primary shadow-saffron flex-shrink-0 min-w-[200px]">
              <span className="text-[10px] font-black uppercase text-[#666666] tracking-wider block">
                {lang === 'hi' ? 'वार्षिक योगदान' : 'Annual Fee'}
              </span>
              <p className="text-3xl sm:text-4xl font-black text-primary my-1">
                ₹200
              </p>
              <span className="text-xs font-bold text-[#382719] block mb-4">
                / {lang === 'hi' ? 'प्रति वर्ष' : 'per year'}
              </span>

              <button
                type="button"
                onClick={onOpenJoinModal}
                className="w-full inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs shadow-sm transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? 'आवेदन करें' : 'Apply Now'}</span>
              </button>
            </div>
          </div>

          {/* 3 Membership Categories */}
          <div className="mt-12">
            <div className="text-center mb-8">
              <span className="text-xs font-black uppercase tracking-wider text-secondary">
                {lang === 'hi' ? 'ट्रस्ट नियमावली' : 'Member Classification'}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#382719] font-hindi-heading mt-1">
                {lang === 'hi' ? 'सदस्यता के तीन प्रकार (ट्रस्ट प्रपत्र अनुसार)' : 'Three Classes of Membership'}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {memberTypes.map((t, idx) => (
                <div key={idx} className="bg-[#FFFDF9] rounded-2xl p-5 border border-[#E9B44C]/35 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black bg-white text-secondary border border-[#E9B44C]/50 mb-2">
                      {t.badge}
                    </span>
                    <h4 className="text-sm font-black text-[#382719] font-hindi-heading mb-2">
                      {t.title}
                    </h4>
                    <p className="text-xs text-[#555555] leading-relaxed">
                      {t.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Member Privileges Grid */}
          <div className="mt-12">
            <div className="text-center mb-8">
              <span className="text-xs font-black uppercase tracking-wider text-secondary">
                {lang === 'hi' ? 'सदस्य अधिकार' : 'Member Privileges'}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#382719] font-hindi-heading mt-1">
                {lang === 'hi' ? 'ट्रस्ट सदस्यता के प्रमुख लाभ एवं सुविधाएं' : 'Key Member Benefits & Rights'}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {memberBenefits.map((b, idx) => {
                const IconComp = b.icon;
                return (
                  <div key={idx} className="bg-white rounded-2xl p-5 border border-[#E9B44C]/30 shadow-xs hover:border-primary transition-colors text-left">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#382719] mb-1 font-hindi-heading">
                      {b.title}
                    </h4>
                    <p className="text-[11px] text-[#555555] leading-relaxed">
                      {b.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* How You Can Help Section */}
      <HowYouCanHelp
        onOpenReceiptModal={onOpenReceiptModal}
        onOpenJoinModal={onOpenJoinModal}
        onOpenVolunteerModal={onOpenVolunteerModal}
      />
    </div>
  );
};

export default MembershipPage;
