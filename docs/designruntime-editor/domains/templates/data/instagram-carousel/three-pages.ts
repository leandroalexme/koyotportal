import { SceneNode } from '../../../../types';
import { EQI_IDENTITY } from '../../../../constants';

const I = EQI_IDENTITY;

export const STORY_NODES: { name: string, node: SceneNode }[] = [
    {
        name: '1. Cover',
        node: {
            id: 's1-root', name: 'Story Cover', type: 'FRAME', layoutMode: 'VERTICAL', sizingHorizontal: 'FIXED', sizingVertical: 'FIXED', width: 1080, height: 1920,
            backgroundColor: I.colors.primary, padding: { top: 140, right: 80, bottom: 140, left: 80 }, gap: 60, primaryAxisAlign: 'SPACE_BETWEEN',
            children: [
                {
                    id: 's1-head', name: 'Header', type: 'FRAME', layoutMode: 'HORIZONTAL', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, primaryAxisAlign: 'SPACE_BETWEEN',
                    children: [
                        { id: 's1-logo', name: 'Logo', type: 'TEXT', sizingHorizontal: 'HUG', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'EQI', fontFamily: I.typography.headings.family, fontSize: 48, fontWeight: 700, color: I.colors.surface, textAlign: 'left', lineHeight: 1 } },
                        { id: 's1-tag', name: 'Tag', type: 'TEXT', sizingHorizontal: 'HUG', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'mindyourmoney', fontFamily: I.typography.body.family, fontSize: 24, fontWeight: 500, color: I.colors.secondary, textAlign: 'right', lineHeight: 1 } }
                    ]
                },
                {
                    id: 's1-main', name: 'Main', type: 'FRAME', layoutMode: 'VERTICAL', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, gap: 40,
                    children: [
                         { id: 's1-lbl', name: 'Label', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'Planejamento', fontFamily: I.typography.body.family, fontSize: 32, fontWeight: 400, color: I.colors.secondary, textAlign: 'left', lineHeight: 1 } },
                         { id: 's1-ttl', name: 'Title', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'Como manter\na renda na\naposentadoria?', fontFamily: I.typography.headings.family, fontSize: 96, fontWeight: 500, color: I.colors.surface, textAlign: 'left', lineHeight: 1.1 } },
                    ]
                },
                {
                    id: 's1-img-wrap', name: 'Image Wrapper', type: 'FRAME', sizingHorizontal: 'FILL', sizingVertical: 'FIXED', width: 0, height: 600, cornerRadius: 0,
                    children: [
                        { id: 's1-img', name: 'Cover Image', type: 'IMAGE', sizingHorizontal: 'FILL', sizingVertical: 'FILL', width: 0, height: 0, image: { src: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1000&auto=format&fit=crop', fit: 'cover' } }
                    ]
                },
                {
                     id: 's1-foot', name: 'Footer', type: 'FRAME', layoutMode: 'HORIZONTAL', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, primaryAxisAlign: 'END',
                     children: [
                         { id: 's1-icon', name: 'Icon', type: 'FRAME', sizingHorizontal: 'FIXED', sizingVertical: 'FIXED', width: 60, height: 60, cornerRadius: 0, strokeColor: I.colors.surface, strokeWidth: 2, children: [] }
                     ]
                }
            ]
        }
    },
    {
        name: '2. Data',
        node: {
            id: 's2-root', name: 'Story Data', type: 'FRAME', layoutMode: 'VERTICAL', sizingHorizontal: 'FIXED', sizingVertical: 'FIXED', width: 1080, height: 1920,
            backgroundColor: I.colors.background, padding: { top: 140, right: 80, bottom: 140, left: 80 }, gap: 80,
            children: [
                { id: 's2-head', name: 'Title', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'O poder dos juros compostos', fontFamily: I.typography.headings.family, fontSize: 64, fontWeight: 700, color: I.colors.primary, textAlign: 'left', lineHeight: 1.1 } },
                {
                    id: 's2-chart', name: 'Chart Area', type: 'FRAME', layoutMode: 'HORIZONTAL', sizingHorizontal: 'FILL', sizingVertical: 'FIXED', width: 0, height: 600, gap: 40, primaryAxisAlign: 'SPACE_BETWEEN', counterAxisAlign: 'END',
                    children: [
                        { id: 'bar1', name: 'Bar 1', type: 'FRAME', sizingHorizontal: 'FILL', sizingVertical: 'FIXED', width: 0, height: 200, backgroundColor: I.colors.primary, opacity: 0.3, cornerRadius: 8, children: [] },
                        { id: 'bar2', name: 'Bar 2', type: 'FRAME', sizingHorizontal: 'FILL', sizingVertical: 'FIXED', width: 0, height: 350, backgroundColor: I.colors.primary, opacity: 0.6, cornerRadius: 8, children: [] },
                        { id: 'bar3', name: 'Bar 3', type: 'FRAME', sizingHorizontal: 'FILL', sizingVertical: 'FIXED', width: 0, height: 600, backgroundColor: I.colors.secondary, cornerRadius: 8, children: [] }
                    ]
                },
                {
                    id: 's2-stat', name: 'Big Stat', type: 'FRAME', layoutMode: 'VERTICAL', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, gap: 10,
                    children: [
                        { id: 's2-val', name: 'Value', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: '+214%', fontFamily: I.typography.body.family, fontSize: 180, fontWeight: 700, color: I.colors.primary, textAlign: 'center', lineHeight: 1 } },
                        { id: 's2-cap', name: 'Caption', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'Rentabilidade acumulada', fontFamily: I.typography.body.family, fontSize: 32, fontWeight: 400, color: I.colors.textMuted, textAlign: 'center', lineHeight: 1 } }
                    ]
                }
            ]
        }
    },
    {
        name: '3. Quote',
        node: {
            id: 's3-root', name: 'Story Quote', type: 'FRAME', layoutMode: 'VERTICAL', sizingHorizontal: 'FIXED', sizingVertical: 'FIXED', width: 1080, height: 1920,
            backgroundColor: I.colors.primary, padding: { top: 0, right: 0, bottom: 0, left: 0 },
            children: [
                 {
                     id: 's3-img', name: 'Bg Image', type: 'IMAGE', sizingHorizontal: 'FILL', sizingVertical: 'FIXED', width: 0, height: 1000,
                     image: { src: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1080&auto=format&fit=crop', fit: 'cover' }
                 },
                 {
                     id: 's3-content', name: 'Content', type: 'FRAME', layoutMode: 'VERTICAL', sizingHorizontal: 'FILL', sizingVertical: 'FILL', width: 0, height: 0, padding: { top: 80, right: 80, bottom: 120, left: 80 }, gap: 40, primaryAxisAlign: 'CENTER',
                     children: [
                         { id: 's3-q', name: 'Quote', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: '"O melhor momento para começar foi ontem. O segundo melhor é agora."', fontFamily: I.typography.headings.family, fontSize: 56, fontWeight: 500, color: I.colors.surface, textAlign: 'center', lineHeight: 1.2 } },
                         { id: 's3-cta', name: 'CTA', type: 'FRAME', layoutMode: 'HORIZONTAL', sizingHorizontal: 'HUG', sizingVertical: 'HUG', width: 0, height: 0, backgroundColor: I.colors.secondary, padding: { top: 20, right: 40, bottom: 20, left: 40 }, cornerRadius: 100, children: [
                             { id: 's3-btn', name: 'Label', type: 'TEXT', sizingHorizontal: 'HUG', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'Fale com um assessor', fontFamily: I.typography.body.family, fontSize: 24, fontWeight: 600, color: I.colors.primary, textAlign: 'center', lineHeight: 1 } }
                         ]}
                     ]
                 }
            ]
        }
    }
];