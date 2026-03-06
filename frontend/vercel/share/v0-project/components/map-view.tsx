'use client'

import { MapPin, Navigation } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { POI } from '@/lib/sample-data'

interface MapViewProps {
  className?: string
  showRoute?: boolean
  pois?: POI[]
  showCurrentLocation?: boolean
  progress?: number
}

export function MapView({
  className,
  showRoute = false,
  pois = [],
  showCurrentLocation = true,
  progress = 0,
}: MapViewProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100',
        className
      )}
    >
      {/* Mock map background pattern */}
      <div className="absolute inset-0">
        <svg className="h-full w-full opacity-30" viewBox="0 0 100 100">
          <defs>
            <pattern
              id="grid"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-emerald-400"
              />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      {/* Mock river */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          d="M 0 60 Q 25 55 50 58 T 100 52"
          fill="none"
          stroke="#67e8f9"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>

      {/* Route line */}
      {showRoute && (
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d="M 15 75 Q 30 60 45 50 T 75 35 T 90 25"
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="5,3"
            className="drop-shadow-sm"
          />
          {progress > 0 && (
            <path
              d="M 15 75 Q 30 60 45 50 T 75 35 T 90 25"
              fill="none"
              stroke="#059669"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${progress}, 100`}
              className="drop-shadow-md"
            />
          )}
        </svg>
      )}

      {/* POI markers */}
      {pois.map((poi, index) => (
        <div
          key={poi.id}
          className="absolute flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg"
          style={{
            left: `${20 + index * 25}%`,
            top: `${30 + (index % 2) * 20}%`,
          }}
        >
          <MapPin className="h-4 w-4 text-primary" />
        </div>
      ))}

      {/* Current location marker */}
      {showCurrentLocation && (
        <div
          className="absolute flex h-10 w-10 items-center justify-center"
          style={{ left: '45%', top: '55%' }}
        >
          <div className="absolute h-10 w-10 animate-ping rounded-full bg-primary/30" />
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-lg">
            <Navigation className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>
      )}

      {/* Map attribution mock */}
      <div className="absolute bottom-2 right-2 rounded bg-white/80 px-2 py-1 text-xs text-muted-foreground">
        Map Preview
      </div>
    </div>
  )
}
