import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Copy, Lock, Plus, Trash2 } from 'lucide-react';

// Routed home for admin-backend-ux-spec.md Section 5.27 "Identity & Access: Roles & Permissions
// (Role Builder)" — Section 9 build step 6. NET NEW, no legacy tab to port.
//
// Per the user's standing instruction ("local-state UI, clearly marked"): this page is a real,
// interactive UI for the Role Builder CONCEPT — creating/cloning/editing roles and a per-group
// permission matrix, persisted to localStorage the same way AdminBackgroundJobsContext persists
// job metadata, so it survives a refresh within this browser. What it explicitly does NOT do,
// and says so in the banner below rather than pretending otherwise: it does not change what
// anyone can actually do in this app. The real enforcement points are the hardcoded functions in
// services/admin/adminRoles.ts (canManageGeography, canManageHomepageCms, etc.), and those are
// unaffected by anything built or edited here. Wiring this UI to actually drive those checks is
// a real, separate follow-up (the "Role Builder replaces the hardcoded matrix" migration Section
// 7 describes), not something this pass can honestly claim to have done.
//
// Permission matrix simplification, also disclosed: the spec's four columns (View / Create-Edit
// / Approve-Publish / Delete-High-risk) are shown for every nav group here, even ones where the
// full spec expects some columns disabled (e.g. Audit Log only ever needing View + Export). That
// per-group column narrowing isn't implemented — every group gets all four toggles.

type PermissionColumn = 'view' | 'createEdit' | 'approvePublish' | 'deleteHighRisk';

const PERMISSION_COLUMNS: { key: PermissionColumn; label: string }[] = [
  { key: 'view', label: 'View' },
  { key: 'createEdit', label: 'Create/Edit' },
  { key: 'approvePublish', label: 'Approve/Publish' },
  { key: 'deleteHighRisk', label: 'Delete/High-risk' },
];

// Nav groups from Section 3's information architecture table.
const NAV_GROUPS = [
  'Dashboard', 'Moderation & Governance', 'Listings', 'Merchant Operations', 'Geography & Routing',
  'Homepage CMS', 'Campaigns & Offers', 'Content & Community', 'Analytics & Insights',
  'Marketing Automation', 'AI & Integrations', 'Identity & Access', 'Platform Config',
] as const;

type PermissionSet = Record<PermissionColumn, boolean>;
type RolePermissions = Record<string, PermissionSet>;

type LocalRole = {
  id: string;
  name: string;
  description: string;
  isBuiltIn: boolean;
  permissions: RolePermissions;
};

const NONE: PermissionSet = { view: false, createEdit: false, approvePublish: false, deleteHighRisk: false };
const FULL: PermissionSet = { view: true, createEdit: true, approvePublish: true, deleteHighRisk: true };
const VIEW_ONLY: PermissionSet = { view: true, createEdit: false, approvePublish: false, deleteHighRisk: false };

const emptyPermissions = (fill: PermissionSet = NONE): RolePermissions => {
  const permissions: RolePermissions = {};
  NAV_GROUPS.forEach((group) => { permissions[group] = { ...fill }; });
  return permissions;
};

