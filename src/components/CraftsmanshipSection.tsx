import React from 'react';
import { motion } from 'motion/react';
import { Layers, Scissors, Sparkles, Feather } from 'lucide-react';

export const CraftsmanshipSection: React.FC = () => {
  const pillars = [
    {
      icon: Layers,
      index: '01',
      title: 'Structural Heavyweight Density',
      description:
        'We reject flimsy, fast-fashion lightweight knits. Every Moon piece starts with bespoke knitted 480 GSM loopback terry or 300 GSM combed jersey that holds its architectural contour from morning to midnight.',
    },
    {
      icon: Scissors,
      index: '02',
      title: 'Precision Architectural Cut',
      description:
        'Patterned with deliberate drop shoulders, extended neck ribbings that never ripple, and calculated drape break over footwear. Clean, uncluttered proportions engineered to flatter all bodies.',
    },
    {
      icon: Feather,
      index: '03',
      title: 'Pure Honest Fiber & Selvedge',
      description:
        'Sourced strictly from certified organic mills in Portugal, Belgian flax growers, and vintage Kurabo shuttle looms in Kojima, Japan. Raw textures that patinate and age with personal character.',
    },
  ];

  return (
    <section id="story-section" className="py-12 sm:py-20 lg:py-28 bg-[#FAF9F6] border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-10 sm:mb-16 space-y-3">
          <div className="text-[11px] sm:text-xs uppercase font-semibold tracking-[0.24em] text-neutral-500">
            The Moon Manifesto
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-light text-neutral-900 tracking-tight leading-tight">
            Designed for stillness. <span className="font-serif italic">Kept strictly stylish.</span>
          </h2>
          <p className="text-neutral-600 text-sm sm:text-base leading-relaxed pt-1">
            Moon was conceived as an antidote to disposable clothing trends. We craft foundational silhouettes that unite industrial brutalism with sensory luxury.
          </p>
        </div>

        {/* 3 Editorial Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-3.5 sm:space-y-4 p-5 sm:p-8 bg-white rounded-2xl border border-neutral-200/80 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs font-semibold text-neutral-400">
                    {pillar.index}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-semibold text-neutral-900 tracking-tight">
                  {pillar.title}
                </h3>

                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  {pillar.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Curated quote */}
        <div className="mt-10 sm:mt-16 p-6 sm:p-12 rounded-2xl bg-neutral-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <p className="font-serif italic text-lg sm:text-2xl text-neutral-200 leading-snug">
              &ldquo;Style isn&apos;t the accumulation of garments; it is the confidence of exact form and uncompromising textile discipline.&rdquo;
            </p>
            <p className="text-[11px] sm:text-xs text-neutral-400 font-mono tracking-widest uppercase">
              Moon Atelier · Edition 2026
            </p>
          </div>

          <a
            href="#catalog-section"
            className="w-full md:w-auto text-center px-6 py-3 bg-white hover:bg-neutral-100 text-neutral-900 text-xs font-semibold rounded-full transition-colors shrink-0 cursor-pointer"
          >
            Explore The Pieces
          </a>
        </div>

      </div>
    </section>
  );
};
