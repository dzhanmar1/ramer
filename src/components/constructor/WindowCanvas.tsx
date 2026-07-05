import React, { useRef, useState, useEffect } from 'react';
import type { Section } from '../../store/windowStore';
import { useWindowStore } from '../../store/windowStore';
import { useI18nStore } from '../../store/i18nStore';
import { Maximize2, Minimize2, SplitSquareHorizontal, SplitSquareVertical, Undo2, Redo2, Trash2 } from 'lucide-react';

const FRAME_WIDTH = 60; // mm
const SASH_WIDTH = 50; // mm
const MULLION_WIDTH = 60; // mm

interface SectionRendererProps {
  section: Section;
  x: number;
  y: number;
  w: number;
  h: number;
  onSelect: (id: string) => void;
  selectedId: string | null;
  onDragStart: (id: string, type: 'v' | 'h', x: number, w: number, y: number, h: number) => void;
  splitSection: (id: string, dir: 'split-v' | 'split-h') => void;
  removeSplit: (id: string) => void;
  updateSection: (id: string, updates: Partial<Section>) => void;
}

const SectionRenderer: React.FC<SectionRendererProps> = ({ section, x, y, w, h, onSelect, selectedId, onDragStart, splitSection, removeSplit, updateSection }) => {
  const isSelected = section.id === selectedId;

  if (section.type === 'split-v') {
    const split = section.splitRatio || 0.5;
    const leftW = Math.max(0, w * split - MULLION_WIDTH / 2);
    const rightW = Math.max(0, w * (1 - split) - MULLION_WIDTH / 2);
    const rightX = x + leftW + MULLION_WIDTH;
    const mullionX = x + leftW;

    return (
      <g>
        {/* Left child */}
        {section.children?.[0] && (
          <SectionRenderer section={section.children[0]} x={x} y={y} w={leftW} h={h} onSelect={onSelect} selectedId={selectedId} onDragStart={onDragStart} splitSection={splitSection} removeSplit={removeSplit} updateSection={updateSection} />
        )}
        {/* Right child */}
        {section.children?.[1] && (
          <SectionRenderer section={section.children[1]} x={rightX} y={y} w={rightW} h={h} onSelect={onSelect} selectedId={selectedId} onDragStart={onDragStart} splitSection={splitSection} removeSplit={removeSplit} updateSection={updateSection} />
        )}
        
        {/* The mullion with drag handle */}
        <g 
          style={{ cursor: 'col-resize' }} 
          onPointerDown={(e) => { e.stopPropagation(); onDragStart(section.id, 'v', x, w, y, h); }}
        >
          {/* Invisible hit area for fat fingers */}
          <rect x={mullionX - 100} y={y} width={MULLION_WIDTH + 200} height={h} fill="transparent" />
          <rect x={mullionX} y={y} width={MULLION_WIDTH} height={h} fill="#cbd5e1" stroke="#94a3b8" strokeWidth={2} />
          {/* Visual indicator for drag */}
          <line x1={mullionX + MULLION_WIDTH/2} y1={y + h/2 - 60} x2={mullionX + MULLION_WIDTH/2} y2={y + h/2 + 60} stroke="#475569" strokeWidth={8} strokeLinecap="round" />
        </g>
      </g>
    );
  }

  if (section.type === 'split-h') {
    const split = section.splitRatio || 0.5;
    const topH = Math.max(0, h * split - MULLION_WIDTH / 2);
    const bottomH = Math.max(0, h * (1 - split) - MULLION_WIDTH / 2);
    const bottomY = y + topH + MULLION_WIDTH;
    const mullionY = y + topH;

    return (
      <g>
        {/* Top child */}
        {section.children?.[0] && (
          <SectionRenderer section={section.children[0]} x={x} y={y} w={w} h={topH} onSelect={onSelect} selectedId={selectedId} onDragStart={onDragStart} splitSection={splitSection} removeSplit={removeSplit} updateSection={updateSection} />
        )}
        {/* Bottom child */}
        {section.children?.[1] && (
          <SectionRenderer section={section.children[1]} x={x} y={bottomY} w={w} h={bottomH} onSelect={onSelect} selectedId={selectedId} onDragStart={onDragStart} splitSection={splitSection} removeSplit={removeSplit} updateSection={updateSection} />
        )}

        {/* The mullion with drag handle */}
        <g 
          style={{ cursor: 'row-resize' }} 
          onPointerDown={(e) => { e.stopPropagation(); onDragStart(section.id, 'h', x, w, y, h); }}
        >
          {/* Invisible hit area for fat fingers */}
          <rect x={x} y={mullionY - 100} width={w} height={MULLION_WIDTH + 200} fill="transparent" />
          <rect x={x} y={mullionY} width={w} height={MULLION_WIDTH} fill="#cbd5e1" stroke="#94a3b8" strokeWidth={2} />
          {/* Visual indicator for drag */}
          <line x1={x + w/2 - 60} y1={mullionY + MULLION_WIDTH/2} x2={x + w/2 + 60} y2={mullionY + MULLION_WIDTH/2} stroke="#475569" strokeWidth={8} strokeLinecap="round" />
        </g>
      </g>
    );
  }

  // Leaf node (fixed or sash)
  const isSash = section.type === 'sash';
  const glassX = x + (isSash ? SASH_WIDTH : 0);
  const glassY = y + (isSash ? SASH_WIDTH : 0);
  const glassW = Math.max(0, w - (isSash ? SASH_WIDTH * 2 : 0));
  const glassH = Math.max(0, h - (isSash ? SASH_WIDTH * 2 : 0));

  return (
    <g onClick={(e) => { e.stopPropagation(); onSelect(section.id); }} className="cursor-pointer">
      {/* Outer frame of the leaf */}
      {isSash && (
        <>
          {/* Beveled outer frame for realism */}
          <rect x={x} y={y} width={w} height={h} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={2} />
          <path d={`M ${x} ${y} L ${glassX} ${glassY} L ${glassX + glassW} ${glassY} L ${x + w} ${y} Z`} fill="#e2e8f0" />
          <path d={`M ${x + w} ${y} L ${glassX + glassW} ${glassY} L ${glassX + glassW} ${glassY + glassH} L ${x + w} ${y + h} Z`} fill="#cbd5e1" />
          <path d={`M ${x + w} ${y + h} L ${glassX + glassW} ${glassY + glassH} L ${glassX} ${glassY + glassH} L ${x} ${y + h} Z`} fill="#94a3b8" />
          <path d={`M ${x} ${y + h} L ${glassX} ${glassY + glassH} L ${glassX} ${glassY} L ${x} ${y} Z`} fill="#cbd5e1" />
        </>
      )}
      
      {/* Glass */}
      <rect 
        x={glassX} 
        y={glassY} 
        width={glassW} 
        height={glassH} 
        fill="#e0f2fe" 
        stroke={isSelected ? "#2563eb" : "#94a3b8"} 
        strokeWidth={isSelected ? 6 : 2} 
        opacity={0.8}
      />
      {/* Glass Reflection */}
      <polygon points={`${glassX + 10},${glassY + glassH - 10} ${glassX + glassW - 10},${glassY + 10} ${glassX + glassW - 50},${glassY + 10} ${glassX + 10},${glassY + glassH - 50}`} fill="#ffffff" opacity={0.3} />

      {/* Internal dimensions */}
      <text x={glassX + glassW/2} y={glassY + 40} textAnchor="middle" fontSize={Math.min(40, glassW/5)} fill="#64748b" fontWeight="bold">
        {Math.round(w)}
      </text>
      <text x={glassX + 40} y={glassY + glassH/2} textAnchor="middle" fontSize={Math.min(40, glassH/5)} fill="#64748b" fontWeight="bold" transform={`rotate(-90 ${glassX + 40} ${glassY + glassH/2})`}>
        {Math.round(h)}
      </text>

      {/* Opening Lines */}
      {isSash && section.openingMode !== 'fixed' && (
        <>
          {(section.openingMode === 'turn' || section.openingMode === 'tilt-turn') && (
            <polyline 
              points={`${glassX},${glassY} ${glassX + glassW},${glassY + glassH/2} ${glassX},${glassY + glassH}`}
              fill="none" stroke="#64748b" strokeWidth={3} strokeDasharray="15, 15" 
            />
          )}
          {(section.openingMode === 'tilt' || section.openingMode === 'tilt-turn') && (
            <polyline 
              points={`${glassX},${glassY + glassH} ${glassX + glassW/2},${glassY} ${glassX + glassW},${glassY + glassH}`}
              fill="none" stroke="#64748b" strokeWidth={3} strokeDasharray="15, 15" 
            />
          )}
          {/* Handle */}
          <g transform={`translate(${glassX + glassW - 25}, ${glassY + glassH/2 - 35})`}>
            <rect x={0} y={0} width={12} height={70} fill="#f8fafc" rx={6} stroke="#94a3b8" strokeWidth={1} />
            <circle cx={6} cy={35} r={14} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={1} />
          </g>
        </>
      )}

    </g>
  );
};