// Section 7 "Default role seed data" table, condensed to this page's per-group granularity.
// Full -> FULL, "-" -> NONE, the two documented partial rows use VIEW_ONLY.
const BUILT_IN_ROLES: LocalRole[] = [
  {
    id: 'admin', name: 'Admin', isBuiltIn: true,
    description: 'Full access to every screen — matches the isPrivilegedAdminRole check used throughout adminRoles.ts.',
    permissions: emptyPermissions(FULL),
  },
  {
    id: 'moderator', name: 'Moderator', isBuiltIn: true,
    description: 'Moderation-focused: Dashboard, Moderation Queue, Audit Log (own actions), Listing Directory (view-only).',
    permissions: {
      ...emptyPermissions(NONE),
      'Dashboard': FULL,
      'Moderation & Governance': FULL,
      'Listings': VIEW_ONLY,
    },
  },
  {
    id: 'operator', name: 'Operator', isBuiltIn: true,
    description: 'Full access to Listings, Geography, and Duplicate Review, per Section 7\'s seed table.',
    permissions: {
      ...emptyPermissions(NONE),
      'Dashboard': FULL,
      'Moderation & Governance': FULL,
      'Listings': FULL,
      'Geography & Routing': FULL,
    },
  },
  {
    id: 'growth_operator', name: 'Growth Operator', isBuiltIn: true,
    description: 'Growth-focused: Analytics, Campaigns, Content, Marketing Automation. Note: UserRole has no distinct value for this role yet (see adminRoles.ts) — it exists here only as a seed-data placeholder.',
    permissions: {
      ...emptyPermissions(NONE),
      'Dashboard': FULL,
      'Listings': { view: false, createEdit: false, approvePublish: false, deleteHighRisk: false },
      'Campaigns & Offers': FULL,
      'Content & Community': FULL,
      'Analytics & Insights': FULL,
      'Marketing Automation': FULL,
      'Platform Config': VIEW_ONLY,
    },
  },
];

const STORAGE_KEY = 'localsy_admin_role_builder_v1';

const loadStoredCustomRoles = (): LocalRole[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LocalRole[]) : [];
  } catch {
    return [];
  }
};

let roleIdCounter = 0;
const buildRoleId = () => {
  roleIdCounter += 1;
  return `custom_role_${roleIdCounter}`;
};

