import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, PlusCircle, Trash2 } from 'lucide-react';
import { BUSINESS_CATEGORIES, getCategoryById } from '../../categoryMaster';

type InlineSubcategoryCreatorProps = {
  categoryId: string;
  disabled?: boolean;
  canCreate: boolean;
  onAssign: (subcategoryId: string) => void;
  onCreate: (categoryId: string, name: string) => Promise<string | null>;
};

export function InlineSubcategoryCreator({
  categoryId,
  disabled,
  canCreate,
  onAssign,
  onCreate,
}: InlineSubcategoryCreatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorText, setErrorText] = useState('');

  if (!canCreate) return null;

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={!categoryId || disabled}
        onClick={() => {
          setIsOpen((previous) => !previous);
          setErrorText('');
        }}
        className="inline-flex items-center gap-1 rounded-md border border-dashed border-indigo-300 bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
      >
        <PlusCircle className="h-3 w-3" />
        <span>Create subcategory</span>
      </button>

      {isOpen && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={name}
            disabled={isSaving || disabled}
            onChange={(event) => setName(event.target.value)}
            placeholder="New subcategory name"
            className="min-w-[12rem] flex-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px]"
          />
          <button
            type="button"
            disabled={!name.trim() || isSaving || disabled}
            onClick={async () => {
              setIsSaving(true);
              setErrorText('');
              try {
                const nextSubcategoryId = await onCreate(categoryId, name);
                if (nextSubcategoryId) {
                  onAssign(nextSubcategoryId);
                  setName('');
                  setIsOpen(false);
                }
              } catch (error) {
                setErrorText(error instanceof Error ? error.message : 'Failed to create subcategory.');
              } finally {
                setIsSaving(false);
              }
            }}
            className="rounded-md bg-indigo-600 px-2.5 py-1 text-[10px] font-bold text-white disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => {
              setIsOpen(false);
              setName('');
              setErrorText('');
            }}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-700"
          >
            Cancel
          </button>
        </div>
      )}

      {errorText && (
        <div className="text-[10px] text-rose-600">{errorText}</div>
      )}
    </div>
  );
}

type InlineAreaCreatorProps = {
  localityId: string;
  initialPincode?: string;
  disabled?: boolean;
  canCreate: boolean;
  onAssign: (areaId: string, areaName: string, pincode: string) => void;
  onCreate: (localityId: string, name: string, pincode: string) => Promise<string | null>;
};

export function InlineAreaCreator({
  localityId,
  initialPincode = '',
  disabled,
  canCreate,
  onAssign,
  onCreate,
}: InlineAreaCreatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [pincode, setPincode] = useState(initialPincode);
  const [isSaving, setIsSaving] = useState(false);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    setPincode(initialPincode);
  }, [initialPincode]);

  if (!canCreate) return null;

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={!localityId || disabled}
        onClick={() => {
          setIsOpen((previous) => !previous);
          setErrorText('');
        }}
        className="inline-flex items-center gap-1 rounded-md border border-dashed border-emerald-300 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
      >
        <PlusCircle className="h-3 w-3" />
        <span>Create area</span>
      </button>

      {isOpen && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={name}
              disabled={isSaving || disabled}
              onChange={(event) => setName(event.target.value)}
              placeholder="New area name"
              className="min-w-[12rem] flex-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px]"
            />
            <input
              value={pincode}
              disabled={isSaving || disabled}
              maxLength={6}
              onChange={(event) => setPincode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Pincode"
              className="w-28 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-mono"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!name.trim() || pincode.length !== 6 || isSaving || disabled}
              onClick={async () => {
                setIsSaving(true);
                setErrorText('');
                try {
                  const nextAreaId = await onCreate(localityId, name, pincode);
                  if (nextAreaId) {
                    onAssign(nextAreaId, name.trim(), pincode);
                    setName('');
                    setIsOpen(false);
                  }
                } catch (error) {
                  setErrorText(error instanceof Error ? error.message : 'Failed to create area.');
                } finally {
                  setIsSaving(false);
                }
              }}
              className="rounded-md bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                setIsOpen(false);
                setName('');
                setPincode(initialPincode);
                setErrorText('');
              }}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {errorText && (
        <div className="text-[10px] text-rose-600">{errorText}</div>
      )}
    </div>
  );
}

type OrderedCategoryPickerProps = {
  label: string;
  selectedIds: string[];
  onChange: (nextIds: string[]) => void;
  helperText?: string;
};

