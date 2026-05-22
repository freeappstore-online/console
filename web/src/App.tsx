import { useState, useEffect, useCallback } from 'react'
import { initApp } from '@freeappstore/sdk'
import type { User } from '@freeappstore/sdk'
import { useAuth, useTheme } from '@freeappstore/sdk/hooks'
import { Avatar, ThemeToggle } from '@freeappstore/sdk/ui'

const fas = initApp({ appId: 'console' })

type View = 'dashboard' | 'app-detail' | 'settings' | 'ui-library'

interface AppEntry {
  id: string
  name: string
  createdAt: string
  category?: string | null
  description?: string | null
}

const API_BASE = 'https://api.freeappstore.online/v1'

async function fetchApps(token: string | null): Promise<AppEntry[]> {
  if (!token) return []
  try {
    const res = await fetch(`${API_BASE}/apps`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return []
    const data = (await res.json()) as { apps: { id: string; name: string; created_at: number; category?: string | null; description?: string | null }[] }
    return (data.apps ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      createdAt: new Date(a.created_at).toISOString(),
      category: a.category,
      description: a.description,
    }))
  } catch {
    return []
  }
}

export default function App() {
  const { user, loading } = useAuth(fas)
  const [view, setView] = useState<View>('dashboard')
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [apps, setApps] = useState<AppEntry[]>([])

  const reloadApps = useCallback(async () => {
    try { setApps(await fetchApps(fas.auth.token)) } catch {}
  }, [])

  useEffect(() => {
    if (user) reloadApps()
  }, [user, reloadApps])

  const openAppDetail = useCallback((id: string) => {
    setSelectedAppId(id)
    setView('app-detail')
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <p className="text-[var(--muted)]">Loading...</p>
      </div>
    )
  }

  if (!user) return <Landing />

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Header user={user} view={view} onNavigate={setView} />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {view === 'dashboard' && (
          <Dashboard user={user} apps={apps} onOpenApp={openAppDetail} />
        )}
        {view === 'app-detail' && selectedAppId && (
          <AppDetailView
            appId={selectedAppId}
            appName={apps.find((a) => a.id === selectedAppId)?.name ?? selectedAppId}
            onBack={() => setView('dashboard')}
          />
        )}
        {view === 'settings' && <Settings />}
        {view === 'ui-library' && <UILibraryView />}
      </main>
    </div>
  )
}

function Landing() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="display-font text-4xl font-bold text-[var(--ink)]">Creator Console</h1>
        <p className="mt-4 text-[var(--muted)] text-lg">
          Sign in with GitHub to manage your apps on FreeAppStore.
        </p>
        <button
          onClick={() => fas.auth.signIn()}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-90"
        >
          <GitHubIcon />
          Sign in with GitHub
        </button>
        <p className="mt-6 text-xs text-[var(--muted)]">
          Part of{' '}
          <a href="https://freeappstore.online" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--ink)]">
            FreeAppStore
          </a>
        </p>
      </div>
    </div>
  )
}

const TABS: { key: View; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'settings', label: 'Settings' },
  { key: 'ui-library', label: 'UI Library' },
]

function Header({ user, view, onNavigate }: { user: User; view: View; onNavigate: (v: View) => void }) {
  return (
    <header className="sticky top-0 z-30">
      <div className="border-b border-[var(--line)] bg-[var(--glass-strong)] backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 flex h-12 items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="https://freeappstore.online" className="text-sm font-bold text-[var(--accent)] no-underline hover:opacity-80">
              Free
            </a>
            <nav className="flex items-center gap-3 text-xs font-medium text-[var(--muted)]">
              <a href="https://freeappstore.online" className="hover:text-[var(--ink)] no-underline">Apps</a>
              <a href="https://freeappstore.online/docs" className="hover:text-[var(--ink)] no-underline">Docs</a>
              <a href="https://freeappstore.online/guidelines" className="hover:text-[var(--ink)] no-underline">Guidelines</a>
              <a href="https://create.freeappstore.online" className="hover:text-[var(--ink)] no-underline">VibeCode</a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user.avatarUrl && (
              <img src={user.avatarUrl} alt={user.login} className="h-6 w-6 rounded-full ring-1 ring-[var(--line-strong)]" />
            )}
            <span className="hidden sm:inline text-xs font-medium text-[var(--muted)]">{user.login}</span>
            <button
              onClick={() => fas.auth.signOut()}
              className="text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)] underline"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
      <div className="border-b border-[var(--line)] bg-[var(--glass)]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button
            onClick={() => onNavigate('dashboard')}
            className="display-font text-base font-bold text-[var(--ink)] tracking-tight py-2 mr-4"
          >
            Creator Console
          </button>
          <nav className="flex gap-0.5 -mb-px overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => onNavigate(tab.key)}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  (view === tab.key || (view === 'app-detail' && tab.key === 'dashboard'))
                    ? 'border-[var(--accent)] text-[var(--ink)]'
                    : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}

