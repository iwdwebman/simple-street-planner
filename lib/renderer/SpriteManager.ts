// High-Fidelity SVG Sprite Pipeline for 7 Multi-Modal Vehicle Types

import { VehicleType } from '../types/vehicle';

const VEHICLE_SVGS: Record<VehicleType, string> = {
  walker: `
    <svg viewBox="0 0 16 16" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="4.5" fill="#F97316" stroke="#C2410C" stroke-width="1"/>
      <circle cx="10.5" cy="6" r="1.5" fill="#FED7AA"/>
      <!-- Shoulders & Stride -->
      <path d="M4 8 Q8 10 12 8" stroke="#EA580C" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>
  `,

  bike: `
    <svg viewBox="0 0 32 14" width="32" height="14" xmlns="http://www.w3.org/2000/svg">
      <!-- Wheels -->
      <circle cx="6" cy="7" r="4" fill="#064E3B" stroke="#10B981" stroke-width="1.5"/>
      <circle cx="26" cy="7" r="4" fill="#064E3B" stroke="#10B981" stroke-width="1.5"/>
      <!-- Frame -->
      <path d="M6 7 L14 7 L20 3 L26 7 L18 7 L14 7" stroke="#34D399" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- Handlebars & Seat -->
      <line x1="20" y1="3" x2="22" y2="1.5" stroke="#A7F3D0" stroke-width="2" stroke-linecap="round"/>
      <line x1="12" y1="5" x2="15" y2="5" stroke="#047857" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Cyclist Head / Torso -->
      <circle cx="16" cy="4" r="2.5" fill="#F59E0B"/>
    </svg>
  `,

  car: `
    <svg viewBox="0 0 54 26" width="54" height="26" xmlns="http://www.w3.org/2000/svg">
      <!-- Shadow -->
      <rect x="2" y="2" width="50" height="22" rx="6" fill="#0F172A" opacity="0.4"/>
      <!-- Main Car Body -->
      <rect x="1" y="2" width="52" height="22" rx="5" fill="#2563EB" stroke="#1D4ED8" stroke-width="1"/>
      <!-- Hood & Trunk Contours -->
      <rect x="10" y="4" width="32" height="18" rx="4" fill="#1E40AF"/>
      <!-- Windshield Front -->
      <path d="M36 5 L44 8 L44 18 L36 21 Z" fill="#93C5FD"/>
      <!-- Windshield Rear -->
      <path d="M18 5 L12 8 L12 18 L18 21 Z" fill="#93C5FD"/>
      <!-- Side Windows -->
      <rect x="19" y="4.5" width="16" height="2.5" rx="1" fill="#BFDBFE"/>
      <rect x="19" y="19" width="16" height="2.5" rx="1" fill="#BFDBFE"/>
      <!-- Headlights -->
      <rect x="50" y="3.5" width="2.5" height="4" rx="1" fill="#FEF08A"/>
      <rect x="50" y="18.5" width="2.5" height="4" rx="1" fill="#FEF08A"/>
      <!-- Taillights -->
      <rect x="1" y="3.5" width="2.5" height="4" rx="1" fill="#EF4444"/>
      <rect x="1" y="18.5" width="2.5" height="4" rx="1" fill="#EF4444"/>
    </svg>
  `,

  truck: `
    <svg viewBox="0 0 68 28" width="68" height="28" xmlns="http://www.w3.org/2000/svg">
      <!-- Shadow -->
      <rect x="2" y="2" width="64" height="24" rx="5" fill="#0F172A" opacity="0.4"/>
      <!-- Cab -->
      <rect x="40" y="2" width="26" height="24" rx="4" fill="#4F46E5" stroke="#3730A3" stroke-width="1.5"/>
      <!-- Cargo Bed -->
      <rect x="2" y="2.5" width="38" height="23" rx="2" fill="#312E81" stroke="#4338CA" stroke-width="1.5"/>
      <line x1="8" y1="5" x2="8" y2="23" stroke="#4338CA" stroke-width="1"/>
      <line x1="18" y1="5" x2="18" y2="23" stroke="#4338CA" stroke-width="1"/>
      <line x1="28" y1="5" x2="28" y2="23" stroke="#4338CA" stroke-width="1"/>
      <!-- Windshield -->
      <path d="M52 5 L62 8 L62 20 L52 23 Z" fill="#C7D2FE"/>
      <!-- Headlights -->
      <rect x="65" y="4" width="2.5" height="5" rx="1" fill="#FDE047"/>
      <rect x="65" y="19" width="2.5" height="5" rx="1" fill="#FDE047"/>
      <!-- Taillights -->
      <rect x="1.5" y="4" width="2" height="4" rx="1" fill="#EF4444"/>
      <rect x="1.5" y="20" width="2" height="4" rx="1" fill="#EF4444"/>
      <!-- Side Mirrors -->
      <rect x="50" y="0" width="4" height="2" rx="1" fill="#1E1B4B"/>
      <rect x="50" y="26" width="4" height="2" rx="1" fill="#1E1B4B"/>
    </svg>
  `,

  delivery: `
    <svg viewBox="0 0 74 28" width="74" height="28" xmlns="http://www.w3.org/2000/svg">
      <!-- Shadow -->
      <rect x="2" y="2" width="70" height="24" rx="5" fill="#0F172A" opacity="0.4"/>
      <!-- Van Main Body -->
      <rect x="2" y="2" width="70" height="24" rx="4" fill="#7C3AED" stroke="#5B21B6" stroke-width="1.5"/>
      <!-- Roof Ribs -->
      <line x1="12" y1="2" x2="12" y2="26" stroke="#6D28D9" stroke-width="1.5"/>
      <line x1="26" y1="2" x2="26" y2="26" stroke="#6D28D9" stroke-width="1.5"/>
      <line x1="40" y1="2" x2="40" y2="26" stroke="#6D28D9" stroke-width="1.5"/>
      <!-- Cargo Graphic Stripe -->
      <rect x="15" y="11" width="30" height="6" rx="2" fill="#DDD6FE" opacity="0.8"/>
      <!-- Windshield -->
      <path d="M58 5 L68 9 L68 19 L58 23 Z" fill="#E9D5FF"/>
      <!-- Headlights -->
      <rect x="71" y="4" width="2" height="5" rx="1" fill="#FEF08A"/>
      <rect x="71" y="19" width="2" height="5" rx="1" fill="#FEF08A"/>
      <!-- Taillights -->
      <rect x="1.5" y="4" width="2" height="4" rx="1" fill="#EF4444"/>
      <rect x="1.5" y="20" width="2" height="4" rx="1" fill="#EF4444"/>
    </svg>
  `,

  bus: `
    <svg viewBox="0 0 120 30" width="120" height="30" xmlns="http://www.w3.org/2000/svg">
      <!-- Shadow -->
      <rect x="2" y="2" width="116" height="26" rx="5" fill="#0F172A" opacity="0.4"/>
      <!-- Bus Body -->
      <rect x="2" y="2" width="116" height="26" rx="4" fill="#CA8A04" stroke="#854D0E" stroke-width="1.5"/>
      <!-- Roof Air Conditioner Units -->
      <rect x="35" y="7" width="22" height="16" rx="3" fill="#FEF08A" stroke="#EAB308" stroke-width="1"/>
      <rect x="70" y="7" width="22" height="16" rx="3" fill="#FEF08A" stroke="#EAB308" stroke-width="1"/>
      <!-- Panoramic Windows Strip -->
      <rect x="12" y="3" width="94" height="3" rx="1" fill="#1E293B"/>
      <rect x="12" y="24" width="94" height="3" rx="1" fill="#1E293B"/>
      <!-- Front Windshield -->
      <path d="M106 5 L116 8 L116 22 L106 25 Z" fill="#BAE6FD"/>
      <!-- Rear Window -->
      <rect x="3" y="6" width="4" height="18" rx="1" fill="#1E293B"/>
      <!-- Destination LED Sign -->
      <rect x="108" y="10" width="4" height="10" rx="1" fill="#F97316"/>
      <!-- Lights -->
      <rect x="116.5" y="4" width="2.5" height="4" rx="1" fill="#FEF08A"/>
      <rect x="116.5" y="22" width="2.5" height="4" rx="1" fill="#FEF08A"/>
      <rect x="1.5" y="4" width="2" height="4" rx="1" fill="#EF4444"/>
      <rect x="1.5" y="22" width="2" height="4" rx="1" fill="#EF4444"/>
    </svg>
  `,

  semi: `
    <svg viewBox="0 0 170 32" width="170" height="32" xmlns="http://www.w3.org/2000/svg">
      <!-- Shadow -->
      <rect x="2" y="2" width="166" height="28" rx="5" fill="#0F172A" opacity="0.4"/>
      <!-- Long Freight Trailer -->
      <rect x="2" y="3" width="112" height="26" rx="3" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5"/>
      <!-- Trailer Roof Ribs -->
      <line x1="20" y1="3" x2="20" y2="29" stroke="#CBD5E1" stroke-width="1.5"/>
      <line x1="45" y1="3" x2="45" y2="29" stroke="#CBD5E1" stroke-width="1.5"/>
      <line x1="70" y1="3" x2="70" y2="29" stroke="#CBD5E1" stroke-width="1.5"/>
      <line x1="95" y1="3" x2="95" y2="29" stroke="#CBD5E1" stroke-width="1.5"/>
      <!-- Articulation Hitch & Connector -->
      <rect x="114" y="11" width="8" height="10" rx="2" fill="#334155"/>
      <!-- Heavy Tractor Cab -->
      <rect x="122" y="2.5" width="45" height="27" rx="5" fill="#DC2626" stroke="#991B1B" stroke-width="1.5"/>
      <!-- Sleeper Cab Roof -->
      <rect x="124" y="6" width="20" height="20" rx="3" fill="#B91C1C"/>
      <!-- Windshield -->
      <path d="M152 5 L164 9 L164 23 L152 27 Z" fill="#FCA5A5"/>
      <!-- Chrome Exhaust Stacks -->
      <circle cx="125" cy="2" r="2" fill="#F1F5F9" stroke="#64748B" stroke-width="1"/>
      <circle cx="125" cy="30" r="2" fill="#F1F5F9" stroke="#64748B" stroke-width="1"/>
      <!-- Headlights -->
      <rect x="166" y="4" width="2.5" height="5" rx="1" fill="#FEF08A"/>
      <rect x="166" y="23" width="2.5" height="5" rx="1" fill="#FEF08A"/>
      <!-- Rear Trailer Lights -->
      <rect x="1.5" y="5" width="2" height="6" rx="1" fill="#EF4444"/>
      <rect x="1.5" y="21" width="2" height="6" rx="1" fill="#EF4444"/>
    </svg>
  `,
};

export async function loadVehicleSprites(): Promise<Record<VehicleType, ImageBitmap>> {
  const bitmaps: Partial<Record<VehicleType, ImageBitmap>> = {};

  for (const [key, svg] of Object.entries(VEHICLE_SVGS)) {
    const type = key as VehicleType;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      bitmaps[type] = await createImageBitmap(img);
    } catch (err) {
      console.warn(`Failed to decode SVG sprite for ${type}:`, err);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  return bitmaps as Record<VehicleType, ImageBitmap>;
}
