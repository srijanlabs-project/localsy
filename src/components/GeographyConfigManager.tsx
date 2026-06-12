import React, { useEffect, useMemo, useState } from 'react';
import { AreaMaster, CityMaster, GeographyConfigState, StateMaster } from '../types';

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
  id: '',
  cityId: '',
  name: '',
  pincode: '',
};

export default function GeographyConfigManager({
  config,
  onSave,
}: GeographyConfigManagerProps) {
  const [draft, setDraft] = useState<GeographyConfigState>(config);
  const [stateDraft, setStateDraft] = useState(emptyStateDraft);
  const [cityDraft, setCityDraft] = useState(emptyCityDraft);
  const [areaDraft, setAreaDraft] = useState(emptyAreaDraft);
  const [editingStateId, setEditingStateId] = useState<string | null>(null);
  const [editingCityId, setEditingCityId] = useState<string | null>(null);
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusText, setStatusText] = useState('');

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
    const id = slugify(stateDraft.id || name);
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
    const nextDraft: GeographyConfigState = {
      ...draft,
      states: draft.states.filter((state) => state.id !== stateId),
      cities: draft.cities.filter((city) => city.stateId !== stateId),
      areas: draft.areas.filter((area) => !cityIds.has(area.cityId)),
    };
    setDraft(nextDraft);
    await persist(nextDraft, 'State removed.');
  };

  const saveCity = async () => {
    const name = cityDraft.name.trim();
    const id = slugify(cityDraft.id || name);
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
    const nextDraft: GeographyConfigState = {
      ...draft,
      cities: draft.cities.filter((city) => city.id !== cityId),
      areas: draft.areas.filter((area) => area.cityId !== cityId),
    };
    setDraft(nextDraft);
    await persist(nextDraft, 'City removed.');
  };

  const saveArea = async () => {
    const name = areaDraft.name.trim();
    const id = slugify(areaDraft.id || `${name}-${areaDraft.pincode}`);
    const pincode = areaDraft.pincode.replace(/\D/g, '').slice(0, 6);
    if (!id || !name || !areaDraft.cityId || pincode.length !== 6) {
      setStatusText('Area name, parent city, and 6-digit pincode are required.');
      return;
    }
    const nextArea: AreaMaster = { id, cityId: areaDraft.cityId, name, pincode };
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

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-slate-950">Managed Geography</h3>
          <p className="mt-1 text-[11px] text-slate-500">
            States, cities, and areas now have an admin authoring path so locality and listing routing data can be managed without code edits.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
          <div>States: <span className="font-bold text-slate-900">{draft.states.length}</span></div>
          <div>Cities: <span className="font-bold text-slate-900">{draft.cities.length}</span></div>
          <div>Areas: <span className="font-bold text-slate-900">{draft.areas.length}</span></div>
        </div>
      </div>

      {statusText && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-900">
          {statusText}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-900">States</div>
            <button type="button" onClick={() => { setStateDraft(emptyStateDraft); setEditingStateId(null); }} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700">
              New
            </button>
          </div>
          <input value={stateDraft.name} onChange={(e) => setStateDraft((prev) => ({ ...prev, name: e.target.value }))} placeholder="State name" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]" />
          <input value={stateDraft.id} onChange={(e) => setStateDraft((prev) => ({ ...prev, id: e.target.value }))} placeholder="State ID" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-mono" />
          <button type="button" onClick={saveState} disabled={isSaving} className="rounded-lg bg-indigo-600 px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50">
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
          <button type="button" onClick={saveCity} disabled={isSaving} className="rounded-lg bg-indigo-600 px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50">
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
            <div className="text-xs font-bold text-slate-900">Areas</div>
            <button type="button" onClick={() => { setAreaDraft(emptyAreaDraft); setEditingAreaId(null); }} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700">
              New
            </button>
          </div>
          <select value={areaDraft.cityId} onChange={(e) => setAreaDraft((prev) => ({ ...prev, cityId: e.target.value }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]">
            <option value="">Select city</option>
            {draft.cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name} ({stateLookup.get(city.stateId)?.name || city.stateId})
              </option>
            ))}
          </select>
          <input value={areaDraft.name} onChange={(e) => setAreaDraft((prev) => ({ ...prev, name: e.target.value }))} placeholder="Area name" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]" />
          <input value={areaDraft.id} onChange={(e) => setAreaDraft((prev) => ({ ...prev, id: e.target.value }))} placeholder="Area ID" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-mono" />
          <input value={areaDraft.pincode} onChange={(e) => setAreaDraft((prev) => ({ ...prev, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))} placeholder="Pincode" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-mono" />
          <button type="button" onClick={saveArea} disabled={isSaving} className="rounded-lg bg-indigo-600 px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50">
            {editingAreaId ? 'Update Area' : 'Create Area'}
          </button>
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {draft.areas.map((area) => (
              <div key={area.id} className="rounded-lg border border-slate-200 bg-white p-3 text-[11px]">
                <div className="font-semibold text-slate-900">{area.name}</div>
                <div className="text-[10px] text-slate-500">{cityLookup.get(area.cityId)?.name || area.cityId}</div>
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
