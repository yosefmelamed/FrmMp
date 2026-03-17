// ============================================================
// API Layer — all data fetching goes through here.
// Toggle between mock and real with NEXT_PUBLIC_USE_MOCK_DATA.
// ============================================================

import type { Amenity, AmenityCategory, DriveTimeResult, Event, KosherResource } from '@/types';
import {
  MOCK_AMENITIES,
  MOCK_EVENTS,
  MOCK_KOSHER_RESOURCES,
  mockCalculateDriveTime,
  MOCK_CENTER,
} from '@/lib/mock/data';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// Small helper for real API calls
async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

// ── Amenities ──────────────────────────────────────────────────────────────

export async function getAmenities(categories?: AmenityCategory[]): Promise<Amenity[]> {
  if (USE_MOCK) {
    await simulateDelay(150);
    if (!categories || categories.length === 0) return MOCK_AMENITIES;
    return MOCK_AMENITIES.filter((a) => categories.includes(a.category));
  }
  const query = categories ? `?categories=${categories.join(',')}` : '';
  return apiFetch<Amenity[]>(`/api/amenities${query}`);
}

export async function getAmenityById(id: string): Promise<Amenity | null> {
  if (USE_MOCK) {
    await simulateDelay(80);
    return MOCK_AMENITIES.find((a) => a.id === id) ?? null;
  }
  return apiFetch<Amenity>(`/api/amenities/${id}`);
}

export async function getSynagogues(): Promise<Amenity[]> {
  return getAmenities(['synagogue']);
}

export async function getKosherFood(): Promise<Amenity[]> {
  return getAmenities(['kosher_restaurant', 'kosher_grocery', 'bakery', 'butcher']);
}

// ── Events ─────────────────────────────────────────────────────────────────

export async function getEvents(): Promise<Event[]> {
  if (USE_MOCK) {
    await simulateDelay(100);
    return MOCK_EVENTS;
  }
  return apiFetch<Event[]>('/api/events');
}

// ── Kosher Resources ───────────────────────────────────────────────────────

export async function getKosherResources(): Promise<KosherResource[]> {
  if (USE_MOCK) {
    await simulateDelay(80);
    return MOCK_KOSHER_RESOURCES;
  }
  return apiFetch<KosherResource[]>('/api/resources/kosher');
}

// ── Drive Times ─────────────────────────────────────────────────────────────

export async function getDriveTime(
  originId: string,
  destinationId: string
): Promise<DriveTimeResult> {
  if (USE_MOCK) {
    await simulateDelay(500); // simulate Maps API latency
    return mockCalculateDriveTime(originId, destinationId);
  }
  return apiFetch<DriveTimeResult>(
    `/api/drive-time?origin=${originId}&destination=${destinationId}`
  );
}

export async function getMultiDriveTimes(
  originId: string,
  destinationIds: string[]
): Promise<DriveTimeResult[]> {
  if (USE_MOCK) {
    await simulateDelay(600);
    return destinationIds.map((d) => mockCalculateDriveTime(originId, d));
  }
  return apiFetch<DriveTimeResult[]>(
    `/api/drive-time/multi?origin=${originId}&destinations=${destinationIds.join(',')}`
  );
}

// ── Map Config ──────────────────────────────────────────────────────────────

export function getMapCenter(): { lat: number; lng: number } {
  return MOCK_CENTER;
}

// ── Utilities ───────────────────────────────────────────────────────────────

function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { USE_MOCK };
