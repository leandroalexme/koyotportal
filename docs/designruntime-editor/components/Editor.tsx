
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { SceneNode, LayoutMap, DesignDocument, Template } from '../types';
import { calculateLayout } from '../services/layoutEngine';
import { RenderEngine } from '../services/renderEngine';
import { TemplateDomain } from '../domains/templates/TemplateService';
import { modifyDesignWithAI, generateTemplateWithAI } from '../services/geminiService';
import { CanvasRenderer } from './CanvasRenderer';
import { PropertiesPanel } from './PropertiesPanel';
import { LayerTree } from './LayerTree';
import { PagesPanel } from './PagesPanel';
import { Header } from './Header';
import { FigmaImportModal } from './FigmaImportModal';
import { JsonModal, TemplatesModal } from './Modals';
import { ExportModal } from './ExportModal';
import { AlertCircle, XCircle, Info, Layers as LayersIcon } from 'lucide-react';
import clsx from 'clsx';

// Helper to find node by ID in tree
const findNode = (root: SceneNode, id: string): SceneNode | null => {
  if (root.id === id) return root;
  if (root.type === 'FRAME') {
    for (const child of root.children) {
      const found = findNode(child, id);
      if (found) return found;
    }
  }
  return null;
};

// Helper to update node in tree (immutable)
const updateNodeInTree = (root: SceneNode, updatedNode: SceneNode): SceneNode => {
  if (root.id === updatedNode.id) return updatedNode;
  if (root.type === 'FRAME') {
    return {
      ...root,
      children: root.children.map(child => updateNodeInTree(child, updatedNode))
    };
  }
  return root;
};

interface Toast {
  message: string;
  type: 'error' | 'info' | 'success';
}

interface EditorProps {
    initialDocument: DesignDocument;
    onBack: () => void;
}

