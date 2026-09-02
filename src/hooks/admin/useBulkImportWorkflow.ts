// Stateful wrapper around services/admin/bulkImport.ts, shared by the legacy AdminConsole
// "Bulk Upload" tab and the new, separately-routed AdminBulkImportPage. Extracting this out
// of AdminConsole.tsx means both screens run the exact same validation/preview logic instead
// of two implementations that could silently drift apart.
//
// The optional job* callbacks let a caller (AdminBulkImportPage) track this as a background
// job (admin-backend-ux-spec.md Section 4.4) without AdminConsole.tsx needing to know jobs
// exist at all — it simply omits them and gets the original synchronous-feeling behavior.
import { useState } from 'react';
import type { Business, Locality, PincodeRoutingMapping } from '../../types';
import {
  BULK_IMPORT_CHUNK_SIZE,
  buildFailedImportCsvContent,
  buildImportPreview,
  buildImportPreviewCsvContent,
  parseCsvFileToRows,
  triggerCsvDownload,
  type ImportPreviewRow,
} from '../../services/admin/bulkImport';

const IMPORT_PREVIEW_PAGE_SIZE = 20;

export type BulkImportApplyResult = { imported: number; skipped: number };

type UseBulkImportWorkflowArgs = {
  businesses: Business[];
  localities: Locality[];
  pincodeMappings: PincodeRoutingMapping[];
  onBulkImportBusinesses?: (rows: ImportPreviewRow[]) => BulkImportApplyResult;
  /** Called right before parsing starts; return a job id to track this run (optional). */
  onJobStart?: (fileName: string) => string;
  /** Called with lifecycle updates for the job id returned by onJobStart. */
  onJobUpdate?: (jobId: string, patch: { status: 'processing' | 'needs_review' | 'done' | 'failed'; summary?: string; readyCount?: number; updateCount?: number; failedCount?: number }) => void;
};

