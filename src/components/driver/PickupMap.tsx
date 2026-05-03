'use client';

import dynamic from 'next/dynamic';
import type { PickupPoint } from '@/types/driver';
import type { GeoLocation, WalkMinutes } from '@/types/shared';

const Map = dynamic(() => import('./PickupMapInner'), { ssr: false });

interface PickupMapProps {
  pickupPoints: PickupPoint[];
  destination:  GeoLocation;
  walkMinutes?: WalkMinutes;
  height?:      number;
}

export default function PickupMap({ pickupPoints, destination, walkMinutes = 0, height = 320 }: PickupMapProps) {
  return (
    <div>
      <div
        className="rounded-md overflow-hidden border border-[#C8E8E4]"
        style={{ height }}
        role="img"
        aria-label={`Map showing ${pickupPoints.length} pickup point${pickupPoints.length !== 1 ? 's' : ''} en route to ${destination.address}`}
      >
        <Map pickupPoints={pickupPoints} destination={destination} walkMinutes={walkMinutes} height={height} />
      </div>

      {/* Text fallback for accessibility */}
      <details className="mt-2">
        <summary className="text-xs text-text-muted cursor-pointer hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded">
          View pickup addresses as text
        </summary>
        <ol className="mt-1 space-y-1 pl-4" aria-label="Pickup addresses list">
          {pickupPoints.map((pt, i) => (
            <li key={pt.passenger_id} className="text-xs text-text-muted">
              <span className="font-medium text-primary">{i + 1}. {pt.passenger_name}</span> — {pt.address}
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}
