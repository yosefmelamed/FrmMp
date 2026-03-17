export type AmenityCategory =
  | 'synagogue'
  | 'kosher_restaurant'
  | 'kosher_grocery'
  | 'jewish_school'
  | 'mikveh'
  | 'jewish_center'
  | 'cemetery'
  | 'bakery'
  | 'butcher';

export interface Amenity {
  id: string;
  name: string;
  category: AmenityCategory;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  hours?: Record<string, string>;
  description?: string;
  tags?: string[];
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
  // Synagogue-specific
  denomination?: string;
  rabbi?: string;
  services?: string[];
  // Kosher-specific
  certificationBody?: string;
  certificationLevel?: 'cholov_yisroel' | 'pas_yisroel' | 'glatt' | 'standard' | 'vegan';
  cuisine?: string;
  priceRange?: '$' | '$$' | '$$$' | '$$$$';
}

export interface ItineraryStop {
  amenityId: string;
  amenity: Amenity;
  arrivalTime?: string;
  notes?: string;
  duration?: number; // minutes
}

export interface Itinerary {
  id: string;
  name: string;
  stops: ItineraryStop[];
  totalDistance?: number;
  totalDuration?: number; // minutes
}

export interface DriveTimeResult {
  originId: string;
  destinationId: string;
  duration: number; // seconds
  distance: number; // meters
  durationText: string;
  distanceText: string;
}

export interface KosherResource {
  id: string;
  title: string;
  description: string;
  url?: string;
  category: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  amenityId?: string;
  category: string;
  imageUrl?: string;
}

export interface NearbyPlace {
  id: string;              // place_id from Google
  name: string;
  category: string;        // 'hotel' | 'attraction' | 'restaurant' etc.
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  reviewCount?: number;
  photoUrl?: string;
  website?: string;
  phone?: string;
  priceLevel?: number;     // 0–4
  isOpen?: boolean;
}