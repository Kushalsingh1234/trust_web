import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const PageHeader = ({
  badge,
  title,
  subtitle,
  breadcrumb
}) => {
  const { lang } = useLanguage();

  return (
    <div className="relative pt-20 pb-12 sm:pt-24 sm:pb-16 bg-[#FFF8EF] border-b border-[#E9B44C]/35 overflow-hidden">
      {/* Background Subtle Mandala Aura */}
      <div className="absolute inset-0 bg-mandala-subtle opacity-40 pointer-events-none"></div>
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Breadcrumb Navigation */}
        <nav className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-[#E9B44C]/40 text-xs text-[#666666] mb-4 shadow-xs" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <Home className="w-3.5 h-3.5 text-secondary" />
            <span>{lang === 'hi' ? 'मुख्य पृष्ठ' : 'Home'}</span>
          </Link>
          <ChevronRight className="w-3 h-3 text-[#E9B44C]" />
          <span className="font-bold text-[#382719] truncate max-w-[200px]">
            {breadcrumb || title}
          </span>
        </nav>

        {/* Badge */}
        {badge && (
          <div className="mb-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-secondary bg-white border border-[#E9B44C]/60 shadow-xs">
              {badge}
            </span>
          </div>
        )}

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#382719] font-hindi-heading tracking-tight leading-tight max-w-3xl mx-auto">
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p className="mt-3 text-sm sm:text-base text-[#454545] max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
