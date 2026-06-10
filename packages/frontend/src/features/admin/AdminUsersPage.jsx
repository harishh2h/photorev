import { useCallback, useEffect, useReducer, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import { useAuth } from '@/features/auth/index.js'
import { AppButton, AppInput } from '@/components/ui/index.js'
import { listUsers, createUser, updateUser, deactivateUser } from '@/services/adminService.js'
import { formatBytes } from '@/utils/formatBytes.js'
import { formatQuotaGigabytes, parseQuotaGigabytesInput } from '@/utils/storageQuota.js'

const ROLE_LABELS = { admin: 'Admin', user: 'User' }

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return '—'
  }
}

function RoleBadge({ role }) {
  const isAdmin = role === 'admin'
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-0.5 font-base text-xs font-medium ${
        isAdmin ? 'bg-panel text-accent' : 'bg-base-200 text-muted'
      }`}
    >
      {ROLE_LABELS[role] ?? role}
    </span>
  )
}

RoleBadge.propTypes = { role: PropTypes.string.isRequired }

function StatusDot({ isActive }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${isActive ? 'bg-accent' : 'bg-base-300'}`}
      title={isActive ? 'Active' : 'Deactivated'}
      aria-label={isActive ? 'Active' : 'Deactivated'}
    />
  )
}

StatusDot.propTypes = { isActive: PropTypes.bool.isRequired }

const EMPTY_FORM = { name: '', email: '', password: '', role: 'user', quotaGigabytes: '' }

function UserFormModal({ initial, onSubmit, onClose, isSubmitting, error, isEdit }) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM)

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
  }

  const labelClass = 'font-base text-sm font-semibold text-muted'
  const fieldWrap = 'flex flex-col gap-2'

  return (
    <div
      className="fixed inset-0 z-modal flex items-end justify-center bg-black/40 md:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Edit user' : 'Add user'}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full rounded-[2rem_2rem_0_0] border-[1.5px] border-base-300 bg-base-100 p-6 shadow-modal md:w-[480px] md:rounded-card">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="m-0 font-base text-xl font-semibold text-base-content">
            {isEdit ? 'Edit user' : 'Add user'}
          </h2>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full border-0 bg-transparent text-muted transition-[background-color] duration-150 ease-out hover:bg-base-200 focus-visible:outline-none focus-visible:shadow-focus"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <div className={fieldWrap}>
            <label htmlFor="um-name" className={labelClass}>Full name</label>
            <AppInput id="um-name" type="text" value={form.name} onChange={set('name')} placeholder="Full name" required disabled={isSubmitting} className="min-h-11" />
          </div>
          {!isEdit && (
            <div className={fieldWrap}>
              <label htmlFor="um-email" className={labelClass}>Email</label>
              <AppInput id="um-email" type="email" value={form.email} onChange={set('email')} placeholder="user@example.com" required disabled={isSubmitting} className="min-h-11" />
            </div>
          )}
          <div className={fieldWrap}>
            <label htmlFor="um-password" className={labelClass}>
              {isEdit ? 'New password (leave blank to keep)' : 'Password'}
            </label>
            <AppInput id="um-password" type="password" value={form.password} onChange={set('password')} placeholder="••••••••" autoComplete="new-password" required={!isEdit} disabled={isSubmitting} className="min-h-11" />
          </div>
          <div className={fieldWrap}>
            <label htmlFor="um-role" className={labelClass}>Role</label>
            <select
              id="um-role"
              value={form.role}
              onChange={set('role')}
              disabled={isSubmitting}
              className="input min-h-11 w-full cursor-pointer appearance-none rounded-pill border-[1.5px] border-base-300 bg-base-100 px-5 font-base text-base text-base-content focus:border-accent focus:outline-none focus:shadow-focus"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className={fieldWrap}>
            <label htmlFor="um-quota" className={labelClass}>Storage cap (GiB)</label>
            <AppInput
              id="um-quota"
              type="number"
              min="0"
              step="0.1"
              value={form.quotaGigabytes}
              onChange={set('quotaGigabytes')}
              placeholder="Unlimited"
              disabled={isSubmitting}
              className="min-h-11"
            />
            <p className="m-0 font-base text-xs text-muted">Leave empty for unlimited. 0 blocks uploads.</p>
          </div>

          {error ? (
            <p className="m-0 font-base text-sm font-medium text-error" role="alert">{error}</p>
          ) : null}

          <div className="mt-1 flex gap-3">
            <AppButton type="button" variant="ghost" className="flex-1" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </AppButton>
            <AppButton type="submit" variant="primary" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="loading loading-spinner loading-sm text-primary-content" aria-hidden />
              ) : isEdit ? 'Save changes' : 'Create user'}
            </AppButton>
          </div>
        </form>
      </div>
    </div>
  )
}

