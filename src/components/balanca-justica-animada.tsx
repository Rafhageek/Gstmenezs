/**
 * Balança da justiça animada — elemento visual temático para advocacia.
 * SVG puro + CSS keyframes (sem dependências). Oscilação suave de 4s.
 *
 * Dourado translúcido — usado como elemento de fundo/ambiente na tela
 * de login. Não precisa ser interativo.
 */
export function BalancaJusticaAnimada({
  size = 320,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <>
      <style>{cssBalanca}</style>
      <svg
        width={size}
        height={size}
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className={`balanca-justica ${className}`}
      >
        {/* Pedestal (base) */}
        <rect
          x="160"
          y="340"
          width="80"
          height="14"
          rx="2"
          fill="url(#gradDourado)"
        />
        <rect
          x="175"
          y="325"
          width="50"
          height="16"
          rx="2"
          fill="url(#gradDourado)"
        />

        {/* Coluna central */}
        <rect
          x="196"
          y="100"
          width="8"
          height="230"
          fill="url(#gradDourado)"
        />

        {/* Ornamento superior da coluna */}
        <circle cx="200" cy="94" r="10" fill="url(#gradDourado)" />
        <circle
          cx="200"
          cy="94"
          r="5"
          fill="#0a1628"
          opacity="0.6"
        />

        {/* Grupo da balança que oscila */}
        <g className="balanca-bracos" style={{ transformOrigin: "200px 94px" }}>
          {/* Braço horizontal */}
          <rect
            x="70"
            y="90"
            width="260"
            height="5"
            rx="1"
            fill="url(#gradDourado)"
          />

          {/* Cordas */}
          <line
            x1="90"
            y1="92"
            x2="90"
            y2="150"
            stroke="url(#gradDourado)"
            strokeWidth="1.5"
            opacity="0.8"
          />
          <line
            x1="310"
            y1="92"
            x2="310"
            y2="150"
            stroke="url(#gradDourado)"
            strokeWidth="1.5"
            opacity="0.8"
          />

          {/* Prato esquerdo */}
          <path
            d="M50 150 Q90 175 130 150 L115 158 Q90 167 65 158 Z"
            fill="url(#gradDourado)"
            opacity="0.85"
          />
          <ellipse
            cx="90"
            cy="150"
            rx="40"
            ry="5"
            fill="url(#gradDourado)"
            opacity="0.9"
          />

          {/* Prato direito */}
          <path
            d="M270 150 Q310 175 350 150 L335 158 Q310 167 285 158 Z"
            fill="url(#gradDourado)"
            opacity="0.85"
          />
          <ellipse
            cx="310"
            cy="150"
            rx="40"
            ry="5"
            fill="url(#gradDourado)"
            opacity="0.9"
          />
        </g>

        {/* Ornamento superior (esfera com pico) */}
        <circle cx="200" cy="70" r="6" fill="url(#gradDourado)" />
        <path
          d="M200 48 L205 62 L200 58 L195 62 Z"
          fill="url(#gradDourado)"
        />

        {/* Brilho lateral (shimmer) */}
        <circle
          cx="200"
          cy="200"
          r="180"
          fill="url(#gradShimmer)"
          className="balanca-shimmer"
        />

        {/* Defs: gradientes */}
        <defs>
          <linearGradient
            id="gradDourado"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#e6c98a" />
            <stop offset="50%" stopColor="#c9a961" />
            <stop offset="100%" stopColor="#8b6a2e" />
          </linearGradient>
          <radialGradient id="gradShimmer" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c9a961" stopOpacity="0.12" />
            <stop offset="70%" stopColor="#c9a961" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </>
  );
}

const cssBalanca = `
@keyframes balanca-oscilar {
  0%, 100% { transform: rotate(-2.2deg); }
  50%      { transform: rotate(2.2deg); }
}
@keyframes balanca-pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50%      { opacity: 1; transform: scale(1.08); }
}
@keyframes balanca-entrar {
  0%   { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}

.balanca-justica {
  animation: balanca-entrar 900ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.balanca-justica .balanca-bracos {
  animation: balanca-oscilar 4.8s ease-in-out infinite;
  transform-box: fill-box;
}

.balanca-justica .balanca-shimmer {
  transform-origin: center;
  animation: balanca-pulse 6s ease-in-out infinite;
  transform-box: view-box;
}

@media (prefers-reduced-motion: reduce) {
  .balanca-justica .balanca-bracos,
  .balanca-justica .balanca-shimmer,
  .balanca-justica {
    animation: none !important;
  }
}
`;
