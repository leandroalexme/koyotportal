import { SceneNode, Template } from '../../../../types';
import { EQI_IDENTITY } from '../../../../constants';

const I = EQI_IDENTITY;

const DISPLAY_NODES: { name: string, node: SceneNode }[] = [
    {
        name: 'Ad 1',
        node: {
            id: 'da-root', name: 'Med Rect Ad', type: 'FRAME', layoutMode: 'VERTICAL', width: 300, height: 250,
            sizingHorizontal: 'FIXED', sizingVertical: 'FIXED',
            backgroundColor: I.colors.background, padding: { top: 24, right: 24, bottom: 24, left: 24 }, gap: 16, primaryAxisAlign: 'SPACE_BETWEEN',
            children: [
                {
                    id: 'da-top', name: 'Top Section', type: 'FRAME', layoutMode: 'VERTICAL', sizingHorizontal: 'FILL', sizingVertical: 'HUG', gap: 8, width: 0, height: 0,
                    children: [
                        { id: 'da-logo', name: 'Logo', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'EQI', fontFamily: I.typography.headings.family, fontSize: 20, fontWeight: 700, color: I.colors.primary, textAlign: 'left', lineHeight: 1 } },
                        { id: 'da-head', name: 'Headline', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'Invest with confidence.', fontFamily: I.typography.headings.family, fontSize: 28, fontWeight: 700, color: I.colors.textMain, textAlign: 'left', lineHeight: 1.1 } },
                    ]
                },
                {
                    id: 'da-btn', name: 'CTA', type: 'FRAME', layoutMode: 'HORIZONTAL', sizingHorizontal: 'FILL', sizingVertical: 'HUG', backgroundColor: I.colors.primary, padding: { top: 12, right: 12, bottom: 12, left: 12 }, cornerRadius: 4, primaryAxisAlign: 'CENTER', width: 0, height: 0,
                    children: [
                         { id: 'da-btn-txt', name: 'Label', type: 'TEXT', sizingHorizontal: 'HUG', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'Start Now', fontFamily: I.typography.body.family, fontSize: 14, fontWeight: 600, color: I.colors.surface, textAlign: 'center', lineHeight: 1 } }
                    ]
                }
            ]
        }
    }
];

export const DisplayAdTemplate: Template = {
    id: 'tmpl_display',
    type: 'SYSTEM',
    ownerId: null,
    identityId: I.id,
    name: 'Display Ad (Med Rect)',
    category: 'WEBSITE',
    width: 300,
    height: 250,
    pages: DISPLAY_NODES,
    createdAt: 1709251200000,
    updatedAt: 1709251200000
};