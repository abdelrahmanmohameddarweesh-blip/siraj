import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CoarseLocation, CalculationMethodName, MadhabName } from "./types";
import { DEFAULT_CITY, PREDEFINED_CITIES, PredefinedCity } from "./cities";

const STORAGE_KEYS = {
  LOCATION: "batl-prayer-coarse-location-v1",
  METHOD: "batl-prayer-calculation-method-v1",
  MADHAB: "batl-prayer-madhab-v1",
};

/**
 * Rounds coordinate to 2 decimals (~1.1 km coarse accuracy) for user privacy.
 */
function toCoarseCoord(val: number): number {
  return Math.round(val * 100) / 100;
}

export async function getSavedLocation(): Promise<CoarseLocation> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.LOCATION);
    if (raw) {
      const loc = JSON.parse(raw);
      if (
        Number.isFinite(loc?.latitude) &&
        Math.abs(loc.latitude) <= 90 &&
        Number.isFinite(loc.longitude) &&
        Math.abs(loc.longitude) <= 180
      )
        return loc;
    }

    return DEFAULT_CITY;
  } catch (err) {
    return DEFAULT_CITY;
  }
}

export async function saveLocation(loc: CoarseLocation): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify(loc));
  } catch (err) {
    console.warn("[LocationService] saveLocation error:", err);
    throw err;
  }
}

export async function getSavedCalculationMethod(): Promise<CalculationMethodName> {
  try {
    const raw = (await AsyncStorage.getItem(
      STORAGE_KEYS.METHOD,
    )) as CalculationMethodName;
    return raw || "Egyptian";
  } catch (err) {
    return "Egyptian";
  }
}

export async function saveCalculationMethod(
  method: CalculationMethodName,
): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.METHOD, method);
  } catch (err) {
    console.warn("[LocationService] saveMethod error:", err);
    throw err;
  }
}

export async function getSavedMadhab(): Promise<MadhabName> {
  try {
    const raw = (await AsyncStorage.getItem(STORAGE_KEYS.MADHAB)) as MadhabName;
    return raw || "shafii";
  } catch (err) {
    return "shafii";
  }
}

export async function saveMadhab(madhab: MadhabName): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.MADHAB, madhab);
  } catch (err) {
    console.warn("[LocationService] saveMadhab error:", err);
    throw err;
  }
}

/**
 * Attempts to detect device location coarsely if user permits.
 * Falls back to manual city without errors or disruption if denied.
 */
export async function detectDeviceLocation(
  prompt = true,
  preserveMethod = false,
): Promise<{
  location: CoarseLocation;
  detectedMethod?: CalculationMethodName;
  granted: boolean;
}> {
  try {
    const { status } = prompt
      ? await Location.requestForegroundPermissionsAsync()
      : await Location.getForegroundPermissionsAsync();
    if (status !== "granted") {
      const fallback = await getSavedLocation();
      return { location: fallback, granted: false };
    }

    if (!(await Location.hasServicesEnabledAsync()))
      return { location: await getSavedLocation(), granted: false };
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const pos = await Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("location-timeout")),
          15000,
        );
      }),
    ]).finally(() => {
      if (timeout) clearTimeout(timeout);
    });

    const coarseLat = toCoarseCoord(pos.coords.latitude);
    const coarseLng = toCoarseCoord(pos.coords.longitude);

    let cityNameAr = "موقعي الحالي";
    let cityNameEn = "My Location";
    let countryNameAr = "";
    let countryNameEn = "";
    let detectedMethod: CalculationMethodName = preserveMethod
      ? await getSavedCalculationMethod()
      : "MuslimWorldLeague";

    try {
      const geocode = await Location.reverseGeocodeAsync({
        latitude: coarseLat,
        longitude: coarseLng,
      });

      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        cityNameAr =
          place.city || place.subregion || place.region || cityNameAr;
        cityNameEn =
          place.city || place.subregion || place.region || cityNameEn;
        countryNameAr = place.country || countryNameAr;
        countryNameEn = place.country || countryNameEn;

        // Auto-select method based on country
        const cLower = (place.country || "").toLowerCase();
        const codeLower = (place.isoCountryCode || "").toLowerCase();

        if (cLower.includes("egypt") || codeLower === "eg") {
          detectedMethod = "Egyptian";
        } else if (cLower.includes("saudi") || codeLower === "sa") {
          detectedMethod = "UmmAlQura";
        } else if (cLower.includes("emirates") || codeLower === "ae") {
          detectedMethod = "Dubai";
        } else if (cLower.includes("kuwait") || codeLower === "kw") {
          detectedMethod = "Kuwait";
        } else if (cLower.includes("qatar") || codeLower === "qa") {
          detectedMethod = "Qatar";
        } else if (
          cLower.includes("united states") ||
          cLower.includes("canada") ||
          codeLower === "us" ||
          codeLower === "ca"
        ) {
          detectedMethod = "NorthAmerica";
        } else {
          detectedMethod = "MuslimWorldLeague";
        }
      }
    } catch (geoErr) {
      console.warn("[LocationService] Reverse geocode fallback:", geoErr);
    }

    const newLocation: CoarseLocation = {
      latitude: coarseLat,
      longitude: coarseLng,
      cityNameAr,
      cityNameEn,
      countryNameAr,
      countryNameEn,
      isManual: false,
    };

    if (!prompt && (await getSavedLocation()).isManual)
      return { location: await getSavedLocation(), granted: false };
    await saveLocation(newLocation);
    if (!preserveMethod) await saveCalculationMethod(detectedMethod);
    else detectedMethod = await getSavedCalculationMethod();

    return {
      location: newLocation,
      detectedMethod,
      granted: true,
    };
  } catch (err) {
    console.warn("[LocationService] Error detecting location:", err);
    const fallback = await getSavedLocation();
    return { location: fallback, granted: false };
  }
}
