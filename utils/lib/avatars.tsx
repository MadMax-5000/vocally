import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────
//  AVATAR SPHERE SYSTEM
//  10 AI Agent identities — each a distinct visual world.
//  Usage:  <OmarIcon size={48} />          (just the sphere, icon-sized)
//          <OmarCard />                     (full agent card, 192px sphere)
//          <AvatarShowcase />               (default export, all 10 in a grid)
// ─────────────────────────────────────────────────────────────────────────────

const NOISE_URL =
  "url('https://eleven-public-cdn.elevenlabs.io/marketing_website/_next/static/media/noise.24b8225d.png')";

// ─── Config type ──────────────────────────────────────────────────────────────

interface SphereConfig {
  id: string;
  en: string;
  ar: string;
  role: string;
  glow: string;
  sphere: string;
  ring: string;
  cardBg: string;
  nameColor: string;
  subColor: string;
}

// ─────────────────────────────────────────────────────────────────────────────
//  SPHERE DEFINITIONS — each is a hand-crafted gradient world
// ─────────────────────────────────────────────────────────────────────────────

/**
 * عمر — Omar
 * The Strategist · Copper Earth
 * Warm bronze core, glowing copper midtones, dark clay shadows. Untouchable.
 */
const OMAR: SphereConfig = {
  id: 'omar', en: 'Omar', ar: 'عمر', role: 'Strategic Advisor',
  cardBg: '#080400',
  nameColor: '#E89840',
  subColor: 'rgba(220,150,60,0.55)',
  ring: 'rgba(200,130,40,0.25)',
  glow: `radial-gradient(circle at 30% 40%, #D08020 0%, transparent 60%),
         radial-gradient(circle at 70% 60%, #E8A040 0%, transparent 55%)`,
  sphere: `
    radial-gradient(circle at 29% 23%, rgba(255,230,180,0.65) 0%, transparent 18%),
    radial-gradient(circle at 26% 42%, rgba(220,150,40,1)     0%, transparent 42%),
    radial-gradient(circle at 70% 28%, rgba(180,100,20,0.95)  0%, transparent 44%),
    radial-gradient(circle at 68% 70%, rgba(80,40,10,0.95)    0%, transparent 44%),
    radial-gradient(circle at 32% 72%, rgba(200,130,30,0.85)  0%, transparent 38%),
    radial-gradient(circle at 50% 50%, rgba(40,20,5,0.5)      0%, transparent 55%),
    radial-gradient(circle at 70% 76%, rgba(0,0,0,0.7)        0%, transparent 32%),
    conic-gradient(from 190deg at 47% 56%,
      #1A0A00, #3D1A00, #7A3500, #B86020, #E8A040,
      #CC8020, #5A2800, #1A0A00)`,
};

/**
 * لينا — Lina
 * The Healer · Jungle & Emerald
 * Toxic lime veins through deep forest, ancient and alive.
 */
const LINA: SphereConfig = {
  id: 'lina', en: 'Lina', ar: 'لينا', role: 'Wellness Companion',
  cardBg: '#00100200',
  nameColor: '#50FF88',
  subColor: 'rgba(60,255,120,0.5)',
  ring: 'rgba(0,220,80,0.2)',
  glow: `radial-gradient(circle at 35% 45%, #00C050 0%, transparent 55%),
         radial-gradient(circle at 65% 55%, #80FF20 0%, transparent 50%)`,
  sphere: `
    radial-gradient(circle at 28% 22%, rgba(210,255,220,0.6)  0%, transparent 20%),
    radial-gradient(circle at 24% 44%, rgba(0,200,70,1)       0%, transparent 44%),
    radial-gradient(circle at 70% 26%, rgba(100,255,20,0.9)   0%, transparent 42%),
    radial-gradient(circle at 70% 68%, rgba(0,80,20,0.95)     0%, transparent 44%),
    radial-gradient(circle at 33% 72%, rgba(0,160,60,0.85)    0%, transparent 38%),
    radial-gradient(circle at 52% 48%, rgba(0,40,10,0.4)      0%, transparent 50%),
    radial-gradient(circle at 70% 76%, rgba(0,0,0,0.55)       0%, transparent 32%),
    conic-gradient(from 110deg at 45% 56%,
      #001A00, #004010, #008030, #30CC50, #90FF30,
      #00B040, #005020, #001A00)`,
};

