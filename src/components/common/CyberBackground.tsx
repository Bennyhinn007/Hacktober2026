'use client';

import React from 'react';

export default function CyberBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none select-none overflow-hidden z-0">
      {/* 1. Precision Cyber Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #0f172a 1px, transparent 1px),
            linear-gradient(to bottom, #0f172a 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* 2. Micro Cyber Intersections (Crosshairs) */}
      <div 
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #0d9488 1.5px, transparent 0)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* 3. Soft Ambient Cyber Glows (Light theme preserving) */}
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-teal-400/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-sky-400/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 right-1/4 w-[700px] h-[700px] bg-indigo-400/4 rounded-full blur-3xl pointer-events-none" />

      {/* 4. Top-Right Circuit Board Vector Graphic */}
      <svg
        className="absolute -top-10 right-0 w-[500px] h-[500px] text-teal-900/[0.045] pointer-events-none"
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M500 50 H380 L320 110 H200 L160 150 V260 L200 300 H300" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
        <path d="M450 0 V120 L390 180 H280 L230 230 V340" stroke="currentColor" strokeWidth="1.5" />
        <path d="M320 110 V200 L260 260 H180" stroke="currentColor" strokeWidth="1" />
        <circle cx="380" cy="50" r="4" fill="currentColor" />
        <circle cx="320" cy="110" r="4" fill="currentColor" />
        <circle cx="200" cy="150" r="3" fill="currentColor" />
        <circle cx="160" cy="260" r="4" fill="currentColor" />
        <circle cx="300" cy="300" r="5" fill="currentColor" />
        <circle cx="390" cy="180" r="4" fill="currentColor" />
        <circle cx="230" cy="340" r="4" fill="currentColor" />
        <circle cx="180" cy="260" r="3" fill="currentColor" />
        {/* Radar Reticle */}
        <circle cx="420" cy="80" r="60" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 6" />
        <circle cx="420" cy="80" r="30" stroke="currentColor" strokeWidth="0.8" />
        <line x1="420" y1="10" x2="420" y2="150" stroke="currentColor" strokeWidth="0.8" />
        <line x1="350" y1="80" x2="490" y2="80" stroke="currentColor" strokeWidth="0.8" />
      </svg>

      {/* 5. Bottom-Left Circuit Board Vector Graphic */}
      <svg
        className="absolute bottom-0 -left-10 w-[550px] h-[550px] text-slate-900/[0.04] pointer-events-none"
        viewBox="0 0 550 550"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M0 450 H120 L180 390 H300 L340 350 V240 L300 200 H200" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 6" />
        <path d="M50 550 V430 L110 370 H220 L270 320 V210" stroke="currentColor" strokeWidth="1.5" />
        <path d="M180 390 V300 L240 240 H320" stroke="currentColor" strokeWidth="1" />
        <circle cx="120" cy="450" r="4" fill="currentColor" />
        <circle cx="180" cy="390" r="4" fill="currentColor" />
        <circle cx="300" cy="350" r="3" fill="currentColor" />
        <circle cx="340" cy="240" r="4" fill="currentColor" />
        <circle cx="200" cy="200" r="5" fill="currentColor" />
        <circle cx="110" cy="370" r="4" fill="currentColor" />
        <circle cx="270" cy="210" r="4" fill="currentColor" />
        {/* Hexagonal Shield Mesh */}
        <polygon points="100,200 130,180 160,200 160,240 130,260 100,240" stroke="currentColor" strokeWidth="1" />
        <polygon points="130,260 160,240 190,260 190,300 160,320 130,300" stroke="currentColor" strokeWidth="1" />
        <polygon points="70,260 100,240 130,260 130,300 100,320 70,300" stroke="currentColor" strokeWidth="1" />
      </svg>

      {/* 6. Subtle Watermark Cybersecurity Codes & Binaries */}
      <div className="absolute top-28 left-8 font-mono text-[10px] text-teal-900/[0.06] leading-relaxed hidden lg:block tracking-widest uppercase">
        <div>SEC_OP // PROTOCOL: TLS_1.3</div>
        <div>CIPHER: AES-256-GCM_SHA384</div>
        <div>FIREWALL: INSPECTING [SYN_FLOOD_OFF]</div>
        <div>AUTH_DIGEST: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</div>
      </div>

      <div className="absolute bottom-20 right-8 font-mono text-[10px] text-slate-900/[0.05] leading-relaxed hidden lg:block text-right tracking-widest uppercase">
        <div>HACKTOBER_2026 // NODE_CLUSTER: GNDEC_BIDAR</div>
        <div>BINARY: 01001000 01000001 01000011 01001011</div>
        <div>CRYPT_VALIDATION: ED25519_ENABLED</div>
        <div>INTEGRITY: 0x8FA4 • CHECK_OK</div>
      </div>

      {/* 7. Ambient Cyber Shield Watermark Outline in Center */}
      <svg
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] text-teal-900/[0.015] pointer-events-none"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeDasharray="1 3"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    </div>
  );
}
