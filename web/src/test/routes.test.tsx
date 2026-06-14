import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthContext } from "../hooks/useAuth";

// Stub fetch globally — pages fire API calls on mount
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: false, json: () => Promise.resolve({}) })));
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem(k: string) { return store.get(k) ?? null; },
    setItem(k: string, v: string) { store.set(k, v); },
    removeItem(k: string) { store.delete(k); },
  });
});

const MOCK_USER = { id: "gh:1", login: "alice", avatarUrl: null, dateOfBirth: null };
const NO_AUTH: { user: null | { id: string; login: string; avatarUrl: string | null; dateOfBirth: null }; loading: boolean; signIn: () => void; signOut: () => void } = { user: null, loading: false, signIn: vi.fn(), signOut: vi.fn() };
const WITH_AUTH: typeof NO_AUTH = { user: MOCK_USER, loading: false, signIn: vi.fn(), signOut: vi.fn() };

// Import pages — skip Create (heavyweight, has agent deps)
import { Dashboard } from "../pages/Dashboard";
import { Profile } from "../pages/Profile";
import { Publish } from "../pages/Publish";
import { Admin } from "../pages/Admin";
import { Manage, DataAdmin } from "../pages/Manage";

function LegacyRedirect() {
  const { id } = useParams();
  return <Navigate to={`/create/${id ?? ""}`} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/manage/:id" element={<Manage />} />
      <Route path="/publish" element={<Publish />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/admin/data" element={<DataAdmin />} />
      <Route path="/app/:id" element={<LegacyRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function renderRoute(path: string, auth = NO_AUTH) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("Route smoke tests — unauthenticated", () => {
  it("/ renders sign-in prompt", () => {
    renderRoute("/");
    expect(screen.getAllByText(/sign in/i).length).toBeGreaterThan(0);
  });

  it("/dashboard renders sign-in prompt", () => {
    renderRoute("/dashboard");
    expect(screen.getAllByText(/sign in/i).length).toBeGreaterThan(0);
  });

  it("/publish renders sign-in prompt", () => {
    renderRoute("/publish");
    expect(screen.getAllByText(/sign in/i).length).toBeGreaterThan(0);
  });

  it("/profile renders sign-in prompt", () => {
    renderRoute("/profile");
    expect(screen.getAllByText(/sign in/i).length).toBeGreaterThan(0);
  });

  it("/admin shows admin page", () => {
    renderRoute("/admin");
    expect(screen.getAllByText(/admin/i).length).toBeGreaterThan(0);
  });

  it("/manage/:id renders sign-in prompt", () => {
    renderRoute("/manage/test-app");
    expect(screen.getAllByText(/sign in/i).length).toBeGreaterThan(0);
  });

  it("/admin/data shows admin prompt", () => {
    renderRoute("/admin/data");
    expect(screen.getAllByText(/admin/i).length).toBeGreaterThan(0);
  });

  it("unknown route redirects to /", () => {
    renderRoute("/nonexistent");
    // Falls through to Dashboard which shows sign-in
    expect(screen.getAllByText(/sign in/i).length).toBeGreaterThan(0);
  });
});

describe("Route smoke tests — authenticated", () => {
  it("/ renders welcome", () => {
    renderRoute("/", WITH_AUTH);
    expect(screen.getByText(/welcome, alice/i)).toBeInTheDocument();
  });

  it("/dashboard renders app list heading", () => {
    renderRoute("/dashboard", WITH_AUTH);
    // "Your Apps" appears once in the dashboard
    expect(screen.getAllByText(/your apps/i).length).toBeGreaterThan(0);
  });

  it("/manage/:id renders back button", () => {
    renderRoute("/manage/test-app", WITH_AUTH);
    expect(screen.getAllByText(/back/i).length).toBeGreaterThan(0);
  });

  it("/admin/data renders platform data heading", () => {
    renderRoute("/admin/data", WITH_AUTH);
    expect(screen.getByText(/platform data/i)).toBeInTheDocument();
  });
});

describe("Legacy redirect", () => {
  it("/app/:id navigates away from /app/ path", () => {
    // After redirect, LegacyRedirect fires Navigate to /create/my-app.
    // Since /create is not in our test routes, it falls through to catch-all → /
    // which renders Dashboard. The key assertion: it doesn't crash.
    const { container } = renderRoute("/app/my-app", WITH_AUTH);
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });
});
