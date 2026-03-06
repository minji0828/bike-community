'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { LoaderCircle, MapPin, Navigation } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { POI } from '@/lib/sample-data'

type MapCoordinate = {
  lat: number
  lng: number
}

interface MapViewProps {
  className?: string
  showRoute?: boolean
  pois?: POI[]
  showCurrentLocation?: boolean
  progress?: number
  routePath?: MapCoordinate[]
  currentLocation?: MapCoordinate | null
  center?: MapCoordinate | null
  level?: number
  fitBoundsPadding?: {
    top?: number
    right?: number
    bottom?: number
    left?: number
  }
}

export function MapView({
  className,
  showRoute = false,
  pois = [],
  showCurrentLocation = true,
  progress: _progress = 0,
  routePath = [],
  currentLocation = null,
  center = null,
  level = 5,
  fitBoundsPadding,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const mapKey = process.env.NEXT_PUBLIC_KAKAO_MAP_JS_KEY
  const resolvedPadding = useMemo(
    () => ({
      top: fitBoundsPadding?.top ?? 32,
      right: fitBoundsPadding?.right ?? 32,
      bottom: fitBoundsPadding?.bottom ?? 32,
      left: fitBoundsPadding?.left ?? 32,
    }),
    [fitBoundsPadding]
  )
  const resolvedCenter = useMemo<MapCoordinate>(
    () =>
      center ||
      currentLocation ||
      routePath[0] ||
      pois[0]
        ? {
            lat: (center || currentLocation || routePath[0] || pois[0])!.lat,
            lng: (center || currentLocation || routePath[0] || pois[0])!.lng,
          }
        : { lat: 37.5665, lng: 126.978 },
    [center, currentLocation, pois, routePath]
  )

  useEffect(() => {
    if (!mapKey) {
      setLoadError('NEXT_PUBLIC_KAKAO_MAP_JS_KEY가 설정되지 않았습니다.')
      return
    }

    if (window.kakao?.maps) {
      window.kakao.maps.load(() => setIsReady(true))
      return
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-kakao-map-sdk="true"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => window.kakao?.maps.load(() => setIsReady(true)))
      return
    }

    const script = document.createElement('script')
    script.async = true
    script.dataset.kakaoMapSdk = 'true'
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=${mapKey}`
    script.onload = () => window.kakao?.maps.load(() => setIsReady(true))
    script.onerror = () => setLoadError('카카오 지도 SDK를 불러오지 못했습니다.')
    document.head.appendChild(script)
  }, [mapKey])

  useEffect(() => {
    if (!isReady || !containerRef.current || !window.kakao?.maps) {
      return
    }

    const { maps } = window.kakao
    const map = new maps.Map(containerRef.current, {
      center: new maps.LatLng(resolvedCenter.lat, resolvedCenter.lng),
      level,
    })
    map.relayout()

    const bounds = new maps.LatLngBounds()
    let hasBounds = false

    const extendBounds = (point: MapCoordinate) => {
      bounds.extend(new maps.LatLng(point.lat, point.lng))
      hasBounds = true
    }

    if (showRoute && routePath.length > 1) {
      const path = routePath.map((point) => {
        extendBounds(point)
        return new maps.LatLng(point.lat, point.lng)
      })
      new maps.Polyline({
        map,
        path,
        strokeWeight: 5,
        strokeColor: '#10b981',
        strokeOpacity: 0.9,
        strokeStyle: 'solid',
      })
    }

    pois.forEach((poi) => {
      extendBounds({ lat: poi.lat, lng: poi.lng })
      new maps.Marker({
        map,
        position: new maps.LatLng(poi.lat, poi.lng),
        title: poi.name,
      })
    })

    if (showCurrentLocation && currentLocation) {
      extendBounds(currentLocation)
      new maps.Marker({
        map,
        position: new maps.LatLng(currentLocation.lat, currentLocation.lng),
        title: '현재 위치',
      })
    }

    if (hasBounds) {
      map.setBounds(bounds, resolvedPadding.top, resolvedPadding.right, resolvedPadding.bottom, resolvedPadding.left)
    } else {
      map.setCenter(new maps.LatLng(resolvedCenter.lat, resolvedCenter.lng))
    }
  }, [center, currentLocation, isReady, level, pois, resolvedCenter, resolvedPadding, routePath, showCurrentLocation, showRoute])

  if (loadError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground',
          className
        )}
      >
        {loadError}
      </div>
    )
  }

  if (!isReady) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl bg-muted/40 text-muted-foreground',
          className
        )}
      >
        <div className="flex items-center gap-2 text-sm">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          실제 지도를 불러오는 중...
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn('relative overflow-hidden rounded-2xl border border-border bg-muted/20', className)}
    >
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute bottom-2 right-2 rounded bg-white/90 px-2 py-1 text-xs text-muted-foreground shadow">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          <Navigation className="h-3 w-3" />
          Kakao Map
        </span>
      </div>
    </div>
  )
}
