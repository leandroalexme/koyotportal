/**
 * Mockup Presets
 * 
 * Definições pré-configuradas de mockups comuns.
 * Estes são exemplos que podem ser usados ou servir de base para mockups customizados.
 */

import type { MockupDefinition } from './types'

/**
 * Mockup de cartão de visita em mão
 */
export const businessCardInHandMockup: MockupDefinition = {
  id: 'business-card-hand-01',
  name: 'Cartão de Visita em Mão',
  description: 'Cartão de visita segurado em mão com perspectiva realista',
  category: 'business-card',
  tags: ['cartão', 'visita', 'mão', 'elegante'],
  
  canvasSize: {
    width: 1200,
    height: 800,
  },
  
  layers: {
    base: {
      src: '/mockups/business-card-hand/base.jpg',
      opacity: 1,
    },
    overlay: {
      src: '/mockups/business-card-hand/overlay.png',
      opacity: 0.6,
      blendMode: 'multiply',
    },
  },
  
  insertAreas: [
    {
      quad: {
        topLeft: { x: 340, y: 280 },
        topRight: { x: 680, y: 260 },
        bottomRight: { x: 700, y: 480 },
        bottomLeft: { x: 320, y: 520 },
      },
      expectedSize: {
        width: 350,
        height: 200,
      },
      rotation: 0,
      opacity: 1,
    },
  ],
  
  thumbnail: '/mockups/business-card-hand/thumb.jpg',
  
  metadata: {
    author: 'Koyot',
    version: 1,
  },
}

/**
 * Mockup de outdoor em ambiente urbano
 */
export const billboardUrbanMockup: MockupDefinition = {
  id: 'billboard-urban-01',
  name: 'Outdoor Urbano',
  description: 'Billboard em ambiente urbano com perspectiva',
  category: 'billboard',
  tags: ['outdoor', 'urbano', 'publicidade', 'grande formato'],
  
  canvasSize: {
    width: 1600,
    height: 900,
  },
  
  layers: {
    base: {
      src: '/mockups/billboard-urban/base.jpg',
      opacity: 1,
    },
    overlay: {
      src: '/mockups/billboard-urban/overlay.png',
      opacity: 0.4,
      blendMode: 'soft-light',
    },
  },
  
  insertAreas: [
    {
      quad: {
        topLeft: { x: 180, y: 120 },
        topRight: { x: 1420, y: 100 },
        bottomRight: { x: 1440, y: 580 },
        bottomLeft: { x: 160, y: 620 },
      },
      expectedSize: {
        width: 1280,
        height: 480,
      },
      rotation: 0,
      opacity: 1,
    },
  ],
  
  thumbnail: '/mockups/billboard-urban/thumb.jpg',
  
  metadata: {
    author: 'Koyot',
    version: 1,
  },
}

/**
 * Mockup de poster em parede
 */
export const posterWallMockup: MockupDefinition = {
  id: 'poster-wall-01',
  name: 'Poster na Parede',
  description: 'Poster emoldurado em parede com iluminação ambiente',
  category: 'poster',
  tags: ['poster', 'parede', 'quadro', 'arte'],
  
  canvasSize: {
    width: 1400,
    height: 1000,
  },
  
  layers: {
    base: {
      src: '/mockups/poster-wall/base.jpg',
      opacity: 1,
    },
    overlay: {
      src: '/mockups/poster-wall/overlay.png',
      opacity: 0.3,
      blendMode: 'overlay',
    },
  },
  
  insertAreas: [
    {
      quad: {
        topLeft: { x: 420, y: 180 },
        topRight: { x: 980, y: 180 },
        bottomRight: { x: 980, y: 720 },
        bottomLeft: { x: 420, y: 720 },
      },
      expectedSize: {
        width: 560,
        height: 540,
      },
      rotation: 0,
      opacity: 1,
    },
  ],
  
  thumbnail: '/mockups/poster-wall/thumb.jpg',
  
  metadata: {
    author: 'Koyot',
    version: 1,
  },
}

/**
 * Mockup de tela de celular
 */
export const phoneScreenMockup: MockupDefinition = {
  id: 'phone-screen-01',
  name: 'Tela de Celular',
  description: 'Smartphone com tela para inserção de design',
  category: 'device',
  tags: ['celular', 'smartphone', 'mobile', 'app', 'tela'],
  
  canvasSize: {
    width: 800,
    height: 1000,
  },
  
  layers: {
    base: {
      src: '/mockups/phone-screen/base.png',
      opacity: 1,
    },
    overlay: {
      src: '/mockups/phone-screen/overlay.png',
      opacity: 0.2,
      blendMode: 'screen',
    },
  },
  
  insertAreas: [
    {
      quad: {
        topLeft: { x: 195, y: 125 },
        topRight: { x: 605, y: 125 },
        bottomRight: { x: 605, y: 875 },
        bottomLeft: { x: 195, y: 875 },
      },
      expectedSize: {
        width: 410,
        height: 750,
      },
      rotation: 0,
      opacity: 1,
    },
  ],
  
  thumbnail: '/mockups/phone-screen/thumb.png',
  
  metadata: {
    author: 'Koyot',
    version: 1,
  },
}

