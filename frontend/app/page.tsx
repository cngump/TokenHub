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
  Check,
  CircleDollarSign,
  Copy,
  Database,
  FileText,
  Gauge,
  Globe2,
  GripVertical,
  KeyRound,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Send,
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

const DEFAULT_PROJECT_ID = "prj_default";

type Project = {
  id: string;
  name: string;
  team_id?: string;
  owner_user_id?: string;
  cost_center?: string;
  status: string;
  default_quota_ref?: string;
  created_at?: string;
};

type APIKey = {
  id: string;
  project_id: string;
  name: string;
  group?: string;
  key_prefix: string;
  key_suffix: string;
  allowed_models: string[];
  ip_allowlist?: string[];
  status: string;
  limits?: Record<string, number>;
  expires_at?: string;
  rotated_from_id?: string;
  grace_until?: string;
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
  options?: Record<string, string>;
};

type ProviderCatalogModel = {
  id: string;
  name: string;
  display_name?: string;
  canonical_name?: string;
  category?: string;
  family?: string;
  type?: string;
  context_window?: number;
  max_output_tokens?: number;
  input_price_usd_per_1m?: number;
  output_price_usd_per_1m?: number;
  input_modalities?: string[];
  output_modalities?: string[];
  capabilities?: string[];
  supported_parameters?: string[];
  last_updated?: string;
};

type ProviderCatalogEntry = {
  id: string;
  name: string;
  display_name: string;
  type: string;
  base_url?: string;
  doc_url?: string;
  categories?: string[];
  category_counts?: Record<string, number>;
  models_count: number;
  source: string;
  models?: ProviderCatalogModel[];
};

type ProviderResource = {
  id: string;
  provider_id: string;
  name: string;
  group?: string;
  resource_type: string;
  base_url?: string;
  region?: string;
  environment?: string;
  status: string;
  healthy: boolean;
  priority: number;
  weight: number;
  rate_limit_rpm?: number;
  token_limit_tpm?: number;
  max_concurrency?: number;
  failure_count?: number;
  cooldown_until?: string;
  last_used_at?: string;
  last_checked_at?: string;
  created_at?: string;
  updated_at?: string;
};

type Model = {
  id: string;
  name: string;
  category?: string;
  family: string;
  modality: string;
  context_window?: number;
  status: string;
  input_price_usd_per_1m?: number;
  output_price_usd_per_1m?: number;
  embedding_price_usd_per_1m?: number;
  input_modalities?: string[];
  output_modalities?: string[];
  capabilities?: string[];
  supported_parameters?: string[];
};

type ModelRoute = {
  id: string;
  model_name: string;
  provider_id: string;
  provider_resource_id?: string;
  resource_group?: string;
  sticky_session?: boolean;
  provider_model: string;
  priority: number;
  weight: number;
  quality_score?: number;
  cost_score?: number;
  status: string;
  strategy?: string;
  last_used_at?: string;
};

type ChatRole = "system" | "user" | "assistant";

type PlaygroundMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type PlaygroundRouteSummary = {
  route_id?: string;
  provider_id?: string;
  provider_name?: string;
  resource_id?: string;
  resource_name?: string;
  provider_model?: string;
  priority?: number;
  resource_priority?: number;
  weight?: number;
  quality_score?: number;
  cost_score?: number;
  strategy?: string;
};

type PlaygroundUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  estimated_cost_usd?: number;
};

type PlaygroundRouteAttempt = {
  route: PlaygroundRouteSummary;
  status: number;
  code?: string;
  error?: string;
};

type PlaygroundChatPayload = {
  response?: {
    choices?: Array<{
      message?: {
        role?: string;
        content?: unknown;
      };
      text?: unknown;
    }>;
    output_text?: unknown;
    content?: unknown;
  };
  route?: PlaygroundRouteSummary;
  usage?: PlaygroundUsage;
  attempts?: PlaygroundRouteAttempt[];
  request_id?: string;
};

type ApiExampleLanguage = "python" | "typescript" | "java" | "go";

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

type AlertDelivery = {
  id: string;
  alert_id: string;
  channel_id?: string;
  channel: string;
  target?: string;
  status: string;
  status_code?: number;
  error?: string;
  created_at: string;
};

type ApprovalRequest = {
  id: string;
  flow_id?: string;
  trigger: string;
  resource_type: string;
  resource_id?: string;
  requester_id?: string;
  requester?: string;
  status: string;
  reason?: string;
  payload?: string;
  created_at: string;
  decided_at?: string;
  decided_by?: string;
};

type SQLiteBackup = {
  id: string;
  name: string;
  file_name: string;
  status: string;
  trigger: string;
  size_bytes: number;
  checksum_sha256?: string;
  created_by?: string;
  created_at: string;
  expires_at?: string;
  restored_by?: string;
  restored_at?: string;
  error?: string;
};

type RequestLog = {
  id: string;
  request_id: string;
  project_id: string;
  api_key_id: string;
  model: string;
  provider_id?: string;
  provider_resource_id?: string;
  provider_model?: string;
  status_code: number;
  error_code?: string;
  latency_ms: number;
  client_ip?: string;
  user_agent?: string;
  created_at: string;
};

type UsageRecord = {
  id: string;
  request_id: string;
  project_id: string;
  api_key_id: string;
  model: string;
  provider_id?: string;
  provider_resource_id?: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  created_at: string;
};

type RouteAttemptLog = {
  id: string;
  request_id: string;
  attempt_index: number;
  route_id?: string;
  provider_id?: string;
  provider_resource_id?: string;
  provider_model?: string;
  status_code: number;
  error_code?: string;
  error_message?: string;
  created_at: string;
};

type RequestPayloadLog = {
  id: string;
  request_id: string;
  request_body?: string;
  response_body?: string;
  request_truncated: boolean;
  response_truncated: boolean;
  created_at: string;
};

type RequestDetail = {
  log: RequestLog;
  usage: UsageRecord[];
  attempts: RouteAttemptLog[];
  payload?: RequestPayloadLog | null;
};

