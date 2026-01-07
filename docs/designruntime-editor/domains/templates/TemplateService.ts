
import { Template, DesignDocument, Page, SceneNode } from '../../types';
import { EQI_IDENTITY } from '../../constants';
import { TemplateRepository } from './TemplateRepository';

const repo = new TemplateRepository();
const MOCK_USER_ID = 'user_01';

export class TemplateService {

    getTemplates(): Template[] {
        return repo.getAllTemplates();
    }

    // --- FACTORY: Template -> Editor Document ---
    
    createDocumentFromTemplate(templateId: string): DesignDocument {
        const template = repo.getTemplateById(templateId);
        if (!template) {
            throw new Error(`Template not found: ${templateId}`);
        }

        // Deep clone pages to create new instances with new IDs
        const pages: Page[] = template.pages.map((p, i) => ({
            id: `page-${crypto.randomUUID()}`,
            name: p.name || `Page ${i + 1}`,
            node: this.cloneNode(p.node)
        }));

        return {
            id: `doc-${crypto.randomUUID()}`,
            templateId: template.id,
            sourceTemplateId: template.type === 'USER' ? template.id : undefined, 
            name: template.type === 'USER' ? template.name : `Untitled ${template.name}`,
            identity: EQI_IDENTITY,
            pages: pages,
            lastModified: Date.now()
        };
    }

    // --- PERSISTENCE: Editor Document -> Template ---

    saveDocumentAsNewTemplate(doc: DesignDocument, name?: string, preview?: string): Template {
        // Convert Doc Pages back to Template Pages (clean IDs not strictly necessary for storage, but good for hygiene)
        const templatePages = doc.pages.map(p => ({
            name: p.name,
            node: JSON.parse(JSON.stringify(p.node)) // Snapshot
        }));

        const newTemplate: Template = {
            id: `tmpl_user_${crypto.randomUUID()}`,
            type: 'USER',
            ownerId: MOCK_USER_ID,
            identityId: doc.identity.id,
            name: name || doc.name,
            category: 'SOCIAL', 
            width: doc.pages[0]?.node.width || 1080,
            height: doc.pages[0]?.node.height || 1080,
            pages: templatePages,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            preview: preview
        };

        repo.saveTemplate(newTemplate);
        return newTemplate;
    }

    updateTemplateFromDocument(doc: DesignDocument, preview?: string): void {
        if (!doc.sourceTemplateId) return;
        
        const existing = repo.getTemplateById(doc.sourceTemplateId);
        if (!existing || existing.type !== 'USER') return;

        const updated: Template = {
            ...existing,
            name: doc.name,
            pages: doc.pages.map(p => ({ name: p.name, node: JSON.parse(JSON.stringify(p.node)) })),
            updatedAt: Date.now(),
            preview: preview || existing.preview // Keep existing if not provided
        };

        repo.saveTemplate(updated);
    }
    
    // --- DIRECT SAVE (AI) ---
    saveTemplate(template: Template): void {
        repo.saveTemplate(template);
    }

    // --- HELPER ---
    private cloneNode(node: SceneNode): SceneNode {
        const newNode = { ...node, id: crypto.randomUUID() };
        if (newNode.type === 'FRAME' && newNode.children) {
            newNode.children = newNode.children.map(c => this.cloneNode(c));
        }
        return newNode;
    }
}

export const TemplateDomain = new TemplateService();
