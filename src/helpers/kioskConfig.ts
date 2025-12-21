import { useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { postKioskHeartbeat } from "../endpoints/kiosk/heartbeat_POST.schema";

const KIOSK_LOCATION_ID_KEY = "kiosk_location_id";
const KIOSK_DEVICE_CODE_KEY = "kiosk_device_code";
const DEFAULT_LOCATION_ID = 1; // Fallback for development
const HEARTBEAT_INTERVAL_MS = 60 * 1000; // 1 minute

export interface KioskConfig {
  locationId: number;
  deviceCode: string;
}

/**
 * Generates a basic device fingerprint by hashing the user agent string.
 * This is not for security, but for a simple, consistent device identifier.
 * @returns A string representing the device fingerprint.
 */
const generateDeviceFingerprint = (): string => {
  if (typeof window === "undefined" || !window.navigator) {
    return "server-render-fingerprint";
  }
  const userAgent = navigator.userAgent;
  let hash = 0;
  for (let i = 0; i < userAgent.length; i++) {
    const char = userAgent.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `fp-${Math.abs(hash).toString(16)}`;
};

/**
 * Retrieves the kiosk configuration.
 * It checks localStorage first, then URL parameters, and finally uses defaults.
 * @returns The kiosk configuration object.
 */
export const getKioskConfig = (): KioskConfig => {
  if (typeof window === "undefined") {
    return {
      locationId: DEFAULT_LOCATION_ID,
      deviceCode: "server-render-device-code",
    };
  }

  // 1. Try to get from localStorage
  const storedLocationId = localStorage.getItem(KIOSK_LOCATION_ID_KEY);
  const storedDeviceCode = localStorage.getItem(KIOSK_DEVICE_CODE_KEY);

  if (storedLocationId && storedDeviceCode) {
    return {
      locationId: parseInt(storedLocationId, 10),
      deviceCode: storedDeviceCode,
    };
  }

  // 2. Try to get from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const urlLocationId = urlParams.get("locationId");
  const urlDeviceCode = urlParams.get("deviceCode");

  const locationId = urlLocationId
    ? parseInt(urlLocationId, 10)
    : storedLocationId
      ? parseInt(storedLocationId, 10)
      : DEFAULT_LOCATION_ID;

  const deviceCode =
    urlDeviceCode ?? storedDeviceCode ?? generateDeviceFingerprint();

  // Persist the found/generated config for subsequent loads
  setKioskConfig(locationId, deviceCode);

  return { locationId, deviceCode };
};

/**
 * Saves the kiosk configuration to localStorage.
 * @param locationId - The ID of the kiosk's location.
 * @param deviceCode - The unique device code for the kiosk.
 */
export const setKioskConfig = (
  locationId: number,
  deviceCode: string
): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KIOSK_LOCATION_ID_KEY, locationId.toString());
    localStorage.setItem(KIOSK_DEVICE_CODE_KEY, deviceCode);
  } catch (error) {
    console.error("Failed to set kiosk config in localStorage:", error);
  }
};

/**
 * Clears the kiosk configuration from localStorage.
 */
export const clearKioskConfig = (): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KIOSK_LOCATION_ID_KEY);
    localStorage.removeItem(KIOSK_DEVICE_CODE_KEY);
  } catch (error) {
    console.error("Failed to clear kiosk config from localStorage:", error);
  }
};

/**
 * A React hook to manage kiosk configuration and send periodic heartbeats.
 * @returns The current kiosk configuration.
 */
export const useKioskConfig = (): KioskConfig => {
  const [config, setConfig] = useState<KioskConfig>(() => getKioskConfig());
  
  // Use ref to store the latest config to avoid re-creating sendHeartbeat
  const configRef = useRef(config);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const sendHeartbeat = useCallback(async () => {
    const currentConfig = configRef.current;
    if (!currentConfig.locationId || !currentConfig.deviceCode) {
      console.warn("Kiosk config not available, skipping heartbeat.");
      return;
    }
    try {
      const result = await postKioskHeartbeat({
        locationId: currentConfig.locationId,
        deviceCode: currentConfig.deviceCode,
      });
      if ("error" in result) {
        console.error("Kiosk heartbeat failed:", result.error);
      } else {
        console.log("Kiosk heartbeat sent successfully.");
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error sending kiosk heartbeat:", error.message);
      } else {
        console.error("An unknown error occurred during heartbeat:", error);
      }
    }
  }, []); // No dependencies - uses ref instead

  useEffect(() => {
    // Send an initial heartbeat on mount
    sendHeartbeat();

    // Set up the interval for subsequent heartbeats
    const intervalId = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    // Cleanup function to clear the interval when the component unmounts
    return () => {
      clearInterval(intervalId);
    };
  }, [sendHeartbeat]);

  return config;
};