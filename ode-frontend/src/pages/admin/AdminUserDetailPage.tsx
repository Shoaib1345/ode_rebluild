import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import AdminLayout from './AdminLayout'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Role { id: number; role_name: string; access_level: number }

interface UserDetail {
  id: number
  role_id: number
  role: Role | null
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
  status: number
  referral_string: string | null
  is_on_payroll: boolean
  is_agency: boolean
  commission_pct: string
  commission_flat: string
  w9_verified: boolean
  created_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(str: string | null) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function Toggle({ label, checked, onChange, disabled = false }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${checked ? 'bg-[#1CA0DF]' : 'bg-gray-300'}`}
      >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`}/>
      </button>
    </div>
  )
}

// ─── Create User Form ─────────────────────────────────────────────────────────

function CreateUserForm({ roles }: { roles: Role[] }) {
  const navigate    = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    role_id: '', first_name: '', last_name: '', email: '',
    phone: '', commission_pct: '0', commission_flat: '0',
  })
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.post<UserDetail & { temp_password: string }>('/admin/users', body).then(r => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setTempPassword(data.temp_password)
      toast.success('User created.')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Failed to create user.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    create.mutate({
      ...form,
      role_id:          parseInt(form.role_id),
      commission_pct:   parseFloat(form.commission_pct),
      commission_flat:  parseFloat(form.commission_flat),
    })
  }

  if (tempPassword) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-8 max-w-lg mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
        </div>
        <h2 className="text-lg font-bold text-gray-800">User Created</h2>
        <p className="text-sm text-gray-500">Share this temporary password with the user. It won't be shown again.</p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-mono text-lg text-gray-800 tracking-widest">
          {tempPassword}
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigator.clipboard.writeText(tempPassword).then(() => toast.success('Copied!'))}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Copy Password
          </button>
          <button
            onClick={() => navigate('/admin/users')}
            className="px-4 py-2 bg-[#1CA0DF] hover:bg-[#1786BB] text-white text-sm rounded-lg transition-colors"
          >
            Back to Users
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-6 py-6 max-w-xl">
      <h2 className="text-base font-semibold text-gray-800 mb-5">Create New User</h2>
      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="block text-xs text-gray-500 mb-1">Role *</label>
          <select
            required
            value={form.role_id}
            onChange={(e) => setForm({ ...form, role_id: e.target.value })}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
          >
            <option value="">Select role…</option>
            {roles.filter(r => r.access_level !== 0).map(r => (
              <option key={r.id} value={r.id}>{r.role_name} (level {r.access_level})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">First Name *</label>
            <input required type="text" value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Last Name *</label>
            <input required type="text" value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Email *</label>
          <input required type="email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Phone</label>
          <input type="text" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Commission %</label>
            <input type="number" min="0" max="100" step="0.01" value={form.commission_pct}
              onChange={(e) => setForm({ ...form, commission_pct: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Commission Flat ($)</label>
            <input type="number" min="0" step="0.01" value={form.commission_flat}
              onChange={(e) => setForm({ ...form, commission_flat: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/admin/users')}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={create.isPending}
            className="px-4 py-2 bg-[#1CA0DF] hover:bg-[#1786BB] text-white text-sm rounded-lg transition-colors disabled:opacity-50"
          >
            {create.isPending ? 'Creating…' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Edit User Panel ──────────────────────────────────────────────────────────

function EditUserPanel({ user, roles, onUpdated }: {
  user: UserDetail; roles: Role[]; onUpdated: (u: UserDetail) => void
}) {
  const queryClient = useQueryClient()
  const navigate    = useNavigate()
  const [form, setForm] = useState({
    first_name:      user.first_name ?? '',
    last_name:       user.last_name  ?? '',
    email:           user.email,
    phone:           user.phone ?? '',
    role_id:         String(user.role_id),
    commission_pct:  user.commission_pct,
    commission_flat: user.commission_flat,
  })

  const patch = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.patch<UserDetail>(`/admin/users/${user.id}`, body).then(r => r.data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.setQueryData(['admin-user', String(user.id)], updated)
      onUpdated(updated)
      toast.success('User updated.')
    },
    onError: () => toast.error('Update failed.'),
  })

  const toggle = (field: keyof Pick<UserDetail, 'status' | 'is_on_payroll' | 'is_agency'>) =>
    (val: boolean) => patch.mutate({ [field]: field === 'status' ? (val ? 1 : 0) : val })

  const deleteUser = useMutation({
    mutationFn: () => api.delete(`/admin/users/${user.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('User deleted.')
      navigate('/admin/users')
    },
    onError: () => toast.error('Delete failed.'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    patch.mutate({
      ...form,
      role_id:         parseInt(form.role_id),
      commission_pct:  parseFloat(form.commission_pct),
      commission_flat: parseFloat(form.commission_flat),
    })
  }

  return (
    <div className="space-y-5">
      {/* Info card */}
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">Account Info</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="w-36 text-gray-400 shrink-0">User ID</dt>
            <dd className="text-gray-700 font-mono">#{user.id}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-36 text-gray-400 shrink-0">Joined</dt>
            <dd className="text-gray-700">{fmtDate(user.created_at)}</dd>
          </div>
          {user.referral_string && (
            <div className="flex gap-2">
              <dt className="w-36 text-gray-400 shrink-0">Referral Code</dt>
              <dd className="text-gray-700 font-mono">{user.referral_string}</dd>
            </div>
          )}
          <div className="flex gap-2">
            <dt className="w-36 text-gray-400 shrink-0">W9 Status</dt>
            <dd>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.w9_verified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {user.w9_verified ? 'Verified' : 'Not verified'}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      {/* Edit form */}
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">Edit Details</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">First Name</label>
              <input type="text" value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Last Name</label>
              <input type="text" value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Email</label>
            <input type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Phone</label>
            <input type="text" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Role</label>
            <select value={form.role_id}
              onChange={(e) => setForm({ ...form, role_id: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
            >
              {roles.filter(r => r.access_level !== 0).map(r => (
                <option key={r.id} value={r.id}>{r.role_name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Commission %</label>
              <input type="number" min="0" max="100" step="0.01" value={form.commission_pct}
                onChange={(e) => setForm({ ...form, commission_pct: e.target.value })}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Commission Flat ($)</label>
              <input type="number" min="0" step="0.01" value={form.commission_flat}
                onChange={(e) => setForm({ ...form, commission_flat: e.target.value })}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={patch.isPending}
            className="w-full py-2 bg-[#1CA0DF] hover:bg-[#1786BB] text-white text-sm rounded-lg transition-colors disabled:opacity-50"
          >
            {patch.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Toggle flags */}
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">Flags</h2>
        <Toggle label="Active"       checked={!!user.status}        onChange={toggle('status')}       disabled={patch.isPending}/>
        <Toggle label="On Payroll"   checked={user.is_on_payroll}   onChange={toggle('is_on_payroll')} disabled={patch.isPending}/>
        <Toggle label="Is Agency"    checked={user.is_agency}       onChange={toggle('is_agency')}    disabled={patch.isPending}/>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-xl border border-red-100 px-6 py-5">
        <h2 className="text-sm font-semibold text-red-600 mb-3">Danger Zone</h2>
        <p className="text-xs text-gray-500 mb-3">Soft-deletes the user. Their commissions and lead data are preserved.</p>
        <button
          disabled={deleteUser.isPending}
          onClick={() => {
            if (confirm(`Delete ${user.first_name} ${user.last_name}? This cannot be undone easily.`)) {
              deleteUser.mutate()
            }
          }}
          className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-sm rounded-lg transition-colors disabled:opacity-50"
        >
          {deleteUser.isPending ? 'Deleting…' : 'Delete User'}
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminUserDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew    = id === 'new'

  const { data: roles = [] } = useQuery({
    queryKey: ['admin-user-roles'],
    queryFn:  () => api.get<Role[]>('/admin/users/roles').then(r => r.data),
    staleTime: 300_000,
  })

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['admin-user', id],
    queryFn:  () => api.get<UserDetail>(`/admin/users/${id}`).then(r => r.data),
    enabled:  !isNew && !!id,
  })

  const [localUser, setLocalUser] = useState<UserDetail | null>(null)
  const displayUser = localUser ?? user

  if (isNew) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <button onClick={() => navigate('/admin/users')} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
            ← Back to users
          </button>
          <h1 className="text-xl font-bold text-gray-900">New User</h1>
          <CreateUserForm roles={roles}/>
        </div>
      </AdminLayout>
    )
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 px-6 py-5 animate-pulse">
              <div className="h-4 w-32 bg-gray-100 rounded mb-4"/>
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((__, j) => <div key={j} className="h-3 bg-gray-100 rounded w-3/4"/>)}
              </div>
            </div>
          ))}
        </div>
      </AdminLayout>
    )
  }

  if (isError || !displayUser) {
    return (
      <AdminLayout>
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-12 text-center">
          <p className="text-sm text-gray-500 mb-3">User not found.</p>
          <button onClick={() => navigate('/admin/users')} className="text-sm text-[#1CA0DF] hover:underline">
            ← Back to users
          </button>
        </div>
      </AdminLayout>
    )
  }

  const fullName = [displayUser.first_name, displayUser.last_name].filter(Boolean).join(' ') || 'Unnamed'

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <button onClick={() => navigate('/admin/users')} className="text-xs text-gray-400 hover:text-gray-600 mb-2 flex items-center gap-1">
            ← Back to users
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">{fullName}</h1>
            {displayUser.role && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full font-medium">
                {displayUser.role.role_name}
              </span>
            )}
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${displayUser.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
              {displayUser.status ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{displayUser.email}</p>
        </div>

        <EditUserPanel
          user={displayUser}
          roles={roles}
          onUpdated={(u) => setLocalUser(u)}
        />
      </div>
    </AdminLayout>
  )
}