function Dashboard({ user, apps, onOpenApp }: { user: User; apps: AppEntry[]; onOpenApp: (id: string) => void }) {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--glass-strong)] p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-4">
          <Avatar user={user} size={56} />
          <div>
            <h2 className="display-font text-2xl font-bold text-[var(--ink)]">Welcome, {user.login}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Manage your apps on FreeAppStore</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard label="Total Apps" value={apps.length} />
        <StatCard label="Platform" value="Free" />
        <StatCard label="License" value="MIT" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="display-font text-xl font-bold text-[var(--ink)]">Your Apps</h3>
          <a
            href="https://create.freeappstore.online"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 no-underline"
          >
            + Create New App
          </a>
        </div>

        {apps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--line-strong)] p-12 text-center">
            <p className="text-[var(--muted)]">
              No apps yet. Create your first app with{' '}
              <a href="https://create.freeappstore.online" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] font-semibold underline">
                VibeCode
              </a>{' '}
              or the CLI.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {apps.map((a) => (
              <button
                key={a.id}
                onClick={() => onOpenApp(a.id)}
                className="text-left rounded-xl border border-[var(--line)] bg-[var(--glass)] p-4 hover:bg-[var(--glass-hover)] shadow-sm"
              >
                <span className="font-semibold text-[var(--ink)]">{a.name}</span>
                <p className="mt-1 text-xs text-[var(--muted)] font-mono">{a.id}.freeappstore.online</p>
                {a.category && <p className="mt-1 text-xs text-[var(--muted)]">{a.category}</p>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--glass-strong)] p-6">
        <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide mb-4">Quick Links</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          <QuickLink href="https://freeappstore.online/docs" label="SDK Docs" desc="Auth, KV, rooms, proxy" />
          <QuickLink href="https://freeappstore.online/docs/ui" label="UI Library" desc="Components & design tokens" />
          <QuickLink href="https://freeappstore.online/guidelines" label="Guidelines" desc="Quality & compliance rules" />
        </div>
      </div>
    </div>
  )
}

function AppDetailView({ appId, appName, onBack }: { appId: string; appName: string; onBack: () => void }) {
  const appUrl = `https://${appId}.freeappstore.online`
  const repoUrl = `https://github.com/freeappstore-online/${appId}`

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm text-[var(--accent)] font-medium hover:underline">&larr; Back to Dashboard</button>

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--glass-strong)] p-6">
        <h2 className="display-font text-2xl font-bold text-[var(--ink)]">{appName}</h2>
        <p className="mt-1 text-sm text-[var(--muted)] font-mono">{appId}.freeappstore.online</p>

        <div className="mt-4 flex gap-3 flex-wrap">
          <a href={appUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 no-underline">
            Open App
          </a>
          <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line-strong)] px-4 py-2 text-sm font-medium text-[var(--ink)] hover:bg-[var(--glass-hover)] no-underline">
            View Source
          </a>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <InfoCard label="Subdomain" value={`${appId}.freeappstore.online`} mono />
        <InfoCard label="Source" value={`freeappstore-online/${appId}`} href={repoUrl} />
        <InfoCard label="License" value="MIT" />
        <InfoCard label="Deploy" value="Push to main = auto-deploy" />
      </div>
    </div>
  )
}

function Settings() {
  const { preference, setPreference } = useTheme()
  return (
    <div className="space-y-8">
      <h2 className="display-font text-2xl font-bold text-[var(--ink)]">Settings</h2>
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--glass-strong)] p-6">
        <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide mb-4">Theme</h3>
        <div className="flex gap-2">
          {(['system', 'light', 'dark'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setPreference(t)}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${
                preference === t
                  ? 'bg-[var(--accent)] text-white'
                  : 'border border-[var(--line-strong)] text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function UILibraryView() {
  const mockUser = { id: '1', login: 'demo-user', avatarUrl: 'https://github.com/serge-ivo.png', dateOfBirth: null }
  const noAvatar = { id: '2', login: 'jane', avatarUrl: null, dateOfBirth: null }
  return (
    <div className="space-y-10">
      <div>
        <h2 className="display-font text-2xl font-bold text-[var(--ink)]">UI Component Library</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Live preview of <code className="text-xs bg-[var(--panel)] px-1.5 py-0.5 rounded">@freeappstore/sdk/ui</code> components.
        </p>
      </div>
      <Section title="Avatar" code="import { Avatar } from '@freeappstore/sdk/ui'">
        <Row label="With avatar"><Avatar user={mockUser} size={32} /><Avatar user={mockUser} size={48} /><Avatar user={mockUser} size={64} /></Row>
        <Row label="Fallback"><Avatar user={noAvatar} size={32} /><Avatar user={null} size={32} /></Row>
      </Section>
      <Section title="ThemeToggle" code="import { ThemeToggle } from '@freeappstore/sdk/ui'">
        <Row label="Interactive"><ThemeToggle /><span className="text-xs text-[var(--muted)]">Cycles: system, light, dark</span></Row>
      </Section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--glass)] p-4">
      <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">{label}</p>
      <p className="mt-1 display-font text-2xl font-bold text-[var(--ink)]">{value}</p>
    </div>
  )
}

function InfoCard({ label, value, href, mono }: { label: string; value: string; href?: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--glass)] p-4">
      <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">{label}</p>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="mt-1 text-sm text-[var(--accent)] font-medium block">{value}</a>
      ) : (
        <p className={`mt-1 text-sm text-[var(--ink)] ${mono ? 'font-mono' : ''}`}>{value}</p>
      )}
    </div>
  )
}

function QuickLink({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-[var(--line)] p-3 hover:bg-[var(--glass-hover)] no-underline block">
      <p className="font-semibold text-sm text-[var(--ink)]">{label}</p>
      <p className="text-xs text-[var(--muted)] mt-0.5">{desc}</p>
    </a>
  )
}

function Section({ title, code, children }: { title: string; code: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--glass-strong)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--line)]">
        <h3 className="text-lg font-bold text-[var(--ink)]">{title}</h3>
        <code className="text-xs text-[var(--muted)] font-mono">{code}</code>
      </div>
      <div className="px-5 py-4 space-y-4">{children}</div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">{label}</p>
      <div className="flex items-center gap-3 flex-wrap">{children}</div>
    </div>
  )
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}
