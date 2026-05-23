import { useState, useEffect } from 'react'
import { RolesManager } from './RolesManager'
import { SecretsManager } from './SecretsManager'

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

interface DeployRun {
  conclusion: string | null
  status: string
  updated_at: string
  html_url: string
  head_sha: string
  name: string
}

export function AppDetail({ appId, appName, getToken, onBack }: Props) {
  const [analytics, setAnalytics] = useState<AppAnalytics | null>(null)
  const [deploys, setDeploys] = useState<DeployRun[]>([])
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

  useEffect(() => {
    fetch(`https://api.github.com/repos/freeappstore-online/${appId}/actions/runs?per_page=5`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.workflow_runs) setDeploys(data.workflow_runs)
      })
      .catch(() => {})
  }, [appId])

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm text-[var(--accent)] font-medium hover:underline min-h-[44px] flex items-center">&larr; Back</button>

      {/* Hero */}
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-6">
        <h2 className="display-font text-xl sm:text-2xl font-bold text-[var(--ink)]">{appName}</h2>
        <p className="mt-1 text-sm text-[var(--muted)] font-mono truncate">{appId}.freeappstore.online</p>
        <div className="mt-4 flex gap-2.5 flex-wrap">
          <a href={appUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 no-underline min-h-[44px]">
            Open App
          </a>
          <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line-strong)] px-4 py-2.5 text-sm font-medium text-[var(--ink)] hover:bg-[var(--panel-hover)] no-underline min-h-[44px]">
            Source
          </a>
        </div>
      </div>

      {/* Deploy History */}
      {deploys.length > 0 && (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">Recent Deploys</h3>
          <div className="space-y-2">
            {deploys.map((d) => (
              <a
                key={d.head_sha}
                href={d.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg hover:bg-[var(--panel-hover)] no-underline min-h-[44px]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                    d.conclusion === 'success' ? 'bg-[var(--success)]' :
                    d.conclusion === 'failure' ? 'bg-[var(--error)]' :
                    d.status === 'in_progress' ? 'bg-[var(--warning)]' : 'bg-[var(--muted)]'
                  }`} />
                  <span className="text-sm text-[var(--ink)] truncate">{d.name}</span>
                </div>
                <span className="text-xs text-[var(--muted)] whitespace-nowrap flex-shrink-0">
                  {formatTimeAgo(new Date(d.updated_at))}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      {!loading && analytics && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4">
            <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Active Users (30d)</p>
            <p className="mt-1 display-font text-2xl font-bold text-[var(--ink)]">{analytics.activeUsers30d}</p>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4">
            <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Total Events</p>
            <p className="mt-1 display-font text-2xl font-bold text-[var(--ink)]">{analytics.totalEvents}</p>
          </div>
        </div>
      )}

      {/* Roles */}
      <RolesManager appId={appId} getToken={getToken} />

      {/* API Proxy & Secrets */}
      <SecretsManager appId={appId} getToken={getToken} />

      {/* Code Health */}
      <CodeHealth appId={appId} />

      {/* Info grid */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">App Info</h3>
        <div className="grid gap-3 grid-cols-2">
          <InfoCard label="Subdomain" value={`${appId}.freeappstore.online`} mono />
          <InfoCard label="Source" value={`freeappstore-online/${appId}`} href={repoUrl} />
          <InfoCard label="Deploy" value="Push to main = auto-deploy" />
          <InfoCard label="Hosting" value="R2 (edge)" />
          <InfoCard label="License" value="MIT" />
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
          <FeatureCard title="Proxy" desc="Secret-injecting API proxy (manage above)" />
        </div>
      </div>

      {/* Useful links */}
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6">
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

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
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

function CodeHealth({ appId }: { appId: string }) {
  const [report, setReport] = useState<VcqaReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`https://freeappstore-host.serge-ivo.workers.dev/apps/${appId}/.vcqa/report.json`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setReport(data as VcqaReport | null))
      .catch(() => {})
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
    if (g === 'A') return 'var(--success, #16a34a)'
    if (g === 'B') return 'var(--success, #16a34a)'
    if (g === 'C') return 'var(--warning, #ca8a04)'
    return 'var(--error, #dc2626)'
  }

  const [expanded, setExpanded] = useState<string | null>(null)
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
        <div className="display-font text-4xl font-bold" style={{ color: gradeColor(report.grade) }}>
          {report.grade}
        </div>
        <div>
          <div className="text-2xl font-bold text-[var(--ink)]">{report.score}/100</div>
          <div className="text-xs text-[var(--muted)]">{activeChecks.length} checks · {totalIssues} issues</div>
        </div>
        <div className="ml-auto">
          <img
            src={`https://freeappstore-host.serge-ivo.workers.dev/apps/${appId}/.vcqa/badge.svg`}
            alt={`vcqa ${report.grade} ${report.score}`}
            className="h-5"
          />
        </div>
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
                  <span
                    className="inline-block w-6 text-center text-xs font-bold rounded flex-shrink-0"
                    style={{ color: gradeColor(check.grade), background: `color-mix(in srgb, ${gradeColor(check.grade)} 15%, transparent)` }}
                  >
                    {check.grade}
                  </span>
                  <span className="text-sm text-[var(--ink)] flex-1">{check.name}</span>
                  {hasIssues && (
                    <span className="text-xs text-[var(--muted)]">{issues.length} issue{issues.length > 1 ? 's' : ''}</span>
                  )}
                  <span className="text-xs text-[var(--muted)] font-mono w-6 text-right flex-shrink-0">{check.score}</span>
                  <div className="w-16 h-1.5 rounded bg-[var(--line)] overflow-hidden flex-shrink-0">
                    <div className="h-full rounded" style={{ width: `${check.score}%`, background: gradeColor(check.grade) }} />
                  </div>
                  {hasIssues && (
                    <span className="text-xs text-[var(--muted)] flex-shrink-0">{isOpen ? '▾' : '▸'}</span>
                  )}
                </button>
                {isOpen && issues.length > 0 && (
                  <div className="ml-8 mb-2 rounded-lg border border-[var(--line)] bg-[var(--paper)] overflow-hidden">
                    {issues.slice(0, 20).map((issue, i) => (
                      <div key={i} className="flex items-start gap-2 px-3 py-1.5 border-b border-[var(--line)] last:border-0 text-xs">
                        <span className={`flex-shrink-0 font-semibold ${issue.severity === 'error' ? 'text-[var(--error,#dc2626)]' : 'text-[var(--warning,#ca8a04)]'}`}>
                          {issue.severity === 'error' ? '!' : '~'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="text-[var(--ink)]">{issue.message}</span>
                          {issue.file && (
                            <span className="text-[var(--muted)] font-mono ml-1.5">
                              {issue.file.split('/').slice(-2).join('/')}{issue.line ? `:${issue.line}` : ''}
                            </span>
                          )}
                        </div>
                        {issue.rule && <span className="text-[var(--muted)] font-mono flex-shrink-0">{issue.rule}</span>}
                      </div>
                    ))}
                    {issues.length > 20 && (
                      <div className="px-3 py-1.5 text-xs text-[var(--muted)]">+{issues.length - 20} more issues</div>
                    )}
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

function LinkRow({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between py-1.5 text-sm text-[var(--accent)] font-medium hover:underline no-underline">
      {label}
      <span className="text-[var(--muted)]">&rarr;</span>
    </a>
  )
}
