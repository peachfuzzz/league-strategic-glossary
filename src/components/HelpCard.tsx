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
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1e2d45] rounded border border-[rgba(255,255,255,0.2)] shadow-paper-lg w-full max-w-2xl p-8 relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[rgba(255,255,255,0.5)] hover:text-[#c28f2c] transition-colors rounded hover:bg-[rgba(255,255,255,0.05)]"
          aria-label="Close help"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-display text-white mb-2">Welcome to the Glossary</h2>
          <p className="text-[rgba(255,255,255,0.6)] text-sm">Learn how to navigate and discover League of Legends strategic terms</p>
        </div>

        {/* Instructions */}
        <div className="space-y-5">
          {/* Instruction 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-[#c28f2c] rounded flex items-center justify-center">
              <MousePointer2 size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Discover Terms</h3>
              <p className="text-[rgba(255,255,255,0.6)] text-sm">
                Click on any <span className="underline decoration-1">underlined words</span> in definitions or listed words below a term to see their associated definition.
              </p>
            </div>
          </div>

          {/* Instruction 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-[#9B87F5] rounded flex items-center justify-center">
              <Network size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">View Connections</h3>
              <p className="text-[rgba(255,255,255,0.6)] text-sm">
                Click on <strong>Graph View</strong> to visualize the connections between terms you've discovered.
              </p>
            </div>
          </div>

          {/* Instruction 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-[#10B981] rounded flex items-center justify-center">
              <Search size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Search Anything</h3>
              <p className="text-[rgba(255,255,255,0.6)] text-sm">
                Click on the <strong>Search bar</strong> (or press <kbd className="px-1.5 py-0.5 bg-[rgba(255,255,255,0.1)] rounded border border-[rgba(255,255,255,0.2)] text-xs">⌘K</kbd>) to look up any term. Not limited to visible terms.
              </p>
            </div>
          </div>

          {/* Instruction 4 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-[#F59E0B] rounded flex items-center justify-center">
              <Eye size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Toggle View Modes</h3>
              <p className="text-[rgba(255,255,255,0.6)] text-sm">
                Click the <strong>Explore/View All</strong> button to switch between progressive discovery mode and viewing all terms at once.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.1)]">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-[#c28f2c] hover:bg-[#d4a03d] text-white font-medium rounded transition-colors"
          >
            Got it, let's explore!
          </button>
        </div>
      </div>
    </div>
  );
}
