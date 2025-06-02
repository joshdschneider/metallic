type IconPanelProps = {
  size?: '1';
  children: React.ReactNode;
};

export function IconPanel({ size, children }: IconPanelProps) {
  return (
    <div className={`IconPanel size-${size || '1'}`}>
      <svg className="IconPanelBackground" fill="none" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <g filter="url(#:r1a:-shadow)">
          <rect
            fill="var(--color-background)"
            fillOpacity="0.01"
            height="63.5"
            rx="15"
            width="63.5"
            x="8.25"
            y="8.25"
          ></rect>
        </g>
        <rect fill="url(#:r1a:-gradient)" height="64" rx="15" width="64" x="8" y="8"></rect>
        <defs>
          <filter
            colorInterpolationFilters="sRGB"
            filterUnits="userSpaceOnUse"
            height="69"
            id=":r1a:-shadow"
            width="67.5"
            x="6.25"
            y="6.75"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
            <feColorMatrix
              in="SourceAlpha"
              result="hardAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            ></feColorMatrix>
            <feMorphology in="SourceAlpha" operator="erode" radius="1" result=":r1a:-effect-1"></feMorphology>
            <feOffset dy="2"></feOffset>
            <feGaussianBlur stdDeviation="1.5"></feGaussianBlur>
            <feComposite in2="hardAlpha" operator="out"></feComposite>
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0"></feColorMatrix>
            <feBlend in2="BackgroundImageFix" mode="normal" result=":r1a:-effect-1"></feBlend>
            <feColorMatrix
              in="SourceAlpha"
              result="hardAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            ></feColorMatrix>
            <feOffset dy="0.5"></feOffset>
            <feGaussianBlur stdDeviation="1"></feGaussianBlur>
            <feComposite in2="hardAlpha" operator="out"></feComposite>
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.35 0"></feColorMatrix>
            <feBlend in2=":r1a:-effect-1" mode="normal" result=":r1a:-effect-2"></feBlend>
            <feBlend in="SourceGraphic" in2=":r1a:-effect-2" mode="normal" result="shape"></feBlend>
          </filter>
          <linearGradient gradientUnits="userSpaceOnUse" id=":r1a:-gradient" x1="40" x2="40" y1="8" y2="72">
            <stop stopColor="var(--icon-panel-gradient-top)"></stop>
            <stop offset="1" stopColor="var(--icon-panel-gradient-bottom)"></stop>
          </linearGradient>
        </defs>
      </svg>
      <div
        className="IconPanelChildren"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {children}
      </div>
    </div>
  );
}
