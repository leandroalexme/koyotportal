import { Template } from '../../../../types';
import { EQI_IDENTITY } from '../../../../constants';
import { REPORT_NODES } from './managed-portfolio';

export const FinancialReportTemplate: Template = {
    id: 'tmpl_report',
    type: 'SYSTEM',
    ownerId: null,
    identityId: EQI_IDENTITY.id,
    name: 'Financial Report (Table)',
    category: 'PRINT',
    width: 1240,
    height: 1754,
    pages: REPORT_NODES,
    createdAt: 1709251200000,
    updatedAt: 1709251200000
};