export const WindowCanvas: React.FC<{ selectedId: string | null; onSelect: (id: string | null) => void }> = ({ selectedId, onSelect }) => {
  const { config, updateSplitRatio, splitSection, removeSplit, updateSection, commitHistory, undo, redo, history, historyIndex } = useWindowStore();
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Dragging state
  const [draggingInfo, setDraggingInfo] = useState<{ id: string, type: 'v'|'h', bx: number, bw: number, by: number, bh: number } | null>(null);

  const innerW = config.width - FRAME_WIDTH * 2;
  const innerH = config.height - FRAME_WIDTH * 2;
  const padding = 200;
  const vbW = config.width + padding * 2;
  const vbH = config.height + padding * 2;

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingInfo) return;
    const svg = svgRef.current;
    if (!svg) return;

    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse());

    if (draggingInfo.type === 'v') {
      const newRatio = (svgP.x - draggingInfo.bx) / draggingInfo.bw;
      updateSplitRatio(draggingInfo.id, newRatio);
    } else {
      const newRatio = (svgP.y - draggingInfo.by) / draggingInfo.bh;
      updateSplitRatio(draggingInfo.id, newRatio);
    }
  };

  const handlePointerUp = () => {
    setDraggingInfo(null);
  };

  // Global pointer up to catch releases outside
  useEffect(() => {
    const upHandler = () => setDraggingInfo(null);
    window.addEventListener('pointerup', upHandler);
    return () => window.removeEventListener('pointerup', upHandler);
  }, []);

  const canUndo = historyIndex >= 0;
  // If historyIndex is tracking the position in the array, we can redo if historyIndex < history.length - 1. 
  // But wait, our undo logic says if we undo at the end, it pushes current, so history length increases.
  // Actually, historyIndex + 1 < history.length indicates redo is possible.
  const canRedo = historyIndex + 1 < history.length;

  const t = useI18nStore(state => state.t);

  const getSelectedInfo = (section: Section, targetId: string, currentX: number, currentY: number, currentW: number, currentH: number, parentId: string | null): any => {
    if (section.id === targetId) return { section, x: currentX, y: currentY, w: currentW, h: currentH, parentId };
    if (section.type === 'split-v' && section.children) {
      const split = section.splitRatio || 0.5;
      const leftW = Math.max(0, currentW * split - MULLION_WIDTH / 2);
      const rightW = Math.max(0, currentW * (1 - split) - MULLION_WIDTH / 2);
      const rightX = currentX + leftW + MULLION_WIDTH;
      const leftInfo = getSelectedInfo(section.children[0], targetId, currentX, currentY, leftW, currentH, section.id);
      if (leftInfo) return leftInfo;
      return getSelectedInfo(section.children[1], targetId, rightX, currentY, rightW, currentH, section.id);
    }
    if (section.type === 'split-h' && section.children) {
      const split = section.splitRatio || 0.5;
      const topH = Math.max(0, currentH * split - MULLION_WIDTH / 2);
      const bottomH = Math.max(0, currentH * (1 - split) - MULLION_WIDTH / 2);
      const bottomY = currentY + topH + MULLION_WIDTH;
      const topInfo = getSelectedInfo(section.children[0], targetId, currentX, currentY, currentW, topH, section.id);
      if (topInfo) return topInfo;
      return getSelectedInfo(section.children[1], targetId, currentX, bottomY, currentW, bottomH, section.id);
    }
    return null;
  };

  const selectedInfo = selectedId ? getSelectedInfo(config.rootSection, selectedId, FRAME_WIDTH, FRAME_WIDTH, innerW, innerH, null) : null;

  return (
    <div className="w-full h-full max-h-[70vh] flex items-center justify-center p-4 relative">
      
      {/* Undo / Redo Toolbar */}
      <div className="absolute top-4 right-4 flex gap-2 z-10 bg-white/80 p-2 rounded-xl shadow backdrop-blur">
        <button 
          onClick={undo} 
          disabled={!canUndo}
          className={`p-2 rounded-lg transition-colors ${canUndo ? 'hover:bg-slate-200 text-slate-700' : 'text-slate-300 cursor-not-allowed'}`}
          title="Назад (Отменить)"
        >
          <Undo2 className="w-5 h-5" />
        </button>
        <button 
          onClick={redo} 
          disabled={!canRedo}
          className={`p-2 rounded-lg transition-colors ${canRedo ? 'hover:bg-slate-200 text-slate-700' : 'text-slate-300 cursor-not-allowed'}`}
          title="Вперед (Повторить)"
        >
          <Redo2 className="w-5 h-5" />
        </button>
      </div>

      <svg 
        ref={svgRef}
        viewBox={`-${padding} -${padding} ${vbW} ${vbH}`} 
        className="w-full h-full drop-shadow-2xl"
        style={{ touchAction: 'none' }}
        onClick={() => onSelect(null)}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Main Dimensions */}
        <text x={config.width / 2} y={-(padding / 2)} textAnchor="middle" fontSize={80} fill="#334155" fontWeight="bold">
          {config.width}
        </text>
        <text x={-(padding / 2)} y={config.height / 2} textAnchor="middle" fontSize={80} fill="#334155" transform={`rotate(-90 -${padding / 2} ${config.height / 2})`} fontWeight="bold">
          {config.height}
        </text>

        <line x1={0} y1={-50} x2={config.width} y2={-50} stroke="#94a3b8" strokeWidth={6} markerStart="url(#arrow)" markerEnd="url(#arrow)" />
        <line x1={-50} y1={0} x2={-50} y2={config.height} stroke="#94a3b8" strokeWidth={6} markerStart="url(#arrow)" markerEnd="url(#arrow)" />

        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
          </marker>
        </defs>

        {/* Main Outer Frame */}
        <rect x={0} y={0} width={config.width} height={config.height} fill="#e2e8f0" stroke="#64748b" strokeWidth={2} />
        {/* Bevel for outer frame */}
        <path d={`M 0 0 L ${FRAME_WIDTH} ${FRAME_WIDTH} L ${config.width - FRAME_WIDTH} ${FRAME_WIDTH} L ${config.width} 0 Z`} fill="#f1f5f9" />
        <path d={`M ${config.width} 0 L ${config.width - FRAME_WIDTH} ${FRAME_WIDTH} L ${config.width - FRAME_WIDTH} ${config.height - FRAME_WIDTH} L ${config.width} ${config.height} Z`} fill="#cbd5e1" />
        <path d={`M ${config.width} ${config.height} L ${config.width - FRAME_WIDTH} ${config.height - FRAME_WIDTH} L ${FRAME_WIDTH} ${config.height - FRAME_WIDTH} L 0 ${config.height} Z`} fill="#94a3b8" />
        <path d={`M 0 ${config.height} L ${FRAME_WIDTH} ${config.height - FRAME_WIDTH} L ${FRAME_WIDTH} ${FRAME_WIDTH} L 0 0 Z`} fill="#cbd5e1" />

        {/* Inner Sections */}
        <SectionRenderer 
          section={config.rootSection} 
          x={FRAME_WIDTH} 
          y={FRAME_WIDTH} 
          w={innerW} 
          h={innerH} 
          onSelect={onSelect}
          selectedId={selectedId}
          onDragStart={(id, type, bx, bw, by, bh) => {
            commitHistory(); // Save state before dragging!
            setDraggingInfo({id, type, bx, bw, by, bh});
          }}
          splitSection={splitSection}
          removeSplit={removeSplit}
          updateSection={updateSection}
        />

        {/* Global Contextual Menu */}
        {selectedInfo && (
          <foreignObject 
            x={selectedInfo.x - 400} 
            y={selectedInfo.y - 400} 
            width={selectedInfo.w + 800} 
            height={selectedInfo.h + 800} 
            style={{ pointerEvents: 'none', overflow: 'visible' }}
          >
            <div className="w-full h-full flex flex-col items-center justify-center p-4">
              <div 
                className="flex flex-wrap gap-2 justify-center bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-2xl border-2 border-blue-200" 
                style={{ pointerEvents: 'auto', transform: 'scale(3.5)', transformOrigin: 'center' }}
              >
                
                {/* Split Actions */}
                <button 
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
                  title={t('calc.modal.split_v')}
                  onClick={(e) => { e.stopPropagation(); splitSection(selectedInfo.section.id, 'split-v'); }}
                ><SplitSquareHorizontal className="w-5 h-5" /></button>
                
                <button 
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
                  title={t('calc.modal.split_h')}
                  onClick={(e) => { e.stopPropagation(); splitSection(selectedInfo.section.id, 'split-h'); }}
                ><SplitSquareVertical className="w-5 h-5" /></button>

                <div className="w-px h-8 bg-slate-200 mx-1"></div>

                {/* Sash Actions */}
                {selectedInfo.section.type === 'sash' ? (
                  <>
                    <button 
                      className={`px-3 py-1 text-sm font-medium rounded-lg border ${selectedInfo.section.openingMode === 'turn' ? 'bg-blue-100 border-blue-200 text-blue-800' : 'bg-white hover:bg-slate-50'}`}
                      onClick={(e) => { e.stopPropagation(); updateSection(selectedInfo.section.id, { openingMode: 'turn' }); }}
                    >{t('calc.modal.mode.turn')}</button>
                    <button 
                      className={`px-3 py-1 text-sm font-medium rounded-lg border ${selectedInfo.section.openingMode === 'tilt-turn' ? 'bg-blue-100 border-blue-200 text-blue-800' : 'bg-white hover:bg-slate-50'}`}
                      onClick={(e) => { e.stopPropagation(); updateSection(selectedInfo.section.id, { openingMode: 'tilt-turn' }); }}
                    >{t('calc.modal.mode.tilt')}</button>

                    <button 
                      className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors ml-1"
                      title={t('calc.modal.remove_sash')}
                      onClick={(e) => { e.stopPropagation(); updateSection(selectedInfo.section.id, { type: 'fixed', openingMode: 'fixed' }); }}
                    ><Minimize2 className="w-5 h-5" /></button>
                  </>
                ) : (
                  <button 
                    className="px-3 py-1 text-sm font-medium rounded-lg border bg-white hover:bg-slate-50 flex items-center gap-2"
                    onClick={(e) => { e.stopPropagation(); updateSection(selectedInfo.section.id, { type: 'sash', openingMode: 'turn' }); }}
                  >
                    <Maximize2 className="w-4 h-4" /> {t('calc.modal.make_sash')}
                  </button>
                )}

                {/* Remove Split Action */}
                {selectedInfo.parentId && (
                  <>
                    <div className="w-px h-8 bg-slate-200 mx-1"></div>
                    <button 
                      className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                      title="Удалить разделение"
                      onClick={(e) => { e.stopPropagation(); removeSplit(selectedInfo.parentId); }}
                    ><Trash2 className="w-5 h-5" /></button>
                  </>
                )}
              </div>
            </div>
          </foreignObject>
        )}
      </svg>
    </div>
  );
};