type AuditEvent = {
  id: string;
  actor_user_id?: string;
  actor_name?: string;
  actor_role?: string;
  action: string;
  resource_type: string;
  resource_id: string;
  status: string;
  message?: string;
  ip?: string;
  user_agent?: string;
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
  provider_resources: UsageBreakdownRow[];
  cost_centers: UsageBreakdownRow[];
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
  | "playground"
  | "gateway"
  | "providers"
  | "models"
  | "routes"
  | "projects"
  | "api-keys"
  | "teams"
  | "users"
  | "quota-policies"
  | "cost-centers"
  | "budgets"
  | "chargebacks"
  | "approval-flows"
  | "approvals"
  | "invoices"
  | "reports"
  | "usage"
  | "billing"
  | "audit"
  | "monitors"
  | "alerts"
  | "alert-events"
  | "notification-channels"
  | "alert-deliveries"
  | "security-policies"
  | "proxies"
  | "sqlite-backups"
  | "announcements"
  | "settings";

const viewRoutes: Record<ViewKey, string> = {
  overview: "/overview",
  playground: "/playground",
  gateway: "/gateway",
  providers: "/providers",
  models: "/models",
  routes: "/routes",
  projects: "/projects",
  "api-keys": "/api-keys",
  teams: "/teams",
  users: "/users",
  "quota-policies": "/quota-policies",
  "cost-centers": "/cost-centers",
  budgets: "/budgets",
  chargebacks: "/chargebacks",
  "approval-flows": "/approval-flows",
  approvals: "/approvals",
  invoices: "/invoices",
  reports: "/reports",
  usage: "/usage",
  billing: "/billing",
  audit: "/audit",
  monitors: "/monitors",
  alerts: "/alerts",
  "alert-events": "/alert-events",
  "notification-channels": "/notification-channels",
  "alert-deliveries": "/alert-deliveries",
  "security-policies": "/security-policies",
  proxies: "/proxies",
  "sqlite-backups": "/sqlite-backups",
  announcements: "/announcements",
  settings: "/settings",
};

const routeViews = Object.fromEntries(
  Object.entries(viewRoutes).map(([view, route]) => [route.replace(/^\//, ""), view]),
) as Record<string, ViewKey>;

type FieldType = "text" | "number" | "password" | "textarea" | "select" | "multi-select" | "tags" | "boolean";

type FieldConfig = {
  key: string;
  label: string;
  type?: FieldType;
  options?: string[];
  optionsFromData?: (data: AppData) => Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
  help?: string;
  readOnlyOnEdit?: boolean;
};

type ColumnConfig<T> = {
  key: string;
  label: string;
  render?: (item: T, ctx: AppData) => React.ReactNode;
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
  create?: (ctx: ApiContext, values: Record<string, string>, data?: AppData) => Promise<void>;
  update?: (ctx: ApiContext, item: T, values: Record<string, string>) => Promise<void>;
  remove?: (ctx: ApiContext, item: T) => Promise<void>;
  actions?: ResourceAction<T>[];
  toolbarActions?: ToolbarAction[];
  toForm?: (item: T) => Record<string, string>;
};

type ResourceAction<T> = {
  label: string;
  title?: string;
  run?: (ctx: ApiContext, item: T) => Promise<void>;
  modal?: (item: T, data: AppData) => ModalState<any>;
  doneMessage?: (item: T) => string;
};

type ToolbarAction = {
  label: string;
  title?: string;
  run: (ctx: ApiContext, items?: unknown[]) => Promise<void>;
  doneMessage?: () => string;
};

type AppData = {
  summary: Summary;
  projects: Project[];
  keys: APIKey[];
  providers: Provider[];
  providerResources: ProviderResource[];
  models: Model[];
  routes: ModelRoute[];
  logs: RequestLog[];
  auditEvents: AuditEvent[];
  alerts: AlertEvent[];
  alertDeliveries: AlertDelivery[];
  approvals: ApprovalRequest[];
  sqliteBackups: SQLiteBackup[];
  users: AdminUser[];
  breakdown: UsageBreakdown;
  timeseries: UsagePoint[];
  resources: Record<string, AdminResource[]>;
  providerCatalog: ProviderCatalogEntry[];
};

type ApiContext = {
  baseURL: string;
  adminToken: string;
};

type ModalState<T> = {
  config: ResourceConfig<T>;
  item?: T;
  initialValues?: Record<string, string>;
};

type ConfirmState<T> = {
  config: ResourceConfig<T>;
  item: T;
};

const defaultBaseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
const sessionStorageKey = "tokenhub.admin.session";
const authExpiredEventName = "tokenhub-admin-auth-expired";

const resourceKinds = [
  "teams",
  "role-configs",
  "quota-policies",
  "cost-centers",
  "budgets",
  "chargebacks",
  "approval-flows",
  "invoices",
  "reports",
  "notification-channels",
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
      { view: "playground", label: "模型演练场", icon: Send },
      { view: "gateway", label: "统一 API 网关", icon: Sparkles },
    ],
  },
  {
    title: "AI 接入",
    items: [
      { view: "providers", label: "Provider 渠道", icon: Server },
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
      { view: "approval-flows", label: "审批流", icon: ShieldCheck },
      { view: "approvals", label: "审批记录", icon: ShieldCheck },
    ],
  },
  {
    title: "成本审计",
    items: [
      { view: "usage", label: "用量统计", icon: BarChart3 },
      { view: "billing", label: "成本账单", icon: WalletCards },
      { view: "cost-centers", label: "成本中心", icon: Database },
      { view: "budgets", label: "预算管理", icon: CircleDollarSign },
      { view: "chargebacks", label: "部门分摊", icon: WalletCards },
      { view: "invoices", label: "内部账单", icon: FileText },
      { view: "reports", label: "导出报表", icon: BarChart3 },
      { view: "audit", label: "请求审计", icon: FileText },
      { view: "monitors", label: "健康监控", icon: Activity },
      { view: "alerts", label: "告警规则", icon: AlertCircle },
      { view: "alert-events", label: "告警事件", icon: AlertCircle },
      { view: "notification-channels", label: "通知渠道", icon: Bell },
      { view: "alert-deliveries", label: "通知记录", icon: Bell },
    ],
  },
  {
    title: "安全运维",
    items: [
      { view: "security-policies", label: "安全策略", icon: ShieldCheck },
      { view: "proxies", label: "代理出口", icon: Server },
      { view: "sqlite-backups", label: "数据备份", icon: Database },
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
  playground: {
    title: "模型演练场",
    description: "选择标准模型，按当前路由策略发起测试对话，验证 Provider、路由和返回内容。",
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
  "alert-events": {
    title: "告警事件",
    description: "查看运行时触发的额度、成本和 Provider 健康告警。",
  },
  "alert-deliveries": {
    title: "通知记录",
    description: "查看告警 Webhook 发送结果、目标和失败原因。",
  },
  approvals: {
    title: "审批记录",
    description: "处理 Key 发放、额度提升和预算变更等治理审批。",
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
  const [activeView, setActiveView] = useState<ViewKey>(() => initialView());
  const [data, setData] = useState<AppData>(emptyData());
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [modelCategoryFilter, setModelCategoryFilter] = useState("all");
  const [settingsTab, setSettingsTab] = useState<"settings" | "role-configs">("settings");
  const [modal, setModal] = useState<ModalState<any> | null>(null);
  const [providerCreateOpen, setProviderCreateOpen] = useState(false);
  const [providerEditItem, setProviderEditItem] = useState<Provider | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmState<any> | null>(null);
  const [issuedKey, setIssuedKey] = useState("");

  const api = useMemo(() => ({ baseURL, adminToken }), [baseURL, adminToken]);
  const activeConfig = resourceConfigs[activeView];
  const activeMeta = activeConfig ?? standaloneViewMeta[activeView] ?? standaloneViewMeta.overview!;

  function selectView(view: ViewKey, options: { replace?: boolean } = {}) {
    setActiveView(view);
    if (typeof window === "undefined") return;
    const nextPath = viewRoutes[view];
    if (window.location.pathname === nextPath) return;
    const nextURL = `${nextPath}${window.location.search}${window.location.hash}`;
    if (options.replace) {
      window.history.replaceState({ view }, "", nextURL);
    } else {
      window.history.pushState({ view }, "", nextURL);
    }
  }

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

  useEffect(() => {
    const view = viewFromPath(window.location.pathname);
    setActiveView(view);
    if (window.location.pathname !== viewRoutes[view]) {
      window.history.replaceState({ view }, "", viewRoutes[view]);
    }
    function onPopState() {
      setActiveView(viewFromPath(window.location.pathname));
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    function onAuthExpired() {
      clearSavedSession();
      setAdminToken("");
      setCurrentUser(null);
      setData(emptyData());
      setModal(null);
      setProviderCreateOpen(false);
      setProviderEditItem(null);
      setConfirmDelete(null);
      setIssuedKey("");
      setNotice("");
      setError("");
      selectView("overview", { replace: true });
      setLoading(false);
    }
    window.addEventListener(authExpiredEventName, onAuthExpired);
    return () => window.removeEventListener(authExpiredEventName, onAuthExpired);
  }, []);

  useEffect(() => {
    function onIssuedKey(event: Event) {
      const detail = (event as CustomEvent<string>).detail;
      if (detail) setIssuedKey(detail);
    }
    window.addEventListener("tokenhub-issued-key", onIssuedKey);
    return () => window.removeEventListener("tokenhub-issued-key", onIssuedKey);
  }, []);

  async function load() {
    if (!adminToken) return;
    setLoading(true);
    setError("");
    try {
      const [
        overviewResp,
        providerResourcesResp,
        keysResp,
        routesResp,
        logsResp,
        auditEventsResp,
        alertDeliveriesResp,
        approvalsResp,
        sqliteBackupsResp,
        breakdownResp,
        timeseriesResp,
        usersResp,
        providerCatalogResp,
        ...resourceResps
      ] = await Promise.all([
        adminFetch(api, "/api/admin/overview"),
        adminFetch(api, "/api/admin/provider-resources"),
        adminFetch(api, "/api/admin/api-keys"),
        adminFetch(api, "/api/admin/routing-rules"),
        adminFetch(api, "/api/admin/audit/requests"),
        adminFetch(api, "/api/admin/audit/events"),
        adminFetch(api, "/api/admin/alert-deliveries"),
        adminFetch(api, "/api/admin/approvals"),
        adminFetch(api, "/api/admin/sqlite/backups"),
        adminFetch(api, "/api/admin/usage/breakdown"),
        adminFetch(api, "/api/admin/usage/timeseries"),
        adminFetch(api, "/api/admin/users"),
        adminFetch(api, "/api/admin/provider-catalog"),
        ...resourceKinds.map((kind) => adminFetch(api, `/api/admin/resources/${kind}`)),
      ]);
      for (const [name, resp] of [
        ["overview", overviewResp],
        ["provider-resources", providerResourcesResp],
        ["api-keys", keysResp],
        ["routes", routesResp],
        ["audit", logsResp],
        ["audit-events", auditEventsResp],
        ["alert-deliveries", alertDeliveriesResp],
        ["approvals", approvalsResp],
        ["sqlite-backups", sqliteBackupsResp],
        ["breakdown", breakdownResp],
        ["timeseries", timeseriesResp],
        ["users", usersResp],
        ["provider-catalog", providerCatalogResp],
        ...resourceKinds.map((kind, index) => [kind, resourceResps[index]] as const),
      ] as const) {
        if (!resp.ok) {
          throw new Error(`${name} ${resp.status}`);
        }
      }

      const overview = await overviewResp.json();
      const providerResources = (await providerResourcesResp.json()) as { data: ProviderResource[] };
      const keys = (await keysResp.json()) as { data: APIKey[] };
      const routes = (await routesResp.json()) as { data: ModelRoute[] };
      const logs = (await logsResp.json()) as { data: RequestLog[] };
      const auditEvents = (await auditEventsResp.json()) as { data: AuditEvent[] };
      const alertDeliveries = (await alertDeliveriesResp.json()) as { data: AlertDelivery[] };
      const approvals = (await approvalsResp.json()) as { data: ApprovalRequest[] };
      const sqliteBackups = (await sqliteBackupsResp.json()) as { data: SQLiteBackup[] };
      const breakdown = (await breakdownResp.json()) as UsageBreakdown;
      const timeseries = (await timeseriesResp.json()) as { data: UsagePoint[] };
      const users = (await usersResp.json()) as { data: AdminUser[] };
      const providerCatalog = (await providerCatalogResp.json()) as { data: ProviderCatalogEntry[] };
      const resources: Record<string, AdminResource[]> = {};
      for (let i = 0; i < resourceKinds.length; i++) {
        const payload = (await resourceResps[i].json()) as { data: AdminResource[] };
        resources[resourceKinds[i]] = payload.data ?? [];
      }

      setData({
        summary: overview.summary ?? emptySummary(),
        projects: overview.projects ?? [],
        providers: overview.providers ?? [],
        providerResources: providerResources.data ?? overview.provider_resources ?? [],
        models: overview.models ?? [],
        alerts: overview.alerts ?? [],
        keys: keys.data ?? [],
        routes: routes.data ?? [],
        logs: logs.data ?? [],
        auditEvents: auditEvents.data ?? [],
        alertDeliveries: alertDeliveries.data ?? [],
        approvals: approvals.data ?? [],
        sqliteBackups: sqliteBackups.data ?? [],
        breakdown,
        timeseries: timeseries.data ?? [],
        users: users.data ?? [],
        resources,
        providerCatalog: providerCatalog.data ?? [],
      });
    } catch (err) {
      if (isAuthExpiredError(err)) return;
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
    selectView("overview", { replace: true });
  }

  async function saveModal(values: Record<string, string>) {
    if (!modal) return;
    setLoading(true);
    setError("");
    try {
      if (modal.item) {
        await modal.config.update?.(api, modal.item, values);
      } else {
        await modal.config.create?.(api, values, data);
      }
      setModal(null);
      await load();
    } catch (err) {
      if (isAuthExpiredError(err)) return;
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
      if (isAuthExpiredError(err)) return;
      setError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setLoading(false);
    }
  }

  function openCreateRoute() {
    if (!activeConfig) return;
    if (loading) {
      setNotice("");
      setError("数据加载中，请稍后再操作。");
      return;
    }
    if (data.models.length === 0) {
      setNotice("");
      setError("请先维护模型目录，再新增路由策略。");
      selectView("models");
      return;
    }
    if (data.providers.length === 0) {
      setNotice("");
      setError("请先新增 Provider 渠道，再配置路由策略。");
      selectView("providers");
      return;
    }
    setModal({ config: activeConfig });
  }

  async function reorderModelRoutes(model: Model, orderedRoutes: ModelRoute[]) {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      for (let index = 0; index < orderedRoutes.length; index += 1) {
        const route = orderedRoutes[index];
        const nextPriority = index + 1;
        if (route.priority === nextPriority) continue;
        await adminMutate(api, `/api/admin/routing-rules/${route.id}`, "PATCH", routePayload({
          ...stringifyForm(route),
          priority: String(nextPriority),
        }));
      }
      setNotice(`已更新 ${model.name} 的 Provider 调用顺序`);
      await load();
    } catch (err) {
      if (isAuthExpiredError(err)) return;
      setError(err instanceof Error ? err.message : "更新路由顺序失败");
    } finally {
      setLoading(false);
    }
  }

  const viewItems = activeConfig?.list(data) ?? [];
  const categoryItems = filterByModelCategory(activeConfig?.view, viewItems, modelCategoryFilter, data);
  const filteredItems = filterRows(categoryItems, query);
  const crudPagination = usePagination(filteredItems.length, `${activeView}:${modelCategoryFilter}:${query}`);
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
        onSelect={selectView}
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
        <TopNav />

        <div className="content-panel">
          <header className="page-header">
            <div>
              <p className="eyebrow">Enterprise AI Gateway</p>
              <h1>{activeMeta.title}</h1>
              <p className="page-desc">{activeMeta.description}</p>
            </div>
          </header>

          {error ? <div className="status-line error">{error}</div> : null}
          {notice ? <div className="status-line success">{notice}</div> : null}

          <div className="divider" />

          {activeView === "overview" ? (
            <OverviewView data={data} onSelect={selectView} />
          ) : activeView === "playground" ? (
            <PlaygroundPage api={api} data={data} />
          ) : activeView === "gateway" ? (
            <GatewayView data={data} />
          ) : activeView === "usage" ? (
            <UsageView data={data} />
          ) : activeView === "billing" ? (
            <BillingView data={data} />
          ) : activeView === "audit" ? (
            <AuditView api={api} data={data} />
          ) : activeView === "settings" ? (
            <SettingsView
              data={data}
              activeTab={settingsTab}
              onTabChange={setSettingsTab}
              onCreate={(config) => setModal({ config })}
              onEdit={(config, item) => setModal({ config, item })}
              onDelete={(config, item) => setConfirmDelete({ config, item })}
              onAction={(action, item) => void runResourceAction(action, item, data)}
              onToolbarAction={(action, items) => void runToolbarAction(action, items)}
            />
          ) : activeView === "routes" && activeConfig ? (
            <RouteStrategyView
              config={activeConfig as ResourceConfig<ModelRoute>}
              data={data}
              loading={loading}
              onCreate={openCreateRoute}
              onEdit={(route) => setModal({ config: activeConfig, item: route })}
              onDelete={(route) => setConfirmDelete({ config: activeConfig, item: route })}
              onReorder={(model, routes) => void reorderModelRoutes(model, routes)}
            />
          ) : activeView === "models" && activeConfig ? (
            <ModelCatalogView
              config={activeConfig as ResourceConfig<Model>}
              data={data}
              onCreate={() => setModal({ config: activeConfig })}
              onEdit={(item) => setModal({ config: activeConfig, item })}
              onDelete={(item) => setConfirmDelete({ config: activeConfig, item })}
              onAction={(action, item) => void runResourceAction(action, item, data)}
            />
          ) : activeConfig ? (
            <CrudView
              config={activeConfig}
              data={data}
              items={pagedItems}
              totalItems={filteredItems.length}
              query={query}
              pagination={crudPagination}
              issuedKey={activeView === "api-keys" || activeView === "approvals" ? issuedKey : ""}
              categoryFilter={modelCategoryFilter}
              onCategoryFilter={setModelCategoryFilter}
              onQuery={setQuery}
              onCreate={() => {
                if (loading) {
                  setNotice("");
                  setError("数据加载中，请稍后再操作。");
                  return;
                }
                if (activeConfig.view === "providers") {
                  setProviderCreateOpen(true);
                  return;
                }
                if (activeConfig.view === "api-keys" && data.projects.length === 0) {
                  setNotice("");
                  setError("请先创建项目，再在项目下发放 API Key。");
                  selectView("projects");
                  return;
                }
                setModal({ config: activeConfig });
              }}
              onEdit={(item) => {
                if (activeConfig.view === "providers") {
                  setProviderEditItem(item as Provider);
                  return;
                }
                setModal({ config: activeConfig, item });
              }}
              onDelete={(item) => setConfirmDelete({ config: activeConfig, item })}
              onAction={(action, item) => void runResourceAction(action, item, data)}
              onToolbarAction={(action) => void runToolbarAction(action, filteredItems)}
            />
          ) : null}
        </div>
      </section>

      {modal ? (
        <EditModal
          state={modal}
          data={data}
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

      {providerCreateOpen ? (
        <ProviderUpsertModal
          mode="create"
          api={api}
          catalog={data.providerCatalog}
          standardModels={data.models}
          loading={loading}
          onClose={() => setProviderCreateOpen(false)}
          onSaved={async () => {
            setProviderCreateOpen(false);
            await load();
          }}
          setLoading={setLoading}
          setError={setError}
          setNotice={setNotice}
        />
      ) : null}

      {providerEditItem ? (
        <ProviderUpsertModal
          mode="edit"
          provider={providerEditItem}
          api={api}
          catalog={data.providerCatalog}
          standardModels={data.models}
          routes={data.routes}
          loading={loading}
          onClose={() => setProviderEditItem(null)}
          onSaved={async () => {
            setProviderEditItem(null);
            await load();
          }}
          setLoading={setLoading}
          setError={setError}
          setNotice={setNotice}
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

  async function runResourceAction<T>(action: ResourceAction<T>, item: T, appData: AppData) {
    if (action.modal) {
      setModal(action.modal(item, appData));
      return;
    }
    if (!action.run) return;
    setLoading(true);
    setError("");
    setNotice("");
    try {
      await action.run(api, item);
      setNotice(action.doneMessage?.(item) ?? "操作已完成");
      await load();
    } catch (err) {
      if (isAuthExpiredError(err)) return;
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setLoading(false);
    }
  }

  async function runToolbarAction(action: ToolbarAction, items: unknown[]) {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      await action.run(api, items);
      setNotice(action.doneMessage?.() ?? "操作已完成");
      await load();
    } catch (err) {
      if (isAuthExpiredError(err)) return;
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setLoading(false);
    }
  }
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
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");

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

function TopNav() {
  return (
    <header className="topbar">
      <div className="top-context">
        <strong>TokenHub 控制台</strong>
        <small>Enterprise AI Gateway</small>
      </div>
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
  const chatModels = playgroundModels(data);
  const activeRoutes = data.routes.filter((route) => route.status === "active").length;
  const cards = [
    { label: "总请求", value: formatNumber(data.summary.request_count), icon: BarChart3 },
    { label: "总 Token", value: compactNumber(data.summary.total_tokens), icon: Database },
    { label: "总成本", value: `$${formatMoney(data.summary.estimated_cost_usd)}`, icon: CircleDollarSign },
    { label: "Provider", value: formatNumber(data.providers.length), icon: Server },
  ];
  const steps: Array<[string, string, ViewKey]> = [
    ["接入 Provider", "配置上游服务商、Base URL、API Key，并映射到标准模型目录。", "providers"],
    ["维护模型目录", "定义内部对外模型名、上下文窗口和计价口径。", "models"],
    ["建立路由策略", "把对外模型映射到 Provider 的上游模型，并配置优先级与权重。", "routes"],
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
          <button className="overview-playground-card" onClick={() => onSelect("playground")} type="button">
            <span className="overview-playground-icon">
              <Sparkles size={17} />
            </span>
            <span>
              <strong>模型演练场</strong>
              <small>{chatModels.length} 个可选聊天模型 · {activeRoutes} 条启用路由</small>
            </span>
          </button>
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
              ["Provider", data.providers.length, "上游渠道实例，包含 Base URL 与 Key"],
              ["模型", data.models.length, "对外模型目录"],
              ["路由", data.routes.length, "对外模型到 Provider 的映射规则"],
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
            ["Provider", "上游渠道实例、凭证和健康状态", `${data.providers.length} providers`],
            ["路由", "对外模型到 Provider 的优先级/权重映射", `${data.routes.length} rules`],
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
    <>
      <DataSection title="成本中心">
        <SimpleTable
          columns={["成本中心", "请求", "Token", "估算成本"]}
          paginationKey="billing-cost-centers"
          rows={(data.breakdown.cost_centers ?? []).map((row) => [
            row.id,
            formatNumber(row.request_count),
            compactNumber(row.total_tokens),
            `$${formatMoney(row.estimated_cost_usd)}`,
          ])}
        />
      </DataSection>
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
        <DataSection title="Provider 明细成本">
          <SimpleTable
            columns={["命中 Provider", "请求", "Token", "估算成本"]}
            paginationKey="billing-provider-resources"
            rows={providerCostDetailRows(data).map((row) => [
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

function AuditView({ api, data }: { api: ApiContext; data: AppData }) {
  const [activeAuditTab, setActiveAuditTab] = useState<"requests" | "admin">("requests");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "ok" | "error">("all");
  const [selectedRequestID, setSelectedRequestID] = useState("");
  const [detail, setDetail] = useState<RequestDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const filteredLogs = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return data.logs.filter((log) => {
      if (statusFilter === "ok" && log.status_code >= 400) return false;
      if (statusFilter === "error" && log.status_code < 400) return false;
      if (!keyword) return true;
      return [
        log.request_id,
        log.project_id,
        projectName(data, log.project_id),
        log.api_key_id,
        log.model,
        log.provider_id,
        providerAuditLabel(data, log),
        log.provider_resource_id,
        log.provider_model,
        log.error_code,
        String(log.status_code),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [data, query, statusFilter]);

  const requestLogPagination = usePagination(filteredLogs.length, `request-logs:${statusFilter}:${query.trim()}`);
  const visibleLogs = useMemo(
    () => filteredLogs.slice(requestLogPagination.startIndex, requestLogPagination.endIndex),
    [filteredLogs, requestLogPagination.startIndex, requestLogPagination.endIndex],
  );

  useEffect(() => {
    if (activeAuditTab !== "requests") return;
    if (filteredLogs.length === 0) {
      setSelectedRequestID("");
      setDetail(null);
      return;
    }
    const selectedVisible = visibleLogs.some((log) => log.request_id === selectedRequestID);
    if (!selectedRequestID || !selectedVisible) {
      setSelectedRequestID((visibleLogs[0] ?? filteredLogs[0]).request_id);
    }
  }, [activeAuditTab, filteredLogs, selectedRequestID, visibleLogs]);

  useEffect(() => {
    if (activeAuditTab !== "requests") return;
    if (!selectedRequestID) {
      setDetail(null);
      return;
    }
    let alive = true;
    setDetailLoading(true);
    setDetailError("");
    adminFetch(api, `/api/admin/audit/requests/${encodeURIComponent(selectedRequestID)}`)
      .then(async (resp) => {
        if (!resp.ok) throw new Error(`request detail ${resp.status}`);
        return (await resp.json()) as RequestDetail;
      })
      .then((payload) => {
        if (!alive) return;
        setDetail({
          log: payload.log,
          usage: payload.usage ?? [],
          attempts: payload.attempts ?? [],
          payload: payload.payload ?? null,
        });
      })
      .catch((err) => {
        if (isAuthExpiredError(err) || !alive) return;
        setDetail(null);
        setDetailError(err instanceof Error ? err.message : "请求详情加载失败");
      })
      .finally(() => {
        if (alive) setDetailLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [activeAuditTab, api, selectedRequestID]);

  const requestStats = useMemo(() => {
    const total = data.logs.length;
    const failures = data.logs.filter((log) => log.status_code >= 400).length;
    const averageLatency = total
      ? Math.round(data.logs.reduce((sum, log) => sum + (log.latency_ms || 0), 0) / total)
      : 0;
    const successRate = total ? Math.round(((total - failures) / total) * 100) : 0;
    return { total, failures, averageLatency, successRate };
  }, [data.logs]);

  const filters = [
    { key: "all", label: `全部 ${data.logs.length}` },
    { key: "ok", label: `成功 ${data.logs.length - requestStats.failures}` },
    { key: "error", label: `失败 ${requestStats.failures}` },
  ] as const;

  return (
    <div className="audit-view">
      <div className="audit-tabs" role="tablist" aria-label="审计类型">
        <button
          type="button"
          className={`audit-tab ${activeAuditTab === "requests" ? "active" : ""}`}
          onClick={() => setActiveAuditTab("requests")}
          role="tab"
          aria-selected={activeAuditTab === "requests"}
        >
          <Activity size={15} />
          <span>大模型请求历史</span>
          <strong>{formatNumber(data.logs.length)}</strong>
        </button>
        <button
          type="button"
          className={`audit-tab ${activeAuditTab === "admin" ? "active" : ""}`}
          onClick={() => setActiveAuditTab("admin")}
          role="tab"
          aria-selected={activeAuditTab === "admin"}
        >
          <ShieldCheck size={15} />
          <span>后台操作审计</span>
          <strong>{formatNumber(data.auditEvents.length)}</strong>
        </button>
      </div>

      {activeAuditTab === "requests" ? (
        <DataSection title="大模型请求历史">
          <div className="request-history">
            <div className="request-history-toolbar">
              <label className="request-search" aria-label="搜索请求历史">
                <Search size={15} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索请求 ID、模型、Provider、状态码"
                />
              </label>
              <div className="request-filter-tabs" role="tablist" aria-label="请求状态筛选">
                {filters.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    className={statusFilter === filter.key ? "active" : ""}
                    onClick={() => setStatusFilter(filter.key)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="metrics request-metrics">
              <RequestMetric label="总请求" value={formatNumber(requestStats.total)} icon={Activity} />
              <RequestMetric label="成功率" value={`${requestStats.successRate}%`} icon={Check} />
              <RequestMetric label="失败请求" value={formatNumber(requestStats.failures)} icon={AlertCircle} />
              <RequestMetric label="平均延迟" value={`${requestStats.averageLatency}ms`} icon={Gauge} />
            </div>

            <div className="request-history-layout">
              <div className="request-list-panel">
                <div className="request-list-head">
                  <span>请求列表</span>
                  <strong>{formatNumber(filteredLogs.length)} 条</strong>
                </div>
                {filteredLogs.length === 0 ? (
                  <div className="compact-empty">没有匹配的请求记录</div>
                ) : (
                  <div className="request-list" role="list">
                    {visibleLogs.map((log) => (
                      <button
                        key={log.request_id}
                        type="button"
                        className={`request-list-row ${selectedRequestID === log.request_id ? "active" : ""}`}
                        onClick={() => setSelectedRequestID(log.request_id)}
                      >
                        <span className="request-row-main">
                          <strong>{log.model || "-"}</strong>
                          <span>{log.request_id}</span>
                        </span>
                        <span className="request-row-meta">
                          <span>{providerAuditLabel(data, log)}</span>
                          <span>{formatTime(log.created_at)}</span>
                        </span>
                        <span className="request-row-tail">
                          <StatusPill status={log.status_code >= 400 ? "error" : "ok"} label={String(log.status_code || "-")} />
                          <span>{log.latency_ms || 0}ms</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                <PaginationControls pagination={requestLogPagination} totalItems={filteredLogs.length} />
              </div>

              <RequestDetailPanel
                data={data}
                requestID={selectedRequestID}
                detail={detail?.log.request_id === selectedRequestID ? detail : null}
                loading={detailLoading}
                error={detailError}
              />
            </div>
          </div>
        </DataSection>
      ) : (
        <DataSection title="后台操作审计">
          <SimpleTable
            columns={["时间", "操作人", "动作", "对象", "对象 ID", "状态", "来源 IP"]}
            paginationKey="admin-audit-events"
            rows={data.auditEvents.map((event) => [
              formatTime(event.created_at),
              event.actor_name || event.actor_user_id || "-",
              actionLabel(event.action),
              resourceTypeLabel(event.resource_type),
              event.resource_id || "-",
              <StatusPill key={event.id} status={event.status === "success" ? "ok" : "error"} label={enumValueLabel(event.status)} />,
              event.ip || "-",
            ])}
          />
        </DataSection>
      )}
    </div>
  );
}

function RequestDetailPanel({
  data,
  requestID,
  detail,
  loading,
  error,
}: {
  data: AppData;
  requestID: string;
  detail: RequestDetail | null;
  loading: boolean;
  error: string;
}) {
  const [copied, setCopied] = useState(false);

  if (!requestID) {
    return (
      <div className="request-detail-panel">
        <div className="compact-empty">暂无大模型请求记录</div>
      </div>
    );
  }

  if (loading && !detail) {
    return (
      <div className="request-detail-panel">
        <div className="compact-empty">正在加载请求详情...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="request-detail-panel">
        <div className="status-line error">{error}</div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="request-detail-panel">
        <div className="compact-empty">请选择一条请求</div>
      </div>
    );
  }

  const { log } = detail;
  const usageTotals = detail.usage.reduce(
    (sum, item) => ({
      input_tokens: sum.input_tokens + (item.input_tokens || 0),
      output_tokens: sum.output_tokens + (item.output_tokens || 0),
      total_tokens: sum.total_tokens + (item.total_tokens || 0),
      estimated_cost_usd: sum.estimated_cost_usd + (item.estimated_cost_usd || 0),
    }),
    { input_tokens: 0, output_tokens: 0, total_tokens: 0, estimated_cost_usd: 0 },
  );
  const isError = log.status_code >= 400;

  async function copyRequestID() {
    await navigator.clipboard?.writeText(log.request_id).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="request-detail-panel">
      <div className="request-detail-head">
        <div>
          <span>请求详情</span>
          <strong>{log.model || "-"}</strong>
        </div>
        <StatusPill status={isError ? "error" : "ok"} label={String(log.status_code || "-")} />
      </div>

      <div className="request-id-line">
        <code>{log.request_id}</code>
        <button type="button" className="request-copy-button" onClick={() => void copyRequestID()} title="复制请求 ID">
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>

      <div className="request-detail-grid">
        <DetailField label="时间" value={formatTime(log.created_at)} />
        <DetailField label="延迟" value={`${log.latency_ms || 0}ms`} />
        <DetailField label="项目" value={projectName(data, log.project_id)} />
        <DetailField label="API Key" value={apiKeyAuditLabel(data, log.api_key_id)} />
        <DetailField label="最终 Provider" value={providerAuditLabel(data, log)} />
        <DetailField label="Provider 资源" value={providerResourceAuditLabel(data, log.provider_resource_id)} />
        <DetailField label="上游模型" value={log.provider_model || "-"} />
        <DetailField label="客户端 IP" value={log.client_ip || "-"} />
      </div>

      {log.error_code ? (
        <div className="request-error-box">
          <strong>{log.error_code}</strong>
        </div>
      ) : null}

      <RequestPayloadSection payload={detail.payload ?? null} />

      <div className="request-subsection">
        <div className="request-subsection-title">
          <span>Token 与成本</span>
          <strong>{detail.usage.length ? `${detail.usage.length} 条记录` : "暂无记录"}</strong>
        </div>
        <div className="request-usage-strip">
          <UsageStat label="输入" value={compactNumber(usageTotals.input_tokens)} />
          <UsageStat label="输出" value={compactNumber(usageTotals.output_tokens)} />
          <UsageStat label="总量" value={compactNumber(usageTotals.total_tokens)} />
          <UsageStat label="估算成本" value={`$${formatMoney(usageTotals.estimated_cost_usd)}`} />
        </div>
      </div>

      <div className="request-subsection">
        <div className="request-subsection-title">
          <span>路由尝试</span>
          <strong>{detail.attempts.length > 1 ? `${detail.attempts.length} 次，含 fallback` : `${detail.attempts.length} 次`}</strong>
        </div>
        {detail.attempts.length === 0 ? (
          <div className="compact-empty">没有记录到路由尝试</div>
        ) : (
          <div className="attempt-timeline">
            {detail.attempts.map((attempt) => (
              <div className="attempt-row" key={attempt.id || `${attempt.request_id}-${attempt.attempt_index}`}>
                <div className={`attempt-marker ${attempt.status_code >= 400 ? "error" : "ok"}`}>
                  {attempt.attempt_index}
                </div>
                <div className="attempt-content">
                  <div className="attempt-head">
                    <strong>{providerAttemptLabel(data, attempt)}</strong>
                    <StatusPill
                      status={attempt.status_code >= 400 ? "error" : "ok"}
                      label={String(attempt.status_code || "-")}
                    />
                  </div>
                  <div className="attempt-meta">
                    <span>上游模型 {attempt.provider_model || "-"}</span>
                    <span>资源 {providerResourceAuditLabel(data, attempt.provider_resource_id)}</span>
                    <span>路由 {attempt.route_id || "-"}</span>
                  </div>
                  {attempt.error_code || attempt.error_message ? (
                    <p className="attempt-error">
                      {[attempt.error_code, attempt.error_message].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="request-client-agent">
        <span>User-Agent</span>
        <code>{log.user_agent || "-"}</code>
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="detail-field">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function UsageStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="usage-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RequestPayloadSection({ payload }: { payload: RequestPayloadLog | null }) {
  return (
    <div className="request-subsection">
      <div className="request-subsection-title">
        <span>请求与响应</span>
        <strong>{payload ? "已记录快照" : "未记录"}</strong>
      </div>
      {!payload ? (
        <div className="compact-empty">这条历史记录没有保存 request / response 快照</div>
      ) : (
        <div className="payload-grid">
          <PayloadBlock
            title="Request"
            body={payload.request_body || "未记录请求内容"}
            truncated={payload.request_truncated}
          />
          <PayloadBlock
            title="Response"
            body={payload.response_body || "未记录响应内容"}
            truncated={payload.response_truncated}
          />
        </div>
      )}
    </div>
  );
}

function PayloadBlock({ title, body, truncated }: { title: string; body: string; truncated: boolean }) {
  return (
    <div className="payload-block">
      <div className="payload-block-head">
        <span>{title}</span>
        {truncated ? <strong>已截断</strong> : null}
      </div>
      <pre>
        <code>{body}</code>
      </pre>
    </div>
  );
}

function RequestMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number }>;
}) {
  return (
    <article className="metric compact-metric">
      <div className="metric-label">
        <Icon size={17} />
        {label}
      </div>
      <div className="metric-value">{value}</div>
    </article>
  );
}

function CrudView<T>({
  config,
  data,
  items,
  totalItems,
  query,
  pagination,
  issuedKey,
  categoryFilter,
  onCategoryFilter,
  onQuery,
  onCreate,
  onEdit,
  onDelete,
  onAction,
  onToolbarAction,
}: {
  config: ResourceConfig<T>;
  data: AppData;
  items: T[];
  totalItems: number;
  query: string;
  pagination: PaginationState;
  issuedKey: string;
  categoryFilter: string;
  onCategoryFilter: (value: string) => void;
  onQuery: (value: string) => void;
  onCreate: () => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  onAction: (action: ResourceAction<T>, item: T) => void;
  onToolbarAction: (action: ToolbarAction) => void;
}) {
  return (
    <DataSection title={config.eyebrow}>
      {config.view === "api-keys" ? <APIKeyFlowHint data={data} /> : null}
      {config.view === "routes" ? <RouteStrategyHint data={data} /> : null}
      {config.view === "providers" || config.view === "models" ? (
        <ModelCategoryTabs
          data={data}
          view={config.view}
          active={categoryFilter}
          onChange={onCategoryFilter}
        />
      ) : null}
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
        {(config.toolbarActions ?? []).map((action) => (
          <button className="secondary-button" key={action.label} onClick={() => onToolbarAction(action)} title={action.title} type="button">
            {action.label}
          </button>
        ))}
      </div>
      {issuedKey ? <div className="secret">新 Key 仅展示一次：{issuedKey}</div> : null}
      <EntityTable config={config} data={data} items={items} onEdit={onEdit} onDelete={onDelete} onAction={onAction} />
      <PaginationControls pagination={pagination} totalItems={totalItems} />
    </DataSection>
  );
}

function ModelCategoryTabs({
  data,
  view,
  active,
  onChange,
}: {
  data: AppData;
  view: ViewKey;
  active: string;
  onChange: (value: string) => void;
}) {
  const tabs = modelCategoryTabs(data, view);
  if (tabs.length <= 1) return null;
  return (
    <div className="category-tabs" role="tablist" aria-label="模型分类">
      {tabs.map((tab) => (
        <button
          className={active === tab.key ? "category-tab active" : "category-tab"}
          key={tab.key}
          onClick={() => onChange(tab.key)}
          type="button"
        >
          <span>{tab.label}</span>
          <em>{tab.count}</em>
        </button>
      ))}
    </div>
  );
}

function ModelCatalogView({
  config,
  data,
  onCreate,
  onEdit,
  onDelete,
  onAction,
}: {
  config: ResourceConfig<Model>;
  data: AppData;
  onCreate: () => void;
  onEdit: (item: Model) => void;
  onDelete: (item: Model) => void;
  onAction: (action: ResourceAction<Model>, item: Model) => void;
}) {
  const [category, setCategory] = useState("all");
  const [capability, setCapability] = useState("all");
  const [query, setQuery] = useState("");
  const categories = modelCatalogCategories(data);
  const capabilities = modelCatalogCapabilityTabs(data);
  const filtered = useMemo(
    () => filterModelCatalog(data.models, data, category, capability, query),
    [data, category, capability, query],
  );

  return (
    <DataSection title={config.eyebrow}>
      <div className="model-catalog">
        <aside className="model-catalog-sidebar">
          <div className="model-catalog-sidebar-head">
            <strong>模型大类</strong>
            <span>{data.models.length} 个模型</span>
          </div>
          <div className="model-provider-list">
            {categories.map((item) => (
              <button
                className={category === item.key ? "model-provider-filter active" : "model-provider-filter"}
                key={item.key}
                onClick={() => setCategory(item.key)}
                type="button"
              >
                <span className="model-provider-icon">{modelCategoryInitial(item.key, item.label)}</span>
                <strong>{item.label}</strong>
                <em>{item.count}</em>
              </button>
            ))}
          </div>
        </aside>

        <section className="model-catalog-main">
          <div className="model-filterbar">
            <div className="model-capability-tabs" role="tablist" aria-label="模型能力筛选">
              {capabilities.map((item) => (
                <button
                  aria-selected={capability === item.key}
                  className={capability === item.key ? "model-capability-tab active" : "model-capability-tab"}
                  key={item.key}
                  onClick={() => setCapability(item.key)}
                  role="tab"
                  type="button"
                >
                  <item.icon size={14} />
                  <span>{item.label}</span>
                  <em>{item.count}</em>
                </button>
              ))}
            </div>
            <div className="model-catalog-actions">
              <div className="search-box model-search">
                <Search size={16} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索模型名称或 ID"
                />
              </div>
              <button className="button" onClick={onCreate} type="button">
                <Plus size={17} />
                {config.createLabel ?? "新增模型"}
              </button>
            </div>
          </div>

          <div className="model-catalog-summary">
            <span>{modelCatalogFilterLabel(categories, category)}</span>
            <strong>{filtered.length}</strong>
            <em>个匹配模型</em>
          </div>

          {filtered.length === 0 ? (
            <div className="empty model-catalog-empty">没有匹配的模型</div>
          ) : (
            <div className="model-card-grid">
              {filtered.map((model) => (
                <ModelCatalogCard
                  key={model.name}
                  model={model}
                  data={data}
                  actions={config.actions ?? []}
                  onAction={onAction}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </DataSection>
  );
}

function RouteStrategyView({
  config,
  data,
  loading,
  onCreate,
  onEdit,
  onDelete,
  onReorder,
}: {
  config: ResourceConfig<ModelRoute>;
  data: AppData;
  loading: boolean;
  onCreate: () => void;
  onEdit: (item: ModelRoute) => void;
  onDelete: (item: ModelRoute) => void;
  onReorder: (model: Model, routes: ModelRoute[]) => void;
}) {
  const [category, setCategory] = useState("all");
  const [scope, setScope] = useState<"configured" | "all">("configured");
  const [query, setQuery] = useState("");
  const [draggedRouteID, setDraggedRouteID] = useState("");
  const categories = routeModelCategories(data);
  const filtered = useMemo(
    () => filterRouteModels(data, category, scope, query),
    [data, category, scope, query],
  );
  const configuredCount = data.models.filter((model) => modelRoutesFor(model, data).length > 0).length;
  const activeRouteCount = data.routes.filter((route) => route.status === "active").length;

  return (
    <DataSection title={config.eyebrow}>
      <RouteStrategyHint data={data} />
      <div className="route-matrix">
        <aside className="model-catalog-sidebar">
          <div className="model-catalog-sidebar-head">
            <strong>统一模型</strong>
            <span>{configuredCount} 个已配置路由</span>
          </div>
          <div className="model-provider-list">
            {categories.map((item) => (
              <button
                className={category === item.key ? "model-provider-filter active" : "model-provider-filter"}
                key={item.key}
                onClick={() => setCategory(item.key)}
                type="button"
              >
                <span className="model-provider-icon">{modelCategoryInitial(item.key, item.label)}</span>
                <strong>{item.label}</strong>
                <em>{item.count}</em>
              </button>
            ))}
          </div>
        </aside>

        <section className="model-catalog-main">
          <div className="model-filterbar">
            <div className="model-capability-tabs" role="tablist" aria-label="路由显示范围">
              <button
                aria-selected={scope === "configured"}
                className={scope === "configured" ? "model-capability-tab active" : "model-capability-tab"}
                onClick={() => setScope("configured")}
                role="tab"
                type="button"
              >
                <Gauge size={14} />
                <span>已配置</span>
                <em>{configuredCount}</em>
              </button>
              <button
                aria-selected={scope === "all"}
                className={scope === "all" ? "model-capability-tab active" : "model-capability-tab"}
                onClick={() => setScope("all")}
                role="tab"
                type="button"
              >
                <Boxes size={14} />
                <span>全部模型</span>
                <em>{data.models.length}</em>
              </button>
            </div>
            <div className="model-catalog-actions">
              <div className="search-box model-search">
                <Search size={16} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索模型或 Provider" />
              </div>
              <button className="button" onClick={onCreate} type="button">
                <Plus size={17} />
                {config.createLabel ?? "新增路由"}
              </button>
            </div>
          </div>

          <div className="model-catalog-summary">
            <span>{modelCatalogFilterLabel(categories, category)}</span>
            <strong>{filtered.length}</strong>
            <em>个模型 · {activeRouteCount}/{data.routes.length} 条启用线路</em>
          </div>

          {filtered.length === 0 ? (
            <div className="empty model-catalog-empty">没有匹配的模型路由</div>
          ) : (
            <div className="route-model-list">
              {filtered.map((model) => (
                <RouteModelCard
                  key={model.name}
                  model={model}
                  data={data}
                  loading={loading}
                  draggedRouteID={draggedRouteID}
                  onDragStart={setDraggedRouteID}
                  onDragEnd={() => setDraggedRouteID("")}
                  onDrop={(targetRouteID) => {
                    const routes = modelRoutesFor(model, data);
                    const reordered = reorderRoutes(routes, draggedRouteID, targetRouteID);
                    setDraggedRouteID("");
                    if (reordered !== routes) onReorder(model, reordered);
                  }}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </DataSection>
  );
}

function RouteModelCard({
  model,
  data,
  loading,
  draggedRouteID,
  onDragStart,
  onDragEnd,
  onDrop,
  onEdit,
  onDelete,
}: {
  model: Model;
  data: AppData;
  loading: boolean;
  draggedRouteID: string;
  onDragStart: (routeID: string) => void;
  onDragEnd: () => void;
  onDrop: (targetRouteID: string) => void;
  onEdit: (route: ModelRoute) => void;
  onDelete: (route: ModelRoute) => void;
}) {
  const routes = modelRoutesFor(model, data);
  const activeRoutes = routes.filter((route) => route.status === "active");
  const category = modelCategory(model);
  return (
    <article className="route-model-card">
      <div className="route-model-head">
        <div>
          <div className="model-card-brand compact">
            <span>{modelCategoryInitial(category, modelCategoryLabel(category))}</span>
            <div>
              <em>{modelCategoryLabel(category)}</em>
              <strong>{model.modality || "chat"}</strong>
            </div>
          </div>
          <h2>{model.name}</h2>
        </div>
        <div className="route-model-stats">
          <StatusPill status={routes.length > 0 ? "active" : "disabled"} label={routes.length > 0 ? `${activeRoutes.length}/${routes.length} 启用` : "未配置"} />
          <span>按上到下顺序调用</span>
        </div>
      </div>

      {routes.length === 0 ? (
        <div className="empty route-empty">该统一模型还没有 Provider 线路</div>
      ) : (
        <div className="route-order-list">
          {routes.map((route, index) => (
            <RouteProviderRow
              key={route.id}
              route={route}
              index={index}
              provider={findProvider(data, route.provider_id)}
              dragging={draggedRouteID === route.id}
              loading={loading}
              onDragStart={() => onDragStart(route.id)}
              onDragEnd={onDragEnd}
              onDrop={() => onDrop(route.id)}
              onEdit={() => onEdit(route)}
              onDelete={() => onDelete(route)}
            />
          ))}
        </div>
      )}
    </article>
  );
}

function RouteProviderRow({
  route,
  provider,
  index,
  dragging,
  loading,
  onDragStart,
  onDragEnd,
  onDrop,
  onEdit,
  onDelete,
}: {
  route: ModelRoute;
  provider?: Provider;
  index: number;
  dragging: boolean;
  loading: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDrop: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={dragging ? "route-provider-row dragging" : "route-provider-row"}
      draggable={!loading}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDragEnd={onDragEnd}
      onDrop={(event) => {
        event.preventDefault();
        onDrop();
      }}
    >
      <button className="route-drag-handle" disabled={loading} title="拖动调整调用顺序" type="button">
        <GripVertical size={15} />
      </button>
      <div className="route-order-badge">{index === 0 ? "主" : index + 1}</div>
      <div className="route-provider-main">
        <strong>{provider?.name || route.provider_id}</strong>
        <span>{providerTypeLabel(provider?.type)} · {provider?.base_url || "未配置 Base URL"}</span>
      </div>
      <div className="route-upstream-model">
        <strong>{route.provider_model}</strong>
        <span>{routeStrategyLabel(route.strategy)} · P{route.priority} · W{route.weight}</span>
      </div>
      <StatusPill status={route.status} />
      <div className="route-row-actions">
        <button className="text-button" onClick={onEdit} type="button">编辑</button>
        <button className="danger-button" onClick={onDelete} title="删除" type="button">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

function ModelCatalogCard({
  model,
  data,
  actions,
  onAction,
  onEdit,
  onDelete,
}: {
  model: Model;
  data: AppData;
  actions: ResourceAction<Model>[];
  onAction: (action: ResourceAction<Model>, item: Model) => void;
  onEdit: (item: Model) => void;
  onDelete: (item: Model) => void;
}) {
  const category = modelCategory(model);
  const routeCount = activeRouteCount(model.name, data);
  return (
    <article className="model-card">
      <div className="model-card-head">
        <div className="model-card-brand">
          <span>{modelCategoryInitial(category, modelCategoryLabel(category))}</span>
          <div>
            <em>{modelCategoryLabel(category)}</em>
            <strong>{model.modality || "chat"}</strong>
          </div>
        </div>
        <StatusPill status={model.status} />
      </div>

      <h2>{model.name}</h2>

      <div className="model-card-tags">
        <span>{modelCapabilityLabel(model)}</span>
        <span>{routeCount > 0 ? `${routeCount} 条线路` : "未配置线路"}</span>
        {hasThirdPartyRoute(model, data) ? <span className="third">三方资源</span> : <span className="official">官方资源</span>}
      </div>

      <div className="model-card-pricing">
        <ModelMetric label="输入" value={priceMetric(model.input_price_usd_per_1m)} muted={!model.input_price_usd_per_1m} />
        <ModelMetric label="输出" value={priceMetric(model.output_price_usd_per_1m)} muted={!model.output_price_usd_per_1m} />
        <ModelMetric label="上下文" value={model.context_window ? formatNumber(model.context_window) : "-"} />
        <ModelMetric label="Embedding" value={priceMetric(model.embedding_price_usd_per_1m)} muted={!model.embedding_price_usd_per_1m} />
      </div>

      <div className="model-card-routes">
        <ModelRouteProviders model={model} data={data} />
      </div>

      <div className="model-card-actions">
        {actions.map((action) => (
          <button className="text-button" key={action.label} onClick={() => onAction(action, model)} type="button">
            {action.label}
          </button>
        ))}
        <button className="text-button" onClick={() => onEdit(model)} type="button">编辑</button>
        <button className="danger-button" onClick={() => onDelete(model)} title="删除" type="button">
          <Trash2 size={15} />
        </button>
      </div>
    </article>
  );
}

function ModelMetric({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={muted ? "model-metric muted" : "model-metric"}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function SettingsView({
  data,
  activeTab,
  onTabChange,
  onCreate,
  onEdit,
  onDelete,
  onAction,
  onToolbarAction,
}: {
  data: AppData;
  activeTab: "settings" | "role-configs";
  onTabChange: (tab: "settings" | "role-configs") => void;
  onCreate: (config: ResourceConfig<AdminResource>) => void;
  onEdit: (config: ResourceConfig<AdminResource>, item: AdminResource) => void;
  onDelete: (config: ResourceConfig<AdminResource>, item: AdminResource) => void;
  onAction: (action: ResourceAction<AdminResource>, item: AdminResource) => void;
  onToolbarAction: (action: ToolbarAction, items: AdminResource[]) => void;
}) {
  const configs = useMemo(() => [systemSettingConfig(), roleConfig()], []);
  const activeConfig = configs.find((config) => config.view === activeTab) ?? configs[0];
  const [queries, setQueries] = useState<Record<string, string>>({});
  const query = queries[activeConfig.view] ?? "";
  const allItems = activeConfig.list(data);
  const filteredItems = filterRows(allItems, query);
  const pagination = usePagination(filteredItems.length, `settings:${activeConfig.view}:${query}`);
  const pagedItems = useMemo(
    () => filteredItems.slice(pagination.startIndex, pagination.endIndex),
    [filteredItems, pagination.startIndex, pagination.endIndex],
  );

  return (
    <div className="settings-view">
      <div className="settings-tabs" role="tablist" aria-label="系统设置分类">
        {configs.map((config) => (
          <button
            aria-selected={activeConfig.view === config.view}
            className={activeConfig.view === config.view ? "settings-tab active" : "settings-tab"}
            key={config.view}
            onClick={() => onTabChange(config.view as "settings" | "role-configs")}
            role="tab"
            type="button"
          >
            {config.view === "settings" ? "基础设置" : "角色配置"}
          </button>
        ))}
      </div>
      <CrudView
        config={activeConfig}
        data={data}
        items={pagedItems}
        totalItems={filteredItems.length}
        query={query}
        pagination={pagination}
        issuedKey=""
        categoryFilter="all"
        onCategoryFilter={() => undefined}
        onQuery={(value) => setQueries((current) => ({ ...current, [activeConfig.view]: value }))}
        onCreate={() => onCreate(activeConfig)}
        onEdit={(item) => onEdit(activeConfig, item)}
        onDelete={(item) => onDelete(activeConfig, item)}
        onAction={onAction}
        onToolbarAction={(action) => onToolbarAction(action, filteredItems)}
      />
    </div>
  );
}

function APIKeyFlowHint({ data }: { data: AppData }) {
  return (
    <div className="workflow-hint">
      <div>
        <strong>Key 归属逻辑</strong>
        <span>内部应用配置项目下发放的 Key；额度、模型白名单、用量和成本都会归属到该项目。</span>
      </div>
      <div className="workflow-hint-stats">
        <span>{data.projects.length} 个项目</span>
        <span>{data.keys.length} 个 Key</span>
      </div>
    </div>
  );
}

function RouteStrategyHint({ data }: { data: AppData }) {
  const activeRoutes = data.routes.filter((route) => route.status === "active").length;
  return (
    <div className="workflow-hint">
      <div>
        <strong>模型路由器</strong>
        <span>平衡模式综合权重、质量和成本；质量优先会先选高质量线路；成本优先会先选低成本线路。调用失败时会按候选顺序自动回退。</span>
      </div>
      <div className="workflow-hint-stats">
        <span>{activeRoutes} 条启用线路</span>
        <span>{data.providers.filter((provider) => provider.status === "active").length} 个 Provider</span>
      </div>
    </div>
  );
}

function EntityTable<T>({
  config,
  data,
  items,
  onEdit,
  onDelete,
  onAction,
}: {
  config: ResourceConfig<T>;
  data: AppData;
  items: T[];
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  onAction: (action: ResourceAction<T>, item: T) => void;
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
                <td key={column.key}>{column.render ? column.render(item, data) : readPath(item, column.key)}</td>
              ))}
              <td>
                <div className="row-actions">
                  {(config.actions ?? []).map((action) => (
                    <button
                      className="text-button"
                      key={action.label}
                      onClick={() => onAction(action, item)}
                      title={action.title ?? action.label}
                      type="button"
                    >
                      {action.label}
                    </button>
                  ))}
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
  data,
  loading,
  onClose,
  onSave,
}: {
  state: ModalState<T>;
  data: AppData;
  loading: boolean;
  onClose: () => void;
  onSave: (values: Record<string, string>) => void;
}) {
  const initial = {
    ...(state.item ? state.config.toForm?.(state.item) ?? {} : defaultFormValues(state.config, data)),
    ...(state.initialValues ?? {}),
  };
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
              data={data}
              value={values[field.key] ?? ""}
              editing={Boolean(state.item)}
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

function PlaygroundPage({ api, data }: { api: ApiContext; data: AppData }) {
  return (
    <section className="playground-page">
      <PlaygroundPanel api={api} data={data} />
    </section>
  );
}

function PlaygroundPanel({
  api,
  data,
}: {
  api: ApiContext;
  data: AppData;
}) {
  const models = useMemo(() => playgroundModels(data), [data.models, data.routes]);
  const [modelName, setModelName] = useState(models[0]?.name ?? "");
  const [messages, setMessages] = useState<PlaygroundMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [temperature, setTemperature] = useState("0.7");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState<PlaygroundChatPayload | null>(null);
  const selectedModel = models.find((model) => model.name === modelName);

  useEffect(() => {
    if (!modelName && models[0]?.name) {
      setModelName(models[0].name);
    }
  }, [modelName, models]);

  async function sendMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const content = draft.trim();
    if (!content || !modelName || loading) return;
    const userMessage: PlaygroundMessage = { id: uniqueUIID("msg"), role: "user", content };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft("");
    setError("");
    setLoading(true);
    try {
      const numericTemperature = Number(temperature);
      const resp = await adminFetch(api, "/api/admin/playground/chat", {
        method: "POST",
        body: JSON.stringify({
          model: modelName,
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          temperature: Number.isFinite(numericTemperature) ? numericTemperature : undefined,
        }),
      });
      if (!resp.ok) {
        throw new Error(await readAPIError(resp));
      }
      const payload = (await resp.json()) as PlaygroundChatPayload;
      const assistantText = extractAssistantText(payload);
      setLastResult(payload);
      setMessages((current) => [
        ...current,
        {
          id: uniqueUIID("msg"),
          role: "assistant",
          content: assistantText || "模型没有返回可展示内容。",
        },
      ]);
    } catch (err) {
      if (isAuthExpiredError(err)) return;
      setError(err instanceof Error ? err.message : "演练请求失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="playground-shell">
      <div className="playground-toolbar">
        <label className="field">
          <span>模型</span>
          <select value={modelName} onChange={(event) => setModelName(event.target.value)} disabled={models.length === 0}>
            {models.length === 0 ? <option value="">暂无聊天模型</option> : null}
            {models.map((model) => {
              const routeCount = activeRouteCount(model.name, data);
              return (
                <option key={model.name} value={model.name}>
                  {routeCount > 0 ? `${model.name} · ${routeCount} 条路由` : `${model.name} · 未配置路由`}
                </option>
              );
            })}
          </select>
        </label>
        <label className="field temperature-field">
          <span>Temperature</span>
          <input
            min="0"
            max="2"
            step="0.1"
            type="number"
            value={temperature}
            onChange={(event) => setTemperature(event.target.value)}
          />
        </label>
        <div className="playground-model-meta">
          <strong>{selectedModel ? modelCategoryLabel(modelCategory(selectedModel)) : "-"}</strong>
          <span>{selectedModel?.context_window ? `${compactNumber(selectedModel.context_window)} ctx` : "ctx -"}</span>
        </div>
      </div>

      {lastResult?.route ? (
        <div className="playground-route">
          <span>{lastResult.route.provider_name || lastResult.route.provider_id || "-"}</span>
          <em>{lastResult.route.provider_model || "-"}</em>
          <small>{lastResult.route.resource_name || lastResult.route.resource_id || "默认资源"} · {routeStrategyLabel(lastResult.route.strategy)} · {lastResult.attempts?.length ?? 0} 次尝试</small>
        </div>
      ) : null}

      {error ? <div className="status-line error playground-error">{error}</div> : null}

      <div className="playground-chat">
        {messages.length === 0 ? (
          <div className="playground-empty">
            <Sparkles size={20} />
            <strong>选择模型后开始对话</strong>
            <span>{data.routes.length === 0 ? "当前还没有配置模型路由。" : "请求会走当前启用的路由策略。"}</span>
          </div>
        ) : (
          messages.map((message) => (
            <div className={`playground-message ${message.role}`} key={message.id}>
              <span>{message.role === "assistant" ? "Assistant" : message.role === "system" ? "System" : "User"}</span>
              <p>{message.content}</p>
            </div>
          ))
        )}
      </div>

      <form className="playground-composer" onSubmit={sendMessage}>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="输入测试消息"
          disabled={loading || models.length === 0}
        />
        <button className="button compact" disabled={loading || !draft.trim() || models.length === 0} type="submit" title="发送">
          <Send size={15} />
        </button>
      </form>

      {lastResult?.usage ? (
        <div className="playground-foot">
          <span>Prompt {formatNumber(lastResult.usage.prompt_tokens ?? 0)}</span>
          <span>Completion {formatNumber(lastResult.usage.completion_tokens ?? 0)}</span>
          <span>Total {formatNumber(lastResult.usage.total_tokens ?? 0)}</span>
          {lastResult.request_id ? <span>{lastResult.request_id}</span> : null}
        </div>
      ) : null}

      <PlaygroundAPIExamples baseURL={api.baseURL} modelName={modelName || selectedModel?.name || "gpt-4.1-mini"} />
    </div>
  );
}

function PlaygroundAPIExamples({ baseURL, modelName }: { baseURL: string; modelName: string }) {
  const [language, setLanguage] = useState<ApiExampleLanguage>("python");
  const [copied, setCopied] = useState(false);
  const examples = useMemo(() => apiExampleScripts(baseURL, modelName), [baseURL, modelName]);
  const current = examples[language];

  async function copyCurrent() {
    try {
      await navigator.clipboard?.writeText(current);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="api-example-panel">
      <div className="api-example-header">
        <div>
          <strong>API 使用</strong>
          <span>使用以下代码示例集成 TokenHub 模型接口</span>
        </div>
        <button className="icon-button subtle" onClick={() => void copyCurrent()} type="button" title="复制代码">
          {copied ? <Check size={15} /> : <Copy size={15} />}
        </button>
      </div>
      <div className="api-example-tabs" role="tablist" aria-label="API 调用语言">
        {apiExampleLanguages.map((item) => (
          <button
            aria-selected={language === item.key}
            className={language === item.key ? "api-example-tab active" : "api-example-tab"}
            key={item.key}
            onClick={() => {
              setLanguage(item.key);
              setCopied(false);
            }}
            role="tab"
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="api-example-meta">
        <span>Chat Completions</span>
        <em>{modelName || "未选择模型"}</em>
      </div>
      <pre className="api-code-block"><code>{current}</code></pre>
    </section>
  );
}

function ProviderUpsertModal({
  mode,
  provider,
  api,
  catalog,
  standardModels,
  routes = [],
  loading,
  onClose,
  onSaved,
  setLoading,
  setError,
  setNotice,
}: {
  mode: "create" | "edit";
  provider?: Provider;
  api: ApiContext;
  catalog: ProviderCatalogEntry[];
  standardModels: Model[];
  routes?: ModelRoute[];
  loading: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
  setLoading: (value: boolean) => void;
  setError: (value: string) => void;
  setNotice: (value: string) => void;
}) {
  const availableCategories = useMemo(() => catalogModelCategoryOptions(catalog), [catalog]);
  const initialCategory = availableCategories.find((item) => item.key !== "all")?.key ?? "custom";
  const initialEntry = catalog.find((entry) => providerEntrySupportsCategory(entry, initialCategory)) ?? catalog.find((entry) => entry.id === "custom") ?? catalog[0];
  const [modelCategory, setModelCategory] = useState(initialCategory);
  const [catalogID, setCatalogID] = useState(initialEntry?.id ?? "custom");
  const [detail, setDetail] = useState<ProviderCatalogEntry | null>(null);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [modelQuery, setModelQuery] = useState("");
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState("");
  const [catalogReloadKey, setCatalogReloadKey] = useState(0);
  const [selectedModels, setSelectedModels] = useState<Record<string, boolean>>({});
  const [values, setValues] = useState<Record<string, string>>(() => ({
    id: mode === "edit" ? provider?.id ?? "" : "",
    name: mode === "edit" ? provider?.name ?? "" : initialEntry?.display_name ?? "",
    type: mode === "edit" ? provider?.type ?? "openai_compatible" : initialEntry?.type ?? "openai_compatible",
    base_url: mode === "edit" ? provider?.base_url ?? "" : initialEntry?.base_url ?? "",
    api_key: "",
    priority: String(provider?.priority ?? 10),
    status: provider?.status ?? "active",
    healthy: String(provider?.healthy ?? true),
    create_routes: mode === "create" ? "true" : "false",
  }));
  const existingRouteModels = useMemo(
    () => new Set(routes.filter((route) => provider && route.provider_id === provider.id).map((route) => route.model_name)),
    [provider, routes],
  );

  const categoryCatalog = useMemo(
    () => catalog.filter((entry) => providerEntrySupportsCategory(entry, modelCategory)),
    [catalog, modelCategory],
  );
  const customCatalogEntry = useMemo(() => buildCustomProviderCatalogEntry(modelCategory, standardModels), [modelCategory, standardModels]);

  useEffect(() => {
    if (categoryCatalog.length === 0) return;
    if (!categoryCatalog.some((entry) => entry.id === catalogID)) {
      selectCatalog(categoryCatalog[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelCategory, categoryCatalog.length]);

  useEffect(() => {
    const entry = catalogID === "custom" ? customCatalogEntry : catalog.find((item) => item.id === catalogID);
    setModelQuery("");
    setModelError("");
    if (entry && mode === "create") {
      setValues((current) => ({
        ...current,
        name: catalogID === "custom" ? (current.name === initialEntry?.display_name ? "" : current.name) : entry.display_name || entry.name || current.name,
        type: entry.type || current.type || "openai_compatible",
        base_url: catalogID === "custom" ? current.base_url : entry.base_url ?? "",
      }));
    }
    let cancelled = false;
    setDetail(null);
    setSelectedModels({});
    if (catalogID === "custom") {
      setDetail(customCatalogEntry);
      setModelLoading(false);
      return () => {
        cancelled = true;
      };
    }
    setModelLoading(true);
    adminFetch(api, `/api/admin/provider-catalog/${encodeURIComponent(catalogID)}`)
      .then(async (resp) => {
        if (!resp.ok) throw new Error(`provider catalog ${resp.status}`);
        return (await resp.json()) as { data: ProviderCatalogEntry };
      })
      .then((payload) => {
        if (cancelled) return;
        setDetail(payload.data);
        setModelError("");
        if (mode === "create") {
          setValues((current) => ({
            ...current,
            name: payload.data.display_name || payload.data.name || current.name,
            type: payload.data.type || current.type || "openai_compatible",
            base_url: payload.data.base_url ?? "",
          }));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          if (isAuthExpiredError(err)) return;
          const message = err instanceof Error ? err.message : "Provider 模板加载失败";
          setModelError(message);
          setError(message);
        }
      })
      .finally(() => {
        if (!cancelled) setModelLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogID, catalogReloadKey, customCatalogEntry, initialEntry?.display_name, mode]);

  const models = useMemo(
    () => (detail?.models ?? []).filter((model) => {
      if (modelCategory !== "all" && modelCategoryForCatalog(model) !== modelCategory) return false;
      const canonical = model.canonical_name || canonicalModelNameForUI(model.id, model.display_name);
      return standardModels.some((standard) => canonicalModelNameForUI(standard.name, standard.name) === canonicalModelNameForUI(canonical, canonical));
    }),
    [detail, modelCategory, standardModels],
  );
  useEffect(() => {
    if (mode !== "create" || !detail || values.create_routes !== "true") return;
    const nextSelected: Record<string, boolean> = {};
    for (const model of models) {
      nextSelected[model.id] = true;
    }
    setSelectedModels(nextSelected);
  }, [detail, mode, models, values.create_routes]);
  const filteredCatalog = useMemo(() => {
    const normalized = catalogQuery.trim().toLowerCase();
    const entries = categoryCatalog;
    if (!normalized) return entries;
    return entries.filter((entry) =>
      [
        entry.id,
        entry.name,
        entry.display_name,
        entry.type,
        entry.base_url,
        entry.doc_url,
        ...(entry.categories ?? []),
      ].filter(Boolean).join(" ").toLowerCase().includes(normalized),
    );
  }, [categoryCatalog, catalogQuery]);
  const filteredModels = useMemo(() => {
    const normalized = modelQuery.trim().toLowerCase();
    if (!normalized) return models.slice(0, 80);
    return models
      .filter((model) => JSON.stringify(model).toLowerCase().includes(normalized))
      .slice(0, 80);
  }, [models, modelQuery]);
  const selectedModelIDs = Object.entries(selectedModels)
    .filter(([, selected]) => selected)
    .map(([id]) => id);
  const autoRouteEnabled = values.create_routes === "true";
  const selectedRouteCount = autoRouteEnabled ? selectedModelIDs.length : 0;
  const selectedEntry = detail ?? (catalogID === "custom" ? customCatalogEntry : catalog.find((entry) => entry.id === catalogID));

  function update(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function selectCategory(category: string) {
    setModelCategory(category);
    setCatalogQuery("");
    setModelQuery("");
    setSelectedModels({});
    const nextEntry = catalog.find((entry) => providerEntrySupportsCategory(entry, category));
    if (nextEntry) selectCatalog(nextEntry);
  }

  function selectCatalog(entry: ProviderCatalogEntry) {
    setCatalogID(entry.id);
    setCatalogReloadKey((current) => current + 1);
    setDetail(null);
    setSelectedModels({});
    setModelQuery("");
    setModelError("");
    setValues((current) => ({
      ...current,
      name: mode === "create" ? entry.display_name || entry.name || current.name : current.name,
      type: entry.type || current.type || "openai_compatible",
      base_url: mode === "create" ? entry.base_url ?? "" : current.base_url,
    }));
  }

  function selectCustomCatalog() {
    setCatalogID("custom");
    setCatalogReloadKey((current) => current + 1);
    setDetail(customCatalogEntry);
    setSelectedModels({});
    setModelQuery("");
    setModelError("");
    setValues((current) => ({
      ...current,
      id: mode === "create" ? "" : current.id,
      name: mode === "create" ? "" : current.name,
      type: current.type || "openai_compatible",
      base_url: mode === "create" ? "" : current.base_url,
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const payload = (mode === "edit" ? providerUpdatePayload : providerPayload)({
        ...values,
        create_routes: autoRouteEnabled && selectedModelIDs.length > 0 ? "true" : "false",
        catalog_id: catalogID,
        model_category: modelCategory,
        selected_models: selectedModelIDs.length > 0 ? selectedModelIDs.join(",") : "",
      });
      const resp = await adminFetch(api, mode === "edit" && provider ? `/api/admin/providers/${provider.id}` : "/api/admin/providers", {
        method: mode === "edit" ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error(`${mode === "edit" ? "update" : "create"} provider ${resp.status}`);
      const result = (await resp.json()) as { created_routes?: number; provider?: Provider };
      const routed = result.created_routes ?? 0;
      setNotice(`Provider 已${mode === "edit" ? "更新" : "新增"}${routed ? `，创建 ${routed} 条${modelCategoryLabel(modelCategory)}路由` : ""}`);
      await onSaved();
    } catch (err) {
      if (isAuthExpiredError(err)) return;
      setError(err instanceof Error ? err.message : `${mode === "edit" ? "更新" : "新增"} Provider 失败`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="modal provider-modal" onSubmit={submit}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">{mode === "edit" ? "编辑" : "新增"}</p>
            <h2>Provider 渠道</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button" title="关闭">×</button>
        </div>
        <div className="provider-modal-body">
          <section className="provider-catalog-pane">
            <div className="provider-catalog-head">
              <strong>模型类型</strong>
              <span>{availableCategories.length} 类</span>
            </div>
            <div className="provider-category-list">
              {availableCategories.map((category) => (
                <button
                  className={category.key === modelCategory ? "provider-category-item active" : "provider-category-item"}
                  key={category.key}
                  onClick={() => selectCategory(category.key)}
                  type="button"
                >
                  <strong>{category.label}</strong>
                  <span>{category.count} 个模型</span>
                </button>
              ))}
            </div>

            <div className="provider-catalog-head provider-catalog-subhead">
              <strong>渠道商</strong>
              <span>{filteredCatalog.length}/{categoryCatalog.length} 个</span>
            </div>
            <button
              className={catalogID === "custom" ? "custom-provider-button active" : "custom-provider-button"}
              onClick={selectCustomCatalog}
              type="button"
            >
              <Plus size={14} />
              <span>自定义渠道商</span>
              <em>{modelCategoryLabel(modelCategory)} · {customCatalogEntry.models_count} 个标准模型</em>
            </button>
            <div className="provider-template-search">
              <Search size={14} />
              <input
                value={catalogQuery}
                onChange={(event) => setCatalogQuery(event.target.value)}
                placeholder="搜索渠道商、ID、类型"
              />
            </div>
            <div className="provider-catalog-list compact">
              {filteredCatalog.length === 0 ? (
                <div className="empty compact-empty">
                  <span>没有匹配的渠道商</span>
                  <button className="secondary-button" onClick={selectCustomCatalog} type="button">使用自定义渠道商</button>
                </div>
              ) : filteredCatalog.map((entry) => (
                <button
                  className={entry.id === catalogID ? "catalog-item active" : "catalog-item"}
                  key={entry.id}
                  onClick={() => selectCatalog(entry)}
                  type="button"
                >
                  <strong>{entry.display_name || entry.name}</strong>
                  <span>{providerTypeLabel(entry.type)} · {providerEntryCategoryCount(entry, modelCategory)} 个模型</span>
                </button>
              ))}
            </div>
          </section>

          <section className="provider-config-pane">
            <div className="provider-selected-summary">
              <strong>{modelCategoryLabel(modelCategory)}</strong>
              <span>{selectedEntry?.display_name || selectedEntry?.name || "请选择渠道商"}</span>
              <em>{providerTypeLabel(selectedEntry?.type || values.type || "openai_compatible")}</em>
            </div>
            <div className="provider-form-grid">
              <label className="field">
                <span>Provider ID</span>
                <input value={values.id ?? ""} onChange={(event) => update("id", event.target.value)} placeholder={catalogID === "custom" ? "例如 prv_company_proxy" : "留空自动生成"} readOnly={mode === "edit"} />
              </label>
              <label className="field">
                <span>渠道名称</span>
                <input value={values.name ?? ""} onChange={(event) => update("name", event.target.value)} required />
              </label>
              <label className="field">
                <span>渠道商类型</span>
                <select value={values.type ?? ""} onChange={(event) => update("type", event.target.value)} required>
                  {providerTypeOptions.map((option) => <option key={option} value={option}>{providerTypeLabel(option)}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Base URL</span>
                <input value={values.base_url ?? ""} onChange={(event) => update("base_url", event.target.value)} />
              </label>
              <label className="field">
                <span>API Key</span>
                <input value={values.api_key ?? ""} type="password" onChange={(event) => update("api_key", event.target.value)} />
                {mode === "edit" ? <small>留空表示不修改现有 Key；填写新值才会覆盖。</small> : null}
              </label>
              <label className="field">
                <span>优先级</span>
                <input value={values.priority ?? "10"} type="number" onChange={(event) => update("priority", event.target.value)} />
              </label>
            </div>

            <div className="provider-import-options">
              <div>
                <strong>自动路由</strong>
                <span>{mode === "edit" ? "开启后会为下方勾选模型补齐缺失线路，不覆盖已有策略。" : "保存渠道时会自动创建下方勾选模型的默认路由。"}</span>
              </div>
              <div className="boolean-toggle provider-route-toggle" role="radiogroup" aria-label="自动路由">
                <button
                  aria-checked={autoRouteEnabled}
                  className={autoRouteEnabled ? "active" : ""}
                  onClick={() => update("create_routes", "true")}
                  role="radio"
                  type="button"
                >
                  开启
                </button>
                <button
                  aria-checked={!autoRouteEnabled}
                  className={!autoRouteEnabled ? "active" : ""}
                  onClick={() => update("create_routes", "false")}
                  role="radio"
                  type="button"
                >
                  关闭
                </button>
              </div>
            </div>

            <div className="provider-model-head">
              <div>
                <strong>上游模型映射</strong>
                <span>{detail ? `${models.length}/${detail.models_count} 个可映射模型` : "加载中"}</span>
              </div>
              <div className="provider-model-tools">
                <input value={modelQuery} onChange={(event) => setModelQuery(event.target.value)} placeholder="搜索模型、能力、参数" />
                <button className="secondary-button" onClick={() => selectedEntry && selectCatalog(selectedEntry)} type="button">
                  重新加载
                </button>
              </div>
            </div>
            <div className="provider-model-list">
              {modelLoading ? (
                <div className="empty">正在加载模型列表...</div>
              ) : modelError ? (
                <div className="empty">{modelError}</div>
              ) : filteredModels.length === 0 ? (
                <div className="empty">{models.length === 0 ? "该渠道商暂无可匹配当前标准模型目录的上游模型" : "没有匹配的模型"}</div>
              ) : filteredModels.map((model) => (
                <label className="model-option" key={model.id}>
                  <input
                    checked={autoRouteEnabled && selectedModels[model.id] === true}
                    disabled={!autoRouteEnabled}
                    onChange={(event) => setSelectedModels((current) => ({ ...current, [model.id]: event.target.checked }))}
                    type="checkbox"
                  />
                  <div>
                    <strong>{model.display_name || model.name}</strong>
                    <span>{model.canonical_name || model.id} ← {model.id}</span>
                    <small>
                      {modelCategoryLabel(modelCategoryForCatalog(model))} · {model.family || "model"} · {model.type || "chat"} · {formatModelPrice(model)} · {model.context_window ? `${compactNumber(model.context_window)} ctx` : "ctx -"}
                      {existingRouteModels.has(model.canonical_name || canonicalModelNameForUI(model.id, model.display_name)) ? " · 已有路由" : ""}
                    </small>
                    <div className="capability-row">
                      {modelCapabilities(model).map((capability) => <em key={capability}>{capability}</em>)}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <p className="provider-import-hint">
              {!autoRouteEnabled
                ? "已关闭自动路由：保存后只创建 Provider，不生成路由策略。"
                : selectedRouteCount > 0
                  ? `保存后会为 ${selectedRouteCount} 个已选 ${modelCategoryLabel(modelCategory)} 模型创建缺失的默认路由。`
                  : "当前没有勾选模型，保存后不会生成路由策略。"}
            </p>
          </section>
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
  data,
  value,
  editing,
  onChange,
}: {
  field: FieldConfig;
  data: AppData;
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
}) {
  const [filter, setFilter] = useState("");
  const readOnly = editing && field.readOnlyOnEdit;
  const options = field.optionsFromData?.(data) ?? (field.options ?? []).map((option) => ({ value: option, label: enumOptionLabel(field.key, option) }));
  if (field.type === "multi-select" && !editing) {
    const selected = new Set(splitList(value));
    const normalizedFilter = filter.trim().toLowerCase();
    const filteredOptions = normalizedFilter
      ? options.filter((option) => `${option.label} ${option.value}`.toLowerCase().includes(normalizedFilter))
      : options;
    const selectedCount = selected.size;
    const updateSelected = (next: Set<string>) => onChange(Array.from(next).join(", "));
    return (
      <div className="field multi-select-field">
        <span>{field.label}</span>
        <div className="multi-select-tools">
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="搜索模型"
            type="search"
          />
          <button
            className="secondary-button"
            onClick={() => updateSelected(new Set([...selected, ...filteredOptions.map((option) => option.value)]))}
            type="button"
          >
            全选
          </button>
          <button className="secondary-button" onClick={() => onChange("")} type="button">
            清空
          </button>
        </div>
        <div className="multi-select-list">
          {filteredOptions.length === 0 ? (
            <div className="empty">没有匹配的模型</div>
          ) : filteredOptions.map((option) => (
            <label className="multi-select-option" key={option.value}>
              <input
                checked={selected.has(option.value)}
                onChange={(event) => {
                  const next = new Set(selected);
                  if (event.target.checked) {
                    next.add(option.value);
                  } else {
                    next.delete(option.value);
                  }
                  updateSelected(next);
                }}
                type="checkbox"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        <small>{selectedCount > 0 ? `已选择 ${selectedCount} 个模型` : "请选择至少一个统一模型"}</small>
        {field.help ? <small>{field.help}</small> : null}
      </div>
    );
  }
  if (field.type === "select" || field.type === "multi-select") {
    return (
      <label className="field">
        <span>{field.label}</span>
        <select value={value} onChange={(event) => onChange(event.target.value)} required={field.required} disabled={readOnly}>
          <option value="">请选择</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        {field.help ? <small>{field.help}</small> : null}
      </label>
    );
  }
  if (field.type === "textarea") {
    return (
      <label className="field">
        <span>{field.label}</span>
        <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} required={field.required} readOnly={readOnly} />
        {field.help ? <small>{field.help}</small> : null}
      </label>
    );
  }
  if (field.type === "boolean") {
    const checked = value === "true";
    return (
      <label className="field">
        <span>{field.label}</span>
        <div className="boolean-toggle" role="radiogroup" aria-label={field.label}>
          <button
            aria-checked={checked}
            className={checked ? "active" : ""}
            disabled={readOnly}
            onClick={() => onChange("true")}
            role="radio"
            type="button"
          >
            开启
          </button>
          <button
            aria-checked={!checked}
            className={!checked ? "active" : ""}
            disabled={readOnly}
            onClick={() => onChange("false")}
            role="radio"
            type="button"
          >
            关闭
          </button>
        </div>
        {field.help ? <small>{field.help}</small> : null}
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
        readOnly={readOnly}
      />
      {field.help ? <small>{field.help}</small> : null}
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
    normalized === "active" || normalized === "healthy" || normalized === "ok" || normalized === "confirmed" || normalized === "approved"
      ? "ok"
      : normalized === "warning" || normalized === "degraded" || normalized === "pending"
        ? "warn"
        : normalized === "error" || normalized === "down" || normalized === "disabled" || normalized === "rejected" || normalized === "failed" || normalized === "revoked" || normalized === "expired"
          ? "error"
          : "";
  return <span className={`pill ${kind}`}>{label ?? enumValueLabel(status)}</span>;
}

function ModelNameCell({ model }: { model: Model }) {
  return (
    <div className="model-name-cell">
      <strong>{model.name}</strong>
      <span>{modelCategoryLabel(modelCategory(model))} · {model.family || "-"} · {model.modality || "chat"} · {model.context_window ? `${compactNumber(model.context_window)} ctx` : "ctx -"}</span>
    </div>
  );
}

function ModelRouteProviders({ model, data }: { model: Model; data: AppData }) {
  const routes = modelRoutesFor(model, data);
  if (routes.length === 0) {
    return <span className="muted-inline">未配置线路</span>;
  }
  return (
    <div className="route-provider-list">
      {routes.slice(0, 4).map((route) => {
        const provider = findProvider(data, route.provider_id);
        return (
          <div className="route-provider-chip" key={route.id}>
            <span className={route.status === "active" ? "route-dot ok" : "route-dot"} />
            <strong>{provider?.name || route.provider_id}</strong>
            <em>{route.provider_model}</em>
            <small>{routeStrategyLabel(route.strategy)} · P{route.priority} · W{route.weight}</small>
          </div>
        );
      })}
      {routes.length > 4 ? <span className="route-overflow">+{routes.length - 4}</span> : null}
    </div>
  );
}

const providerTypeOptions = ["mock", "openai", "openai_compatible", "azure_openai", "anthropic", "gemini", "deepseek", "qwen", "local"];

const modelCategoryLabels: Record<string, string> = {
  all: "全部",
  openai: "OpenAI",
  claude: "Claude",
  deepseek: "DeepSeek",
  gemini: "Gemini",
  qwen: "Qwen",
  glm: "GLM",
  kimi: "Kimi",
  doubao: "Doubao",
  ernie: "ERNIE",
  baichuan: "Baichuan",
  minimax: "MiniMax",
  stepfun: "StepFun",
  wanx: "WanX",
  paddlepaddle: "PaddlePaddle",
  microsoft: "Microsoft",
  llama: "Llama",
  mistral: "Mistral",
  grok: "Grok",
  custom: "自定义",
};

const preferredModelCategories = [
  "openai",
  "claude",
  "deepseek",
  "gemini",
  "qwen",
  "glm",
  "kimi",
  "doubao",
  "ernie",
  "baichuan",
  "minimax",
  "stepfun",
  "wanx",
  "grok",
  "paddlepaddle",
  "microsoft",
  "llama",
  "mistral",
  "custom",
];

const resourceConfigs: Partial<Record<ViewKey, ResourceConfig<any>>> = {
  providers: providerConfig(),
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
    { key: "scope", label: "作用域", type: "select", options: ["global", "project", "api_key", "team"], required: true },
    { key: "scope_id", label: "作用域 ID" },
    { key: "daily_requests", label: "日请求", type: "number" },
    { key: "monthly_requests", label: "月请求", type: "number" },
    { key: "daily_tokens", label: "日 Token", type: "number" },
    { key: "monthly_tokens", label: "月 Token", type: "number" },
    { key: "daily_cost_usd", label: "日成本 USD", type: "number" },
    { key: "monthly_cost_usd", label: "月成本 USD", type: "number" },
    { key: "max_concurrency", label: "最大并发", type: "number" },
  ]),
  "cost-centers": costCenterConfig(),
  budgets: budgetConfig(),
  chargebacks: chargebackConfig(),
  "approval-flows": approvalFlowConfig(),
  invoices: invoiceConfig(),
  reports: reportConfig(),
  "notification-channels": genericResourceConfig("notification-channels", "通知渠道", "告警 Webhook、飞书、钉钉、企业微信等通知目标", [
    { key: "type", label: "类型", type: "select", options: ["webhook"], required: true },
    { key: "webhook_url", label: "Webhook URL", required: true },
    { key: "secret", label: "签名密钥" },
  ]),
  monitors: monitorConfig(),
  alerts: genericResourceConfig("alert-rules", "告警规则", "额度、成本、错误率和 Provider 健康告警", [
    { key: "metric", label: "指标", required: true },
    { key: "threshold", label: "阈值", required: true },
    { key: "channel", label: "通知渠道" },
  ]),
  "alert-events": alertEventConfig(),
  "alert-deliveries": alertDeliveryConfig(),
  approvals: approvalConfig(),
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
  "sqlite-backups": sqliteBackupConfig(),
  announcements: genericResourceConfig("announcements", "公告通知", "后台公告、试运行通知和操作提示", [
    { key: "notify_mode", label: "通知模式", type: "select", options: ["silent", "popup"], required: true },
    { key: "target", label: "目标对象" },
  ]),
  settings: systemSettingConfig(),
};

function systemSettingConfig(): ResourceConfig<AdminResource> {
  return {
    ...genericResourceConfig("settings", "系统设置", "网关地址、审计保留、企业集成和默认策略", [
      { key: "public_base_url", label: "公开 Base URL" },
      { key: "default_timeout", label: "默认超时" },
      { key: "audit_retention", label: "审计保留" },
    ]),
    eyebrow: "基础设置",
  };
}

function roleConfig(): ResourceConfig<AdminResource> {
  const fields: FieldConfig[] = [
    { key: "role_key", label: "角色标识", required: true, placeholder: "project_admin" },
    { key: "display_name", label: "显示名称", required: true, placeholder: "项目管理员" },
    { key: "data_scope", label: "数据范围", type: "select", options: ["global", "team", "project", "self"], required: true },
    { key: "permissions", label: "权限点，逗号分隔", type: "textarea", placeholder: "project:read, api_key:write" },
    { key: "menu_scopes", label: "菜单范围，逗号分隔", type: "textarea", placeholder: "overview, projects, api-keys" },
    { key: "assignable", label: "可分配", type: "boolean" },
  ];
  return {
    ...genericResourceConfig("role-configs", "角色配置", "配置后台角色、数据范围、菜单范围和权限点", fields),
    eyebrow: "角色配置",
    createLabel: "新增角色",
    columns: [
      { key: "name", label: "名称" },
      { key: "role_key", label: "角色标识", render: (item) => stringifyValue(item.fields?.role_key) || item.id },
      { key: "display_name", label: "显示名称", render: (item) => stringifyValue(item.fields?.display_name) || item.name },
      { key: "data_scope", label: "数据范围", render: (item) => dataScopeLabel(stringifyValue(item.fields?.data_scope)) },
      { key: "permissions", label: "权限点", render: (item) => compactList(item.fields?.permissions) },
      { key: "menu_scopes", label: "菜单范围", render: (item) => compactList(item.fields?.menu_scopes) },
      { key: "assignable", label: "可分配", render: (item) => boolLabel(item.fields?.assignable) },
      { key: "status", label: "状态", render: (item) => <StatusPill status={item.status} /> },
    ],
  };
}

function sqliteBackupConfig(): ResourceConfig<SQLiteBackup> {
  return {
    view: "sqlite-backups",
    title: "数据备份",
    eyebrow: "SQLite 备份",
    description: "创建、下载和恢复 TokenHub SQLite 数据库快照。",
    createLabel: "创建备份",
    columns: [
      { key: "name", label: "名称" },
      { key: "status", label: "状态", render: (item) => <StatusPill status={item.status} /> },
      { key: "size_bytes", label: "大小", render: (item) => formatBytes(item.size_bytes) },
      { key: "trigger", label: "触发方式", render: (item) => item.trigger || "manual" },
      { key: "created_at", label: "创建时间", render: (item) => formatTime(item.created_at) },
      { key: "restored_at", label: "最近恢复", render: (item) => item.restored_at ? formatTime(item.restored_at) : "-" },
      { key: "checksum_sha256", label: "校验", render: (item) => item.checksum_sha256 ? `${item.checksum_sha256.slice(0, 10)}...` : "-" },
    ],
    fields: [
      { key: "expire_days", label: "保留天数", type: "number", placeholder: "0 表示不过期" },
    ],
    list: (ctx) => ctx.sqliteBackups,
    create: async (ctx, values) => {
      const resp = await adminFetch(ctx, "/api/admin/sqlite/backups", {
        method: "POST",
        body: JSON.stringify({ expire_days: numberOr(values.expire_days, 14) }),
      });
      if (!resp.ok) throw new Error(`create sqlite backup ${resp.status}`);
      await resp.json().catch(() => undefined);
    },
    remove: (ctx, item) => adminDelete(ctx, `/api/admin/sqlite/backups/${item.id}`),
    actions: [
      {
        label: "下载",
        title: "下载 SQLite 备份文件",
        run: async (ctx, item) => downloadSQLiteBackup(ctx, item),
        doneMessage: () => "备份文件已开始下载",
      },
      {
        label: "恢复",
        title: "将数据库恢复到该备份",
        run: async (ctx, item) => restoreSQLiteBackup(ctx, item),
        doneMessage: (item) => `已恢复备份 ${item.id}`,
      },
    ],
  };
}

function monitorConfig(): ResourceConfig<AdminResource> {
  const fields: FieldConfig[] = [
    { key: "target_type", label: "目标类型", type: "select", options: ["provider", "model"], required: true },
    { key: "provider_id", label: "Provider ID" },
    { key: "model", label: "模型" },
    { key: "interval_seconds", label: "间隔秒数", type: "number" },
  ];
  return {
    ...genericResourceConfig("monitors", "健康监控", "Provider 和模型路由心跳检测任务", fields),
    eyebrow: "监控任务列表",
    columns: [
      { key: "name", label: "名称" },
      { key: "fields.target_type", label: "目标类型", render: (item) => monitorTargetLabel(item.fields) },
      { key: "fields.provider_id", label: "Provider", render: (item) => stringifyValue(item.fields?.provider_id) || "-" },
      { key: "fields.model", label: "模型", render: (item) => stringifyValue(item.fields?.model) || "-" },
      { key: "fields.last_status", label: "最近状态", render: (item) => <StatusPill status={stringifyValue(item.fields?.last_status || item.fields?.last_result || "unknown")} /> },
      { key: "fields.last_message", label: "最近消息", render: (item) => stringifyValue(item.fields?.last_message) || "-" },
      { key: "fields.latency_ms", label: "延迟", render: (item) => `${numberFromUnknown(item.fields?.latency_ms)}ms` },
      { key: "fields.last_checked_at", label: "最近检测", render: (item) => formatTime(stringifyValue(item.fields?.last_checked_at)) },
      { key: "status", label: "状态", render: (item) => <StatusPill status={item.status} /> },
    ],
    actions: [
      {
        label: "运行",
        title: "立即执行该监控任务",
        run: async (ctx, item) => {
          const resp = await adminFetch(ctx, `/api/admin/resources/monitors/${item.id}/run`, {
            method: "POST",
            body: JSON.stringify({}),
          });
          if (!resp.ok) throw new Error(`run monitor ${resp.status}`);
          await resp.json().catch(() => undefined);
        },
        doneMessage: (item) => `${item.name} 已完成检测`,
      },
    ],
  };
}

function providerConfig(): ResourceConfig<Provider> {
  return {
    view: "providers",
    title: "Provider 渠道",
    eyebrow: "Provider 列表",
    description: "Provider 是一个可调用的上游渠道实例，包含服务商类型、Base URL、API Key、健康状态和标准模型路由。",
    createLabel: "新增 Provider",
    columns: [
      { key: "name", label: "名称" },
      { key: "type", label: "类型", render: (item) => providerTypeLabel(item.type) },
      { key: "base_url", label: "Base URL", render: (item) => item.base_url || "local mock" },
      { key: "routes", label: "路由线路", render: (item, ctx) => providerRouteSummary(item, ctx) },
      { key: "priority", label: "优先级" },
      { key: "healthy", label: "健康", render: (item) => <StatusPill status={item.healthy ? "healthy" : "down"} /> },
      { key: "status", label: "状态", render: (item) => <StatusPill status={item.status} /> },
    ],
    fields: [
      { key: "name", label: "名称", required: true },
      { key: "type", label: "类型", type: "select", options: providerTypeOptions, required: true },
      { key: "base_url", label: "Base URL" },
      { key: "api_key", label: "API Key", type: "password", help: "编辑时留空表示不修改现有 Key；只有填写新值才会覆盖。" },
      { key: "priority", label: "优先级", type: "number", placeholder: "留空自动追加", help: "数字越小越先调用；新增时留空会自动排在该统一模型已有 Provider 后面。" },
      { key: "status", label: "状态", type: "select", options: ["active", "disabled"], required: true },
      { key: "healthy", label: "健康", type: "boolean" },
    ],
    list: (ctx) => ctx.providers,
    create: (ctx, values) => adminMutate(ctx, "/api/admin/providers", "POST", providerPayload(values)),
    update: (ctx, item, values) => adminMutate(ctx, `/api/admin/providers/${item.id}`, "PATCH", providerUpdatePayload(values)),
    remove: (ctx, item) => adminDelete(ctx, `/api/admin/providers/${item.id}`),
    actions: [
      {
        label: "配置路由",
        title: "为该 Provider 新增模型路由",
        modal: (item, ctx) => ({
          config: routeConfig(),
          initialValues: providerRouteDefaults(item, ctx),
        }),
      },
      {
        label: "测试",
        title: "检测 Provider 可用性",
        run: (ctx, item) => adminMutate(ctx, `/api/admin/providers/${item.id}/test`, "POST", {}),
        doneMessage: (item) => `${item.name} 检测完成`,
      },
    ],
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
    eyebrow: "对外模型列表",
    description: "维护内部应用调用的对外模型名，并查看每个模型可用的 Provider 线路。",
    createLabel: "新增模型",
    columns: [
      { key: "name", label: "对外模型", render: (item) => <ModelNameCell model={item} /> },
      { key: "category", label: "模型类型", render: (item) => modelCategoryLabel(modelCategory(item)) },
      { key: "capabilities", label: "能力", render: (item) => modelCapabilitySummary(item) },
      { key: "routes", label: "可用供应商", render: (item, ctx) => <ModelRouteProviders model={item} data={ctx} /> },
      { key: "route_count", label: "路由数", render: (item, ctx) => modelRoutesFor(item, ctx).length },
      { key: "price", label: "目录计价", render: (item) => modelPriceSummary(item) },
      { key: "status", label: "状态", render: (item) => <StatusPill status={item.status} /> },
    ],
    fields: [
      { key: "name", label: "模型名", required: true },
      { key: "category", label: "模型类型", type: "select", options: modelCategoryFormOptions(), required: true },
      { key: "family", label: "系列", required: true },
      { key: "modality", label: "能力", type: "select", options: ["chat", "embedding", "image", "video", "audio", "ocr", "rerank"], required: true },
      { key: "context_window", label: "上下文窗口", type: "number" },
      { key: "input_price_usd_per_1m", label: "输入价 USD/1M", type: "number" },
      { key: "output_price_usd_per_1m", label: "输出价 USD/1M", type: "number" },
      { key: "embedding_price_usd_per_1m", label: "Embedding 价 USD/1M", type: "number" },
      { key: "capabilities", label: "能力标签，逗号分隔" },
      { key: "supported_parameters", label: "支持参数，逗号分隔" },
      { key: "status", label: "状态", type: "select", options: ["active", "disabled"], required: true },
    ],
    list: (ctx) => ctx.models,
    create: (ctx, values) => adminMutate(ctx, "/api/admin/models", "POST", modelPayload(values)),
    update: (ctx, item, values) => adminMutate(ctx, `/api/admin/models/${encodeURIComponent(item.name)}`, "PATCH", modelPayload(values)),
    remove: (ctx, item) => adminDelete(ctx, `/api/admin/models/${encodeURIComponent(item.name)}`),
    actions: [
      {
        label: "配置路由",
        title: "为该对外模型新增 Provider 线路",
        modal: (item, ctx) => ({
          config: routeConfig(),
          initialValues: modelRouteDefaults(item, ctx),
        }),
      },
    ],
    toForm: (item) => modelToForm(item),
  };
}

function routeConfig(): ResourceConfig<ModelRoute> {
  return {
    view: "routes",
    title: "路由策略",
    eyebrow: "模型路由规则",
    description: "参考模型路由器思路，按平衡、质量优先或成本优先模式选择候选 Provider 线路，并在失败时自动回退。",
    createLabel: "新增路由",
    columns: [
      { key: "model_name", label: "统一模型" },
      { key: "provider_id", label: "Provider", render: (item, ctx) => findProvider(ctx, item.provider_id)?.name || item.provider_id },
      { key: "provider_model", label: "上游模型" },
      { key: "priority", label: "优先级" },
      { key: "weight", label: "权重" },
      { key: "score", label: "评分", render: (item) => routeScoreSummary(item) },
      { key: "strategy", label: "策略", render: (item) => routeStrategyLabel(item.strategy) },
      { key: "sticky_session", label: "粘性", render: (item) => item.sticky_session ? "开启" : "关闭" },
      { key: "last_used_at", label: "最近命中", render: (item) => formatTime(item.last_used_at ?? "") },
      { key: "status", label: "状态", render: (item) => <StatusPill status={item.status} /> },
    ],
    fields: [
      {
        key: "model_name",
        label: "统一模型",
        type: "multi-select",
        optionsFromData: modelSelectOptions,
        required: true,
        help: "新增路由时可多选模型；编辑已有路由时仍按单条规则调整。",
      },
      { key: "provider_id", label: "Provider", type: "select", optionsFromData: providerSelectOptions, required: true },
      { key: "provider_model", label: "上游模型/部署名", placeholder: "留空则沿用统一模型名", help: "批量创建时留空，会为每个统一模型使用同名上游模型。" },
      { key: "priority", label: "优先级", type: "number" },
      { key: "weight", label: "权重", type: "number" },
      { key: "quality_score", label: "质量评分 1-100", type: "number", help: "质量优先模式会优先选择该评分更高的线路。" },
      { key: "cost_score", label: "成本评分 1-100", type: "number", help: "成本优先模式会优先选择该评分更高的线路，分数越高代表越省。" },
      { key: "strategy", label: "调度策略", type: "select", options: ["balanced", "quality", "cost", "priority_weighted", "priority_only"], required: true },
      { key: "sticky_session", label: "粘性会话", type: "boolean" },
      { key: "status", label: "状态", type: "select", options: ["active", "disabled"], required: true },
    ],
    list: (ctx) => ctx.routes,
    create: (ctx, values) => createModelRoutes(ctx, values),
    update: (ctx, item, values) => adminMutate(ctx, `/api/admin/routing-rules/${item.id}`, "PATCH", routePayload(values)),
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
      { key: "cost_center", label: "成本中心", render: (item) => item.cost_center || "-" },
      { key: "default_quota_ref", label: "额度策略" },
      { key: "status", label: "状态", render: (item) => <StatusPill status={item.status} /> },
    ],
    fields: [
      { key: "name", label: "项目名称", required: true },
      { key: "team_id", label: "团队 ID" },
      { key: "owner_user_id", label: "负责人用户 ID" },
      { key: "cost_center", label: "成本中心" },
      { key: "default_quota_ref", label: "默认额度策略" },
      { key: "status", label: "状态", type: "select", options: ["active", "disabled"], required: true },
    ],
    list: (ctx) => ctx.projects,
    create: (ctx, values) => adminMutate(ctx, "/api/admin/projects", "POST", values),
    update: (ctx, item, values) => adminMutate(ctx, `/api/admin/projects/${item.id}`, "PATCH", values),
    remove: (ctx, item) => adminDelete(ctx, `/api/admin/projects/${item.id}`),
    actions: [
      {
        label: "发放 Key",
        title: "为该项目创建内部 API Key",
        modal: (item) => ({
          config: apiKeyConfig(),
          initialValues: {
            project_id: item.id,
            name: `${item.name} Key`,
          },
        }),
      },
    ],
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
      { key: "project_id", label: "归属项目", render: (item, ctx) => projectName(ctx, item.project_id) },
      { key: "project_owner", label: "负责人", render: (item, ctx) => projectOwnerLabel(ctx, item.project_id) },
      { key: "project_team", label: "团队", render: (item, ctx) => projectTeamLabel(ctx, item.project_id) },
      { key: "key_prefix", label: "Key", render: (item) => `${item.key_prefix}...${item.key_suffix}` },
      { key: "allowed_models", label: "模型", render: (item) => (item.allowed_models ?? []).join(", ") || "全部" },
      { key: "ip_allowlist", label: "IP 白名单", render: (item) => (item.ip_allowlist ?? []).join(", ") || "不限" },
      { key: "limits.max_concurrency", label: "并发" },
      { key: "status", label: "状态", render: (item) => <StatusPill status={item.status} /> },
    ],
    fields: [
      {
        key: "project_id",
        label: "归属项目",
        type: "select",
        required: true,
        optionsFromData: projectSelectOptions,
        help: "Key 必须挂在已有项目下，用于该项目的内部应用调用网关。",
        readOnlyOnEdit: true,
      },
      { key: "name", label: "Key 名称", required: true },
      { key: "group", label: "用途/环境", placeholder: "prod、dev、backend-service" },
      { key: "allowed_models", label: "模型白名单，逗号分隔", help: "留空表示跟随项目默认可用模型；建议生产环境显式配置。" },
      { key: "ip_allowlist", label: "IP 白名单，逗号分隔", help: "留空表示不限来源 IP。" },
      { key: "daily_requests", label: "日请求", type: "number" },
      { key: "monthly_requests", label: "月请求", type: "number" },
      { key: "daily_tokens", label: "日 Token", type: "number" },
      { key: "monthly_tokens", label: "月 Token", type: "number" },
      { key: "daily_cost_usd", label: "日成本 USD", type: "number" },
      { key: "monthly_cost_usd", label: "月成本 USD", type: "number" },
      { key: "max_concurrency", label: "最大并发", type: "number" },
      { key: "status", label: "状态", type: "select", options: ["active", "disabled", "revoked"], required: true },
    ],
    list: (ctx) => ctx.keys,
    create: async () => undefined,
    update: (ctx, item, values) => adminMutate(ctx, `/api/admin/api-keys/${item.id}`, "PATCH", keyPatchPayload(values)),
    remove: (ctx, item) => adminDelete(ctx, `/api/admin/api-keys/${item.id}`),
    actions: [
      {
        label: "轮换",
        title: "生成新 Key，并立即吊销旧 Key",
        run: async (ctx, item) => {
          const resp = await adminFetch(ctx, `/api/admin/api-keys/${item.id}/rotate`, {
            method: "POST",
            body: JSON.stringify({}),
          });
          if (!resp.ok) throw new Error(`rotate api key ${resp.status}`);
          const payload = (await resp.json()) as { api_key: string };
          window.dispatchEvent(new CustomEvent("tokenhub-issued-key", { detail: payload.api_key }));
        },
        doneMessage: (item) => `${item.name} 已轮换，新 Key 已展示`,
      },
    ],
    toForm: (item) => ({
      project_id: item.project_id,
      name: item.name,
      group: item.group ?? "default",
      allowed_models: (item.allowed_models ?? []).join(", "),
      ip_allowlist: (item.ip_allowlist ?? []).join(", "),
      daily_requests: String(item.limits?.daily_requests ?? ""),
      monthly_requests: String(item.limits?.monthly_requests ?? ""),
      daily_tokens: String(item.limits?.daily_tokens ?? ""),
      monthly_tokens: String(item.limits?.monthly_tokens ?? ""),
      daily_cost_usd: String(item.limits?.daily_cost_usd ?? ""),
      monthly_cost_usd: String(item.limits?.monthly_cost_usd ?? ""),
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

function alertEventConfig(): ResourceConfig<AlertEvent> {
  return {
    view: "alert-events",
    title: "告警事件",
    eyebrow: "告警事件列表",
    description: "运行时触发的额度、成本和 Provider 健康事件。",
    columns: [
      { key: "created_at", label: "时间", render: (item) => formatTime(item.created_at) },
      { key: "severity", label: "级别", render: (item) => <StatusPill status={item.severity} /> },
      { key: "code", label: "事件" },
      { key: "scope_type", label: "对象" },
      { key: "scope_id", label: "对象 ID" },
      { key: "message", label: "说明" },
    ],
    fields: [],
    list: (ctx) => ctx.alerts,
    actions: [
      {
        label: "发送",
        title: "通过默认通知渠道发送该告警",
        run: async (ctx, item) => {
          const resp = await adminFetch(ctx, `/api/admin/alerts/${item.id}/deliver`, {
            method: "POST",
            body: JSON.stringify({}),
          });
          if (!resp.ok) throw new Error(`deliver alert ${resp.status}`);
        },
        doneMessage: (item) => `${item.code} 已发送`,
      },
    ],
  };
}

function alertDeliveryConfig(): ResourceConfig<AlertDelivery> {
  return {
    view: "alert-deliveries",
    title: "通知记录",
    eyebrow: "通知发送记录",
    description: "查看告警通知的发送状态、目标和失败原因。",
    columns: [
      { key: "created_at", label: "时间", render: (item) => formatTime(item.created_at) },
      { key: "alert_id", label: "告警 ID" },
      { key: "channel", label: "渠道" },
      { key: "target", label: "目标", render: (item) => item.target || "-" },
      { key: "status", label: "状态", render: (item) => <StatusPill status={item.status} /> },
      { key: "status_code", label: "HTTP", render: (item) => item.status_code || "-" },
      { key: "error", label: "失败原因", render: (item) => item.error || "-" },
    ],
    fields: [],
    list: (ctx) => ctx.alertDeliveries,
  };
}

function approvalConfig(): ResourceConfig<ApprovalRequest> {
  return {
    view: "approvals",
    title: "审批记录",
    eyebrow: "审批申请列表",
    description: "处理 Key 发放、额度提升、模型开通和预算变更审批。",
    columns: [
      { key: "created_at", label: "时间", render: (item) => formatTime(item.created_at) },
      { key: "trigger", label: "触发条件", render: (item) => approvalTriggerLabel(item.trigger) },
      { key: "resource_type", label: "对象" },
      { key: "requester", label: "申请人", render: (item) => item.requester || item.requester_id || "-" },
      { key: "status", label: "状态", render: (item) => <StatusPill status={item.status} label={approvalStatusLabel(item.status)} /> },
      { key: "decided_by", label: "处理人", render: (item) => item.decided_by || "-" },
      { key: "payload", label: "内容", render: (item) => approvalPayloadSummary(item.payload) },
    ],
    fields: [],
    list: (ctx) => ctx.approvals,
    actions: [
      {
        label: "批准",
        title: "批准并执行该申请",
        run: async (ctx, item) => runApprovalAction(ctx, item, "approve"),
        doneMessage: (item) => `${approvalTriggerLabel(item.trigger)} 已批准`,
      },
      {
        label: "驳回",
        title: "驳回该申请",
        run: async (ctx, item) => runApprovalAction(ctx, item, "reject"),
        doneMessage: (item) => `${approvalTriggerLabel(item.trigger)} 已驳回`,
      },
    ],
  };
}

function costCenterConfig(): ResourceConfig<AdminResource> {
  const fields: FieldConfig[] = [
    { key: "code", label: "成本中心编码", required: true },
    { key: "owner", label: "负责人" },
    { key: "department", label: "部门" },
    { key: "monthly_budget_usd", label: "月预算 USD", type: "number" },
  ];
  return {
    ...genericResourceConfig("cost-centers", "成本中心", "企业内部部门、成本中心和预算归属配置", fields),
    columns: [
      { key: "code", label: "编码", render: (item) => stringifyValue(item.fields?.code) || item.id },
      { key: "name", label: "名称" },
      { key: "department", label: "部门", render: (item) => stringifyValue(item.fields?.department) || "-" },
      { key: "owner", label: "负责人", render: (item) => stringifyValue(item.fields?.owner) || "-" },
      { key: "monthly_budget_usd", label: "月预算", render: (item) => `$${formatMoney(numberFromUnknown(item.fields?.monthly_budget_usd))}` },
      { key: "status", label: "状态", render: (item) => <StatusPill status={item.status} /> },
    ],
  };
}

function budgetConfig(): ResourceConfig<AdminResource> {
  const fields: FieldConfig[] = [
    { key: "scope", label: "预算对象", type: "select", options: ["project", "team", "cost_center"], required: true },
    { key: "scope_id", label: "对象 ID", required: true },
    { key: "period", label: "周期", type: "select", options: ["monthly", "quarterly", "yearly"], required: true },
    { key: "period_ref", label: "账期 YYYY-MM" },
    { key: "amount_usd", label: "预算 USD", type: "number" },
    { key: "warn_percent", label: "预警百分比", type: "number" },
    { key: "enforcement", label: "管控模式", type: "select", options: ["block", "warn"], required: true },
    { key: "used_usd", label: "已用 USD", type: "number" },
    { key: "usage_percent", label: "使用率 %", type: "number" },
  ];
  return {
    ...genericResourceConfig("budgets", "预算管理", "按项目、团队或成本中心配置预算周期和阈值", fields),
    columns: [
      { key: "name", label: "名称" },
      { key: "scope", label: "对象", render: (item) => budgetScopeLabel(stringifyValue(item.fields?.scope)) },
      { key: "scope_id", label: "对象 ID", render: (item) => stringifyValue(item.fields?.scope_id) || "-" },
      { key: "period_ref", label: "账期", render: (item) => stringifyValue(item.fields?.period_ref) || stringifyValue(item.fields?.period) || "-" },
      { key: "amount_usd", label: "预算", render: (item) => `$${formatMoney(numberFromUnknown(item.fields?.amount_usd))}` },
      { key: "used_usd", label: "已用", render: (item) => `$${formatMoney(numberFromUnknown(item.fields?.used_usd))}` },
      { key: "usage_percent", label: "使用率", render: (item) => `${formatMoney(numberFromUnknown(item.fields?.usage_percent))}%` },
      { key: "enforcement", label: "管控", render: (item) => budgetEnforcementLabel(stringifyValue(item.fields?.enforcement)) },
      { key: "status", label: "状态", render: (item) => <StatusPill status={item.status} /> },
    ],
  };
}

function chargebackConfig(): ResourceConfig<AdminResource> {
  const fields: FieldConfig[] = [
    { key: "period", label: "账期", required: true },
    { key: "cost_center", label: "成本中心", required: true },
    { key: "project_id", label: "项目 ID" },
    { key: "team_id", label: "团队 ID" },
    { key: "allocated_cost_usd", label: "分摊成本 USD", type: "number" },
    { key: "request_count", label: "请求数", type: "number" },
    { key: "total_tokens", label: "Token", type: "number" },
    { key: "allocation_rule", label: "分摊规则" },
  ];
  return {
    ...genericResourceConfig("chargebacks", "部门分摊", "将模型成本按部门、项目或成本中心进行内部归集", fields),
    columns: [
      { key: "period", label: "账期", render: (item) => stringifyValue(item.fields?.period) },
      { key: "cost_center", label: "成本中心", render: (item) => stringifyValue(item.fields?.cost_center) },
      { key: "project_id", label: "项目", render: (item) => stringifyValue(item.fields?.project_id) || "-" },
      { key: "team_id", label: "团队", render: (item) => stringifyValue(item.fields?.team_id) || "-" },
      { key: "allocated_cost_usd", label: "分摊成本", render: (item) => `$${formatMoney(numberFromUnknown(item.fields?.allocated_cost_usd))}` },
      { key: "request_count", label: "请求", render: (item) => formatNumber(numberFromUnknown(item.fields?.request_count)) },
      { key: "total_tokens", label: "Token", render: (item) => compactNumber(numberFromUnknown(item.fields?.total_tokens)) },
      { key: "status", label: "状态", render: (item) => <StatusPill status={item.status} /> },
    ],
  };
}

function approvalFlowConfig(): ResourceConfig<AdminResource> {
  const fields: FieldConfig[] = [
    { key: "trigger", label: "触发条件", type: "select", options: ["api_key_create", "budget_change", "model_access", "quota_increase", "invoice_confirm", "invoice_reject"], required: true },
    { key: "approver_role", label: "审批角色", type: "select", options: ["admin", "project_admin", "security_admin"], required: true },
    { key: "threshold_usd", label: "金额阈值 USD", type: "number" },
    { key: "sla_hours", label: "SLA 小时", type: "number" },
  ];
  return {
    ...genericResourceConfig("approval-flows", "审批流", "高成本模型、预算变更、Key 发放和内部账单确认审批配置", fields),
    columns: [
      { key: "name", label: "名称" },
      { key: "trigger", label: "触发条件", render: (item) => approvalTriggerLabel(stringifyValue(item.fields?.trigger)) },
      { key: "approver_role", label: "审批角色", render: (item) => roleLabel(stringifyValue(item.fields?.approver_role)) },
      { key: "threshold_usd", label: "金额阈值", render: (item) => numberFromUnknown(item.fields?.threshold_usd) > 0 ? `$${formatMoney(numberFromUnknown(item.fields?.threshold_usd))}` : "不限" },
      { key: "sla_hours", label: "SLA", render: (item) => numberFromUnknown(item.fields?.sla_hours) > 0 ? `${numberFromUnknown(item.fields?.sla_hours)}h` : "-" },
      { key: "status", label: "状态", render: (item) => <StatusPill status={item.status} /> },
    ],
  };
}

function reportConfig(): ResourceConfig<AdminResource> {
  const fields: FieldConfig[] = [
    { key: "dataset", label: "数据集", type: "select", options: ["requests", "usage", "cost-centers", "budgets", "chargebacks", "invoices", "approvals", "audit-events", "alert-deliveries"], required: true },
    { key: "schedule", label: "频率", type: "select", options: ["manual", "daily", "weekly", "monthly"], required: true },
    { key: "recipients", label: "接收人" },
  ];
  return {
    ...genericResourceConfig("reports", "导出报表", "保存常用导出报表配置和分发对象", fields),
    columns: [
      { key: "name", label: "名称" },
      { key: "dataset", label: "数据集", render: (item) => reportDatasetLabel(stringifyValue(item.fields?.dataset)) },
      { key: "schedule", label: "频率", render: (item) => reportScheduleLabel(stringifyValue(item.fields?.schedule)) },
      { key: "recipients", label: "接收人", render: (item) => stringifyValue(item.fields?.recipients) || "-" },
      { key: "status", label: "状态", render: (item) => <StatusPill status={item.status} /> },
    ],
    actions: [
      {
        label: "导出",
        title: "导出 CSV 报表",
        run: async (ctx, item) => {
          const dataset = stringifyValue(item.fields?.dataset || "requests");
          const period = reportPeriodPrompt(dataset);
          if (period === null) return;
          const resp = await adminFetch(ctx, reportExportPath(dataset, period));
          if (!resp.ok) throw new Error(`export ${dataset} ${resp.status}`);
          const blob = await resp.blob();
          downloadBlob(blob, reportFilename(dataset, period));
        },
        doneMessage: (item) => `${item.name} 已导出`,
      },
    ],
    toolbarActions: reportExportActions(),
  };
}

function invoiceConfig(): ResourceConfig<AdminResource> {
  const fields: FieldConfig[] = [
    { key: "period", label: "账期", required: true },
    { key: "cost_center", label: "成本中心", required: true },
    { key: "amount_usd", label: "金额 USD", type: "number" },
    { key: "invoice_note", label: "发票备注", type: "textarea" },
    { key: "confirmed_by", label: "确认人" },
    { key: "confirmed_at", label: "确认时间" },
    { key: "reject_reason", label: "驳回原因", type: "textarea" },
  ];
  const base = genericResourceConfig("invoices", "内部账单", "生成内部账单、备注和成本中心确认记录", fields);
  return {
    ...base,
    columns: [
      { key: "name", label: "名称" },
      { key: "period", label: "账期", render: (item) => stringifyValue(item.fields?.period) },
      { key: "cost_center", label: "成本中心", render: (item) => stringifyValue(item.fields?.cost_center) },
      { key: "amount_usd", label: "金额", render: (item) => `$${formatMoney(numberFromUnknown(item.fields?.amount_usd))}` },
      { key: "invoice_note", label: "发票备注", render: (item) => stringifyValue(item.fields?.invoice_note) || "-" },
      { key: "confirmed_by", label: "确认人", render: (item) => stringifyValue(item.fields?.confirmed_by) || "-" },
      { key: "status", label: "状态", render: (item) => <StatusPill status={item.status} label={invoiceStatusLabel(item.status)} /> },
    ],
    actions: [
      {
        label: "确认",
        title: "确认该内部账单",
        run: async (ctx, item) => {
          if (item.status !== "pending") return;
          const resp = await adminFetch(ctx, `/api/admin/resources/invoices/${item.id}/confirm`, {
            method: "POST",
            body: JSON.stringify({ invoice_note: stringifyValue(item.fields?.invoice_note) }),
          });
          if (!resp.ok) throw new Error(`confirm invoice ${resp.status}`);
          await handleApprovalOrJSON(resp);
        },
        doneMessage: (item) => `${item.name} 已确认`,
      },
      {
        label: "驳回",
        title: "驳回该内部账单",
        run: async (ctx, item) => {
          if (item.status !== "pending") return;
          const reason = window.prompt("请输入驳回原因", stringifyValue(item.fields?.reject_reason));
          if (reason === null) return;
          const resp = await adminFetch(ctx, `/api/admin/resources/invoices/${item.id}/reject`, {
            method: "POST",
            body: JSON.stringify({ reject_reason: reason }),
          });
          if (!resp.ok) throw new Error(`reject invoice ${resp.status}`);
          await handleApprovalOrJSON(resp);
        },
        doneMessage: (item) => `${item.name} 已驳回`,
      },
    ],
    toolbarActions: [
      {
        label: "生成本月",
        title: "按当前账期生成分摊和内部账单",
        run: async (ctx) => {
          const period = window.prompt("输入账期 YYYY-MM，留空则生成本月", currentBillingPeriod());
          if (period === null) return;
          const resp = await adminFetch(ctx, "/api/admin/billing/generate", {
            method: "POST",
            body: JSON.stringify({ period: period.trim() }),
          });
          if (!resp.ok) throw new Error(`generate billing ${resp.status}`);
        },
        doneMessage: () => "已生成分摊和内部账单",
      },
    ],
  };
}

async function handleApprovalOrJSON(resp: Response) {
  if (resp.status === 202) {
    const data = (await resp.json()) as { approval_required?: boolean; approval?: ApprovalRequest };
    if (data.approval_required) {
      window.dispatchEvent(new CustomEvent("tokenhub-issued-key", { detail: `已提交审批：${data.approval?.id ?? ""}` }));
    }
    return;
  }
  await resp.json().catch(() => undefined);
}

function reportExportActions(): ToolbarAction[] {
  const datasets = ["requests", "usage", "cost-centers", "budgets", "chargebacks", "invoices", "approvals", "audit-events", "alert-deliveries"];
  return datasets.map((dataset) => ({
    label: reportDatasetLabel(dataset),
    title: `导出 ${reportDatasetLabel(dataset)} CSV`,
    run: async (ctx) => downloadReport(ctx, dataset),
    doneMessage: () => `${reportDatasetLabel(dataset)} 已导出`,
  }));
}

async function downloadReport(ctx: ApiContext, dataset: string) {
  const period = reportPeriodPrompt(dataset);
  if (period === null) return;
  const resp = await adminFetch(ctx, reportExportPath(dataset, period));
  if (!resp.ok) throw new Error(`export ${dataset} ${resp.status}`);
  const blob = await resp.blob();
  downloadBlob(blob, reportFilename(dataset, period));
}

function reportPeriodPrompt(dataset: string) {
  if (!["usage", "budgets", "chargebacks", "invoices"].includes(dataset)) return "";
  const period = window.prompt("输入账期 YYYY-MM，留空则导出全部", currentBillingPeriod());
  if (period === null) return null;
  return period.trim();
}

function reportExportPath(dataset: string, period?: string) {
  const query = period ? `?period=${encodeURIComponent(period)}` : "";
  return `/api/admin/export/${encodeURIComponent(dataset)}${query}`;
}

function reportFilename(dataset: string, period?: string) {
  return `tokenhub-${dataset}${period ? `-${period}` : ""}.csv`;
}

function currentBillingPeriod() {
  return new Date().toISOString().slice(0, 7);
}

async function downloadSQLiteBackup(ctx: ApiContext, item: SQLiteBackup) {
  const resp = await adminFetch(ctx, `/api/admin/sqlite/backups/${item.id}/download`);
  if (!resp.ok) throw new Error(`download sqlite backup ${resp.status}`);
  const blob = await resp.blob();
  downloadBlob(blob, item.file_name || `tokenhub-${item.id}.sqlite3`);
}

async function restoreSQLiteBackup(ctx: ApiContext, item: SQLiteBackup) {
  const confirmation = window.prompt(`输入 RESTORE ${item.id} 确认恢复该 SQLite 备份`);
  if (confirmation == null) return;
  const resp = await adminFetch(ctx, `/api/admin/sqlite/backups/${item.id}/restore`, {
    method: "POST",
    body: JSON.stringify({ confirmation }),
  });
  if (!resp.ok) throw new Error(`restore sqlite backup ${resp.status}`);
  await resp.json().catch(() => undefined);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
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

async function runApprovalAction(ctx: ApiContext, item: ApprovalRequest, action: "approve" | "reject") {
  if (item.status !== "pending") return;
  const resp = await adminFetch(ctx, `/api/admin/approvals/${item.id}/${action}`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  if (!resp.ok) throw new Error(`${action} approval ${resp.status}`);
  const payload = (await resp.json()) as { result?: { api_key?: string } };
  if (payload.result?.api_key) {
    window.dispatchEvent(new CustomEvent("tokenhub-issued-key", { detail: payload.result.api_key }));
  }
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
    if (!values.project_id) {
      throw new Error("请选择项目空间后再发放 API Key");
    }
    const payload = keyCreatePayload(values);
    const resp = await adminFetch(ctx, `/api/admin/projects/${values.project_id}/keys`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error(`create api key ${resp.status}`);
    const data = (await resp.json()) as { api_key?: string; approval_required?: boolean; approval?: ApprovalRequest };
    if (data.approval_required) {
      setIssuedKey(`已提交审批：${data.approval?.id ?? ""}`);
    } else if (data.api_key) {
      setIssuedKey(data.api_key);
    }
    setModal(null);
    await load();
  } catch (err) {
    if (isAuthExpiredError(err)) return;
    setError(err instanceof Error ? err.message : "发放 Key 失败");
  } finally {
    setLoading(false);
  }
}

function providerPayload(values: Record<string, string>) {
  return {
    id: values.id,
    name: values.name,
    type: values.type,
    base_url: values.base_url,
    api_key: values.api_key,
    status: values.status || "active",
    healthy: values.healthy !== "false",
    priority: numberOr(values.priority, 10),
    catalog_id: values.catalog_id,
    model_category: values.model_category,
    create_routes: values.create_routes === "true",
    selected_models: splitList(values.selected_models),
  };
}

function providerUpdatePayload(values: Record<string, string>) {
  const payload = providerPayload(values) as Record<string, unknown>;
  if (!values.api_key?.trim()) {
    delete payload.api_key;
  }
  return payload;
}

function modelPayload(values: Record<string, string>) {
  const payload = numberPayload(values, ["context_window", "input_price_usd_per_1m", "output_price_usd_per_1m", "embedding_price_usd_per_1m"]);
  payload.category = values.category || inferModelCategoryText(values.name || values.family || "");
  payload.capabilities = splitList(values.capabilities);
  payload.supported_parameters = splitList(values.supported_parameters);
  payload.input_modalities = splitList(values.input_modalities);
  payload.output_modalities = splitList(values.output_modalities);
  return payload;
}

function routePayload(values: Record<string, string>) {
  const payload: Record<string, unknown> = {
    model_name: values.model_name,
    provider_id: values.provider_id,
    provider_resource_id: values.provider_resource_id,
    resource_group: values.resource_group,
    provider_model: values.provider_model,
    status: values.status,
    strategy: values.strategy,
    sticky_session: values.sticky_session === "true",
    priority: numberOr(values.priority, 0),
    weight: numberOr(values.weight, 0),
    quality_score: numberOr(values.quality_score, 0),
    cost_score: numberOr(values.cost_score, 0),
  };
  return payload;
}

async function createModelRoutes(ctx: ApiContext, values: Record<string, string>) {
  const modelNames = splitList(values.model_name);
  if (modelNames.length === 0) {
    throw new Error("请选择至少一个统一模型");
  }
  for (const modelName of modelNames) {
    const routeValues = {
      ...values,
      model_name: modelName,
      provider_model: values.provider_model?.trim() || modelName,
    };
    await adminMutate(ctx, "/api/admin/routing-rules", "POST", routePayload(routeValues));
  }
}

function defaultFormValues<T>(config: ResourceConfig<T>, data: AppData) {
  const values: Record<string, string> = {};
  for (const field of config.fields) {
    if (field.key === "status") values[field.key] = "active";
    if (field.key === "healthy") values[field.key] = "true";
    if (field.key === "priority") values[field.key] = config.view === "routes" ? "" : "10";
    if (field.key === "weight") values[field.key] = "100";
    if (field.key === "quality_score") values[field.key] = "50";
    if (field.key === "cost_score") values[field.key] = "50";
    if (field.key === "strategy") values[field.key] = "balanced";
    if (field.key === "provider_id") values[field.key] = firstActiveProvider(data)?.id ?? "";
    if (field.key === "model_name") values[field.key] = firstActiveModel(data)?.name ?? "";
    if (field.key === "group") values[field.key] = "default";
    if (field.key === "resource_type") values[field.key] = "api_key";
    if (field.key === "environment") values[field.key] = "prod";
    if (field.key === "project_id") values[field.key] = firstActiveProject(data)?.id ?? "";
    if (field.key === "allowed_models") values[field.key] = "gpt-4.1-mini";
    if (field.key === "daily_requests") values[field.key] = "1000";
    if (field.key === "monthly_requests") values[field.key] = "30000";
    if (field.key === "daily_tokens") values[field.key] = "1000000";
    if (field.key === "monthly_tokens") values[field.key] = "20000000";
    if (field.key === "daily_cost_usd") values[field.key] = "100";
    if (field.key === "monthly_cost_usd") values[field.key] = "2000";
    if (field.key === "max_concurrency") values[field.key] = "20";
    if (field.key === "modality") values[field.key] = "chat";
    if (field.key === "type") values[field.key] = "openai_compatible";
    if (field.key === "auth_type") values[field.key] = "api_key";
    if (field.key === "scope") values[field.key] = "project";
    if (field.key === "period") values[field.key] = "monthly";
    if (field.key === "enforcement") values[field.key] = "block";
    if (field.key === "dataset") values[field.key] = "requests";
    if (field.key === "schedule") values[field.key] = "manual";
    if (field.key === "trigger") values[field.key] = "quota_increase";
    if (field.key === "approver_role") values[field.key] = "admin";
    if (field.key === "webhook_url") values[field.key] = "http://localhost:8081/tokenhub-alert";
    if (field.key === "protocol") values[field.key] = "direct";
    if (field.key === "notify_mode") values[field.key] = "silent";
    if (field.key === "role") values[field.key] = "viewer";
    if (field.key === "role_key") values[field.key] = "project_admin";
    if (field.key === "display_name") values[field.key] = "项目管理员";
    if (field.key === "data_scope") values[field.key] = "project";
    if (field.key === "permissions") values[field.key] = "overview:read, project:read";
    if (field.key === "menu_scopes") values[field.key] = "overview, projects";
    if (field.key === "assignable") values[field.key] = "true";
    if (field.key === "password") values[field.key] = "changeme123456";
    if (field.key === "expire_days") values[field.key] = "14";
  }
  return values;
}

function keyCreatePayload(values: Record<string, string>) {
  return {
    name: values.name,
    group: values.group || "default",
    allowed_models: splitList(values.allowed_models),
    ip_allowlist: splitList(values.ip_allowlist),
    limits: keyLimits(values),
  };
}

function keyPatchPayload(values: Record<string, string>) {
  return {
    name: values.name,
    group: values.group || "default",
    status: values.status || "active",
    allowed_models: splitList(values.allowed_models),
    ip_allowlist: splitList(values.ip_allowlist),
    limits: keyLimits(values),
  };
}

function keyLimits(values: Record<string, string>) {
  return {
    daily_requests: numberOr(values.daily_requests, 0),
    monthly_requests: numberOr(values.monthly_requests, 0),
    daily_tokens: numberOr(values.daily_tokens, 0),
    monthly_tokens: numberOr(values.monthly_tokens, 0),
    daily_cost_usd: numberOr(values.daily_cost_usd, 0),
    monthly_cost_usd: numberOr(values.monthly_cost_usd, 0),
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
  if (resp.status === 202) {
    const data = (await resp.json()) as { approval_required?: boolean; approval?: ApprovalRequest };
    if (data.approval_required) {
      window.dispatchEvent(new CustomEvent("tokenhub-issued-key", { detail: `已提交审批：${data.approval?.id ?? ""}` }));
    }
  }
}

async function adminDelete(ctx: ApiContext, path: string) {
  const resp = await adminFetch(ctx, path, { method: "DELETE" });
  if (!resp.ok && resp.status !== 204) throw new Error(`DELETE ${path} ${resp.status}`);
}

class AuthExpiredError extends Error {
  constructor() {
    super("auth_expired");
    this.name = "AuthExpiredError";
  }
}

function isAuthExpiredError(error: unknown) {
  return error instanceof AuthExpiredError;
}

async function adminFetch(ctx: ApiContext, path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${ctx.adminToken}`);
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const resp = await fetch(`${ctx.baseURL.replace(/\/$/, "")}${path}`, { ...init, headers });
  if (resp.status === 401) {
    clearSavedSession();
    window.dispatchEvent(new CustomEvent(authExpiredEventName));
    throw new AuthExpiredError();
  }
  return resp;
}

function emptyData(): AppData {
  return {
    summary: emptySummary(),
    projects: [],
    keys: [],
    providers: [],
    providerResources: [],
    models: [],
    routes: [],
    logs: [],
    auditEvents: [],
    alerts: [],
    alertDeliveries: [],
    approvals: [],
    sqliteBackups: [],
    users: [],
    breakdown: { projects: [], models: [], providers: [], provider_resources: [], cost_centers: [] },
    timeseries: [],
    resources: {},
    providerCatalog: [],
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

function catalogModelCategoryOptions(catalog: ProviderCatalogEntry[]) {
  const counts = new Map<string, number>();
  for (const entry of catalog) {
    if (entry.category_counts) {
      for (const [category, count] of Object.entries(entry.category_counts)) {
        const normalized = standardModelCategory(category);
        counts.set(normalized, (counts.get(normalized) ?? 0) + count);
      }
      continue;
    }
    for (const category of entry.categories ?? []) {
      const normalized = standardModelCategory(category);
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }
    for (const model of entry.models ?? []) {
      const category = modelCategoryForCatalog(model);
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
  }
  if (counts.size === 0) counts.set("custom", 1);
  const ordered = preferredModelCategories.filter((category) => counts.has(category));
  return ordered.map((category) => ({
    key: category,
    label: modelCategoryLabel(category),
    count: counts.get(category) ?? 0,
  }));
}

function providerEntrySupportsCategory(entry: ProviderCatalogEntry, category: string) {
  if (category === "all") return true;
  for (const [rawCategory, count] of Object.entries(entry.category_counts ?? {})) {
    if (count > 0 && standardModelCategory(rawCategory) === category) return true;
  }
  if ((entry.categories ?? []).some((rawCategory) => standardModelCategory(rawCategory) === category)) return true;
  return (entry.models ?? []).some((model) => modelCategoryForCatalog(model) === category);
}

function providerEntryCategoryCount(entry: ProviderCatalogEntry, category: string) {
  if (category === "all") return entry.models_count;
  let count = 0;
  for (const [rawCategory, rawCount] of Object.entries(entry.category_counts ?? {})) {
    if (standardModelCategory(rawCategory) === category) count += rawCount;
  }
  if (count > 0) return count;
  const modelCount = (entry.models ?? []).filter((model) => modelCategoryForCatalog(model) === category).length;
  if (modelCount > 0) return modelCount;
  return (entry.categories ?? []).some((rawCategory) => standardModelCategory(rawCategory) === category) ? entry.models_count : 0;
}

function buildCustomProviderCatalogEntry(category: string, standardModels: Model[]): ProviderCatalogEntry {
  const normalizedCategory = standardModelCategory(category);
  const models = standardModels
    .filter((model) => normalizedCategory === "all" || modelCategory(model) === normalizedCategory)
    .map((model) => ({
      id: model.name,
      name: model.name,
      display_name: model.name,
      canonical_name: model.name,
      category: modelCategory(model),
      family: model.family,
      type: model.modality,
      context_window: model.context_window,
      input_price_usd_per_1m: model.input_price_usd_per_1m,
      output_price_usd_per_1m: model.output_price_usd_per_1m,
      input_modalities: model.input_modalities,
      output_modalities: model.output_modalities,
      capabilities: model.capabilities,
      supported_parameters: model.supported_parameters,
    }));
  return {
    id: "custom",
    name: "自定义渠道商",
    display_name: "自定义渠道商",
    type: "openai_compatible",
    categories: [normalizedCategory],
    category_counts: { [normalizedCategory]: models.length },
    models_count: models.length,
    source: "tokenhub-standard-catalog",
    models,
  };
}

function modelCategoryForCatalog(model: ProviderCatalogModel) {
  return standardModelCategory(modelCategory(model));
}

function canonicalModelNameForUI(id: string, displayName?: string) {
  let value = (id || "").trim();
  const slash = value.lastIndexOf("/");
  if (slash >= 0 && slash < value.length - 1) value = value.slice(slash + 1);
  if (!value) value = (displayName || "").trim();
  value = value.toLowerCase().replaceAll(" ", "-").replaceAll("_", "-");
  while (value.includes("--")) value = value.replaceAll("--", "-");
  value = value.replace(/^-+|-+$/g, "");
  for (const prefix of ["deepseek", "claude", "gemini", "qwen", "gpt", "glm"]) {
    value = normalizeCompactModelVersionForUI(value, prefix);
  }
  return value || "custom-model";
}

function normalizeCompactModelVersionForUI(value: string, prefix: string) {
  const compact = `${prefix}v`;
  if (value.startsWith(compact) && value.length > compact.length && /\d/.test(value[compact.length])) {
    return `${prefix}-v${value.slice(compact.length)}`;
  }
  if (value.startsWith(prefix) && value.length > prefix.length && /\d/.test(value[prefix.length])) {
    return `${prefix}-${value.slice(prefix.length)}`;
  }
  return value;
}

function filterByModelCategory<T>(view: ViewKey | undefined, items: T[], category: string, data: AppData) {
  if (!view || category === "all") return items;
  if (view === "models") {
    return items.filter((item) => modelCategory(item as Model) === category);
  }
  if (view === "providers") {
    return items.filter((item) => providerCategories(item as Provider, data).includes(category));
  }
  return items;
}

function modelCategoryTabs(data: AppData, view: ViewKey) {
  const counts = new Map<string, number>();
  if (view === "providers") {
    for (const provider of data.providers) {
      for (const category of providerCategories(provider, data)) {
        counts.set(category, (counts.get(category) ?? 0) + 1);
      }
    }
  } else {
    for (const model of data.models) {
      const category = modelCategory(model);
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
  }
  const ordered = preferredModelCategories.filter((category) => counts.has(category));
  for (const category of Array.from(counts.keys()).sort()) {
    if (!ordered.includes(category)) ordered.push(category);
  }
  return [
    { key: "all", label: "全部", count: view === "providers" ? data.providers.length : data.models.length },
    ...ordered.map((category) => ({
      key: category,
      label: modelCategoryLabel(category),
      count: counts.get(category) ?? 0,
    })),
  ];
}

function modelCatalogCategories(data: AppData) {
  const counts = new Map<string, number>();
  for (const model of data.models) {
    const category = modelCategory(model);
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  const ordered = preferredModelCategories.filter((item) => counts.has(item));
  for (const category of Array.from(counts.keys()).sort()) {
    if (!ordered.includes(category)) ordered.push(category);
  }
  return [
    { key: "all", label: "全部", count: data.models.length },
    ...ordered.map((key) => ({ key, label: modelCategoryLabel(key), count: counts.get(key) ?? 0 })),
  ];
}

function modelCatalogCapabilityTabs(data: AppData) {
  const models = data.models;
  const tabs: Array<{ key: string; label: string; icon: typeof Boxes; count: number }> = [
    { key: "all", label: "所有模型", icon: Boxes, count: models.length },
    { key: "featured", label: "精选", icon: Sparkles, count: models.filter(isFeaturedModel).length },
    { key: "text", label: "文本", icon: FileText, count: models.filter((model) => modelCapabilityKeys(model).includes("text")).length },
    { key: "image", label: "图像", icon: Activity, count: models.filter((model) => modelCapabilityKeys(model).includes("image")).length },
    { key: "video", label: "视频", icon: Send, count: models.filter((model) => modelCapabilityKeys(model).includes("video")).length },
    { key: "audio", label: "音频", icon: Bell, count: models.filter((model) => modelCapabilityKeys(model).includes("audio")).length },
    { key: "embedding", label: "嵌入", icon: Database, count: models.filter((model) => modelCapabilityKeys(model).includes("embedding")).length },
    { key: "rerank", label: "重排序", icon: BarChart3, count: models.filter((model) => modelCapabilityKeys(model).includes("rerank")).length },
    { key: "third_party", label: "三方资源", icon: Users, count: models.filter((model) => hasThirdPartyRoute(model, data)).length },
  ];
  return tabs.filter((tab) => tab.key === "all" || tab.key === "third_party" || tab.count > 0);
}

function filterModelCatalog(models: Model[], data: AppData, category: string, capability: string, query: string) {
  const normalized = query.trim().toLowerCase();
  return models
    .filter((model) => category === "all" || modelCategory(model) === category)
    .filter((model) => {
      if (capability === "all") return true;
      if (capability === "featured") return isFeaturedModel(model);
      if (capability === "third_party") return hasThirdPartyRoute(model, data);
      return modelCapabilityKeys(model).includes(capability);
    })
    .filter((model) => {
      if (!normalized) return true;
      return [
        model.name,
        model.id,
        model.family,
        model.modality,
        model.category,
        ...(model.capabilities ?? []),
        ...(model.supported_parameters ?? []),
      ].filter(Boolean).join(" ").toLowerCase().includes(normalized);
    })
    .sort((left, right) => {
      const featuredDiff = Number(isFeaturedModel(right)) - Number(isFeaturedModel(left));
      return featuredDiff || modelCategoryRank(left) - modelCategoryRank(right) || left.name.localeCompare(right.name);
    });
}

function modelCapabilityKey(model: Model) {
  return modelCapabilityKeys(model)[0] ?? "text";
}

function modelCapabilityKeys(model: Model) {
  const values = [model.modality, ...(model.capabilities ?? []), ...(model.input_modalities ?? []), ...(model.output_modalities ?? [])]
    .join(" ")
    .toLowerCase();
  const keys = new Set<string>();
  if (values.includes("chat") || values.includes("text") || values.includes("llm")) keys.add("text");
  if (values.includes("embed")) keys.add("embedding");
  if (values.includes("rerank")) keys.add("rerank");
  if (values.includes("image") || values.includes("vision") || values.includes("ocr")) keys.add("image");
  if (values.includes("video")) keys.add("video");
  if (values.includes("audio") || values.includes("tts") || values.includes("asr")) keys.add("audio");
  if (keys.size === 0) keys.add("text");
  return Array.from(keys);
}

function modelCapabilityLabel(model: Model) {
  const labels: Record<string, string> = {
    text: "文本",
    image: "图像",
    video: "视频",
    audio: "音频",
    embedding: "嵌入",
    rerank: "重排序",
  };
  return modelCapabilityKeys(model).map((key) => labels[key] ?? key).slice(0, 3).join(" / ");
}

function isFeaturedModel(model: Model) {
  const routes = model.name.toLowerCase();
  return model.status === "active" && (
    routes.includes("gpt-5")
    || routes.includes("claude")
    || routes.includes("deepseek")
    || routes.includes("gemini")
    || routes.includes("qwen")
  );
}

function hasThirdPartyRoute(model: Model, data: AppData) {
  return modelRoutesFor(model, data).some((route) => {
    const provider = findProvider(data, route.provider_id);
    if (!provider) return false;
    return provider.type === "openai_compatible" || provider.type === "local" || provider.type === "mock";
  });
}

function modelCategoryInitial(category: string, label: string) {
  const normalized = category.toLowerCase();
  if (normalized === "claude") return "A";
  if (normalized === "gemini") return "G";
  if (normalized === "openai") return "O";
  if (normalized === "deepseek") return "D";
  if (normalized === "qwen") return "Q";
  if (normalized === "grok") return "X";
  return (label || category || "M").trim().slice(0, 1).toUpperCase();
}

function modelCatalogFilterLabel(categories: Array<{ key: string; label: string }>, active: string) {
  return categories.find((item) => item.key === active)?.label ?? "全部";
}

function priceMetric(value: number | undefined) {
  if (!value) return "$-";
  return `$${formatMoney(value)}/Mt`;
}

function modelCategory(model: Model | ProviderCatalogModel | undefined) {
  const explicit = model?.category?.trim().toLowerCase();
  if (explicit) return standardModelCategory(explicit);
  const displayName = model && "display_name" in model ? model.display_name : "";
  return inferModelCategoryText([model?.name, model?.id, displayName, model?.family].filter(Boolean).join(" "));
}

function providerCategories(provider: Provider, data: AppData) {
  const routeModels = providerRoutesFor(provider, data)
    .map((route) => data.models.find((model) => model.name === route.model_name))
    .filter(Boolean) as Model[];
  const categories = routeModels.map(modelCategory);
  const optionCategory = provider.options?.model_category;
  if (optionCategory) categories.push(standardModelCategory(optionCategory));
  if (categories.length === 0) categories.push(providerTypeToModelCategory(provider.type));
  return Array.from(new Set(categories.filter(Boolean))).sort();
}

function providerTypeToModelCategory(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes("anthropic")) return "claude";
  if (normalized.includes("gemini")) return "gemini";
  if (normalized.includes("deepseek")) return "deepseek";
  if (normalized.includes("qwen")) return "qwen";
  if (normalized.includes("azure") || normalized.includes("openai")) return "openai";
  if (normalized.includes("local")) return "custom";
  return "custom";
}

function modelCategoryFormOptions() {
  return preferredModelCategories.filter((category) => category !== "custom").concat("custom");
}

function standardModelCategory(category: string) {
  const normalized = category.trim().toLowerCase();
  if (!normalized) return "custom";
  if (modelCategoryLabels[normalized] && normalized !== "all") return normalized;
  return inferModelCategoryText(normalized);
}

function modelCategoryLabel(category: string) {
  return modelCategoryLabels[category] ?? category;
}

function inferModelCategoryText(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("gpt") || normalized.includes("openai") || /\bo[134]\b/.test(normalized)) return "openai";
  if (normalized.includes("claude") || normalized.includes("anthropic")) return "claude";
  if (normalized.includes("deepseek")) return "deepseek";
  if (normalized.includes("gemini") || normalized.includes("google")) return "gemini";
  if (normalized.includes("qwen") || normalized.includes("dashscope") || normalized.includes("alibaba")) return "qwen";
  if (normalized.includes("glm") || normalized.includes("zhipu")) return "glm";
  if (normalized.includes("kimi") || normalized.includes("moonshot")) return "kimi";
  if (normalized.includes("doubao") || normalized.includes("volcengine")) return "doubao";
  if (normalized.includes("ernie")) return "ernie";
  if (normalized.includes("baichuan")) return "baichuan";
  if (normalized.includes("minimax") || normalized.includes("hailuo")) return "minimax";
  if (normalized.includes("step-")) return "stepfun";
  if (normalized.includes("wanx")) return "wanx";
  if (normalized.includes("paddleocr")) return "paddlepaddle";
  if (normalized.includes("phi-")) return "microsoft";
  if (normalized.includes("llama")) return "llama";
  if (normalized.includes("mistral")) return "mistral";
  if (normalized.includes("grok") || normalized.includes("xai")) return "grok";
  return "custom";
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

function findProvider(data: AppData, providerID: string) {
  return data.providers.find((provider) => provider.id === providerID);
}

function findProject(data: AppData, projectID: string) {
  return data.projects.find((project) => project.id === projectID);
}

function firstActiveProject(data: AppData) {
  return data.projects.find((project) => project.id === DEFAULT_PROJECT_ID && project.status === "active")
    ?? data.projects.find((project) => project.status === "active")
    ?? data.projects[0];
}

function firstActiveModel(data: AppData) {
  return data.models.find((model) => model.status === "active") ?? data.models[0];
}

function firstActiveProvider(data: AppData) {
  return data.providers.find((provider) => provider.status === "active") ?? data.providers[0];
}

function projectSelectOptions(data: AppData) {
  return data.projects.map((project) => ({
    value: project.id,
    label: projectOptionLabel(project),
  }));
}

function modelSelectOptions(data: AppData) {
  return data.models
    .slice()
    .sort((left, right) => modelCategoryRank(left) - modelCategoryRank(right) || left.name.localeCompare(right.name))
    .map((model) => ({
      value: model.name,
      label: `${model.name} / ${modelCategoryLabel(modelCategory(model))}${model.status !== "active" ? ` / ${enumValueLabel(model.status)}` : ""}`,
    }));
}

function providerSelectOptions(data: AppData) {
  return data.providers
    .slice()
    .sort((left, right) => (left.priority - right.priority) || left.name.localeCompare(right.name))
    .map((provider) => ({
      value: provider.id,
      label: `${provider.name || provider.id} / ${providerTypeLabel(provider.type)}${provider.status !== "active" ? ` / ${enumValueLabel(provider.status)}` : ""}`,
    }));
}

function projectOptionLabel(project: Project) {
  return [project.name || project.id, project.team_id ? `团队 ${project.team_id}` : "", project.owner_user_id ? `负责人 ${project.owner_user_id}` : ""]
    .filter(Boolean)
    .join(" / ");
}

function projectName(data: AppData, projectID: string) {
  const project = findProject(data, projectID);
  return project ? project.name : projectID || "-";
}

function projectOwnerLabel(data: AppData, projectID: string) {
  const project = findProject(data, projectID);
  return project?.owner_user_id || "-";
}

function projectTeamLabel(data: AppData, projectID: string) {
  const project = findProject(data, projectID);
  return project?.team_id || "-";
}

function modelRoutesFor(model: Model, data: AppData) {
  return data.routes
    .filter((route) => route.model_name === model.name)
    .sort((left, right) => (left.priority - right.priority) || (right.weight - left.weight));
}

function routeModelCategories(data: AppData) {
  const counts = new Map<string, number>();
  for (const model of data.models) {
    if (modelRoutesFor(model, data).length === 0) continue;
    const category = modelCategory(model);
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  const items = Array.from(counts.entries())
    .map(([key, count]) => ({ key, label: modelCategoryLabel(key), count }))
    .sort((left, right) => preferredModelCategories.indexOf(left.key) - preferredModelCategories.indexOf(right.key) || left.label.localeCompare(right.label));
  const total = items.reduce((sum, item) => sum + item.count, 0);
  return [{ key: "all", label: "全部", count: total }, ...items];
}

function filterRouteModels(data: AppData, category: string, scope: "configured" | "all", query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  return data.models
    .filter((model) => {
      const routes = modelRoutesFor(model, data);
      if (scope === "configured" && routes.length === 0) return false;
      if (category !== "all" && modelCategory(model) !== category) return false;
      if (!normalizedQuery) return true;
      return routeModelSearchText(model, routes, data).includes(normalizedQuery);
    })
    .sort((left, right) => {
      const leftRoutes = modelRoutesFor(left, data).length;
      const rightRoutes = modelRoutesFor(right, data).length;
      if (leftRoutes !== rightRoutes) return rightRoutes - leftRoutes;
      return modelCategoryRank(left) - modelCategoryRank(right) || left.name.localeCompare(right.name);
    });
}

function routeModelSearchText(model: Model, routes: ModelRoute[], data: AppData) {
  const routeText = routes.flatMap((route) => {
    const provider = findProvider(data, route.provider_id);
    return [
      route.model_name,
      route.provider_model,
      route.provider_id,
      provider?.name,
      provider?.type,
      provider?.base_url,
    ];
  });
  return [model.name, model.id, model.family, model.modality, model.category, ...routeText]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function reorderRoutes(routes: ModelRoute[], draggedID: string, targetID: string) {
  if (!draggedID || !targetID || draggedID === targetID) return routes;
  const current = routes.slice();
  const from = current.findIndex((route) => route.id === draggedID);
  const to = current.findIndex((route) => route.id === targetID);
  if (from < 0 || to < 0 || from === to) return routes;
  const [moved] = current.splice(from, 1);
  current.splice(to, 0, moved);
  return current;
}

function providerRoutesFor(provider: Provider, data: AppData) {
  return data.routes.filter((route) => route.provider_id === provider.id);
}

function providerRouteSummary(provider: Provider, data: AppData) {
  const routes = providerRoutesFor(provider, data);
  if (routes.length === 0) return "未配置";
  const active = routes.filter((route) => route.status === "active").length;
  const models = Array.from(new Set(routes.map((route) => route.model_name))).slice(0, 3);
  return `${active}/${routes.length} 启用 · ${models.join(", ")}`;
}

function providerCostDetailRows(data: AppData) {
  if (data.breakdown.providers.length > 0) return data.breakdown.providers;
  const resourcesByID = new Map(data.providerResources.map((resource) => [resource.id, resource]));
  const providersByID = new Map(data.providers.map((provider) => [provider.id, provider]));
  const totals = new Map<string, UsageBreakdownRow>();
  for (const row of data.breakdown.provider_resources ?? []) {
    const resource = resourcesByID.get(row.id);
    const provider = resource ? providersByID.get(resource.provider_id) : undefined;
    const id = provider?.name || resource?.provider_id || row.id;
    const current = totals.get(id) ?? {
      id,
      request_count: 0,
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0,
      estimated_cost_usd: 0,
    };
    current.request_count += row.request_count;
    current.input_tokens += row.input_tokens;
    current.output_tokens += row.output_tokens;
    current.total_tokens += row.total_tokens;
    current.estimated_cost_usd += row.estimated_cost_usd;
    totals.set(id, current);
  }
  return Array.from(totals.values());
}

function providerAuditLabel(data: AppData, log: RequestLog) {
  const provider = log.provider_id ? findProvider(data, log.provider_id) : undefined;
  if (provider) return provider.name;
  if (log.provider_id) return log.provider_id;
  const resource = log.provider_resource_id
    ? data.providerResources.find((item) => item.id === log.provider_resource_id)
    : undefined;
  if (!resource) return "-";
  return findProvider(data, resource.provider_id)?.name || resource.provider_id || "-";
}

function providerAttemptLabel(data: AppData, attempt: RouteAttemptLog) {
  const provider = attempt.provider_id ? findProvider(data, attempt.provider_id) : undefined;
  if (provider) return provider.name;
  if (attempt.provider_id) return attempt.provider_id;
  const resource = attempt.provider_resource_id
    ? data.providerResources.find((item) => item.id === attempt.provider_resource_id)
    : undefined;
  if (!resource) return "-";
  return findProvider(data, resource.provider_id)?.name || resource.provider_id || "-";
}

function providerResourceAuditLabel(data: AppData, resourceID?: string) {
  if (!resourceID) return "-";
  const resource = data.providerResources.find((item) => item.id === resourceID);
  if (!resource) return resourceID;
  const provider = findProvider(data, resource.provider_id);
  return [resource.name || resource.id, provider?.name || resource.provider_id].filter(Boolean).join(" / ");
}

function apiKeyAuditLabel(data: AppData, apiKeyID?: string) {
  if (!apiKeyID) return "-";
  const key = data.keys.find((item) => item.id === apiKeyID);
  if (!key) return apiKeyID;
  return `${key.name || key.id} (${key.key_prefix}...${key.key_suffix})`;
}

function providerRouteDefaults(provider: Provider, data: AppData) {
  const firstModel = firstActiveModel(data);
  return {
    model_name: firstModel?.name ?? "",
    provider_id: provider.id,
    provider_model: firstModel?.name ?? "",
    priority: "1",
    weight: "100",
    quality_score: "50",
    cost_score: "50",
    strategy: "balanced",
    sticky_session: "false",
    status: "active",
  };
}

function modelRouteDefaults(model: Model, data: AppData) {
  const firstProvider = firstActiveProvider(data);
  return {
    model_name: model.name,
    provider_id: firstProvider?.id ?? "",
    provider_model: model.name,
    priority: "1",
    weight: "100",
    quality_score: "50",
    cost_score: "50",
    strategy: "balanced",
    sticky_session: "false",
    status: "active",
  };
}

function routeScoreSummary(route: ModelRoute) {
  return `质量 ${route.quality_score ?? 50} / 成本 ${route.cost_score ?? 50}`;
}

function modelCapabilitySummary(model: Model) {
  const capabilities = [
    model.modality,
    ...(model.capabilities ?? []),
    ...(model.supported_parameters ?? []).map((item) => `param:${item}`),
  ].filter(Boolean);
  return compactList(capabilities);
}

function modelPriceSummary(model: Model) {
  const embedding = model.embedding_price_usd_per_1m || 0;
  if (model.modality === "embedding" || embedding > 0) {
    return `$${formatMoney(embedding)}/1M`;
  }
  const input = model.input_price_usd_per_1m || 0;
  const output = model.output_price_usd_per_1m || 0;
  if (!input && !output) return "$-";
  return `$${formatMoney(input)} / $${formatMoney(output)}`;
}

function fieldSummary(fields?: Record<string, unknown>) {
  if (!fields || Object.keys(fields).length === 0) return "-";
  return Object.entries(fields)
    .slice(0, 3)
    .map(([key, value]) => `${fieldKeyLabel(key)}: ${fieldValueLabel(key, value)}`)
    .join(" / ");
}

function compactList(value: unknown) {
  const values = Array.isArray(value) ? value.map(stringifyValue) : splitList(stringifyValue(value));
  if (values.length === 0) return "-";
  if (values.length <= 3) return values.join(", ");
  return `${values.slice(0, 3).join(", ")} +${values.length - 3}`;
}

function boolLabel(value: unknown) {
  const text = stringifyValue(value).trim().toLowerCase();
  return text === "false" || text === "0" || text === "no" ? "否" : "是";
}

function dataScopeLabel(scope: string) {
  const labels: Record<string, string> = {
    global: "全局",
    team: "团队",
    project: "项目",
    self: "本人",
  };
  return labels[scope] ?? (scope || "-");
}

function enumOptionLabel(fieldKey: string, value: string) {
  return fieldValueLabel(fieldKey, value);
}

function enumValueLabel(value: string | undefined) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return "-";
  const labels: Record<string, string> = {
    active: "启用",
    disabled: "停用",
    revoked: "已吊销",
    draft: "草稿",
    archived: "已归档",
    pending: "待处理",
    approved: "已批准",
    rejected: "已驳回",
    confirmed: "已确认",
    healthy: "健康",
    ok: "正常",
    success: "成功",
    warning: "告警",
    degraded: "降级",
    error: "异常",
    failed: "失败",
    down: "不可用",
    expired: "已过期",
    unknown: "未知",
    global: "全局",
    project: "项目",
    api_key: "API Key",
    team: "团队",
    self: "本人",
    provider: "Provider",
    model: "模型",
    resource: "资源",
    provider_resource: "Provider 资源",
    direct: "直连",
    http: "HTTP",
    https: "HTTPS",
    socks5: "SOCKS5",
    silent: "静默",
    popup: "弹窗",
    manual: "手动",
    daily: "每日",
    weekly: "每周",
    monthly: "每月",
    quarterly: "每季度",
    yearly: "每年",
    block: "超额拦截",
    warn: "仅告警",
    webhook: "Webhook",
    requests: "请求日志",
    usage: "用量归因",
    "cost-centers": "成本中心",
    budgets: "预算",
    chargebacks: "部门分摊",
    invoices: "内部账单",
    approvals: "审批记录",
    "audit-events": "操作审计",
    "alert-deliveries": "通知记录",
    api_key_create: "Key 发放",
    budget_change: "预算变更",
    model_access: "模型开通",
    quota_increase: "额度提升",
    invoice_confirm: "账单确认",
    invoice_reject: "账单驳回",
    balanced: "平衡",
    quality: "质量优先",
    cost: "成本优先",
    priority_weighted: "优先级 + 权重",
    priority_only: "仅优先级",
    chat: "文本对话",
    embedding: "向量嵌入",
    image: "图像",
    video: "视频",
    audio: "音频",
    ocr: "OCR",
    rerank: "重排序",
  };
  return labels[normalized] ?? roleLabel(normalized) ?? value ?? "-";
}

function fieldValueLabel(fieldKey: string, value: unknown): string {
  if (Array.isArray(value)) return value.map((item) => fieldValueLabel(fieldKey, item)).join(", ");
  const text = stringifyValue(value).trim();
  if (!text) return "-";
  const normalizedKey = fieldKey.toLowerCase();
  if (normalizedKey.includes("role")) return roleLabel(text);
  if (normalizedKey.includes("scope")) return dataScopeLabel(text);
  if (normalizedKey.includes("provider_type")) return providerTypeLabel(text);
  if (normalizedKey === "status" || normalizedKey.includes("status")) return enumValueLabel(text);
  if (normalizedKey === "strategy") return routeStrategyLabel(text);
  if (normalizedKey === "trigger") return approvalTriggerLabel(text);
  if (normalizedKey === "dataset") return reportDatasetLabel(text);
  if (normalizedKey === "schedule" || normalizedKey === "period") return enumValueLabel(text);
  if (normalizedKey === "enforcement") return budgetEnforcementLabel(text);
  if (normalizedKey === "type" || normalizedKey === "notify_mode" || normalizedKey === "protocol" || normalizedKey === "target_type" || normalizedKey === "resource_type" || normalizedKey === "modality") {
    return enumValueLabel(text);
  }
  return text;
}

function fieldKeyLabel(key: string) {
  const labels: Record<string, string> = {
    role_key: "角色标识",
    display_name: "显示名称",
    data_scope: "数据范围",
    permissions: "权限点",
    menu_scopes: "菜单范围",
    assignable: "可分配",
    scope: "作用域",
    scope_id: "作用域 ID",
    type: "类型",
    protocol: "协议",
    notify_mode: "通知模式",
    trigger: "触发条件",
    approver_role: "审批角色",
    dataset: "数据集",
    schedule: "频率",
    enforcement: "管控模式",
    period: "周期",
    target_type: "目标类型",
  };
  return labels[key] ?? key;
}

function monitorTargetLabel(fields?: Record<string, unknown>) {
  const target = stringifyValue(fields?.target_type || "").toLowerCase();
  const labels: Record<string, string> = {
    provider: "Provider",
    resource: "Provider",
    provider_resource: "Provider",
    model: "模型路由",
  };
  return labels[target] ?? (target || "-");
}

function parseLooseValue(value: string) {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    admin: "系统管理员",
    system_admin: "系统管理员",
    security: "安全审计",
    security_admin: "安全审计",
    project_admin: "项目管理员",
    viewer: "只读成员",
  };
  return labels[role] ?? role;
}

function providerTypeLabel(type: string | undefined) {
  const normalized = String(type ?? "").trim().toLowerCase();
  if (!normalized) return "-";
  const labels: Record<string, string> = {
    mock: "模拟渠道",
    openai: "OpenAI 官方",
    openai_compatible: "OpenAI 兼容",
    azure_openai: "Azure OpenAI",
    anthropic: "Claude / Anthropic",
    gemini: "Gemini / Google",
    deepseek: "DeepSeek",
    qwen: "Qwen / 通义千问",
    local: "本地模型",
  };
  return labels[normalized] ?? type ?? "-";
}

function budgetScopeLabel(scope: string) {
  const labels: Record<string, string> = {
    project: "项目",
    team: "团队",
    cost_center: "成本中心",
    "cost-center": "成本中心",
  };
  return labels[scope] ?? scope;
}

function budgetEnforcementLabel(value: string) {
  const labels: Record<string, string> = {
    block: "超额拦截",
    enforce: "超额拦截",
    warn: "仅告警",
    monitor: "仅告警",
    off: "关闭",
    disabled: "关闭",
  };
  return labels[value || "block"] ?? value;
}

function reportDatasetLabel(dataset: string) {
  const labels: Record<string, string> = {
    requests: "请求日志",
    usage: "用量归因",
    "cost-centers": "成本中心",
    budgets: "预算",
    chargebacks: "部门分摊",
    invoices: "内部账单",
    approvals: "审批记录",
    "audit-events": "操作审计",
    "alert-deliveries": "通知记录",
  };
  return labels[dataset] ?? dataset;
}

function reportScheduleLabel(schedule: string) {
  const labels: Record<string, string> = {
    manual: "手动",
    daily: "每日",
    weekly: "每周",
    monthly: "每月",
  };
  return labels[schedule] ?? schedule;
}

function actionLabel(action: string) {
  const labels: Record<string, string> = {
    create: "新增",
    update: "编辑",
    delete: "删除",
    test: "测试",
    health: "健康变更",
    confirm: "确认",
    reject: "驳回",
    export: "导出",
  };
  return labels[action] ?? action;
}

function resourceTypeLabel(type: string) {
  const labels: Record<string, string> = {
    provider: "Provider",
    provider_resource: "Provider",
    project: "项目",
    api_key: "API Key",
    model: "模型",
    routing_rule: "路由",
    users: "用户",
    "quota-policies": "额度策略",
    "security-policies": "安全策略",
    "alert-rules": "告警规则",
  };
  return labels[type] ?? type;
}

function approvalTriggerLabel(trigger: string) {
  const labels: Record<string, string> = {
    api_key_create: "Key 发放",
    budget_change: "预算变更",
    model_access: "模型开通",
    quota_increase: "额度提升",
    invoice_confirm: "账单确认",
    invoice_reject: "账单驳回",
  };
  return labels[trigger] ?? trigger;
}

function approvalStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "待审批",
    approved: "已批准",
    rejected: "已驳回",
  };
  return labels[status] ?? status;
}

function invoiceStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "待确认",
    confirmed: "已确认",
    rejected: "已驳回",
    active: "有效",
    disabled: "停用",
  };
  return labels[status] ?? status;
}

function approvalPayloadSummary(payload?: string) {
  if (!payload) return "-";
  try {
    const data = JSON.parse(payload) as Record<string, unknown>;
    const parts = [
      stringifyValue(data.name),
      stringifyValue(data.project_id),
      stringifyValue(data.kind),
      stringifyValue(data.resource_id),
    ].filter(Boolean);
    if (data.fields && typeof data.fields === "object") {
      parts.push(fieldSummary(data.fields as Record<string, unknown>));
    }
    return parts.filter((item) => item !== "-").slice(0, 3).join(" / ") || "-";
  } catch {
    return payload.slice(0, 80);
  }
}

function userInitial(user: AdminUser) {
  const source = user.name || user.username || user.email || "U";
  return source.trim().slice(0, 1).toUpperCase();
}

function numberOr(value: string | undefined, fallback: number) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function numberFromUnknown(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return numberOr(value, 0);
  return 0;
}

function splitList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function initialView(): ViewKey {
  if (typeof window === "undefined") return "overview";
  return viewFromPath(window.location.pathname);
}

function viewFromPath(pathname: string): ViewKey {
  const normalized = pathname.replace(/^\/+|\/+$/g, "");
  if (!normalized) return "overview";
  return routeViews[normalized] ?? "overview";
}

function playgroundModels(data: AppData) {
  return data.models
    .filter((model) => model.status === "active" && (model.modality === "" || model.modality === "chat"))
    .sort((a, b) => {
      const routeDiff = activeRouteCount(b.name, data) - activeRouteCount(a.name, data);
      return routeDiff || modelCategoryRank(a) - modelCategoryRank(b) || a.name.localeCompare(b.name);
    });
}

const apiExampleLanguages: Array<{ key: ApiExampleLanguage; label: string }> = [
  { key: "python", label: "Python" },
  { key: "typescript", label: "TypeScript" },
  { key: "java", label: "Java" },
  { key: "go", label: "Go" },
];

function apiExampleScripts(baseURL: string, modelName: string): Record<ApiExampleLanguage, string> {
  const normalizedBaseURL = apiGatewayBaseURL(baseURL);
  const model = modelName || "gpt-4.1-mini";
  const prompt = "请用三句话介绍 TokenHub。";
  return {
    python: `from openai import OpenAI

client = OpenAI(
    api_key="YOUR_TOKENHUB_API_KEY",
    base_url="${normalizedBaseURL}"
)

response = client.chat.completions.create(
    model="${model}",
    messages=[
        {"role": "system", "content": "你是企业内部 AI 助手。"},
        {"role": "user", "content": "${prompt}"},
    ],
    temperature=0.7,
)

print(response.choices[0].message.content)`,
    typescript: `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.TOKENHUB_API_KEY ?? "YOUR_TOKENHUB_API_KEY",
  baseURL: "${normalizedBaseURL}",
});

const response = await client.chat.completions.create({
  model: "${model}",
  messages: [
    { role: "system", content: "你是企业内部 AI 助手。" },
    { role: "user", content: "${prompt}" },
  ],
  temperature: 0.7,
});

console.log(response.choices[0]?.message?.content);`,
    java: `import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import com.openai.models.ChatModel;
import com.openai.models.chat.completions.ChatCompletionCreateParams;

public class TokenHubExample {
  public static void main(String[] args) {
    OpenAIClient client = OpenAIOkHttpClient.builder()
        .apiKey(System.getenv().getOrDefault("TOKENHUB_API_KEY", "YOUR_TOKENHUB_API_KEY"))
        .baseUrl("${normalizedBaseURL}")
        .build();

    ChatCompletionCreateParams params = ChatCompletionCreateParams.builder()
        .model(ChatModel.of("${model}"))
        .addSystemMessage("你是企业内部 AI 助手。")
        .addUserMessage("${prompt}")
        .temperature(0.7)
        .build();

    System.out.println(client.chat().completions().create(params).choices().get(0).message().content().orElse(""));
  }
}`,
    go: `package main

import (
	"context"
	"fmt"
	"os"

	openai "github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
)

func main() {
	client := openai.NewClient(
		option.WithAPIKey(os.Getenv("TOKENHUB_API_KEY")),
		option.WithBaseURL("${normalizedBaseURL}"),
	)

	resp, err := client.Chat.Completions.New(context.Background(), openai.ChatCompletionNewParams{
		Model: "${model}",
		Messages: []openai.ChatCompletionMessageParamUnion{
			openai.SystemMessage("你是企业内部 AI 助手。"),
			openai.UserMessage("${prompt}"),
		},
		Temperature: openai.Float(0.7),
	})
	if err != nil {
		panic(err)
	}

	fmt.Println(resp.Choices[0].Message.Content)
}`,
  };
}

function apiGatewayBaseURL(baseURL: string) {
  const trimmed = (baseURL || "http://localhost:8080").replace(/\/+$/, "");
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
}

function activeRouteCount(modelName: string, data: AppData) {
  return data.routes.filter((route) => route.model_name === modelName && route.status === "active").length;
}

function modelCategoryRank(model: Model) {
  const index = preferredModelCategories.indexOf(modelCategory(model));
  return index >= 0 ? index : preferredModelCategories.length;
}

function uniqueUIID(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

async function readAPIError(resp: Response) {
  const payload = await resp.json().catch(() => null);
  const code = payload?.error?.code || payload?.error?.type || `HTTP ${resp.status}`;
  const message = payload?.error?.message || "请求失败";
  if (code === "provider_unavailable") return "该模型暂无可用路由，请先在路由策略中配置启用线路。";
  if (code === "provider_not_configured") return "命中的 Provider 尚未配置 Base URL 或凭证。";
  if (code === "provider_resource_concurrency_exceeded") return "Provider 资源并发已满，请稍后再试。";
  if (code === "provider_resource_cooling_down") return "Provider 资源处于冷却中，请检查资源健康状态。";
  return `${message} (${code})`;
}

function extractAssistantText(payload: PlaygroundChatPayload) {
  const choice = payload.response?.choices?.[0];
  const content = choice?.message?.content ?? choice?.text ?? payload.response?.output_text ?? payload.response?.content;
  return stringifyChatContent(content);
}

function stringifyChatContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          return stringifyChatContent(record.text ?? record.content ?? record.value);
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  if (content == null) return "";
  if (typeof content === "object") return JSON.stringify(content, null, 2);
  return String(content);
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

function modelCapabilities(model: ProviderCatalogModel) {
  return [
    ...(model.capabilities ?? []),
    ...(model.supported_parameters ?? []).map((item) => `param:${item}`),
  ].slice(0, 8);
}

function formatModelPrice(model: ProviderCatalogModel) {
  const input = model.input_price_usd_per_1m ?? 0;
  const output = model.output_price_usd_per_1m ?? 0;
  if (!input && !output) return "$-";
  return `$${formatMoney(input)}/$${formatMoney(output)}`;
}

function modelToForm(item: Model) {
  return {
    ...stringifyForm(item),
    capabilities: (item.capabilities ?? []).join(", "),
    supported_parameters: (item.supported_parameters ?? []).join(", "),
    input_modalities: (item.input_modalities ?? []).join(", "),
    output_modalities: (item.output_modalities ?? []).join(", "),
  };
}

function formatBytes(value: number) {
  if (!value) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function routeStrategyLabel(value?: string) {
  const labels: Record<string, string> = {
    balanced: "平衡",
    quality: "质量优先",
    cost: "成本优先",
    priority_weighted: "优先级 + 权重",
    priority_only: "仅优先级",
  };
  return labels[value || "balanced"] ?? value ?? "平衡";
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
