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
    // Fetch both published apps AND deployed VibeCode sessions, then merge.
    // Published apps come from the `apps` D1 table (ownership record created at publish).
    // VibeCode sessions come from `agent_sessions` (created when the agent deploys).
    // A user who built via VibeCode but hasn't published yet should still see their app.
    const [appsRes, sessionsRes] = await Promise.all([
      fetch(`${API_BASE}/apps/mine`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/agent/sessions?limit=100`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    const publishedApps: AppEntry[] = [];
    if (appsRes.ok) {
      const data = (await appsRes.json()) as { apps: { id: string; name?: string; createdAt: number; category?: string | null; oneliner?: string | null }[] };
      for (const a of data.apps ?? []) {
        publishedApps.push({
          id: a.id,
          name: a.name || a.id,
          createdAt: new Date(a.createdAt).toISOString(),
          category: a.category,
          description: a.oneliner,
        });
      }
    } else if (appsRes.status === 401) {
      return "unauthorized";
    }

    // Add deployed VibeCode sessions that aren't already in published apps
    const publishedIds = new Set(publishedApps.map((a) => a.id));
    if (sessionsRes.ok) {
      const data = (await sessionsRes.json()) as { sessions: { id: string; name: string; appId?: string; deployed: boolean; createdAt: number }[] };
      for (const s of data.sessions ?? []) {
        if (s.deployed && s.appId && !publishedIds.has(s.appId)) {
          publishedApps.push({
            id: s.appId,
            name: s.name || s.appId,
            createdAt: new Date(s.createdAt).toISOString(),
            category: null,
            description: "Deployed via VibeCode (not yet published to store)",
          });
        }
      }
    }

    return publishedApps.sort((a, b) => a.id.localeCompare(b.id));
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
      <main className="container py-4 sm:py-6" style={{ maxWidth: 900 }}>
        <div className="space-y-5 sm:space-y-8">
          {/* Welcome */}
          <div className="rounded-2xl border p-4 sm:p-6" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
            <div className="flex items-center gap-3 sm:gap-4">
              {user.avatarUrl && (
                <img src={user.avatarUrl} alt={user.login} className="rounded-full" style={{ width: 44, height: 44, border: "2px solid var(--line)" }} />
              )}
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold" style={{ color: "var(--ink)" }}>Welcome, {user.login}</h2>
                <p className="mt-0.5 text-sm" style={{ color: "var(--muted)" }}>Manage your apps</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
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
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="rounded-2xl border p-4 sm:p-6" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
            <h3 className="text-sm font-semibold uppercase tracking-wide mb-3 sm:mb-4" style={{ color: "var(--muted)" }}>Quick Links</h3>
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-3">
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
    <div className="rounded-xl border p-3 sm:p-4" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>{label}</p>
      <p className="mt-0.5 sm:mt-1 font-display text-lg sm:text-2xl font-bold" style={{ color: "var(--ink)" }}>{value}</p>
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