export function useBulkImportWorkflow({
  businesses,
  localities,
  pincodeMappings,
  onBulkImportBusinesses,
  onJobStart,
  onJobUpdate,
}: UseBulkImportWorkflowArgs) {
  const [importResult, setImportResult] = useState('');
  const [importPreview, setImportPreview] = useState<ImportPreviewRow[]>([]);
  const [parsedImportRowCount, setParsedImportRowCount] = useState(0);
  const [suggestedImportChunkCount, setSuggestedImportChunkCount] = useState(1);
  const [isImportChunkLimitExceeded, setIsImportChunkLimitExceeded] = useState(false);
  const [importPreviewPage, setImportPreviewPage] = useState(1);

  const importPreviewTotalPages = Math.max(1, Math.ceil(importPreview.length / IMPORT_PREVIEW_PAGE_SIZE));
  const safeImportPreviewPage = Math.min(importPreviewPage, importPreviewTotalPages);
  const pagedImportPreview = importPreview.slice(
    (safeImportPreviewPage - 1) * IMPORT_PREVIEW_PAGE_SIZE,
    safeImportPreviewPage * IMPORT_PREVIEW_PAGE_SIZE
  );

  const handleCsvImport = async (file: File) => {
    const jobId = onJobStart?.(file.name);
    const rows = await parseCsvFileToRows(file);

    if (rows.length === 0) {
      setImportResult('CSV appears empty or missing rows.');
      setImportPreview([]);
      setParsedImportRowCount(0);
      setSuggestedImportChunkCount(1);
      setIsImportChunkLimitExceeded(false);
      if (jobId) onJobUpdate?.(jobId, { status: 'failed', summary: 'CSV appears empty or missing rows.' });
      return;
    }

    setParsedImportRowCount(rows.length);
    setSuggestedImportChunkCount(Math.max(1, Math.ceil(rows.length / BULK_IMPORT_CHUNK_SIZE)));

    if (jobId) onJobUpdate?.(jobId, { status: 'processing' });

    if (rows.length > BULK_IMPORT_CHUNK_SIZE) {
      setImportPreview([]);
      setImportPreviewPage(1);
      setIsImportChunkLimitExceeded(true);
      const message = `This CSV contains ${rows.length.toLocaleString()} listings. Please split it into ${Math.ceil(rows.length / BULK_IMPORT_CHUNK_SIZE)} files of up to ${BULK_IMPORT_CHUNK_SIZE.toLocaleString()} rows each before previewing or uploading.`;
      setImportResult(message);
      if (jobId) onJobUpdate?.(jobId, { status: 'failed', summary: message });
      return;
    }

    const preview = buildImportPreview(rows, { businesses, localities, pincodeMappings });
    setIsImportChunkLimitExceeded(false);
    setImportPreview(preview);
    setImportPreviewPage(1);
    const ready = preview.filter((r) => r.previewStatus === 'ready').length;
    const updates = preview.filter((r) => r.previewStatus === 'update').length;
    const failed = preview.filter((r) => r.previewStatus === 'fail').length;
    const queuedForMapping = preview.filter((row) => row.requiresTaxonomyMapping && row.previewStatus !== 'fail').length;
    const summary = `Preview generated: ${ready} ready, ${updates} existing matches need update confirmation, ${queuedForMapping} queued for taxonomy mapping, ${failed} failed.`;
    setImportResult(summary);
    if (jobId) {
      onJobUpdate?.(jobId, {
        status: 'needs_review',
        summary,
        readyCount: ready,
        updateCount: updates,
        failedCount: failed,
      });
    }
  };

  const handleApplyImportPreview = () => {
    if (!onBulkImportBusinesses) {
      setImportResult('Bulk import callback is not configured.');
      return;
    }
    if (importPreview.length > BULK_IMPORT_CHUNK_SIZE) {
      setImportResult(`This preview exceeds the ${BULK_IMPORT_CHUNK_SIZE.toLocaleString()} row rollout limit. Please split the CSV into smaller chunks first.`);
      return;
    }
    const validRows = importPreview.filter((r) => r.previewStatus !== 'fail');
    const updateRows = validRows.filter((r) => r.previewStatus === 'update');
    if (updateRows.length > 0 && !confirm(`${updateRows.length} listing(s) already exist with the same business name, phone, pincode, and locality. Update those records instead of creating duplicates?`)) {
      return;
    }
    const result = onBulkImportBusinesses(validRows);
    const failed = importPreview.filter((r) => r.previewStatus === 'fail').length;
    setImportPreview(importPreview.filter((r) => r.previewStatus === 'fail'));
    setImportPreviewPage(1);
    setImportResult(`Upload complete: ${result.imported} created, ${result.skipped} updated/skipped, ${failed} failed rows kept below with error details.`);
  };

  const downloadFailedImportCsv = () => {
    triggerCsvDownload(
      buildFailedImportCsvContent(importPreview.filter((r) => r.previewStatus === 'fail')),
      'failed-business-imports.csv'
    );
  };

  const downloadImportPreviewCsv = () => {
    triggerCsvDownload(buildImportPreviewCsvContent(importPreview), 'listing-import-preview.csv');
  };

  return {
    importResult,
    importPreview,
    pagedImportPreview,
    safeImportPreviewPage,
    importPreviewTotalPages,
    parsedImportRowCount,
    suggestedImportChunkCount,
    isImportChunkLimitExceeded,
    handleCsvImport,
    handleApplyImportPreview,
    downloadImportPreviewCsv,
    downloadFailedImportCsv,
    goToPreviousImportPage: () => setImportPreviewPage((prev) => Math.max(1, prev - 1)),
    goToNextImportPage: () => setImportPreviewPage((prev) => Math.min(importPreviewTotalPages, prev + 1)),
    resetImportPreviewPage: () => setImportPreviewPage(1),
  };
}
