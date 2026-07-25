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
    <aside className={`${isOpen ? 'w-64' : 'w-0'} bg-paper border-r border-rule overflow-hidden transition-all duration-300 flex-shrink-0`}>
      <div className="p-4 h-full overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-base font-display text-ink mb-1">
            Filter by Tag
          </h2>
          {selectedTags.length > 0 && (
            <button
              onClick={onClearTags}
              className="text-xs text-signal hover:underline mt-1"
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
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-rule/30 transition-colors text-left group ${
                  isHovered ? 'bg-rule/30' : ''
                }`}
              >
                {/* Colored dot */}
                <div
                  className={`w-3 h-3 rounded-full transition-all flex-shrink-0 ${
                    isSelected ? 'ring-2 ring-signal ring-offset-1' : ''
                  }`}
                  style={{ backgroundColor: tagColors[tag] || '#A0A0A0' }}
                />

                {/* Label */}
                <span className={`text-sm flex-1 truncate ${
                  isSelected
                    ? 'text-ink font-medium'
                    : 'text-ink-3 group-hover:text-ink'
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
