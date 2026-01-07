import { Template } from '../../types';
import { SYSTEM_TEMPLATES } from './data';

const INDEX_KEY = 'design_runtime::templates::index';
const PREFIX = 'design_runtime::template::';

export class TemplateRepository {
    
    // --- READ ---

    getAllTemplates(): Template[] {
        const system = SYSTEM_TEMPLATES;
        const user = this.getUserTemplates();
        return [...system, ...user].sort((a, b) => b.updatedAt - a.updatedAt);
    }

    getTemplateById(id: string): Template | undefined {
        // 1. Check System
        const sys = SYSTEM_TEMPLATES.find(t => t.id === id);
        if (sys) return sys;

        // 2. Check User Storage (Direct Key Lookup)
        const stored = localStorage.getItem(`${PREFIX}${id}`);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error(`Failed to parse template ${id}`, e);
            }
        }
        return undefined;
    }

    private getUserTemplates(): Template[] {
        const indexStr = localStorage.getItem(INDEX_KEY);
        if (!indexStr) return [];
        
        try {
            const ids = JSON.parse(indexStr) as string[];
            const templates: Template[] = [];
            
            for (const id of ids) {
                const tmpl = this.getTemplateById(id);
                if (tmpl && tmpl.type === 'USER') {
                    templates.push(tmpl);
                }
            }
            return templates;
        } catch (e) {
            console.error("Failed to load user templates index", e);
            return [];
        }
    }

    // --- WRITE ---

    saveTemplate(template: Template): void {
        if (template.type !== 'USER') {
            console.warn("Cannot save SYSTEM templates.");
            return;
        }

        const id = template.id;
        const key = `${PREFIX}${id}`;
        
        // 1. Save Data
        localStorage.setItem(key, JSON.stringify(template));

        // 2. Update Index if new
        this.addToIndex(id);
    }

    deleteTemplate(id: string): void {
        const key = `${PREFIX}${id}`;
        localStorage.removeItem(key);
        this.removeFromIndex(id);
    }

    // --- INDEX MANAGEMENT ---

    private addToIndex(id: string) {
        const indexStr = localStorage.getItem(INDEX_KEY);
        let ids: string[] = indexStr ? JSON.parse(indexStr) : [];
        
        if (!ids.includes(id)) {
            ids.push(id);
            localStorage.setItem(INDEX_KEY, JSON.stringify(ids));
        }
    }

    private removeFromIndex(id: string) {
        const indexStr = localStorage.getItem(INDEX_KEY);
        if (!indexStr) return;
        
        let ids: string[] = JSON.parse(indexStr);
        ids = ids.filter(i => i !== id);
        localStorage.setItem(INDEX_KEY, JSON.stringify(ids));
    }
}