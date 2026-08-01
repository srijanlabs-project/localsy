import React from 'react';
import { AlertCircle } from 'lucide-react';
import type { AuditEvent } from '../../types';

type DataAuditWorkspaceProps = {
  auditLogs: AuditEvent[];
  pagedAuditLogs: AuditEvent[];
  safeAuditPage: number;
  auditTotalPages: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
};

export default function DataAuditWorkspace({
  auditLogs,
  pagedAuditLogs,
  safeAuditPage,
  auditTotalPages,
  onPreviousPage,
  onNextPage,
}: DataAuditWorkspaceProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-md font-bold text-slate-950 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-indigo-600" />
            Compliance &amp; Data Privacy Audit Desk
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Mandatory privacy logs tracking human and AI searches, OTP contact unlocks, and listing mutations.
          </p>
        </div>
        <div className="bg-slate-100 text-[10px] font-mono px-3 py-1 rounded-lg text-slate-600 border border-slate-200 uppercase tracking-tight self-start md:self-auto">
          SLA Compliant • GDPR Safeguarded
        </div>
      </div>

      {auditLogs.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
          No security compliance logs registered in the current session.
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs text-slate-500 border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">
                <th className="p-3">Logged Date/Time</th>
                <th className="p-3">Actor &amp; Scope</th>
                <th className="p-3">Audited Action</th>
                <th className="p-3">Trace IP Address</th>
                <th className="p-3">Device Signature</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagedAuditLogs.map((log) => {
                const badgeColor =
                  log.actionType === 'search'
                    ? 'bg-blue-50 text-blue-700 border-blue-200/50'
                    : log.actionType === 'contact_view'
                      ? 'bg-amber-50 text-amber-700 border-amber-200/50'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200/50';

                return (
                  <tr key={log.id} className="hover:bg-slate-50/35 transition text-[11px] whitespace-nowrap md:whitespace-normal">
                    <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      <span className="block text-[9px] text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 block">{log.userName}</span>
                      <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border mt-0.5 uppercase tracking-wide font-mono ${badgeColor}`}>
                        {log.actionType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 max-w-[280px]">
                      <span className="font-bold text-slate-700 block">{log.description}</span>
                      <span className="text-slate-500 text-[10px] leading-relaxed block overflow-hidden text-ellipsis">{log.details}</span>
                    </td>
                    <td className="p-3 font-mono text-slate-600 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                        {log.ipAddress}
                      </span>
                      <span className="block text-[8px] text-emerald-600 font-bold uppercase tracking-wider">Zone B-West (IN)</span>
                    </td>
                    <td className="p-3 font-mono text-slate-400 max-w-[150px] truncate" title={log.deviceCode}>
                      {log.deviceCode}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {auditLogs.length > 0 && (
        <div className="flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={onPreviousPage}
            disabled={safeAuditPage <= 1}
            className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="font-mono text-slate-500">
            Page {safeAuditPage} / {auditTotalPages}
          </span>
          <button
            type="button"
            onClick={onNextPage}
            disabled={safeAuditPage >= auditTotalPages}
            className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
