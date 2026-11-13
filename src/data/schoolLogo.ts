/**
 * Official Default School Logo Emblem (High Resolution Vector SVG Data URI)
 * Dignified educational emblem for Pattashi Adarsh High School / AmarSchool ERP
 */
export const DEFAULT_SCHOOL_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <radialGradient id="emblemGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="%231e40af"/>
      <stop offset="75%" stop-color="%231e3a8a"/>
      <stop offset="100%" stop-color="%230f172a"/>
    </radialGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%23fde047"/>
      <stop offset="50%" stop-color="%23f59e0b"/>
      <stop offset="100%" stop-color="%23d97706"/>
    </linearGradient>
  </defs>
  <!-- Outer Ring with Golden Border -->
  <circle cx="100" cy="100" r="95" fill="url(%23emblemGrad)" stroke="%23f59e0b" stroke-width="5"/>
  <circle cx="100" cy="100" r="86" fill="none" stroke="%23ffffff" stroke-width="1.5" stroke-dasharray="4 2"/>
  <circle cx="100" cy="100" r="82" fill="none" stroke="%23f59e0b" stroke-width="1"/>
  
  <!-- Laurel Leaves (Left & Right Wreath) -->
  <path d="M42 125 C34 95 46 65 65 52 C63 64 68 76 76 84 C62 95 52 110 42 125 Z" fill="url(%23goldGrad)" opacity="0.85"/>
  <path d="M158 125 C166 95 154 65 135 52 C137 64 132 76 124 84 C138 95 148 110 158 125 Z" fill="url(%23goldGrad)" opacity="0.85"/>
  
  <!-- Glowing Sun Rays -->
  <path d="M100 24 L100 36 M82 28 L88 38 M118 28 L112 38 M68 40 L76 48 M132 40 L124 48" stroke="%23fde047" stroke-width="2.5" stroke-linecap="round"/>
  
  <!-- Star of Excellence -->
  <polygon points="100,28 103,37 112,37 105,43 108,52 100,46 92,52 95,43 88,37 97,37" fill="%23fde047"/>
  
  <!-- Open Book of Knowledge -->
  <path d="M52 144 C72 130 92 134 100 142 C108 134 128 130 148 144 L144 104 C124 92 108 96 100 104 C92 96 76 92 56 104 Z" fill="%23ffffff" stroke="%231e3a8a" stroke-width="2"/>
  <path d="M100 104 L100 142" stroke="%231e3a8a" stroke-width="2"/>
  <!-- Book Page Lines -->
  <path d="M64 114 C74 108 86 110 94 116 M64 122 C74 116 86 118 94 124 M64 130 C74 124 86 126 94 132" stroke="%2394a3b8" stroke-width="1.2" stroke-linecap="round"/>
  <path d="M106 116 C114 110 126 108 136 114 M106 124 C114 118 126 116 136 122 M106 132 C114 126 126 124 136 130" stroke="%2394a3b8" stroke-width="1.2" stroke-linecap="round"/>
  
  <!-- Flame / Torch of Light -->
  <path d="M100 58 C94 68 92 76 96 86 C98 84 100 82 100 80 C101 84 104 86 106 88 C108 78 106 68 100 58 Z" fill="%23ef4444"/>
  <path d="M100 66 C97 72 96 76 98 82 C100 80 101 79 101 78 C102 80 103 82 104 83 C105 78 104 72 100 66 Z" fill="%23fde047"/>
  
  <!-- Circular Top Text Arc -->
  <path d="M32 100 A68 68 0 0 1 168 100" fill="none" id="schoolArcTop"/>
  <text font-family="Arial, Helvetica, sans-serif" font-size="8.5" font-weight="bold" fill="%23fde047" letter-spacing="1.2">
    <textPath href="%23schoolArcTop" startOffset="50%" text-anchor="middle">
      PATTASHI ADARSH HIGH SCHOOL
    </textPath>
  </text>
  
  <!-- Bottom Ribbon with EIIN & ESTD -->
  <path d="M48 158 Q100 176 152 158 L148 174 Q100 190 52 174 Z" fill="url(%23goldGrad)" stroke="%23b45309" stroke-width="1"/>
  <text x="100" y="171" font-family="Arial, Helvetica, sans-serif" font-size="8" font-weight="900" fill="%231e1b4b" text-anchor="middle" letter-spacing="0.8">
    EIIN: 102540 • ESTD 1988
  </text>
</svg>`;