/**
 * نور — Nour  ("light")
 * The Visionary · Magenta Nebula
 * Electric magenta core, hot pink midtones, deep violet edges. No blue.
 */
const NOUR: SphereConfig = {
  id: 'nour', en: 'Nour', ar: 'نور', role: 'Knowledge Navigator',
  cardBg: '#080004',
  nameColor: '#FF50C0',
  subColor: 'rgba(255,60,180,0.55)',
  ring: 'rgba(255,0,150,0.3)',
  glow: `radial-gradient(circle at 35% 38%, #FF0088 0%, transparent 55%),
         radial-gradient(circle at 62% 60%, #CC00FF 0%, transparent 50%)`,
  sphere: `
    radial-gradient(circle at 30% 21%, rgba(255,220,240,0.65) 0%, transparent 22%),
    radial-gradient(circle at 26% 44%, rgba(255,0,120,0.95)   0%, transparent 42%),
    radial-gradient(circle at 70% 26%, rgba(200,0,255,0.9)    0%, transparent 42%),
    radial-gradient(circle at 68% 68%, rgba(120,0,80,0.95)    0%, transparent 44%),
    radial-gradient(circle at 32% 72%, rgba(255,50,200,0.8)   0%, transparent 38%),
    radial-gradient(circle at 50% 45%, rgba(60,0,30,0.3)      0%, transparent 50%),
    radial-gradient(circle at 70% 76%, rgba(0,0,0,0.75)       0%, transparent 36%),
    conic-gradient(from 60deg at 48% 55%,
      #1A0020, #4A0040, #A00070, #FF0090, #FF40C0,
      #D00080, #380030, #1A0020)`,
};

/**
 * زياد — Ziad
 * The Analyst · Teal Abyss
 * Deep teal core, bright cyan midtones, mint highlights. No purple or indigo.
 */
const ZIAD: SphereConfig = {
  id: 'ziad', en: 'Ziad', ar: 'زياد', role: 'Data Intelligence',
  cardBg: '#000A08',
  nameColor: '#30E0C0',
  subColor: 'rgba(40,220,180,0.55)',
  ring: 'rgba(0,200,160,0.25)',
  glow: `radial-gradient(circle at 35% 40%, #00C080 0%, transparent 55%),
         radial-gradient(circle at 65% 60%, #00E0D0 0%, transparent 50%)`,
  sphere: `
    radial-gradient(circle at 28% 22%, rgba(180,255,240,0.55) 0%, transparent 20%),
    radial-gradient(circle at 24% 44%, rgba(0,200,120,0.95)   0%, transparent 44%),
    radial-gradient(circle at 70% 26%, rgba(0,160,180,0.9)    0%, transparent 42%),
    radial-gradient(circle at 68% 68%, rgba(0,80,60,1)        0%, transparent 44%),
    radial-gradient(circle at 32% 72%, rgba(0,220,200,0.7)    0%, transparent 36%),
    radial-gradient(circle at 55% 50%, rgba(0,40,30,0.35)     0%, transparent 50%),
    radial-gradient(circle at 70% 76%, rgba(0,0,0,0.65)       0%, transparent 36%),
    conic-gradient(from 205deg at 47% 56%,
      #001A10, #003A28, #006850, #00A880, #00D0B0,
      #009070, #004030, #001A10)`,
};

/**
 * ريما — Rima
 * The Empath · Cherry Blossom & Rose Dawn
 * Whisper-pink petals, warm peach blush, soft magenta depth. Tender.
 */