export default function AdminRoleBuilderPage() {
  const [customRoles, setCustomRoles] = useState<LocalRole[]>(() => loadStoredCustomRoles());
  const roles = useMemo(() => [...BUILT_IN_ROLES, ...customRoles], [customRoles]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>(BUILT_IN_ROLES[0].id);
  const [notification, setNotification] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(customRoles));
    } catch {
      // Best-effort persistence only.
    }
  }, [customRoles]);

  const notify = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const selectedRole = roles.find((role) => role.id === selectedRoleId) || roles[0];

  const updateRolePermission = (roleId: string, group: string, column: PermissionColumn, value: boolean) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;
    const nextPermissions: RolePermissions = {
      ...role.permissions,
      [group]: { ...role.permissions[group], [column]: value },
    };
    if (role.isBuiltIn) {
      // Built-in roles are editable in place too (spec: "ship as pre-built, editable roles"),
      // but they don't live in localStorage as a separate array — store overrides as a custom
      // role entry that shares the built-in's id, so it persists the same way.
      setCustomRoles((prev) => {
        const existingOverride = prev.find((r) => r.id === roleId);
        if (existingOverride) {
          return prev.map((r) => (r.id === roleId ? { ...r, permissions: nextPermissions } : r));
        }
        return [...prev, { ...role, permissions: nextPermissions }];
      });
    } else {
      setCustomRoles((prev) => prev.map((r) => (r.id === roleId ? { ...r, permissions: nextPermissions } : r)));
    }
  };

  const handleCreateRole = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newRoleName.trim()) {
      notify('Give the new role a name first.');
      return;
    }
    const id = buildRoleId();
    const cloneSource = selectedRole;
    const newRole: LocalRole = {
      id,
      name: newRoleName.trim(),
      description: newRoleDescription.trim(),
      isBuiltIn: false,
      permissions: cloneSource ? JSON.parse(JSON.stringify(cloneSource.permissions)) : emptyPermissions(),
    };
    setCustomRoles((prev) => [...prev, newRole]);
    setSelectedRoleId(id);
    setNewRoleName('');
    setNewRoleDescription('');
    notify(`Created role "${newRole.name}"${cloneSource ? ` (cloned from ${cloneSource.name})` : ''}.`);
  };

  const handleDeleteRole = (role: LocalRole) => {
    if (role.isBuiltIn) {
      notify('Built-in roles can be edited but not deleted.');
      return;
    }
    setCustomRoles((prev) => prev.filter((r) => r.id !== role.id));
    if (selectedRoleId === role.id) setSelectedRoleId(BUILT_IN_ROLES[0].id);
    notify(`Deleted role "${role.name}".`);
  };

  // De-duplicate: a built-in role that's been overridden appears twice in `roles` (once from
  // BUILT_IN_ROLES, once from customRoles) — merge for display, override wins.
  const displayRoles = useMemo(() => {
    const overrideById = new Map(customRoles.filter((r) => r.isBuiltIn).map((r) => [r.id, r]));
    const builtIns = BUILT_IN_ROLES.map((role) => overrideById.get(role.id) || role);
    const custom = customRoles.filter((r) => !r.isBuiltIn);
    return [...builtIns, ...custom];
  }, [customRoles]);

  const effectiveSelectedRole = displayRoles.find((r) => r.id === selectedRoleId) || displayRoles[0];

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Roles &amp; Permissions</h2>
        <p className="mt-0.5 text-xs text-slate-500">Create custom roles with a hand-picked permission selection.</p>
      </div>

      <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <p>
          <span className="font-semibold">This doesn't control real access yet.</span> Roles and permissions created
          or edited here are saved locally to this browser only. The actual gates that decide what a signed-in user
          can see (in <code>services/admin/adminRoles.ts</code>) are still hardcoded and are not read from anything
          built on this screen — that wiring is a separate follow-up, not done in this pass.
        </p>
      </div>

      {notification && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
          {notification}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[280px_1fr]">
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <ul className="divide-y divide-slate-100">
              {displayRoles.map((role) => (
                <li key={role.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`flex w-full items-start justify-between gap-2 px-3 py-2.5 text-left text-xs transition ${
                      selectedRoleId === role.id ? 'bg-[#3B82F6]/10' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span>
                      <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                        {role.isBuiltIn && <Lock className="h-3 w-3 text-slate-400" />}
                        {role.name}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-slate-400">{role.isBuiltIn ? 'Built-in' : 'Custom'}</span>
                    </span>
                    {!role.isBuiltIn && (
                      <Trash2
                        className="h-3.5 w-3.5 flex-shrink-0 text-slate-300 hover:text-rose-600"
                        onClick={(event) => { event.stopPropagation(); handleDeleteRole(role); }}
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <form onSubmit={handleCreateRole} className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
              <Plus className="h-3.5 w-3.5" /> New role
            </p>
            <input
              value={newRoleName}
              onChange={(event) => setNewRoleName(event.target.value)}
              placeholder="Role name"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
            />
            <input
              value={newRoleDescription}
              onChange={(event) => setNewRoleDescription(event.target.value)}
              placeholder="Description (optional)"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
            />
            <p className="flex items-center gap-1 text-[10px] text-slate-400">
              <Copy className="h-3 w-3" /> Clones permissions from "{effectiveSelectedRole?.name}"
            </p>
            <button
              type="submit"
              className="w-full rounded-lg bg-[#1E3A8A] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#3B82F6]"
            >
              Create role
            </button>
          </form>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          {effectiveSelectedRole && (
            <>
              <div className="border-b border-slate-100 p-3">
                <h3 className="text-sm font-bold text-slate-900">{effectiveSelectedRole.name}</h3>
                {effectiveSelectedRole.description && (
                  <p className="mt-0.5 text-[11px] text-slate-500">{effectiveSelectedRole.description}</p>
                )}
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Nav group</th>
                    {PERMISSION_COLUMNS.map((col) => (
                      <th key={col.key} className="px-3 py-2 text-center font-semibold">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {NAV_GROUPS.map((group) => (
                    <tr key={group}>
                      <td className="px-3 py-2 font-medium text-slate-700">{group}</td>
                      {PERMISSION_COLUMNS.map((col) => (
                        <td key={col.key} className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={effectiveSelectedRole.permissions[group]?.[col.key] || false}
                            onChange={(event) => updateRolePermission(effectiveSelectedRole.id, group, col.key, event.target.checked)}
                            className="h-3.5 w-3.5 accent-[#1E3A8A]"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
