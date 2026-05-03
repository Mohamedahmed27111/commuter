'use client';

import { DriverProfile } from '@/types/driver';
import { format } from 'date-fns';
import Image from 'next/image';
import { Star } from 'lucide-react';

interface DriverProfileCardProps {
  driver: DriverProfile;
  onEdit?: () => void;
}

export default function DriverProfileCard({ driver, onEdit }: DriverProfileCardProps) {
  const joinedFormatted = format(new Date(driver.joinedAt), 'MMM yyyy');

  return (
    <div className="bg-white border border-primary/10 rounded-lg p-6 flex flex-col items-center text-center space-y-4 shadow-sm">
      {/* Avatar */}
      <div className="relative w-20 h-20 rounded-full bg-secondary-lt border-2 border-secondary/30 overflow-hidden flex items-center justify-center">
        {driver.documents.profilePhoto ? (
          <Image
            src={driver.documents.profilePhoto}
            alt={`Profile photo of ${driver.name}`}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <span className="text-secondary font-black text-3xl" aria-hidden="true">
            {driver.name.charAt(0)}
          </span>
        )}
        {driver.isVerified && (
          <span
            className="absolute bottom-0 right-0 w-5 h-5 bg-success rounded-full border-2 border-white flex items-center justify-center"
            title="Verified driver"
            aria-label="Verified driver"
          >
            <span className="text-white text-[9px] font-black">✓</span>
          </span>
        )}
      </div>

      {/* Name */}
      <div>
        <h2 className="text-primary font-bold text-lg leading-tight">{driver.name}</h2>
        <div className="flex items-center justify-center gap-1.5 mt-1">
          <Star size={14} className="text-accent fill-accent" aria-hidden="true" />
          <span className="text-primary font-semibold text-sm">{driver.rating.toFixed(1)}</span>
          <span className="text-text-muted text-sm">· {driver.totalTrips} trips</span>
        </div>
        <p className="text-text-muted text-xs mt-1">Member since {joinedFormatted}</p>
      </div>

      {/* Edit button */}
      {onEdit && (
        <button
          onClick={onEdit}
          className="w-full py-2 rounded-md border border-secondary text-secondary text-sm font-medium hover:bg-secondary-lt transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
        >
          Edit profile
        </button>
      )}
    </div>
  );
}
