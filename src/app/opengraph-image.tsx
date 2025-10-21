import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
export const alt = 'Gemai - AI-Powered Instagram DM Automation'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'
 
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Decorative elements */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.15) 0%, transparent 50%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 80% 50%, rgba(118, 75, 162, 0.15) 0%, transparent 50%)',
          }}
        />

        {/* Logo Icon */}
        <div
          style={{
            fontSize: 120,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            width: 160,
            height: 160,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            borderRadius: '32px',
            marginBottom: '40px',
            boxShadow: '0 20px 60px rgba(102, 126, 234, 0.4)',
          }}
        >
          G
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            color: 'transparent',
            marginBottom: '20px',
            letterSpacing: '-0.02em',
          }}
        >
          GEMAI
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: '900px',
            lineHeight: 1.4,
          }}
        >
          Transform Instagram DMs into Revenue with AI
        </div>

        {/* Features */}
        <div
          style={{
            display: 'flex',
            gap: '40px',
            marginTop: '40px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#667eea',
              }}
            />
            <span style={{ color: '#cbd5e1', fontSize: 20 }}>24/7 Automation</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#764ba2',
              }}
            />
            <span style={{ color: '#cbd5e1', fontSize: 20 }}>AI-Powered</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#667eea',
              }}
            />
            <span style={{ color: '#cbd5e1', fontSize: 20 }}>Free Plan</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
