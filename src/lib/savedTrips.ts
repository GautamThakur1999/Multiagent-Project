import type { TripState } from "@/lib/types";

const KEY = "voyageai:savedTrips";

export interface SavedTrip {
  id: string;
  savedAt: string;
  title: string;
  state: TripState;
}

function tripTitle(state: TripState): string {
  const c = state.constraints;
  return `${c.duration_days} days in ${c.destination}`;
}

export function listSavedTrips(): SavedTrip[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedTrip[]) : [];
  } catch {
    return [];
  }
}

/** Persists a trip to localStorage (newest first) and returns the saved record. */
export function saveTrip(state: TripState): SavedTrip {
  const trip: SavedTrip = {
    id: `trip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    savedAt: new Date().toISOString(),
    title: tripTitle(state),
    state,
  };
  try {
    const existing = listSavedTrips();
    localStorage.setItem(KEY, JSON.stringify([trip, ...existing]));
  } catch {
    /* storage unavailable — non-fatal */
  }
  return trip;
}
