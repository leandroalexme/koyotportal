
import React from 'react';
import { Page } from '../types';
import { Plus, Trash2, Copy, File, ChevronUp, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { Button } from './ui/Button';

interface PagesPanelProps {
  pages: Page[];
  activePageId: string;
  onSetActivePage: (id: string) => void;
  onAddPage: () => void;
  onDuplicatePage: (id: string) => void;
  onDeletePage: (id: string) => void;
  onReorderPage: (id: string, direction: 'up' | 'down') => void;
}

export const PagesPanel: React.FC<PagesPanelProps> = ({
  pages,
  activePageId,
  onSetActivePage,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
  onReorderPage
}) => {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="h-12 px-6 flex items-center justify-between shrink-0 border-b border-slate-100">
         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pages</span>
         <Button variant="icon" size="icon" onClick={onAddPage} title="New Page">
           <Plus size={16} />
         </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {pages.map((page, index) => {
          const isActive = page.id === activePageId;
          return (
            <div 
              key={page.id}
              onClick={() => onSetActivePage(page.id)}
              className={clsx(
                "group relative p-2.5 rounded-md cursor-pointer transition-all flex items-center gap-3 select-none",
                isActive 
                  ? "bg-slate-900 text-white shadow-md ring-1 ring-slate-900" 
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-100 hover:border-slate-200"
              )}
            >
               {/* Mini Icon */}
               <div className={clsx(
                   "w-8 h-8 rounded-md flex items-center justify-center shrink-0",
                   isActive ? "bg-white/10" : "bg-white border border-slate-200"
               )}>
                    <File size={14} className={isActive ? "text-white" : "text-slate-400"} />
               </div>

               <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{page.name || `Page ${index + 1}`}</div>
                    <div className={clsx("text-[10px] mt-0.5", isActive ? "text-slate-400" : "text-slate-500")}>Page {index + 1}</div>
               </div>
               
               {isActive && (
                   <div className="flex items-center gap-1">
                       <button onClick={(e) => { e.stopPropagation(); onDuplicatePage(page.id); }} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors" title="Duplicate"><Copy size={12} /></button>
                   </div>
               )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
