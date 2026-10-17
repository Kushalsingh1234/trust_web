import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Phone, Shield, UserCheck, Users, User } from 'lucide-react';

export const Trustees = () => {
  const { lang, t } = useLanguage();

  return (
    <section id="team" className="py-12 sm:py-16 lg:py-24 bg-[#FFF8EF] relative border-b border-[#E9B44C]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-secondary bg-white border border-[#E9B44C]/60 px-4 py-1 rounded-full shadow-sm">
            {t.team.tag}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#382719] mt-3.5 font-hindi-heading">
            {t.team.title}
          </h2>
          <p className="text-sm sm:text-base text-[#454545] mt-3 leading-relaxed font-medium">
            {t.team.subtitle}
          </p>
          <div className="w-20 h-1.5 bg-gradient-to-r from-primary via-accent to-secondary mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Trustees Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {t.team.members.map((member, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 sm:p-6 shadow-card hover:shadow-card-hover transition-all duration-300 border border-[#E9B44C]/35 flex flex-col justify-between text-left group hover:-translate-y-1"
            >
              <div>
                <div className="flex items-center gap-3.5 sm:gap-4 mb-3 sm:mb-4">
                  <div className="relative flex-shrink-0">
                    {member.img ? (
                      <img
                        src={member.img}
                        alt={member.name}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-primary object-cover object-top shadow-sm group-hover:scale-105 transition-transform bg-white ring-2 ring-primary/20"
                      />
                    ) : (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-[#E9B44C]/70 bg-[#FFF8EF] text-primary flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform ring-2 ring-[#E9B44C]/25">
                        <User className="w-7 h-7 sm:w-8 sm:h-8 text-primary/80" />
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-trust-green text-white flex items-center justify-center text-[10px] font-bold shadow">
                      ✓
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-extrabold text-base sm:text-lg text-[#382719] leading-snug group-hover:text-primary transition-colors font-hindi-heading truncate">
                      {member.name}
                    </h3>
                    <p className="text-xs font-bold text-secondary mt-0.5 truncate">
                      {member.role}
                    </p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[#454545] leading-relaxed mb-4">
                  {member.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-[#E9B44C]/20 flex flex-wrap items-center justify-between gap-2">
                <a
                  href={`tel:${member.phone.replace(/[^0-9+]/g, '')}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-white transition-colors bg-[#FFF8EF] hover:bg-primary px-3 py-1.5 rounded-full border border-[#E9B44C]/40 shadow-sm"
                >
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{member.phone}</span>
                </a>
                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary bg-[#FFF8EF] border border-[#E9B44C]/30 px-2 py-0.5 rounded-md">
                  {lang === 'hi' ? 'सीधा संपर्क' : 'Direct Call'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Associates & Convenors Box */}
        <div className="mt-10 p-5 rounded-2xl bg-white border border-[#E9B44C]/35 shadow-card text-left flex items-start gap-3">
          <Users className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-xs sm:text-sm text-[#454545] leading-relaxed font-medium">
            <span className="font-black text-[#382719]">
              {lang === 'hi' ? 'सहयोगी निवेदक-गण:' : 'Council of Convenors & Associates:'}{' '}
            </span>
            {t.team.associatesNote}
          </p>
        </div>

      </div>
    </section>
  );
};

export default Trustees;
