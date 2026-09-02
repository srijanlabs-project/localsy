import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Trash2, UserPlus } from 'lucide-react';
import type { Locality, UserSession } from '../../types';

type AdminUserDirectoryPageProps = {
  localities: Locality[];
  userSession?: UserSession;
};

// Routed home for admin-backend-ux-spec.md Section 5.28 "Identity & Access: User Directory" —
// Section 9 build step 6. NET NEW, no legacy tab to port, and no real backend to port it from:
// this app has no `users` table anywhere in DATABASE_SCHEMA.md and no accounts API — `UserSession`
// (types.ts) is a single current-session shape, not a directory of every internal user.
//
// Per the user's standing instruction ("local-state UI, clearly marked"): this page is a real,
// interactive directory UI (invite, edit role/locality scope, suspend/reactivate, remove),
// persisted to localStorage the same way the Role Builder page persists custom roles, so entries
// survive a refresh within this browser. It is honestly NOT a real accounts system — inviting
// someone here does not create a login anywhere, does not send an email, and does not grant that
// person any actual access. The banner below says this plainly rather than only in this comment.
const ROLE_OPTIONS = ['admin', 'moderator', 'operator', 'growth_operator'] as const;

type LocalDirectoryUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  localityScope: 'all' | string;
  status: 'active' | 'suspended';
  lastLoginAt: string | null;
  invitedAt: string;
};

const STORAGE_KEY = 'localsy_admin_user_directory_v1';

const loadStoredUsers = (seedFromSession: () => LocalDirectoryUser[]): LocalDirectoryUser[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedFromSession();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LocalDirectoryUser[]) : seedFromSession();
  } catch {
    return seedFromSession();
  }
};

let userIdCounter = 0;
const buildUserId = () => {
  userIdCounter += 1;
  return `local_user_${userIdCounter}`;
};

export default function AdminUserDirectoryPage({ localities, userSession }: AdminUserDirectoryPageProps) {
  const seedFromSession = (): LocalDirectoryUser[] => {
    if (!userSession?.userName) return [];
    return [{
      id: buildUserId(),
      name: userSession.userName,
      email: userSession.email || '—',
      role: (userSession.role as string) || 'admin',
      localityScope: 'all',
      status: 'active',
      lastLoginAt: new Date().toISOString(),
      invitedAt: new Date().toISOString(),
    }];
  };

  const [users, setUsers] = useState<LocalDirectoryUser[]>(() => loadStoredUsers(seedFromSession));
  const [notification, setNotification] = useState<string | null>(null);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>(ROLE_OPTIONS[0]);
  const [inviteScope, setInviteScope] = useState<'all' | string>('all');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    } catch {
      // Best-effort persistence only.
    }
  }, [users]);

  const notify = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const localityNameById = useMemo(() => {
    const map: Record<string, string> = {};
    localities.forEach((locality) => { map[locality.id] = locality.name; });
    return map;
  }, [localities]);

  const handleInvite = (event: React.FormEvent) => {
    event.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      notify('Name and email are both required.');
      return;
    }
    const newUser: LocalDirectoryUser = {
      id: buildUserId(),
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      localityScope: inviteScope,
      status: 'active',
      lastLoginAt: null,
      invitedAt: new Date().toISOString(),
    };
    setUsers((prev) => [newUser, ...prev]);
    setInviteName('');
    setInviteEmail('');
    notify(`Added "${newUser.name}" to the local directory. Remember: this doesn't grant them real access.`);
  };

  const updateUser = (id: string, patch: Partial<LocalDirectoryUser>) => {
    setUsers((prev) => prev.map((user) => (user.id === id ? { ...user, ...patch } : user)));
  };

  const removeUser = (user: LocalDirectoryUser) => {
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
    notify(`Removed "${user.name}" from the local directory.`);
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950">User Directory</h2>
        <p className="mt-0.5 text-xs text-slate-500">Manage individual accounts and assign each one a role.</p>
      </div>

      <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <p>
          <span className="font-semibold">There's no real accounts database behind this yet.</span> This app has no
          `users` table and no login/invite backend — everything below is saved locally to this browser only.
          Inviting someone here doesn't send an email, create a login, or change what they can actually access; role
          and locality-scope values shown are illustrative, not enforced anywhere.
        </p>
      </div>

      {notification && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
          {notification}
        </div>
      )}

      <form onSubmit={handleInvite} className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_1fr_140px_160px_auto]">
        <input
          value={inviteName}
          onChange={(event) => setInviteName(event.target.value)}
          placeholder="Name"
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
        />
        <input
          value={inviteEmail}
          onChange={(event) => setInviteEmail(event.target.value)}
          placeholder="Email"
          type="email"
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
        />
        <select
          value={inviteRole}
          onChange={(event) => setInviteRole(event.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs capitalize focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
        >
          {ROLE_OPTIONS.map((role) => (
            <option key={role} value={role}>{role.replace('_', ' ')}</option>
          ))}
        </select>
        <select
          value={inviteScope}
          onChange={(event) => setInviteScope(event.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]"
        >
          <option value="all">All localities</option>
          {localities.map((locality) => (
            <option key={locality.id} value={locality.id}>{locality.name}</option>
          ))}
        </select>
        <button
          type="submit"
          className="flex items-center justify-center gap-1.5 rounded-lg bg-[#1E3A8A] px-3 py-2 text-xs font-semibold text-white hover:bg-[#3B82F6]"
        >
          <UserPlus className="h-3.5 w-3.5" /> Invite
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {users.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No local directory entries yet — invite one above.</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Name</th>
                <th className="px-3 py-2 font-semibold">Email</th>
                <th className="px-3 py-2 font-semibold">Role</th>
                <th className="px-3 py-2 font-semibold">Locality scope</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Last login</th>
                <th className="px-3 py-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <React.Fragment key={user.id}>
                  <tr className="align-top">
                    <td className="px-3 py-2 font-semibold text-slate-800">{user.name}</td>
                    <td className="px-3 py-2 text-slate-600">{user.email}</td>
                    <td className="px-3 py-2">
                      <select
                        value={user.role}
                        onChange={(event) => updateUser(user.id, { role: event.target.value })}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] capitalize focus:outline-none"
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>{role.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={user.localityScope}
                        onChange={(event) => updateUser(user.id, { localityScope: event.target.value })}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] focus:outline-none"
                      >
                        <option value="all">All localities</option>
                        {localities.map((locality) => (
                          <option key={locality.id} value={locality.id}>{locality.name}</option>
                        ))}
                      </select>
                      {user.localityScope !== 'all' && !localityNameById[user.localityScope] && (
                        <div className="mt-0.5 text-[10px] text-slate-400">Unknown locality</div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => updateUser(user.id, { status: user.status === 'active' ? 'suspended' : 'active' })}
                        className={`rounded-lg border px-2 py-1 text-[10px] font-semibold capitalize ${
                          user.status === 'active'
                            ? 'border-emerald-100 bg-emerald-50 text-emerald-800'
                            : 'border-rose-100 bg-rose-50 text-rose-700'
                        }`}
                      >
                        {user.status}
                      </button>
                    </td>
                    <td className="px-3 py-2 font-mono text-[10px] text-slate-500">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button type="button" onClick={() => removeUser(user)} title="Remove">
                        <Trash2 className="ml-auto h-3.5 w-3.5 text-slate-300 hover:text-rose-600" />
                      </button>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
