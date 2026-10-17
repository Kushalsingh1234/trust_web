import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import TrustLogo from '../components/TrustLogo';
import { Globe, Heart, Phone, MapPin, ArrowUp } from 'lucide-react';

export const Footer = ({ onOpenReceiptModal, onOpenJoinModal, onNavigateMember, onNavigateAdmin }) => {
  const { lang, toggleLanguage, t } = useLanguage();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#302319] text-[#FFF8EF] pt-12 sm:pt-16 pb-8 sm:pb-12 border-t border-[#382719] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10 pb-8 sm:pb-12 border-b border-[#FFF8EF]/10 text-left">
          
          {/* Col 1: Trust Identity & Motto */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-[#FFF8EF]/10 p-3 rounded-2xl inline-block">
              <TrustLogo className="w-12 h-12" showText={false} lang={lang} />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white font-hindi-heading">
                {t.brand.name}
              </h3>
            </div>
            <p className="text-xs text-[#FFF8EF]/80 leading-relaxed max-w-sm">
              {t.footer.desc}
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#E9B44C]">
              {t.footer.quickLinks}
            </h4>
            <ul className="space-y-2 text-xs text-[#FFF8EF]/80">
              <li><a href="#about" className="hover:text-[#E9B44C] transition-colors py-1 block">{t.nav.about}</a></li>
              <li><a href="#sanskars" className="hover:text-[#E9B44C] transition-colors py-1 block">{t.nav.sanskars}</a></li>
              <li><a href="#programs" className="hover:text-[#E9B44C] transition-colors py-1 block">{t.nav.programs}</a></li>
              <li><a href="#news" className="hover:text-[#E9B44C] transition-colors py-1 block">{lang === 'hi' ? 'सूचनाएं एवं संदेश' : 'Announcements'}</a></li>
              <li><a href="#transparency" className="hover:text-[#E9B44C] transition-colors py-1 block">{t.nav.transparency}</a></li>
              <li><a href="#contact" className="hover:text-[#E9B44C] transition-colors py-1 block">{t.nav.contact}</a></li>
            </ul>
          </div>

          {/* Col 3: Direct Actions & Portals */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#E9B44C]">
              {lang === 'hi' ? 'सेवा, सदस्यता व पोर्टल' : 'Sewa & Portals'}
            </h4>
            <div className="space-y-2.5">
              <div className="flex flex-wrap gap-2">
                <a
                  href="#donate"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs shadow-sm transition-all"
                >
                  <Heart className="w-3.5 h-3.5 fill-white text-white flex-shrink-0" />
                  <span>{t.nav.donate}</span>
                </a>

                <button
                  type="button"
                  onClick={onOpenJoinModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary hover:bg-primary text-white font-bold text-xs shadow-sm transition-all"
                >
                  <span>{lang === 'hi' ? 'सदस्यता लें' : 'Join Trust'}</span>
                </button>
              </div>

              <div className="space-y-2 pt-1 text-xs text-[#FFF8EF]/80">
                <button
                  type="button"
                  onClick={onNavigateMember}
                  className="block hover:text-[#E9B44C] transition-colors text-left py-1"
                >
                  → {lang === 'hi' ? 'सदस्य डैशबोर्ड एवं पहचान पत्र' : 'Member Dashboard & ID'}
                </button>
                <button
                  type="button"
                  onClick={onNavigateAdmin}
                  className="block text-[#E9B44C] hover:underline font-bold text-left py-1"
                >
                  🔒 {lang === 'hi' ? 'व्यवस्थापक पोर्टल (Admin)' : 'Admin Dashboard'}
                </button>
                <button
                  type="button"
                  onClick={onOpenReceiptModal}
                  className="block text-[#FFF8EF]/70 hover:text-white underline text-left py-1"
                >
                  {lang === 'hi' ? 'ऑनलाइन डिजिटल रसीद सृजन' : 'Generate Digital Receipt'}
                </button>
              </div>

              <div className="pt-2 text-xs text-[#FFF8EF]/70 space-y-1">
                <p>वार्षिक सदस्यता: <span className="text-[#E9B44C] font-bold">₹200/-</span></p>
                <p>खाता: <span className="font-mono text-white break-all">135820110000012</span></p>
                <p>बैंक: <span className="text-white">Bank of India</span></p>
              </div>
            </div>
          </div>

          {/* Col 4: Institutional & Registration Notice */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#E9B44C]">
              {t.footer.legal}
            </h4>
            <p className="text-xs text-[#FFF8EF]/80 leading-relaxed">
              <span className="font-bold text-white block">{t.footer.regInfo}</span>
              {t.footer.regOffice}
            </p>
            <p className="text-[11px] text-[#E9B44C] font-mono break-all">
              [ADD TRUST REGISTRATION NO.]
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={toggleLanguage}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#FFF8EF]/20 hover:border-[#E9B44C] text-xs font-bold text-white transition-all min-h-[40px]"
              >
                <Globe className="w-3.5 h-3.5 text-[#E9B44C] flex-shrink-0" />
                <span>भाषा: {lang === 'en' ? 'हिंदी में बदलें' : 'Switch to English'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Back to Top */}
        <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#FFF8EF]/60 text-center sm:text-left">
          <div>
            © {new Date().getFullYear()} {t.brand.name}. {t.footer.copyright}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[#FFF8EF]/50">{t.footer.builtFor}</span>
            <button
              onClick={scrollToTop}
              className="p-2.5 rounded-full bg-[#FFF8EF]/10 hover:bg-[#FFF8EF]/20 text-white transition-colors"
              aria-label="Back to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
