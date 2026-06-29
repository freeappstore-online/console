import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthContext, useAuthProvider } from "./hooks/useAuth";
import { Dashboard } from "./pages/Dashboard";
import { Create } from "./pages/Create";
import { Profile } from "./pages/Profile";
import { Publish } from "./pages/Publish";
import { Admin } from "./pages/Admin";
import { AppKeys } from "./pages/AppKeys";
import { Manage, DataAdmin } from "./pages/Manage";

// Mount prefix from the <base href> injected in index.html: "/app/" when proxied via
// freeappstore.online/app/, "/" on console.freeappstore.online. Router basename must match
// so absolute route paths resolve under the prefix without escaping the proxy.
const baseHref = document.querySelector("base")?.getAttribute("href") ?? "/";
const basename = baseHref.replace(/\/$/, "") || undefined;

export default function App() {
  const auth = useAuthProvider();

  return (
    <AuthContext.Provider value={auth}>
      <BrowserRouter basename={basename}>
        <Routes>
          {/* Dashboard — app list, stats */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* VibeCode — AI app builder */}
          <Route path="/create" element={<Create />} />
          <Route path="/create/:id" element={<Create />} />

          {/* App management — roles, secrets, webhooks, logs */}
          <Route path="/manage/:id" element={<Manage />} />
          <Route path="/manage/:id/keys" element={<AppKeys />} />

          {/* Publish to store */}
          <Route path="/publish" element={<Publish />} />

          {/* Profile — AI settings, voice, notifications */}
          <Route path="/profile" element={<Profile />} />

          {/* Admin — platform monitoring */}
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/data" element={<DataAdmin />} />

          {/* Legacy redirects from create.freeappstore.online */}
          <Route path="/app/:id" element={<LegacyAppRedirect />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

/** Redirect /app/:id (old create/ URL) to /create/:id */
function LegacyAppRedirect() {
  const { id } = useParams();
  return <Navigate to={`/create/${id ?? ""}`} replace />;
}
