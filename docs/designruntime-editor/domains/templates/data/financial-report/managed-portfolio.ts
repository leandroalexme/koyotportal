import { SceneNode } from '../../../../types';
import { EQI_IDENTITY } from '../../../../constants';

const I = EQI_IDENTITY;

const createTableRow = (id: string, col1: string, col2: string, col3: string, isHeader = false) => ({
    id: id,
    name: isHeader ? 'Header Row' : 'Row',
    type: 'FRAME' as const,
    layoutMode: 'HORIZONTAL' as const,
    sizingHorizontal: 'FILL' as const,
    sizingVertical: 'HUG' as const,
    width: 0, height: 0,
    padding: { top: 12, right: 16, bottom: 12, left: 16 },
    gap: 16,
    backgroundColor: isHeader ? I.colors.background : I.colors.surface,
    children: [
        {
            id: `${id}-c1`, name: 'Col 1', type: 'TEXT' as const, sizingHorizontal: 'FILL' as const, sizingVertical: 'HUG' as const, width: 0, height: 0,
            text: { content: col1, fontFamily: isHeader ? I.typography.body.family : I.typography.body.family, fontSize: 14, fontWeight: isHeader ? 600 : 400, color: I.colors.textMain, textAlign: 'left' as const, lineHeight: 1 }
        },
        {
            id: `${id}-c2`, name: 'Col 2', type: 'TEXT' as const, sizingHorizontal: 'FIXED' as const, sizingVertical: 'HUG' as const, width: 100, height: 0,
            text: { content: col2, fontFamily: I.typography.body.family, fontSize: 14, fontWeight: isHeader ? 600 : 400, color: I.colors.textMain, textAlign: 'right' as const, lineHeight: 1 }
        },
        {
            id: `${id}-c3`, name: 'Col 3', type: 'TEXT' as const, sizingHorizontal: 'FIXED' as const, sizingVertical: 'HUG' as const, width: 80, height: 0,
            text: { content: col3, fontFamily: I.typography.body.family, fontSize: 14, fontWeight: isHeader ? 600 : 400, color: isHeader ? I.colors.textMain : I.colors.primary, textAlign: 'right' as const, lineHeight: 1 }
        }
    ]
});

export const REPORT_NODES: { name: string, node: SceneNode }[] = [
    {
        name: 'Report Page',
        node: {
            id: 'rp-root', name: 'A4 Report', type: 'FRAME', layoutMode: 'VERTICAL', sizingHorizontal: 'FIXED', sizingVertical: 'FIXED', width: 1240, height: 1754,
            backgroundColor: I.colors.surface, padding: { top: 80, right: 80, bottom: 80, left: 80 }, gap: 40,
            children: [
                {
                    id: 'rp-header', name: 'Header', type: 'FRAME', layoutMode: 'HORIZONTAL', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, primaryAxisAlign: 'SPACE_BETWEEN',
                    children: [
                        { id: 'rp-logo', name: 'Logo', type: 'TEXT', sizingHorizontal: 'HUG', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'EQI Research', fontFamily: I.typography.headings.family, fontSize: 32, fontWeight: 700, color: I.colors.primary, textAlign: 'left', lineHeight: 1 } },
                        { id: 'rp-meta', name: 'Meta', type: 'TEXT', sizingHorizontal: 'HUG', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'Carteira Recomendada • Abril 2025', fontFamily: I.typography.body.family, fontSize: 16, fontWeight: 500, color: I.colors.textMuted, textAlign: 'right', lineHeight: 1 } }
                    ]
                },
                { id: 'rp-div1', name: 'Divider', type: 'FRAME', sizingHorizontal: 'FILL', sizingVertical: 'FIXED', width: 0, height: 1, backgroundColor: I.colors.divider, children: [] },
                {
                    id: 'rp-title-sec', name: 'Title Section', type: 'FRAME', layoutMode: 'VERTICAL', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, gap: 16,
                    children: [
                        { id: 'rp-h1', name: 'H1', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'Carteira de Dividendos', fontFamily: I.typography.headings.family, fontSize: 48, fontWeight: 700, color: I.colors.primary, textAlign: 'left', lineHeight: 1.2 } },
                        { id: 'rp-p1', name: 'Intro', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'Selecionamos as empresas com maior potencial de distribuição de proventos para o próximo trimestre, focando em solidez de caixa e previsibilidade.', fontFamily: I.typography.body.family, fontSize: 18, fontWeight: 400, color: I.colors.textMuted, textAlign: 'left', lineHeight: 1.5 } }
                    ]
                },
                {
                    id: 'rp-table', name: 'Data Table', type: 'FRAME', layoutMode: 'VERTICAL', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, gap: 1, backgroundColor: I.colors.divider, cornerRadius: 8,
                    children: [
                        createTableRow('tr-head', 'Ação', 'Código', 'Peso', true),
                        createTableRow('tr-1', 'Petrobrás', 'PETR4', '20%'),
                        createTableRow('tr-2', 'Itaú Unibanco', 'ITUB4', '20%'),
                        createTableRow('tr-3', 'CPFL Energia', 'CPFE3', '15%'),
                        createTableRow('tr-4', 'Banco do Brasil', 'BBAS3', '10%'),
                        createTableRow('tr-5', 'BB Seguridade', 'BBSE3', '10%'),
                        createTableRow('tr-6', 'Eletrobrás', 'ELET6', '10%'),
                        createTableRow('tr-7', 'Bradesco', 'BBDC4', '5%'),
                        createTableRow('tr-8', 'Copel', 'CPLE6', '5%'),
                        createTableRow('tr-9', 'Isa Cteep', 'TRPL4', '5%'),
                    ]
                },
                {
                    id: 'rp-chart-sec', name: 'Chart Section', type: 'FRAME', layoutMode: 'HORIZONTAL', sizingHorizontal: 'FILL', sizingVertical: 'FIXED', width: 0, height: 400, gap: 40, padding: { top: 40, right: 0, bottom: 0, left: 0 },
                    children: [
                        {
                            id: 'rp-chart-img', name: 'Chart', type: 'IMAGE', sizingHorizontal: 'FILL', sizingVertical: 'FILL', width: 0, height: 0, cornerRadius: 12,
                            image: { src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop', fit: 'cover' }
                        },
                        {
                             id: 'rp-chart-txt', name: 'Analysis', type: 'FRAME', layoutMode: 'VERTICAL', sizingHorizontal: 'FIXED', width: 300, sizingVertical: 'FILL', height: 0, gap: 20,
                             children: [
                                 { id: 'rp-an-ti', name: 'Title', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'Análise Setorial', fontFamily: I.typography.headings.family, fontSize: 24, fontWeight: 700, color: I.colors.primary, textAlign: 'left', lineHeight: 1 } },
                                 { id: 'rp-an-bo', name: 'Body', type: 'TEXT', sizingHorizontal: 'FILL', sizingVertical: 'HUG', width: 0, height: 0, text: { content: 'O setor elétrico continua dominante devido à baixa volatilidade e contratos ajustados pela inflação. Bancos seguem descontados.', fontFamily: I.typography.body.family, fontSize: 16, fontWeight: 400, color: I.colors.textMuted, textAlign: 'left', lineHeight: 1.5 } }
                             ]
                        }
                    ]
                }
            ]
        }
    }
];