UserFormModal.propTypes = {
  initial: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  error: PropTypes.string,
  isEdit: PropTypes.bool,
}

const initialState = { users: [], isLoading: true, error: null }

function reducer(state, action) {
  switch (action.type) {
    case 'LOADED': return { ...state, users: action.users, isLoading: false, error: null }
    case 'ERROR': return { ...state, isLoading: false, error: action.error }
    case 'UPDATE_USER': return { ...state, users: state.users.map((u) => u.id === action.user.id ? action.user : u) }
    case 'APPEND_USER': return { ...state, users: [action.user, ...state.users] }
    default: return state
  }
}

export default function AdminUsersPage() {
  const { token, user: currentUser } = useAuth()
  const navigate = useNavigate()
  const [state, dispatch] = useReducer(reducer, initialState)
  const [modal, setModal] = useState(null) // null | { mode: 'create' } | { mode: 'edit', user }
  const [modalSubmitting, setModalSubmitting] = useState(false)
  const [modalError, setModalError] = useState('')
  const [deactivatingId, setDeactivatingId] = useState(null)

  const load = useCallback(async () => {
    const result = await listUsers(token)
    if (result.success) {
      dispatch({ type: 'LOADED', users: result.data })
    } else {
      dispatch({ type: 'ERROR', error: result.message })
    }
  }, [token])

  useEffect(() => { load() }, [load])

  const handleCreate = async (form) => {
    setModalSubmitting(true)
    setModalError('')
    try {
      const quotaBytes = parseQuotaGigabytesInput(form.quotaGigabytes)
      if (quotaBytes === 'invalid') {
        setModalError('Enter a valid storage cap (GiB)')
        return
      }
      const result = await createUser(token, {
        email: form.email,
        password: form.password,
        name: form.name,
        role: form.role,
        quotaBytes,
      })
      if (result.success) {
        dispatch({ type: 'APPEND_USER', user: result.data })
        setModal(null)
      } else {
        setModalError(result.message || 'Failed to create user')
      }
    } finally {
      setModalSubmitting(false)
    }
  }

  const handleEdit = async (form) => {
    setModalSubmitting(true)
    setModalError('')
    try {
      const payload = {}
      if (form.name) payload.name = form.name
      if (form.password) payload.password = form.password
      if (form.role) payload.role = form.role
      const quotaBytes = parseQuotaGigabytesInput(form.quotaGigabytes)
      if (quotaBytes === 'invalid') {
        setModalError('Enter a valid storage cap (GiB)')
        return
      }
      payload.quotaBytes = quotaBytes
      const result = await updateUser(token, modal.user.id, payload)
      if (result.success) {
        dispatch({ type: 'UPDATE_USER', user: result.data })
        setModal(null)
      } else {
        setModalError(result.message || 'Failed to update user')
      }
    } finally {
      setModalSubmitting(false)
    }
  }

  const handleDeactivate = async (userId) => {
    setDeactivatingId(userId)
    try {
      const result = await deactivateUser(token, userId)
      if (result.success) {
        dispatch({ type: 'UPDATE_USER', user: { ...state.users.find((u) => u.id === userId), is_active: false } })
      }
    } finally {
      setDeactivatingId(null)
    }
  }

  const openCreate = () => { setModalError(''); setModal({ mode: 'create' }) }
  const openEdit = (u) => { setModalError(''); setModal({ mode: 'edit', user: u }) }

  return (
    <div className="min-h-screen bg-bg px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button
            type="button"
            className="flex h-9 w-9 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border-[1.5px] border-base-300 bg-base-100 text-muted transition-[box-shadow,background-color] duration-150 ease-out hover:bg-base-200 focus-visible:outline-none focus-visible:shadow-focus"
            onClick={() => navigate('/')}
            aria-label="Back to dashboard"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="m-0 font-base text-2xl font-bold text-base-content">User Management</h1>
            <p className="m-0 mt-1 font-base text-sm text-muted">Manage accounts and roles</p>
          </div>
          <AppButton variant="primary" className="gap-2" onClick={openCreate}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add user
          </AppButton>
        </div>

        {/* Floating stat card */}
        <div className="mb-6 inline-flex items-center gap-3 rounded-floating border-[1.5px] border-base-300 bg-base-100 px-4 py-3 shadow-floating">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-panel">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-accent" aria-hidden>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          <div>
            <p className="m-0 font-base text-lg font-semibold text-base-content leading-none">
              {state.isLoading ? '—' : state.users.length}
            </p>
            <p className="m-0 font-base text-xs text-muted">Total users</p>
          </div>
        </div>

        {/* Content */}
        {state.isLoading ? (
          <div className="flex justify-center py-20">
            <span className="loading loading-spinner loading-lg text-accent" />
          </div>
        ) : state.error ? (
          <div className="rounded-card border-[1.5px] border-base-300 bg-base-100 p-8 text-center">
            <p className="m-0 font-base text-sm text-error">{state.error}</p>
            <button type="button" className="mt-4 font-base text-sm text-accent underline" onClick={load}>
              Try again
            </button>
          </div>
        ) : (
          <div className="rounded-card border-[1.5px] border-base-300 bg-base-100 shadow-card overflow-hidden">
            {state.users.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-panel text-accent">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                </span>
                <p className="m-0 font-base text-sm text-muted">No users yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-base-200">
                {/* Table header — desktop only */}
                <div className="hidden grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-6 py-3 md:grid">
                  <span className="font-base text-xs font-semibold uppercase tracking-wide text-muted">User</span>
                  <span className="font-base text-xs font-semibold uppercase tracking-wide text-muted">Storage</span>
                  <span className="font-base text-xs font-semibold uppercase tracking-wide text-muted">Role</span>
                  <span className="font-base text-xs font-semibold uppercase tracking-wide text-muted">Joined</span>
                  <span className="font-base text-xs font-semibold uppercase tracking-wide text-muted">Actions</span>
                </div>

                {state.users.map((u) => {
                  const isSelf = u.id === currentUser?.id
                  const isDeactivating = deactivatingId === u.id

                  return (
                    <div
                      key={u.id}
                      className="flex flex-col gap-3 px-6 py-4 transition-[background-color] duration-150 ease-out hover:bg-base-50 md:grid md:grid-cols-[1fr_auto_auto_auto_auto] md:items-center md:gap-4"
                    >
                      {/* User info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-panel font-base text-sm font-semibold text-accent">
                          {(u.name.charAt(0) || '?').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="m-0 truncate font-base text-sm font-semibold text-base-content">
                            {u.name}
                            {isSelf && (
                              <span className="ml-2 font-base text-xs text-muted">(you)</span>
                            )}
                          </p>
                          <p className="m-0 truncate font-base text-xs text-muted">{u.email}</p>
                        </div>
                        {!u.is_active && (
                          <span className="ml-auto shrink-0 rounded-full bg-base-200 px-2 py-0.5 font-base text-xs text-muted md:hidden">
                            Deactivated
                          </span>
                        )}
                      </div>

                      <span className="font-base text-xs text-muted md:text-sm">
                        {u.quota_bytes == null
                          ? `${formatBytes(u.quota_usage_bytes ?? 0)} / ∞`
                          : `${formatBytes(u.quota_usage_bytes ?? 0)} / ${formatBytes(u.quota_bytes)}`}
                      </span>

                      {/* Role */}
                      <div className="flex items-center gap-2">
                        <StatusDot isActive={u.is_active} />
                        <RoleBadge role={u.role} />
                      </div>

                      {/* Date */}
                      <span className="font-base text-xs text-muted">{formatDate(u.created_at)}</span>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded-pill border-[1.5px] border-base-300 bg-transparent px-3 py-1.5 font-base text-xs font-medium text-muted transition-[background-color,border-color] duration-150 ease-out hover:border-accent/40 hover:bg-panel hover:text-accent focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-40"
                          onClick={() => openEdit(u)}
                          disabled={!u.is_active}
                        >
                          Edit
                        </button>
                        {u.is_active && !isSelf && (
                          <button
                            type="button"
                            className="rounded-pill border-[1.5px] border-transparent bg-transparent px-3 py-1.5 font-base text-xs font-medium text-muted transition-[background-color,color] duration-150 ease-out hover:bg-error/10 hover:text-error focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-40"
                            onClick={() => handleDeactivate(u.id)}
                            disabled={isDeactivating}
                          >
                            {isDeactivating ? (
                              <span className="loading loading-spinner loading-xs" aria-hidden />
                            ) : 'Deactivate'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.mode === 'create' && (
        <UserFormModal
          onSubmit={handleCreate}
          onClose={() => setModal(null)}
          isSubmitting={modalSubmitting}
          error={modalError}
          isEdit={false}
        />
      )}
      {modal?.mode === 'edit' && (
        <UserFormModal
          initial={{
            name: modal.user.name,
            email: modal.user.email,
            password: '',
            role: modal.user.role,
            quotaGigabytes: formatQuotaGigabytes(modal.user.quota_bytes),
          }}
          onSubmit={handleEdit}
          onClose={() => setModal(null)}
          isSubmitting={modalSubmitting}
          error={modalError}
          isEdit
        />
      )}
    </div>
  )
}
