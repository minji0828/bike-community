import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
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

  // MVP2 auth token (Kakao login exchange result).
  accessToken: string | null;

  markHydrated: () => void;
  ensureDeviceUuid: () => Promise<void>;
  hydrateAccessToken: () => Promise<void>;

  setApiBaseUrl: (url: string) => void;
  setNearbyRadiusMeters: (meters: number) => void;
  setRouteRadiusMeters: (meters: number) => void;
  setUserId: (userId: number | null) => void;
  setAccessToken: (token: string | null) => void;
};

const ACCESS_TOKEN_KEY = 'bikeoasis_access_token_v1';

async function readAccessTokenFromSecureStore() {
  try {
    const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    if (!token) return null;
    const trimmed = token.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch (e) {
    console.warn('SecureStore getItem failed', e);
    return null;
  }
}

async function writeAccessTokenToSecureStore(token: string | null) {
  try {
    if (!token || token.trim().length === 0) {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      return;
    }
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  } catch (e) {
    console.warn('SecureStore setItem failed', e);
  }
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,

      apiBaseUrl: 'http://localhost:8080',
      nearbyRadiusMeters: 500,
      routeRadiusMeters: 100,

      userId: null,
      deviceUuid: null,
      accessToken: null,

      markHydrated: () => set({ hasHydrated: true }),

      ensureDeviceUuid: async () => {
        const existing = get().deviceUuid;
        if (existing && existing.trim().length > 0) return;
        const id = await createUuidV4();
        set({ deviceUuid: id });
      },

      hydrateAccessToken: async () => {
        const token = await readAccessTokenFromSecureStore();
        set({ accessToken: token });
      },

      setApiBaseUrl: (apiBaseUrl) => set({ apiBaseUrl }),
      setNearbyRadiusMeters: (nearbyRadiusMeters) => set({ nearbyRadiusMeters }),
      setRouteRadiusMeters: (routeRadiusMeters) => set({ routeRadiusMeters }),
      setUserId: (userId) => set({ userId }),
      setAccessToken: (accessToken) => {
        set({ accessToken });
        void writeAccessTokenToSecureStore(accessToken);
      },
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
        void state?.hydrateAccessToken();
      },
    }
  )
);
