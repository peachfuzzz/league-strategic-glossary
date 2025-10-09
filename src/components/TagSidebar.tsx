'use client'

import React from 'react';
import { tagColors } from '@/data/glossaryData';

interface TagSidebarProps {
  isOpen: boolean;
  allTags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
}

export default function TagSidebar({
  isOpen,
  allTags,
  selectedTags,
  onToggleTag,
  onClearTags
}: TagSidebarProps) {
  return (
    <aside className={`${isOpen ? 'w-64' : 'w-0'} bg-slate-800 border-r border-slate-700 overflow-hidden transition-all duration-300 flex-shrink-0`}>
      <div className="p-4 h-full overflow-y-auto">
        <h2 className="text-sm font-semibold text-slate-400 mb-3">Filter by Tags</h2>
        <div className="space-y-2">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => onToggleTag(tag)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: tagColors[tag] || '#64748b' }}
                />
                <span className="truncate">{tag}</span>
              </div>
            </button>
          ))}
        </div>

        {selectedTags.length > 0 && (
          <button
            onClick={onClearTags}
            className="w-full mt-4 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>
    </aside>
  );
}