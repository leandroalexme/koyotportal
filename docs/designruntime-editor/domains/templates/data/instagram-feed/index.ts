import { Template } from '../../../../types';
import { EQI_IDENTITY } from '../../../../constants';
import { FEED_NODES, SQUARE_NODES } from './rich';
import { CORPORATE_NODES } from './corporate';

export const InstagramFeedTemplate: Template = {
    id: 'tmpl_feed',
    type: 'SYSTEM',
    ownerId: null,
    identityId: EQI_IDENTITY.id,
    name: 'Instagram Feed (Rich)',
    category: 'SOCIAL',
    width: 1080,
    height: 1350,
    pages: FEED_NODES,
    createdAt: 1709251200000,
    updatedAt: 1709251200000
};

export const InstagramSquareTemplate: Template = {
    id: 'tmpl_sq_post',
    type: 'SYSTEM',
    ownerId: null,
    identityId: EQI_IDENTITY.id,
    name: 'Instagram Square (2 Layouts)',
    category: 'SOCIAL',
    width: 1080,
    height: 1080,
    pages: SQUARE_NODES,
    createdAt: 1709251200000,
    updatedAt: 1709251200000
};

export const CorporateFeedTemplate: Template = {
    id: 'tmpl_corp_feed',
    type: 'SYSTEM',
    ownerId: null,
    identityId: EQI_IDENTITY.id,
    name: 'Corporate Feed (Timeline/Stats)',
    category: 'SOCIAL',
    width: 1080,
    height: 1350,
    pages: CORPORATE_NODES,
    createdAt: 1709251200000,
    updatedAt: 1709251200000
};