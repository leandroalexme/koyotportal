
import React from 'react';
import { Sparkles, Layout, CloudDownload, Code, Share, Save, CheckCircle, Loader2, ChevronLeft } from 'lucide-react';
import { DesignDocument } from '../types';
import { Button } from './ui/Button';

interface HeaderProps {
    document: DesignDocument;
    isSaving: boolean;
    aiPrompt: string;
    isAiLoading: boolean;
    onAiPromptChange: (val: string) => void;
    onAiRun: () => void;
    onOpenTemplates: () => void;
    onSaveTemplate: () => void;
    onImport: () => void;
    onShowJson: () => void;
    onExport: () => void;
    onBack: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    document,
    isSaving,
    aiPrompt,
    isAiLoading,
    onAiPromptChange,
    onAiRun,
    onOpenTemplates,
    onSaveTemplate,
    onImport,
    onShowJson,
    onExport,
    onBack
}) => {
    
    return (
        <header className="h-16 flex items-center px-6 justify-between bg-white z-20 shrink-0 border-b border-slate-200">
            {/* LEFT: Branding & File Info */}
            <div className="flex items-center gap-4 min-w-[200px]">
                <Button variant="ghost" size="icon" onClick={onBack} title="Back to Dashboard">
                    <ChevronLeft size={20} />
                </Button>
                
                <div className="flex flex-col">
                    <h1 className="font-bold text-sm text-slate-900 leading-tight">{document.name}</h1>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500">DesignRuntime</span>
                        {document.sourceTemplateId && (
                            <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-md">
                                {isSaving ? (
                                    <>
                                        <Loader2 size={10} className="animate-spin text-slate-500" />
                                        <span className="text-[10px] text-slate-500 font-medium">Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={10} className="text-emerald-500" />
                                        <span className="text-[10px] text-slate-500 font-medium">Saved</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* CENTER: AI Command Bar (Floating) */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center w-full max-w-lg">
                <div className="relative w-full group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-purple-600">
                        <Sparkles size={16} />
                    </div>
                    <input 
                        type="text" 
                        // Updated radius and borders
                        className="block w-full rounded-md bg-slate-100 py-2.5 pl-11 pr-24 text-sm font-medium text-slate-900 placeholder:text-slate-500 focus:bg-white focus:ring-2 focus:ring-purple-100 focus:border-purple-200 transition-all shadow-sm border border-transparent outline-none"
                        placeholder="Ask AI to modify design..."
                        value={aiPrompt}
                        onChange={e => onAiPromptChange(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && onAiRun()}
                    />
                    <div className="absolute inset-y-1 right-1">
                        <button 
                            onClick={onAiRun}
                            disabled={isAiLoading || !aiPrompt.trim()}
                            className="h-full px-4 text-[10px] font-bold uppercase tracking-wider bg-white text-slate-900 rounded hover:bg-purple-50 hover:text-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm border border-slate-100"
                        >
                            {isAiLoading ? 'Running...' : 'Generate'}
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT: Actions */}
            <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={onOpenTemplates} title="Open Templates">
                    <Layout size={18} />
                </Button>
                
                <Button variant="ghost" onClick={onSaveTemplate} title="Save as Template">
                    <Save size={18} />
                </Button>

                <div className="h-6 w-px bg-slate-200 mx-2"></div>

                <Button variant="ghost" onClick={onImport} title="Import Figma">
                    <CloudDownload size={18} />
                </Button>
                <Button variant="ghost" onClick={onShowJson} title="View JSON">
                    <Code size={18} />
                </Button>
                <Button variant="primary" onClick={onExport} className="ml-2">
                    <Share size={16} />
                    <span>Export</span>
                </Button>
            </div>
        </header>
    );
};
