import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get('title') || 'NeuralPath — Learn ML, Deep Learning & AI';
  const moduleName = searchParams.get('module') || 'Interactive Curriculum';
  const level = searchParams.get('level') || 'First Principles to Transformers';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0B0E14',
          color: '#EEF1F6',
          padding: '64px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#1D4ED8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 700,
              }}
            >
              N
            </div>
            <span style={{ fontSize: '28px', fontWeight: 700 }}>NeuralPath</span>
          </div>
          <div
            style={{
              padding: '8px 18px',
              borderRadius: '999px',
              backgroundColor: '#172554',
              color: '#93C5FD',
              fontSize: '20px',
              fontWeight: 600,
            }}
          >
            {moduleName}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ fontSize: '56px', fontWeight: 700, lineHeight: 1.15, maxWidth: '1000px' }}>
            {title}
          </div>
          <div style={{ fontSize: '26px', color: '#A6B0C3' }}>
            Interactive Visualizations · In-Browser Python · Quizzes
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #242D3F',
            paddingTop: '24px',
            fontSize: '22px',
            color: '#A6B0C3',
          }}
        >
          <span>Level: {level}</span>
          <span>neuralpath.dev</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

