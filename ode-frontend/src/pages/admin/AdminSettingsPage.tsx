import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../lib/axios'
import AdminLayout from './AdminLayout'
import { useAuthStore } from '../../stores/authStore'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<number, string> = {
  0: 'Super Admin', 1: 'Admin', 2: 'Staff / CSR',
  5: 'Customer', 6: 'Affiliate', 7: 'Agent', 8: 'Planner / Venue',
}

type ApiError = { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } } }

function fieldErrors(err: unknown): Record<string, string> {
  const e = err as ApiError
  const out: Record<string, string> = {}
  const errs = e.response?.data?.errors ?? {}
  for (const [k, v] of Object.entries(errs)) out[k] = v[0]
  return out
}

const inputCls = (hasError: boolean) =>
  `w-full text-sm border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF] transition ${
    hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'
  }`

// ─── Eye toggle ────────────────────────────────────────────────────────────────

function PasswordField({
  label, value, onChange, error, autoComplete,
}: {
  label: string; value: string; onChange: (v: string) => void; error?: string; autoComplete?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls(!!error) + ' pr-11'}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-700"
        >
          {show ? (
            <svg className="w-4.5 h-4.5 w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65" />
            </svg>
          ) : (
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

// ─── Profile tab ────────────────────────────────────────────────────────────────

function ProfileTab() {
  const user    = useAuthStore((s) => s.user)
  const token   = useAuthStore((s) => s.token)
  const setAuth = useAuthStore((s) => s.setAuth)

  const [form, setForm] = useState({
    first_name: user?.first_name ?? '',
    last_name:  user?.last_name ?? '',
    email:      user?.email ?? '',
    phone:      user?.phone ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const save = useMutation({
    mutationFn: () => api.patch('/account', form).then((r) => r.data),
    onSuccess: () => {
      setErrors({})
      // Merge edited fields into the stored user (keeps the existing role intact).
      if (user && token) {
        setAuth({ ...user, ...form }, token)
      }
      toast.success('Profile updated.')
    },
    onError: (err) => {
      setErrors(fieldErrors(err))
      toast.error((err as ApiError).response?.data?.message ?? 'Could not update profile.')
    },
  })

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); save.mutate() }}
      className="bg-white rounded-xl border border-gray-200 px-6 py-6 max-w-2xl space-y-5"
    >
      <div>
        <h2 className="text-base font-semibold text-gray-800">Profile</h2>
        <p className="text-xs text-gray-400">Update your personal details.</p>
      </div>

      {/* Read-only account info */}
      <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 border border-gray-100 px-4 py-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-400">Role</p>
          <p className="text-sm font-medium text-gray-700">{user ? ROLE_LABEL[user.role.access_level] ?? 'User' : '—'}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-400">Member since</p>
          <p className="text-sm font-medium text-gray-700">
            {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">First Name</label>
          <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className={inputCls(!!errors.first_name)} />
          {errors.first_name && <p className="mt-1 text-xs text-red-600">{errors.first_name}</p>}
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Last Name</label>
          <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className={inputCls(!!errors.last_name)} />
          {errors.last_name && <p className="mt-1 text-xs text-red-600">{errors.last_name}</p>}
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Email</label>
        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls(!!errors.email)} />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Phone</label>
        <input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls(!!errors.phone)} />
        {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
      </div>

      <div className="pt-1">
        <button
          type="submit"
          disabled={save.isPending}
          className="px-5 py-2.5 bg-[#1CA0DF] hover:bg-[#1786BB] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          {save.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

// ─── Security tab ────────────────────────────────────────────────────────────────

function SecurityTab() {
  const [form, setForm] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const save = useMutation({
    mutationFn: () => api.post('/account/password', form).then((r) => r.data),
    onSuccess: () => {
      setErrors({})
      setForm({ current_password: '', password: '', password_confirmation: '' })
      toast.success('Password updated successfully.')
    },
    onError: (err) => {
      setErrors(fieldErrors(err))
      toast.error((err as ApiError).response?.data?.message ?? 'Could not update password.')
    },
  })

  const mismatch = form.password.length > 0 && form.password_confirmation.length > 0 && form.password !== form.password_confirmation

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (!mismatch) save.mutate() }}
      className="bg-white rounded-xl border border-gray-200 px-6 py-6 max-w-2xl space-y-5"
    >
      <div>
        <h2 className="text-base font-semibold text-gray-800">Change Password</h2>
        <p className="text-xs text-gray-400">Use at least 8 characters. Other devices will be signed out.</p>
      </div>

      <PasswordField
        label="Current Password"
        value={form.current_password}
        onChange={(v) => setForm({ ...form, current_password: v })}
        error={errors.current_password}
        autoComplete="current-password"
      />
      <PasswordField
        label="New Password"
        value={form.password}
        onChange={(v) => setForm({ ...form, password: v })}
        error={errors.password}
        autoComplete="new-password"
      />
      <PasswordField
        label="Confirm New Password"
        value={form.password_confirmation}
        onChange={(v) => setForm({ ...form, password_confirmation: v })}
        error={mismatch ? 'Passwords do not match.' : undefined}
        autoComplete="new-password"
      />

      <div className="pt-1">
        <button
          type="submit"
          disabled={save.isPending || mismatch || !form.current_password || !form.password}
          className="px-5 py-2.5 bg-[#1CA0DF] hover:bg-[#1786BB] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          {save.isPending ? 'Updating…' : 'Update Password'}
        </button>
      </div>
    </form>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'profile',  label: 'Profile' },
  { key: 'security', label: 'Security' },
] as const

export default function AdminSettingsPage() {
  const [params, setParams] = useSearchParams()
  const active = params.get('tab') === 'security' ? 'security' : 'profile'

  return (
    <AdminLayout>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-800">Account Settings</h1>
        <p className="text-sm text-gray-500">Manage your profile and security.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setParams({ tab: t.key })}
            className={`px-4 py-2.5 text-sm font-medium -mb-px border-b-2 transition-colors ${
              active === t.key
                ? 'border-[#1CA0DF] text-[#1CA0DF]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === 'profile' ? <ProfileTab /> : <SecurityTab />}
    </AdminLayout>
  )
}
