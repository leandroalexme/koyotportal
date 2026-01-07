import { SceneNode } from '../../../../types';
import { EQI_IDENTITY } from '../../../../constants';

const I = EQI_IDENTITY;

export const CORPORATE_NODES: { name: string, node: SceneNode }[] = [
    {
        name: 'Stats 50bi',
        node: {
            id: 'cp1-root', name: 'Stats Post', type: 'FRAME', layoutMode: 'VERTICAL', width: 1080, height: 1350,
            sizingHorizontal: 'FIXED', sizingVertical: 'FIXED',
            backgroundColor: I.colors.primary, gap: 0,
            children: [
                {
                    id: 'cp1-top', name: 'Image Area', type: 'FRAME', sizingHorizontal: 'FILL', sizingVertical: 'FIXED', height: 500, width: 0,
                    children: [
                        { id: 'cp1-img', name: 'Team Photo', type: 'IMAGE', sizingHorizontal: 'FILL', sizingVertical: 'FILL', width: 0, height: 0, image: { src: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1080&auto=format&fit=crop', fit: 'cover' } }
                    ]
                },
                {
                    id: 'cp1-btm', name: 'Content Area', type: 'FRAME', layoutMode: 'VERTICAL', sizingHorizontal: 'FILL', sizingVertical: 'FILL', padding: { top: 80, right: 80, bottom: 80, left: 80 }, gap: 40, width: 0, height: 0,
                    children: [
                        {
                            id: 'cp1-stat', name: 'Stat Block', type: 'FRAME', layoutMode: 'HORIZONTAL', sizingHorizontal: 'FILL', sizingVertical: 'HUG', gap: 20, width: 0, height: 0, counterAxisAlign: 'CENTER',
                            children: [
                                { id: 'cp1-num', name: '50bi', type: 'TEXT', sizingHorizontal: 'HUG', sizingVertical: 'HUG', width: 0, height: 0, text: { content: '50bi.', fontFamily: I.typography.body.family, fontSize: 180, fontWeight: 600, color: I.colors.surface, textAlign: 'left', lineHeight: 1 } },
                                { id: 'cp1-desc', name: 'Desc', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'Sob custódia em dezembro / 2025', fontFamily: I.typography.body.family, fontSize: 32, fontWeight: 500, color: I.colors.secondary, textAlign: 'left', lineHeight: 1.2 } }
                            ]
                        },
                        { id: 'cp1-txt', name: 'Body', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'Esse marco reflete nossos valores e a certeza de que estamos edificando histórias com o propósito de transformar projetos em conquistas.', fontFamily: I.typography.body.family, fontSize: 36, fontWeight: 400, color: I.colors.surface, textAlign: 'left', lineHeight: 1.5 } },
                        { id: 'cp1-logo', name: 'Logo', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'FILL', width: 0, height: 0, text: { content: 'EQI', fontFamily: I.typography.headings.family, fontSize: 100, fontWeight: 700, color: I.colors.surface, textAlign: 'left', lineHeight: 1 } }
                    ]
                }
            ]
        }
    },
    {
        name: 'Timeline',
        node: {
            id: 'cp2-root', name: 'Timeline', type: 'FRAME', layoutMode: 'VERTICAL', width: 1080, height: 1350,
            sizingHorizontal: 'FIXED', sizingVertical: 'FIXED',
            backgroundColor: '#A8DACC' as any, padding: { top: 120, right: 80, bottom: 120, left: 80 }, gap: 80, // Using a custom light green from image
            children: [
                 {
                     id: 'cp2-head', name: 'Header', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, 
                     text: { content: 'Movimentos\nque marcam\nnossa história.', fontFamily: I.typography.headings.family, fontSize: 110, fontWeight: 500, color: I.colors.primary, textAlign: 'left', lineHeight: 1.1 }
                 },
                 {
                     id: 'cp2-tl', name: 'Timeline Container', type: 'FRAME', layoutMode: 'HORIZONTAL', sizingHorizontal: 'FILL', sizingVertical: 'HUG', gap: 0, width: 0, height: 0,
                     children: [
                         {
                             id: 'cp2-y1', name: 'Year 1', type: 'FRAME', layoutMode: 'VERTICAL', sizingHorizontal: 'FILL', sizingVertical: 'HUG', gap: 20, width: 0, height: 0,
                             children: [
                                 { id: 'y1-n', name: '2008', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: '2008', fontFamily: I.typography.headings.family, fontSize: 100, fontWeight: 600, color: I.colors.primary, textAlign: 'left', lineHeight: 1 } },
                                 { id: 'y1-l', name: 'Line', type: 'FRAME', sizingHorizontal: 'FILL', sizingVertical: 'FIXED', height: 4, width: 0, backgroundColor: I.colors.primary, children: [] },
                                 { id: 'y1-t', name: 'Text', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'Fundação da Índice Investimentos', fontFamily: I.typography.body.family, fontSize: 36, fontWeight: 400, color: I.colors.primary, textAlign: 'left', lineHeight: 1.3 } }
                             ]
                         },
                         {
                             id: 'cp2-y2', name: 'Year 2', type: 'FRAME', layoutMode: 'VERTICAL', sizingHorizontal: 'FILL', sizingVertical: 'HUG', gap: 20, width: 0, height: 0,
                             children: [
                                 { id: 'y2-n', name: '2014', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: '2014', fontFamily: I.typography.headings.family, fontSize: 100, fontWeight: 600, color: I.colors.primary, textAlign: 'left', lineHeight: 1 } },
                                 { id: 'y2-l', name: 'Line', type: 'FRAME', sizingHorizontal: 'FILL', sizingVertical: 'FIXED', height: 4, width: 0, backgroundColor: I.colors.primary, children: [] },
                                 { id: 'y2-t', name: 'Text', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'Criação do portal Eu Quero Investir', fontFamily: I.typography.body.family, fontSize: 36, fontWeight: 400, color: I.colors.primary, textAlign: 'left', lineHeight: 1.3 } }
                             ]
                         }
                     ]
                 }
            ]
        }
    },
    {
        name: 'Who We Are',
        node: {
            id: 'cp3-root', name: 'Who We Are', type: 'FRAME', layoutMode: 'VERTICAL', width: 1080, height: 1350,
            sizingHorizontal: 'FIXED', sizingVertical: 'FIXED',
            backgroundColor: I.colors.surface, gap: 0,
            children: [
                {
                    id: 'cp3-img', name: 'Building', type: 'IMAGE', sizingHorizontal: 'FILL', sizingVertical: 'FIXED', height: 800, width: 0, image: { src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1080&auto=format&fit=crop', fit: 'cover' } 
                },
                {
                    id: 'cp3-content', name: 'Text', type: 'FRAME', layoutMode: 'VERTICAL', sizingHorizontal: 'FILL', sizingVertical: 'FILL', backgroundColor: I.colors.primary, padding: { top: 60, right: 60, bottom: 60, left: 60 }, gap: 30, width: 0, height: 0,
                    children: [
                        { id: 'cp3-h1', name: 'Headline', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'Quem somos nós?', fontFamily: I.typography.headings.family, fontSize: 80, fontWeight: 500, color: I.colors.surface, textAlign: 'left', lineHeight: 1 } },
                        { id: 'cp3-p', name: 'Desc', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'Muito mais do que uma corretora, somos um ecossistema de soluções financeiras pensado pra você ir além.', fontFamily: I.typography.body.family, fontSize: 32, fontWeight: 400, color: '#A8DACC' as any, textAlign: 'left', lineHeight: 1.4 } }
                    ]
                }
            ]
        }
    }
];