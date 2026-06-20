"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { TripConstraints } from "@/lib/types";

const REQUEST_KEY = "voyageai:request";
const CONSTRAINTS_KEY = "voyageai:constraints";

interface PlanState {
  /** The raw natural-language request from the landing screen. */
  request: string;
  setRequest: (request: string) => void;
  /** The confirmed constraints carried into the plan step (Sprint 8). */
  constraints: TripConstraints | null;
  setConstraints: (constraints: TripConstraints | null) => void;
}

const PlanContext = createContext<PlanState | null>(null);

/**
 * Holds the in-flight plan state across the Landing → Confirm → Plan navigation.
 * Persisted to sessionStorage so a refresh on /confirm or /plan keeps context.
 */
export function PlanProvider({ children }: { children: ReactNode }) {
  const [request, setRequestState] = useState("");
  const [constraints, setConstraintsState] = useState<TripConstraints | null>(null);

  // Hydrate from sessionStorage after mount (avoids SSR/client mismatch).
  useEffect(() => {
    try {
      const r = sessionStorage.getItem(REQUEST_KEY);
      if (r) setRequestState(r);
      const c = sessionStorage.getItem(CONSTRAINTS_KEY);
      if (c) setConstraintsState(JSON.parse(c) as TripConstraints);
    } catch {
      /* sessionStorage unavailable — degrade to in-memory only */
    }
  }, []);

  const setRequest = (value: string) => {
    setRequestState(value);
    try {
      sessionStorage.setItem(REQUEST_KEY, value);
    } catch {
      /* ignore */
    }
  };

  const setConstraints = (value: TripConstraints | null) => {
    setConstraintsState(value);
    try {
      if (value) sessionStorage.setItem(CONSTRAINTS_KEY, JSON.stringify(value));
      else sessionStorage.removeItem(CONSTRAINTS_KEY);
    } catch {
      /* ignore */
    }
  };

  return (
    <PlanContext.Provider value={{ request, setRequest, constraints, setConstraints }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan(): PlanState {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within a PlanProvider");
  return ctx;
}
