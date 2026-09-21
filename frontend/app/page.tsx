import type { Metadata } from 'next';
import { FinalCta } from '@/components/landing/FinalCta';
import { Features } from '@/components/landing/Features';
import { Footer } from '@/components/landing/Footer';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Philosophy } from '@/components/landing/Philosophy';
import { Plans } from '@/components/landing/Plans';
import { LandingNav } from '@/components/landing/LandingNav';

export const metadata: Metadata = {
  title: 'Continuum: kebiasaan baik tanpa rasa bersalah',
  description:
    'Catat habit dan aktivitas harianmu, dibantu AI coach. Tanpa tekanan, tanpa rasa bersalah kalau sehari terlewat.',
};

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-[#0F1015] text-white">
      <noscript>
        <style>{'.reveal{opacity:1!important;transform:none!important}'}</style>
      </noscript>
      <LandingNav />
      <main>
        <Hero />
        <Philosophy />
        <Features />
        <HowItWorks />
        <Plans />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
