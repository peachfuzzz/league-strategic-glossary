'use client'

import React from 'react';
import { tagColors } from '@/data/glossaryData';
import { Filter } from 'lucide-react';

interface TagFilterDropdownProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  allTags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
  hoveredTag: string | null;
  setHoveredTag: (tag: string | null) => void;
}

export default function TagFilterDropdown({
  isOpen,
  onToggleOpen,
  allTags,
  selectedTags,
  onToggleTag,
  onClearTags,
  hoveredTag,
  setHoveredTag
}: TagFilterDropdownProps) {
  // Split tags into 3 columns
  const columnCount = 3;
  const itemsPerColumn = Math.ceil(allTags.length / columnCount);
  const columns = Array.from({ length: columnCount }, (_, i) =>
    allTags.slice(i * itemsPerColumn, (i + 1) * itemsPerColumn)
  );

  return (
    <div className="absolute top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="flex flex-col items-center pointer-events-auto">
        {/* Collapsible tag panel */}
        <div
          className={`bg-[#1e2d45]/80 backdrop-blur-md border border-[rgba(255,255,255,0.1)] rounded-t shadow-lg transition-all duration-300 overflow-hidden ${
            isOpen ? 'max-h-80' : 'max-h-0 border-transparent'
          }`}
          style={{ width: 'calc(min(1280px, 100vw) - 8rem)' }}
        >
          <div className="px-8 py-2.5">
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-sm font-display text-white">
                Filter by Tag
              </h2>
              {selectedTags.length > 0 && (
                <button
                  onClick={onClearTags}
                  className="text-xs text-[#c28f2c] hover:text-[#d4a03d] transition-colors"
                >
                  Clear all ({selectedTags.length})
                </button>
              )}
            </div>

            {/* Three column layout */}
            <div className="grid grid-cols-3 gap-x-6 gap-y-1">
              {columns.map((column, colIndex) => (
                <div key={colIndex} className="space-y-1">
                  {column.map(tag => {
                    const isSelected = selectedTags.includes(tag);
                    const isHovered = hoveredTag === tag;

                    return (
                      <button
                        key={tag}
                        onClick={() => onToggleTag(tag)}
                        onMouseEnter={() => setHoveredTag(tag)}
                        onMouseLeave={() => setHoveredTag(null)}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded transition-colors text-left ${
                          isHovered ? 'bg-[rgba(255,255,255,0.05)]' : ''
                        }`}
                      >
                        {/* Colored dot */}
                        <div
                          className={`w-2.5 h-2.5 rounded-full transition-all flex-shrink-0 ${
                            isSelected ? 'ring-2 ring-[#c28f2c] ring-offset-2 ring-offset-[#1e2d45]/70' : ''
                          }`}
                          style={{ backgroundColor: tagColors[tag] || '#A0A0A0' }}
                        />

                        {/* Label */}
                        <span className={`text-xs flex-1 truncate ${
                          isSelected
                            ? 'text-white font-medium'
                            : 'text-[rgba(255,255,255,0.7)]'
                        }`}>
                          {tag}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab button — always visible, attached to bottom of panel */}
        <button
          onClick={onToggleOpen}
          className={`bg-[#1e2d45]/70 backdrop-blur-sm border border-[rgba(255,255,255,0.1)] border-t-0 rounded-b px-6 py-2 transition-colors ${
            isOpen
              ? 'text-white'
              : 'text-white/70 hover:text-white hover:bg-[#1e2d45]/90'
          }`}
          title={isOpen ? 'Hide filter menu' : 'Show filter menu'}
        >
          <div className="flex items-center gap-2">
            <Filter size={14} />
            <span className="text-xs font-medium">Filters</span>
            {selectedTags.length > 0 && (
              <span className="flex items-center gap-1 ml-1">
                {selectedTags.slice(0, 5).map(tag => (
                  <div
                    key={tag}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: tagColors[tag] || '#A0A0A0' }}
                  />
                ))}
                {selectedTags.length > 5 && (
                  <span className="text-[10px] text-white/50">+{selectedTags.length - 5}</span>
                )}
              </span>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
