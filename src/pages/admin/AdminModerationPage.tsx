import React, { useState } from 'react';
import type { Business, Locality } from '../../types';
import ModerationQueue from '../../components/admin/ModerationQueue';

type AdminModerationPageProps = {
  businesses: Business[];
  localities: Locality[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onUpdateBusiness?: (business: Business) => void;
};

// Routed home for admin-backend-ux-spec.md Section 5.2 "Moderation Queue".
// Reuses ModerationQueue.tsx unchanged (it was already a clean, presentational
// component per the spec's Section 8 component-reuse map) — this page just
// owns the screen-local UI state (which row has its reject box open, draft
// text) that used to live inside the AdminConsole.tsx monolith.
export default function AdminModerationPage({ businesses, localities, onApprove, onReject, onUpdateBusiness }: AdminModerationPageProps) {
  const [rejectionActive, setRejectionActive] = useState<Record<string, boolean>>({});
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [editedHrs, setEditedHrs] = useState<Record<string, string>>({});

  const pendingBusinesses = businesses.filter((business) => business.status === 'pending');

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Moderation Queue</h2>
        <p className="mt-0.5 text-xs text-slate-500">Review and act on pending business submissions.</p>
      </div>
      <ModerationQueue
        pendingBusinesses={pendingBusinesses}
        localities={localities}
        rejectionActive={rejectionActive}
        rejectionReasons={rejectionReasons}
        editedHrs={editedHrs}
        onApprove={onApprove}
        onReject={onReject}
        onToggleRejectActive={(businessId, active) => {
          setRejectionActive((prev) => ({ ...prev, [businessId]: active }));
        }}
        onRejectReasonChange={(businessId, reason) => {
          setRejectionReasons((prev) => ({ ...prev, [businessId]: reason }));
        }}
        onHoursChange={(businessId, hours) => {
          setEditedHrs((prev) => ({ ...prev, [businessId]: hours }));
          const targetBusiness = pendingBusinesses.find((business) => business.id === businessId);
          if (targetBusiness && onUpdateBusiness) {
            onUpdateBusiness({ ...targetBusiness, hours });
          }
        }}
        onUpdateBusiness={onUpdateBusiness}
      />
    </div>
  );
}
