import { SceneNode, Template } from '../../../../types';
import { EQI_IDENTITY } from '../../../../constants';

const I = EQI_IDENTITY;

const BIZ_CARD_NODES: { name: string, node: SceneNode }[] = [
    {
        name: 'Front',
        node: {
            id: 'bc-front', name: 'Front Side', type: 'FRAME', layoutMode: 'VERTICAL', width: 1050, height: 600,
            sizingHorizontal: 'FIXED', sizingVertical: 'FIXED',
            backgroundColor: I.colors.primary, primaryAxisAlign: 'CENTER', counterAxisAlign: 'CENTER', gap: 16, padding: {top:0, right:0, bottom:0, left:0},
            children: [
                { id: 'bc-logo', name: 'Logo', type: 'TEXT', sizingHorizontal: 'HUG', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'EQI', fontFamily: I.typography.headings.family, fontSize: 120, fontWeight: 700, color: I.colors.surface, textAlign: 'center', lineHeight: 1 } },
                { id: 'bc-tag', name: 'Tagline', type: 'TEXT', sizingHorizontal: 'HUG', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'Investimentos Inteligentes', fontFamily: I.typography.body.family, fontSize: 24, fontWeight: 400, color: I.colors.secondary, textAlign: 'center', lineHeight: 1 } }
            ]
        }
    },
    {
        name: 'Back',
        node: {
            id: 'bc-back', name: 'Back Side', type: 'FRAME', layoutMode: 'HORIZONTAL', width: 1050, height: 600,
            sizingHorizontal: 'FIXED', sizingVertical: 'FIXED',
            backgroundColor: I.colors.surface, padding: { top: 60, right: 80, bottom: 60, left: 80 }, gap: 40, primaryAxisAlign: 'SPACE_BETWEEN',
            children: [
                 {
                     id: 'bc-info', name: 'Info Block', type: 'FRAME', layoutMode: 'VERTICAL', sizingHorizontal: 'FILL', sizingVertical: 'FILL', gap: 8, primaryAxisAlign: 'CENTER', width: 0, height: 0,
                     children: [
                         { id: 'bc-name', name: 'Name', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'Alex Morgan', fontFamily: I.typography.headings.family, fontSize: 56, fontWeight: 700, color: I.colors.textMain, textAlign: 'left', lineHeight: 1 } },
                         { id: 'bc-title', name: 'Title', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'Senior Wealth Advisor', fontFamily: I.typography.body.family, fontSize: 28, fontWeight: 500, color: I.colors.secondary, textAlign: 'left', lineHeight: 1 } },
                         { id: 'bc-spacer', name: 'Spacer', type: 'FRAME', sizingHorizontal: 'FILL', sizingVertical: 'FIXED', height: 32, width: 0, children: [] },
                         { id: 'bc-phone', name: 'Phone', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: '+55 11 99999-0000', fontFamily: I.typography.body.family, fontSize: 22, fontWeight: 400, color: I.colors.textMuted, textAlign: 'left', lineHeight: 1.4 } },
                         { id: 'bc-email', name: 'Email', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'alex.morgan@eqi.com.br', fontFamily: I.typography.body.family, fontSize: 22, fontWeight: 400, color: I.colors.textMuted, textAlign: 'left', lineHeight: 1.4 } },
                         { id: 'bc-web', name: 'Website', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'eqi.com.br', fontFamily: I.typography.body.family, fontSize: 22, fontWeight: 400, color: I.colors.textMuted, textAlign: 'left', lineHeight: 1.4 } }
                     ]
                 },
                 {
                     id: 'bc-qr', name: 'QR Code Area', type: 'FRAME', sizingHorizontal: 'FIXED', width: 180, sizingVertical: 'FIXED', height: 180,
                     backgroundColor: I.colors.textMain, cornerRadius: 12, children: []
                 }
            ]
        }
    }
];

export const BusinessCardTemplate: Template = {
    id: 'tmpl_bizcard',
    type: 'SYSTEM',
    ownerId: null,
    identityId: I.id,
    name: 'Business Card (Front & Back)',
    category: 'PRINT',
    width: 1050,
    height: 600,
    pages: BIZ_CARD_NODES,
    createdAt: 1709251200000,
    updatedAt: 1709251200000
};