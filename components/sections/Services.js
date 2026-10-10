"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { useLanguage } from "../LanguageProvider";
import { Icon } from "../Icons";
import { Reveal, SectionHeading } from "../Reveal";
import { services } from "@/lib/services";
import { site } from "@/lib/site.config";
import { MobileCarousel } from "../MobileCarousel";



export const serviceAccents = [
  "bg-[#2DD4BF]/10 text-[#2DD4BF] ring-[#2DD4BF]/20",
  "bg-sky-500/10 text-sky-400 ring-sky-500/20",
  "bg-blue-500/10 text-blue-400 ring-blue-500/20",
  "bg-indigo-500/10 text-indigo-400 ring-indigo-500/20",
  "bg-white/10 text-slate-300 ring-white/10",
];

export const serviceIconThemes = [
  { gradient: "from-[#38bdf8] to-[#2563eb]", glow: "shadow-[0_8px_22px_rgba(37,99,235,0.35)]",   hoverGlow: "group-hover:shadow-[0_12px_28px_rgba(37,99,235,0.48)]" },
  { gradient: "from-[#818cf8] to-[#6366f1]", glow: "shadow-[0_8px_22px_rgba(99,102,241,0.35)]",  hoverGlow: "group-hover:shadow-[0_12px_28px_rgba(99,102,241,0.48)]" },
  { gradient: "from-[#39699F] to-[#1e40af]", glow: "shadow-[0_8px_22px_rgba(57,105,159,0.38)]",  hoverGlow: "group-hover:shadow-[0_12px_28px_rgba(57,105,159,0.52)]" },
  { gradient: "from-[#10b981] to-[#0d9488]", glow: "shadow-[0_8px_22px_rgba(13,148,136,0.35)]",  hoverGlow: "group-hover:shadow-[0_12px_28px_rgba(13,148,136,0.48)]" },
  { gradient: "from-[#f43f5e] to-[#ea580c]", glow: "shadow-[0_8px_22px_rgba(244,63,94,0.35)]",   hoverGlow: "group-hover:shadow-[0_12px_28px_rgba(244,63,94,0.48)]" },
  { gradient: "from-[#06b6d4] to-[#0284c7]", glow: "shadow-[0_8px_22px_rgba(2,132,199,0.35)]",   hoverGlow: "group-hover:shadow-[0_12px_28px_rgba(2,132,199,0.48)]" },
];

