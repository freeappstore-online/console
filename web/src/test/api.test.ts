import { describe, expect, it, vi, beforeEach } from "vitest";

beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem(k: string) { return store.get(k) ?? null; },
    setItem(k: string, v: string) { store.set(k, v); },
    removeItem(k: string) { store.delete(k); },
  });
});

describe("getSession", () => {
  it("returns null when no session stored", async () => {
    const { getSession } = await import("../lib/api");
    expect(getSession()).toBeNull();
  });

  it("returns session from localStorage", async () => {
    const session = { token: "tok", user: { id: "gh:1", login: "alice", avatarUrl: null } };
    localStorage.setItem("fas:session", JSON.stringify(session));
    const { getSession } = await import("../lib/api");
    expect(getSession()?.user.login).toBe("alice");
  });
});

describe("getSignInUrl", () => {
  it("builds correct v1 auth URL", async () => {
    const { getSignInUrl } = await import("../lib/api");
    const url = getSignInUrl("https://create.freeappstore.online");
    expect(url).toContain("/v1/auth/github/start");
    expect(url).toContain("app_id=console");
    expect(url).toContain("return_to=");
  });
});

describe("signOut", () => {
  it("clears session from localStorage", async () => {
    localStorage.setItem("fas:session", '{"token":"x","user":{}}');
    const { signOut } = await import("../lib/api");
    signOut();
    expect(localStorage.getItem("fas:session")).toBeNull();
  });
});
