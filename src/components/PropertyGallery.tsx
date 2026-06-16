'use client';

import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useState } from 'react';

type GalleryImage = {
  id: string;
  url: string;
  alt: string;
};

function nextIndex(current: number, total: number) {
  return (current + 1) % total;
}

function previousIndex(current: number, total: number) {
  return (current - 1 + total) % total;
}

export function PropertyGallery({ images }: { images: GalleryImage[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const selected = images[selectedIndex];
  const hasMultipleImages = images.length > 1;

  if (!selected) return null;

  function showNext() {
    setSelectedIndex(current => nextIndex(current, images.length));
  }

  function showPrevious() {
    setSelectedIndex(current => previousIndex(current, images.length));
  }

  function handleTouchEnd(x: number) {
    if (touchStart === null || !hasMultipleImages) return;
    const distance = touchStart - x;
    setTouchStart(null);
    if (Math.abs(distance) < 45) return;
    if (distance > 0) showNext();
    else showPrevious();
  }

  return (
    <div id="gallery" className="card overflow-hidden p-4">
      <div
        className="group relative"
        onTouchStart={event => setTouchStart(event.touches[0]?.clientX ?? null)}
        onTouchEnd={event => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
      >
        <button type="button" className="block w-full overflow-hidden rounded-xl bg-black/5" onClick={() => setLightboxOpen(true)}>
          <img src={selected.url} alt={selected.alt} className="aspect-[16/10] w-full object-cover" />
        </button>
        {hasMultipleImages ? (
          <>
            <button type="button" className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/95 p-2 text-ink shadow-md ring-1 ring-black/10 transition hover:bg-cream lg:block" onClick={showPrevious} aria-label="Previous image" title="Previous image">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/95 p-2 text-ink shadow-md ring-1 ring-black/10 transition hover:bg-cream lg:block" onClick={showNext} aria-label="Next image" title="Next image">
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        ) : null}
      </div>

      {hasMultipleImages ? (
        <div className="mt-3 grid grid-cols-4 gap-3 md:grid-cols-5">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              className={`overflow-hidden rounded-xl ring-offset-2 transition ${index === selectedIndex ? 'ring-2 ring-sage' : 'ring-1 ring-black/10 hover:ring-sage/50'}`}
              onClick={() => setSelectedIndex(index)}
              aria-label={`Show image ${index + 1}`}
            >
              <img src={image.url} alt={image.alt} className="aspect-[4/3] w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {lightboxOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6" role="dialog" aria-modal="true" aria-label="Property image" onClick={() => setLightboxOpen(false)}>
          <div className="relative w-full max-w-6xl" onClick={event => event.stopPropagation()}>
            <button type="button" className="absolute right-3 top-3 rounded-full bg-white/95 p-2 text-ink shadow-md" onClick={() => setLightboxOpen(false)} aria-label="Close image" title="Close image">
              <X className="h-5 w-5" />
            </button>
            <img src={selected.url} alt={selected.alt} className="max-h-[88vh] w-full rounded-xl object-contain" />
            {hasMultipleImages ? (
              <>
                <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-2 text-ink shadow-md" onClick={showPrevious} aria-label="Previous image" title="Previous image">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-2 text-ink shadow-md" onClick={showNext} aria-label="Next image" title="Next image">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
