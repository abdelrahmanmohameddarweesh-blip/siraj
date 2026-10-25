import { usePrayer } from './PrayerContext';
import { PREDEFINED_CITIES } from './cities';
export function useHomePrayerTimes() {
 const prayer = usePrayer();
 return {
  location: prayer.location, times: prayer.todayTimes, method: prayer.method, madhab: prayer.madhab,
  needsLocation: !prayer.isLocationGranted, detect: prayer.detectLocation,
  setCity: async (id: string) => { const city = PREDEFINED_CITIES.find(c => c.id === id); if (city) await prayer.changeCity(city); },
  changeMethod: prayer.changeMethod, cities: PREDEFINED_CITIES,
 };
}