/**
 * Mockup de laptop
 */
export const laptopScreenMockup: MockupDefinition = {
  id: 'laptop-screen-01',
  name: 'Tela de Laptop',
  description: 'MacBook com tela para inserção de design',
  category: 'device',
  tags: ['laptop', 'macbook', 'notebook', 'computador', 'tela'],
  
  canvasSize: {
    width: 1400,
    height: 900,
  },
  
  layers: {
    base: {
      src: '/mockups/laptop-screen/base.png',
      opacity: 1,
    },
    overlay: {
      src: '/mockups/laptop-screen/overlay.png',
      opacity: 0.15,
      blendMode: 'screen',
    },
  },
  
  insertAreas: [
    {
      quad: {
        topLeft: { x: 220, y: 85 },
        topRight: { x: 1180, y: 85 },
        bottomRight: { x: 1180, y: 685 },
        bottomLeft: { x: 220, y: 685 },
      },
      expectedSize: {
        width: 960,
        height: 600,
      },
      rotation: 0,
      opacity: 1,
    },
  ],
  
  thumbnail: '/mockups/laptop-screen/thumb.png',
  
  metadata: {
    author: 'Koyot',
    version: 1,
  },
}

/**
 * Mockup de sacola de papel
 */
export const paperBagMockup: MockupDefinition = {
  id: 'paper-bag-01',
  name: 'Sacola de Papel',
  description: 'Sacola de papel kraft com área para logo',
  category: 'packaging',
  tags: ['sacola', 'embalagem', 'papel', 'kraft', 'logo'],
  
  canvasSize: {
    width: 1000,
    height: 1200,
  },
  
  layers: {
    base: {
      src: '/mockups/paper-bag/base.jpg',
      opacity: 1,
    },
    overlay: {
      src: '/mockups/paper-bag/overlay.png',
      opacity: 0.5,
      blendMode: 'multiply',
    },
  },
  
  insertAreas: [
    {
      quad: {
        topLeft: { x: 280, y: 350 },
        topRight: { x: 720, y: 350 },
        bottomRight: { x: 720, y: 650 },
        bottomLeft: { x: 280, y: 650 },
      },
      expectedSize: {
        width: 440,
        height: 300,
      },
      rotation: 0,
      opacity: 0.9,
    },
  ],
  
  thumbnail: '/mockups/paper-bag/thumb.jpg',
  
  metadata: {
    author: 'Koyot',
    version: 1,
  },
}

/**
 * Mockup de post Instagram
 */
export const instagramPostMockup: MockupDefinition = {
  id: 'instagram-post-01',
  name: 'Post Instagram',
  description: 'Interface do Instagram com post',
  category: 'social-media',
  tags: ['instagram', 'social', 'post', 'feed'],
  
  canvasSize: {
    width: 800,
    height: 1000,
  },
  
  layers: {
    base: {
      src: '/mockups/instagram-post/base.png',
      opacity: 1,
    },
  },
  
  insertAreas: [
    {
      quad: {
        topLeft: { x: 0, y: 200 },
        topRight: { x: 800, y: 200 },
        bottomRight: { x: 800, y: 800 },
        bottomLeft: { x: 0, y: 800 },
      },
      expectedSize: {
        width: 800,
        height: 600,
      },
      rotation: 0,
      opacity: 1,
    },
  ],
  
  thumbnail: '/mockups/instagram-post/thumb.png',
  
  metadata: {
    author: 'Koyot',
    version: 1,
  },
}

/**
 * Mockup de teste mobile
 */
export const testMobileMockup: MockupDefinition = {
  id: 'mockup-1767874949934-ofcixmiwe',
  name: 'teste-mobile-mockup',
  description: '',
  category: 'device',
  tags: [],
  
  canvasSize: {
    width: 1400,
    height: 933,
  },
  
  layers: {
    base: {
      src: '/mockups/mockup-1767874949934-ofcixmiwe/base.jpg',
      opacity: 1,
    },
  },
  
  insertAreas: [
    {
      quad: {
        topLeft: { x: 573, y: 209 },
        topRight: { x: 838, y: 144 },
        bottomRight: { x: 958, y: 686 },
        bottomLeft: { x: 715, y: 761 },
      },
      expectedSize: {
        width: 400,
        height: 300,
      },
      opacity: 1,
    },
  ],
}

/**
 * Todos os presets disponíveis
 */
export const mockupPresets: MockupDefinition[] = [
  businessCardInHandMockup,
  billboardUrbanMockup,
  posterWallMockup,
  phoneScreenMockup,
  laptopScreenMockup,
  paperBagMockup,
  instagramPostMockup,
  testMobileMockup,
]

/**
 * Obtém preset por ID
 */
export function getMockupPresetById(id: string): MockupDefinition | undefined {
  return mockupPresets.find(preset => preset.id === id)
}

/**
 * Obtém presets por categoria
 */
export function getMockupPresetsByCategory(category: string): MockupDefinition[] {
  return mockupPresets.filter(preset => preset.category === category)
}
