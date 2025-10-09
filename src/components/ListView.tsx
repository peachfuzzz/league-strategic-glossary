'use client'

import React from 'react';
import { Search } from 'lucide-react';
import { GlossaryTerm, tagColorClasses } from '@/data/glossaryData';

interface ListViewProps {
  filteredTerms: GlossaryTerm[];
  selectedNode: GlossaryTerm | null;
  setSelectedNode: (node: GlossaryTerm | null) => void;
  glossaryData: GlossaryTerm[];
}

export default function ListView({
  filteredTerms,
  selectedNode,
  setSelectedNode,
  glossaryData
}: ListViewProps) {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-3">
        {filteredTerms.length === 0 ? (
          <div className="text-center py-16">
            <Search size={48} className="mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400">No terms match your filters</p>
          </div>
        ) : (
          filteredTerms.map(term => (
            <div
              key={term.id}
              onClick={() => setSelectedNode(term)}
              className={`bg-slate-800 border rounded-lg p-4 cursor-pointer transition-all hover:border-blue-500 ${
                selectedNode?.id === term.id ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white">{term.term}</h3>
                        <div className="flex flex-wrap gap-1 justify-end">
                          {term.tags.map(tag => (
                            <span
                              key={tag}
                              className={`px-2 py-0.5 text-xs rounded-full text-white ${tagColorClasses[tag] || 'bg-gray-600'}`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-300 text-sm mb-2">{term.definition}</p>
                      {term.links.length > 0 && (
                        <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                          <span className="font-semibold">Related:</span>
                          {term.links.map(linkId => {
                            const linkedTerm = glossaryData.find(t => t.id === linkId);
                            return linkedTerm ? (
                              <span
                                key={linkId}
                                className="px-2 py-0.5 bg-slate-700 rounded hover:bg-slate-600 transition-colors"
                              >
                                {linkedTerm.term}
                              </span>
                            ) : null;
                          })}
                    </div>
                )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}