
import React from 'react';
import { SceneNode } from '../types';
import { ChevronRight, ChevronDown, LayoutTemplate, Type, Image as ImageIcon } from 'lucide-react';
import clsx from 'clsx';

interface LayerTreeProps {
  node: SceneNode;
  selectedId: string | null;
  onSelect: (id: string) => void;
  depth?: number;
}

export const LayerTree: React.FC<LayerTreeProps> = ({ node, selectedId, onSelect, depth = 0 }) => {
  const isSelected = node.id === selectedId;
  const [expanded, setExpanded] = React.useState(true);
  const hasChildren = node.type === 'FRAME' && node.children.length > 0;

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node.id);
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  return (
    <div>
      <div 
        className={clsx(
          "flex items-center h-8 px-2 mx-2 rounded cursor-pointer transition-all text-sm select-none mb-0.5",
          isSelected 
            ? "bg-slate-900 text-white font-medium shadow-sm" 
            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleSelect}
      >
        <button 
          className={clsx(
              "mr-1.5 w-4 h-4 flex items-center justify-center rounded hover:bg-white/20 transition-colors", 
              isSelected ? "text-slate-300" : "text-slate-500 hover:text-slate-700",
              !hasChildren && "invisible"
          )}
          onClick={toggleExpand}
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
        
        <div className={clsx("mr-2.5", isSelected ? "text-slate-200" : "text-slate-400")}>
           {node.type === 'FRAME' && <LayoutTemplate size={14} />}
           {node.type === 'TEXT' && <Type size={14} />}
           {node.type === 'IMAGE' && <ImageIcon size={14} />}
        </div>
        
        <span className="truncate">{node.name}</span>
      </div>

      {hasChildren && expanded && (
        <div>
          {/* @ts-ignore - node.children checked by hasChildren */}
          {node.children.map((child: SceneNode) => (
            <LayerTree 
              key={child.id} 
              node={child} 
              selectedId={selectedId} 
              onSelect={onSelect} 
              depth={depth + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
};
