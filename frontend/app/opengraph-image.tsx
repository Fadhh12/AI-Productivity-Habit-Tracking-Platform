import { ImageResponse } from 'next/og';

export const alt = 'Continuum: kebiasaan baik tanpa rasa bersalah';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Preview card shown when the link is shared on WhatsApp, Instagram, X and similar. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: 'radial-gradient(circle at 85% 20%, #2B3300 0%, #0F1015 55%)',
          color: '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              background: '#CCFF00',
              color: '#16171D',
              fontSize: 36,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            C
          </div>
          <div style={{ fontSize: 40, fontWeight: 700 }}>Continuum</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 88, fontWeight: 700, lineHeight: 1.02, letterSpacing: -3, maxWidth: 900 }}>
            Kebiasaan baik, tanpa rasa bersalah.
          </div>
          <div style={{ fontSize: 32, color: 'rgba(255,255,255,0.65)' }}>
            Habit tracker dengan AI coach. Bolos sehari bukan kegagalan.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
