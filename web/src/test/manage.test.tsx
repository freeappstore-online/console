import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthContext } from "../hooks/useAuth";
import { Manage, DataAdmin } from "../pages/Manage";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ apps: [], roles: [], secrets: [], rules: [], webhooks: [], supported_events: [] }),
  })));
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem(k: string) { return store.get(k) ?? null; },
    setItem(k: string, v: string) { store.set(k, v); },
    removeItem(k: string) { store.delete(k); },
  });
});

const MOCK_USER = { id: "gh:1", login: "alice", avatarUrl: null, dateOfBirth: null };
const WITH_AUTH: typeof NO_AUTH = { user: MOCK_USER, loading: false, signIn: vi.fn(), signOut: vi.fn() };
const NO_AUTH: { user: null | { id: string; login: string; avatarUrl: string | null; dateOfBirth: null }; loading: boolean; signIn: () => void; signOut: () => void } = { user: null, loading: false, signIn: vi.fn(), signOut: vi.fn() };

function renderManage(appId: string, auth = WITH_AUTH) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[`/manage/${appId}`]}>
        <Routes>
          <Route path="/manage/:id" element={<Manage />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("Manage page", () => {
  it("shows sign-in when unauthenticated", () => {
    renderManage("test-app", NO_AUTH);
    expect(screen.getAllByText(/sign in/i).length).toBeGreaterThan(0);
  });

  it("renders back button when authenticated", () => {
    renderManage("test-app");
    expect(screen.getAllByText(/back/i).length).toBeGreaterThan(0);
  });

  it("shows app name in detail view", () => {
    renderManage("test-app");
    // The appId is shown as the initial app name
    expect(screen.getByText("test-app")).toBeInTheDocument();
  });
});

describe("DataAdmin page", () => {
  it("shows access prompt when unauthenticated", () => {
    render(
      <AuthContext.Provider value={NO_AUTH}>
        <MemoryRouter><DataAdmin /></MemoryRouter>
      </AuthContext.Provider>,
    );
    expect(screen.getAllByText(/admin/i).length).toBeGreaterThan(0);
  });

  it("renders heading when authenticated", () => {
    render(
      <AuthContext.Provider value={WITH_AUTH}>
        <MemoryRouter><DataAdmin /></MemoryRouter>
      </AuthContext.Provider>,
    );
    expect(screen.getByText(/platform data/i)).toBeInTheDocument();
  });
});
