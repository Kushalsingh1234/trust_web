import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { MapPin, Phone, Mail, Send, CheckCircle2, MessageSquare, Building } from 'lucide-react';

export const Contact = () => {
  const { lang, t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    interest: 'interestOpt1',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);

    const text = `*New Inquiry via Trust Website*\n*Name:* ${formData.name}\n*Phone:* ${formData.phone}\n*Interest:* ${t.contact[formData.interest] || formData.interest}\n*Message:* ${formData.message}`;
    
    // Open in WhatsApp to Bajrangi Dubey (+919794590044)
    setTimeout(() => {
      window.open(`https://wa.me/919794590044?text=${encodeURIComponent(text)}`, '_blank');
    }, 400);
  };

  return (
    <section id="contact" className="py-12 sm:py-16 lg:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#382719] bg-[#FFF8EF] border border-[#E9B44C]/40 px-4 py-1 rounded-full shadow-sm">
            {t.contact.tag}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#382719] mt-3.5 font-hindi-heading">
            {t.contact.title}
          </h2>
          <p className="text-sm sm:text-base text-[#454545] mt-3 leading-relaxed font-medium">
            {t.contact.subtitle}
          </p>
          <div className="w-20 h-1.5 bg-gradient-to-r from-primary via-secondary to-[#E9B44C] mx-auto mt-4 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* Left Column: Office Addresses, Phones & Map */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-6 text-left">
            
            {/* Head Office Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-[#FFF8EF] border border-[#E9B44C]/35 shadow-card hover:shadow-lift transition-all">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 sm:p-3 rounded-2xl bg-white text-primary mt-0.5 border border-[#E9B44C]/35 shadow-sm flex-shrink-0">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-[#382719] font-hindi-heading">
                    {t.contact.headOfficeTitle}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#454545] mt-1 leading-relaxed font-medium">
                    {t.contact.headOffice}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact & Support Office Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-[#FFF8EF] border border-[#E9B44C]/35 shadow-card hover:shadow-lift transition-all">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 sm:p-3 rounded-2xl bg-white text-secondary mt-0.5 border border-[#E9B44C]/35 shadow-sm flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-[#382719] font-hindi-heading">
                    {t.contact.contactOfficeTitle}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#454545] mt-1 leading-relaxed font-medium">
                    {t.contact.contactOffice}
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Phone Directory */}
            <div className="p-5 sm:p-6 rounded-3xl bg-[#FFF8EF] border border-[#E9B44C]/35 shadow-card space-y-3.5">
              <div className="flex items-center gap-2 text-primary font-black text-sm">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>{t.contact.phonesTitle}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <a
                  href="tel:+919794590044"
                  className="p-3 rounded-xl bg-white hover:bg-white/80 text-[#454545] font-bold flex items-center justify-between border border-[#E9B44C]/35 transition-all hover:border-primary min-h-[44px]"
                >
                  <span className="truncate mr-2">
                    {lang === 'hi' ? 'बजरंगी दूबे (राष्ट्रीय मंत्री/प्रबन्धक)' : 'Bajrangi Dubey (Rashtriya Mantri / Prabandhak)'}
                  </span>
                  <span className="font-mono text-primary font-black flex-shrink-0">9794590044</span>
                </a>
                <a
                  href="tel:+919026734887"
                  className="p-3 rounded-xl bg-white hover:bg-white/80 text-[#454545] font-bold flex items-center justify-between border border-[#E9B44C]/35 transition-all hover:border-primary min-h-[44px]"
                >
                  <span className="truncate mr-2">
                    {lang === 'hi' ? 'के. एन. शर्मा (राष्ट्रीय सलाहकार)' : 'K. N. Sharma (Rashtriya Salahkar)'}
                  </span>
                  <span className="font-mono text-primary font-black flex-shrink-0">9026734887</span>
                </a>
              </div>

              {/* Direct Helpline Status */}
              <div className="pt-2.5 border-t border-[#E9B44C]/25 flex flex-wrap items-center justify-between gap-2 text-xs text-[#454545]">
                <span className="font-bold text-[#382719] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {lang === 'hi' ? 'व्हाट्सएप एवं फोन सेवा सक्रिय' : 'WhatsApp & Phone Support Active'}
                </span>
                <span className="font-bold text-primary font-mono">+91 9794590044</span>
              </div>
            </div>

            {/* Google Map Placeholder Card */}
            <div className="p-4 rounded-3xl bg-[#FFF8EF] border border-[#E9B44C]/35 shadow-card text-center">
              <div className="aspect-[16/7] rounded-2xl bg-white border border-[#E9B44C]/30 flex flex-col items-center justify-center p-4 text-[#454545]">
                <MapPin className="w-7 h-7 sm:w-8 sm:h-8 text-primary mb-1 animate-none md:animate-bounce" />
                <span className="font-black text-xs sm:text-sm text-[#382719]">
                  {t.contact.mapPlaceholder}
                </span>
                <span className="text-[10px] sm:text-[11px] text-[#454545] font-medium mt-0.5">
                  {t.contact.mapNotice}
                </span>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Form */}
          <div className="lg:col-span-6 bg-[#FFF8EF] rounded-3xl p-5 sm:p-8 border border-[#E9B44C]/35 shadow-card text-left w-full">
            <h3 className="text-xl sm:text-2xl font-black text-[#382719] mb-1 font-hindi-heading">
              {t.contact.formTitle}
            </h3>
            <p className="text-xs sm:text-sm text-[#454545] mb-5 sm:mb-6 font-medium">
              {lang === 'hi'
                ? 'अपना विवरण भरें, संदेश सीधे ट्रस्ट कार्यालय के व्हाट्सएप पर प्रेषित होगा।'
                : 'Fill in your inquiry to route directly to trust manager on WhatsApp / email.'}
            </p>

            {submitted ? (
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-green-300 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-trust-green mx-auto" />
                <h4 className="font-black text-[#382719] text-base font-hindi-heading">
                  {lang === 'hi' ? 'धन्यवाद! संदेश प्रेषित किया जा रहा है।' : 'Thank you! Message forwarded.'}
                </h4>
                <p className="text-xs text-[#454545] font-medium">
                  {lang === 'hi' 
                    ? 'संस्थान के पदाधिकारी आपसे यथाशीघ्र संपर्क करेंगे।' 
                    : 'The trust team will connect with you promptly.'}
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-xs font-bold text-primary underline pt-2"
                >
                  {lang === 'hi' ? 'दूसरा संदेश भेजें' : 'Send another inquiry'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#382719] mb-1">
                    {t.contact.name} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={lang === 'hi' ? 'उदा. राजेश शर्मा' : 'e.g. Rajesh Sharma'}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E9B44C]/40 bg-white focus:border-primary focus:ring-1 focus:ring-primary text-base sm:text-sm text-[#454545] shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#382719] mb-1">
                    {t.contact.phone} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="10-digit mobile number"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E9B44C]/40 bg-white focus:border-primary focus:ring-1 focus:ring-primary text-base sm:text-sm text-[#454545] shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#382719] mb-1">
                    {t.contact.interest} *
                  </label>
                  <select
                    value={formData.interest}
                    onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E9B44C]/40 bg-white focus:border-primary focus:ring-1 focus:ring-primary text-base sm:text-sm text-[#454545] shadow-sm"
                  >
                    <option value="interestOpt1">{t.contact.interestOpt1}</option>
                    <option value="interestOpt2">{t.contact.interestOpt2}</option>
                    <option value="interestOpt3">{t.contact.interestOpt3}</option>
                    <option value="interestOpt4">{t.contact.interestOpt4}</option>
                    <option value="interestOpt5">{t.contact.interestOpt5}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#382719] mb-1">
                    {t.contact.message} *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={lang === 'hi' ? 'अपना प्रश्न या विचार यहाँ लिखें...' : 'Write your details or questions here...'}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E9B44C]/40 bg-white focus:border-primary focus:ring-1 focus:ring-primary text-base sm:text-sm text-[#454545] shadow-sm"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-primary hover:bg-secondary text-white font-black text-sm shadow-saffron transition-all transform hover:-translate-y-0.5 active:translate-y-0 border border-primary min-h-[48px]"
                >
                  <Send className="w-4 h-4 flex-shrink-0" />
                  <span>{t.contact.sendBtn}</span>
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </section>
  );
};

export default Contact;
