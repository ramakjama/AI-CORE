'use client';

interface LogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
  animated?: boolean;
}

// AIT Logo Icon - Holographic FUI Style
export function AITIcon({ size = 32, className = '', glow = true, animated = false }: LogoProps): React.ReactElement {
  return (
    <>
      <style>{`
        .ait-logo-fui {
          filter: drop-shadow(0 0 8px var(--logo-fill));
          transition: all 0.3s ease;
        }
        .ait-logo-fui:hover {
          filter: drop-shadow(0 0 15px var(--logo-fill)) drop-shadow(0 0 30px rgba(0, 245, 255, 0.4));
          transform: scale(1.05);
        }
        .ait-logo-animated {
          animation: logo-pulse 3s ease-in-out infinite;
        }
        @keyframes logo-pulse {
          0%, 100% { filter: drop-shadow(0 0 8px var(--logo-fill)); }
          50% { filter: drop-shadow(0 0 20px var(--logo-fill)) drop-shadow(0 0 35px rgba(0, 245, 255, 0.5)); }
        }
        .ait-logo-circuit {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: circuit-trace 2s ease-in-out forwards;
        }
        @keyframes circuit-trace {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${glow ? 'ait-logo-fui' : ''} ${animated ? 'ait-logo-animated' : ''} ${className}`}
      >
        {/* Outer Hexagon Frame */}
        <path
          d="M50 5L90 27.5V72.5L50 95L10 72.5V27.5L50 5Z"
          stroke="var(--logo-fill, #00f5ff)"
          strokeWidth="1"
          strokeOpacity="0.3"
          fill="none"
        />

        {/* Inner Circuit Lines */}
        <path
          className="ait-logo-circuit"
          d="M50 15L80 32.5V67.5L50 85L20 67.5V32.5L50 15Z"
          stroke="var(--logo-fill, #00f5ff)"
          strokeWidth="0.5"
          strokeOpacity="0.5"
          fill="none"
        />

        {/* Main A Shape */}
        <path
          d="M50 18L25 82H38L44 66H56L62 82H75L50 18ZM47 54L50 42L53 54H47Z"
          fill="var(--logo-fill, #00f5ff)"
        />

        {/* Tech Accent Lines */}
        <line x1="15" y1="50" x2="25" y2="50" stroke="var(--logo-fill, #00f5ff)" strokeWidth="1" strokeOpacity="0.6"/>
        <line x1="75" y1="50" x2="85" y2="50" stroke="var(--logo-fill, #00f5ff)" strokeWidth="1" strokeOpacity="0.6"/>
        <circle cx="15" cy="50" r="2" fill="var(--logo-fill, #00f5ff)" fillOpacity="0.8"/>
        <circle cx="85" cy="50" r="2" fill="var(--logo-fill, #00f5ff)" fillOpacity="0.8"/>
      </svg>
    </>
  );
}

