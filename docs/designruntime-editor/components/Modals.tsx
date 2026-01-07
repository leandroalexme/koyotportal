import React, { useEffect, useState } from 'react';
import { X, Copy, Check, FileJson, Layout, User, Lock } from 'lucide-react';
import { SceneNode, DesignDocument, Template } from '../types';
import { TemplateDomain } from '../domains/templates/TemplateService';
import clsx from 'clsx';

// --- GENERIC MODAL WRAPPER ---
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ isOpen, onClose, title, icon, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[85vh] overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                        {icon}
                        {title}
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors"><X size={18} /></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- JSON VIEWER MODAL ---
export const JsonModal: React.FC<{ isOpen: boolean; onClose: () => void; data: any }> = ({ isOpen, onClose, data }) => {
    const [copied, setCopied] = React.useState(false);
    const jsonString = JSON.stringify(data, null, 2);

    const handleCopy = () => {
        navigator.clipboard.writeText(jsonString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Document JSON" icon={<FileJson size={18} className="text-blue-600" />}>
            <div className="relative group">
                <button 
                    onClick={handleCopy}
                    className="absolute top-2 right-2 bg-white hover:bg-slate-50 text-xs text-slate-600 px-2 py-1.5 rounded-md flex items-center gap-1.5 transition-all border border-slate-200 shadow-sm"
                >
                    {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    {copied ? "Copied" : "Copy"}
                </button>
                <pre className="bg-slate-50 p-4 rounded-lg text-xs font-mono text-slate-700 overflow-x-auto border border-slate-200 leading-relaxed">
                    {jsonString}
                </pre>
            </div>
        </Modal>
    );
};

// --- TEMPLATES MODAL ---
export const TemplatesModal: React.FC<{ isOpen: boolean; onClose: () => void; onSelect: (template: Template) => void }> = ({ isOpen, onClose, onSelect }) => {
    const [templates, setTemplates] = useState<Template[]>([]);

    useEffect(() => {
        if (isOpen) {
            setTemplates(TemplateDomain.getTemplates());
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Select Template" icon={<Layout size={18} className="text-purple-600" />}>
            <div className="grid grid-cols-2 gap-4">
                {templates.map((tmpl) => (
                    <button 
                        key={tmpl.id}
                        onClick={() => onSelect(tmpl)}
                        className="group relative flex flex-col items-start p-4 bg-white border border-slate-200 hover:border-purple-500 hover:ring-1 hover:ring-purple-500/20 rounded-xl transition-all text-left shadow-sm hover:shadow-md"
                    >
                        <div className="flex items-center justify-between w-full mb-3">
                            <div className={clsx(
                                "w-10 h-10 rounded-lg flex items-center justify-center transition-colors border",
                                tmpl.type === 'SYSTEM' ? "bg-slate-50 border-slate-100" : "bg-purple-50 border-purple-100"
                            )}>
                                {tmpl.type === 'SYSTEM' ? <Layout size={20} className="text-slate-400" /> : <User size={20} className="text-purple-600" />}
                            </div>
                            {tmpl.type === 'SYSTEM' && <Lock size={12} className="text-slate-300" />}
                        </div>
                        
                        <div className="mb-1 w-full">
                            <h4 className="text-sm font-semibold text-slate-900 truncate">{tmpl.name}</h4>
                            <div className="flex gap-2 mt-1">
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider border border-slate-100 rounded px-1.5 py-0.5 bg-slate-50">{tmpl.category}</span>
                                {tmpl.type === 'USER' && <span className="text-[10px] uppercase font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">User</span>}
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                             {tmpl.pages.length} Pages • {tmpl.width}x{tmpl.height}px
                        </p>
                    </button>
                ))}
            </div>
        </Modal>
    );
};