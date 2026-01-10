'use client'

import React from 'react';
import { tagColors } from '@/data/glossaryData';

interface TagSidebarProps {
  isOpen: boolean;
  allTags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
  hoveredTag: string | null;
}

export default function TagSidebar({
  isOpen,
  allTags,
  selectedTags,
  onToggleTag,
  onClearTags,
  hoveredTag
}: TagSidebarProps) {
  return (
    <aside className={`${isOpen ? 'w-64' : 'w-0'} bg-[#FAF9F6] border-r border-[#E5E5E5] overflow-hidden transition-all duration-300 flex-shrink-0`}>
      <div className="p-4 h-full overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-base font-serif font-semibold text-[#2C2C2C] mb-1">
            Filter by Tag
          </h2>
          {selectedTags.length > 0 && (
            <button
              onClick={onClearTags}
              className="text-xs text-[#E07A5F] hover:underline mt-1"
            >
              Clear all ({selectedTags.length})
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          {allTags.map(tag => {
            const isSelected = selectedTags.includes(tag);
            const isHovered = hoveredTag === tag;

            return (
              <button
                key={tag}
                onClick={() => onToggleTag(tag)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#F5F5F5] transition-colors text-left group ${
                  isHovered ? 'bg-[#F5F5F5]' : ''
                }`}
              >
                {/* Colored dot */}
                <div
                  className={`w-3 h-3 rounded-full transition-all flex-shrink-0 ${
                    isSelected ? 'ring-2 ring-[#E07A5F] ring-offset-1' : ''
                  }`}
                  style={{ backgroundColor: tagColors[tag] || '#A0A0A0' }}
                />

                {/* Label */}
                <span className={`text-sm flex-1 truncate ${
                  isSelected
                    ? 'text-[#2C2C2C] font-medium'
                    : 'text-[#6B6B6B] group-hover:text-[#2C2C2C]'
                }`}>
                  {tag}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
