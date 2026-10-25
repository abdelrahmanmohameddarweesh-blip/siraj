import {useCallback,useEffect,useState} from 'react';
import {AppState} from 'react-native';
import {calculatePrayerTimes} from './prayerTimesService';
import {detectDeviceLocation,getSavedLocation,getSavedCalculationMethod,getSavedMadhab,saveLocation,saveCalculationMethod} from './locationService';
import {PREDEFINED_CITIES} from './cities';
import {syncNotificationsSoon} from '../notifications/scheduler';
import {CoarseLocation,CalculationMethodName,MadhabName,PrayerTimesDay} from './types';
export function useHomePrayerTimes(){const [location,setLocation]=useState<CoarseLocation|null>(null),[times,setTimes]=useState<PrayerTimesDay|null>(null),[method,setMethod]=useState<CalculationMethodName>('Egyptian'),[madhab,setMadhab]=useState<MadhabName>('shafii'),[needsLocation,setNeedsLocation]=useState(false);
 const refresh=useCallback(async()=>{const [loc,m,md]=await Promise.all([getSavedLocation(),getSavedCalculationMethod(),getSavedMadhab()]);setLocation(loc);setMethod(m);setMadhab(md);setTimes(calculatePrayerTimes(loc,new Date(),m,md));},[]);
 useEffect(()=>{refresh().catch(()=>{});const timer=setInterval(()=>refresh().catch(()=>{}),60000);const sub=AppState.addEventListener('change',state=>{if(state==='active')refresh().catch(()=>{})});return()=>{clearInterval(timer);sub.remove()}},[refresh]);
 const detect=async()=>{const result=await detectDeviceLocation();setNeedsLocation(!result.granted);await refresh();syncNotificationsSoon();return result.granted};
 const setCity=async(id:string)=>{const city=PREDEFINED_CITIES.find(x=>x.id===id);if(!city)return;await saveLocation(city);await saveCalculationMethod(city.defaultMethod);setNeedsLocation(false);await refresh();syncNotificationsSoon()};
 const changeMethod=async(value:CalculationMethodName)=>{await saveCalculationMethod(value);await refresh();syncNotificationsSoon()};
 return {location,times,method,madhab,needsLocation,detect,setCity,changeMethod,refresh,cities:PREDEFINED_CITIES};}
