import React, { useState } from 'react';
import { X, Download, Image, FileText, Code, Check, Layers } from 'lucide-react';
import { DesignDocument, Page, LayoutMap, ExportFormat, ExportOptions } from '../types';
import { RenderEngine } from '../services/renderEngine';
import clsx from 'clsx';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DesignDocument;
  activePageId: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, document: designDoc, activePageId }) => {
  const [format, setFormat] = useState<ExportFormat>('PNG');
  const [scale, setScale] = useState<1 | 2 | 3>(2);
  const [transparent, setTransparent] = useState(false);
  const [scope, setScope] = useState<'CURRENT_PAGE' | 'ALL_PAGES'>('CURRENT_PAGE');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
        const options: ExportOptions = {
            format,
            scale,
            transparentBackground: transparent,
            quality: 1.0,
            scope
        };

        const blob = await RenderEngine.exportDocument(designDoc.pages, activePageId, options);
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const ext = format.toLowerCase();
        let fileName = `${designDoc.name.replace(/\s+/g, '_')}`;
        
        if (scope === 'ALL_PAGES' && format !== 'PDF') {
            fileName += '.zip';
        } else if (scope === 'CURRENT_PAGE') {
            const pageName = designDoc.pages.find(p => p.id === activePageId)?.name || 'page';
            fileName += `_${pageName.replace(/\s+/g, '_')}_${scale}x.${ext}`;
        } else {
             fileName += `.${ext}`; 
        }

        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
    } catch (e) {
        console.error("Export failed", e);
        alert("Export failed: " + (e as any).message);
    } finally {
        setIsExporting(false);
    }
  };

  const getFormatIcon = (fmt: ExportFormat) => {
      switch(fmt) {
          case 'PNG': return <Image size={18} />;
          case 'PDF': return <FileText size={18} />;
          case 'SVG': return <Code size={18} />;
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-sm p-6 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-lg font-bold text-slate-900 mb-1">Export</h2>
        <p className="text-xs text-slate-500 mb-6">Download your designs locally.</p>

        <div className="space-y-6">
            
            {/* FORMAT */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Format</label>
                <div className="grid grid-cols-3 gap-3">
                    {(['PNG', 'PDF', 'SVG'] as ExportFormat[]).map((fmt) => (
                        <button
                            key={fmt}
                            onClick={() => setFormat(fmt)}
                            className={clsx(
                                "flex flex-col items-center justify-center gap-1 p-3 rounded-lg border transition-all",
                                format === fmt 
                                ? "bg-slate-50 border-slate-900 text-slate-900 ring-1 ring-slate-900" 
                                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300"
                            )}
                        >
                            {getFormatIcon(fmt)}
                            <span className="text-xs font-medium">{fmt}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* SCOPE */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pages</label>
                <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                     <button
                        onClick={() => setScope('CURRENT_PAGE')}
                        className={clsx(
                            "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                            scope === 'CURRENT_PAGE' 
                            ? "bg-white text-slate-900 shadow-sm" 
                            : "text-slate-500 hover:text-slate-700"
                        )}
                     >
                        Current Page
                     </button>
                     <button
                        onClick={() => setScope('ALL_PAGES')}
                        className={clsx(
                            "flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-2",
                            scope === 'ALL_PAGES' 
                            ? "bg-white text-slate-900 shadow-sm" 
                            : "text-slate-500 hover:text-slate-700"
                        )}
                     >
                        <Layers size={12} />
                        All Pages ({designDoc.pages.length})
                     </button>
                </div>
            </div>

            {/* SCALE (PNG Only) */}
            {format === 'PNG' && (
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Scale</label>
                    <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                        {[1, 2, 3].map((s) => (
                            <button
                                key={s}
                                onClick={() => setScale(s as 1|2|3)}
                                className={clsx(
                                    "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                                    scale === s 
                                    ? "bg-white text-slate-900 shadow-sm" 
                                    : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                {s}x
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* OPTIONS */}
            <div className="space-y-2">
                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Options</label>
                 
                 {format === 'PNG' && (
                     <button 
                        onClick={() => setTransparent(!transparent)}
                        className="flex items-center gap-2 w-full text-left p-2 hover:bg-slate-50 rounded-md text-sm text-slate-700 transition-colors border border-transparent hover:border-slate-200"
                     >
                        <div className={clsx(
                            "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                            transparent ? "bg-slate-900 border-slate-900" : "bg-white border-slate-300"
                        )}>
                            {transparent && <Check size={10} className="text-white" />}
                        </div>
                        Transparent Background
                     </button>
                 )}

                 {format === 'SVG' && scope === 'ALL_PAGES' && (
                     <div className="text-[10px] text-slate-500 px-2">
                        Exported as a .zip file containing individual SVGs.
                     </div>
                 )}
            </div>

            {/* ACTION */}
            <button 
                onClick={handleExport}
                disabled={isExporting}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 shadow-sm"
            >
                {isExporting ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Exporting...
                    </>
                ) : (
                    <>
                        <Download size={18} />
                        Export {scope === 'ALL_PAGES' && format !== 'PDF' ? 'ZIP' : format}
                    </>
                )}
            </button>

        </div>
      </div>
    </div>
  );
};