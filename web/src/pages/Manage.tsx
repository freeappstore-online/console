import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Nav } from "../components/Nav";
import { useAuth } from "../hooks/useAuth";
import { getSession } from "../lib/api";
import { AppDetail } from "../components/manage/AppDetail";
import { ContentAdmin } from "../components/manage/ContentAdmin";

const API_BASE = "https://api.freeappstore.online/v1";

export function Manage() {
  const { id: appId } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [appName, setAppName] = useState(appId || "");

  const getToken = useCallback(() => getSession()?.token ?? null, []);

  // Fetch app name from API
  useEffect(() => {
    const token = getToken();
    if (!token || !appId) return;
    fetch(`${API_BASE}/apps/mine`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        const app = data?.apps?.find((a: { id: string; name?: string }) => a.id === appId);
        if (app?.name) setAppName(app.name);
      })
      .catch(() => { /* best-effort */ });
  }, [appId, getToken]);

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
        <div className="container py-16 text-center">
          <p style={{ color: "var(--muted)" }}>Sign in to manage your apps.</p>
        </div>
      </>
    );
  }

  if (!appId) {
    return (
      <>
        <Nav />
        <div className="container py-16 text-center">
          <p style={{ color: "var(--muted)" }}>No app selected.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="container py-4 sm:py-6" style={{ maxWidth: 900 }}>
        <AppDetail
          appId={appId}
          appName={appName}
          getToken={getToken}
          onBack={() => navigate("/")}
        />
      </main>
    </>
  );
}

export function DataAdmin() {
  const { user, loading } = useAuth();
  const getToken = useCallback(() => getSession()?.token ?? null, []);

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
        <div className="container py-16 text-center">
          <p style={{ color: "var(--muted)" }}>Admin access required.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="container py-4 sm:py-6" style={{ maxWidth: 1100 }}>
        <h1 className="font-display text-2xl font-bold mb-6" style={{ color: "var(--ink)" }}>Platform Data</h1>
        <ContentAdmin getToken={getToken} />
      </main>
    </>
  );
}