const RIMA: SphereConfig = {
  id: 'rima', en: 'Rima', ar: 'ريما', role: 'Emotional Intelligence',
  cardBg: '#0F0005',
  nameColor: '#FF90C0',
  subColor: 'rgba(255,130,170,0.5)',
  ring: 'rgba(255,80,150,0.2)',
  glow: `radial-gradient(circle at 35% 40%, #FF4090 0%, transparent 55%),
         radial-gradient(circle at 65% 55%, #FF9060 0%, transparent 50%)`,
  sphere: `
    radial-gradient(circle at 28% 22%, rgba(255,255,240,0.7)  0%, transparent 22%),
    radial-gradient(circle at 25% 42%, rgba(255,140,180,0.95) 0%, transparent 44%),
    radial-gradient(circle at 70% 26%, rgba(255,50,110,0.9)   0%, transparent 42%),
    radial-gradient(circle at 70% 70%, rgba(180,10,60,0.95)   0%, transparent 44%),
    radial-gradient(circle at 33% 72%, rgba(255,170,120,0.8)  0%, transparent 38%),
    radial-gradient(circle at 52% 46%, rgba(60,0,20,0.3)      0%, transparent 50%),
    radial-gradient(circle at 70% 76%, rgba(0,0,0,0.55)       0%, transparent 32%),
    conic-gradient(from 155deg at 46% 55%,
      #4A0018, #920030, #F0005A, #FF70A0, #FFA070,
      #DD0060, #700028, #4A0018)`,
};

/**
 * خالد — Khalid
 * The Engineer · Solar Forge
 * Blazing nuclear core, white-hot center, amber corona, magma edges.
 */
const KHALID: SphereConfig = {
  id: 'khalid', en: 'Khalid', ar: 'خالد', role: 'Systems Architect',
  cardBg: '#0D0700',
  nameColor: '#FFD040',
  subColor: 'rgba(255,200,50,0.5)',
  ring: 'rgba(255,180,0,0.25)',
  glow: `radial-gradient(circle at 40% 38%, #FFCC00 0%, transparent 55%),
         radial-gradient(circle at 62% 60%, #FF7700 0%, transparent 50%)`,
  sphere: `
    radial-gradient(circle at 30% 21%, rgba(255,255,230,0.85) 0%, transparent 24%),
    radial-gradient(circle at 28% 40%, rgba(255,230,0,0.95)   0%, transparent 42%),
    radial-gradient(circle at 68% 26%, rgba(255,140,0,0.95)   0%, transparent 44%),
    radial-gradient(circle at 70% 68%, rgba(180,50,0,0.95)    0%, transparent 44%),
    radial-gradient(circle at 33% 72%, rgba(255,180,0,0.85)   0%, transparent 38%),
    radial-gradient(circle at 52% 50%, rgba(255,255,200,0.12) 0%, transparent 35%),
    radial-gradient(circle at 70% 76%, rgba(0,0,0,0.6)        0%, transparent 32%),
    conic-gradient(from 248deg at 47% 56%,
      #301000, #702000, #CC5000, #FFAA00, #FFE800,
      #FF7000, #AA3000, #301000)`,
};

/**
 * سناء — Sana
 * The Creator · Solar Aurora
 * Burnt orange core, neon coral midtones, magenta corona. No blue.
 */
const SANA: SphereConfig = {
  id: 'sana', en: 'Sana', ar: 'سناء', role: 'Creative Intelligence',
  cardBg: '#0A0400',
  nameColor: '#FF8050',
  subColor: 'rgba(255,120,60,0.55)',
  ring: 'rgba(255,100,50,0.25)',
  glow: `radial-gradient(circle at 35% 40%, #FF5000 0%, transparent 55%),
         radial-gradient(circle at 62% 55%, #FF0080 0%, transparent 50%)`,
  sphere: `
    radial-gradient(circle at 28% 22%, rgba(255,240,220,0.6)  0%, transparent 22%),
    radial-gradient(circle at 24% 44%, rgba(255,100,0,0.95)   0%, transparent 44%),
    radial-gradient(circle at 70% 26%, rgba(255,0,80,0.85)    0%, transparent 42%),
    radial-gradient(circle at 68% 68%, rgba(140,20,0,0.95)    0%, transparent 44%),
    radial-gradient(circle at 33% 72%, rgba(255,150,60,0.8)   0%, transparent 38%),
    radial-gradient(circle at 52% 46%, rgba(60,10,0,0.3)      0%, transparent 50%),
    radial-gradient(circle at 70% 76%, rgba(0,0,0,0.6)        0%, transparent 36%),
    conic-gradient(from 75deg at 47% 55%,
      #2A0800, #601800, #B03000, #FF6000, #FF4070,
      #D00050, #4A1000, #2A0800)`,
};

