import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { MessageCircle } from 'lucide-react';

export const FloatingWhatsApp = () => {
  const { lang } = useLanguage();

  const message = lang === 'hi'
    ? 'नमस्ते, मैं राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट) के संबंध में जानकारी व सहयोग हेतु संपर्क करना चाहता हूँ।'
    : 'Hello, I would like to get information regarding Rashtriya Sanatan Sanskar Seva Sansthan (Trust) and its welfare programs.';

  const whatsappUrl = `https://wa.me/919794590044?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 group flex items-center gap-2 bg-[#25D366] hover:bg-[#20BA5A] text-white px-3.5 py-3 sm:px-4 sm:py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0"
      aria-label="Chat with Trust Manager on WhatsApp"
    >
      <div className="relative">
        <MessageCircle className="w-6 h-6 fill-white text-[#25D366]" />
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-300 rounded-full animate-ping"></span>
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-300 rounded-full"></span>
      </div>
      <span className="hidden sm:inline font-bold text-xs tracking-wide">
        {lang === 'hi' ? 'व्हाट्सएप पर बात करें' : 'WhatsApp Us'}
      </span>
    </a>
  );
};

export default FloatingWhatsApp;
