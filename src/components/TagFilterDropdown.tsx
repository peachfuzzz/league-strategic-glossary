'use client'

import React from 'react';
import { tagColors } from '@/data/glossaryData';
import { X } from 'lucide-react';

interface TagFilterDropdownProps {
  isOpen: boolean;
  allTags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
  hoveredTag: string | null;
  setHoveredTag: (tag: string | null) => void;
}

export default function TagFilterDropdown({
  isOpen,
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
    <div className="absolute left-0 right-0 flex justify-center z-40 pointer-events-none" style={{ top: '100%' }}>
      <div
        className={`bg-[#1e2d45]/50 backdrop-blur-sm border border-[rgba(255,255,255,0.1)] rounded-b shadow-lg transition-all duration-300 overflow-hidden pointer-events-auto ${
          isOpen ? 'max-h-80' : 'max-h-0'
        }`}
        style={{ width: 'calc(min(1280px, 100%) - 8rem)' }}
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
    </div>
  );
}
