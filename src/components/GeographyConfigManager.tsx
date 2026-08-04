import React, { useEffect, useMemo, useState } from 'react';
import { AreaMaster, CityMaster, GeographyConfigState, LocalityMaster, StateMaster } from '../types';
import { downloadCsvTemplate, getTabularValue, readTabularFile, TabularRow } from '../utils/tabularImport';

type GeographyConfigManagerProps = {
  config: GeographyConfigState;
  onSave?: (config: GeographyConfigState) => Promise<GeographyConfigState> | GeographyConfigState | void;
};

const slugify = (value: string) => value
  .toLowerCase()
  .trim()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const buildUniqueId = (seed: string, takenIds: Set<string>, fallbackPrefix: string) => {
  const baseId = slugify(seed) || fallbackPrefix;
  if (!takenIds.has(baseId)) return baseId;
  let suffix = 2;
  while (takenIds.has(`${baseId}-${suffix}`)) {
    suffix += 1;
  }
  return `${baseId}-${suffix}`;
};

const emptyStateDraft = {
  id: '',
  name: '',
};

const emptyCityDraft = {
  id: '',
  stateId: '',
  name: '',
};

const emptyAreaDraft = {
  localityId: '',
  id: '',
  cityId: '',
  name: '',
  pincode: '',
};

const emptyLocalityDraft = {
  id: '',
  cityId: '',
  name: '',
};

const resolveStateFromRow = (row: TabularRow, states: StateMaster[]) => {
  const requestedId = getTabularValue(row, ['stateId', 'state id']);
  if (requestedId) {
    const directMatch = states.find((state) => state.id === requestedId);
    if (directMatch) return directMatch;
  }

  const requestedName = getTabularValue(row, ['stateName', 'state']);
  if (!requestedName) return null;
  return states.find((state) => state.name.toLowerCase() === requestedName.toLowerCase()) || null;
};

const resolveCityFromRow = (row: TabularRow, cities: CityMaster[], states: StateMaster[]) => {
  const requestedId = getTabularValue(row, ['cityId', 'city id']);
  if (requestedId) {
    const directMatch = cities.find((city) => city.id === requestedId);
    if (directMatch) return directMatch;
  }

  const requestedName = getTabularValue(row, ['cityName', 'city']);
  if (!requestedName) return null;
  const state = resolveStateFromRow(row, states);
  return (
    cities.find((city) => (
      city.name.toLowerCase() === requestedName.toLowerCase()
      && (!state || city.stateId === state.id)
    )) || null
  );
};

const resolveLocalityFromRow = (row: TabularRow, localities: LocalityMaster[], cities: CityMaster[], states: StateMaster[]) => {
  const requestedId = getTabularValue(row, ['localityId', 'locality id']);
  if (requestedId) {
    const directMatch = localities.find((locality) => locality.id === requestedId);
    if (directMatch) return directMatch;
  }

  const requestedName = getTabularValue(row, ['localityName', 'locality']);
  if (!requestedName) return null;
  const city = resolveCityFromRow(row, cities, states);
  return (
    localities.find((locality) => (
      locality.name.toLowerCase() === requestedName.toLowerCase()
      && (!city || locality.cityId === city.id)
    )) || null
  );
};

