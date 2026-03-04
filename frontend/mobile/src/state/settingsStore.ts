import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createUuidV4 } from '../utils/uuid';

type SettingsState = {
  hasHydrated: boolean;

  apiBaseUrl: string;
  nearbyRadiusMeters: number;
  routeRadiusMeters: number;

  // Optional for future user features (current backend user endpoints are incomplete).
  userId: number | null;

  // Used for anonymous ride uploads.
  deviceUuid: string | null;

  markHydrated: () => void;
  ensureDeviceUuid: () => Promise<void>;

  setApiBaseUrl: (url: string) => void;
  setNearbyRadiusMeters: (meters: number) => void;
  setRouteRadiusMeters: (meters: number) => void;
  setUserId: (userId: number | null) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,

      apiBaseUrl: 'http://localhost:8080',
      nearbyRadiusMeters: 500,
      routeRadiusMeters: 100,

      userId: null,
      deviceUuid: null,

      markHydrated: () => set({ hasHydrated: true }),

      ensureDeviceUuid: async () => {
        const existing = get().deviceUuid;
        if (existing && existing.trim().length > 0) return;
        const id = await createUuidV4();
        set({ deviceUuid: id });
      },

      setApiBaseUrl: (apiBaseUrl) => set({ apiBaseUrl }),
      setNearbyRadiusMeters: (nearbyRadiusMeters) => set({ nearbyRadiusMeters }),
      setRouteRadiusMeters: (routeRadiusMeters) => set({ routeRadiusMeters }),
      setUserId: (userId) => set({ userId }),
    }),
    {
      name: 'bikeoasis_settings_v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        apiBaseUrl: s.apiBaseUrl,
        nearbyRadiusMeters: s.nearbyRadiusMeters,
        routeRadiusMeters: s.routeRadiusMeters,
        userId: s.userId,
        deviceUuid: s.deviceUuid,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    }
  )
);
