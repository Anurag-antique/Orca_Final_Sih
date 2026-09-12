import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useGeolocation
 * Real browser geolocation with full state handling.
 *
 * options:
 *   watch:              boolean  → use watchPosition() instead of getCurrentPosition()
 *   enableHighAccuracy: boolean
 *   timeout:            ms
 *   maximumAge:         ms
 *
 * returns:
 *   position: { lat, lon, accuracy, timestamp } | null
 *   status:   'idle' | 'prompting' | 'active'
 *           | 'denied' | 'unavailable' | 'timeout'
 *           | 'unsupported' | 'insecure'
 *   error:    string | null
 *   start():  request the location (user gesture)
 *   stop():   stop watching / clear
 */
export default function useGeolocation({
  watch = false,
  enableHighAccuracy = true,
  timeout = 15000,
  maximumAge = 5000,
} = {}) {
  const [position, setPosition] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const watchIdRef = useRef(null);

  const stop = useCallback(() => {
    if (
      watchIdRef.current != null &&
      typeof navigator !== "undefined" &&
      "geolocation" in navigator
    ) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    setError(null);

    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setStatus("unsupported");
      setError("Geolocation is not supported by this browser.");
      return;
    }

    // Browsers only expose geolocation over HTTPS or localhost.
    if (!window.isSecureContext) {
      setStatus("insecure");
      setError("Location requires a secure (HTTPS) connection.");
      return;
    }

    setStatus("prompting");

    const onSuccess = (pos) => {
      setPosition({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        accuracy: Number.isFinite(pos.coords.accuracy)
          ? pos.coords.accuracy
          : null,
        timestamp: pos.timestamp,
      });
      setStatus("active");
      setError(null);
    };

    const onError = (err) => {
      const map = { 1: "denied", 2: "unavailable", 3: "timeout" };
      setStatus(map[err.code] || "unavailable");
      setError(err.message || "Unable to determine location.");
    };

    const options = { enableHighAccuracy, timeout, maximumAge };

    if (watch) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        onSuccess,
        onError,
        options,
      );
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
    }
  }, [watch, enableHighAccuracy, timeout, maximumAge]);

  useEffect(() => () => stop(), [stop]);

  return { position, status, error, start, stop };
}