/**
 * طارق — Tariq
 * The Guardian · Liquid Mercury & Obsidian
 * Cold platinum surface, molten chrome highlight, void black depths. Immovable.
 */
const TARIQ: SphereConfig = {
  id: 'tariq', en: 'Tariq', ar: 'طارق', role: 'Security & Trust',
  cardBg: '#040406',
  nameColor: '#B0B8C8',
  subColor: 'rgba(160,172,190,0.5)',
  ring: 'rgba(200,210,220,0.2)',
  glow: `radial-gradient(circle at 35% 38%, #808898 0%, transparent 55%),
         radial-gradient(circle at 60% 60%, #303040 0%, transparent 50%)`,
  sphere: `
    radial-gradient(circle at 30% 21%, rgba(255,255,255,0.92) 0%, transparent 24%),
    radial-gradient(circle at 28% 40%, rgba(210,215,225,0.95) 0%, transparent 42%),
    radial-gradient(circle at 70% 26%, rgba(155,165,180,0.95) 0%, transparent 42%),
    radial-gradient(circle at 68% 68%, rgba(25,28,36,1)       0%, transparent 44%),
    radial-gradient(circle at 33% 72%, rgba(100,108,120,0.8)  0%, transparent 38%),
    radial-gradient(circle at 52% 50%, rgba(180,188,200,0.15) 0%, transparent 40%),
    radial-gradient(circle at 70% 76%, rgba(0,0,0,0.8)        0%, transparent 36%),
    conic-gradient(from 315deg at 46% 55%,
      #060608, #14151C, #28293A, #46485A, #808898,
      #3C3E50, #0E0F14, #060608)`,
};

/**
 * ياسمين — Yasmin
 * The Dreamer · Midnight Bloom & Violet Mist
 * Deep indigo dusk, soft lavender petals, ghostly lilac haze. Otherworldly.
 */
const YASMIN: SphereConfig = {
  id: 'yasmin', en: 'Yasmin', ar: 'ياسمين', role: 'Dream Weaver',
  cardBg: '#060010',
  nameColor: '#C080FF',
  subColor: 'rgba(190,120,255,0.5)',
  ring: 'rgba(160,80,255,0.25)',
  glow: `radial-gradient(circle at 35% 42%, #7000CC 0%, transparent 55%),
         radial-gradient(circle at 62% 55%, #FF60CC 0%, transparent 48%)`,
  sphere: `
    radial-gradient(circle at 28% 22%, rgba(255,245,255,0.7)  0%, transparent 22%),
    radial-gradient(circle at 25% 42%, rgba(190,100,255,0.9)  0%, transparent 44%),
    radial-gradient(circle at 70% 26%, rgba(255,120,220,0.85) 0%, transparent 42%),
    radial-gradient(circle at 68% 68%, rgba(60,0,130,0.95)    0%, transparent 44%),
    radial-gradient(circle at 33% 72%, rgba(220,160,255,0.8)  0%, transparent 38%),
    radial-gradient(circle at 52% 46%, rgba(30,0,60,0.3)      0%, transparent 50%),
    radial-gradient(circle at 70% 76%, rgba(0,0,0,0.6)        0%, transparent 32%),
    conic-gradient(from 125deg at 47% 55%,
      #18002A, #380060, #6A00B0, #B040FF, #FF80EE,
      #A020D0, #2C0050, #18002A)`,
};

/**
 * فارس — Faris
 * The Warrior · Thunderstorm
 * Deep navy core, electric cobalt midtones, yellow lightning strikes. Pure blue.
 */
