export {}

declare global {
  interface Window {
    kakao?: {
      maps: {
        load: (callback: () => void) => void
        LatLng: new (lat: number, lng: number) => unknown
        Map: new (
          container: HTMLElement,
          options: {
            center: unknown
            level: number
          }
        ) => {
          setBounds: (bounds: unknown, top?: number, right?: number, bottom?: number, left?: number) => void
          setCenter: (latLng: unknown) => void
          relayout: () => void
        }
        Marker: new (options: { map: unknown; position: unknown; title?: string }) => {
          setMap: (map: unknown | null) => void
        }
        Polyline: new (options: {
          map: unknown
          path: unknown[]
          strokeWeight?: number
          strokeColor?: string
          strokeOpacity?: number
          strokeStyle?: string
        }) => {
          setMap: (map: unknown | null) => void
        }
        LatLngBounds: new () => {
          extend: (latLng: unknown) => void
        }
        Size: new (width: number, height: number) => unknown
        Point: new (x: number, y: number) => unknown
        MarkerImage: new (src: string, size: unknown, options?: { offset?: unknown }) => unknown
      }
    }
  }
}
