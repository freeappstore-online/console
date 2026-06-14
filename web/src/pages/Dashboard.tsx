import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Nav } from "../components/Nav";
import { useAuth } from "../hooks/useAuth";
import { getSession } from "../lib/api";

const API_BASE = "https://api.freeappstore.online/v1";

interface AppEntry {
  id: string;
  name: string;
  createdAt: string;
  category?: string | null;
  description?: string | null;
}

async function fetchApps(token: string | null): Promise<AppEntry[] | "unauthorized"> {
  if (!token) return "unauthorized";
  try {
    const res = await fetch(`${API_BASE}/apps/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) return "unauthorized";
    if (!res.ok) return [];
    const data = (await res.json()) as { apps: { id: string; name?: string; ownerLogin: string; createdAt: number; category?: string | null; oneliner?: string | null }[] };
    return (data.apps ?? [])
      .map((a) => ({
        id: a.id,
        name: a.name || a.id,
        createdAt: new Date(a.createdAt).toISOString(),
        category: a.category,
        description: a.oneliner,
      }))
      .sort((a, b) => a.id.localeCompare(b.id));
  } catch {
    return [];
  }
}

export function Dashboard() {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState<AppEntry[]>([]);

  const reloadApps = useCallback(async () => {
    const session = getSession();
    const result = await fetchApps(session?.token ?? null);
    if (result !== "unauthorized") setApps(result);
  }, []);

  useEffect(() => {
    if (user) reloadApps();
  }, [user, reloadApps]);

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <p style={{ color: "var(--muted)" }}>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Nav />
        <div className="flex min-h-[60vh] items-center justify-center px-4">
          <div className="text-center max-w-md">
            <h1 className="font-display text-4xl font-bold" style={{ color: "var(--ink-strong)" }}>Creator Console</h1>
            <p className="mt-4 text-lg" style={{ color: "var(--muted)" }}>
              Sign in with GitHub to manage your apps on FreeAppStore.
            </p>
            <button
              onClick={signIn}
              className="mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-90"
              style={{ background: "var(--accent)" }}
            >
              Sign in with GitHub
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="container py-6" style={{ maxWidth: 900 }}>
        <div className="space-y-8">
          {/* Welcome */}
          <div className="rounded-2xl border p-6" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
            <div className="flex items-center gap-4">
              {user.avatarUrl && (
                <img src={user.avatarUrl} alt={user.login} className="rounded-full" style={{ width: 56, height: 56, border: "2px solid var(--line)" }} />
              )}
              <div>
                <h2 className="font-display text-2xl font-bold" style={{ color: "var(--ink)" }}>Welcome, {user.login}</h2>
                <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Manage your apps on FreeAppStore</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Apps" value={apps.length} />
            <StatCard label="Platform" value="Free" />
            <StatCard label="License" value="MIT" />
          </div>

          {/* Your Apps */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-bold" style={{ color: "var(--ink)" }}>Your Apps</h3>
              <Link
                to="/create"
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white hover:opacity-90 no-underline"
                style={{ background: "var(--accent)" }}
              >
                + Create New App
              </Link>
            </div>

            {apps.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-12 text-center" style={{ borderColor: "var(--line-strong)" }}>
                <p style={{ color: "var(--muted)" }}>
                  No apps yet. Create your first app with{" "}
                  <Link to="/create" className="font-semibold underline" style={{ color: "var(--accent)" }}>VibeCode</Link>{" "}
                  or the CLI.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                {apps.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => navigate(`/manage/${a.id}`)}
                    className="text-left rounded-xl border p-4 hover:bg-[var(--panel-hover)] shadow-sm min-h-[5rem]"
                    style={{ borderColor: "var(--line)", background: "var(--panel)" }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-semibold block truncate" style={{ color: "var(--ink)" }}>{a.name}</span>
                        <p className="mt-0.5 text-xs font-mono truncate" style={{ color: "var(--muted)" }}>{a.id}.freeappstore.online</p>
                        {a.category && <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>{a.category}</p>}
                      </div>
                    </div>
                    <DeployBadge appId={a.id} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="rounded-2xl border p-6" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
            <h3 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--muted)" }}>Quick Links</h3>
            <div className="grid gap-2 sm:grid-cols-3">
              <QuickLink href="https://freeappstore.online/docs" label="SDK Docs" desc="Auth, KV, rooms, proxy" />
              <QuickLink href="https://freeappstore.online/docs/ui" label="UI Library" desc="Components & design tokens" />
              <QuickLink href="https://freeappstore.online/guidelines" label="Guidelines" desc="Quality & compliance rules" />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>{label}</p>
      <p className="mt-1 font-display text-2xl font-bold" style={{ color: "var(--ink)" }}>{value}</p>
    </div>
  );
}

function QuickLink({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="rounded-xl border p-3 hover:bg-[var(--panel-hover)] no-underline block" style={{ borderColor: "var(--line)" }}>
      <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>{label}</p>
      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{desc}</p>
    </a>
  );
}

interface DeployInfo {
  status: "success" | "failure" | "in_progress" | "unknown";
  updatedAt: string | null;
}

function useDeployStatus(appId: string): DeployInfo {
  const [info, setInfo] = useState<DeployInfo>({ status: "unknown", updatedAt: null });
  useEffect(() => {
    fetch(`https://api.github.com/repos/freeappstore-online/${appId}/actions/runs?per_page=1&status=completed`, {
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const run = data?.workflow_runs?.[0];
        if (run) {
          setInfo({
            status: run.conclusion === "success" ? "success" : "failure",
            updatedAt: run.updated_at,
          });
        }
      })
      .catch(() => { /* best-effort */ });
  }, [appId]);
  return info;
}

function DeployBadge({ appId }: { appId: string }) {
  const deploy = useDeployStatus(appId);
  if (deploy.status === "unknown") return null;
  const labels: Record<string, string> = { success: "Live", failure: "Deploy failed", in_progress: "Deploying" };
  const timeAgo = deploy.updatedAt ? formatTimeAgo(new Date(deploy.updatedAt)) : "";
  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={deploy.status === "success" ? { background: "var(--success)", color: "white" } : deploy.status === "failure" ? { background: "var(--error)", color: "white" } : { background: "var(--warning)", color: "white" }}>
        {labels[deploy.status]}
      </span>
      {timeAgo && <span className="text-[10px]" style={{ color: "var(--muted)" }}>{timeAgo}</span>}
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
