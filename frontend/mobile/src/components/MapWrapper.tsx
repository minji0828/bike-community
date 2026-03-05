import React, {
  Children,
  forwardRef,
  isValidElement,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform, View } from 'react-native';

export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type LatLng = {
  latitude: number;
  longitude: number;
};

type MarkerProps = {
  coordinate: LatLng;
  title?: string;
  description?: string;
  pinColor?: string;
};

type PolylineProps = {
  coordinates: LatLng[];
  strokeWidth?: number;
  strokeColor?: string;
};

type MapProps = {
  style?: any;
  initialRegion?: Region;
  region?: Region;
  onRegionChangeComplete?: (region: Region) => void;
  showsUserLocation?: boolean;
  onTouchStart?: () => void;
  mapType?: string;
  children?: React.ReactNode;
};

let MapViewImpl: any;
let MarkerImpl: any;
let PolylineImpl: any;

if (Platform.OS === 'web') {
  require('leaflet/dist/leaflet.css');

  const WebMarker = (_props: MarkerProps) => null;
  WebMarker.displayName = 'Marker';
  const WebPolyline = (_props: PolylineProps) => null;
  WebPolyline.displayName = 'Polyline';

  const KAKAO_APP_KEY = (process as any)?.env?.EXPO_PUBLIC_KAKAO_MAP_APP_KEY as
    | string
    | undefined;

  function normalizeDelta(east: number, west: number) {
    let delta = Math.abs(east - west);
    if (delta > 180) delta = 360 - delta;
    return delta;
  }

  function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
  }

  function toLeafletZoom(region?: Region) {
    const delta = region?.longitudeDelta ?? 0.05;
    if (delta <= 0) return 15;
    return clamp(Math.round(Math.log2(360 / delta) + 1), 3, 18);
  }

  function toKakaoLevel(region?: Region) {
    const delta = region?.longitudeDelta ?? 0.05;
    if (delta <= 0) return 4;
    const leafletZoom = Math.log2(360 / delta) + 1;
    const kakaoLevel = Math.round(15 - leafletZoom);
    return clamp(kakaoLevel, 1, 14);
  }

  function extractChildren(children: React.ReactNode) {
    const markers: MarkerProps[] = [];
    const polylines: PolylineProps[] = [];

    Children.toArray(children).forEach((child: any) => {
      if (!isValidElement(child)) return;
      const type = child.type as any;

      const isMarker =
        type === WebMarker ||
        type?.displayName === 'Marker' ||
        type?.name === 'Marker' ||
        type?.name === 'WebMarker';

      const isPolyline =
        type === WebPolyline ||
        type?.displayName === 'Polyline' ||
        type?.name === 'Polyline' ||
        type?.name === 'WebPolyline';

      if (isMarker) markers.push(child.props as MarkerProps);
      if (isPolyline) polylines.push(child.props as PolylineProps);
    });

    return { markers, polylines };
  }

  const LeafletMapView = forwardRef<any, MapProps>((props, ref) => {
    const RL = require('react-leaflet');
    const MapContainer = RL.MapContainer as any;
    const TileLayer = RL.TileLayer as any;
    const LeafletPolyline = RL.Polyline as any;
    const CircleMarker = RL.CircleMarker as any;
    const Popup = RL.Popup as any;
    const useMapEvents = RL.useMapEvents as any;
    const useMap = RL.useMap as any;

    const [map, setMap] = useState<any>(null);
    const [userLoc, setUserLoc] = useState<LatLng | null>(null);

    const { markers, polylines } = useMemo(
      () => extractChildren(props.children),
      [props.children]
    );

    const center = useMemo(() => {
      if (props.region) return [props.region.latitude, props.region.longitude];
      if (props.initialRegion)
        return [props.initialRegion.latitude, props.initialRegion.longitude];
      if (markers.length > 0)
        return [markers[0].coordinate.latitude, markers[0].coordinate.longitude];
      if (polylines.length > 0 && polylines[0].coordinates?.length > 0) {
        const first = polylines[0].coordinates[0];
        return [first.latitude, first.longitude];
      }
      return [37.5665, 126.978];
    }, [markers, polylines, props.initialRegion, props.region]);

    useEffect(() => {
      if (!props.region || !map) return;

      const bounds = map.getBounds();
      const currentCenter = map.getCenter();
      const currentRegion = {
        latitude: currentCenter.lat,
        longitude: currentCenter.lng,
        latitudeDelta: Math.abs(bounds.getNorth() - bounds.getSouth()),
        longitudeDelta: normalizeDelta(bounds.getEast(), bounds.getWest()),
      };

      const targetZoom = toLeafletZoom(props.region);
      const currentZoom = map.getZoom();

      const centerChanged =
        Math.abs(currentRegion.latitude - props.region.latitude) > 0.0001 ||
        Math.abs(currentRegion.longitude - props.region.longitude) > 0.0001;
      const zoomChanged = Math.abs(currentZoom - targetZoom) >= 0.5;

      if (centerChanged || zoomChanged) {
        map.setView([props.region.latitude, props.region.longitude], targetZoom, {
          animate: false,
        });
      }
    }, [props.region, map]);

    useEffect(() => {
      if (!props.showsUserLocation) return;
      const geo: any = (globalThis as any).navigator?.geolocation;
      if (!geo) return;

      const watchId = geo.watchPosition(
        (position: any) => {
          setUserLoc({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          // ignore web location errors for dev
        },
        { enableHighAccuracy: true }
      );

      return () => geo.clearWatch(watchId);
    }, [props.showsUserLocation]);

    useImperativeHandle(ref, () => ({
      animateToRegion: (region: Region) => {
        if (!map) return;
        const zoom =
          region.longitudeDelta && region.longitudeDelta > 0
            ? toLeafletZoom(region)
            : map.getZoom();
        map.setView([region.latitude, region.longitude], zoom, { animate: true });
      },
      fitToCoordinates: (
        coords: LatLng[],
        options?: {
          edgePadding?: { top?: number; right?: number; bottom?: number; left?: number };
        }
      ) => {
        if (!map || !coords || coords.length === 0) return;
        const pad = options?.edgePadding;
        map.fitBounds(coords.map((c) => [c.latitude, c.longitude]), {
          padding: [
            Math.max(pad?.top ?? 24, pad?.bottom ?? 24),
            Math.max(pad?.left ?? 24, pad?.right ?? 24),
          ],
        });
      },
    }));

    const MapSetter = () => {
      const mapInstance = useMap();
      useEffect(() => {
        setMap(mapInstance);
      }, [mapInstance]);
      return null;
    };

    const MapEvents = () => {
      useMapEvents({
        moveend: (e: any) => {
          if (!props.onRegionChangeComplete) return;
          const m = e.target;
          const b = m.getBounds();
          const c = m.getCenter();
          props.onRegionChangeComplete({
            latitude: c.lat,
            longitude: c.lng,
            latitudeDelta: Math.abs(b.getNorth() - b.getSouth()),
            longitudeDelta: normalizeDelta(b.getEast(), b.getWest()),
          });
        },
        mousedown: () => {
          props.onTouchStart?.();
        },
      });
      return null;
    };

    return (
      <View style={props.style}>
        <MapContainer
          center={center}
          zoom={toLeafletZoom(props.region ?? props.initialRegion)}
          style={{ width: '100%', height: '100%' }}
        >
          <MapSetter />
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEvents />

          {polylines.map((line, idx) => (
            <LeafletPolyline
              key={`line-${idx}`}
              positions={line.coordinates.map((c) => [c.latitude, c.longitude])}
              pathOptions={{
                color: line.strokeColor ?? '#2563eb',
                weight: line.strokeWidth ?? 4,
              }}
            />
          ))}

          {markers.map((m, idx) => (
            <CircleMarker
              key={`marker-${idx}`}
              center={[m.coordinate.latitude, m.coordinate.longitude]}
              radius={7}
              pathOptions={{ color: m.pinColor ?? '#2563eb' }}
            >
              {m.title || m.description ? (
                <Popup>
                  <div>
                    {m.title ? <strong>{m.title}</strong> : null}
                    {m.description ? (
                      <div style={{ marginTop: 4 }}>{m.description}</div>
                    ) : null}
                  </div>
                </Popup>
              ) : null}
            </CircleMarker>
          ))}

          {props.showsUserLocation && userLoc ? (
            <CircleMarker
              center={[userLoc.latitude, userLoc.longitude]}
              radius={8}
              pathOptions={{ color: '#0ea5e9', fillColor: '#38bdf8', fillOpacity: 0.9 }}
            />
          ) : null}
        </MapContainer>
      </View>
    );
  });

  const KakaoMapView = forwardRef<any, MapProps>((props, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<any>(null);
    const overlaysRef = useRef<any[]>([]);
    const userMarkerRef = useRef<any>(null);
    const [isReady, setIsReady] = useState(false);
    const [userLoc, setUserLoc] = useState<LatLng | null>(null);

    const { markers, polylines } = useMemo(
      () => extractChildren(props.children),
      [props.children]
    );

    const defaultRegion = props.region ??
      props.initialRegion ?? {
        latitude: 37.5665,
        longitude: 126.978,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

    useEffect(() => {
      if (!containerRef.current || !KAKAO_APP_KEY) return;

      let cancelled = false;

      const init = () => {
        if (cancelled || !containerRef.current) return;

        const kakao = (window as any).kakao;
        if (!kakao?.maps) return;

        const map = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(defaultRegion.latitude, defaultRegion.longitude),
          level: toKakaoLevel(defaultRegion),
        });

        mapRef.current = map;
        setIsReady(true);

        kakao.maps.event.addListener(map, 'idle', () => {
          if (!props.onRegionChangeComplete) return;
          const center = map.getCenter();
          const bounds = map.getBounds();
          props.onRegionChangeComplete({
            latitude: center.getLat(),
            longitude: center.getLng(),
            latitudeDelta: Math.abs(bounds.getNorthEast().getLat() - bounds.getSouthWest().getLat()),
            longitudeDelta: normalizeDelta(bounds.getNorthEast().getLng(), bounds.getSouthWest().getLng()),
          });
        });

        kakao.maps.event.addListener(map, 'dragstart', () => {
          props.onTouchStart?.();
        });
      };

      const existing = document.getElementById('kakao-map-sdk') as HTMLScriptElement | null;

      if ((window as any).kakao?.maps) {
        (window as any).kakao.maps.load(init);
      } else if (existing) {
        existing.addEventListener('load', () => {
          (window as any).kakao.maps.load(init);
        });
      } else {
        const script = document.createElement('script');
        script.id = 'kakao-map-sdk';
        script.async = true;
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&autoload=false`;
        script.onload = () => {
          (window as any).kakao.maps.load(init);
        };
        document.head.appendChild(script);
      }

      return () => {
        cancelled = true;
      };
    }, [KAKAO_APP_KEY]);

    useEffect(() => {
      if (!props.region || !mapRef.current) return;
      const kakao = (window as any).kakao;
      mapRef.current.setCenter(
        new kakao.maps.LatLng(props.region.latitude, props.region.longitude)
      );
      if (props.region.longitudeDelta > 0) {
        mapRef.current.setLevel(toKakaoLevel(props.region));
      }
    }, [props.region]);

    useEffect(() => {
      if (!isReady || !mapRef.current) return;
      const kakao = (window as any).kakao;

      overlaysRef.current.forEach((o) => o.setMap?.(null));
      overlaysRef.current = [];

      polylines.forEach((line) => {
        if (!line.coordinates || line.coordinates.length < 2) return;
        const polyline = new kakao.maps.Polyline({
          path: line.coordinates.map(
            (c) => new kakao.maps.LatLng(c.latitude, c.longitude)
          ),
          strokeWeight: line.strokeWidth ?? 4,
          strokeColor: line.strokeColor ?? '#2563eb',
          strokeOpacity: 0.95,
          strokeStyle: 'solid',
        });
        polyline.setMap(mapRef.current);
        overlaysRef.current.push(polyline);
      });

      markers.forEach((m) => {
        const marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(m.coordinate.latitude, m.coordinate.longitude),
        });
        marker.setMap(mapRef.current);
        overlaysRef.current.push(marker);
      });
    }, [isReady, markers, polylines]);

    useEffect(() => {
      if (!props.showsUserLocation) return;
      const geo: any = (globalThis as any).navigator?.geolocation;
      if (!geo) return;

      const watchId = geo.watchPosition(
        (position: any) => {
          setUserLoc({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {},
        { enableHighAccuracy: true }
      );

      return () => geo.clearWatch(watchId);
    }, [props.showsUserLocation]);

    useEffect(() => {
      if (!isReady || !mapRef.current || !userLoc) return;
      const kakao = (window as any).kakao;

      if (!userMarkerRef.current) {
        userMarkerRef.current = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(userLoc.latitude, userLoc.longitude),
        });
      } else {
        userMarkerRef.current.setPosition(
          new kakao.maps.LatLng(userLoc.latitude, userLoc.longitude)
        );
      }
      userMarkerRef.current.setMap(mapRef.current);
    }, [isReady, userLoc]);

    useImperativeHandle(ref, () => ({
      animateToRegion: (region: Region) => {
        if (!mapRef.current) return;
        const kakao = (window as any).kakao;
        mapRef.current.panTo(new kakao.maps.LatLng(region.latitude, region.longitude));
        if (region.longitudeDelta > 0) {
          mapRef.current.setLevel(toKakaoLevel(region));
        }
      },
      fitToCoordinates: (
        coords: LatLng[],
        _options?: {
          edgePadding?: { top?: number; right?: number; bottom?: number; left?: number };
        }
      ) => {
        if (!mapRef.current || !coords || coords.length === 0) return;
        const kakao = (window as any).kakao;
        const bounds = new kakao.maps.LatLngBounds();
        coords.forEach((c) => bounds.extend(new kakao.maps.LatLng(c.latitude, c.longitude)));
        mapRef.current.setBounds(bounds);
      },
    }));

    return (
      <View style={props.style}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </View>
    );
  });

  MapViewImpl = forwardRef<any, MapProps>((props, ref) => {
    if (KAKAO_APP_KEY) {
      return <KakaoMapView ref={ref} {...props} />;
    }
    return <LeafletMapView ref={ref} {...props} />;
  });

  MarkerImpl = WebMarker;
  PolylineImpl = WebPolyline;
} else {
  const Maps = require('react-native-maps');

  const RawMapView = Maps.default ?? Maps;
  const UrlTile = Maps.UrlTile;

  MapViewImpl = forwardRef<any, MapProps>((props, ref) => {
    return (
      <RawMapView ref={ref} {...props} mapType="none">
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          tileSize={256}
        />
        {props.children}
      </RawMapView>
    );
  });

  MarkerImpl = Maps.Marker;
  PolylineImpl = Maps.Polyline;
}

export default MapViewImpl;
export const Marker = MarkerImpl;
export const Polyline = PolylineImpl;
