import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../hooks/useAuth";
import { Dashboard } from "../pages/Dashboard";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ apps: [] }),
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

describe("Dashboard — unauthenticated", () => {
  it("shows sign-in CTA", () => {
    render(
      <AuthContext.Provider value={NO_AUTH}>
        <MemoryRouter><Dashboard /></MemoryRouter>
      </AuthContext.Provider>,
    );
    expect(screen.getAllByText(/sign in/i).length).toBeGreaterThan(0);
  });

  it("shows Creator Console heading", () => {
    render(
      <AuthContext.Provider value={NO_AUTH}>
        <MemoryRouter><Dashboard /></MemoryRouter>
      </AuthContext.Provider>,
    );
    expect(screen.getByText(/creator console/i)).toBeInTheDocument();
  });
});

describe("Dashboard — authenticated", () => {
  it("shows welcome with username", () => {
    render(
      <AuthContext.Provider value={WITH_AUTH}>
        <MemoryRouter><Dashboard /></MemoryRouter>
      </AuthContext.Provider>,
    );
    expect(screen.getByText(/welcome, alice/i)).toBeInTheDocument();
  });

  it("shows Your Apps section", () => {
    render(
      <AuthContext.Provider value={WITH_AUTH}>
        <MemoryRouter><Dashboard /></MemoryRouter>
      </AuthContext.Provider>,
    );
    expect(screen.getAllByText(/your apps/i).length).toBeGreaterThan(0);
  });

  it("Create New App link points to /create", () => {
    render(
      <AuthContext.Provider value={WITH_AUTH}>
        <MemoryRouter><Dashboard /></MemoryRouter>
      </AuthContext.Provider>,
    );
    const link = screen.getByText(/create new app/i);
    expect(link.closest("a")?.getAttribute("href")).toBe("/create");
  });

  it("shows empty state with VibeCode link", () => {
    render(
      <AuthContext.Provider value={WITH_AUTH}>
        <MemoryRouter><Dashboard /></MemoryRouter>
      </AuthContext.Provider>,
    );
    const link = screen.getByText("VibeCode");
    expect(link.closest("a")?.getAttribute("href")).toBe("/create");
  });

  it("shows quick links", () => {
    render(
      <AuthContext.Provider value={WITH_AUTH}>
        <MemoryRouter><Dashboard /></MemoryRouter>
      </AuthContext.Provider>,
    );
    expect(screen.getByText(/sdk docs/i)).toBeInTheDocument();
  });

  it("shows stat cards", () => {
    render(
      <AuthContext.Provider value={WITH_AUTH}>
        <MemoryRouter><Dashboard /></MemoryRouter>
      </AuthContext.Provider>,
    );
    // "Apps" appears in both nav and stat card — just check it's present
    expect(screen.getAllByText("Apps").length).toBeGreaterThan(0);
    // "Free" also matches "FreeAppStore" brand — check the stat card value specifically
    expect(screen.getByText("Platform")).toBeInTheDocument();
    expect(screen.getByText("License")).toBeInTheDocument();
  });
});
