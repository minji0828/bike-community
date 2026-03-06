'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { LoaderCircle, MapPin, Navigation } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { POI } from '@/lib/sample-data'

type MapCoordinate = {
  lat: number
  lng: number
}

let kakaoMapsSdkPromise: Promise<void> | null = null

function loadKakaoMapsSdk(appKey: string): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('브라우저 환경에서만 지도를 불러올 수 있습니다.'))
  }

  if (!appKey) {
    return Promise.reject(new Error('NEXT_PUBLIC_KAKAO_MAP_JS_KEY가 설정되지 않았습니다.'))
  }

  if (window.kakao?.maps) {
    return new Promise((resolve) => window.kakao?.maps.load(resolve))
  }

  if (kakaoMapsSdkPromise) {
    return kakaoMapsSdkPromise
  }

  kakaoMapsSdkPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-kakao-map-sdk="true"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => window.kakao?.maps.load(resolve), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('카카오 지도 SDK를 불러오지 못했습니다.')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.async = true
    script.dataset.kakaoMapSdk = 'true'
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=${appKey}`
    script.onload = () => window.kakao?.maps.load(resolve)
    script.onerror = () => reject(new Error('카카오 지도 SDK를 불러오지 못했습니다.'))
    document.head.appendChild(script)
  })

  return kakaoMapsSdkPromise
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
  const mapRef = useRef<unknown | null>(null)
  const overlaysRef = useRef<{ markers: Array<{ setMap: (map: unknown | null) => void }>; polyline: { setMap: (map: unknown | null) => void } | null }>({
    markers: [],
    polyline: null,
  })
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const [isReady, setIsReady] = useState(false)
  const mapKey = process.env.NEXT_PUBLIC_KAKAO_MAP_JS_KEY
  const [loadError, setLoadError] = useState<string | null>(mapKey ? null : 'NEXT_PUBLIC_KAKAO_MAP_JS_KEY가 설정되지 않았습니다.')
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
      return
    }

    let cancelled = false

    loadKakaoMapsSdk(mapKey)
      .then(() => {
        if (!cancelled) {
          setIsReady(true)
          setLoadError(null)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : '카카오 지도 SDK를 불러오지 못했습니다.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [mapKey])

  useEffect(() => {
    if (!isReady || !containerRef.current || !window.kakao?.maps) {
      return
    }

    const { maps } = window.kakao
    if (!mapRef.current) {
      mapRef.current = new maps.Map(containerRef.current, {
        center: new maps.LatLng(resolvedCenter.lat, resolvedCenter.lng),
        level,
      })
    }

    const map = mapRef.current as unknown as {
      setBounds: (bounds: unknown, top?: number, right?: number, bottom?: number, left?: number) => void
      setCenter: (latLng: unknown) => void
      relayout: () => void
    }

    overlaysRef.current.polyline?.setMap(null)
    overlaysRef.current.markers.forEach((marker) => marker.setMap(null))
    overlaysRef.current.markers = []
    overlaysRef.current.polyline = null

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
      overlaysRef.current.polyline = new maps.Polyline({
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
      overlaysRef.current.markers.push(
        new maps.Marker({
        map,
        position: new maps.LatLng(poi.lat, poi.lng),
        title: poi.name,
        })
      )
    })

    if (showCurrentLocation && currentLocation) {
      extendBounds(currentLocation)
      overlaysRef.current.markers.push(
        new maps.Marker({
        map,
        position: new maps.LatLng(currentLocation.lat, currentLocation.lng),
        title: '현재 위치',
        })
      )
    }

    requestAnimationFrame(() => map.relayout())

    if (hasBounds) {
      map.setBounds(bounds, resolvedPadding.top, resolvedPadding.right, resolvedPadding.bottom, resolvedPadding.left)
    } else {
      map.setCenter(new maps.LatLng(resolvedCenter.lat, resolvedCenter.lng))
    }

    if (!resizeObserverRef.current) {
      resizeObserverRef.current = new ResizeObserver(() => {
        map.relayout()
      })
      resizeObserverRef.current.observe(containerRef.current)
    }
  }, [center, currentLocation, isReady, level, pois, resolvedCenter, resolvedPadding, routePath, showCurrentLocation, showRoute])

  useEffect(() => {
    const overlays = overlaysRef.current
    const resizeObserver = resizeObserverRef.current

    return () => {
      overlays.polyline?.setMap(null)
      overlays.markers.forEach((marker) => marker.setMap(null))
      overlays.markers = []
      overlays.polyline = null
      resizeObserver?.disconnect()
      resizeObserverRef.current = null
      mapRef.current = null
    }
  }, [])

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
