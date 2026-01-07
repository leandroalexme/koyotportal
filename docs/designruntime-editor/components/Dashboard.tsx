
import React, { useState, useEffect } from 'react';
import { 
    Layout, 
    Box, 
    BarChart3, 
    ShoppingBag, 
    Palette, 
    Settings, 
    Plus, 
    Search, 
    User,
    Lock,
    Trash2
} from 'lucide-react';
import clsx from 'clsx';
import { Template } from '../types';
import { TemplateDomain } from '../domains/templates/TemplateService';
import { Button } from './ui/Button';

interface DashboardProps {
    onOpenTemplate: (templateId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenTemplate }) => {
    const [activeTab, setActiveTab] = useState<'TEMPLATES' | 'ANALYTICS' | 'MARKET' | 'BRAND'>('TEMPLATES');
    const [templates, setTemplates] = useState<Template[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = () => {
        const all = TemplateDomain.getTemplates();
        setTemplates(all);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Delete template?')) {
             const key = `design_runtime::template::${id}`;
             localStorage.removeItem(key);
             const indexKey = 'design_runtime::templates::index';
             const index = localStorage.getItem(indexKey);
             if (index) {
                 const ids = JSON.parse(index).filter((i: string) => i !== id);
                 localStorage.setItem(indexKey, JSON.stringify(ids));
             }
             loadTemplates();
        }
    };

    const userTemplates = templates.filter(t => t.type === 'USER');
    const systemTemplates = templates.filter(t => t.type === 'SYSTEM');
    
    const filteredUser = userTemplates.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredSystem = systemTemplates.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const navItems = [
        { id: 'TEMPLATES', icon: Layout, label: 'My Templates' },
        { id: 'ANALYTICS', icon: BarChart3, label: 'Analytics' },
        { id: 'MARKET', icon: ShoppingBag, label: 'Marketplace' },
        { id: 'BRAND', icon: Palette, label: 'Brand Hub' },
    ] as const;

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
            {/* SIDEBAR */}
            <aside className="w-72 bg-slate-50 flex flex-col shrink-0 p-4 border-r border-slate-200">
                <div className="h-16 flex items-center px-2 mb-4">
                    <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center mr-3 shadow-md shadow-slate-200">
                        <Box size={20} className="text-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-slate-900">DesignRuntime</span>
                </div>

                <div className="space-y-1 flex-1">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={clsx(
                                "w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                                activeTab === item.id 
                                    ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
                                    : "text-slate-600 hover:bg-white/60 hover:text-slate-900"
                            )}
                        >
                            <item.icon size={18} className={activeTab === item.id ? "text-slate-900" : "text-slate-500"} />
                            {item.label}
                            {item.id === 'TEMPLATES' && (
                                <span className="ml-auto text-xs font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded">
                                    {templates.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="mt-auto pt-6">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border border-slate-200">
                         <div className="w-9 h-9 rounded-md bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs border border-purple-100">
                             EQ
                         </div>
                         <div className="flex-1 min-w-0">
                             <div className="text-sm font-bold truncate">EQI Investimentos</div>
                             <div className="text-xs text-slate-500 truncate">Admin Workspace</div>
                         </div>
                         <Settings size={16} className="text-slate-400" />
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 overflow-y-auto bg-white p-10 relative">
                <div className="max-w-7xl mx-auto">
                    
                    {/* Header */}
                    <div className="flex items-end justify-between mb-10">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                                {navItems.find(i => i.id === activeTab)?.label}
                            </h1>
                            <p className="text-slate-500 text-sm mt-1 max-w-md">
                                Manage your visual assets and templates.
                            </p>
                        </div>
                        {activeTab === 'TEMPLATES' && (
                            <Button variant="primary" onClick={() => onOpenTemplate(systemTemplates[0]?.id)}>
                                <Plus size={18} />
                                Create New
                            </Button>
                        )}
                    </div>

                    {/* Placeholder content */}
                    {activeTab !== 'TEMPLATES' && (
                        <div className="flex flex-col items-center justify-center h-96 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            <h3 className="text-xl font-bold text-slate-700">Coming Soon</h3>
                        </div>
                    )}

                    {/* Templates View */}
                    {activeTab === 'TEMPLATES' && (
                        <>
                             {/* Search */}
                             <div className="relative mb-10 group">
                                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="Search templates..." 
                                    className="w-full max-w-md pl-12 pr-4 py-2.5 rounded-md bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-500 focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-slate-100 transition-all outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                             </div>

                             {/* User Templates Section */}
                             {filteredUser.length > 0 && (
                                 <div className="mb-14">
                                     <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">My Designs</h2>
                                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                         {filteredUser.map(tmpl => (
                                             <TemplateCard 
                                                key={tmpl.id} 
                                                template={tmpl} 
                                                onClick={() => onOpenTemplate(tmpl.id)} 
                                                onDelete={(e) => handleDelete(e, tmpl.id)}
                                             />
                                         ))}
                                     </div>
                                 </div>
                             )}

                             {/* System Templates Section */}
                             <div>
                                 <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">System Templates</h2>
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                     {filteredSystem.map(tmpl => (
                                         <TemplateCard 
                                            key={tmpl.id} 
                                            template={tmpl} 
                                            onClick={() => onOpenTemplate(tmpl.id)} 
                                         />
                                     ))}
                                 </div>
                             </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

const TemplateCard: React.FC<{ template: Template; onClick: () => void; onDelete?: (e: React.MouseEvent) => void }> = ({ template, onClick, onDelete }) => {
    return (
        <div 
            onClick={onClick}
            className="group cursor-pointer flex flex-col gap-3"
        >
            {/* Image Container - Reduced radius */}
            <div className="aspect-[4/3] bg-slate-100 rounded-lg overflow-hidden relative shadow-sm border border-slate-200 transition-all duration-300 group-hover:shadow-md group-hover:border-slate-300">
                 {template.preview ? (
                     <img src={template.preview} alt={template.name} className="w-full h-full object-cover" />
                 ) : (
                     <div className="w-full h-full flex items-center justify-center">
                        {template.type === 'SYSTEM' ? <Lock size={32} className="text-slate-300" /> : <Layout size={32} className="text-slate-300" />}
                     </div>
                 )}
                 
                 <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onDelete && (
                        <button 
                            onClick={onDelete}
                            className="w-7 h-7 bg-white/90 backdrop-blur rounded-md flex items-center justify-center text-slate-600 hover:text-red-600 hover:bg-white shadow-sm transition-colors border border-slate-200"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                 </div>
            </div>

            {/* Info */}
            <div className="flex items-start justify-between px-0.5">
                <div>
                    <h3 className="font-semibold text-slate-900 text-sm leading-tight group-hover:text-purple-700 transition-colors">{template.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                         {template.width}x{template.height} • {template.category}
                    </p>
                </div>
                {template.type === 'USER' && (
                     <div className="w-5 h-5 rounded-md bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
                         <User size={10} />
                     </div>
                 )}
            </div>
        </div>
    );
}
