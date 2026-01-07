import React, { useState } from 'react';
import { X, Download, AlertCircle } from 'lucide-react';
import { fetchFigmaFile } from '../services/figmaService';
import { SceneNode } from '../types';

interface FigmaImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (node: SceneNode) => void;
}

export const FigmaImportModal: React.FC<FigmaImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [token, setToken] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImport = async () => {
    setError(null);
    if (!token || !fileUrl) {
      setError("Please provide both Token and File URL");
      return;
    }

    // Extract File Key from URL
    const fileKeyMatch = fileUrl.match(/(?:file|design)\/([a-zA-Z0-9]+)/);
    const fileKey = fileKeyMatch ? fileKeyMatch[1] : null;

    if (!fileKey) {
      setError("Invalid Figma URL. Could not find file key (e.g. /design/KEY or /file/KEY)");
      return;
    }

    const nodeMatch = fileUrl.match(/node-id=([^&]+)/);
    let nodeId = nodeMatch ? nodeMatch[1] : undefined;
    
    if (nodeId) {
        nodeId = decodeURIComponent(nodeId);
    }

    setLoading(true);
    try {
      const design = await fetchFigmaFile(token, fileKey, nodeId);
      onImport(design);
      onClose();
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to import. Check your token and permissions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-50 rounded-lg border border-purple-100">
             <Download className="text-purple-600" size={24} />
          </div>
          <div>
             <h2 className="text-lg font-bold text-slate-900">Import from Figma</h2>
             <p className="text-xs text-slate-500">Convert standard Figma frames to AutoLayout JSON</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Personal Access Token</label>
            <input 
              type="password" 
              className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="figd_..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <p className="text-[10px] text-slate-500 mt-1">Found in Figma Settings → Account → Personal access tokens</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">File Link</label>
            <input 
              type="text" 
              className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="https://www.figma.com/design/..."
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
            />
             <p className="text-[10px] text-slate-500 mt-1">Paste the full URL. To import a specific frame, select it in Figma first.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-md p-3 flex items-start gap-2 text-red-600">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p className="text-xs font-medium">{error}</p>
            </div>
          )}

          <div className="pt-2">
            <button 
              onClick={handleImport}
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-70 text-white font-medium py-2.5 rounded-md transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                 <>
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                   Importing...
                 </>
              ) : (
                'Import Design'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};