import { Template } from '../../../../types';
import { EQI_IDENTITY } from '../../../../constants';
import { STORY_NODES } from './three-pages';
import { MARKET_NODES } from './market-update';

export const InstagramCarouselTemplate: Template = {
    id: 'tmpl_story',
    type: 'SYSTEM',
    ownerId: null,
    identityId: EQI_IDENTITY.id,
    name: 'Instagram Carousel (3 Pages)',
    category: 'SOCIAL',
    width: 1080,
    height: 1920,
    pages: STORY_NODES,
    createdAt: 1709251200000,
    updatedAt: 1709251200000
};

export const MarketUpdateTemplate: Template = {
    id: 'tmpl_mkt_upd',
    type: 'SYSTEM',
    ownerId: null,
    identityId: EQI_IDENTITY.id,
    name: 'Market News Carousel (1080x1350)',
    category: 'SOCIAL',
    width: 1080,
    height: 1350,
    pages: MARKET_NODES,
    createdAt: 1709251200000,
    updatedAt: 1709251200000
};