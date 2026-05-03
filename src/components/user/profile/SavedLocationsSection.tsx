'use client';

import { useState } from 'react';
import type { SavedLocation } from '@/types/user';
import BottomSheet from '@/components/shared/BottomSheet';

interface SavedLocationsSectionProps {
  locations: SavedLocation[];
  onUpdate: (locations: SavedLocation[]) => void;
}

const LABEL_ICONS: Record<string, string> = {
  home: '🏠',
  work: '🏢',
  custom: '📍',
};

export default function SavedLocationsSection({
  locations,
  onUpdate,
}: SavedLocationsSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  function handleDelete(id: string) {
    onUpdate(locations.filter((l) => l.id !== id));
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0B1E3D' }}>
          Saved Locations
        </h3>
        <button
          style={{
            padding: '6px 14px',
            border: '1.5px solid #00C2A8',
            borderRadius: 8,
            background: '#fff',
            color: '#00C2A8',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
            minHeight: 36,
          }}
        >
          + Add location
        </button>
      </div>

      {locations.length === 0 ? (
        <div style={{ padding: '20px 0', textAlign: 'center', color: '#5A6A7A', fontSize: 14 }}>
          No saved locations yet
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {locations.map((loc) => (
            <div
              key={loc.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                background: '#fff',
                border: '1px solid #E2E8F0',
                borderRadius: 10,
              }}
            >
              <span style={{ fontSize: 22, flexShrink: 0 }}>{LABEL_ICONS[loc.label] ?? '📍'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0B1E3D' }}>{loc.name}</div>
                <div
                  style={{
                    fontSize: 12,
                    color: '#5A6A7A',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {loc.address}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => setEditingId(loc.id)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #E2E8F0',
                    borderRadius: 6,
                    background: '#fff',
                    color: '#0B1E3D',
                    fontWeight: 500,
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    minHeight: 32,
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(loc.id)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #FFEBEE',
                    borderRadius: 6,
                    background: '#FFEBEE',
                    color: '#E74C3C',
                    fontWeight: 500,
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    minHeight: 32,
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal placeholder */}
      <BottomSheet
        isOpen={editingId !== null}
        onClose={() => setEditingId(null)}
        title="Edit location"
      >
        <div style={{ color: '#5A6A7A', fontSize: 14, padding: '8px 0' }}>
          Location editor coming soon.
        </div>
      </BottomSheet>
    </div>
  );
}
