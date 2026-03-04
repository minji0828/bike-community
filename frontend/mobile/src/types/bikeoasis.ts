export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

export type Toilet = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  openingHours: string;
};

export type PointDto = {
  lat: number;
  lon: number;
};

export type RidingCreateRequest = {
  deviceUuid: string;
  userId: number | null;
  title: string;
  totalDistance: number;
  totalTime: number;
  avgSpeed: number;
  path: PointDto[];
};
