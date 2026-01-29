'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import type { MediaItem } from '@/data/glossaryData';

interface MediaGalleryProps {
  media: MediaItem[];
  compact?: boolean;
}

function Lightbox({
  item,
  onClose,
}: {
  item: MediaItem;
  onClose: () => void;
}) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
        aria-label="Close"
      >
        <X size={24} />
      </button>
      <div
        className="max-w-[90vw] max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.src}
          alt={item.alt || ''}
          className="max-w-full max-h-[80vh] object-contain rounded"
        />
        {item.caption && (
          <p className="mt-3 text-sm text-white/70 text-center">
            {item.caption}
          </p>
        )}
      </div>
    </div>
  );
}

function MediaImage({
  item,
  compact,
  onExpand,
}: {
  item: MediaItem;
  compact?: boolean;
  onExpand: () => void;
}) {
  if (compact) {
    return (
      <button
        onClick={onExpand}
        className="w-full h-24 rounded overflow-hidden border border-white/10 hover:border-white/30 transition-colors"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.src}
          alt={item.alt || ''}
          className="w-full h-full object-cover"
        />
      </button>
    );
  }

  return (
    <figure className="group">
      <button
        onClick={onExpand}
        className="w-full rounded overflow-hidden border border-white/10 hover:border-white/30 transition-colors cursor-zoom-in"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.src}
          alt={item.alt || ''}
          className="w-full object-contain max-h-[400px]"
        />
      </button>
      {item.caption && (
        <figcaption className="mt-2 text-xs text-white/50 text-center">
          {item.caption}
        </figcaption>
      )}
    </figure>
  );
}

function MediaVideo({
  item,
  compact,
}: {
  item: MediaItem;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <a
        href={item.src}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full h-24 rounded overflow-hidden border border-white/10 hover:border-white/30 transition-colors bg-white/5 flex items-center justify-center"
      >
        <span className="text-xs text-white/50">Video</span>
      </a>
    );
  }

  // Convert YouTube watch URLs to embed URLs
  let embedSrc = item.src;
  const youtubeMatch = item.src.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/
  );
  if (youtubeMatch) {
    embedSrc = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }

  return (
    <figure>
      <div className="w-full aspect-video rounded overflow-hidden border border-white/10">
        <iframe
          src={embedSrc}
          title={item.caption || 'Video'}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      {item.caption && (
        <figcaption className="mt-2 text-xs text-white/50 text-center">
          {item.caption}
        </figcaption>
      )}
    </figure>
  );
}

export default function MediaGallery({ media, compact }: MediaGalleryProps) {
  const [lightboxItem, setLightboxItem] = useState<MediaItem | null>(null);

  if (!media || media.length === 0) return null;

  if (compact) {
    // Show first image as thumbnail, or an icon if only videos
    const firstImage = media.find((m) => m.type === 'image');
    if (firstImage) {
      return (
        <>
          <MediaImage
            item={firstImage}
            compact
            onExpand={() => setLightboxItem(firstImage)}
          />
          {lightboxItem && (
            <Lightbox
              item={lightboxItem}
              onClose={() => setLightboxItem(null)}
            />
          )}
        </>
      );
    }
    // Videos only — show small indicator
    return (
      <div className="flex items-center gap-1.5 text-xs text-white/40">
        <ImageIcon size={12} />
        <span>{media.length} media</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {media.map((item, i) =>
          item.type === 'image' ? (
            <MediaImage
              key={i}
              item={item}
              onExpand={() => setLightboxItem(item)}
            />
          ) : (
            <MediaVideo key={i} item={item} />
          )
        )}
      </div>
      {lightboxItem && (
        <Lightbox
          item={lightboxItem}
          onClose={() => setLightboxItem(null)}
        />
      )}
    </>
  );
}
