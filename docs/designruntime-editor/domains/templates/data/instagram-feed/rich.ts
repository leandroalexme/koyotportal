import { SceneNode } from '../../../../types';
import { EQI_IDENTITY } from '../../../../constants';

const I = EQI_IDENTITY;

export const FEED_NODES: { name: string, node: SceneNode }[] = [
    {
        name: 'Post',
        node: {
            id: 'f1-root', name: 'Feed Post', type: 'FRAME', layoutMode: 'VERTICAL', sizingHorizontal: 'FIXED', sizingVertical: 'FIXED', width: 1080, height: 1350,
            backgroundColor: I.colors.background, padding: { top: 60, right: 60, bottom: 60, left: 60 }, gap: 0,
            children: [
                 {
                     id: 'f1-header', name: 'Header', type: 'FRAME', layoutMode: 'HORIZONTAL', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, primaryAxisAlign: 'SPACE_BETWEEN', padding: { bottom: 40, left: 0, right: 0, top: 0 },
                     children: [
                         { id: 'f1-logo', name: 'Logo', type: 'TEXT', sizingHorizontal: 'HUG', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'EQI', fontFamily: I.typography.headings.family, fontSize: 42, fontWeight: 700, color: I.colors.primary, textAlign: 'left', lineHeight: 1 } },
                         { id: 'f1-date', name: 'Date', type: 'TEXT', sizingHorizontal: 'HUG', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'out 2024', fontFamily: I.typography.body.family, fontSize: 24, fontWeight: 400, color: I.colors.textMuted, textAlign: 'right', lineHeight: 1 } }
                     ]
                 },
                 {
                     id: 'f1-main-img', name: 'Main Image', type: 'IMAGE', sizingHorizontal: 'FILL', sizingVertical: 'FILL', width: 0, height: 0, cornerRadius: I.cornerRadius.medium,
                     image: { src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1080&auto=format&fit=crop', fit: 'cover' }
                 },
                 {
                     id: 'f1-overlay', name: 'Text Overlay', type: 'FRAME', layoutMode: 'VERTICAL', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, padding: { top: 40, right: 0, bottom: 0, left: 0 }, gap: 16,
                     children: [
                         { id: 'f1-t1', name: 'Title', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'Arquitetura Patrimonial', fontFamily: I.typography.headings.family, fontSize: 56, fontWeight: 500, color: I.colors.primary, textAlign: 'left', lineHeight: 1.1 } },
                         { id: 'f1-t2', name: 'Subtitle', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'Estruturas inteligentes para perpetuar seu legado.', fontFamily: I.typography.body.family, fontSize: 28, fontWeight: 400, color: I.colors.textMuted, textAlign: 'left', lineHeight: 1.4 } }
                     ]
                 }
            ]
        }
    }
];

export const SQUARE_NODES: { name: string, node: SceneNode }[] = [
    {
        name: 'Quote',
        node: {
            id: 'sq1-root', name: 'Square Quote', type: 'FRAME', layoutMode: 'VERTICAL', width: 1080, height: 1080,
            sizingHorizontal: 'FIXED', sizingVertical: 'FIXED',
            backgroundColor: I.colors.background, padding: { top: 120, right: 120, bottom: 120, left: 120 }, gap: 40, primaryAxisAlign: 'CENTER',
            children: [
                { id: 'sq1-icon', name: 'Quote Icon', type: 'TEXT', sizingHorizontal: 'HUG', sizingVertical: 'HUG', width: 0, height: 0, text: { content: '“', fontFamily: I.typography.headings.family, fontSize: 200, fontWeight: 700, color: I.colors.divider, textAlign: 'center', lineHeight: 0.5 } },
                { id: 'sq1-text', name: 'Quote Text', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'Consistency is the key to building long-term wealth.', fontFamily: I.typography.headings.family, fontSize: 72, fontWeight: 500, color: I.colors.primary, textAlign: 'center', lineHeight: 1.2 } },
                { id: 'sq1-author', name: 'Author', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: '— EQI Philosophy', fontFamily: I.typography.body.family, fontSize: 32, fontWeight: 500, color: I.colors.secondary, textAlign: 'center', lineHeight: 1 } }
            ]
        }
    },
    {
        name: 'Visual',
        node: {
            id: 'sq2-root', name: 'Square Visual', type: 'FRAME', layoutMode: 'VERTICAL', width: 1080, height: 1080,
            sizingHorizontal: 'FIXED', sizingVertical: 'FIXED',
            backgroundColor: I.colors.primary, padding: { top: 60, right: 60, bottom: 60, left: 60 }, gap: 30,
            children: [
                {
                    id: 'sq2-img', name: 'Main Image', type: 'IMAGE', sizingHorizontal: 'FILL', sizingVertical: 'FILL', width: 0, height: 0, cornerRadius: I.cornerRadius.medium,
                    image: { src: 'https://images.unsplash.com/photo-1611974765270-ca12586343bb?q=80&w=1080&auto=format&fit=crop', fit: 'cover' }
                },
                {
                    id: 'sq2-caption', name: 'Caption', type: 'FRAME', layoutMode: 'HORIZONTAL', sizingHorizontal: 'FILL', sizingVertical: 'HUG', primaryAxisAlign: 'SPACE_BETWEEN', width: 0, height: 0,
                    children: [
                        { id: 'sq2-t1', name: 'Title', type: 'TEXT', sizingHorizontal: 'HUG', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'Market Update', fontFamily: I.typography.body.family, fontSize: 32, fontWeight: 600, color: I.colors.surface, textAlign: 'left', lineHeight: 1 } },
                        { id: 'sq2-t2', name: 'Date', type: 'TEXT', sizingHorizontal: 'HUG', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'Apr 24', fontFamily: I.typography.body.family, fontSize: 32, fontWeight: 400, color: I.colors.secondary, textAlign: 'right', lineHeight: 1 } }
                    ]
                }
            ]
        }
    }
];