export const Editor: React.FC<EditorProps> = ({ initialDocument, onBack }) => {
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  
  // --- STATE: DOCUMENT & PAGES ---
  const [document, setDocument] = useState<DesignDocument>(initialDocument);
  const [activePageId, setActivePageId] = useState<string>(initialDocument.pages[0].id);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Modal States
  const [isFigmaModalOpen, setIsFigmaModalOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  const [toast, setToast] = useState<Toast | null>(null);
  
  // --- INITIALIZATION ---
  useEffect(() => {
    // Re-initialize engine check if not ready (though mostly it persists in memory)
    if (RenderEngine.isReady) {
        setIsEngineReady(true);
    } else {
        RenderEngine.init()
        .then(() => setIsEngineReady(true))
        .catch((e) => setInitError(e.message || "Unknown error during initialization"));
    }
  }, []);

  // Sync initialDocument if it changes from parent
  useEffect(() => {
      setDocument(initialDocument);
      setActivePageId(initialDocument.pages[0].id);
  }, [initialDocument]);

  // --- AUTOSAVE LOGIC ---
  const saveTimeoutRef = useRef<any>(null);

  useEffect(() => {
      // Only autosave if this document is linked to a user template (sourceTemplateId exists)
      if (document?.sourceTemplateId) {
          setIsSaving(true);
          if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
          
          saveTimeoutRef.current = setTimeout(() => {
             // For autosave, we do NOT generate preview to avoid lag
             TemplateDomain.updateTemplateFromDocument(document);
             setLastSaved(Date.now());
             setIsSaving(false);
          }, 2000); // 2s debounce
      }
      return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [document]);


  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const CANVAS_WIDTH = 2000; 
  const CANVAS_HEIGHT = 1500;
  
  // --- ACTIVE PAGE LOGIC ---
  const activePage = useMemo(() => {
      if (!document) return null;
      return document.pages.find(p => p.id === activePageId) || document.pages[0];
  }, [document, activePageId]);

  // Compute Layout (Only for Active Page)
  const layout = useMemo<LayoutMap>(() => {
    if (!isEngineReady || !activePage) return {};
    return calculateLayout(activePage.node, CANVAS_WIDTH, CANVAS_HEIGHT);
  }, [activePage, isEngineReady]);

  const selectedNode = useMemo(() => {
    return (selectedId && activePage) ? findNode(activePage.node, selectedId) : null;
  }, [activePage, selectedId]);

  // --- HELPER: GENERATE PREVIEW ---
  const generatePreview = async (): Promise<string | undefined> => {
      if (!activePage || !layout || !RenderEngine.isReady) return undefined;
      
      try {
          const rootNode = activePage.node;
          const rootLayout = layout[rootNode.id];
          if (!rootLayout) return undefined;

          // Generate a preview (scale 0.25)
          const scale = 0.25;
          const bytes = RenderEngine.generateImageBytes(rootNode, layout, rootLayout.width, rootLayout.height, {
              format: 'PNG',
              scale,
              transparentBackground: false,
              quality: 0.8,
              scope: 'CURRENT_PAGE'
          });

          // Convert bytes to base64 string
          const blob = new Blob([bytes], { type: 'image/png' });
          return new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
          });
      } catch (e) {
          console.warn("Failed to generate preview", e);
          return undefined;
      }
  };

  // --- ACTIONS ---

  const handleUpdateNode = useCallback((updated: SceneNode) => {
    setDocument(prev => {
        if (!prev) return prev;
        return {
            ...prev,
            pages: prev.pages.map(p => 
                p.id === activePageId 
                ? { ...p, node: updateNodeInTree(p.node, updated) } 
                : p
            )
        };
    });
  }, [activePageId]);

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim() || isAiLoading || !activePage) return;
    setIsAiLoading(true);

    try {
      const isCreationRequest = aiPrompt.toLowerCase().includes('create') && aiPrompt.toLowerCase().includes('template');

      if (isCreationRequest) {
          const newTemplate = await generateTemplateWithAI(aiPrompt);
          handleTemplateSelect(newTemplate);
          setToast({ message: "New Template Generated & Saved!", type: 'success' });
      } else {
          const newDesign = await modifyDesignWithAI(activePage.node, aiPrompt);
          handleUpdateNode(newDesign);
          setToast({ message: "Design updated successfully!", type: 'success' });
      }
      setAiPrompt('');
    } catch (e: any) {
      setToast({ message: "AI Error: " + (e.message || "Failed"), type: 'error' });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleFigmaImport = (newNode: SceneNode) => {
    if (!document) return;
    const newPage = {
        id: `page-${crypto.randomUUID()}`,
        name: newNode.name || 'Imported Design',
        node: newNode
    };
    setDocument(prev => ({
        ...prev,
        pages: [...prev.pages, newPage]
    }));
    setActivePageId(newPage.id);
    setSelectedId(null);
    setIsFigmaModalOpen(false);
    setToast({ message: "Figma design imported as new page!", type: 'success' });
  };

  const handleTemplateSelect = (template: Template) => {
      const newDoc = TemplateDomain.createDocumentFromTemplate(template.id);
      setDocument(newDoc);
      setActivePageId(newDoc.pages[0].id);
      setSelectedId(null);
      setIsTemplateModalOpen(false);
      setToast({ message: "Template loaded!", type: 'info' });
  };
  
  const handleSaveAsTemplate = async () => {
      if (!document) return;
      const name = window.prompt("Enter a name for your new template:", document.name + " (Copy)");
      if (!name) return;

      const preview = await generatePreview();
      const newTemplate = TemplateDomain.saveDocumentAsNewTemplate(document, name, preview);
      
      setDocument(prev => ({ ...prev, sourceTemplateId: newTemplate.id, name: newTemplate.name }));
      setToast({ message: "Saved as new Template!", type: 'success' });
  };

  const handleBack = async () => {
      if (document.sourceTemplateId) {
           const preview = await generatePreview();
           TemplateDomain.updateTemplateFromDocument(document, preview);
      }
      onBack();
  };

  // --- PAGE MANAGEMENT ---
  const addPage = () => {
      if (!document || !activePage) return;
      const newPage = {
          id: `page-${crypto.randomUUID()}`,
          name: `Page ${document.pages.length + 1}`,
          node: JSON.parse(JSON.stringify(activePage.node)) 
      };
      // Rename root to avoid confusion
      newPage.node.id = `root-${crypto.randomUUID()}`; 
      newPage.node.name = newPage.name;

      setDocument(prev => ({ ...prev, pages: [...prev.pages, newPage] }));
      setActivePageId(newPage.id);
  };

  const duplicatePage = (id: string) => {
      if (!document) return;
      const pageToClone = document.pages.find(p => p.id === id);
      if (!pageToClone) return;
      
      const newPage = JSON.parse(JSON.stringify(pageToClone));
      newPage.id = `page-${crypto.randomUUID()}`;
      newPage.name = `${pageToClone.name} Copy`;
      
      if (newPage.node) newPage.node.id = `root-${crypto.randomUUID()}`;

      setDocument(prev => ({ ...prev, pages: [...prev.pages, newPage] }));
  };

  const deletePage = (id: string) => {
      if (!document || document.pages.length <= 1) return;
      const newPages = document.pages.filter(p => p.id !== id);
      setDocument(prev => ({ ...prev, pages: newPages }));
      if (activePageId === id) setActivePageId(newPages[0].id);
  };

  const reorderPage = (id: string, direction: 'up' | 'down') => {
      if (!document) return;
      const idx = document.pages.findIndex(p => p.id === id);
      if (idx === -1) return;
      
      const newPages = [...document.pages];
      if (direction === 'up' && idx > 0) {
          [newPages[idx], newPages[idx-1]] = [newPages[idx-1], newPages[idx]];
      } else if (direction === 'down' && idx < newPages.length - 1) {
          [newPages[idx], newPages[idx+1]] = [newPages[idx+1], newPages[idx]];
      }
      setDocument(prev => ({ ...prev, pages: newPages }));
  };

  if (initError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-red-500 gap-4">
        <AlertCircle size={48} />
        <div className="text-center">
            <h2 className="text-lg font-bold">Initialization Failed</h2>
            <p className="text-sm opacity-80 mt-1">{initError}</p>
        </div>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 text-sm shadow-sm">
            Retry
        </button>
      </div>
    );
  }

  if (!isEngineReady || !document) {
    return (
      <div className="flex items-center justify-center h-screen bg-white text-slate-800 gap-3">
        <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-medium tracking-wide text-slate-500">Loading Editor...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-100 text-slate-900 overflow-hidden font-sans relative">
      
      {/* Modals */}
      <FigmaImportModal isOpen={isFigmaModalOpen} onClose={() => setIsFigmaModalOpen(false)} onImport={handleFigmaImport} />
      <JsonModal isOpen={isJsonModalOpen} onClose={() => setIsJsonModalOpen(false)} data={document} />
      <TemplatesModal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} onSelect={handleTemplateSelect} />
      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} document={document} activePageId={activePageId} />

      {/* Toast */}
      {toast && (
        <div className={clsx(
            "absolute top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-lg shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200 pointer-events-none",
            toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 
            toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            'bg-white text-slate-700 border border-slate-200'
        )}>
           {toast.type === 'error' ? <XCircle size={20} /> : <Info size={20} />}
           <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <Header 
        document={document}
        isSaving={isSaving}
        aiPrompt={aiPrompt}
        isAiLoading={isAiLoading}
        onAiPromptChange={setAiPrompt}
        onAiRun={handleAiGenerate}
        onOpenTemplates={() => setIsTemplateModalOpen(true)}
        onSaveTemplate={handleSaveAsTemplate}
        onImport={() => setIsFigmaModalOpen(true)}
        onShowJson={() => setIsJsonModalOpen(true)}
        onExport={() => setIsExportModalOpen(true)}
        onBack={handleBack}
      />

      {/* Main Workspace - Using Gap for separation instead of borders */}
      <div className="flex flex-1 overflow-hidden relative bg-slate-100 gap-1.5 p-1.5">
        
        {/* Left Panel Group */}
        <div className="flex flex-col gap-1.5 w-64 shrink-0">
            {/* Pages */}
            <div className="flex-[0.4] bg-white rounded-lg overflow-hidden shadow-sm border border-slate-200">
                 <PagesPanel 
                    pages={document.pages} 
                    activePageId={activePageId} 
                    onSetActivePage={setActivePageId} 
                    onAddPage={addPage} 
                    onDuplicatePage={duplicatePage} 
                    onDeletePage={deletePage} 
                    onReorderPage={reorderPage} 
                />
            </div>
            
            {/* Layers */}
            <div className="flex-1 bg-white rounded-lg overflow-hidden shadow-sm border border-slate-200 flex flex-col">
                 <div className="h-12 px-6 flex items-center shrink-0 border-b border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <LayersIcon size={12} /> Layers
                    </span>
                </div>
                <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                    {activePage && <LayerTree node={activePage.node} selectedId={selectedId} onSelect={setSelectedId} />}
                </div>
            </div>
        </div>

        {/* Canvas Area */}
        <main className="flex-1 bg-zinc-900 rounded-lg overflow-hidden relative shadow-inner ring-1 ring-black/5">
            <div className="flex-1 w-full h-full relative">
                {activePage && (
                    <CanvasRenderer 
                        rootNode={activePage.node} 
                        layout={layout} 
                        selectedId={selectedId} 
                        onSelect={setSelectedId} 
                        width={window.innerWidth - 64 - 320 - 280} // Approx adjust
                        height={window.innerHeight - 80} 
                    />
                )}
            </div>
        </main>
        
        {/* Right Panel - Properties */}
        <aside className="w-80 bg-white rounded-lg shadow-sm overflow-hidden z-10 border border-slate-200">
          <PropertiesPanel selectedNode={selectedNode} onUpdate={handleUpdateNode} />
        </aside>
      </div>
    </div>
  );
}
