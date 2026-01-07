import { SceneNode } from '../../../../types';
import { EQI_IDENTITY } from '../../../../constants';

const I = EQI_IDENTITY;

export const MARKET_NODES: { name: string, node: SceneNode }[] = [
    {
        name: '1. Fed Rate Cut',
        node: {
            id: 'mu1-root', name: 'Fed Rate', type: 'FRAME', layoutMode: 'VERTICAL', width: 1080, height: 1350,
            sizingHorizontal: 'FIXED', sizingVertical: 'FIXED',
            backgroundColor: I.colors.background, padding: { top: 100, right: 80, bottom: 100, left: 80 }, gap: 60,
            children: [
                { id: 'mu1-tag', name: 'Tag', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'SUPER QUARTA', fontFamily: I.typography.body.family, fontSize: 24, fontWeight: 600, color: I.colors.secondary, textAlign: 'left', lineHeight: 1 } },
                {
                    id: 'mu1-content', name: 'Content', type: 'FRAME', layoutMode: 'VERTICAL', sizingHorizontal: 'FILL', sizingVertical: 'HUG', gap: 24, width: 0, height: 0,
                    children: [
                         { id: 'mu1-h1', name: 'Headline', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'Fed anuncia corte de juros nos EUA para', fontFamily: I.typography.headings.family, fontSize: 96, fontWeight: 500, color: I.colors.primary, textAlign: 'left', lineHeight: 1.1 } },
                         { id: 'mu1-h2', name: 'Highlight', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: '3,5% a 3,75%', fontFamily: I.typography.headings.family, fontSize: 110, fontWeight: 700, color: I.colors.secondary, textAlign: 'left', lineHeight: 1.1 } },
                    ]
                },
                { id: 'mu1-img', name: 'Image', type: 'IMAGE', sizingHorizontal: 'FILL', sizingVertical: 'FILL', width: 0, height: 0, cornerRadius: 0, image: { src: 'https://images.unsplash.com/photo-1611974765270-ca12586343bb?q=80&w=1080&auto=format&fit=crop', fit: 'cover' } }
            ]
        }
    },
    {
        name: '2. Selic Rate',
        node: {
            id: 'mu2-root', name: 'Selic Rate', type: 'FRAME', layoutMode: 'VERTICAL', width: 1080, height: 1350,
            sizingHorizontal: 'FIXED', sizingVertical: 'FIXED',
            backgroundColor: I.colors.background, padding: { top: 100, right: 80, bottom: 100, left: 80 }, gap: 40,
            children: [
                { id: 'mu2-tag', name: 'Tag', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'SUPER QUARTA', fontFamily: I.typography.body.family, fontSize: 24, fontWeight: 600, color: I.colors.secondary, textAlign: 'left', lineHeight: 1 } },
                { id: 'mu2-tit', name: 'Title', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'Manutenção da taxa Selic em', fontFamily: I.typography.headings.family, fontSize: 100, fontWeight: 500, color: I.colors.primary, textAlign: 'left', lineHeight: 1.1 } },
                {
                    id: 'mu2-big', name: 'Big Number', type: 'FRAME', layoutMode: 'HORIZONTAL', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, primaryAxisAlign: 'START', gap: 10,
                    children: [
                        { id: 'mu2-val', name: 'Value', type: 'TEXT', sizingHorizontal: 'HUG', sizingVertical: 'HUG', width: 0, height: 0, text: { content: '15%', fontFamily: I.typography.body.family, fontSize: 280, fontWeight: 300, color: I.colors.secondary, textAlign: 'left', lineHeight: 1 } },
                        { id: 'mu2-unit', name: 'Unit', type: 'TEXT', sizingHorizontal: 'HUG', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'a.a.', fontFamily: I.typography.body.family, fontSize: 80, fontWeight: 500, color: I.colors.secondary, textAlign: 'left', lineHeight: 2.5 } }
                    ]
                },
                { id: 'mu2-logo', name: 'Logo', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'EQI', fontFamily: I.typography.headings.family, fontSize: 120, fontWeight: 700, color: I.colors.primary, textAlign: 'left', lineHeight: 1 } }
            ]
        }
    },
    {
        name: '3. Chart',
        node: {
            id: 'mu3-root', name: 'Chart', type: 'FRAME', layoutMode: 'VERTICAL', width: 1080, height: 1350,
            sizingHorizontal: 'FIXED', sizingVertical: 'FIXED',
            backgroundColor: I.colors.surface, padding: { top: 120, right: 60, bottom: 120, left: 60 }, gap: 60,
            children: [
                {
                     id: 'mu3-chart-area', name: 'Chart Visual', type: 'FRAME', layoutMode: 'VERTICAL', sizingHorizontal: 'FILL', sizingVertical: 'FIXED', height: 600, width: 0, backgroundColor: I.colors.background, padding: { top: 40, right: 40, bottom: 40, left: 40 }, cornerRadius: 20, primaryAxisAlign: 'CENTER',
                     children: [
                         // Simulated Line Chart with Frames
                         { id: 'mu3-ln1', name: 'Grid Line', type: 'FRAME', sizingHorizontal: 'FILL', sizingVertical: 'FIXED', height: 2, width: 0, backgroundColor: I.colors.divider, children: [] },
                         { id: 'mu3-sp1', name: 'Spacer', type: 'FRAME', sizingHorizontal: 'FILL', sizingVertical: 'FIXED', height: 100, width: 0, children: [] },
                         { id: 'mu3-ln2', name: 'Grid Line', type: 'FRAME', sizingHorizontal: 'FILL', sizingVertical: 'FIXED', height: 2, width: 0, backgroundColor: I.colors.divider, children: [] },
                         { id: 'mu3-sp2', name: 'Spacer', type: 'FRAME', sizingHorizontal: 'FILL', sizingVertical: 'FIXED', height: 100, width: 0, children: [] },
                         { id: 'mu3-bar-group', name: 'Bars', type: 'FRAME', layoutMode: 'HORIZONTAL', sizingHorizontal: 'FILL', sizingVertical: 'HUG', primaryAxisAlign: 'SPACE_BETWEEN', counterAxisAlign: 'END', gap: 20, width: 0, height: 0, children: [
                             { id: 'b1', name: 'Bar', type: 'FRAME', width: 100, height: 200, sizingHorizontal: 'FIXED', sizingVertical: 'FIXED', backgroundColor: I.colors.secondary, cornerRadius: 100, children: [] },
                             { id: 'b2', name: 'Bar', type: 'FRAME', width: 100, height: 350, sizingHorizontal: 'FIXED', sizingVertical: 'FIXED', backgroundColor: I.colors.primary, cornerRadius: 100, children: [] },
                             { id: 'b3', name: 'Bar', type: 'FRAME', width: 100, height: 350, sizingHorizontal: 'FIXED', sizingVertical: 'FIXED', backgroundColor: I.colors.primary, cornerRadius: 100, children: [] },
                         ]}
                     ]
                },
                {
                    id: 'mu3-txt', name: 'Text', type: 'FRAME', layoutMode: 'VERTICAL', sizingHorizontal: 'FILL', sizingVertical: 'HUG', gap: 24, width: 0, height: 0,
                    children: [
                        { id: 'mu3-p', name: 'Paragraph', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'O Copom manteve a Selic em 15%, sinalizando que aguarda mais clareza sobre a atividade econômica.', fontFamily: I.typography.body.family, fontSize: 42, fontWeight: 400, color: I.colors.textMain, textAlign: 'left', lineHeight: 1.4 } }
                    ]
                }
            ]
        }
    }
];