import { Template } from '../../../../types';
import { EQI_IDENTITY } from '../../../../constants';
import { CONTRACT_NODES } from './consulting';

export const ServiceContractTemplate: Template = {
    id: 'tmpl_contract',
    type: 'SYSTEM',
    ownerId: null,
    identityId: EQI_IDENTITY.id,
    name: 'Service Contract',
    category: 'PRINT',
    width: 1240,
    height: 1754,
    pages: CONTRACT_NODES,
    createdAt: 1709251200000,
    updatedAt: 1709251200000
};