function ServiceCard({ service, item, i, t }) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, isHovered: false });
  const [spotlightPos, setSpotlightPos] = useState({ x: 0, y: 0 });
  const [spotlightOpacity, setSpotlightOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTilt({ rotateX: (-y / rect.height) * 8, rotateY: (x / rect.width) * 8, isHovered: true });
    setSpotlightPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const theme = serviceIconThemes[i % serviceIconThemes.length];

  return (
    <Link
      ref={cardRef}
      data-molecule-card={i}
      href={`/services/${service.slug}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setSpotlightOpacity(1)}
      onMouseLeave={() => { setTilt({ rotateX: 0, rotateY: 0, isHovered: false }); setSpotlightOpacity(0); }}
      style={{
        transform: tilt.isHovered
          ? `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) translateY(-8px)`
          : "none",
        transition: tilt.isHovered
          ? "transform 0.12s ease-out, box-shadow 0.38s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.38s cubic-bezier(0.16, 1, 0.3, 1)"
          : "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.38s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.38s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      className={`group relative z-30 flex flex-col transition-all duration-[380ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:border-brand-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600 ${
        site.showInfinity 
          ? "border-2 border-transparent bg-white/[0.04] p-6 xl:p-8 text-center hover:shadow-[0_22px_50px_rgba(57,105,159,0.20)] aspect-square w-[min(280px,100%)] shrink-0 lg:w-[var(--service-size)] rounded-full items-center justify-center overflow-hidden" 
          : "border border-white/20 bg-[#050a0e]/40 backdrop-blur-md p-6 sm:p-8 hover:shadow-[0_22px_50px_rgba(57,105,159,0.20)] aspect-square w-[min(320px,100%)] mx-auto rounded-full items-center justify-center text-center overflow-hidden"
      }`}
    >
      {/* Dotted spotlight */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300"
        style={{
          opacity: spotlightOpacity,
          backgroundImage: `radial-gradient(rgb(34 197 94 / 0.35) 1.5px, transparent 1.5px)`,
          backgroundSize: "22px 22px",
          maskImage: `radial-gradient(220px circle at ${spotlightPos.x}px ${spotlightPos.y}px, black 30%, transparent 100%)`,
          WebkitMaskImage: `radial-gradient(220px circle at ${spotlightPos.x}px ${spotlightPos.y}px, black 30%, transparent 100%)`,
        }}
        aria-hidden="true"
      />
      {/* Glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 mix-blend-screen"
        style={{
          opacity: spotlightOpacity,
          background: `radial-gradient(300px circle at ${spotlightPos.x}px ${spotlightPos.y}px, rgba(34,197,94,0.12), transparent 65%)`,
        }}
        aria-hidden="true"
      />

      <div className={`relative z-10 flex flex-col h-full pointer-events-none items-center justify-center`}>
        <div className={`flex shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br ${theme.gradient} ${theme.glow} ${theme.hoverGlow} text-white transition-all duration-350 ease-out group-hover:scale-110 group-hover:rotate-6 ${
          site.showInfinity ? "h-[48px] w-[48px] xl:h-[56px] xl:w-[56px]" : "h-[56px] w-[56px]"
        }`}>
          <Icon name={service.icon} className={`text-white ${site.showInfinity ? "h-6 w-6" : "h-7 w-7"}`} />
        </div>
        <h3 className={`font-display font-bold text-white group-hover:text-[#4ADE80] transition-colors leading-tight ${
          site.showInfinity ? "mt-3.5 text-base sm:text-lg" : "mt-4 text-lg sm:text-xl"
        }`}>{item.title}</h3>
        <p className={`text-slate-300 leading-relaxed max-w-[90%] mx-auto ${
          site.showInfinity ? "mt-2 text-[11px] sm:text-xs line-clamp-3" : "mt-2 text-xs sm:text-sm line-clamp-3"
        }`}>{item.summary}</p>
        <span className={`inline-flex items-center gap-1.5 font-bold text-[#4ADE80] transition-all duration-200 ease-out group-hover:gap-2.5 group-hover:text-white mt-3 justify-center ${
          site.showInfinity ? "text-xs" : "text-sm"
        }`}>
          <span>{t.serviceDetail.viewDetails}</span>
          <Icon name="arrow" className={`transition-transform duration-200 ease-out group-hover:translate-x-1 ${
            site.showInfinity ? "h-3.5 w-3.5" : "h-4 w-4"
          }`} />
        </span>
      </div>
    </Link>
  );
}

export function Services() {
  const { t, lang } = useLanguage();
  const s = t.services;

  // One ref per card to measure center positions

  return (
    <section id="services" className="relative z-30 py-10 sm:py-16 lg:py-20 overflow-hidden">
      <div className="mx-auto max-w-[1560px] px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow={s.eyebrow} title={s.title} subtitle={s.subtitle} />

        <Reveal className="mt-12 sm:mt-16">
          <div data-molecule-destination aria-hidden="true" className="pointer-events-none h-16 lg:h-0" />
          {site.showInfinity ? (
            <>
              {/* Mobile: Vertical zigzag */}
              <div data-molecule-cards className="block lg:hidden relative pt-12 pb-8">
                <div className="flex flex-col w-full items-center -space-y-16 sm:-space-y-20">
                  {services.map((service, i) => {
                    const item = service[lang];
                    // Offset right for even, left for odd
                    const offsetClass = i % 2 === 0 ? "ml-auto mr-8 sm:mr-16" : "mr-auto ml-8 sm:ml-16";
                    return (
                      <div key={service.slug} className={`flex w-[38%] sm:w-[30%] justify-center ${offsetClass}`}>
                        <ServiceCard service={service} item={item} i={i} t={t} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Desktop: W-shape honeycomb with molecule canvas overlay */}
              <div data-molecule-cards className="service-honeycomb hidden lg:block relative py-6">
                <div className="flex flex-col w-full items-center">
                  {/* Top row */}
                  <div className="service-row service-row-top flex">
                    {services.slice(0, 3).map((service, i) => {
                      const item = service[lang];
                      return (
                        <ServiceCard
                          key={service.slug}
                          service={service}
                          item={item}
                          i={i}
                          t={t}
                        />
                      );
                    })}
                  </div>
                  {/* Bottom row: cards 3, 4, 5 — offset right by half-stride (+175px) to form W */}
                  <div className="service-row service-row-bottom flex mt-4">
                    {services.slice(3, 6).map((service, i) => {
                      const item = service[lang];
                      return (
                        <ServiceCard
                          key={service.slug}
                          service={service}
                          item={item}
                          i={i + 3}
                          t={t}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Standard Grid Layout when Infinity is disabled */
            <div data-molecule-cards className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 pt-8 pb-4 max-w-5xl mx-auto">
              {services.map((service, i) => {
                const item = service[lang];
                return (
                  <ServiceCard
                    key={service.slug}
                    service={service}
                    item={item}
                    i={i}
                    t={t}
                  />
                );
              })}
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
