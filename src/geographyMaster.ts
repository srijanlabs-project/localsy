import { AreaMaster, CityMaster, StateMaster } from './types';
import { DEFAULT_AREAS, DEFAULT_CITIES, DEFAULT_STATES } from '../shared/geographySeed.js';

const normalizeState = (state: Partial<StateMaster>, index: number): StateMaster => ({
  id: String(state.id || `state-${index + 1}`).trim(),
  name: String(state.name || state.id || '').trim(),
});

const normalizeCity = (city: Partial<CityMaster>, index: number): CityMaster => ({
  id: String(city.id || `city-${index + 1}`).trim(),
  stateId: String(city.stateId || '').trim(),
  name: String(city.name || city.id || '').trim(),
});

const normalizeArea = (area: Partial<AreaMaster>, index: number): AreaMaster => ({
  id: String(area.id || `area-${index + 1}`).trim(),
  cityId: String(area.cityId || '').trim(),
  name: String(area.name || area.id || '').trim(),
  pincode: String(area.pincode || '').replace(/\D/g, '').slice(0, 6),
});

export let MASTER_STATES: StateMaster[] = DEFAULT_STATES.map(normalizeState);
export let MASTER_CITIES: CityMaster[] = DEFAULT_CITIES.map(normalizeCity);
export let MASTER_AREAS: AreaMaster[] = DEFAULT_AREAS.map(normalizeArea);

export const setGeographyCatalog = (
  states: StateMaster[],
  cities: CityMaster[],
  areas: AreaMaster[],
) => {
  MASTER_STATES = [...states].map(normalizeState).filter((state) => state.id && state.name);
  const stateIds = new Set(MASTER_STATES.map((state) => state.id));
  MASTER_CITIES = [...cities]
    .map(normalizeCity)
    .filter((city) => city.id && city.name && stateIds.has(city.stateId));
  const cityIds = new Set(MASTER_CITIES.map((city) => city.id));
  MASTER_AREAS = [...areas]
    .map(normalizeArea)
    .filter((area) => area.id && area.name && area.pincode && cityIds.has(area.cityId));
};

export const resetGeographyCatalog = () => {
  setGeographyCatalog(
    DEFAULT_STATES as StateMaster[],
    DEFAULT_CITIES as CityMaster[],
    DEFAULT_AREAS as AreaMaster[],
  );
};

export const getAreaById = (areaId: string) => MASTER_AREAS.find((area) => area.id === areaId);
export const getCityById = (cityId: string) => MASTER_CITIES.find((city) => city.id === cityId);
export const getCitiesForState = (stateId: string) => MASTER_CITIES.filter((city) => city.stateId === stateId);
export const getAreasForCity = (cityId: string) => MASTER_AREAS.filter((area) => area.cityId === cityId);
