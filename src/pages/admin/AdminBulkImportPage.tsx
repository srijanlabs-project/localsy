import React from 'react';
import type { Business, Locality, PincodeRoutingMapping } from '../../types';
import type { ImportPreviewRow } from '../../services/admin/bulkImport';
import BulkUploadWorkspace from '../../components/admin/BulkUploadWorkspace';
import { useBulkImportWorkflow, type BulkImportApplyResult } from '../../hooks/admin/useBulkImportWorkflow';
import { BULK_IMPORT_CHUNK_SIZE } from '../../services/admin/bulkImport';
import { useAdminBackgroundJobs } from '../../contexts/AdminBackgroundJobsContext';

type AdminBulkImportPageProps = {
  businesses: Business[];
  localities: Locality[];
  pincodeMappings?: PincodeRoutingMapping[];
  onBulkImportBusinesses?: (rows: ImportPreviewRow[]) => BulkImportApplyResult;
};

// Routed home for admin-backend-ux-spec.md Section 5.6 "Bulk Import".
//
// This is the screen the spec's Section 4.4 background-job framework exists for: uploading
// a CSV hands off to a tracked job (see AdminBackgroundJobsProvider, mounted above the admin
// router in AdminApp.tsx) so the operator can navigate to Moderation or the Dashboard while
// parsing/validation runs, then get pulled back here via the top-bar job indicator once the
// preview is ready. See useBulkImportWorkflow.ts for the shared validation logic (same
// pure functions the legacy console's Bulk Upload tab uses).
export default function AdminBulkImportPage({ businesses, localities, pincodeMappings = [], onBulkImportBusinesses }: AdminBulkImportPageProps) {
  const { createJob, updateJob } = useAdminBackgroundJobs();

  const {
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
    goToPreviousImportPage,
    goToNextImportPage,
  } = useBulkImportWorkflow({
    businesses,
    localities,
    pincodeMappings,
    onBulkImportBusinesses,
    onJobStart: (fileName) => createJob({ type: 'bulk_import', originScreen: 'Bulk Import', fileName }),
    onJobUpdate: (jobId, patch) => updateJob(jobId, patch),
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Bulk Import</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Upload business CSV/Excel data. Runs as a background job — you can leave this screen while it validates.
        </p>
      </div>
      <BulkUploadWorkspace
        localities={localities}
        importResult={importResult}
        importPreview={importPreview}
        pagedImportPreview={pagedImportPreview}
        safeImportPreviewPage={safeImportPreviewPage}
        importPreviewTotalPages={importPreviewTotalPages}
        importChunkLimit={BULK_IMPORT_CHUNK_SIZE}
        parsedRowCount={parsedImportRowCount}
        suggestedChunkCount={suggestedImportChunkCount}
        chunkLimitExceeded={isImportChunkLimitExceeded}
        onCsvFileSelected={handleCsvImport}
        onDownloadPreviewCsv={downloadImportPreviewCsv}
        onDownloadFailedCsv={downloadFailedImportCsv}
        onApplyImportPreview={handleApplyImportPreview}
        onPreviousPage={goToPreviousImportPage}
        onNextPage={goToNextImportPage}
      />
    </div>
  );
}
