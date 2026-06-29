import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AGENT_URL, API_URL, getSession } from "../lib/api";
import { Nav } from "../components/Nav";
import { ChatMessage } from "../components/ChatMessage";
import { DeployLog } from "../components/DeployLog";
import { MyAppsConsole } from "../components/MyAppsConsole";
import { Segmented } from "../components/studio/Segmented";
import { SettingsPanel } from "../components/studio/SettingsPanel";
import { Toolbar } from "../components/studio/Toolbar";
import { CopyLogButton } from "../components/studio/CopyLogButton";
import { PublishModal } from "../components/studio/PublishModal";
import type { StudioSettings } from "../components/studio/types";
import { useAuth } from "../hooks/useAuth";
import { useAgent, type AIConfig } from "../hooks/useAgent";
import { useSpeech } from "../hooks/useSpeech";
import { PROVIDERS, MODEL_OPTIONS, fetchVaultStatus, getKey, getDefaultProvider, toVaultProvider, type VaultKeyStatus } from "../lib/ai-keys";

export function Create() {
  const { user, loading, signIn } = useAuth();
  const agent = useAgent();
  const speech = useSpeech();
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  // The URL is the source of truth for which view: /create/:id → that app's chat,
  // bare /create → the My Apps console.
  const view: "console" | "chat" = routeId ? "chat" : "console";
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // getDefaultProvider drops a stale provider (e.g. legacy "github") that's no
  // longer offered. Ensure the stored model is valid for the chosen provider.
  const [provider, setProvider] = useState(getDefaultProvider);
  const [model, setModel] = useState(() => {
    const p = getDefaultProvider();
    const stored = localStorage.getItem("fas_model");
    const valid = MODEL_OPTIONS[p]?.some((m) => m.value === stored);
    return valid ? stored! : MODEL_OPTIONS[p]?.[0]?.value || "anthropic/claude-sonnet-4";
  });
  const [temperature, setTemperature] = useState(0.7);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [vaultKeys, setVaultKeys] = useState<VaultKeyStatus[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat");
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishResult, setPublishResult] = useState<{ url: string; audit: { pass: number; fail: number } | null } | null>(null);
  const wasStreamingRef = useRef(false);

  // Sync the URL's route id into the selected project.
  // The route id can be either a session UUID or an app slug.
  // If it's an app slug, find the session for that app or create one
  // (only if the user owns the app).
  const resolvedSlugRef = useRef<string | null>(null);
  useEffect(() => {
    if (!routeId) return;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(routeId);
    if (isUUID) {
      if (routeId !== agent.currentProjectId) agent.switchProject(routeId);
      return;
    }
    // App slug — skip if we already resolved this slug
    if (resolvedSlugRef.current === routeId) return;
    // Wait for projects to load and user to be signed in
    if (agent.projectsLoading || !user) return;
    const existing = agent.projects.find((p) => p.appId === routeId);
    if (existing) {
      resolvedSlugRef.current = routeId;
      navigate(`/create/${existing.id}`, { replace: true });
    } else {
      // Verify the user owns this app before creating a session for it
      resolvedSlugRef.current = routeId;
      const s = getSession();
      if (!s?.token) { navigate("/create", { replace: true }); return; }
      fetch(`${API_URL}/v1/apps/mine`, { headers: { Authorization: `Bearer ${s.token}` } })
        .then((r) => r.ok ? r.json() : { apps: [] })
        .then((data: { apps?: { id: string }[] }) => {
          const owns = data.apps?.some((a) => a.id === routeId);
          if (!owns) {
            // User doesn't own this app — redirect to dashboard instead of creating a session
            navigate("/", { replace: true });
            return;
          }
          const sessionId = agent.createProject(routeId, routeId);
          // Import the app's source code from GitHub into the new session
          fetch(`${AGENT_URL}/session/${sessionId}/import`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${s.token}` },
            body: JSON.stringify({ appId: routeId }),
          }).catch(() => { /* best-effort */ });
          navigate(`/create/${sessionId}`, { replace: true });
        })
        .catch(() => { navigate("/create", { replace: true }); });
    }
  }, [routeId, agent.currentProjectId, agent.projects, agent.projectsLoading, user, navigate]);

  // Auto-speak: when a turn finishes (streaming true→false) and auto-speak is
  // on, read the latest assistant message aloud.
  useEffect(() => {
    if (wasStreamingRef.current && !agent.isStreaming && speech.enabled && speech.autoSpeak) {
      const msgs = agent.messages;
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === "assistant" && msgs[i].content.trim()) {
          speech.speak(`msg-${i}`, msgs[i].content);
          break;
        }
      }
    }
    wasStreamingRef.current = agent.isStreaming;
  }, [agent.isStreaming, agent.messages, speech]);

  // Refetch vault status whenever the signed-in user changes (including on
  // post-OAuth-redirect transitions, where the token arrives after Create
  // already mounted). Without [user?.id] this only ran once with no token.
  useEffect(() => {
    if (!user) { setVaultKeys([]); return; }
    fetchVaultStatus().then(setVaultKeys);
  }, [user?.id]);
  // Once the vault loads, if the selected provider has no usable key, switch to
  // whichever provider DOES have a key — don't sit on an empty default. Runs once
  // per load so it never fights a deliberate provider switch (e.g. to add a key).
  const didAutoSelectRef = useRef(false);
  useEffect(() => {
    if (didAutoSelectRef.current || !user || vaultKeys.length === 0) return;
    didAutoSelectRef.current = true;
    const hasKey = (t: string) => vaultKeys.some((k) => k.provider === toVaultProvider(t));
    const cfg = PROVIDERS.find((p) => p.type === provider);
    if (cfg?.free || hasKey(provider) || getKey(provider)) return; // current already usable
    const available = PROVIDERS.find((p) => p.free || hasKey(p.type));
    if (available) {
      setProvider(available.type);
      setModel(MODEL_OPTIONS[available.type]?.[0]?.value || model);
    }
  }, [vaultKeys, user]);
  useEffect(() => { speech.cancel(); }, [agent.currentProjectId]);

  const vaultMap = new Map(vaultKeys.map((k) => [k.provider, k]));
  const providerCfg = PROVIDERS.find((p) => p.type === provider);
  const hasVaultKey = vaultMap.has(toVaultProvider(provider));
  const isFreeProvider = !!providerCfg?.free;
  const keyReady = isFreeProvider || hasVaultKey || !!getKey(provider);
  const keyStatus = isFreeProvider
    ? { color: "var(--success)", label: "Free · no key needed" }
    : hasVaultKey
    ? { color: "var(--success)", label: "Key in vault" }
    : { color: "var(--warning)", label: "No key — add one" };
  const settings: StudioSettings = {
    provider, setProvider, model, setModel, temperature, setTemperature,
    keyReady, keyStatus,
    voiceEnabled: speech.enabled, voiceSupported: speech.supported, setVoiceEnabled: speech.setEnabled,
  };
  useEffect(() => {
    const behavior = agent.messages.length <= 1 ? "instant" : "smooth";
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: behavior as ScrollBehavior }), 50);
  }, [agent.messages]);
  // On app switch / after history loads, jump straight to the latest message.
  useEffect(() => {
    if (agent.isLoadingHistory) return;
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "instant" as ScrollBehavior }), 60);
  }, [agent.currentProjectId, agent.isLoadingHistory]);
  // Show only the last 10 messages per app; "Load older" reveals 10 more.
  useEffect(() => { setVisibleCount(10); }, [agent.currentProjectId]);
  useEffect(() => { localStorage.setItem("fas_provider", provider); }, [provider]);
  useEffect(() => { localStorage.setItem("fas_model", model); }, [model]);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: "100dvh" }}>
        <div className="text-center">
          <div className="inline-block w-6 h-6 border-2 rounded-full animate-spin mb-3" style={{ borderColor: "var(--line)", borderTopColor: "var(--accent)" }} />
          <p className="text-sm" style={{ color: "var(--muted)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  const handleSend = async () => {
    const msg = inputValue.trim();
    if (!msg || agent.isStreaming) return;
    // Send any local key we still have (legacy fallback). If empty, the agent
    // worker resolves the key from the platform vault server-side using the
    // user's auth token — so keys never need to be retyped after Profile setup.
    const key = getKey(provider);
    setInputValue("");
    await agent.sendMessage(msg, { provider, model, apiKey: key, temperature, maxTokens: 16384 } as AIConfig);
  };

  const currentProject = agent.projects.find((p) => p.id === agent.currentProjectId);
  const appId = currentProject?.appId;
  const previewUrl = currentProject?.appUrl
    || agent.deployState?.appUrl
    || (appId ? `https://${appId}.freeappstore.online` : null);
  const showPreview = !!previewUrl;

  if (!user) {
    return (
      <>
        <Nav />
        <main className="flex flex-col items-center justify-center text-center" style={{ minHeight: "60vh", padding: "2rem 1.25rem", maxWidth: 640, margin: "0 auto" }}>
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight mb-3" style={{ color: "var(--ink-strong)" }}>VibeCode</h1>
          <p className="text-base sm:text-lg mb-6 sm:mb-8" style={{ color: "var(--muted)", maxWidth: 480 }}>
            Describe the app you want. An AI agent builds it, deploys it, and you get a live app on FreeAppStore — in minutes.
          </p>
          <button onClick={signIn} className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white" style={{ background: "var(--accent)" }}>
            Sign in with GitHub to start
          </button>
          <p className="text-sm mt-3" style={{ color: "var(--muted)" }}>Sign in, add your AI provider key, and start building.</p>
        </main>
      </>
    );
  }

  // Console view — My Apps with search
  if (view === "console") {
    return (
      <div className="full-height-page flex flex-col" style={{ overflow: "hidden" }}>
        <div className="shrink-0"><Nav /></div>
        <MyAppsConsole
          projects={agent.projects}
          loading={agent.projectsLoading}
          error={agent.projectsError}
          onRetry={agent.reloadProjects}
          currentId={agent.currentProjectId}
          onSelect={(id) => navigate(`/create/${id}`)}
          onNewChat={() => { const id = agent.createProject("New App"); navigate(`/create/${id}`); }}
        />
      </div>
    );
  }

  return (
    <div className="full-height-page flex flex-col" style={{ overflow: "hidden" }}>
      {/* Desktop nav */}
      <div className="hidden md:block shrink-0"><Nav /></div>

      {/* Mobile studio bar — single bar: back to apps · Code/Preview switch · settings */}
      <div className="flex md:hidden shrink-0 items-center gap-2" style={{ padding: "0.4rem 0.5rem", borderBottom: "1px solid var(--line)", background: "var(--panel)" }}>
        <button onClick={() => navigate("/")} title="Back to My Apps" aria-label="Back to My Apps" style={{ width: 40, height: 40, flexShrink: 0, background: "none", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", cursor: "pointer", color: "var(--ink)", fontSize: "1.1rem", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          &#8592;
        </button>
        <Segmented
          value={mobileTab}
          onChange={setMobileTab}
          options={[{ value: "chat", label: "Code" }, { value: "preview", label: previewUrl ? "Preview ●" : "Preview" }]}
        />
        <div className="shrink-0"><CopyLogButton agent={agent} provider={provider} model={model} /></div>
        <button onClick={() => setSettingsOpen(!settingsOpen)} title="Settings" aria-label="Settings" aria-expanded={settingsOpen} style={{ width: 40, height: 40, flexShrink: 0, background: settingsOpen ? "var(--accent-soft)" : "none", border: `1px solid ${settingsOpen ? "var(--accent)" : "var(--line)"}`, borderRadius: "var(--radius-sm)", cursor: "pointer", color: settingsOpen ? "var(--accent)" : "var(--ink)", fontSize: "1.05rem", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          &#9881;
        </button>
      </div>
      {/* Mobile settings (shared panel) */}
      <div className="md:hidden shrink-0">{settingsOpen && <SettingsPanel {...settings} />}</div>

      <div className="grid flex-1 min-h-0 grid-cols-1 md:grid-cols-2">
        {/* Chat */}
        <div className={`flex flex-col overflow-hidden border-r ${mobileTab !== "chat" ? "hidden md:flex" : ""}`} style={{ borderColor: "var(--line)" }}>
          {/* Desktop toolbar (mobile uses the studio bar above) */}
          <div className="hidden md:block">
            <Toolbar
              agent={agent}
              settings={settings}
              settingsOpen={settingsOpen} setSettingsOpen={setSettingsOpen}
              onBackToConsole={() => navigate("/")}
              onPickProject={(id: string) => navigate(`/create/${id}`)}
              onCreateProject={(name: string, appId?: string) => { const id = agent.createProject(name, appId); navigate(`/create/${id}`); }}
            />
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2" style={{ minHeight: 0 }}>
            <div className="flex-1" />
            {agent.historyError && agent.messages.length <= 1 ? (
              <div className="self-center text-center py-8">
                <p className="text-sm font-semibold mb-1">Couldn't load this conversation</p>
                <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>Connection issue — your history is safe on the server.</p>
                <button onClick={() => agent.retryHistory()} className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "var(--accent)", border: "none", cursor: "pointer" }}>
                  Retry
                </button>
              </div>
            ) : agent.isLoadingHistory && agent.messages.length <= 1 ? (
              <div className="self-center text-center py-8">
                <div className="inline-block w-5 h-5 border-2 rounded-full animate-spin mb-2" style={{ borderColor: "var(--line)", borderTopColor: "var(--accent)" }} />
                <p className="text-xs" style={{ color: "var(--muted)" }}>Loading conversation…</p>
              </div>
            ) : (
              (() => {
                const total = agent.messages.length;
                const start = Math.max(0, total - visibleCount);
                return (
                  <>
                    {start > 0 && (
                      <button
                        onClick={() => setVisibleCount((c) => c + 10)}
                        className="self-center text-xs font-semibold mb-1 px-3 py-1.5 rounded-full"
                        style={{ background: "var(--panel)", border: "1px solid var(--line)", color: "var(--muted)", cursor: "pointer" }}
                      >
                        Load {Math.min(10, start)} older {start === 1 ? "message" : "messages"}
                      </button>
                    )}
                    {agent.messages.slice(start).map((m, i) => {
                      const id = `msg-${start + i}`;
                      return (
                        <ChatMessage
                          key={id}
                          role={m.role}
                          content={m.content}
                          canSpeak={speech.supported}
                          speaking={speech.speakingId === id}
                          onSpeak={() => speech.speak(id, m.content)}
                        />
                      );
                    })}
                  </>
                );
              })()
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex gap-2 shrink-0" style={{ padding: "0.5rem 0.75rem", borderTop: "1px solid var(--line)", background: "var(--panel)" }}>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Build me a meditation timer..."
              aria-label="Describe the app you want to build"
              rows={1}
              className="flex-1 resize-none"
              style={{ border: "1px solid var(--line)", borderRadius: "0.5rem", padding: "0.55rem 0.7rem", background: "var(--paper)", color: "var(--ink)", fontSize: "1rem", minHeight: 44, maxHeight: 120, fontFamily: "inherit" }}
            />
            <button onClick={handleSend} disabled={agent.isStreaming} className="self-end inline-flex items-center justify-center" title="Send" aria-label="Send" style={{ minHeight: 44, minWidth: 44, padding: "0.55rem 0.9rem", background: "var(--accent)", color: "white", border: "none", borderRadius: "var(--radius-sm)", fontWeight: 600, fontSize: "1.1rem", cursor: "pointer", opacity: agent.isStreaming ? 0.5 : 1 }}>
              <span aria-hidden>↑</span>
            </button>
          </div>
        </div>
        {/* Preview */}
        <div className={`flex flex-col overflow-hidden ${mobileTab !== "preview" ? "hidden md:flex" : ""}`}>
          <div className="flex items-center gap-2 shrink-0" style={{ padding: "0.35rem 0.75rem", borderBottom: "1px solid var(--line)", background: "var(--panel)", fontSize: "0.78rem" }}>
            {previewUrl ? (
              <>
                {/* The URL is the open affordance — opens in a new tab. No separate "Open" button. */}
                <a href={previewUrl} target="_blank" rel="noopener" className="text-xs truncate" style={{ color: "var(--accent)", fontFamily: "monospace", minWidth: 0, flex: 1 }}>
                  {previewUrl.replace("https://", "")} ↗
                </a>
                {appId && (
                  <button onClick={() => navigate(`/manage/${appId}/keys`)} title="Manage this app's API keys" className="text-xs font-semibold shrink-0" style={{ color: "var(--muted)", background: "none", border: "none", cursor: "pointer" }}>APIs</button>
                )}
                {publishResult ? (
                  <a href={publishResult.url} target="_blank" rel="noopener" className="text-xs px-2 py-0.5 rounded-full font-semibold shrink-0" style={{ background: "var(--success)", color: "white", textDecoration: "none" }}>Live</a>
                ) : (
                  <button onClick={() => setPublishOpen(true)} className="text-xs px-2 py-0.5 rounded-full font-semibold shrink-0" style={{ background: "var(--accent)", color: "white", border: "none", cursor: "pointer" }}>Publish</button>
                )}
              </>
            ) : (
              <span className="text-xs" style={{ color: "var(--muted)" }}>No preview yet</span>
            )}
          </div>
          {publishResult && (
            <div className="flex items-center gap-2 shrink-0 text-xs" style={{ padding: "0.35rem 0.75rem", background: "color-mix(in srgb, var(--success) 10%, var(--panel))", borderBottom: "1px solid var(--line)" }}>
              <span style={{ color: "var(--success)" }}>●</span>
              <span>Published at <a href={publishResult.url} target="_blank" rel="noopener" className="font-semibold" style={{ color: "var(--accent)" }}>{publishResult.url.replace("https://", "")}</a></span>
              {publishResult.audit && <span style={{ color: "var(--muted)" }}>· Audit: {publishResult.audit.pass} pass{publishResult.audit.fail > 0 ? `, ${publishResult.audit.fail} fail` : ""}</span>}
            </div>
          )}
          <div className="flex-1 flex items-center justify-center" style={{ background: "#0f0f0f", minHeight: 0, overflow: "hidden" }}>
            {showPreview ? <iframe src={previewUrl} title="Preview" sandbox="allow-scripts allow-same-origin" className="w-full h-full border-0" style={{ background: "#0f0f0f" }} /> :
             agent.deployState ? <DeployLog state={agent.deployState} /> :
             <div className="text-center p-8" style={{ color: "var(--muted)" }}><p>Your app will appear here once deployed.</p></div>}
          </div>
        </div>
      </div>
      {publishOpen && appId && (
        <PublishModal
          appId={appId}
          appName={currentProject?.name || appId}
          onClose={() => setPublishOpen(false)}
          onPublished={(url, audit) => setPublishResult({ url, audit })}
        />
      )}
    </div>
  );
}
