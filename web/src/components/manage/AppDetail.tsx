import { useState, useEffect, useCallback } from 'react'
import { RolesManager } from './RolesManager'
import { SecretsManager } from './SecretsManager'
import { WebhooksManager } from './WebhooksManager'
import { LogsViewer } from './LogsViewer'

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

interface VcqaIssue {
  severity: string
  message: string
  file?: string
  line?: number
  rule?: string
}

interface VcqaCheck {
  name: string
  score: number
  grade: string
  issues?: VcqaIssue[]
}

interface VcqaReport {
  score: number
  grade: string
  version: string
  timestamp: string
  checks: VcqaCheck[]
}

type AppTab = 'overview' | 'data'

export function AppDetail({ appId, appName, getToken, onBack }: Props) {
  const [appTab, setAppTab] = useState<AppTab>('overview')
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
      .catch(() => { /* analytics fetch is best-effort */ })
      .finally(() => setLoading(false))
  }, [appId, getToken])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="text-sm text-[var(--accent)] font-medium hover:underline min-h-[44px] flex items-center">&larr; Back</button>
        <div className="flex gap-1 ml-auto">
          {(['overview', 'data'] as AppTab[]).map(t => (
            <button
              key={t}
              onClick={() => setAppTab(t)}
              className={`px-3 py-1 rounded-full text-xs font-semibold min-h-[32px] ${
                appTab === t ? 'bg-[var(--ink)] text-[var(--paper)]' : 'text-[var(--muted)] border border-[var(--line)]'
              }`}
            >
              {t === 'data' ? 'Admin' : 'Overview'}
            </button>
          ))}
        </div>
      </div>

      {appTab === 'data' ? (
        <AppDataView appId={appId} getToken={getToken} />
      ) : (
      <>
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-6">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--ink)]">{appName}</h2>
        <p className="mt-1 text-sm text-[var(--muted)] font-mono truncate">{appId}.freeappstore.online</p>
        <div className="mt-4 flex gap-2.5 flex-wrap">
          <a href={appUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 no-underline min-h-[44px]">Open App</a>
          <a href={`/create/${appId}`} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line-strong)] px-4 py-2.5 text-sm font-medium text-[var(--ink)] hover:bg-[var(--panel-hover)] no-underline min-h-[44px]">Edit in VibeCode</a>
          <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line-strong)] px-4 py-2.5 text-sm font-medium text-[var(--ink)] hover:bg-[var(--panel-hover)] no-underline min-h-[44px]">Source</a>
        </div>
      </div>

      {!loading && analytics && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4">
            <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Active Users (30d)</p>
            <p className="mt-1 font-display text-2xl font-bold text-[var(--ink)]">{analytics.activeUsers30d}</p>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4">
            <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Total Events</p>
            <p className="mt-1 font-display text-2xl font-bold text-[var(--ink)]">{analytics.totalEvents}</p>
          </div>
        </div>
      )}

      <RolesManager appId={appId} getToken={getToken} />
      <SecretsManager appId={appId} getToken={getToken} />
      <WebhooksManager appId={appId} getToken={getToken} />
      <LogsViewer appId={appId} getToken={getToken} />
      <CodeHealth appId={appId} />

      <div>
        <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">App Info</h3>
        <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2">
          <InfoCard label="Subdomain" value={`${appId}.freeappstore.online`} mono />
          <InfoCard label="Source" value={`freeappstore-online/${appId}`} href={repoUrl} />
          <InfoCard label="Deploy" value="Push to main = auto-deploy" />
          <InfoCard label="Hosting" value="R2 (edge)" />
          <InfoCard label="License" value="MIT" />
          <InfoCard label="Price" value="Free forever" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">Platform Features</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard title="Auth" desc="GitHub OAuth SSO across all apps" />
          <FeatureCard title="Per-user KV" desc="1MB/user, 100 keys, scoped storage" />
          <FeatureCard title="Collections" desc="Firestore-style document database" />
          <FeatureCard title="Counters" desc="Atomic shared counters (votes, views)" />
          <FeatureCard title="Rooms" desc="WebSocket real-time (25 peers/room)" />
          <FeatureCard title="Proxy" desc="Secret-injecting API proxy (manage above)" />
        </div>
      </div>
      </>
      )}
    </div>
  )
}

