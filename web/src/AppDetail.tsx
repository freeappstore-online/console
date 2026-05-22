import { useState, useEffect } from 'react'

const API_BASE = 'https://api.freeappstore.online/v1'

interface Props {
  appId: string
  appName: string
  getToken: () => string | null
  onBack: () => void
}

interface AppAnalytics {
  activeUsers30d: number
  totalEvents: number
}

export function AppDetail({ appId, appName, getToken, onBack }: Props) {
  const [analytics, setAnalytics] = useState<AppAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const appUrl = `https://${appId}.freeappstore.online`
  const repoUrl = `https://github.com/freeappstore-online/${appId}`

  useEffect(() => {
    const token = getToken()
    if (!token) { setLoading(false); return }
    fetch(`${API_BASE}/apps/${encodeURIComponent(appId)}/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => setAnalytics(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [appId, getToken])

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm text-[var(--accent)] font-medium hover:underline">&larr; Back to Dashboard</button>

      {/* Hero */}
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

      {/* Stats */}
      {!loading && analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-[var(--line)] bg-[var(--glass)] p-4">
            <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Active Users (30d)</p>
            <p className="mt-1 display-font text-2xl font-bold text-[var(--ink)]">{analytics.activeUsers30d}</p>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-[var(--glass)] p-4">
            <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Total Events</p>
            <p className="mt-1 display-font text-2xl font-bold text-[var(--ink)]">{analytics.totalEvents}</p>
          </div>
        </div>
      )}

      {/* Info grid */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">App Info</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoCard label="Subdomain" value={`${appId}.freeappstore.online`} mono />
          <InfoCard label="Source Code" value={`freeappstore-online/${appId}`} href={repoUrl} />
          <InfoCard label="License" value="MIT — open source" />
          <InfoCard label="Deploy" value="Push to main = auto-deploy" />
          <InfoCard label="Hosting" value="Cloudflare Pages (edge)" />
          <InfoCard label="Price" value="Free forever" />
        </div>
      </div>

      {/* SDK features */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">Platform Features</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard title="Auth" desc="GitHub OAuth SSO across all apps" />
          <FeatureCard title="Per-user KV" desc="1MB/user, 100 keys, scoped storage" />
          <FeatureCard title="Collections" desc="Firestore-style document database" />
          <FeatureCard title="Counters" desc="Atomic shared counters (votes, views)" />
          <FeatureCard title="Rooms" desc="WebSocket real-time (25 peers/room)" />
          <FeatureCard title="Proxy" desc="Secret-injecting API proxy" />
        </div>
      </div>

      {/* Useful links */}
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--glass-strong)] p-6">
        <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">Links</h3>
        <div className="space-y-2">
          <LinkRow href={appUrl} label="Live app" />
          <LinkRow href={repoUrl} label="GitHub repository" />
          <LinkRow href="https://freeappstore.online/docs" label="SDK documentation" />
          <LinkRow href="https://freeappstore.online/docs/ui" label="UI component library" />
          <LinkRow href={`https://freeappstore.online/apps/${appId}`} label="Store listing" />
        </div>
      </div>
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

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--glass)] p-3">
      <p className="font-semibold text-sm text-[var(--ink)]">{title}</p>
      <p className="text-xs text-[var(--muted)] mt-0.5">{desc}</p>
    </div>
  )
}

function LinkRow({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between py-1.5 text-sm text-[var(--accent)] font-medium hover:underline no-underline">
      {label}
      <span className="text-[var(--muted)]">&rarr;</span>
    </a>
  )
}
