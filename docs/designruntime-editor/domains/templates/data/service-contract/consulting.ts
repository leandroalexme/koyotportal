import { SceneNode } from '../../../../types';
import { EQI_IDENTITY } from '../../../../constants';

const I = EQI_IDENTITY;

export const CONTRACT_NODES: { name: string, node: SceneNode }[] = [
    {
        name: 'Agreement',
        node: {
            id: 'ct-root', name: 'Contract A4', type: 'FRAME', layoutMode: 'VERTICAL', sizingHorizontal: 'FIXED', sizingVertical: 'FIXED', width: 1240, height: 1754,
            backgroundColor: I.colors.surface, padding: { top: 100, right: 100, bottom: 100, left: 100 }, gap: 40,
            children: [
                { id: 'ct-ti', name: 'Title', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS\nDE CONSULTORIA FINANCEIRA', fontFamily: I.typography.headings.family, fontSize: 28, fontWeight: 700, color: I.colors.primary, textAlign: 'center', lineHeight: 1.4 } },
                
                { id: 'ct-div1', name: 'Divider', type: 'FRAME', sizingHorizontal: 'FILL', sizingVertical: 'FIXED', width: 0, height: 2, backgroundColor: I.colors.primary, children: [] },

                {
                    id: 'ct-body', name: 'Clauses', type: 'FRAME', layoutMode: 'VERTICAL', sizingHorizontal: 'FILL', sizingVertical: 'FILL', width: 0, height: 0, gap: 24,
                    children: [
                         { id: 'ct-cl1', name: 'Clause 1', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: '1. DAS PARTES\n\nCONTRATANTE: [Nome do Cliente], portador do CPF nº [000.000.000-00], residente em [Endereço Completo].\n\nCONTRATADA: EQI INVESTIMENTOS, inscrita no CNPJ sob o nº [00.000.000/0001-00], com sede em [Endereço da Sede].', fontFamily: I.typography.body.family, fontSize: 14, fontWeight: 400, color: I.colors.textMain, textAlign: 'left' as const, lineHeight: 1.6 } },
                         { id: 'ct-cl2', name: 'Clause 2', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: '2. DO OBJETO\n\nO presente contrato tem por objeto a prestação de serviços de assessoria de investimentos, compreendendo a análise de perfil, recomendação de alocação de ativos e acompanhamento periódico da carteira do CONTRATANTE.', fontFamily: I.typography.body.family, fontSize: 14, fontWeight: 400, color: I.colors.textMain, textAlign: 'left' as const, lineHeight: 1.6 } },
                         { id: 'ct-cl3', name: 'Clause 3', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: '3. DA VIGÊNCIA\n\nEste contrato entra em vigor na data de sua assinatura e terá vigência por prazo indeterminado, podendo ser rescindido por qualquer das partes mediante aviso prévio de 30 (trinta) dias.', fontFamily: I.typography.body.family, fontSize: 14, fontWeight: 400, color: I.colors.textMain, textAlign: 'left' as const, lineHeight: 1.6 } }
                    ]
                },

                {
                    id: 'ct-sig-area', name: 'Signatures', type: 'FRAME', layoutMode: 'HORIZONTAL', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, gap: 80, padding: { top: 80, right: 0, bottom: 0, left: 0 },
                    children: [
                        {
                             id: 'ct-sig1', name: 'Sig 1', type: 'FRAME', layoutMode: 'VERTICAL', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, gap: 8,
                             children: [
                                 { id: 'ct-ln1', name: 'Line', type: 'FRAME', sizingHorizontal: 'FILL', sizingVertical: 'FIXED', width: 0, height: 1, backgroundColor: I.colors.textMain, children: [] },
                                 { id: 'ct-nm1', name: 'Name', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'CONTRATANTE', fontFamily: I.typography.body.family, fontSize: 12, fontWeight: 600, color: I.colors.textMain, textAlign: 'center', lineHeight: 1 } }
                             ]
                        },
                        {
                             id: 'ct-sig2', name: 'Sig 2', type: 'FRAME', layoutMode: 'VERTICAL', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, gap: 8,
                             children: [
                                 { id: 'ct-ln2', name: 'Line', type: 'FRAME', sizingHorizontal: 'FILL', sizingVertical: 'FIXED', width: 0, height: 1, backgroundColor: I.colors.textMain, children: [] },
                                 { id: 'ct-nm2', name: 'Name', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'EQI INVESTIMENTOS', fontFamily: I.typography.body.family, fontSize: 12, fontWeight: 600, color: I.colors.textMain, textAlign: 'center', lineHeight: 1 } }
                             ]
                        }
                    ]
                }
            ]
        }
    }
];