// AIT Full Logo with Text - FUI Command Style
export function AITLogo({ size = 140, className = '', glow = true }: LogoProps): React.ReactElement {
  return (
    <>
      <style>{`
        .ait-full-logo {
          filter: drop-shadow(0 0 10px var(--logo-fill));
        }
        .ait-full-logo:hover {
          filter: drop-shadow(0 0 20px var(--logo-fill));
        }
        .ait-text-main {
          font-family: 'AIT Nerve Display', sans-serif;
          letter-spacing: 0.2em;
        }
        .ait-text-sub {
          font-family: 'AIT Nerve Mono', monospace;
          letter-spacing: 0.3em;
        }
      `}</style>
      <svg
        width={size}
        height={size * 0.6}
        viewBox="0 0 240 144"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${glow ? 'ait-full-logo' : ''} ${className}`}
      >
        {/* Corner Brackets */}
        <path d="M8 8H24M8 8V24" stroke="var(--logo-fill, #00f5ff)" strokeWidth="2"/>
        <path d="M232 8H216M232 8V24" stroke="var(--logo-fill, #00f5ff)" strokeWidth="2"/>
        <path d="M8 136H24M8 136V120" stroke="var(--logo-fill, #00f5ff)" strokeWidth="2"/>
        <path d="M232 136H216M232 136V120" stroke="var(--logo-fill, #00f5ff)" strokeWidth="2"/>

        {/* Horizontal Lines */}
        <line x1="32" y1="8" x2="100" y2="8" stroke="var(--logo-fill, #00f5ff)" strokeWidth="1" strokeOpacity="0.3"/>
        <line x1="140" y1="8" x2="208" y2="8" stroke="var(--logo-fill, #00f5ff)" strokeWidth="1" strokeOpacity="0.3"/>

        {/* Icon */}
        <g transform="translate(40, 32)">
          <path
            d="M35 0L70 70H55L48 54H22L15 70H0L35 0ZM27 42L35 22L43 42H27Z"
            fill="var(--logo-fill, #00f5ff)"
          />
        </g>

        {/* AIT Text */}
        <text
          x="130"
          y="72"
          className="ait-text-main"
          fontSize="42"
          fontWeight="900"
          fill="var(--logo-fill, #00f5ff)"
        >
          AIT
        </text>

        {/* Divider Line */}
        <line x1="130" y1="82" x2="220" y2="82" stroke="var(--logo-fill, #00f5ff)" strokeWidth="1" strokeOpacity="0.5"/>

        {/* CORE Text */}
        <text
          x="130"
          y="100"
          className="ait-text-sub"
          fontSize="14"
          fontWeight="500"
          fill="var(--logo-fill, #00f5ff)"
          fillOpacity="0.8"
        >
          CORE
        </text>

        {/* Tagline */}
        <text
          x="120"
          y="124"
          className="ait-text-sub"
          fontSize="8"
          fill="var(--logo-fill-muted, #5a9aaa)"
          letterSpacing="0.15em"
        >
          AI INNOVATION TECHNOLOGIES
        </text>

        {/* Status Indicator */}
        <circle cx="220" y="96" r="4" fill="var(--color-success, #00ff88)">
          <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite"/>
        </circle>
        <text x="200" y="100" fontSize="6" fill="var(--color-success, #00ff88)" fontFamily="monospace">ONLINE</text>
      </svg>
    </>
  );
}

// AIT Logo Mark - Square FUI Style
export function AITMark({ size = 48, className = '', glow = true }: LogoProps): React.ReactElement {
  return (
    <>
      <style>{`
        .ait-mark {
          transition: all 0.3s ease;
        }
        .ait-mark:hover {
          transform: scale(1.05);
        }
        .ait-mark-glow {
          filter: drop-shadow(0 0 10px var(--logo-fill));
        }
      `}</style>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`ait-mark ${glow ? 'ait-mark-glow' : ''} ${className}`}
      >
        {/* Background with gradient */}
        <rect
          width="100"
          height="100"
          rx="16"
          fill="var(--color-surface, #0a0f1a)"
          stroke="var(--logo-fill, #00f5ff)"
          strokeWidth="1"
          strokeOpacity="0.4"
        />

        {/* Inner glow */}
        <rect
          x="4"
          y="4"
          width="92"
          height="92"
          rx="14"
          fill="none"
          stroke="var(--logo-fill, #00f5ff)"
          strokeWidth="0.5"
          strokeOpacity="0.2"
        />

        {/* A Icon centered */}
        <g transform="translate(20, 15)">
          <path
            d="M30 0L60 70H48L42 54H18L12 70H0L30 0ZM22 42L30 22L38 42H22Z"
            fill="var(--logo-fill, #00f5ff)"
          />
        </g>

        {/* Corner dots */}
        <circle cx="12" cy="12" r="2" fill="var(--logo-fill, #00f5ff)" fillOpacity="0.6"/>
        <circle cx="88" cy="12" r="2" fill="var(--logo-fill, #00f5ff)" fillOpacity="0.6"/>
        <circle cx="12" cy="88" r="2" fill="var(--logo-fill, #00f5ff)" fillOpacity="0.6"/>
        <circle cx="88" cy="88" r="2" fill="var(--logo-fill, #00f5ff)" fillOpacity="0.6"/>
      </svg>
    </>
  );
}

// Animated Loading Logo
export function AITLoading({ size = 64 }: { size?: number }): React.ReactElement {
  return (
    <>
      <style>{`
        .ait-loading-ring {
          animation: rotate-ring 2s linear infinite;
          transform-origin: center;
        }
        @keyframes rotate-ring {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .ait-loading-pulse {
          animation: pulse-logo 1.5s ease-in-out infinite;
        }
        @keyframes pulse-logo {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Rotating outer ring */}
        <circle
          className="ait-loading-ring"
          cx="50"
          cy="50"
          r="45"
          stroke="var(--color-cyan, #00f5ff)"
          strokeWidth="2"
          strokeDasharray="70 200"
          fill="none"
        />

        {/* Pulsing A */}
        <g className="ait-loading-pulse" transform="translate(25, 25)">
          <path
            d="M25 0L50 50H40L35 40H15L10 50H0L25 0ZM18 32L25 15L32 32H18Z"
            fill="var(--color-cyan, #00f5ff)"
          />
        </g>
      </svg>
    </>
  );
}

// Default export
export default AITIcon;
