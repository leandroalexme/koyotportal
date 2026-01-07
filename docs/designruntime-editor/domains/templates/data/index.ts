import { Template } from '../../../types';

import { InstagramCarouselTemplate, MarketUpdateTemplate } from './instagram-carousel';
import { InstagramFeedTemplate, InstagramSquareTemplate, CorporateFeedTemplate } from './instagram-feed';
import { LinkedInTemplate } from './linkedin';
import { DisplayAdTemplate } from './display-ad';
import { BusinessCardTemplate } from './business-card';
import { FinancialReportTemplate } from './financial-report';
import { ServiceContractTemplate } from './service-contract';

export const SYSTEM_TEMPLATES: Template[] = [
    MarketUpdateTemplate,
    CorporateFeedTemplate,
    InstagramCarouselTemplate,
    InstagramFeedTemplate,
    InstagramSquareTemplate,
    LinkedInTemplate,
    DisplayAdTemplate,
    BusinessCardTemplate,
    FinancialReportTemplate,
    ServiceContractTemplate
];