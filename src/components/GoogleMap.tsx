'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';

function circlePath(center: { lat: number; lng: number }, radiusMetres: number) {
  const points = [];
  const earthRadius = 6378137;
  const lat = center.lat * Math.PI / 180;
  const lng = center.lng * Math.PI / 180;
  const distance = radiusMetres / earthRadius;

  for (let angle = 0; angle <= 360; angle += 12) {
    const bearing = angle * Math.PI / 180;
    const pointLat = Math.asin(
      Math.sin(lat) * Math.cos(distance) +
      Math.cos(lat) * Math.sin(distance) * Math.cos(bearing)
    );
    const pointLng = lng + Math.atan2(
      Math.sin(bearing) * Math.sin(distance) * Math.cos(lat),
      Math.cos(distance) - Math.sin(lat) * Math.sin(pointLat)
    );

    points.push(`${(pointLat * 180 / Math.PI).toFixed(6)},${(pointLng * 180 / Math.PI).toFixed(6)}`);
  }

  return points.join('|');
}

function staticMapUrl(center: { lat: number; lng: number }, mode: 'approximate' | 'exact') {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  const params = new URLSearchParams({
    key: apiKey,
    center: `${center.lat},${center.lng}`,
    zoom: mode === 'exact' ? '16' : '15',
    size: '900x520',
    scale: '2',
    maptype: 'roadmap'
  });

  if (mode === 'exact') {
    params.append('markers', `color:0x48523b|${center.lat},${center.lng}`);
  } else {
    params.append('path', `color:0x48523bff|weight:2|fillcolor:0x48523b33|${circlePath(center, 200)}`);
  }

  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}

function embedMapUrl(query: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

function MapFallback({
  mode,
  className,
  fallbackQuery
}: {
  mode: 'approximate' | 'exact';
  className: string;
  fallbackQuery?: string;
}) {
  if (fallbackQuery) {
    return (
      <div className={`relative min-h-80 overflow-hidden rounded-xl bg-sand/50 ${className}`}>
        <iframe
          title={mode === 'exact' ? 'Exact property location map' : 'Approximate property area map'}
          src={embedMapUrl(fallbackQuery)}
          className="h-full min-h-80 w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        {mode === 'approximate' ? (
          <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-sage shadow-sm">
            Approximate area
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`grid min-h-80 place-items-center rounded-xl bg-sand/50 p-8 text-center ${className}`}>
      <div>
        <MapPin className="mx-auto h-12 w-12 text-sage" />
        <p className="mt-3 font-semibold">{mode === 'exact' ? 'Exact location' : 'Approximate area'}</p>
        <p className="text-sm text-black/60">
          {mode === 'exact'
            ? 'The exact address is available in the confirmed booking details.'
            : 'Exact address is shared after payment confirmation.'}
        </p>
      </div>
    </div>
  );
}

export function GoogleMap({
  center,
  mode,
  fallbackQuery,
  className = ''
}: {
  center: { lat: number; lng: number } | null;
  mode: 'approximate' | 'exact';
  fallbackQuery?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const url = center ? staticMapUrl(center, mode) : null;

  if (!url || failed) {
    return <MapFallback mode={mode} className={className} fallbackQuery={fallbackQuery} />;
  }

  return (
    <div className={`relative min-h-80 overflow-hidden rounded-xl bg-sand/50 ${className}`}>
      <img
        src={url}
        alt={mode === 'exact' ? 'Exact property location map' : 'Approximate property area map'}
        className="h-full min-h-80 w-full object-cover"
        onError={() => setFailed(true)}
      />
      {mode === 'approximate' ? (
        <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-sage shadow-sm">
          Approx. 200m area
        </div>
      ) : null}
    </div>
  );
}