const FARIS: SphereConfig = {
  id: 'faris', en: 'Faris', ar: 'فارس', role: 'Combat Intelligence',
  cardBg: '#01030F',
  nameColor: '#4080FF',
  subColor: 'rgba(60,120,255,0.55)',
  ring: 'rgba(40,80,255,0.3)',
  glow: `radial-gradient(circle at 35% 38%, #1040FF 0%, transparent 52%),
         radial-gradient(circle at 60% 60%, #0020A0 0%, transparent 50%),
         radial-gradient(circle at 50% 22%, #FFE000 0%, transparent 30%)`,
  sphere: `
    radial-gradient(circle at 28% 22%, rgba(200,220,255,0.6)  0%, transparent 20%),
    radial-gradient(circle at 55% 25%, rgba(255,240,0,0.75)   0%, transparent 22%),
    radial-gradient(circle at 26% 44%, rgba(0,60,255,0.95)    0%, transparent 44%),
    radial-gradient(circle at 70% 26%, rgba(0,20,160,0.9)     0%, transparent 42%),
    radial-gradient(circle at 68% 68%, rgba(0,10,80,1)        0%, transparent 44%),
    radial-gradient(circle at 34% 70%, rgba(0,120,255,0.7)    0%, transparent 36%),
    radial-gradient(circle at 70% 76%, rgba(0,0,0,0.75)       0%, transparent 36%),
    conic-gradient(from 295deg at 47% 56%,
      #000820, #001050, #0030C0, #0060FF, #3050FF,
      #180090, #050030, #000820)`,
};

// ─── All configs in order ────────────────────────────────────────────────────

const ALL_AGENTS: SphereConfig[] = [
  OMAR, LINA, NOUR, ZIAD, RIMA, KHALID, SANA, TARIQ, YASMIN, FARIS,
];

// ─────────────────────────────────────────────────────────────────────────────
//  EXPORTED DATA (for AgentDetailAgentTab consumption)
// ─────────────────────────────────────────────────────────────────────────────

export const AVATAR_DATA = ALL_AGENTS;

export function AnimatedAvatar({ avatar, size = 28 }: { avatar: SphereConfig; size?: number }) {
  return <SphereRender cfg={avatar} size={size} />;
}

// ─────────────────────────────────────────────────────────────────────────────
//  RENDER PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

const layer: React.CSSProperties = {
  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
};

