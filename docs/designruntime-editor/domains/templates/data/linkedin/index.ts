import { SceneNode, Template } from '../../../../types';
import { EQI_IDENTITY } from '../../../../constants';

const I = EQI_IDENTITY;

const LINKEDIN_NODES: { name: string, node: SceneNode }[] = [
    {
        name: 'Banner',
        node: {
            id: 'li-root', name: 'LinkedIn Banner', type: 'FRAME', layoutMode: 'HORIZONTAL', width: 1200, height: 627,
            sizingHorizontal: 'FIXED', sizingVertical: 'FIXED',
            backgroundColor: I.colors.background, padding: { top: 60, right: 60, bottom: 60, left: 60 }, gap: 40,
            children: [
                {
                    id: 'li-left', name: 'Content', type: 'FRAME', layoutMode: 'VERTICAL', sizingHorizontal: 'FILL', sizingVertical: 'FILL', gap: 24, primaryAxisAlign: 'CENTER', width: 0, height: 0,
                    children: [
                         { id: 'li-tag', name: 'Tagline', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'MARKET INSIGHTS', fontFamily: I.typography.body.family, fontSize: 16, fontWeight: 600, color: I.colors.secondary, textAlign: 'left', lineHeight: 1 } },
                         { id: 'li-head', name: 'Headline', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'Unlock new growth opportunities with EQI', fontFamily: I.typography.headings.family, fontSize: 54, fontWeight: 700, color: I.colors.primary, textAlign: 'left', lineHeight: 1.1 } },
                         { id: 'li-btn', name: 'Button', type: 'FRAME', layoutMode: 'HORIZONTAL', sizingHorizontal: 'HUG', sizingVertical: 'HUG', backgroundColor: I.colors.primary, padding: { top: 16, right: 32, bottom: 16, left: 32 }, cornerRadius: 100, width: 0, height: 0, children: [
                             { id: 'li-btn-txt', name: 'Label', type: 'TEXT', sizingHorizontal: 'HUG', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'Read the Report', fontFamily: I.typography.body.family, fontSize: 18, fontWeight: 500, color: I.colors.surface, textAlign: 'center', lineHeight: 1 } }
                         ]}
                    ]
                },
                {
                    id: 'li-img-wrap', name: 'Image', type: 'FRAME', sizingHorizontal: 'FIXED', width: 480, sizingVertical: 'FILL', height: 0,
                    cornerRadius: I.cornerRadius.medium,
                    children: [
                        { id: 'li-img', name: 'Photo', type: 'IMAGE', sizingHorizontal: 'FILL', sizingVertical: 'FILL', width: 0, height: 0, image: { src: 'https://images.unsplash.com/photo-1570126618953-d437145e8c7e?q=80&w=1200&auto=format&fit=crop', fit: 'cover' } }
                    ]
                }
            ]
        }
    }
];

export const LinkedInTemplate: Template = {
    id: 'tmpl_linkedin',
    type: 'SYSTEM',
    ownerId: null,
    identityId: I.id,
    name: 'LinkedIn Banner',
    category: 'SOCIAL',
    width: 1200,
    height: 627,
    pages: LINKEDIN_NODES,
    createdAt: 1709251200000,
    updatedAt: 1709251200000
};