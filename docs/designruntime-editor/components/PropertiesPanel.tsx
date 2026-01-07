
import React from 'react';
import { SceneNode, SizingMode } from '../types';
import { AlignCenter, AlignLeft, AlignRight, LayoutTemplate, Type, Image as ImageIcon, StretchHorizontal, StretchVertical, MousePointer2, ChevronDown, Monitor, Type as TypeIcon, Hash, Box } from 'lucide-react';
import clsx from 'clsx';
import { Input, Select } from './ui/Input';
import { Button } from './ui/Button';

// --- UI ATOMS ---

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="py-5 border-b border-slate-100 last:border-0">
    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">{title}</h3>
    <div className="space-y-3">{children}</div>
  </div>
);

const Row: React.FC<{ label?: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
  <div className={clsx("flex items-center justify-between gap-3", className)}>
    {label && <span className="text-sm text-slate-600 font-medium w-24 shrink-0">{label}</span>}
    <div className="flex-1 flex items-center justify-end min-w-0">{children}</div>
  </div>
);

const ControlGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex bg-slate-100 rounded-md p-1 w-full gap-1">{children}</div>
);

// --- MAIN COMPONENT ---

interface PropertiesPanelProps {
  selectedNode: SceneNode | null;
  onUpdate: (updatedNode: SceneNode) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedNode, onUpdate }) => {
  if (!selectedNode) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-full text-slate-500 p-8">
         <div className="w-16 h-16 bg-slate-50 rounded-lg flex items-center justify-center mb-4 border border-slate-100">
             <MousePointer2 size={24} className="text-slate-400" />
         </div>
         <p className="text-sm font-semibold text-slate-800">No Selection</p>
         <p className="text-xs text-slate-500 mt-2 max-w-[200px]">Select a layer on the canvas to edit its properties.</p>
      </div>
    );
  }

  const handleChange = (key: string, value: any) => {
    onUpdate({ ...selectedNode, [key]: value });
  };
  
  const handleNestedChange = (parent: string, key: string, value: any) => {
    // @ts-ignore
    onUpdate({ ...selectedNode, [parent]: { ...selectedNode[parent], [key]: value } });
  };

  const handlePaddingChange = (val: number) => {
      handleChange('padding', { top: val, right: val, bottom: val, left: val });
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-900">
      {/* Node Header */}
      <div className="h-20 flex items-center px-6 shrink-0 bg-white border-b border-slate-100">
        <div className="flex items-center gap-4 w-full">
           <div className={clsx("w-10 h-10 rounded-md flex items-center justify-center shrink-0 transition-colors border", 
               selectedNode.type === 'FRAME' ? "bg-blue-50 text-blue-600 border-blue-100" : selectedNode.type === 'TEXT' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-purple-50 text-purple-600 border-purple-100"
           )}>
                {selectedNode.type === 'FRAME' && <LayoutTemplate size={20} />}
                {selectedNode.type === 'TEXT' && <Type size={20} />}
                {selectedNode.type === 'IMAGE' && <ImageIcon size={20} />}
           </div>
           <div className="min-w-0 flex-1">
                <input 
                    type="text" 
                    value={selectedNode.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="font-bold text-lg leading-none bg-transparent border-none p-0 focus:ring-0 w-full truncate text-slate-900 placeholder-slate-400 mb-1"
                />
                <div className="text-xs text-slate-500 font-medium">{selectedNode.type} Layer</div>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-12 custom-scrollbar">
        
        {/* SECTION: AUTO LAYOUT */}
        {selectedNode.type === 'FRAME' && (
            <Section title="Auto Layout">
                <Row>
                    <ControlGroup>
                        <Button 
                            variant="icon"
                            active={selectedNode.layoutMode === 'VERTICAL'}
                            onClick={() => handleChange('layoutMode', 'VERTICAL')}
                            title="Vertical"
                            className="flex-1"
                        >
                            <StretchVertical size={16} />
                        </Button>
                        <Button 
                            variant="icon"
                            active={selectedNode.layoutMode === 'HORIZONTAL'}
                            onClick={() => handleChange('layoutMode', 'HORIZONTAL')}
                            title="Horizontal"
                            className="flex-1"
                        >
                            <StretchHorizontal size={16} />
                        </Button>
                    </ControlGroup>
                </Row>
                
                <div className="grid grid-cols-2 gap-3 mt-2">
                    <Input 
                        label="Gap"
                        type="number" 
                        value={selectedNode.gap || 0} 
                        onChange={(e) => handleChange('gap', parseInt(e.target.value))} 
                    />
                    <Input 
                        label="Padding"
                        type="number" 
                        value={selectedNode.padding?.top || 0} 
                        onChange={(e) => handlePaddingChange(parseInt(e.target.value))} 
                    />
                </div>

                <div className="space-y-3 mt-4">
                    <Select label="Primary Align" value={selectedNode.primaryAxisAlign} onChange={(e) => handleChange('primaryAxisAlign', e.target.value)}>
                        <option value="START">Start</option>
                        <option value="CENTER">Center</option>
                        <option value="END">End</option>
                        <option value="SPACE_BETWEEN">Space Between</option>
                    </Select>
                    <Select label="Counter Align" value={selectedNode.counterAxisAlign} onChange={(e) => handleChange('counterAxisAlign', e.target.value)}>
                        <option value="START">Start</option>
                        <option value="CENTER">Center</option>
                        <option value="END">End</option>
                    </Select>
                </div>
            </Section>
        )}

        {/* SECTION: DIMENSIONS */}
        <Section title="Dimensions">
            <div className="space-y-4">
                <Row label="Width">
                    <div className="flex flex-col w-full gap-2">
                        <Select value={selectedNode.sizingHorizontal} onChange={(e) => handleChange('sizingHorizontal', e.target.value)}>
                            <option value="FIXED">Fixed Width</option>
                            <option value="FILL">Fill Container</option>
                            <option value="HUG">Hug Contents</option>
                        </Select>
                        {selectedNode.sizingHorizontal === 'FIXED' && (
                             <Input 
                                type="number" 
                                value={selectedNode.width} 
                                onChange={(e) => handleChange('width', parseInt(e.target.value))} 
                                icon={<span className="text-[10px] font-bold">W</span>}
                            />
                        )}
                    </div>
                </Row>

                <Row label="Height">
                    <div className="flex flex-col w-full gap-2">
                        <Select value={selectedNode.sizingVertical} onChange={(e) => handleChange('sizingVertical', e.target.value)}>
                            <option value="FIXED">Fixed Height</option>
                            <option value="FILL">Fill Container</option>
                            <option value="HUG">Hug Contents</option>
                        </Select>
                        {selectedNode.sizingVertical === 'FIXED' && (
                             <Input 
                                type="number" 
                                value={selectedNode.height} 
                                onChange={(e) => handleChange('height', parseInt(e.target.value))} 
                                icon={<span className="text-[10px] font-bold">H</span>}
                            />
                        )}
                    </div>
                </Row>
            </div>
        </Section>

        {/* SECTION: TYPOGRAPHY */}
        {selectedNode.type === 'TEXT' && (
            <Section title="Typography">
                <div className="mb-4">
                     <textarea 
                        className="w-full rounded-md bg-slate-100 px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-100 transition-all resize-y min-h-[80px] border border-transparent focus:border-slate-300"
                        value={selectedNode.text.content}
                        onChange={(e) => handleNestedChange('text', 'content', e.target.value)}
                        placeholder="Type text content here..."
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <Input 
                        label="Size"
                        type="number" 
                        value={selectedNode.text.fontSize} 
                        onChange={(e) => handleNestedChange('text', 'fontSize', parseInt(e.target.value))}
                        icon={<TypeIcon size={12} />} 
                    />
                     <Select label="Weight" value={selectedNode.text.fontWeight} onChange={(e) => handleNestedChange('text', 'fontWeight', parseInt(e.target.value))}>
                        <option value="400">Regular</option>
                        <option value="500">Medium</option>
                        <option value="600">Semi Bold</option>
                        <option value="700">Bold</option>
                    </Select>
                </div>
                
                <Row label="Align">
                    <ControlGroup>
                         {['left', 'center', 'right'].map((align) => (
                             <Button 
                                variant="icon"
                                key={align}
                                onClick={() => handleNestedChange('text', 'textAlign', align)}
                                active={selectedNode.text.textAlign === align}
                                className="flex-1"
                             >
                                {align === 'left' ? <AlignLeft size={16} /> : 
                                 align === 'center' ? <AlignCenter size={16} /> : 
                                 <AlignRight size={16} />}
                             </Button>
                         ))}
                    </ControlGroup>
                </Row>
            </Section>
        )}

        {/* SECTION: STYLE */}
        {(selectedNode.type === 'FRAME' || selectedNode.type === 'IMAGE') && (
            <Section title="Appearance">
                <div className="grid grid-cols-2 gap-3">
                    <Input 
                        label="Radius"
                        type="number" 
                        value={selectedNode.cornerRadius || 0} 
                        onChange={(e) => handleChange('cornerRadius', parseInt(e.target.value))}
                        icon={<span className="text-[10px] font-bold">R</span>} 
                    />
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Opacity</label>
                         <div className="flex items-center gap-3 h-10 bg-slate-100 rounded-md px-3 border border-transparent">
                            <input 
                                type="range" min="0" max="1" step="0.1" 
                                value={selectedNode.opacity ?? 1} 
                                onChange={(e) => handleChange('opacity', parseFloat(e.target.value))}
                                className="flex-1 h-1 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-slate-900"
                            />
                            <span className="text-xs font-mono font-medium text-slate-500 w-8 text-right">{Math.round((selectedNode.opacity ?? 1) * 100)}%</span>
                         </div>
                    </div>
                </div>
            </Section>
        )}

      </div>
    </div>
  );
};