export default function GeographyConfigManager({
  config,
  onSave,
}: GeographyConfigManagerProps) {
  const [draft, setDraft] = useState<GeographyConfigState>(config);
  const [stateDraft, setStateDraft] = useState(emptyStateDraft);
  const [cityDraft, setCityDraft] = useState(emptyCityDraft);
  const [localityDraft, setLocalityDraft] = useState(emptyLocalityDraft);
  const [areaDraft, setAreaDraft] = useState(emptyAreaDraft);
  const [editingStateId, setEditingStateId] = useState<string | null>(null);
  const [editingCityId, setEditingCityId] = useState<string | null>(null);
  const [editingLocalityId, setEditingLocalityId] = useState<string | null>(null);
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    setDraft(config);
  }, [config]);

  const stateLookup = useMemo(
    () => new Map(draft.states.map((state) => [state.id, state])),
    [draft.states]
  );
  const cityLookup = useMemo(
    () => new Map(draft.cities.map((city) => [city.id, city])),
    [draft.cities]
  );
  const localityLookup = useMemo(
    () => new Map(draft.localities.map((locality) => [locality.id, locality])),
    [draft.localities]
  );

  const persist = async (nextDraft: GeographyConfigState, successMessage: string) => {
    if (!onSave) {
      setStatusText('Geography save callback is not configured.');
      return;
    }
    setIsSaving(true);
    try {
      await onSave({
        ...nextDraft,
        metadata: {
          seededFromCode: false,
          updatedAt: new Date().toISOString(),
        },
      });
      setStatusText(successMessage);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : 'Failed to save geography config.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveState = async () => {
    const name = stateDraft.name.trim();
    const takenIds = new Set(draft.states.filter((state) => state.id !== editingStateId).map((state) => state.id));
    const existingState = editingStateId
      ? draft.states.find((state) => state.id === editingStateId) || null
      : null;
    const id = stateDraft.id.trim()
      ? buildUniqueId(stateDraft.id, takenIds, 'state')
      : existingState?.id || buildUniqueId(name, takenIds, 'state');
    if (!id || !name) {
      setStatusText('State name is required.');
      return;
    }
    const nextState: StateMaster = { id, name };
    const nextDraft: GeographyConfigState = {
      ...draft,
      states: editingStateId
        ? draft.states.map((state) => (state.id === editingStateId ? nextState : state))
        : [...draft.states, nextState],
    };
    setDraft(nextDraft);
    setStateDraft(emptyStateDraft);
    setEditingStateId(null);
    await persist(nextDraft, editingStateId ? 'State updated.' : 'State created.');
  };

  const deleteState = async (stateId: string) => {
    const cityIds = new Set(draft.cities.filter((city) => city.stateId === stateId).map((city) => city.id));
    const localityIds = new Set(draft.localities.filter((locality) => cityIds.has(locality.cityId)).map((locality) => locality.id));
    const nextDraft: GeographyConfigState = {
      ...draft,
      states: draft.states.filter((state) => state.id !== stateId),
      cities: draft.cities.filter((city) => city.stateId !== stateId),
      localities: draft.localities.filter((locality) => !cityIds.has(locality.cityId)),
      areas: draft.areas.filter((area) => !cityIds.has(area.cityId) && !localityIds.has(area.localityId)),
    };
    setDraft(nextDraft);
    await persist(nextDraft, 'State removed.');
  };

  const saveCity = async () => {
    const name = cityDraft.name.trim();
    const takenIds = new Set(draft.cities.filter((city) => city.id !== editingCityId).map((city) => city.id));
    const existingCity = editingCityId
      ? draft.cities.find((city) => city.id === editingCityId) || null
      : null;
    const id = cityDraft.id.trim()
      ? buildUniqueId(cityDraft.id, takenIds, 'city')
      : existingCity?.id || buildUniqueId(name, takenIds, 'city');
    if (!id || !name || !cityDraft.stateId) {
      setStatusText('City name and parent state are required.');
      return;
    }
    const nextCity: CityMaster = { id, stateId: cityDraft.stateId, name };
    const nextDraft: GeographyConfigState = {
      ...draft,
      cities: editingCityId
        ? draft.cities.map((city) => (city.id === editingCityId ? nextCity : city))
        : [...draft.cities, nextCity],
    };
    setDraft(nextDraft);
    setCityDraft(emptyCityDraft);
    setEditingCityId(null);
    await persist(nextDraft, editingCityId ? 'City updated.' : 'City created.');
  };

  const deleteCity = async (cityId: string) => {
    const localityIds = new Set(draft.localities.filter((locality) => locality.cityId === cityId).map((locality) => locality.id));
    const nextDraft: GeographyConfigState = {
      ...draft,
      cities: draft.cities.filter((city) => city.id !== cityId),
      localities: draft.localities.filter((locality) => locality.cityId !== cityId),
      areas: draft.areas.filter((area) => area.cityId !== cityId && !localityIds.has(area.localityId)),
    };
    setDraft(nextDraft);
    await persist(nextDraft, 'City removed.');
  };

  const saveLocality = async () => {
    const name = localityDraft.name.trim();
    const takenIds = new Set(draft.localities.filter((locality) => locality.id !== editingLocalityId).map((locality) => locality.id));
    const existingLocality = editingLocalityId
      ? draft.localities.find((locality) => locality.id === editingLocalityId) || null
      : null;
    const id = localityDraft.id.trim()
      ? buildUniqueId(localityDraft.id, takenIds, 'locality')
      : existingLocality?.id || buildUniqueId(name, takenIds, 'locality');
    if (!id || !name || !localityDraft.cityId) {
      setStatusText('Locality name and parent city are required.');
      return;
    }
    const nextLocality: LocalityMaster = { id, cityId: localityDraft.cityId, name };
    const nextDraft: GeographyConfigState = {
      ...draft,
      localities: editingLocalityId
        ? draft.localities.map((locality) => (locality.id === editingLocalityId ? nextLocality : locality))
        : [...draft.localities, nextLocality],
    };
    setDraft(nextDraft);
    setLocalityDraft(emptyLocalityDraft);
    setEditingLocalityId(null);
    await persist(nextDraft, editingLocalityId ? 'Locality updated.' : 'Locality created.');
  };

  const deleteLocality = async (localityId: string) => {
    const nextDraft: GeographyConfigState = {
      ...draft,
      localities: draft.localities.filter((locality) => locality.id !== localityId),
      areas: draft.areas.filter((area) => area.localityId !== localityId),
    };
    setDraft(nextDraft);
    await persist(nextDraft, 'Locality removed.');
  };

  const saveArea = async () => {
    const name = areaDraft.name.trim();
    const pincode = areaDraft.pincode.replace(/\D/g, '').slice(0, 6);
    const parentLocality = draft.localities.find((locality) => locality.id === areaDraft.localityId) || null;
    const takenIds = new Set(draft.areas.filter((area) => area.id !== editingAreaId).map((area) => area.id));
    const existingArea = editingAreaId
      ? draft.areas.find((area) => area.id === editingAreaId) || null
      : null;
    const id = areaDraft.id.trim()
      ? buildUniqueId(areaDraft.id, takenIds, 'area')
      : existingArea?.id || buildUniqueId(`${parentLocality?.id || 'area'}-${name}-${pincode}`, takenIds, 'area');
    if (!id || !name || !parentLocality || pincode.length !== 6) {
      setStatusText('Area name, parent locality, and 6-digit pincode are required.');
      return;
    }
    const nextArea: AreaMaster = {
      id,
      localityId: parentLocality.id,
      cityId: parentLocality.cityId,
      name,
      pincode,
    };
    const nextDraft: GeographyConfigState = {
      ...draft,
      areas: editingAreaId
        ? draft.areas.map((area) => (area.id === editingAreaId ? nextArea : area))
        : [...draft.areas, nextArea],
    };
    setDraft(nextDraft);
    setAreaDraft(emptyAreaDraft);
    setEditingAreaId(null);
    await persist(nextDraft, editingAreaId ? 'Area updated.' : 'Area created.');
  };

  const deleteArea = async (areaId: string) => {
    const nextDraft: GeographyConfigState = {
      ...draft,
      areas: draft.areas.filter((area) => area.id !== areaId),
    };
    setDraft(nextDraft);
    await persist(nextDraft, 'Area removed.');
  };

  const importFullGeography = async (file: File) => {
    setIsImporting(true);
    try {
      const rows = await readTabularFile(file);
      const nextDraft: GeographyConfigState = {
        ...draft,
        states: [...draft.states],
        cities: [...draft.cities],
        localities: [...draft.localities],
        areas: [...draft.areas],
      };
      const touchedStates = new Set<string>();
      const touchedCities = new Set<string>();
      const touchedLocalities = new Set<string>();
      const touchedAreas = new Set<string>();
      let skipped = 0;

      rows.forEach((row) => {
        const stateName = getTabularValue(row, ['stateName', 'state', 'name']);
        const cityName = getTabularValue(row, ['cityName', 'city']);
        const localityName = getTabularValue(row, ['localityName', 'locality']);
        const areaName = getTabularValue(row, ['areaName', 'area', 'subLocality', 'sub locality']);
        const areaPincode = getTabularValue(row, ['pincode', 'pin']).replace(/\D/g, '').slice(0, 6);
        if (!stateName || !cityName || !localityName) {
          skipped += 1;
          return;
        }

        const stateRequestedId = getTabularValue(row, ['stateId', 'state id', 'id']);
        const existingState = stateRequestedId
          ? nextDraft.states.find((state) => state.id === stateRequestedId) || null
          : nextDraft.states.find((state) => state.name.toLowerCase() === stateName.toLowerCase()) || null;
        const stateId = existingState?.id || buildUniqueId(stateRequestedId || stateName, new Set(nextDraft.states.map((state) => state.id)), 'state');

        const nextState: StateMaster = { id: stateId, name: stateName };
        const existingStateIndex = nextDraft.states.findIndex((state) => state.id === stateId);
        if (existingStateIndex >= 0) {
          nextDraft.states[existingStateIndex] = nextState;
        } else {
          nextDraft.states.push(nextState);
        }
        touchedStates.add(stateId);

        const cityRequestedId = getTabularValue(row, ['cityId', 'city id']);
        const existingCity = cityRequestedId
          ? nextDraft.cities.find((city) => city.id === cityRequestedId) || null
          : nextDraft.cities.find((city) => city.stateId === stateId && city.name.toLowerCase() === cityName.toLowerCase()) || null;
        const cityId = existingCity?.id || buildUniqueId(cityRequestedId || cityName, new Set(nextDraft.cities.map((city) => city.id)), 'city');
        const nextCity: CityMaster = { id: cityId, stateId, name: cityName };
        const existingCityIndex = nextDraft.cities.findIndex((city) => city.id === cityId);
        if (existingCityIndex >= 0) {
          nextDraft.cities[existingCityIndex] = nextCity;
        } else {
          nextDraft.cities.push(nextCity);
        }
        touchedCities.add(cityId);

        const localityRequestedId = getTabularValue(row, ['localityId', 'locality id']);
        const existingLocality = localityRequestedId
          ? nextDraft.localities.find((locality) => locality.id === localityRequestedId) || null
          : nextDraft.localities.find((locality) => locality.cityId === cityId && locality.name.toLowerCase() === localityName.toLowerCase()) || null;
        const localityId = existingLocality?.id || buildUniqueId(localityRequestedId || localityName, new Set(nextDraft.localities.map((locality) => locality.id)), 'locality');
        const nextLocality: LocalityMaster = { id: localityId, cityId, name: localityName };
        const existingLocalityIndex = nextDraft.localities.findIndex((locality) => locality.id === localityId);
        if (existingLocalityIndex >= 0) {
          nextDraft.localities[existingLocalityIndex] = nextLocality;
        } else {
          nextDraft.localities.push(nextLocality);
        }
        touchedLocalities.add(localityId);

        if (areaName && areaPincode.length === 6) {
          const areaRequestedId = getTabularValue(row, ['areaId', 'subLocalityId', 'sub locality id']);
          const existingArea = areaRequestedId
            ? nextDraft.areas.find((area) => area.id === areaRequestedId) || null
            : nextDraft.areas.find((area) => area.localityId === localityId && area.name.toLowerCase() === areaName.toLowerCase() && area.pincode === areaPincode) || null;
          const areaId = existingArea?.id || buildUniqueId(areaRequestedId || `${localityId}-${areaName}-${areaPincode}`, new Set(nextDraft.areas.map((area) => area.id)), 'area');
          const nextArea: AreaMaster = { id: areaId, localityId, cityId, name: areaName, pincode: areaPincode };
          const existingAreaIndex = nextDraft.areas.findIndex((area) => area.id === areaId);
          if (existingAreaIndex >= 0) {
            nextDraft.areas[existingAreaIndex] = nextArea;
          } else {
            nextDraft.areas.push(nextArea);
          }
          touchedAreas.add(areaId);
        }
      });

      if (touchedStates.size === 0 && touchedCities.size === 0 && touchedLocalities.size === 0 && touchedAreas.size === 0) {
        setStatusText('No valid geography rows found in the uploaded file.');
        return;
      }

      setDraft(nextDraft);
      await persist(
        nextDraft,
        `Imported geography from single file: ${touchedStates.size} states, ${touchedCities.size} cities, ${touchedLocalities.size} localities, ${touchedAreas.size} areas${skipped ? `, skipped ${skipped} rows.` : '.'}`,
      );
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : 'Failed to import geography file.');
    } finally {
      setIsImporting(false);
    }
  };

  const importStates = async (file: File) => {
    setIsImporting(true);
    try {
      const rows = await readTabularFile(file);
      const nextDraft: GeographyConfigState = { ...draft, states: [...draft.states] };
      let imported = 0;
      let skipped = 0;

      rows.forEach((row) => {
        const name = getTabularValue(row, ['name', 'stateName', 'state']);
        if (!name) {
          skipped += 1;
          return;
        }

        const requestedId = getTabularValue(row, ['id', 'stateId', 'state id']);
        const existingState = requestedId
          ? nextDraft.states.find((state) => state.id === requestedId) || null
          : nextDraft.states.find((state) => state.name.toLowerCase() === name.toLowerCase()) || null;
        const id = existingState?.id || buildUniqueId(requestedId || name, new Set(nextDraft.states.map((state) => state.id)), 'state');
        const nextState: StateMaster = { id, name };
        const existingIndex = nextDraft.states.findIndex((state) => state.id === id);
        if (existingIndex >= 0) {
          nextDraft.states[existingIndex] = nextState;
        } else {
          nextDraft.states.push(nextState);
        }
        imported += 1;
      });

      if (imported === 0) {
        setStatusText('No valid state rows found in the uploaded file.');
        return;
      }

      setDraft(nextDraft);
      await persist(nextDraft, `Imported ${imported} states${skipped ? `, skipped ${skipped} rows.` : '.'}`);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : 'Failed to import state file.');
    } finally {
      setIsImporting(false);
    }
  };

  const importCities = async (file: File) => {
    setIsImporting(true);
    try {
      const rows = await readTabularFile(file);
      const nextDraft: GeographyConfigState = { ...draft, cities: [...draft.cities] };
      let imported = 0;
      let skipped = 0;

      rows.forEach((row) => {
        const name = getTabularValue(row, ['name', 'cityName', 'city']);
        const state = resolveStateFromRow(row, draft.states);
        if (!name || !state) {
          skipped += 1;
          return;
        }

        const requestedId = getTabularValue(row, ['id', 'cityId', 'city id']);
        const existingCity = requestedId
          ? nextDraft.cities.find((city) => city.id === requestedId) || null
          : nextDraft.cities.find((city) => city.stateId === state.id && city.name.toLowerCase() === name.toLowerCase()) || null;
        const id = existingCity?.id || buildUniqueId(requestedId || name, new Set(nextDraft.cities.map((city) => city.id)), 'city');
        const nextCity: CityMaster = { id, stateId: state.id, name };
        const existingIndex = nextDraft.cities.findIndex((city) => city.id === id);
        if (existingIndex >= 0) {
          nextDraft.cities[existingIndex] = nextCity;
        } else {
          nextDraft.cities.push(nextCity);
        }
        imported += 1;
      });

      if (imported === 0) {
        setStatusText('No valid city rows found in the uploaded file.');
        return;
      }

      setDraft(nextDraft);
      await persist(nextDraft, `Imported ${imported} cities${skipped ? `, skipped ${skipped} rows.` : '.'}`);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : 'Failed to import city file.');
    } finally {
      setIsImporting(false);
    }
  };

  const importLocalities = async (file: File) => {
    setIsImporting(true);
    try {
      const rows = await readTabularFile(file);
      const nextDraft: GeographyConfigState = { ...draft, localities: [...draft.localities] };
      let imported = 0;
      let skipped = 0;

      rows.forEach((row) => {
        const name = getTabularValue(row, ['name', 'localityName', 'locality']);
        const city = resolveCityFromRow(row, draft.cities, draft.states);
        if (!name || !city) {
          skipped += 1;
          return;
        }

        const requestedId = getTabularValue(row, ['id', 'localityId', 'locality id']);
        const existingLocality = requestedId
          ? nextDraft.localities.find((locality) => locality.id === requestedId) || null
          : nextDraft.localities.find((locality) => locality.cityId === city.id && locality.name.toLowerCase() === name.toLowerCase()) || null;
        const id = existingLocality?.id || buildUniqueId(requestedId || name, new Set(nextDraft.localities.map((locality) => locality.id)), 'locality');
        const nextLocality: LocalityMaster = { id, cityId: city.id, name };
        const existingIndex = nextDraft.localities.findIndex((locality) => locality.id === id);
        if (existingIndex >= 0) {
          nextDraft.localities[existingIndex] = nextLocality;
        } else {
          nextDraft.localities.push(nextLocality);
        }
        imported += 1;
      });

      if (imported === 0) {
        setStatusText('No valid locality rows found in the uploaded file.');
        return;
      }

      setDraft(nextDraft);
      await persist(nextDraft, `Imported ${imported} localities${skipped ? `, skipped ${skipped} rows.` : '.'}`);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : 'Failed to import locality file.');
    } finally {
      setIsImporting(false);
    }
  };

  const importAreas = async (file: File) => {
    setIsImporting(true);
    try {
      const rows = await readTabularFile(file);
      const nextDraft: GeographyConfigState = { ...draft, areas: [...draft.areas] };
      let imported = 0;
      let skipped = 0;

      rows.forEach((row) => {
        const name = getTabularValue(row, ['name', 'areaName', 'area', 'subLocality', 'sub locality']);
        const locality = resolveLocalityFromRow(row, draft.localities, draft.cities, draft.states);
        const pincode = getTabularValue(row, ['pincode', 'pin']).replace(/\D/g, '').slice(0, 6);
        if (!name || !locality || pincode.length !== 6) {
          skipped += 1;
          return;
        }

        const requestedId = getTabularValue(row, ['id', 'areaId', 'subLocalityId', 'sub locality id']);
        const existingArea = requestedId
          ? nextDraft.areas.find((area) => area.id === requestedId) || null
          : nextDraft.areas.find((area) => area.localityId === locality.id && area.name.toLowerCase() === name.toLowerCase() && area.pincode === pincode) || null;
        const id = existingArea?.id || buildUniqueId(requestedId || `${locality.id}-${name}-${pincode}`, new Set(nextDraft.areas.map((area) => area.id)), 'area');
        const nextArea: AreaMaster = { id, localityId: locality.id, cityId: locality.cityId, name, pincode };
        const existingIndex = nextDraft.areas.findIndex((area) => area.id === id);
        if (existingIndex >= 0) {
          nextDraft.areas[existingIndex] = nextArea;
        } else {
          nextDraft.areas.push(nextArea);
        }
        imported += 1;
      });

      if (imported === 0) {
        setStatusText('No valid area rows found in the uploaded file.');
        return;
      }

      setDraft(nextDraft);
      await persist(nextDraft, `Imported ${imported} areas${skipped ? `, skipped ${skipped} rows.` : '.'}`);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : 'Failed to import area file.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-slate-950">Managed Geography</h3>
          <p className="mt-1 text-[11px] text-slate-500">
            States, cities, localities, and areas now have an admin authoring path so locality-driven routing can be managed without code edits.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
          <div>States: <span className="font-bold text-slate-900">{draft.states.length}</span></div>
          <div>Cities: <span className="font-bold text-slate-900">{draft.cities.length}</span></div>
          <div>Localities: <span className="font-bold text-slate-900">{draft.localities.length}</span></div>
          <div>Areas: <span className="font-bold text-slate-900">{draft.areas.length}</span></div>
        </div>
      </div>

      {statusText && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-900">
          {statusText}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-5">
        <div className="rounded-xl border border-dashed border-indigo-300 bg-indigo-50 p-3 space-y-3">
          <div>
            <div className="text-xs font-bold text-slate-900">Excel Import: Full Geography</div>
            <p className="mt-1 text-[11px] text-slate-600">
              Upload one flat Excel file with `state`, `city`, `locality`, and optional `area + pincode` columns. The system will upsert all four layers in one go.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => downloadCsvTemplate('full-geography-template.csv', ['stateId', 'stateName', 'cityId', 'cityName', 'localityId', 'localityName', 'areaId', 'areaName', 'pincode'], [['mh', 'Maharashtra', 'navimumbai', 'Navi Mumbai', 'roadpali', 'Roadpali', 'roadpali-sec17', 'Sector 17', '410218']])}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700"
            >
              Download Full Template
            </button>
            <label className="cursor-pointer rounded-md bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white">
              Upload Full Geography
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.tsv,.txt"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void importFullGeography(file);
                  }
                  event.currentTarget.value = '';
                }}
              />
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 space-y-3">
          <div>
            <div className="text-xs font-bold text-slate-900">Excel Import: States</div>
            <p className="mt-1 text-[11px] text-slate-500">
              Upload state master rows as native `.xlsx` / `.xls` files or Excel-exported `.csv`, `.tsv`, and tab-separated text.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => downloadCsvTemplate('state-template.csv', ['id', 'name'], [['mh', 'Maharashtra']])}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700"
            >
              Download State Template
            </button>
            <label className="cursor-pointer rounded-md bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white">
              Upload States
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.tsv,.txt"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void importStates(file);
                  }
                  event.currentTarget.value = '';
                }}
              />
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 space-y-3">
          <div>
            <div className="text-xs font-bold text-slate-900">Excel Import: Cities</div>
            <p className="mt-1 text-[11px] text-slate-500">
              Upload native Excel or exported flat files. Use `stateId` or `stateName` so city rows land under the right parent state.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => downloadCsvTemplate('city-template.csv', ['stateId', 'id', 'name'], [['mh', 'navimumbai', 'Navi Mumbai']])}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700"
            >
              Download City Template
            </button>
            <label className="cursor-pointer rounded-md bg-sky-600 px-3 py-1.5 text-[11px] font-bold text-white">
              Upload Cities
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.tsv,.txt"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void importCities(file);
                  }
                  event.currentTarget.value = '';
                }}
              />
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 space-y-3">
          <div>
            <div className="text-xs font-bold text-slate-900">Excel Import: Localities</div>
            <p className="mt-1 text-[11px] text-slate-500">
              Upload localities using `stateId` / `stateName`, `cityId` / `cityName`, plus `id` and `name`.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => downloadCsvTemplate('locality-template.csv', ['stateId', 'stateName', 'cityId', 'cityName', 'id', 'name'], [['mh', 'Maharashtra', 'navimumbai', 'Navi Mumbai', 'roadpali', 'Roadpali']])}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700"
            >
              Download Locality Template
            </button>
            <label className="cursor-pointer rounded-md bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white">
              Upload Localities
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.tsv,.txt"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void importLocalities(file);
                  }
                  event.currentTarget.value = '';
                }}
              />
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 space-y-3">
          <div>
            <div className="text-xs font-bold text-slate-900">Excel Import: Areas</div>
            <p className="mt-1 text-[11px] text-slate-500">
              Upload areas under a locality. Include `localityId` or `localityName`, plus `id`, `name`, and `pincode`.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => downloadCsvTemplate('area-template.csv', ['stateId', 'stateName', 'cityId', 'cityName', 'localityId', 'localityName', 'id', 'name', 'pincode'], [['mh', 'Maharashtra', 'navimumbai', 'Navi Mumbai', 'roadpali', 'Roadpali', 'roadpali-sec17', 'Sector 17', '410218']])}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700"
            >
              Download Area Template
            </button>
            <label className="cursor-pointer rounded-md bg-emerald-700 px-3 py-1.5 text-[11px] font-bold text-white">
              Upload Areas
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.tsv,.txt"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void importAreas(file);
                  }
                  event.currentTarget.value = '';
                }}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-900">States</div>
            <button type="button" onClick={() => { setStateDraft(emptyStateDraft); setEditingStateId(null); }} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700">
              New
            </button>
          </div>
          <input value={stateDraft.name} onChange={(e) => setStateDraft((prev) => ({ ...prev, name: e.target.value }))} placeholder="State name" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]" />
          <input value={stateDraft.id} onChange={(e) => setStateDraft((prev) => ({ ...prev, id: e.target.value }))} placeholder="State ID" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-mono" />
          <button type="button" onClick={saveState} disabled={isSaving || isImporting} className="rounded-lg bg-indigo-600 px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50">
            {editingStateId ? 'Update State' : 'Create State'}
          </button>
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {draft.states.map((state) => (
              <div key={state.id} className="rounded-lg border border-slate-200 bg-white p-3 text-[11px]">
                <div className="font-semibold text-slate-900">{state.name}</div>
                <div className="font-mono text-[10px] text-slate-500">{state.id}</div>
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => { setEditingStateId(state.id); setStateDraft(state); }} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-700">Edit</button>
                  <button type="button" onClick={() => void deleteState(state.id)} className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-900">Cities</div>
            <button type="button" onClick={() => { setCityDraft(emptyCityDraft); setEditingCityId(null); }} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700">
              New
            </button>
          </div>
          <select value={cityDraft.stateId} onChange={(e) => setCityDraft((prev) => ({ ...prev, stateId: e.target.value }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]">
            <option value="">Select state</option>
            {draft.states.map((state) => (
              <option key={state.id} value={state.id}>{state.name}</option>
            ))}
          </select>
          <input value={cityDraft.name} onChange={(e) => setCityDraft((prev) => ({ ...prev, name: e.target.value }))} placeholder="City name" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]" />
          <input value={cityDraft.id} onChange={(e) => setCityDraft((prev) => ({ ...prev, id: e.target.value }))} placeholder="City ID" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-mono" />
          <button type="button" onClick={saveCity} disabled={isSaving || isImporting} className="rounded-lg bg-indigo-600 px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50">
            {editingCityId ? 'Update City' : 'Create City'}
          </button>
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {draft.cities.map((city) => (
              <div key={city.id} className="rounded-lg border border-slate-200 bg-white p-3 text-[11px]">
                <div className="font-semibold text-slate-900">{city.name}</div>
                <div className="text-[10px] text-slate-500">{stateLookup.get(city.stateId)?.name || city.stateId}</div>
                <div className="font-mono text-[10px] text-slate-500">{city.id}</div>
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => { setEditingCityId(city.id); setCityDraft(city); }} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-700">Edit</button>
                  <button type="button" onClick={() => void deleteCity(city.id)} className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-900">Localities</div>
            <button type="button" onClick={() => { setLocalityDraft(emptyLocalityDraft); setEditingLocalityId(null); }} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700">
              New
            </button>
          </div>
          <select value={localityDraft.cityId} onChange={(e) => setLocalityDraft((prev) => ({ ...prev, cityId: e.target.value }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]">
            <option value="">Select city</option>
            {draft.cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name} ({stateLookup.get(city.stateId)?.name || city.stateId})
              </option>
            ))}
          </select>
          <input value={localityDraft.name} onChange={(e) => setLocalityDraft((prev) => ({ ...prev, name: e.target.value }))} placeholder="Locality name" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]" />
          <input value={localityDraft.id} onChange={(e) => setLocalityDraft((prev) => ({ ...prev, id: e.target.value }))} placeholder="Locality ID" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-mono" />
          <button type="button" onClick={saveLocality} disabled={isSaving || isImporting} className="rounded-lg bg-indigo-600 px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50">
            {editingLocalityId ? 'Update Locality' : 'Create Locality'}
          </button>
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {draft.localities.map((locality) => (
              <div key={locality.id} className="rounded-lg border border-slate-200 bg-white p-3 text-[11px]">
                <div className="font-semibold text-slate-900">{locality.name}</div>
                <div className="text-[10px] text-slate-500">{cityLookup.get(locality.cityId)?.name || locality.cityId}</div>
                <div className="font-mono text-[10px] text-slate-500">{locality.id}</div>
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => { setEditingLocalityId(locality.id); setLocalityDraft(locality); }} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-700">Edit</button>
                  <button type="button" onClick={() => void deleteLocality(locality.id)} className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-900">Areas</div>
            <button type="button" onClick={() => { setAreaDraft(emptyAreaDraft); setEditingAreaId(null); }} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700">
              New
            </button>
          </div>
          <select
            value={areaDraft.localityId}
            onChange={(e) => {
              const nextLocalityId = e.target.value;
              const nextLocality = draft.localities.find((locality) => locality.id === nextLocalityId);
              setAreaDraft((prev) => ({ ...prev, localityId: nextLocalityId, cityId: nextLocality?.cityId || '' }));
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
          >
            <option value="">Select locality</option>
            {draft.localities.map((locality) => (
              <option key={locality.id} value={locality.id}>
                {locality.name} ({cityLookup.get(locality.cityId)?.name || locality.cityId})
              </option>
            ))}
          </select>
          <input value={areaDraft.name} onChange={(e) => setAreaDraft((prev) => ({ ...prev, name: e.target.value }))} placeholder="Area name" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]" />
          <input value={areaDraft.id} onChange={(e) => setAreaDraft((prev) => ({ ...prev, id: e.target.value }))} placeholder="Area ID" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-mono" />
          <input value={areaDraft.pincode} onChange={(e) => setAreaDraft((prev) => ({ ...prev, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))} placeholder="Pincode" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-mono" />
          <button type="button" onClick={saveArea} disabled={isSaving || isImporting} className="rounded-lg bg-indigo-600 px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50">
            {editingAreaId ? 'Update Area' : 'Create Area'}
          </button>
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {draft.areas.map((area) => (
              <div key={area.id} className="rounded-lg border border-slate-200 bg-white p-3 text-[11px]">
                <div className="font-semibold text-slate-900">{area.name}</div>
                <div className="text-[10px] text-slate-500">
                  {localityLookup.get(area.localityId)?.name || area.localityId}
                  {' • '}
                  {cityLookup.get(area.cityId)?.name || area.cityId}
                </div>
                <div className="font-mono text-[10px] text-slate-500">{area.id} | {area.pincode}</div>
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => { setEditingAreaId(area.id); setAreaDraft(area); }} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-700">Edit</button>
                  <button type="button" onClick={() => void deleteArea(area.id)} className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
