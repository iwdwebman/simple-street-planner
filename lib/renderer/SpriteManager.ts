// SVG-to-canvas sprite pipeline

const SPRITE_SVGS: Record<string, string> = {
  car: `<svg viewBox="0 0 40 20" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="2" width="40" height="16" rx="4" fill="#3B82F6"/>
    <rect x="8" y="4" width="12" height="12" rx="2" fill="#93C5FD"/>
    <rect x="24" y="4" width="8" height="12" rx="2" fill="#93C5FD"/>
  </svg>`,
  bus: `<svg viewBox="0 0 70 24" xmlns="http://www.w3.org/2000/svg">
    <rect width="70" height="24" rx="3" fill="#EAB308"/>
    <rect x="6" y="4" width="10" height="10" rx="1" fill="#FEF08A"/>
    <rect x="20" y="4" width="10" height="10" rx="1" fill="#FEF08A"/>
    <rect x="34" y="4" width="10" height="10" rx="1" fill="#FEF08A"/>
    <circle cx="15" cy="20" r="3" fill="#1E293B"/>
    <circle cx="55" cy="20" r="3" fill="#1E293B"/>
  </svg>`,
  bike: `<svg viewBox="0 0 20 8" xmlns="http://www.w3.org/2000/svg">
    <rect width="20" height="4" y="2" rx="2" fill="#10B981"/>
    <circle cx="3" cy="4" r="2.5" fill="none" stroke="#065F46" stroke-width="1"/>
    <circle cx="17" cy="4" r="2.5" fill="none" stroke="#065F46" stroke-width="1"/>
  </svg>`,
  pedestrian: `<svg viewBox="0 0 8 16" xmlns="http://www.w3.org/2000/svg">
    <circle cx="4" cy="3" r="2.5" fill="#F97316"/>
    <rect x="2.5" y="6" width="3" height="5" rx="1" fill="#FB923C"/>
    <line x1="2.5" y1="8" x2="0" y2="13" stroke="#FB923C" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="5.5" y1="8" x2="8" y2="13" stroke="#FB923C" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="3" y1="11" x2="1" y2="16" stroke="#FB923C" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="5" y1="11" x2="7" y2="16" stroke="#FB923C" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,
};

export async function loadSprites(): Promise<Record<string, ImageBitmap>> {
  const bitmaps: Record<string, ImageBitmap> = {};
  for (const [key, svg] of Object.entries(SPRITE_SVGS)) {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      bitmaps[key] = await createImageBitmap(img);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  return bitmaps;
}
