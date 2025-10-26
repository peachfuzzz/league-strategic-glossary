'use client'

import React from 'react';
import { X, MousePointer2, Network, Search, Eye } from 'lucide-react';

interface HelpCardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpCard({ isOpen, onClose }: HelpCardProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl w-full max-w-2xl p-8 relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
          aria-label="Close help"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to LoL Glossary!</h2>
          <p className="text-slate-400 text-sm">Learn how to navigate and discover League of Legends terms</p>
        </div>

        {/* Instructions */}
        <div className="space-y-5">
          {/* Instruction 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <MousePointer2 size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Discover Terms</h3>
              <p className="text-slate-300 text-sm">
                Click on any <span className="underline decoration-2">underlined words</span> in definitions or listed words below a term to see their associated definition.
              </p>
            </div>
          </div>

          {/* Instruction 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Network size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">View Connections</h3>
              <p className="text-slate-300 text-sm">
                Click on <strong>Graph View</strong> to visualize the connections between terms you've discovered.
              </p>
            </div>
          </div>

          {/* Instruction 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <Search size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Search Anything</h3>
              <p className="text-slate-300 text-sm">
                Click on the <strong>Search bar</strong> (or press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded border border-slate-600 text-xs">⌘K</kbd>) to look up any term. Not limited to visible terms.
              </p>
            </div>
          </div>

          {/* Instruction 4 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
              <Eye size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Toggle View Modes</h3>
              <p className="text-slate-300 text-sm">
                Click the <strong>Explore/View All</strong> button to switch between progressive discovery mode and viewing all terms at once.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Got it, let's explore!
          </button>
        </div>
      </div>
    </div>
  );
}
