import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../lib/theme";

function ThemeToggle() {
  const { pref, cycle } = useTheme();
  const icon = pref === "dark" ? "\u263D" : pref === "light" ? "\u2600\uFE0E" : "\u25D1";
  const label = pref === "system" ? "Theme: system" : pref === "light" ? "Theme: light" : "Theme: dark";
  return (
    <button
      onClick={cycle}
      title={label}
      aria-label={label}
      style={{
        width: 36, height: 36, borderRadius: "999px", border: "1px solid var(--line)",
        background: "var(--panel)", color: "var(--ink)", cursor: "pointer", fontSize: "0.95rem",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <span aria-hidden>{icon}</span>
    </button>
  );
}

const TABS = [
  { to: "/", label: "Home", icon: "\u2302" },
  { to: "/create", label: "Create", icon: "+" },
  { to: "/publish", label: "Publish", icon: "\u2191" },
  { to: "/profile", label: "Profile", icon: "\u2699" },
];

const DESKTOP_LINKS = [
  { to: "/", label: "Dashboard" },
  { to: "/create", label: "Create" },
  { to: "/publish", label: "Publish" },
  { to: "https://freeappstore.online", label: "Store", external: true },
  { to: "https://freeappstore.online/docs", label: "Docs", external: true },
];

export function Nav() {
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const { user, signIn, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!avatarMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [avatarMenuOpen]);

  const isActive = (to: string) => {
    if (to === "/") return location.pathname === "/" || location.pathname === "/dashboard";
    return location.pathname.startsWith(to);
  };

  return (
    <>
      {/* Top bar — desktop: full nav, mobile: brand + theme + avatar */}
      <header className="border-b" style={{ borderColor: "var(--line)", padding: "0.5rem 0" }}>
        <div className="container flex items-center justify-between">
          <Link to="/" className="font-display text-xl sm:text-2xl font-extrabold tracking-tight no-underline" style={{ color: "var(--ink-strong)" }}>
            Free<span style={{ color: "var(--accent)" }}>AppStore</span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden sm:flex items-center gap-5">
            <ThemeToggle />
            {DESKTOP_LINKS.map((link) =>
              link.external ? (
                <a key={link.to} href={link.to} className="text-sm font-semibold no-underline" style={{ color: "var(--muted)" }}>{link.label}</a>
              ) : (
                <Link key={link.to} to={link.to} className="text-sm font-semibold no-underline" style={{ color: isActive(link.to) ? "var(--ink)" : "var(--muted)" }}>{link.label}</Link>
              ),
            )}
            {user ? (
              <div ref={avatarRef} style={{ position: "relative" }}>
                <button onClick={() => setAvatarMenuOpen(!avatarMenuOpen)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  <img src={user.avatarUrl || ""} alt={user.login} className="rounded-full border-2" style={{ width: 28, height: 28, borderColor: avatarMenuOpen ? "var(--accent)" : "var(--line)" }} />
                </button>
                {avatarMenuOpen && (
                  <div className="absolute right-0 mt-2 rounded-xl border shadow-lg" style={{ background: "var(--panel)", borderColor: "var(--line)", width: 200, zIndex: 100, padding: "0.5rem 0" }}>
                    <div className="px-3 py-2" style={{ borderBottom: "1px solid var(--line)" }}>
                      <div className="text-sm font-semibold truncate">{user.login}</div>
                      <div className="text-xs" style={{ color: "var(--muted)" }}>GitHub</div>
                    </div>
                    <button onClick={() => { setAvatarMenuOpen(false); navigate("/profile"); }} className="w-full text-left px-3 py-2 text-sm" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink)" }}>Profile & Settings</button>
                    <button onClick={() => { setAvatarMenuOpen(false); navigate("/admin"); }} className="w-full text-left px-3 py-2 text-sm" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink)" }}>Admin</button>
                    <button onClick={() => { setAvatarMenuOpen(false); navigate("/admin/data"); }} className="w-full text-left px-3 py-2 text-sm" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink)" }}>Platform Data</button>
                    <div style={{ borderTop: "1px solid var(--line)", margin: "0.25rem 0" }} />
                    <button onClick={() => { setAvatarMenuOpen(false); signOut(); navigate("/"); }} className="w-full text-left px-3 py-2 text-sm" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--error)" }}>Sign out</button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={signIn} className="text-sm font-semibold" style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}>Sign in</button>
            )}
          </nav>

          {/* Mobile top-right: theme + sign in/avatar */}
          <div className="flex items-center gap-2 sm:hidden">
            <ThemeToggle />
            {user ? (
              <button onClick={() => navigate("/profile")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                <img src={user.avatarUrl || ""} alt={user.login} className="rounded-full" style={{ width: 28, height: 28, border: "2px solid var(--line)" }} />
              </button>
            ) : (
              <button onClick={signIn} className="text-sm font-semibold" style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}>Sign in</button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 sm:hidden"
        style={{
          background: "var(--panel)",
          borderTop: "1px solid var(--line)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="flex">
          {TABS.map((tab) => {
            const active = isActive(tab.to);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className="flex-1 flex flex-col items-center gap-0.5 py-2 no-underline min-h-[48px] justify-center"
                style={{ color: active ? "var(--accent)" : "var(--muted)" }}
              >
                <span className="text-lg leading-none" aria-hidden>{tab.icon}</span>
                <span className="text-[10px] font-semibold">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
