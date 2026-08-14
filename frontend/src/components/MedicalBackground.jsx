export default function MedicalBackground({ variant = 'full' }) {
  // --- 1. FULL VARIANT PARAMETERS (Home Page Hero) ---
  // Symmetrical compact blood drop path centered at x=500, y=330 (width=110, height=155)
  const dropPath = "M 500 230 C 500 230, 555 285, 555 330 C 555 360, 530 385, 500 385 C 470 385, 445 360, 445 330 C 445 285, 500 230, 500 230 Z";
  
  // ECG wave centered at y=330, connecting to drop left boundary (x=447) and right boundary (x=553)
  const ecgPathFull = "M 0 330 L 150 330 L 160 310 L 170 350 L 180 330 L 260 330 L 270 280 L 285 380 L 300 330 L 310 345 L 320 330 L 447 330 M 553 330 L 680 330 L 690 310 L 700 350 L 710 330 L 790 330 L 800 280 L 815 385 L 830 330 L 840 345 L 850 330 L 1000 330";

  // --- 2. SIMPLE VARIANT PARAMETERS (Other Public Pages & Dashboards) ---
  const ecgPathSimple = "M 0 50 L 120 50 L 130 42 L 140 58 L 150 50 L 240 50 L 250 25 L 262 75 L 274 50 L 284 56 L 294 50 L 440 50 L 450 42 L 460 58 L 470 50 L 600 50 L 610 25 L 622 75 L 634 50 L 644 56 L 654 50 L 780 50 L 790 42 L 800 58 L 810 50 L 1000 50";

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Subtle medical grid background */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(198,40,40,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(198,40,40,0.045)_1px,transparent_1px)] bg-[size:60px_60px]"
        aria-hidden="true"
      />
      
      {/* Ambient gradient overlay */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-slate-50/60" />

      {variant === 'simple' ? (
        // --- SIMPLE ECG LAYOUT (Thin, slow, small amplitude, no central illustration) ---
        <div className="absolute top-16 left-0 w-full h-[100px] opacity-75">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 1000 100"
            preserveAspectRatio="xMidYMid slice"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d={ecgPathSimple}
              fill="none"
              stroke="rgba(198, 40, 40, 0.12)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={ecgPathSimple}
              fill="none"
              stroke="rgba(198, 40, 40, 0.65)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-ecg-travel-simple"
              style={{
                strokeDasharray: '80 1000',
                animation: 'ecg-travel-simple 9.5s linear infinite',
              }}
            />
          </svg>
        </div>
      ) : (
        // --- FULL ECG HERO LAYOUT (Centered compact blood drop with internal ECG) ---
        <div className="absolute top-16 left-0 w-full h-[600px] opacity-90">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 1000 600"
            preserveAspectRatio="xMidYMid slice"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Glossy 3D radial red gradient for the blood drop */}
              <radialGradient id="drop-grad" cx="45%" cy="35%" r="60%" fx="35%" fy="30%">
                <stop offset="0%" stopColor="#FF5252" />
                <stop offset="45%" stopColor="#D32F2F" />
                <stop offset="100%" stopColor="#7B0C0C" />
              </radialGradient>
            </defs>

            {/* Base inactive ECG line */}
            <path
              d={ecgPathFull}
              fill="none"
              stroke="rgba(198, 40, 40, 0.15)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Animated active traveling ECG highlight */}
            <path
              d={ecgPathFull}
              fill="none"
              stroke="#C62828"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-ecg-travel"
              style={{
                strokeDasharray: '150 1000',
                animation: 'ecg-travel 5s linear infinite, ecg-glow 5s linear infinite',
              }}
            />

            {/* BLOOD DROP GROUP (pulses on heartbeat contact) */}
            <g
              className="animate-heart-pulse"
              style={{
                transformOrigin: '500px 330px',
                animation: 'heart-pulse 5s ease-in-out infinite',
              }}
            >
              {/* Glossy Blood Drop shape */}
              <path
                d={dropPath}
                fill="url(#drop-grad)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-heart-outline"
                style={{
                  animation: 'heart-outline-glow 5s ease-in-out infinite',
                }}
              />

              {/* White ECG wave inside the drop */}
              <path
                d="M 452 330 L 474 330 L 481 310 L 493 360 L 504 330 L 512 340 L 520 330 L 548 330"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </svg>
        </div>
      )}

      {/* Global CSS Animations style block */}
      <style>{`
        @keyframes ecg-travel {
          0% {
            stroke-dashoffset: 1150;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        @keyframes ecg-travel-simple {
          0% {
            stroke-dashoffset: 1080;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        @keyframes ecg-glow {
          0%, 34% {
            stroke-width: 3.5;
            stroke: #C62828;
            filter: none;
          }
          37%, 60% {
            stroke-width: 4.5;
            stroke: #FF0000;
            filter: drop-shadow(0 0 4px rgba(255, 0, 0, 0.75));
          }
          63%, 100% {
            stroke-width: 3.5;
            stroke: #C62828;
            filter: none;
          }
        }

        @keyframes heart-pulse {
          0%, 36% {
            transform: scale(1);
          }
          41% {
            transform: scale(1.05);
          }
          45% {
            transform: scale(1.01);
          }
          50% {
            transform: scale(1.07);
          }
          57% {
            transform: scale(1);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes heart-outline-glow {
          0%, 36% {
            stroke: rgba(198, 40, 40, 0.3);
            filter: none;
          }
          37% {
            stroke: #C62828;
          }
          41% {
            stroke: #FF0000;
            filter: drop-shadow(0 0 6px rgba(255, 0, 0, 0.65));
          }
          45% {
            stroke: #C62828;
          }
          50% {
            stroke: #FF0000;
            filter: drop-shadow(0 0 8px rgba(255, 0, 0, 0.75));
          }
          57% {
            stroke: #C62828;
            filter: drop-shadow(0 0 3px rgba(198, 40, 40, 0.2));
          }
          64%, 100% {
            stroke: rgba(198, 40, 40, 0.3);
            filter: none;
          }
        }

        /* Support prefers-reduced-motion for page accessibility */
        @media (prefers-reduced-motion: reduce) {
          .animate-ecg-travel {
            animation: none !important;
            stroke-dashoffset: 500 !important;
            stroke: rgba(198, 40, 40, 0.25) !important;
          }
          .animate-ecg-travel-simple {
            animation: none !important;
            stroke-dashoffset: 500 !important;
            stroke: rgba(198, 40, 40, 0.2) !important;
          }
          .animate-heart-pulse {
            animation: none !important;
            transform: scale(1) !important;
          }
          .animate-heart-outline {
            animation: none !important;
            stroke: rgba(198, 40, 40, 0.35) !important;
          }
        }
      `}</style>
    </div>
  );
}
