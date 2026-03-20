// ============================================================
// API Layer — toggle between mock and real Express backend.
// Set NEXT_PUBLIC_USE_MOCK_DATA=false in .env.local to use real API.
// ============================================================

import type { Amenity, AmenityCategory, DriveTimeResult, Event, KosherResource } from '@/types';
import {
  MOCK_AMENITIES, MOCK_EVENTS, MOCK_KOSHER_RESOURCES,
  mockCalculateDriveTime, MOCK_CENTER,
} from '@/lib/mock/data';

export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false';
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

// ── Amenities ─────────────────────────────────────────────────

export async function getAmenities(categories?: AmenityCategory[]): Promise<Amenity[]> {
  if (USE_MOCK) {
    await simulateDelay(150);
    if (!categories || categories.length === 0) return MOCK_AMENITIES;
    return MOCK_AMENITIES.filter(a => categories.includes(a.category));
  }
  // Real API returns { items, total } — extract items
  const params = new URLSearchParams({ limit: '200' });
  if (categories?.length) params.set('category', categories.join(','));
  const data = await apiFetch<{ items: Amenity[]; total: number }>(`/api/amenities?${params}`);
  return data.items;
}

export async function getAmenityById(id: string): Promise<Amenity | null> {
  if (USE_MOCK) {
    await simulateDelay(80);
    return MOCK_AMENITIES.find(a => a.id === id) ?? null;
  }
  return apiFetch<Amenity>(`/api/amenities/${id}`);
}

export async function getSynagogues():  Promise<Amenity[]> { return getAmenities(['synagogue']); }
export async function getKosherFood():  Promise<Amenity[]> { return getAmenities(['kosher_restaurant','kosher_grocery','bakery','butcher']); }

// ── Events ────────────────────────────────────────────────────

export async function getEvents(): Promise<Event[]> {
  if (USE_MOCK) {
    await simulateDelay(100);
    return MOCK_EVENTS;
  }
  const data = await apiFetch<{ items: Event[]; total: number }>('/api/events?limit=100');
  return data.items;
}

// ── Kosher Resources ──────────────────────────────────────────

export async function getKosherResources(): Promise<KosherResource[]> {
  if (USE_MOCK) {
    await simulateDelay(80);
    return MOCK_KOSHER_RESOURCES;
  }
  return apiFetch<KosherResource[]>('/api/resources/kosher');
}

// ── Drive Times ───────────────────────────────────────────────

export async function getDriveTime(originId: string, destinationId: string): Promise<DriveTimeResult> {
  if (USE_MOCK) {
    await simulateDelay(500);
    return mockCalculateDriveTime(originId, destinationId);
  }
  return apiFetch<DriveTimeResult>(`/api/drive-time?origin=${originId}&destination=${destinationId}`);
}

export async function getMultiDriveTimes(originId: string, destinationIds: string[]): Promise<DriveTimeResult[]> {
  if (USE_MOCK) {
    await simulateDelay(600);
    return destinationIds.map(d => mockCalculateDriveTime(originId, d));
  }
  return apiFetch<DriveTimeResult[]>(`/api/drive-time/multi?origin=${originId}&destinations=${destinationIds.join(',')}`);
}

// ── Map Config ────────────────────────────────────────────────

export function getMapCenter(): { lat: number; lng: number } {
  return MOCK_CENTER;
}

// ── Utilities ─────────────────────────────────────────────────

function simulateDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}