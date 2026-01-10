/**
 * Demo Mockups
 * 
 * Mockups de demonstração que usam SVG data URIs como placeholders.
 * Útil para desenvolvimento e testes sem precisar de imagens externas.
 */

import type { MockupDefinition } from './types'

/**
 * Gera SVG placeholder com grid e texto
 */
function createPlaceholderSVG(
  width: number,
  height: number,
  label: string,
  bgColor: string = '#f0f0f0',
  textColor: string = '#999'
): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="${textColor}" stroke-width="0.5" opacity="0.3"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="${bgColor}"/>
      <rect width="100%" height="100%" fill="url(#grid)"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="${textColor}" font-family="system-ui, sans-serif" font-size="24" font-weight="500">
        ${label}
      </text>
      <text x="50%" y="calc(50% + 30px)" text-anchor="middle" dominant-baseline="middle" fill="${textColor}" font-family="system-ui, sans-serif" font-size="14" opacity="0.7">
        ${width} × ${height}
      </text>
    </svg>
  `.trim()
  
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/**
 * Gera SVG de overlay com gradiente de sombra
 */
function createOverlaySVG(
  width: number,
  height: number,
  type: 'shadow' | 'light' | 'vignette' = 'shadow'
): string {
  let gradient = ''
  
  if (type === 'shadow') {
    gradient = `
      <linearGradient id="shadowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="black" stop-opacity="0.1"/>
        <stop offset="50%" stop-color="black" stop-opacity="0"/>
        <stop offset="100%" stop-color="black" stop-opacity="0.2"/>
      </linearGradient>
    `
  } else if (type === 'light') {
    gradient = `
      <linearGradient id="shadowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="white" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="white" stop-opacity="0"/>
      </linearGradient>
    `
  } else {
    gradient = `
      <radialGradient id="shadowGrad" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stop-color="black" stop-opacity="0"/>
        <stop offset="100%" stop-color="black" stop-opacity="0.3"/>
      </radialGradient>
    `
  }
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>${gradient}</defs>
      <rect width="100%" height="100%" fill="url(#shadowGrad)"/>
    </svg>
  `.trim()
  
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/**
 * Demo: Cartão de visita
 */
export const demoBusinessCardMockup: MockupDefinition = {
  id: 'demo-business-card',
  name: 'Cartão de Visita (Demo)',
  description: 'Cartão de visita em perspectiva - placeholder para desenvolvimento',
  category: 'business-card',
  tags: ['demo', 'cartão', 'visita'],
  
  canvasSize: {
    width: 800,
    height: 600,
  },
  
  layers: {
    base: {
      src: createPlaceholderSVG(800, 600, 'Business Card Mockup', '#e8e8e8'),
      opacity: 1,
    },
    overlay: {
      src: createOverlaySVG(800, 600, 'vignette'),
      opacity: 0.4,
      blendMode: 'multiply',
    },
  },
  
  insertAreas: [
    {
      quad: {
        topLeft: { x: 200, y: 180 },
        topRight: { x: 600, y: 160 },
        bottomRight: { x: 620, y: 420 },
        bottomLeft: { x: 180, y: 460 },
      },
      expectedSize: {
        width: 350,
        height: 200,
      },
      opacity: 1,
    },
  ],
  
  metadata: {
    author: 'Koyot Demo',
    version: 1,
  },
}

/**
 * Demo: Tela de celular
 */
export const demoPhoneMockup: MockupDefinition = {
  id: 'demo-phone',
  name: 'Smartphone (Demo)',
  description: 'Tela de smartphone - placeholder para desenvolvimento',
  category: 'device',
  tags: ['demo', 'celular', 'mobile'],
  
  canvasSize: {
    width: 600,
    height: 800,
  },
  
  layers: {
    base: {
      src: createPlaceholderSVG(600, 800, 'Phone Mockup', '#2a2a2a', '#666'),
      opacity: 1,
    },
    overlay: {
      src: createOverlaySVG(600, 800, 'light'),
      opacity: 0.2,
      blendMode: 'screen',
    },
  },
  
  insertAreas: [
    {
      quad: {
        topLeft: { x: 120, y: 100 },
        topRight: { x: 480, y: 100 },
        bottomRight: { x: 480, y: 700 },
        bottomLeft: { x: 120, y: 700 },
      },
      expectedSize: {
        width: 360,
        height: 600,
      },
      opacity: 1,
    },
  ],
  
  metadata: {
    author: 'Koyot Demo',
    version: 1,
  },
}

/**
 * Demo: Outdoor
 */
export const demoBillboardMockup: MockupDefinition = {
  id: 'demo-billboard',
  name: 'Outdoor (Demo)',
  description: 'Billboard urbano - placeholder para desenvolvimento',
  category: 'billboard',
  tags: ['demo', 'outdoor', 'publicidade'],
  
  canvasSize: {
    width: 1200,
    height: 700,
  },
  
  layers: {
    base: {
      src: createPlaceholderSVG(1200, 700, 'Billboard Mockup', '#87CEEB'),
      opacity: 1,
    },
    overlay: {
      src: createOverlaySVG(1200, 700, 'shadow'),
      opacity: 0.3,
      blendMode: 'multiply',
    },
  },
  
  insertAreas: [
    {
      quad: {
        topLeft: { x: 100, y: 80 },
        topRight: { x: 1100, y: 60 },
        bottomRight: { x: 1120, y: 520 },
        bottomLeft: { x: 80, y: 560 },
      },
      expectedSize: {
        width: 1000,
        height: 450,
      },
      opacity: 1,
    },
  ],
  
  metadata: {
    author: 'Koyot Demo',
    version: 1,
  },
}

/**
 * Demo: Post social media
 */
export const demoSocialMockup: MockupDefinition = {
  id: 'demo-social',
  name: 'Social Media (Demo)',
  description: 'Post de rede social - placeholder para desenvolvimento',
  category: 'social-media',
  tags: ['demo', 'social', 'instagram'],
  
  canvasSize: {
    width: 600,
    height: 700,
  },
  
  layers: {
    base: {
      src: createPlaceholderSVG(600, 700, 'Social Media Mockup', '#fafafa'),
      opacity: 1,
    },
  },
  
  insertAreas: [
    {
      quad: {
        topLeft: { x: 20, y: 100 },
        topRight: { x: 580, y: 100 },
        bottomRight: { x: 580, y: 580 },
        bottomLeft: { x: 20, y: 580 },
      },
      expectedSize: {
        width: 560,
        height: 480,
      },
      opacity: 1,
    },
  ],
  
  metadata: {
    author: 'Koyot Demo',
    version: 1,
  },
}

/**
 * Todos os mockups de demonstração
 */
export const demoMockups: MockupDefinition[] = [
  demoBusinessCardMockup,
  demoPhoneMockup,
  demoBillboardMockup,
  demoSocialMockup,
]

/**
 * Obtém mockup demo por ID
 */
export function getDemoMockupById(id: string): MockupDefinition | undefined {
  return demoMockups.find(m => m.id === id)
}
