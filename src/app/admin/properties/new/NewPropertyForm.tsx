'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, GripVertical, ImagePlus, Loader2, Trash2, Upload } from 'lucide-react';

type UploadItem = {
  id: string;
  file: File;
  previewUrl: string;
};

function makeUploadItem(file: File): UploadItem {
  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
    file,
    previewUrl: URL.createObjectURL(file)
  };
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not read ${file.name}`));
    };
    image.src = url;
  });
}

async function prepareUploadFile(file: File) {
  if (file.type === 'image/gif') return file;

  const image = await loadImage(file);
  const maxDimension = 1400;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) return file;

  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>(resolve => {
    canvas.toBlob(resolve, 'image/jpeg', 0.72);
  });

  if (!blob) return file;

  const safeName = file.name.replace(/\.[^.]+$/, '') || 'property-image';
  return new File([blob], `${safeName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
}

export function NewPropertyForm({
  hosts = [],
  isSuperAdmin = false
}: {
  hosts?: { id: string; name: string; email: string }[];
  isSuperAdmin?: boolean;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<UploadItem[]>([]);
  const [images, setImages] = useState<UploadItem[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach(image => URL.revokeObjectURL(image.previewUrl));
    };
  }, []);

  function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter(file => file.type.startsWith('image/'));
    if (!files.length) return;

    setImages(current => {
      const existingKeys = new Set(current.map(item => `${item.file.name}-${item.file.size}-${item.file.lastModified}`));
      const next = files
        .filter(file => !existingKeys.has(`${file.name}-${file.size}-${file.lastModified}`))
        .map(makeUploadItem);
      return [...current, ...next];
    });
  }

  function removeImage(id: string) {
    setImages(current => {
      const removed = current.find(image => image.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return current.filter(image => image.id !== id);
    });
  }

  function moveImage(sourceId: string, targetId: string) {
    setImages(current => {
      const sourceIndex = current.findIndex(image => image.id === sourceId);
      const targetIndex = current.findIndex(image => image.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return current;

      const next = [...current];
      const [source] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, source);
      return next;
    });
  }

  function moveImageByIndex(index: number, direction: -1 | 1) {
    setImages(current => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= current.length) return current;

      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!images.length) {
      setError('Upload at least one property image. The first image will be used as the hero.');
      return;
    }

    setIsSubmitting(true);
    const form = new FormData(event.currentTarget);

    let preparedImages: File[];
    try {
      preparedImages = await Promise.all(images.map(image => prepareUploadFile(image.file)));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'One of the selected images could not be prepared for upload.');
      setIsSubmitting(false);
      return;
    }

    const totalUploadBytes = preparedImages.reduce((total, image) => total + image.size, 0);
    if (totalUploadBytes > 22 * 1024 * 1024) {
      setError('Those images are still too large after compression. Please remove a few or choose smaller photos.');
      setIsSubmitting(false);
      return;
    }

    preparedImages.forEach(image => form.append('images', image));

    const response = await fetch('/api/admin/properties', {
      method: 'POST',
      credentials: 'same-origin',
      body: form
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type') ?? '';
      const body = contentType.includes('application/json')
        ? await response.json().catch(() => null)
        : await response.text().catch(() => '');
      const message = typeof body === 'string' ? body : body?.error;
      setError(message ? `${response.status}: ${message}` : `${response.status}: Property could not be created.`);
      setIsSubmitting(false);
      return;
    }

    router.push('/admin/properties');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-5 rounded-xl border border-black/10 bg-white p-5 shadow-soft">
      <section className="grid gap-4 lg:grid-cols-2">
        <input className="input" name="name" placeholder="Property name" required />
        <input className="input" name="slug" placeholder="url-slug" />
        <input className="input" name="location" placeholder="Location" required />
        <input className="input" name="address" placeholder="Full address" />
        <input className="input lg:col-span-2" name="tagline" placeholder="Short tagline" required />
        <textarea className="input min-h-32 lg:col-span-2" name="description" placeholder="Description" required />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <input className="input" name="maxGuests" type="number" min="1" placeholder="Guests" required />
        <input className="input" name="bedrooms" type="number" min="0" placeholder="Bedrooms" required />
        <input className="input" name="bathrooms" type="number" min="0" step=".5" placeholder="Bathrooms" required />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <input className="input" name="baseNightlyRate" type="number" min="0" step=".01" placeholder="Nightly GBP" required />
        <input className="input" name="cleaningFee" type="number" min="0" step=".01" placeholder="Cleaning GBP" />
        <select className="input" name="status" defaultValue="DRAFT">
          <option value="DRAFT">Draft</option>
          <option value="LIVE">Live</option>
        </select>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <input className="input" name="minNights" type="number" min="1" placeholder="Min nights" defaultValue="1" required />
        <input className="input" name="weekendRate" type="number" min="0" step=".01" placeholder="Weekend nightly GBP" />
        <input className="input" name="bankHolidayRate" type="number" min="0" step=".01" placeholder="Bank holiday nightly GBP" />
        <label className="flex items-center gap-3 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold">
          <input type="checkbox" name="instantBook" className="h-4 w-4" />
          Automatically confirm bookings
        </label>
        <select className="input sm:col-span-2" name="hostId" defaultValue={hosts.length === 1 ? hosts[0].id : ''}>
          <option value="">{hosts.length ? 'Choose host' : 'No admin hosts available'}</option>
          {hosts.map(host => <option key={host.id} value={host.id}>{host.name} ({host.email})</option>)}
        </select>
        {!hosts.length ? (
          <p className="text-sm font-semibold text-red-700 sm:col-span-3">
            {isSuperAdmin ? 'Create an admin user first, then assign them as the host.' : 'Your admin user could not be found as a host.'}
          </p>
        ) : null}
      </section>

      <section>
        <textarea className="input min-h-24" name="amenities" placeholder="Amenities, separated by commas or new lines" />
      </section>

      <section>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={event => {
            if (event.target.files) addFiles(event.target.files);
            event.currentTarget.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={event => event.preventDefault()}
          onDrop={event => {
            event.preventDefault();
            addFiles(event.dataTransfer.files);
          }}
          className="flex min-h-36 w-full flex-col items-center justify-center rounded-xl border border-dashed border-black/20 bg-cream/60 px-4 py-8 text-center transition hover:bg-sand/30"
        >
          <Upload className="h-8 w-8 text-sage" />
          <span className="mt-3 font-semibold">Upload property images</span>
          <span className="mt-1 text-sm text-black/55">Drop images here or choose files from your device.</span>
        </button>

        {images.length ? (
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                draggable
                onDragStart={() => setDraggingId(image.id)}
                onDragEnd={() => setDraggingId(null)}
                onDragOver={event => event.preventDefault()}
                onDrop={() => {
                  if (draggingId) moveImage(draggingId, image.id);
                }}
                className={`cursor-grab overflow-hidden rounded-xl border bg-white active:cursor-grabbing ${index === 0 ? 'col-span-2 border-sage ring-2 ring-sage/20 lg:col-span-2' : 'border-black/10'}`}
              >
                <div className="relative aspect-[4/3] bg-cream">
                  <img src={image.previewUrl} alt="" draggable={false} className="h-full w-full select-none object-cover" />
                  {index === 0 ? <span className="absolute left-2 top-2 rounded-full bg-sage px-2.5 py-1 text-xs font-bold text-white">Hero</span> : null}
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    className="absolute right-2 top-2 rounded-full bg-white/95 p-2 text-red-700 shadow-sm"
                    aria-label="Remove image"
                    title="Remove image"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex min-h-14 items-center gap-2 p-3 text-sm">
                  <GripVertical className="h-4 w-4 shrink-0 text-black/40" />
                  <span className="truncate font-semibold">{image.file.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-px border-t border-black/10 bg-black/10">
                  <button
                    type="button"
                    onClick={() => moveImageByIndex(index, -1)}
                    disabled={index === 0}
                    className="grid min-h-10 place-items-center bg-white text-ink disabled:text-black/25"
                    aria-label="Move image earlier"
                    title="Move earlier"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImageByIndex(index, 1)}
                    disabled={index === images.length - 1}
                    className="grid min-h-10 place-items-center bg-white text-ink disabled:text-black/25"
                    aria-label="Move image later"
                    title="Move later"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-black/10 bg-white p-4 text-sm text-black/55">
            <ImagePlus className="mb-2 h-5 w-5 text-sage" />
            Add at least one image. The first image in the order becomes the hero image.
          </div>
        )}
      </section>

      {error ? <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}

      <div className="flex justify-end">
        <button className="btn-primary inline-flex items-center gap-2" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? 'Creating Property...' : 'Create Property'}
        </button>
      </div>
    </form>
  );
}
