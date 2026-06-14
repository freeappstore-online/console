import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../hooks/useAuth";
import { Nav } from "../components/Nav";

beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem(k: string) { return store.get(k) ?? null; },
    setItem(k: string, v: string) { store.set(k, v); },
    removeItem(k: string) { store.delete(k); },
  });
});

const MOCK_USER = { id: "gh:1", login: "alice", avatarUrl: "https://example.com/avatar.png", dateOfBirth: null };
const NO_AUTH: { user: null | { id: string; login: string; avatarUrl: string | null; dateOfBirth: null }; loading: boolean; signIn: () => void; signOut: () => void } = { user: null, loading: false, signIn: vi.fn(), signOut: vi.fn() };
const WITH_AUTH: typeof NO_AUTH = { user: MOCK_USER, loading: false, signIn: vi.fn(), signOut: vi.fn() };

function renderNav(path: string, auth = NO_AUTH) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[path]}>
        <Nav />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("Nav — unauthenticated", () => {
  it("renders sign-in button", () => {
    renderNav("/");
    // Desktop nav has a sign-in button
    expect(screen.getAllByText(/sign in/i).length).toBeGreaterThan(0);
  });

  it("renders brand link", () => {
    renderNav("/");
    expect(screen.getByText(/AppStore/)).toBeInTheDocument();
  });
});

describe("Nav — authenticated", () => {
  it("shows user avatar", () => {
    renderNav("/", WITH_AUTH);
    const avatars = screen.getAllByAltText("alice");
    expect(avatars.length).toBeGreaterThan(0);
  });

  it("renders mobile bottom tab bar", () => {
    renderNav("/", WITH_AUTH);
    // Bottom tab bar has Home, Create, Publish, Profile tabs
    expect(screen.getAllByText("Home").length).toBeGreaterThan(0);
  });
});

describe("Nav links", () => {
  it("has Dashboard, Create, Publish links", () => {
    renderNav("/", WITH_AUTH);
    // Both desktop and mobile nav exist in DOM — just check at least one instance
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Create").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Publish").length).toBeGreaterThan(0);
  });

  it("has external Store link pointing to freeappstore.online", () => {
    renderNav("/", WITH_AUTH);
    const storeLinks = screen.getAllByText("Store");
    const external = storeLinks.find((el) => el.closest("a")?.getAttribute("href")?.includes("freeappstore.online"));
    expect(external).toBeTruthy();
  });

  it("has external Docs link", () => {
    renderNav("/", WITH_AUTH);
    const docsLinks = screen.getAllByText("Docs");
    const external = docsLinks.find((el) => el.closest("a")?.getAttribute("href")?.includes("/docs"));
    expect(external).toBeTruthy();
  });
});