export function OrderedCategoryPicker({
  label,
  selectedIds,
  onChange,
  helperText = 'Use the order below to control how this section appears on the page.'
}: OrderedCategoryPickerProps) {
  const [newCategoryId, setNewCategoryId] = useState(() => (
    BUSINESS_CATEGORIES.find((category) => !selectedIds.includes(category.id))?.id
    || BUSINESS_CATEGORIES[0]?.id
    || ''
  ));

  const selectedCategories = selectedIds
    .map((categoryId) => getCategoryById(categoryId))
    .filter(Boolean) as (typeof BUSINESS_CATEGORIES)[number][];

  const availableCategories = BUSINESS_CATEGORIES.filter((category) => !selectedIds.includes(category.id));

  useEffect(() => {
    if (availableCategories.some((category) => category.id === newCategoryId)) return;
    const nextAvailable = availableCategories[0]?.id || BUSINESS_CATEGORIES[0]?.id || '';
    setNewCategoryId(nextAvailable);
  }, [availableCategories, newCategoryId]);

  const addCategory = () => {
    if (!newCategoryId || selectedIds.includes(newCategoryId)) return;
    onChange([...selectedIds, newCategoryId]);
  };

  const moveCategory = (categoryId: string, direction: 'up' | 'down') => {
    const currentIndex = selectedIds.indexOf(categoryId);
    if (currentIndex < 0) return;
    const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= selectedIds.length) return;
    const nextIds = [...selectedIds];
    [nextIds[currentIndex], nextIds[nextIndex]] = [nextIds[nextIndex], nextIds[currentIndex]];
    onChange(nextIds);
  };

  const removeCategory = (categoryId: string) => {
    onChange(selectedIds.filter((id) => id !== categoryId));
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold text-slate-700">{label}</div>
          <div className="text-[10px] text-slate-500">{helperText}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={newCategoryId}
            onChange={(e) => setNewCategoryId(e.target.value)}
            className="min-w-[160px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
          >
            {(availableCategories.length > 0 ? availableCategories : BUSINESS_CATEGORIES).map((category) => (
              <option key={category.id} value={category.id} disabled={selectedIds.includes(category.id)}>
                {category.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={addCategory}
            disabled={!newCategoryId || selectedIds.includes(newCategoryId)}
            className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-[11px] font-bold text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
      </div>

      {selectedCategories.length > 0 ? (
        <div className="space-y-2">
          {selectedCategories.map((category, index) => (
            <div
              key={category.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="truncate text-[11px] font-semibold text-slate-800">{index + 1}. {category.name}</div>
                <div className="truncate text-[10px] text-slate-500">{category.id}</div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveCategory(category.id, 'up')}
                  disabled={index === 0}
                  className="rounded border border-slate-200 bg-white p-1.5 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                  title="Move category up"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveCategory(category.id, 'down')}
                  disabled={index === selectedCategories.length - 1}
                  className="rounded border border-slate-200 bg-white p-1.5 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                  title="Move category down"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeCategory(category.id)}
                  className="rounded border border-rose-200 bg-rose-50 p-1.5 text-rose-700"
                  title="Remove category"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-[11px] text-slate-500">
          No categories selected yet. Add one to define how this section should render.
        </div>
      )}
    </div>
  );
}

export type OrderedSelectionOption = {
  id: string;
  label: string;
  meta?: string;
};

type OrderedSelectionPickerProps = {
  label: string;
  selectedIds: string[];
  options: OrderedSelectionOption[];
  onChange: (nextIds: string[]) => void;
  helperText?: string;
  emptyText?: string;
};

export function OrderedSelectionPicker({
  label,
  selectedIds,
  options,
  onChange,
  helperText = 'Select a value, click Add, and remove it from the selected list when it is no longer needed.',
  emptyText = 'No values selected yet.'
}: OrderedSelectionPickerProps) {
  const availableOptions = options.filter((option) => !selectedIds.includes(option.id));
  const [draftId, setDraftId] = useState(availableOptions[0]?.id || options[0]?.id || '');

  useEffect(() => {
    if (availableOptions.some((option) => option.id === draftId)) return;
    setDraftId(availableOptions[0]?.id || options[0]?.id || '');
  }, [availableOptions, draftId, options]);

  const selectedOptions = selectedIds
    .map((id) => options.find((option) => option.id === id) || { id, label: id })
    .filter(Boolean);

  const addSelection = () => {
    if (!draftId || selectedIds.includes(draftId)) return;
    onChange([...selectedIds, draftId]);
  };

  const removeSelection = (id: string) => {
    onChange(selectedIds.filter((selectedId) => selectedId !== id));
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold text-slate-700">{label}</div>
          <div className="text-[10px] text-slate-500">{helperText}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={draftId}
            onChange={(e) => setDraftId(e.target.value)}
            className="min-w-[190px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px]"
          >
            {(availableOptions.length > 0 ? availableOptions : options).map((option) => (
              <option key={option.id} value={option.id} disabled={selectedIds.includes(option.id)}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={addSelection}
            disabled={!draftId || selectedIds.includes(draftId)}
            className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-[11px] font-bold text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
      </div>

      {selectedOptions.length > 0 ? (
        <div className="space-y-2">
          {selectedOptions.map((option, index) => (
            <div key={`${option.id}-${index}`} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="min-w-0">
                <div className="truncate text-[11px] font-semibold text-slate-800">{index + 1}. {option.label}</div>
                {option.meta && <div className="truncate text-[10px] text-slate-500">{option.meta}</div>}
              </div>
              <button
                type="button"
                onClick={() => removeSelection(option.id)}
                className="rounded border border-rose-200 bg-rose-50 p-1.5 text-rose-700"
                title="Remove"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-[11px] text-slate-500">
          {emptyText}
        </div>
      )}
    </div>
  );
}