function SphereRender({ cfg, size }: { cfg: SphereConfig; size: number }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
      {/* Layer 1 — Blurred glow backdrop */}
      <div style={{ ...layer, background: cfg.glow, filter: 'blur(16px)', transform: 'scale(1.25)' }} />
      {/* Layer 2 — Main sphere gradients */}
      <div style={{ ...layer, background: cfg.sphere }} />
      {/* Layer 3 — Grain noise overlay */}
      <div style={{
        ...layer,
        mixBlendMode: 'overlay',
        opacity: 0.52,
        backgroundImage: NOISE_URL,
        backgroundSize: '256px',
        imageRendering: 'pixelated',
      } as React.CSSProperties} />
      {/* Layer 4 — Inner edge ring */}
      <div style={{ ...layer, borderRadius: '50%', boxShadow: `inset 0 0 0 1px ${cfg.ring}`, pointerEvents: 'none' }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  NAMED ICON EXPORTS  (drop these anywhere — size prop in px, default 48)
// ─────────────────────────────────────────────────────────────────────────────

interface IconProps { size?: number; style?: React.CSSProperties }

export const OmarIcon   = ({ size = 48, style }: IconProps) => <div style={style}><SphereRender cfg={OMAR}   size={size} /></div>;
export const LinaIcon   = ({ size = 48, style }: IconProps) => <div style={style}><SphereRender cfg={LINA}   size={size} /></div>;
export const NourIcon   = ({ size = 48, style }: IconProps) => <div style={style}><SphereRender cfg={NOUR}   size={size} /></div>;
export const ZiadIcon   = ({ size = 48, style }: IconProps) => <div style={style}><SphereRender cfg={ZIAD}   size={size} /></div>;
export const RimaIcon   = ({ size = 48, style }: IconProps) => <div style={style}><SphereRender cfg={RIMA}   size={size} /></div>;
export const KhalidIcon = ({ size = 48, style }: IconProps) => <div style={style}><SphereRender cfg={KHALID} size={size} /></div>;
export const SanaIcon   = ({ size = 48, style }: IconProps) => <div style={style}><SphereRender cfg={SANA}   size={size} /></div>;
export const TariqIcon  = ({ size = 48, style }: IconProps) => <div style={style}><SphereRender cfg={TARIQ}  size={size} /></div>;
export const YasminIcon = ({ size = 48, style }: IconProps) => <div style={style}><SphereRender cfg={YASMIN} size={size} /></div>;
export const FarisIcon  = ({ size = 48, style }: IconProps) => <div style={style}><SphereRender cfg={FARIS}  size={size} /></div>;

// ─────────────────────────────────────────────────────────────────────────────
//  AGENT CARD  (full presentation card with name + role)
// ─────────────────────────────────────────────────────────────────────────────

interface CardProps { size?: number }

function AgentCard({ cfg, size = 192 }: { cfg: SphereConfig; size?: number }) {
  return (
    <div style={{
      background: cfg.cardBg,
      padding: '32px 36px 28px',
      borderRadius: 22,
      border: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxShadow: '0 8px 48px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)',
      gap: 0,
      width: 'fit-content',
    }}>
      <SphereRender cfg={cfg} size={size} />
      <p style={{
        margin: '20px 0 0',
        fontSize: 22,
        fontWeight: 400,
        color: cfg.nameColor,
        fontFamily: '"Georgia", "Times New Roman", serif',
        letterSpacing: '0.04em',
        direction: 'rtl',
      }}>
        {cfg.ar}
      </p>
      <p style={{
        margin: '5px 0 0',
        fontSize: 11,
        fontWeight: 500,
        color: cfg.subColor,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        fontFamily: 'system-ui, sans-serif',
      }}>
        {cfg.role}
      </p>
    </div>
  );
}

export const OmarCard   = ({ size }: CardProps) => <AgentCard cfg={OMAR}   size={size} />;
export const LinaCard   = ({ size }: CardProps) => <AgentCard cfg={LINA}   size={size} />;
export const NourCard   = ({ size }: CardProps) => <AgentCard cfg={NOUR}   size={size} />;
export const ZiadCard   = ({ size }: CardProps) => <AgentCard cfg={ZIAD}   size={size} />;
export const RimaCard   = ({ size }: CardProps) => <AgentCard cfg={RIMA}   size={size} />;
export const KhalidCard = ({ size }: CardProps) => <AgentCard cfg={KHALID} size={size} />;
export const SanaCard   = ({ size }: CardProps) => <AgentCard cfg={SANA}   size={size} />;
export const TariqCard  = ({ size }: CardProps) => <AgentCard cfg={TARIQ}  size={size} />;
export const YasminCard = ({ size }: CardProps) => <AgentCard cfg={YASMIN} size={size} />;
export const FarisCard  = ({ size }: CardProps) => <AgentCard cfg={FARIS}  size={size} />;

// ─────────────────────────────────────────────────────────────────────────────
//  SHOWCASE  (default export — visual grid of all 10 agents)
// ─────────────────────────────────────────────────────────────────────────────

export default function AvatarShowcase() {
  return (
    <div style={{
      background: '#08080E',
      minHeight: '100vh',
      padding: '60px 40px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <h1 style={{
          margin: 0,
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.3)',
        }}>
          AI Agent Roster
        </h1>
        <p style={{
          margin: '12px 0 0',
          fontSize: 32,
          fontWeight: 300,
          color: 'rgba(255,255,255,0.85)',
          letterSpacing: '0.02em',
          fontFamily: '"Georgia", serif',
          direction: 'rtl',
        }}>
          وكلاء الذكاء الاصطناعي
        </p>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 24,
        maxWidth: 1200,
        margin: '0 auto',
      }}>
        {ALL_AGENTS.map((cfg) => (
          <AgentCard key={cfg.en} cfg={cfg} size={160} />
        ))}
      </div>

      {/* Usage hint */}
      <div style={{
        marginTop: 64,
        textAlign: 'center',
        fontSize: 12,
        color: 'rgba(255,255,255,0.18)',
        letterSpacing: '0.08em',
        fontFamily: 'monospace',
      }}>
        import {'{ OmarIcon, LinaIcon, NourIcon … }'} from './avatars'
      </div>
    </div>
  );
}