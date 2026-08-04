import React from 'react';
import type { Locality } from '../../types';
import { getCategoryById, getSubcategoryById } from '../../categoryMaster';

type ImportPreviewRow = {
  rowNumber: number;
  listingId?: string;
  googlePlaceId?: string;
  businessName: string;
  normalizedPhone: string;
  resolvedPincode: string;
  resolvedLocalityId: string;
  category?: string;
  subcategory?: string;
  categoryId?: string;
  subcategoryId?: string;
  previewStatus: 'ready' | 'update' | 'fail';
  errors: string[];
  existingBusinessId?: string;
  requiresTaxonomyMapping: boolean;
  taxonomyStatusLabel: string;
};

type BulkUploadWorkspaceProps = {
  localities: Locality[];
  importResult: string;
  importPreview: ImportPreviewRow[];
  pagedImportPreview: ImportPreviewRow[];
  safeImportPreviewPage: number;
  importPreviewTotalPages: number;
  importChunkLimit: number;
  parsedRowCount: number;
  suggestedChunkCount: number;
  chunkLimitExceeded: boolean;
  onCsvFileSelected: (file: File) => void;
  onDownloadPreviewCsv: () => void;
  onDownloadFailedCsv: () => void;
  onApplyImportPreview: () => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
};

export default function BulkUploadWorkspace({
  localities,
  importResult,
  importPreview,
  pagedImportPreview,
  safeImportPreviewPage,
  importPreviewTotalPages,
  importChunkLimit,
  parsedRowCount,
  suggestedChunkCount,
  chunkLimitExceeded,
  onCsvFileSelected,
  onDownloadPreviewCsv,
  onDownloadFailedCsv,
  onApplyImportPreview,
  onPreviousPage,
  onNextPage,
}: BulkUploadWorkspaceProps) {
  const readyCount = importPreview.filter((row) => row.previewStatus === 'ready').length;
  const updateCount = importPreview.filter((row) => row.previewStatus === 'update').length;
  const failedCount = importPreview.filter((row) => row.previewStatus === 'fail').length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
      <h3 className="text-md font-bold text-slate-950">Bulk Import Businesses (CSV)</h3>
      <p className="text-xs text-slate-500">
        Upload CSV with columns: Localisy Listing ID, Google Place ID, Image URL, Logo URL, Cover Image URL, Gallery URLs, Business Name, Address, optional Area / Area ID, optional Locality / Locality ID, City, State, PIN, Mobile, Rating, Reviews, Services, Category, Subcategory, Latitude, Longitude. Localisy Listing ID is mandatory for the catalogue, and if the sheet leaves it blank the system will auto-generate one during preview. Missing Area will not block import as long as Locality or a mapped 6-digit PIN can resolve the listing. Invalid category/subcategory values are not auto-guessed; those listings go to the taxonomy mapping queue.
      </p>
      <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-[11px] text-indigo-900">
        Bulk import is now optimized for rollout batches of up to <span className="font-bold">{importChunkLimit.toLocaleString()}</span> listings per CSV.
        {parsedRowCount > 0 && (
          <span className="block pt-1 text-indigo-700">
            Current file rows detected: <span className="font-bold">{parsedRowCount.toLocaleString()}</span>
            {suggestedChunkCount > 1 ? ` | Recommended chunks: ${suggestedChunkCount}` : ''}
          </span>
        )}
      </div>

      <input
        type="file"
        accept=".csv,text/csv"
        onChange={(event) => {
          const selectedFile = event.target.files?.[0];
          if (selectedFile) onCsvFileSelected(selectedFile);
        }}
        className="w-full text-xs border border-slate-200 rounded-lg p-2"
      />

      {importResult && (
        <div className={`text-xs rounded-lg px-3 py-2 border ${
          chunkLimitExceeded
            ? 'border-amber-200 bg-amber-50 text-amber-900'
            : 'border-emerald-100 bg-emerald-50 text-emerald-800'
        }`}>
          {importResult}
        </div>
      )}

      {importPreview.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2 text-[10px] font-bold">
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded-lg">
                Ready: {readyCount}
              </span>
              <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded-lg">
                Updates: {updateCount}
              </span>
              <span className="bg-rose-50 text-rose-700 border border-rose-100 px-2 py-1 rounded-lg">
                Failed: {failedCount}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onDownloadPreviewCsv}
                className="text-[10px] bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-50"
              >
                Export Preview CSV
              </button>
              {failedCount > 0 && (
                <button
                  type="button"
                  onClick={onDownloadFailedCsv}
                  className="text-[10px] bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-50"
                >
                  Export Failed CSV
                </button>
              )}
              <button
                type="button"
                onClick={onApplyImportPreview}
                disabled={!importPreview.some((row) => row.previewStatus !== 'fail')}
                className="text-[10px] bg-indigo-600 disabled:bg-slate-300 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-700"
              >
                Upload Ready Items
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl max-h-72">
            <table className="w-full text-left text-[10px] text-slate-600">
              <thead className="bg-slate-50 sticky top-0">
                <tr className="uppercase font-mono text-slate-400">
                  <th className="p-2">Row</th>
                  <th className="p-2">Listing ID</th>
                  <th className="p-2">Google Place ID</th>
                  <th className="p-2">Business</th>
                  <th className="p-2">Phone</th>
                  <th className="p-2">Pincode</th>
                  <th className="p-2">Locality</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Subcategory</th>
                  <th className="p-2">Status</th>
                  <th className="p-2 min-w-[220px]">Error Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedImportPreview.map((row) => (
                  <tr key={`${row.rowNumber}-${row.businessName}`} className="hover:bg-slate-50/60">
                    <td className="p-2 font-mono">{row.rowNumber}</td>
                    <td className="p-2 font-mono text-slate-800">{row.listingId || '-'}</td>
                    <td className="p-2 font-mono">{row.googlePlaceId || '-'}</td>
                    <td className="p-2 font-semibold text-slate-800">{row.businessName}</td>
                    <td className="p-2 font-mono">{row.normalizedPhone || 'Not provided'}</td>
                    <td className="p-2 font-mono">{row.resolvedPincode || '-'}</td>
                    <td className="p-2">{localities.find((locality) => locality.id === row.resolvedLocalityId)?.name.split(',')[0] || row.resolvedLocalityId}</td>
                    <td className="p-2 align-top">
                      <span className="block text-slate-800">{row.category?.trim() || 'Not supplied'}</span>
                      <span className={`block text-[9px] ${row.categoryId ? 'text-emerald-700' : 'text-amber-700 font-semibold'}`}>
                        {row.categoryId ? `Mapped: ${getCategoryById(row.categoryId || '')?.name || row.categoryId}` : 'Unmapped - saved to tags'}
                      </span>
                    </td>
                    <td className="p-2 align-top">
                      <span className="block text-slate-800">{row.subcategory?.trim() || 'Not supplied'}</span>
                      <span className={`block text-[9px] ${row.subcategoryId ? 'text-emerald-700' : 'text-amber-700 font-semibold'}`}>
                        {row.subcategoryId ? `Mapped: ${getSubcategoryById(row.subcategoryId || '')?.name || row.subcategoryId}` : 'Unmapped - send to queue'}
                      </span>
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-0.5 rounded-full font-bold ${
                        row.previewStatus === 'ready'
                          ? 'bg-emerald-50 text-emerald-700'
                          : row.previewStatus === 'update'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-rose-50 text-rose-700'
                      }`}>
                        {row.previewStatus === 'ready' ? 'Ready' : row.previewStatus === 'update' ? 'Update existing' : 'Fail'}
                      </span>
                    </td>
                    <td className="p-2 align-top">
                      <div className="space-y-1">
                        {row.errors.length > 0 ? (
                          <div className="text-rose-600">{row.errors.join('; ')}</div>
                        ) : row.previewStatus === 'update' ? (
                          <div className="text-blue-700">Existing ID: {row.existingBusinessId}</div>
                        ) : (
                          <div className="text-slate-400">-</div>
                        )}
                        {row.requiresTaxonomyMapping && (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-[9px] font-semibold text-amber-800">
                            {row.taxonomyStatusLabel}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={onPreviousPage}
              disabled={safeImportPreviewPage <= 1}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="font-mono text-slate-500">
              Page {safeImportPreviewPage} / {importPreviewTotalPages}
            </span>
            <button
              type="button"
              onClick={onNextPage}
              disabled={safeImportPreviewPage >= importPreviewTotalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
