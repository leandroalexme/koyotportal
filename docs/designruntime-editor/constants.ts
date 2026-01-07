import { IdentityBase } from './types';

// --- 1. IDENTITY BASE (THE DESIGN SYSTEM) ---
export const EQI_IDENTITY: IdentityBase = {
    id: 'id_eqi_v1',
    name: 'EQI Brand Identity',
    colors: {
        primary: { r: 1, g: 46, b: 35, a: 1 }, // #012E23 (Deep Forest)
        secondary: { r: 39, g: 215, b: 149, a: 1 }, // #27D795 (Growth Green)
        background: { r: 242, g: 239, b: 233, a: 1 }, // #F2EFE9 (Cream)
        surface: { r: 255, g: 255, b: 255, a: 1 }, // White
        textMain: { r: 1, g: 46, b: 35, a: 1 },
        textMuted: { r: 1, g: 46, b: 35, a: 0.6 },
        divider: { r: 1, g: 46, b: 35, a: 0.15 },
    },
    typography: {
        headings: { family: 'Playfair Display', weight: 700 },
        body: { family: 'Inter', weight: 400 },
    },
    spacing: {
        base: 8,
    },
    cornerRadius: {
        small: 4,
        medium: 12,
        large: 24
    }
};