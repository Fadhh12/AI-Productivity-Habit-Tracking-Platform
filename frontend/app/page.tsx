import type { Metadata } from 'next';
import { Features } from '@/components/landing/Features';
import { Hero } from '@/components/landing/Hero';
import { Philosophy } from '@/components/landing/Philosophy';
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
      </main>
    </div>
  );
}
