"use client";

import {
  Activity,
  AlertCircle,
  BarChart3,
  Bell,
  Boxes,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CircleDollarSign,
  Database,
  FileText,
  Gauge,
  Globe2,
  KeyRound,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Server,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  WalletCards,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Summary = {
  request_count: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  errors: number;
};

type Project = {
  id: string;
  name: string;
  team_id?: string;
  owner_user_id?: string;
  status: string;
  default_quota_ref?: string;
  created_at?: string;
};

type APIKey = {
  id: string;
  project_id: string;
  name: string;
  key_prefix: string;
  key_suffix: string;
  allowed_models: string[];
  status: string;
  limits?: Record<string, number>;
  expires_at?: string;
  last_used_at?: string;
};

type Provider = {
  id: string;
  name: string;
  type: string;
  base_url?: string;
  status: string;
  healthy: boolean;
  priority: number;
};

type Model = {
  id: string;
  name: string;
  family: string;
  modality: string;
  context_window?: number;
  status: string;
  input_price_usd_per_1m?: number;
  output_price_usd_per_1m?: number;
  embedding_price_usd_per_1m?: number;
};

type ModelRoute = {
  id: string;
  model_name: string;
  provider_id: string;
  provider_model: string;
  priority: number;
  weight: number;
  status: string;
  strategy?: string;
  last_used_at?: string;
};

type AdminResource = {
  id: string;
  kind: string;
  name: string;
  description?: string;
  status: string;
  fields?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

type AdminUser = {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  team_id?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  last_login_at?: string;
};

type AlertEvent = {
  id: string;
  severity: string;
  code: string;
  message: string;
  scope_type?: string;
  scope_id?: string;
  created_at: string;
};

type RequestLog = {
  id: string;
  request_id: string;
  project_id: string;
  api_key_id: string;
  model: string;
  provider_id?: string;
  provider_model?: string;
  status_code: number;
  error_code?: string;
  latency_ms: number;
  created_at: string;
};

type UsageBreakdownRow = {
  id: string;
  request_count: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
};

type UsageBreakdown = {
  projects: UsageBreakdownRow[];
  models: UsageBreakdownRow[];
  providers: UsageBreakdownRow[];
};

type UsagePoint = {
  date: string;
  request_count: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
};

type ViewKey =
  | "overview"
  | "gateway"
  | "providers"
  | "provider-accounts"
  | "models"
  | "routes"
  | "projects"
  | "api-keys"
  | "teams"
  | "users"
  | "quota-policies"
  | "usage"
  | "billing"
  | "audit"
  | "monitors"
  | "alerts"
  | "security-policies"
  | "proxies"
  | "announcements"
  | "settings";

type FieldType = "text" | "number" | "password" | "textarea" | "select" | "tags";

type FieldConfig = {
  key: string;
  label: string;
  type?: FieldType;
  options?: string[];
  placeholder?: string;
  required?: boolean;
};

type ColumnConfig<T> = {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
};

type ResourceConfig<T> = {
  view: ViewKey;
  title: string;
  eyebrow: string;
  description: string;
  createLabel?: string;
  columns: ColumnConfig<T>[];
  fields: FieldConfig[];
  list: (ctx: AppData) => T[];
  create?: (ctx: ApiContext, values: Record<string, string>) => Promise<void>;
  update?: (ctx: ApiContext, item: T, values: Record<string, string>) => Promise<void>;
  remove?: (ctx: ApiContext, item: T) => Promise<void>;
  toForm?: (item: T) => Record<string, string>;
};

type AppData = {
  summary: Summary;
  projects: Project[];
  keys: APIKey[];
  providers: Provider[];
  models: Model[];
  routes: ModelRoute[];
  logs: RequestLog[];
  alerts: AlertEvent[];
  users: AdminUser[];
  breakdown: UsageBreakdown;
  timeseries: UsagePoint[];
  resources: Record<string, AdminResource[]>;
};

type ApiContext = {
  baseURL: string;
  adminToken: string;
};

type ModalState<T> = {
  config: ResourceConfig<T>;
  item?: T;
};

type ConfirmState<T> = {
  config: ResourceConfig<T>;
  item: T;
};

const defaultBaseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
const sessionStorageKey = "tokenhub.admin.session";

const resourceKinds = [
  "teams",
  "provider-accounts",
  "quota-policies",
  "monitors",
  "proxies",
  "announcements",
  "settings",
  "security-policies",
  "alert-rules",
];

const navGroups: Array<{
  title: string;
  items: Array<{ view: ViewKey; label: string; icon: typeof Activity }>;
}> = [
  {
    title: "总览",
    items: [
      { view: "overview", label: "网关概览", icon: LayoutDashboard },
      { view: "gateway", label: "统一 API 网关", icon: Sparkles },
    ],
  },
  {
    title: "AI 接入",
    items: [
      { view: "providers", label: "Provider 渠道", icon: Server },
      { view: "provider-accounts", label: "Provider 账号", icon: Globe2 },
      { view: "models", label: "模型目录", icon: Boxes },
      { view: "routes", label: "路由策略", icon: Gauge },
    ],
  },
  {
    title: "企业治理",
    items: [
      { view: "projects", label: "项目空间", icon: LayoutDashboard },
      { view: "api-keys", label: "API Key", icon: KeyRound },
      { view: "teams", label: "团队分组", icon: Users },
      { view: "users", label: "用户管理", icon: Users },
      { view: "quota-policies", label: "额度策略", icon: CircleDollarSign },
    ],
  },
  {
    title: "成本审计",
    items: [
      { view: "usage", label: "用量统计", icon: BarChart3 },
      { view: "billing", label: "成本账单", icon: WalletCards },
      { view: "audit", label: "请求审计", icon: FileText },
      { view: "monitors", label: "健康监控", icon: Activity },
      { view: "alerts", label: "告警规则", icon: AlertCircle },
    ],
  },
  {
    title: "安全运维",
    items: [
      { view: "security-policies", label: "安全策略", icon: ShieldCheck },
      { view: "proxies", label: "代理出口", icon: Server },
      { view: "announcements", label: "公告通知", icon: Bell },
      { view: "settings", label: "系统设置", icon: Settings },
    ],
  },
];

const standaloneViewMeta: Partial<Record<ViewKey, { title: string; description: string }>> = {
  overview: {
    title: "网关概览",
    description: "统一查看 TokenHub 的请求、成本、Provider 和治理状态。",
  },
  gateway: {
    title: "统一 API 网关",
    description: "OpenAI Compatible 入口、认证、路由和治理链路。",
  },
  usage: {
    title: "用量统计",
    description: "按模型、项目和日期查看请求量、Token 和成本归因。",
  },
  billing: {
    title: "成本账单",
    description: "按 Provider 和项目归集估算成本，辅助成本分摊。",
  },
  audit: {
    title: "请求审计",
    description: "查看最近请求日志、状态码、模型路由和延迟。",
  },
};

export default function AdminHome() {
  const [baseURL, setBaseURL] = useState(defaultBaseURL);
  const [adminToken, setAdminToken] = useState("");
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openNavGroups, setOpenNavGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(navGroups.map((group) => [group.title, true])),
  );
  const [activeView, setActiveView] = useState<ViewKey>("overview");
  const [data, setData] = useState<AppData>(emptyData());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<ModalState<any> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmState<any> | null>(null);
  const [issuedKey, setIssuedKey] = useState("");

  const api = useMemo(() => ({ baseURL, adminToken }), [baseURL, adminToken]);
  const activeConfig = resourceConfigs[activeView];
  const activeMeta = activeConfig ?? standaloneViewMeta[activeView] ?? standaloneViewMeta.overview!;

  useEffect(() => {
    const saved = readSavedSession();
    if (saved) {
      setBaseURL(saved.baseURL);
      setAdminToken(saved.token);
      setCurrentUser(saved.user);
    }
    setBootstrapped(true);
  }, []);

  useEffect(() => {
    if (!bootstrapped || !adminToken || !currentUser) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrapped, adminToken, currentUser]);

  async function load() {
    if (!adminToken) return;
    setLoading(true);
    setError("");
    try {
      const [
        overviewResp,
        keysResp,
        routesResp,
        logsResp,
        breakdownResp,
        timeseriesResp,
        usersResp,
        ...resourceResps
      ] = await Promise.all([
        adminFetch(api, "/api/admin/overview"),
        adminFetch(api, "/api/admin/api-keys"),
        adminFetch(api, "/api/admin/routing-rules"),
        adminFetch(api, "/api/admin/audit/requests"),
        adminFetch(api, "/api/admin/usage/breakdown"),
        adminFetch(api, "/api/admin/usage/timeseries"),
        adminFetch(api, "/api/admin/users"),
        ...resourceKinds.map((kind) => adminFetch(api, `/api/admin/resources/${kind}`)),
      ]);
      for (const [name, resp] of [
        ["overview", overviewResp],
        ["api-keys", keysResp],
        ["routes", routesResp],
        ["audit", logsResp],
        ["breakdown", breakdownResp],
        ["timeseries", timeseriesResp],
        ["users", usersResp],
        ...resourceKinds.map((kind, index) => [kind, resourceResps[index]] as const),
      ] as const) {
        if (!resp.ok) {
          if (resp.status === 401) {
            clearSavedSession();
            setAdminToken("");
            setCurrentUser(null);
          }
          throw new Error(`${name} ${resp.status}`);
        }
      }

      const overview = await overviewResp.json();
      const keys = (await keysResp.json()) as { data: APIKey[] };
      const routes = (await routesResp.json()) as { data: ModelRoute[] };
      const logs = (await logsResp.json()) as { data: RequestLog[] };
      const breakdown = (await breakdownResp.json()) as UsageBreakdown;
      const timeseries = (await timeseriesResp.json()) as { data: UsagePoint[] };
      const users = (await usersResp.json()) as { data: AdminUser[] };
      const resources: Record<string, AdminResource[]> = {};
      for (let i = 0; i < resourceKinds.length; i++) {
        const payload = (await resourceResps[i].json()) as { data: AdminResource[] };
        resources[resourceKinds[i]] = payload.data ?? [];
      }

      setData({
        summary: overview.summary ?? emptySummary(),
        projects: overview.projects ?? [],
        providers: overview.providers ?? [],
        models: overview.models ?? [],
        alerts: overview.alerts ?? [],
        keys: keys.data ?? [],
        routes: routes.data ?? [],
        logs: logs.data ?? [],
        breakdown,
        timeseries: timeseries.data ?? [],
        users: users.data ?? [],
        resources,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "连接失败");
    } finally {
      setLoading(false);
    }
  }

  async function login(identity: string, password: string) {
    setLoading(true);
    setError("");
    try {
      const resp = await fetch(`${baseURL.replace(/\/$/, "")}/api/admin/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identity, password }),
      });
      if (!resp.ok) throw new Error(`login ${resp.status}`);
      const payload = (await resp.json()) as { token: string; user: AdminUser; expires_at: string };
      setAdminToken(payload.token);
      setCurrentUser(payload.user);
      saveSession({ baseURL, token: payload.token, user: payload.user, expiresAt: payload.expires_at });
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    if (adminToken) {
      await adminFetch(api, "/api/admin/auth/logout", { method: "POST" }).catch(() => undefined);
    }
    clearSavedSession();
    setAdminToken("");
    setCurrentUser(null);
    setData(emptyData());
    setActiveView("overview");
  }

  async function saveModal(values: Record<string, string>) {
    if (!modal) return;
    setLoading(true);
    setError("");
    try {
      if (modal.item) {
        await modal.config.update?.(api, modal.item, values);
      } else {
        await modal.config.create?.(api, values);
      }
      setModal(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setLoading(false);
    }
  }

  async function deleteItem<T>(config: ResourceConfig<T>, item: T) {
    if (!config.remove) return;
    setLoading(true);
    setError("");
    try {
      await config.remove(api, item);
      setConfirmDelete(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setLoading(false);
    }
  }

  const viewItems = activeConfig?.list(data) ?? [];
  const filteredItems = filterRows(viewItems, query);
  const crudPagination = usePagination(filteredItems.length, `${activeView}:${query}`);
  const pagedItems = useMemo(
    () => filteredItems.slice(crudPagination.startIndex, crudPagination.endIndex),
    [filteredItems, crudPagination.startIndex, crudPagination.endIndex],
  );

  if (!bootstrapped) {
    return <main className="login-shell" />;
  }

  if (!currentUser) {
    return (
      <LoginView
        loading={loading}
        error={error}
        onLogin={(identity, password) => void login(identity, password)}
      />
    );
  }

  return (
    <main className={sidebarCollapsed ? "app-shell sidebar-collapsed" : "app-shell"}>
      <Sidebar
        activeView={activeView}
        onSelect={setActiveView}
        user={currentUser}
        onLogout={() => void logout()}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
        openGroups={openNavGroups}
        onToggleGroup={(title) =>
          setOpenNavGroups((current) => ({ ...current, [title]: current[title] === false }))
        }
      />

      <section className="workspace">
        <TopNav onSelect={setActiveView} />

        <div className="content-panel">
          <header className="page-header">
            <div>
              <p className="eyebrow">Enterprise AI Gateway</p>
              <h1>{activeMeta.title}</h1>
              <p className="page-desc">{activeMeta.description}</p>
            </div>
          </header>

          {error ? <div className="status-line error">{error}</div> : null}

          <div className="divider" />

          {activeView === "overview" ? (
            <OverviewView data={data} onSelect={setActiveView} />
          ) : activeView === "gateway" ? (
            <GatewayView data={data} />
          ) : activeView === "usage" ? (
            <UsageView data={data} />
          ) : activeView === "billing" ? (
            <BillingView data={data} />
          ) : activeView === "audit" ? (
            <AuditView data={data} />
          ) : activeConfig ? (
            <CrudView
              config={activeConfig}
              items={pagedItems}
              totalItems={filteredItems.length}
              query={query}
              pagination={crudPagination}
              issuedKey={activeView === "api-keys" ? issuedKey : ""}
              onQuery={setQuery}
              onCreate={() => setModal({ config: activeConfig })}
              onEdit={(item) => setModal({ config: activeConfig, item })}
              onDelete={(item) => setConfirmDelete({ config: activeConfig, item })}
            />
          ) : null}
        </div>
      </section>

      {modal ? (
        <EditModal
          state={modal}
          loading={loading}
          onClose={() => setModal(null)}
          onSave={(values) => {
            if (modal.config.view === "api-keys" && !modal.item) {
              void createKeyWithCapture(api, values, setIssuedKey, load, setLoading, setError, setModal);
              return;
            }
            void saveModal(values);
          }}
        />
      ) : null}

      {confirmDelete ? (
        <ConfirmDialog
          title="确认删除"
          message={`删除「${rowTitle(confirmDelete.item)}」后，当前内存数据会立即移除。`}
          loading={loading}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => void deleteItem(confirmDelete.config, confirmDelete.item)}
        />
      ) : null}

    </main>
  );
}

function LoginView({
  loading,
  error,
  onLogin,
}: {
  loading: boolean;
  error: string;
  onLogin: (identity: string, password: string) => void;
}) {
  const [identity, setIdentity] = useState("admin@tokenhub.local");
  const [password, setPassword] = useState("admin123456");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onLogin(identity, password);
  }

  return (
    <main className="login-shell">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">
          <img src="/brand/tokenhub-logo.png" alt="TokenHub" />
          <div>
            <strong>TokenHub</strong>
            <span>Enterprise AI Gateway</span>
          </div>
        </div>

        <div className="login-title">
          <h1>登录控制台</h1>
          <p>企业 AI 访问与成本治理平台</p>
        </div>
        <label className="field">
          <span>账号 / 邮箱</span>
          <input value={identity} onChange={(event) => setIdentity(event.target.value)} required />
        </label>
        <label className="field">
          <span>密码</span>
          <input value={password} type="password" onChange={(event) => setPassword(event.target.value)} required />
        </label>
        {error ? <div className="login-error">{error}</div> : null}
        <button className="button login-submit" disabled={loading} type="submit">
          {loading ? "登录中" : "登录控制台"}
        </button>
      </form>
    </main>
  );
}

function Sidebar({
  activeView,
  onSelect,
  user,
  onLogout,
  collapsed,
  onToggleCollapse,
  openGroups,
  onToggleGroup,
}: {
  activeView: ViewKey;
  onSelect: (view: ViewKey) => void;
  user: AdminUser;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  openGroups: Record<string, boolean>;
  onToggleGroup: (title: string) => void;
}) {
  return (
    <aside className={collapsed ? "sidebar collapsed" : "sidebar"}>
      <div className="brand">
        <img src="/brand/tokenhub-logo.png" alt="TokenHub" className="brand-logo" />
        <span className="brand-name">TokenHub</span>
        <span className="version">v0.2.0</span>
        <button
          className="sidebar-toggle"
          aria-label={collapsed ? "展开菜单" : "折叠菜单"}
          onClick={onToggleCollapse}
          title={collapsed ? "展开菜单" : "折叠菜单"}
          type="button"
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>
      {navGroups.map((group) => {
        const groupOpen = collapsed || openGroups[group.title] !== false;
        return (
          <div className={groupOpen ? "nav-group" : "nav-group closed"} key={group.title}>
            <button
              aria-expanded={groupOpen}
              className={groupOpen ? "nav-title" : "nav-title closed"}
              onClick={() => onToggleGroup(group.title)}
              type="button"
            >
              <span>{group.title}</span>
              <ChevronDown className="nav-chevron" size={14} />
            </button>
            {groupOpen ? (
              <div className="nav">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      className={activeView === item.view ? "nav-item active" : "nav-item"}
                      key={item.view}
                      onClick={() => onSelect(item.view)}
                      title={collapsed ? item.label : undefined}
                      type="button"
                    >
                      <Icon size={17} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
      <div className="sidebar-account">
        <div className="account-avatar">{userInitial(user)}</div>
        <div className="account-meta">
          <strong>{user.name || user.username}</strong>
          <span>{roleLabel(user.role)}</span>
        </div>
        <button className="account-logout" onClick={onLogout} type="button" title="退出登录">
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
}

function TopNav({
  onSelect,
}: {
  onSelect: (view: ViewKey) => void;
}) {
  return (
    <header className="topbar">
      <div className="top-context">
        <strong>TokenHub 控制台</strong>
        <small>Enterprise AI Gateway</small>
      </div>
      <nav className="top-links">
        <button onClick={() => onSelect("gateway")} type="button">调用入口</button>
        <button onClick={() => onSelect("providers")} type="button">Provider</button>
        <button onClick={() => onSelect("routes")} type="button">模型路由</button>
        <button onClick={() => onSelect("api-keys")} type="button">项目 Key</button>
        <button onClick={() => onSelect("usage")} type="button">成本报表</button>
        <button onClick={() => onSelect("audit")} type="button">审计告警</button>
      </nav>
    </header>
  );
}

function OverviewView({
  data,
  onSelect,
}: {
  data: AppData;
  onSelect: (view: ViewKey) => void;
}) {
  const cards = [
    { label: "总请求", value: formatNumber(data.summary.request_count), icon: BarChart3 },
    { label: "总 Token", value: compactNumber(data.summary.total_tokens), icon: Database },
    { label: "总成本", value: `$${formatMoney(data.summary.estimated_cost_usd)}`, icon: CircleDollarSign },
    { label: "Provider", value: formatNumber(data.providers.length), icon: Server },
  ];
  const steps: Array<[string, string, ViewKey]> = [
    ["接入 Provider", "配置 OpenAI、Azure、Claude、Gemini、DeepSeek、Qwen 或本地模型服务。", "providers"],
    ["维护模型目录", "定义内部统一模型名、上下文窗口和计价口径。", "models"],
    ["建立路由策略", "把统一模型映射到 Provider 上游模型，并配置优先级与权重。", "routes"],
    ["发放项目 Key", "按项目、团队、模型白名单和额度发放内部 API Key。", "api-keys"],
    ["审计与治理", "查看请求日志、用量归因、告警规则和安全策略。", "audit"],
  ];

  return (
    <>
      <section className="metrics">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article className="metric compact-metric" key={card.label}>
              <div className="metric-label">
                <Icon size={17} />
                {card.label}
              </div>
              <div className="metric-value">{card.value}</div>
            </article>
          );
        })}
      </section>

      <div className="two-column">
        <DataSection title="产品流程">
          <div className="flow-list">
            {steps.map(([title, desc, view], index) => (
              <button className="flow-row" key={title} onClick={() => onSelect(view)} type="button">
                <span className="step-no">{index + 1}</span>
                <span>
                  <strong>{title}</strong>
                  <small>{desc}</small>
                </span>
              </button>
            ))}
          </div>
        </DataSection>
        <DataSection title="当前状态">
          <SimpleTable
            columns={["对象", "数量", "说明"]}
            rows={[
              ["项目", data.projects.length, "企业内部应用治理单元"],
              ["API Key", data.keys.length, "内部调用凭证"],
              ["模型", data.models.length, "统一模型目录"],
              ["路由", data.routes.length, "Provider 调度规则"],
              ["告警", data.alerts.length, "治理事件"],
            ]}
          />
        </DataSection>
      </div>
    </>
  );
}

function GatewayView({ data }: { data: AppData }) {
  return (
    <div className="two-column">
      <DataSection title="兼容入口">
        <SimpleTable
          columns={["路径", "协议", "状态"]}
          rows={[
            ["/v1/models", "OpenAI Compatible", <StatusPill key="ok" status="active" />],
            ["/v1/chat/completions", "Chat Completions", <StatusPill key="ok" status="active" />],
            ["/v1/responses", "Responses API", <StatusPill key="ok" status="active" />],
            ["/v1/embeddings", "Embeddings", <StatusPill key="ok" status="active" />],
          ]}
        />
      </DataSection>
      <DataSection title="调用链路">
        <SimpleTable
          columns={["阶段", "能力", "数据"]}
          rows={[
            ["认证", "Bearer API Key", `${data.keys.length} keys`],
            ["权限", "模型白名单 + 项目状态", `${data.projects.length} projects`],
            ["路由", "Provider 优先级/健康状态", `${data.routes.length} rules`],
            ["治理", "额度、审计、成本统计", `${data.logs.length} logs`],
          ]}
        />
      </DataSection>
    </div>
  );
}

function UsageView({ data }: { data: AppData }) {
  const modelBreakdown = data.breakdown.models ?? [];
  const cards = [
    { label: "输入 Token", value: compactNumber(data.summary.input_tokens), icon: Activity },
    { label: "输出 Token", value: compactNumber(data.summary.output_tokens), icon: Gauge },
    { label: "错误请求", value: formatNumber(data.summary.errors), icon: AlertCircle },
    { label: "成本", value: `$${formatMoney(data.summary.estimated_cost_usd)}`, icon: CircleDollarSign },
  ];
  return (
    <>
      <section className="metrics">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article className="metric compact-metric" key={card.label}>
              <div className="metric-label">
                <Icon size={17} />
                {card.label}
              </div>
              <div className="metric-value">{card.value}</div>
            </article>
          );
        })}
      </section>
      <DataSection title="模型调用趋势">
        <UsageBarChart data={data.timeseries} />
      </DataSection>
      <div className="two-column">
        <DataSection title="模型用量">
          <SimpleTable
            columns={["模型", "请求", "Token", "成本"]}
            paginationKey="usage-models"
            rows={modelBreakdown.map((row) => [
              row.id,
              formatNumber(row.request_count),
              compactNumber(row.total_tokens),
              `$${formatMoney(row.estimated_cost_usd)}`,
            ])}
          />
        </DataSection>
        <DataSection title="项目归因">
          <SimpleTable
            columns={["项目", "请求", "Token", "成本"]}
            paginationKey="usage-projects"
            rows={(data.breakdown.projects ?? []).map((row) => [
              row.id,
              formatNumber(row.request_count),
              compactNumber(row.total_tokens),
              `$${formatMoney(row.estimated_cost_usd)}`,
            ])}
          />
        </DataSection>
      </div>
    </>
  );
}

function BillingView({ data }: { data: AppData }) {
  return (
    <div className="two-column">
      <DataSection title="Provider 成本">
        <SimpleTable
          columns={["Provider", "请求", "Token", "估算成本"]}
          paginationKey="billing-providers"
          rows={(data.breakdown.providers ?? []).map((row) => [
            row.id,
            formatNumber(row.request_count),
            compactNumber(row.total_tokens),
            `$${formatMoney(row.estimated_cost_usd)}`,
          ])}
        />
      </DataSection>
      <DataSection title="账单策略">
        <SimpleTable
          columns={["项目", "Key 数", "状态"]}
          paginationKey="billing-projects"
          rows={data.projects.map((project) => [
            project.name,
            data.keys.filter((key) => key.project_id === project.id).length,
            <StatusPill key={project.id} status={project.status} />,
          ])}
        />
      </DataSection>
    </div>
  );
}

function AuditView({ data }: { data: AppData }) {
  return (
    <DataSection title="请求审计日志">
      <SimpleTable
        columns={["时间", "请求 ID", "项目", "模型", "Provider", "状态", "延迟"]}
        paginationKey="audit-logs"
        rows={data.logs.map((log) => [
          formatTime(log.created_at),
          log.request_id,
          log.project_id,
          log.model,
          log.provider_id || "-",
          <StatusPill key={log.id} status={log.status_code >= 400 ? "error" : "ok"} label={String(log.status_code)} />,
          `${log.latency_ms}ms`,
        ])}
      />
    </DataSection>
  );
}

function CrudView<T>({
  config,
  items,
  totalItems,
  query,
  pagination,
  issuedKey,
  onQuery,
  onCreate,
  onEdit,
  onDelete,
}: {
  config: ResourceConfig<T>;
  items: T[];
  totalItems: number;
  query: string;
  pagination: PaginationState;
  issuedKey: string;
  onQuery: (value: string) => void;
  onCreate: () => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
}) {
  return (
    <DataSection title={config.eyebrow}>
      <div className="table-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="搜索名称、ID、状态" />
        </div>
        {config.create ? (
          <button className="button" onClick={onCreate} type="button">
            <Plus size={17} />
            {config.createLabel ?? "新增"}
          </button>
        ) : null}
      </div>
      {issuedKey ? <div className="secret">新 Key 仅展示一次：{issuedKey}</div> : null}
      <EntityTable config={config} items={items} onEdit={onEdit} onDelete={onDelete} />
      <PaginationControls pagination={pagination} totalItems={totalItems} />
    </DataSection>
  );
}

function EntityTable<T>({
  config,
  items,
  onEdit,
  onDelete,
}: {
  config: ResourceConfig<T>;
  items: T[];
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
}) {
  if (items.length === 0) {
    return <div className="empty">暂无数据</div>;
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {config.columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={rowID(item)}>
              {config.columns.map((column) => (
                <td key={column.key}>{column.render ? column.render(item) : readPath(item, column.key)}</td>
              ))}
              <td>
                <div className="row-actions">
                  {config.update ? (
                    <button className="text-button" onClick={() => onEdit(item)} type="button">
                      编辑
                    </button>
                  ) : null}
                  {config.remove ? (
                    <button className="danger-button" onClick={() => onDelete(item)} type="button" title="删除">
                      <Trash2 size={15} />
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type PaginationState = {
  page: number;
  pageSize: number;
  pageCount: number;
  startIndex: number;
  endIndex: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
};

const pageSizeOptions = [20, 50, 100];

function usePagination(totalItems: number, resetKey: string): PaginationState {
  const [page, setPageState] = useState(1);
  const [pageSize, setPageSizeState] = useState(20);
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    setPageState(1);
  }, [resetKey]);

  useEffect(() => {
    if (page > pageCount) {
      setPageState(pageCount);
    }
  }, [page, pageCount]);

  const safePage = Math.min(page, pageCount);
  const startIndex = totalItems === 0 ? 0 : (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return {
    page: safePage,
    pageSize,
    pageCount,
    startIndex,
    endIndex,
    setPage: (nextPage) => setPageState(Math.min(Math.max(nextPage, 1), pageCount)),
    setPageSize: (nextPageSize) => {
      setPageSizeState(nextPageSize);
      setPageState(1);
    },
  };
}

function PaginationControls({
  pagination,
  totalItems,
}: {
  pagination: PaginationState;
  totalItems: number;
}) {
  if (totalItems <= pageSizeOptions[0]) return null;
  return (
    <div className="pagination">
      <div className="pagination-summary">
        第 {pagination.startIndex + 1}-{pagination.endIndex} 条，共 {totalItems} 条
      </div>
      <div className="pagination-controls">
        <label className="page-size">
          <span>每页</span>
          <select
            value={pagination.pageSize}
            onChange={(event) => pagination.setPageSize(Number(event.target.value))}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
        <div className="page-buttons">
          <button
            type="button"
            title="第一页"
            onClick={() => pagination.setPage(1)}
            disabled={pagination.page <= 1}
          >
            <ChevronsLeft size={15} />
          </button>
          <button
            type="button"
            title="上一页"
            onClick={() => pagination.setPage(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            <ChevronLeft size={15} />
          </button>
          <span>{pagination.page} / {pagination.pageCount}</span>
          <button
            type="button"
            title="下一页"
            onClick={() => pagination.setPage(pagination.page + 1)}
            disabled={pagination.page >= pagination.pageCount}
          >
            <ChevronRight size={15} />
          </button>
          <button
            type="button"
            title="最后一页"
            onClick={() => pagination.setPage(pagination.pageCount)}
            disabled={pagination.page >= pagination.pageCount}
          >
            <ChevronsRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function EditModal<T>({
  state,
  loading,
  onClose,
  onSave,
}: {
  state: ModalState<T>;
  loading: boolean;
  onClose: () => void;
  onSave: (values: Record<string, string>) => void;
}) {
  const initial = state.item ? state.config.toForm?.(state.item) ?? {} : defaultFormValues(state.config);
  const [values, setValues] = useState<Record<string, string>>(initial);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(values);
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="modal" onSubmit={submit}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">{state.item ? "编辑" : "新增"}</p>
            <h2>{state.config.title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button" title="关闭">×</button>
        </div>
        <div className="modal-body">
          {state.config.fields.map((field) => (
            <FieldInput
              key={field.key}
              field={field}
              value={values[field.key] ?? ""}
              onChange={(value) => setValues((prev) => ({ ...prev, [field.key]: value }))}
            />
          ))}
        </div>
        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose} type="button">取消</button>
          <button className="button" disabled={loading} type="submit">保存</button>
        </div>
      </form>
    </div>
  );
}

function ConfirmDialog({
  title,
  message,
  loading,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <div className="confirm-modal" role="dialog" aria-modal="true">
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="secondary-button" onClick={onCancel} type="button">取消</button>
          <button className="danger-confirm" onClick={onConfirm} disabled={loading} type="button">删除</button>
        </div>
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldConfig;
  value: string;
  onChange: (value: string) => void;
}) {
  if (field.type === "select") {
    return (
      <label className="field">
        <span>{field.label}</span>
        <select value={value} onChange={(event) => onChange(event.target.value)} required={field.required}>
          <option value="">请选择</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </label>
    );
  }
  if (field.type === "textarea") {
    return (
      <label className="field">
        <span>{field.label}</span>
        <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} required={field.required} />
      </label>
    );
  }
  return (
    <label className="field">
      <span>{field.label}</span>
      <input
        value={value}
        type={field.type === "number" ? "number" : field.type === "password" ? "password" : "text"}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
        required={field.required}
      />
    </label>
  );
}

function DataSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="section">
      <div className="section-header">
        <h2>{title}</h2>
      </div>
      <div className="section-body">{children}</div>
    </section>
  );
}

function SimpleTable({
  columns,
  rows,
  paginationKey,
}: {
  columns: string[];
  rows: React.ReactNode[][];
  paginationKey?: string;
}) {
  if (rows.length === 0) return <div className="empty">暂无数据</div>;
  if (paginationKey) {
    return <PaginatedSimpleTable columns={columns} rows={rows} paginationKey={paginationKey} />;
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PaginatedSimpleTable({
  columns,
  rows,
  paginationKey,
}: {
  columns: string[];
  rows: React.ReactNode[][];
  paginationKey: string;
}) {
  const pagination = usePagination(rows.length, paginationKey);
  const visibleRows = useMemo(
    () => rows.slice(pagination.startIndex, pagination.endIndex),
    [rows, pagination.startIndex, pagination.endIndex],
  );
  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
          </thead>
          <tbody>
            {visibleRows.map((row, index) => (
              <tr key={pagination.startIndex + index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationControls pagination={pagination} totalItems={rows.length} />
    </>
  );
}

function UsageBarChart({ data }: { data: UsagePoint[] }) {
  const points = data.length ? data : fallbackDays();
  const max = Math.max(...points.map((point) => point.total_tokens), 1);
  const width = 1240;
  const height = 330;
  const chartTop = 24;
  const chartBottom = 52;
  const chartHeight = height - chartTop - chartBottom;
  const gap = 8;
  const barWidth = Math.max(8, (width - 100 - gap * points.length) / points.length);

  return (
    <div className="chart-wrap">
      <div className="legend">
        <span className="legend-dot" />
        <span>{points.some((point) => point.total_tokens > 0) ? "模型调用 Token" : "等待调用数据"}</span>
      </div>
      <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = chartTop + chartHeight - chartHeight * ratio;
          return (
            <g key={ratio}>
              <line x1="40" x2={width - 20} y1={y} y2={y} />
              <text x="8" y={y + 4}>{compactNumber(Math.round(max * ratio))}</text>
            </g>
          );
        })}
        {points.map((point, index) => {
          const x = 60 + index * (barWidth + gap);
          const barHeight = (point.total_tokens / max) * chartHeight;
          const y = chartTop + chartHeight - barHeight;
          return (
            <g key={point.date}>
              <rect x={x} y={y} width={barWidth} height={Math.max(1, barHeight)} rx="1" />
              {index % 2 === 0 ? (
                <text x={x + barWidth / 2} y={height - 18} textAnchor="middle">
                  {point.date.slice(5)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function StatusPill({ status, label }: { status: string; label?: string }) {
  const normalized = String(status).toLowerCase();
  const kind =
    normalized === "active" || normalized === "healthy" || normalized === "ok"
      ? "ok"
      : normalized === "warning" || normalized === "degraded"
        ? "warn"
        : normalized === "error" || normalized === "down" || normalized === "disabled"
          ? "error"
          : "";
  return <span className={`pill ${kind}`}>{label ?? status}</span>;
}

const resourceConfigs: Partial<Record<ViewKey, ResourceConfig<any>>> = {
  providers: providerConfig(),
  "provider-accounts": genericResourceConfig("provider-accounts", "Provider 账号", "Provider 凭证与账号池", [
    { key: "provider_id", label: "Provider ID", required: true },
    { key: "auth_type", label: "认证类型", type: "select", options: ["api_key", "oauth", "service_account"], required: true },
    { key: "priority", label: "优先级", type: "number" },
    { key: "groups", label: "分组" },
  ]),
  models: modelConfig(),
  routes: routeConfig(),
  projects: projectConfig(),
  "api-keys": apiKeyConfig(),
  teams: genericResourceConfig("teams", "团队分组", "企业团队、成本中心与负责人", [
    { key: "owner", label: "负责人" },
    { key: "cost_center", label: "成本中心" },
    { key: "members", label: "成员数", type: "number" },
  ]),
  users: adminUserConfig(),
  "quota-policies": genericResourceConfig("quota-policies", "额度策略", "项目、Key、用户维度的请求、Token、成本与并发上限", [
    { key: "scope", label: "作用域", type: "select", options: ["project", "api_key", "user", "team"], required: true },
    { key: "daily_requests", label: "日请求", type: "number" },
    { key: "daily_tokens", label: "日 Token", type: "number" },
    { key: "daily_cost_usd", label: "日成本 USD", type: "number" },
    { key: "max_concurrency", label: "最大并发", type: "number" },
  ]),
  monitors: genericResourceConfig("monitors", "健康监控", "Provider、模型和 Endpoint 心跳测试任务", [
    { key: "provider", label: "Provider", required: true },
    { key: "model", label: "模型", required: true },
    { key: "interval_seconds", label: "间隔秒数", type: "number" },
    { key: "last_result", label: "最近结果" },
  ]),
  alerts: genericResourceConfig("alert-rules", "告警规则", "额度、成本、错误率和 Provider 健康告警", [
    { key: "metric", label: "指标", required: true },
    { key: "threshold", label: "阈值", required: true },
    { key: "channel", label: "通知渠道" },
  ]),
  "security-policies": genericResourceConfig("security-policies", "安全策略", "敏感数据、错误透传、IP 访问和审计策略", [
    { key: "mask_prompts", label: "脱敏 Prompt" },
    { key: "ip_allowlist", label: "IP 白名单" },
    { key: "error_passthrough", label: "错误透传" },
  ]),
  proxies: genericResourceConfig("proxies", "代理出口", "Provider 出口代理和内网访问策略", [
    { key: "protocol", label: "协议", type: "select", options: ["direct", "http", "https", "socks5"], required: true },
    { key: "host", label: "Host" },
    { key: "port", label: "端口", type: "number" },
  ]),
  announcements: genericResourceConfig("announcements", "公告通知", "后台公告、试运行通知和操作提示", [
    { key: "notify_mode", label: "通知模式", type: "select", options: ["silent", "popup"], required: true },
    { key: "target", label: "目标对象" },
  ]),
  settings: genericResourceConfig("settings", "系统设置", "网关地址、审计保留、企业集成和默认策略", [
    { key: "public_base_url", label: "公开 Base URL" },
    { key: "default_timeout", label: "默认超时" },
    { key: "audit_retention", label: "审计保留" },
  ]),
};

function providerConfig(): ResourceConfig<Provider> {
  return {
    view: "providers",
    title: "Provider 渠道",
    eyebrow: "Provider 列表",
    description: "对应企业授权 Provider 接入入口，用于统一管理上游渠道。",
    createLabel: "新增 Provider",
    columns: [
      { key: "name", label: "名称" },
      { key: "type", label: "类型" },
      { key: "base_url", label: "Base URL", render: (item) => item.base_url || "local mock" },
      { key: "priority", label: "优先级" },
      { key: "healthy", label: "健康", render: (item) => <StatusPill status={item.healthy ? "healthy" : "down"} /> },
      { key: "status", label: "状态", render: (item) => <StatusPill status={item.status} /> },
    ],
    fields: [
      { key: "name", label: "名称", required: true },
      { key: "type", label: "类型", type: "select", options: ["mock", "openai", "openai_compatible", "azure_openai", "anthropic", "gemini", "deepseek", "qwen", "local"], required: true },
      { key: "base_url", label: "Base URL" },
      { key: "api_key", label: "API Key", type: "password" },
      { key: "priority", label: "优先级", type: "number" },
      { key: "status", label: "状态", type: "select", options: ["active", "disabled"], required: true },
      { key: "healthy", label: "健康 true/false" },
    ],
    list: (ctx) => ctx.providers,
    create: (ctx, values) => adminMutate(ctx, "/api/admin/providers", "POST", providerPayload(values)),
    update: (ctx, item, values) => adminMutate(ctx, `/api/admin/providers/${item.id}`, "PATCH", providerPayload(values)),
    remove: (ctx, item) => adminDelete(ctx, `/api/admin/providers/${item.id}`),
    toForm: (item) => ({
      name: item.name,
      type: item.type,
      base_url: item.base_url ?? "",
      priority: String(item.priority ?? 10),
      status: item.status,
      healthy: String(item.healthy),
    }),
  };
}

function modelConfig(): ResourceConfig<Model> {
  return {
    view: "models",
    title: "模型目录",
    eyebrow: "统一模型列表",
    description: "维护内部应用看到的统一模型名、模型能力和成本单价。",
    createLabel: "新增模型",
    columns: [
      { key: "name", label: "模型" },
      { key: "family", label: "系列" },
      { key: "modality", label: "能力" },
      { key: "context_window", label: "上下文" },
      { key: "input_price_usd_per_1m", label: "输入$/1M" },
      { key: "output_price_usd_per_1m", label: "输出$/1M" },
      { key: "status", label: "状态", render: (item) => <StatusPill status={item.status} /> },
    ],
    fields: [
      { key: "name", label: "模型名", required: true },
      { key: "family", label: "系列", required: true },
      { key: "modality", label: "能力", type: "select", options: ["chat", "embedding", "image", "audio"], required: true },
      { key: "context_window", label: "上下文窗口", type: "number" },
      { key: "input_price_usd_per_1m", label: "输入价 USD/1M", type: "number" },
      { key: "output_price_usd_per_1m", label: "输出价 USD/1M", type: "number" },
      { key: "embedding_price_usd_per_1m", label: "Embedding 价 USD/1M", type: "number" },
      { key: "status", label: "状态", type: "select", options: ["active", "disabled"], required: true },
    ],
    list: (ctx) => ctx.models,
    create: (ctx, values) => adminMutate(ctx, "/api/admin/models", "POST", numberPayload(values, ["context_window", "input_price_usd_per_1m", "output_price_usd_per_1m", "embedding_price_usd_per_1m"])),
    update: (ctx, item, values) => adminMutate(ctx, `/api/admin/models/${encodeURIComponent(item.name)}`, "PATCH", numberPayload(values, ["context_window", "input_price_usd_per_1m", "output_price_usd_per_1m", "embedding_price_usd_per_1m"])),
    remove: (ctx, item) => adminDelete(ctx, `/api/admin/models/${encodeURIComponent(item.name)}`),
    toForm: (item) => stringifyForm(item),
  };
}

function routeConfig(): ResourceConfig<ModelRoute> {
  return {
    view: "routes",
    title: "路由策略",
    eyebrow: "模型路由规则",
    description: "配置统一模型到 Provider 上游模型的映射、优先级、权重和启停状态。",
    createLabel: "新增路由",
    columns: [
      { key: "model_name", label: "统一模型" },
      { key: "provider_id", label: "Provider" },
      { key: "provider_model", label: "上游模型" },
      { key: "priority", label: "优先级" },
      { key: "weight", label: "权重" },
      { key: "strategy", label: "策略", render: (item) => routeStrategyLabel(item.strategy) },
      { key: "last_used_at", label: "最近命中", render: (item) => formatTime(item.last_used_at ?? "") },
      { key: "status", label: "状态", render: (item) => <StatusPill status={item.status} /> },
    ],
    fields: [
      { key: "model_name", label: "统一模型", required: true },
      { key: "provider_id", label: "Provider ID", required: true },
      { key: "provider_model", label: "上游模型/部署名", required: true },
      { key: "priority", label: "优先级", type: "number" },
      { key: "weight", label: "权重", type: "number" },
      { key: "strategy", label: "调度策略", type: "select", options: ["priority_weighted", "priority_only"], required: true },
      { key: "status", label: "状态", type: "select", options: ["active", "disabled"], required: true },
    ],
    list: (ctx) => ctx.routes,
    create: (ctx, values) => adminMutate(ctx, "/api/admin/routing-rules", "POST", numberPayload(values, ["priority", "weight"])),
    update: (ctx, item, values) => adminMutate(ctx, `/api/admin/routing-rules/${item.id}`, "PATCH", numberPayload(values, ["priority", "weight"])),
    remove: (ctx, item) => adminDelete(ctx, `/api/admin/routing-rules/${item.id}`),
    toForm: (item) => stringifyForm(item),
  };
}

function projectConfig(): ResourceConfig<Project> {
  return {
    view: "projects",
    title: "项目空间",
    eyebrow: "项目列表",
    description: "项目是企业内部 AI 使用、Key、额度和成本归属的基本单元。",
    createLabel: "新增项目",
    columns: [
      { key: "name", label: "项目" },
      { key: "team_id", label: "团队" },
      { key: "owner_user_id", label: "负责人" },
      { key: "default_quota_ref", label: "额度策略" },
      { key: "status", label: "状态", render: (item) => <StatusPill status={item.status} /> },
    ],
    fields: [
      { key: "name", label: "项目名称", required: true },
      { key: "team_id", label: "团队 ID" },
      { key: "owner_user_id", label: "负责人用户 ID" },
      { key: "default_quota_ref", label: "默认额度策略" },
      { key: "status", label: "状态", type: "select", options: ["active", "disabled"], required: true },
    ],
    list: (ctx) => ctx.projects,
    create: (ctx, values) => adminMutate(ctx, "/api/admin/projects", "POST", values),
    update: (ctx, item, values) => adminMutate(ctx, `/api/admin/projects/${item.id}`, "PATCH", values),
    remove: (ctx, item) => adminDelete(ctx, `/api/admin/projects/${item.id}`),
    toForm: (item) => stringifyForm(item),
  };
}

function apiKeyConfig(): ResourceConfig<APIKey> {
  return {
    view: "api-keys",
    title: "API Key",
    eyebrow: "内部 Key 列表",
    description: "按项目发放内部 API Key，限制模型白名单、额度、并发和有效期。",
    createLabel: "发放 Key",
    columns: [
      { key: "name", label: "名称" },
      { key: "project_id", label: "项目" },
      { key: "key_prefix", label: "Key", render: (item) => `${item.key_prefix}...${item.key_suffix}` },
      { key: "allowed_models", label: "模型", render: (item) => (item.allowed_models ?? []).join(", ") || "全部" },
      { key: "limits.max_concurrency", label: "并发" },
      { key: "status", label: "状态", render: (item) => <StatusPill status={item.status} /> },
    ],
    fields: [
      { key: "project_id", label: "项目 ID", required: true },
      { key: "name", label: "Key 名称", required: true },
      { key: "allowed_models", label: "模型白名单，逗号分隔" },
      { key: "daily_requests", label: "日请求", type: "number" },
      { key: "daily_tokens", label: "日 Token", type: "number" },
      { key: "daily_cost_usd", label: "日成本 USD", type: "number" },
      { key: "max_concurrency", label: "最大并发", type: "number" },
      { key: "status", label: "状态", type: "select", options: ["active", "disabled", "revoked"], required: true },
    ],
    list: (ctx) => ctx.keys,
    create: async () => undefined,
    update: (ctx, item, values) => adminMutate(ctx, `/api/admin/api-keys/${item.id}`, "PATCH", keyPatchPayload(values)),
    remove: (ctx, item) => adminDelete(ctx, `/api/admin/api-keys/${item.id}`),
    toForm: (item) => ({
      project_id: item.project_id,
      name: item.name,
      allowed_models: (item.allowed_models ?? []).join(", "),
      daily_requests: String(item.limits?.daily_requests ?? ""),
      daily_tokens: String(item.limits?.daily_tokens ?? ""),
      daily_cost_usd: String(item.limits?.daily_cost_usd ?? ""),
      max_concurrency: String(item.limits?.max_concurrency ?? ""),
      status: item.status,
    }),
  };
}

function adminUserConfig(): ResourceConfig<AdminUser> {
  return {
    view: "users",
    title: "用户管理",
    eyebrow: "后台用户列表",
    description: "管理 TokenHub 后台登录账号、角色权限、归属团队和账号状态。",
    createLabel: "新增用户",
    columns: [
      { key: "name", label: "姓名" },
      { key: "email", label: "邮箱" },
      { key: "username", label: "用户名" },
      { key: "role", label: "角色", render: (item) => roleLabel(item.role) },
      { key: "team_id", label: "团队", render: (item) => item.team_id || "-" },
      { key: "last_login_at", label: "最近登录", render: (item) => formatTime(item.last_login_at ?? "") },
      { key: "status", label: "状态", render: (item) => <StatusPill status={item.status} /> },
    ],
    fields: [
      { key: "username", label: "用户名", required: true },
      { key: "name", label: "姓名", required: true },
      { key: "email", label: "邮箱", required: true },
      { key: "password", label: "密码", type: "password", placeholder: "编辑时留空则不修改" },
      { key: "role", label: "角色", type: "select", options: ["admin", "security", "project_admin", "viewer"], required: true },
      { key: "team_id", label: "团队 ID" },
      { key: "status", label: "状态", type: "select", options: ["active", "disabled"], required: true },
    ],
    list: (ctx) => ctx.users,
    create: (ctx, values) => adminMutate(ctx, "/api/admin/users", "POST", userPayload(values, true)),
    update: (ctx, item, values) => adminMutate(ctx, `/api/admin/users/${item.id}`, "PATCH", userPayload(values, false)),
    remove: (ctx, item) => adminDelete(ctx, `/api/admin/users/${item.id}`),
    toForm: (item) => ({
      username: item.username,
      name: item.name,
      email: item.email,
      password: "",
      role: item.role,
      team_id: item.team_id ?? "",
      status: item.status,
    }),
  };
}

function genericResourceConfig(kind: string, title: string, description: string, fields: FieldConfig[]): ResourceConfig<AdminResource> {
  return {
    view: kind as ViewKey,
    title,
    eyebrow: `${title}列表`,
    description,
    createLabel: `新增${title}`,
    columns: [
      { key: "name", label: "名称" },
      { key: "description", label: "说明" },
      { key: "status", label: "状态", render: (item) => <StatusPill status={item.status} /> },
      { key: "fields", label: "配置", render: (item) => fieldSummary(item.fields) },
      { key: "updated_at", label: "更新时间", render: (item) => formatTime(item.updated_at ?? "") },
    ],
    fields: [
      { key: "name", label: "名称", required: true },
      { key: "description", label: "说明", type: "textarea" },
      { key: "status", label: "状态", type: "select", options: ["active", "disabled", "draft", "archived"], required: true },
      ...fields,
    ],
    list: (ctx) => ctx.resources[kind] ?? [],
    create: (ctx, values) => adminMutate(ctx, `/api/admin/resources/${kind}`, "POST", resourcePayload(values, fields)),
    update: (ctx, item, values) => adminMutate(ctx, `/api/admin/resources/${kind}/${item.id}`, "PATCH", resourcePayload(values, fields)),
    remove: (ctx, item) => adminDelete(ctx, `/api/admin/resources/${kind}/${item.id}`),
    toForm: (item) => {
      const form: Record<string, string> = {
        name: item.name,
        description: item.description ?? "",
        status: item.status,
      };
      for (const field of fields) {
        form[field.key] = stringifyValue(item.fields?.[field.key]);
      }
      return form;
    },
  };
}

async function createKeyWithCapture(
  ctx: ApiContext,
  values: Record<string, string>,
  setIssuedKey: (value: string) => void,
  load: () => Promise<void>,
  setLoading: (value: boolean) => void,
  setError: (value: string) => void,
  setModal: (value: ModalState<any> | null) => void,
) {
  setLoading(true);
  setError("");
  try {
    const payload = keyCreatePayload(values);
    const resp = await adminFetch(ctx, `/api/admin/projects/${values.project_id}/keys`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error(`create api key ${resp.status}`);
    const data = (await resp.json()) as { api_key: string };
    setIssuedKey(data.api_key);
    setModal(null);
    await load();
  } catch (err) {
    setError(err instanceof Error ? err.message : "发放 Key 失败");
  } finally {
    setLoading(false);
  }
}

function providerPayload(values: Record<string, string>) {
  return {
    name: values.name,
    type: values.type,
    base_url: values.base_url,
    api_key: values.api_key,
    status: values.status || "active",
    healthy: values.healthy !== "false",
    priority: numberOr(values.priority, 10),
  };
}

function defaultFormValues<T>(config: ResourceConfig<T>) {
  const values: Record<string, string> = {};
  for (const field of config.fields) {
    if (field.key === "status") values[field.key] = "active";
    if (field.key === "healthy") values[field.key] = "true";
    if (field.key === "priority") values[field.key] = config.view === "routes" ? "1" : "10";
    if (field.key === "weight") values[field.key] = "100";
    if (field.key === "project_id") values[field.key] = "prj_demo";
    if (field.key === "allowed_models") values[field.key] = "gpt-4.1-mini";
    if (field.key === "daily_requests") values[field.key] = "1000";
    if (field.key === "daily_tokens") values[field.key] = "1000000";
    if (field.key === "daily_cost_usd") values[field.key] = "100";
    if (field.key === "max_concurrency") values[field.key] = "20";
    if (field.key === "modality") values[field.key] = "chat";
    if (field.key === "type") values[field.key] = "openai_compatible";
    if (field.key === "auth_type") values[field.key] = "api_key";
    if (field.key === "scope") values[field.key] = "project";
    if (field.key === "protocol") values[field.key] = "direct";
    if (field.key === "notify_mode") values[field.key] = "silent";
    if (field.key === "role") values[field.key] = "viewer";
    if (field.key === "password") values[field.key] = "changeme123456";
  }
  return values;
}

function keyCreatePayload(values: Record<string, string>) {
  return {
    name: values.name,
    allowed_models: splitList(values.allowed_models),
    limits: keyLimits(values),
  };
}

function keyPatchPayload(values: Record<string, string>) {
  return {
    name: values.name,
    status: values.status || "active",
    allowed_models: splitList(values.allowed_models),
    limits: keyLimits(values),
  };
}

function keyLimits(values: Record<string, string>) {
  return {
    daily_requests: numberOr(values.daily_requests, 0),
    monthly_requests: 0,
    daily_tokens: numberOr(values.daily_tokens, 0),
    monthly_tokens: 0,
    daily_cost_usd: numberOr(values.daily_cost_usd, 0),
    monthly_cost_usd: 0,
    max_concurrency: numberOr(values.max_concurrency, 0),
  };
}

function userPayload(values: Record<string, string>, includePassword: boolean) {
  const payload: Record<string, unknown> = {
    username: values.username,
    name: values.name,
    email: values.email,
    role: values.role || "viewer",
    team_id: values.team_id,
    status: values.status || "active",
  };
  if (includePassword || values.password) {
    payload.password = values.password;
  }
  return payload;
}

function numberPayload(values: Record<string, string>, keys: string[]) {
  const payload: Record<string, unknown> = { ...values };
  for (const key of keys) payload[key] = numberOr(values[key], 0);
  return payload;
}

function resourcePayload(values: Record<string, string>, customFields: FieldConfig[]) {
  const fields: Record<string, unknown> = {};
  for (const field of customFields) {
    fields[field.key] = field.type === "number" ? numberOr(values[field.key], 0) : parseLooseValue(values[field.key]);
  }
  return {
    name: values.name,
    description: values.description,
    status: values.status || "active",
    fields,
  };
}

async function adminMutate(ctx: ApiContext, path: string, method: "POST" | "PATCH", payload: unknown) {
  const resp = await adminFetch(ctx, path, {
    method,
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error(`${method} ${path} ${resp.status}`);
}

async function adminDelete(ctx: ApiContext, path: string) {
  const resp = await adminFetch(ctx, path, { method: "DELETE" });
  if (!resp.ok && resp.status !== 204) throw new Error(`DELETE ${path} ${resp.status}`);
}

function adminFetch(ctx: ApiContext, path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${ctx.adminToken}`);
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return fetch(`${ctx.baseURL.replace(/\/$/, "")}${path}`, { ...init, headers });
}

function emptyData(): AppData {
  return {
    summary: emptySummary(),
    projects: [],
    keys: [],
    providers: [],
    models: [],
    routes: [],
    logs: [],
    alerts: [],
    users: [],
    breakdown: { projects: [], models: [], providers: [] },
    timeseries: [],
    resources: {},
  };
}

function emptySummary(): Summary {
  return {
    request_count: 0,
    input_tokens: 0,
    output_tokens: 0,
    total_tokens: 0,
    estimated_cost_usd: 0,
    errors: 0,
  };
}

function filterRows<T>(items: T[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return items;
  return items.filter((item) => JSON.stringify(item).toLowerCase().includes(normalized));
}

function rowID(item: unknown) {
  return String(readPath(item, "id") || readPath(item, "name") || JSON.stringify(item));
}

function rowTitle(item: unknown) {
  return String(readPath(item, "name") || readPath(item, "id") || "该记录");
}

function readPath(item: unknown, path: string): React.ReactNode {
  const value = path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, item);
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return value;
  if (typeof value === "string") return value;
  if (value == null) return "-";
  return JSON.stringify(value);
}

function stringifyForm(item: Record<string, unknown>) {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(item)) {
    result[key] = stringifyValue(value);
  }
  return result;
}

function stringifyValue(value: unknown) {
  if (value == null) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function fieldSummary(fields?: Record<string, unknown>) {
  if (!fields || Object.keys(fields).length === 0) return "-";
  return Object.entries(fields)
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${stringifyValue(value)}`)
    .join(" / ");
}

function parseLooseValue(value: string) {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    admin: "系统管理员",
    security: "安全审计",
    project_admin: "项目管理员",
    viewer: "只读成员",
  };
  return labels[role] ?? role;
}

function userInitial(user: AdminUser) {
  const source = user.name || user.username || user.email || "U";
  return source.trim().slice(0, 1).toUpperCase();
}

function numberOr(value: string | undefined, fallback: number) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function splitList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function fallbackDays(): UsagePoint[] {
  return Array.from({ length: 31 }, (_, index) => ({
    date: `2026-06-${String(index + 1).padStart(2, "0")}`,
    request_count: 0,
    input_tokens: 0,
    output_tokens: 0,
    total_tokens: 0,
    estimated_cost_usd: 0,
  }));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function compactNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return formatNumber(value || 0);
}

function formatMoney(value: number) {
  return (value || 0).toFixed(value >= 1 ? 2 : 6);
}

function routeStrategyLabel(value?: string) {
  if (value === "priority_only") return "优先级";
  return "优先级 + 权重";
}

function formatTime(value: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

type SavedSession = {
  baseURL: string;
  token: string;
  user: AdminUser;
  expiresAt: string;
};

function readSavedSession(): SavedSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(sessionStorageKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SavedSession;
    if (!parsed.token || !parsed.user || new Date(parsed.expiresAt).getTime() <= Date.now()) {
      window.localStorage.removeItem(sessionStorageKey);
      return null;
    }
    return parsed;
  } catch {
    window.localStorage.removeItem(sessionStorageKey);
    return null;
  }
}

function saveSession(session: SavedSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(sessionStorageKey, JSON.stringify(session));
}

function clearSavedSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(sessionStorageKey);
}