function AppDataView({ appId, getToken }: { appId: string; getToken: () => string | null }) {
  const [tab, setTab] = useState<'kv' | 'collections' | 'counters'>('kv')
  const [entries, setEntries] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [valueCache, setValueCache] = useState<Record<string, unknown>>({})

  const headers = (): Record<string, string> => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' }
    const token = getToken()
    if (token) h.Authorization = `Bearer ${token}`
    return h
  }

  const loadEntries = useCallback(() => {
    setLoading(true)
    setExpanded(null)
    let url = ''
    if (tab === 'kv') url = `${API_BASE}/admin/kv?app=${appId}&limit=100`
    else if (tab === 'collections') url = `${API_BASE}/admin/collections?app=${appId}&limit=100`
    else url = `${API_BASE}/admin/counters?app=${appId}&limit=200`
    fetch(url, { headers: headers() })
      .then(r => r.ok ? r.json() : { entries: [] })
      .then(data => setEntries((data.entries ?? data.documents ?? data.counters ?? []) as Array<Record<string, unknown>>))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [appId, tab])

  useEffect(() => { loadEntries() }, [loadEntries])

  const deleteItem = async (params: string) => {
    if (!confirm('Delete this item?')) return
    try {
      await fetch(`${API_BASE}/admin/${tab === 'collections' ? 'collections' : tab}?${params}`, { method: 'DELETE', headers: headers() })
    } catch { /* network error — reload will show current state */ }
    loadEntries()
  }

  const loadKvValue = async (user: string, key: string) => {
    const cacheKey = `${user}:${key}`
    if (valueCache[cacheKey]) return
    const res = await fetch(`${API_BASE}/admin/kv/value?app=${appId}&user=${user}&key=${encodeURIComponent(key)}`, { headers: headers() })
    if (res.ok) {
      const data = await res.json() as { value: unknown }
      setValueCache(prev => ({ ...prev, [cacheKey]: data.value }))
    }
  }

  return (
    <div>
      <div className="flex gap-1 mb-4">
        {(['kv', 'collections', 'counters'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1 rounded-full text-xs font-semibold min-h-[32px] ${tab === t ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)] border border-[var(--line)]'}`}>
            {t === 'kv' ? 'KV' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <span className="text-xs text-[var(--muted)] ml-auto self-center">{entries.length} entries</span>
      </div>

      {loading ? <p className="text-sm text-[var(--muted)]">Loading...</p> : entries.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No {tab} data for this app.</p>
      ) : (
        <div className="rounded-xl border border-[var(--line)] overflow-hidden">
          {entries.map((e, i) => {
            if (tab === 'kv') {
              const cacheKey = `${e.user_id}:${e.key}`
              return (
                <div key={`${e.user_id}:${e.key}`} className="border-b border-[var(--line)] last:border-0">
                  <div className="flex items-center gap-2 px-3 py-2 text-xs">
                    <span className="font-mono text-[var(--muted)] w-16 truncate flex-shrink-0">{String(e.user_id).slice(0, 8)}</span>
                    <button onClick={() => { loadKvValue(String(e.user_id), String(e.key)); setExpanded(expanded === i ? null : i) }} className="font-mono text-[var(--ink)] truncate flex-1 text-left hover:underline">{String(e.key)}</button>
                    <span className="text-[var(--muted)] flex-shrink-0">{String(e.size)}B</span>
                    <button onClick={() => deleteItem(`app=${appId}&user=${e.user_id}&key=${encodeURIComponent(String(e.key))}`)} className="text-[var(--error)] opacity-40 hover:opacity-100 min-h-[32px] px-1" title="Delete">Del</button>
                  </div>
                  {expanded === i && valueCache[cacheKey] !== undefined && (
                    <pre className="px-3 py-2 text-xs font-mono bg-[var(--paper)] text-[var(--ink)] whitespace-pre-wrap break-all max-h-[300px] overflow-auto border-t border-[var(--line)]">{JSON.stringify(valueCache[cacheKey], null, 2)}</pre>
                  )}
                </div>
              )
            }
            if (tab === 'collections') {
              return (
                <div key={`${e.collection}:${e.id}`} className="border-b border-[var(--line)] last:border-0">
                  <div className="flex items-center gap-2 px-3 py-2 text-xs">
                    <span className="font-mono text-[var(--muted)] w-16 truncate flex-shrink-0">{String(e.collection)}</span>
                    <button onClick={() => setExpanded(expanded === i ? null : i)} className="font-mono text-[var(--ink)] truncate flex-1 text-left hover:underline">{String(e.id).slice(0, 12)}</button>
                    <span className="text-[var(--muted)] flex-shrink-0">{String(e.owner_id).slice(0, 8)}</span>
                    <button onClick={() => deleteItem(`app=${appId}&collection=${e.collection}&id=${e.id}`)} className="text-[var(--error)] opacity-40 hover:opacity-100 min-h-[32px] px-1" title="Delete">Del</button>
                  </div>
                  {expanded === i && (
                    <pre className="px-3 py-2 text-xs font-mono bg-[var(--paper)] text-[var(--ink)] whitespace-pre-wrap break-all max-h-[300px] overflow-auto border-t border-[var(--line)]">{JSON.stringify(e.data, null, 2)}</pre>
                  )}
                </div>
              )
            }
            return (
              <div key={String(e.name)} className="flex items-center gap-2 px-3 py-2 text-xs border-b border-[var(--line)] last:border-0">
                <span className="font-mono text-[var(--ink)] flex-1 truncate">{String(e.name)}</span>
                <span className="font-bold text-[var(--ink)] w-16 text-right flex-shrink-0">{String(e.value)}</span>
                <button onClick={() => deleteItem(`app=${appId}&name=${encodeURIComponent(String(e.name))}`)} className="text-[var(--error)] opacity-40 hover:opacity-100 min-h-[32px] px-1" title="Delete">Del</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CodeHealth({ appId }: { appId: string }) {
  const [report, setReport] = useState<VcqaReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [badgeError, setBadgeError] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/apps/${encodeURIComponent(appId)}/quality`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setReport(data as VcqaReport | null))
      .catch(() => { /* vcqa report is optional */ })
      .finally(() => setLoading(false))
  }, [appId])

  if (loading) return null
  if (!report) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5">
        <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">Code Health</h3>
        <p className="text-sm text-[var(--muted)]">No scan data yet. Code health runs automatically on each deploy.</p>
      </div>
    )
  }

  const gradeColor = (g: string) => {
    if (g === 'A' || g === 'B') return 'var(--success, #16a34a)'
    if (g === 'C') return 'var(--warning, #ca8a04)'
    return 'var(--error, #dc2626)'
  }

  const activeChecks = report.checks?.filter(c => c.score !== undefined && c.grade !== 'skip') ?? []
  const totalIssues = activeChecks.reduce((n, c) => n + (c.issues?.length ?? 0), 0)

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide">Code Health</h3>
        <span className="text-xs text-[var(--muted)]">
          via <a href="https://vibecodeqa.online" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)]">vcqa</a>
          {report.timestamp && ` · ${new Date(report.timestamp).toLocaleDateString()}`}
        </span>
      </div>
      <div className="flex items-center gap-4 mb-4">
        <div className="font-display text-4xl font-bold" style={{ color: gradeColor(report.grade) }}>{report.grade}</div>
        <div>
          <div className="text-2xl font-bold text-[var(--ink)]">{report.score}/100</div>
          <div className="text-xs text-[var(--muted)]">{activeChecks.length} checks · {totalIssues} issues</div>
        </div>
        {!badgeError && (
          <div className="ml-auto">
            <img src={`${API_BASE}/apps/${encodeURIComponent(appId)}/quality/badge`} alt={`vcqa ${report.grade} ${report.score}`} width={80} height={20} className="h-5" onError={() => setBadgeError(true)} />
          </div>
        )}
      </div>
      {activeChecks.length > 0 && (
        <div className="grid gap-0.5">
          {activeChecks.map(check => {
            const issues = check.issues ?? []
            const hasIssues = issues.length > 0
            const isOpen = expanded === check.name
            return (
              <div key={check.name}>
                <button
                  onClick={() => hasIssues && setExpanded(isOpen ? null : check.name)}
                  className="flex items-center gap-2 py-1.5 w-full text-left min-h-[36px]"
                  style={{ cursor: hasIssues ? 'pointer' : 'default', background: 'none', border: 'none', fontFamily: 'inherit', color: 'inherit' }}
                >
                  <span className="inline-block w-6 text-center text-xs font-bold rounded flex-shrink-0" style={{ color: gradeColor(check.grade), background: `color-mix(in srgb, ${gradeColor(check.grade)} 15%, transparent)` }}>{check.grade}</span>
                  <span className="text-sm text-[var(--ink)] flex-1">{check.name}</span>
                  {hasIssues && <span className="text-xs text-[var(--muted)]">{issues.length} issue{issues.length > 1 ? 's' : ''}</span>}
                  <span className="text-xs text-[var(--muted)] font-mono w-6 text-right flex-shrink-0">{check.score}</span>
                  <div className="w-16 h-1.5 rounded bg-[var(--line)] overflow-hidden flex-shrink-0">
                    <div className="h-full rounded" style={{ width: `${check.score}%`, background: gradeColor(check.grade) }} />
                  </div>
                  {hasIssues && <span className="text-xs text-[var(--muted)] flex-shrink-0">{isOpen ? '▾' : '▸'}</span>}
                </button>
                {isOpen && issues.length > 0 && (
                  <div className="ml-8 mb-2 rounded-lg border border-[var(--line)] bg-[var(--paper)] overflow-hidden">
                    {issues.slice(0, 20).map((issue, i) => (
                      <div key={i} className="flex items-start gap-2 px-3 py-1.5 border-b border-[var(--line)] last:border-0 text-xs">
                        <span className={`flex-shrink-0 font-semibold ${issue.severity === 'error' ? 'text-[var(--error)]' : 'text-[var(--warning)]'}`}>{issue.severity === 'error' ? '!' : '~'}</span>
                        <div className="min-w-0 flex-1">
                          <span className="text-[var(--ink)]">{issue.message}</span>
                          {issue.file && <span className="text-[var(--muted)] font-mono ml-1.5">{issue.file.split('/').slice(-2).join('/')}{issue.line ? `:${issue.line}` : ''}</span>}
                        </div>
                        {issue.rule && <span className="text-[var(--muted)] font-mono flex-shrink-0">{issue.rule}</span>}
                      </div>
                    ))}
                    {issues.length > 20 && <div className="px-3 py-1.5 text-xs text-[var(--muted)]">+{issues.length - 20} more issues</div>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function InfoCard({ label, value, href, mono }: { label: string; value: string; href?: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4">
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
    <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3">
      <p className="font-semibold text-sm text-[var(--ink)]">{title}</p>
      <p className="text-xs text-[var(--muted)] mt-0.5">{desc}</p>
    </div>
  )
}
