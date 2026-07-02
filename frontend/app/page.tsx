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
  Code2,
  Copy,
  Database,
  FileText,
  Fingerprint,
  Gauge,
  Globe2,
  GripVertical,
  KeyRound,
  LayoutDashboard,
  LogOut,
  LockKeyhole,
  Eye,
  EyeOff,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Send,
  Server,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  UserRoundCheck,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Summary = {
  request_count: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  errors: number;
  usage_record_count?: number;
  api_key_count?: number;
  route_count?: number;
  active_route_count?: number;
  user_count?: number;
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

type LoginIdentityProvider = {
  id: string;
  name: string;
  display_name?: string;
  provider_type: string;
  issuer_url?: string;
  icon_key?: string;
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

type ReportExportHistoryItem = {
  id: string;
  dataset: string;
  file_name: string;
  exported_at: string;
  period?: string;
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
  members: UsageBreakdownRow[];
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
  | "project-members"
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
  | "identity-providers"
  | "settings";

const viewRoutes: Record<ViewKey, string> = {
  overview: "/overview",
  playground: "/playground",
  gateway: "/gateway",
  providers: "/providers",
  models: "/models",
  routes: "/routes",
  projects: "/projects",
  "project-members": "/project-members",
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
  "identity-providers": "/identity-providers",
  settings: "/settings",
};

const routeViews = Object.fromEntries(
  Object.entries(viewRoutes).map(([view, route]) => [route.replace(/^\//, ""), view]),
) as Record<string, ViewKey>;

const notificationChannelTypes = ["webhook", "feishu", "dingtalk", "wecom", "slack", "email"];

type NavLeafItem = {
  view: ViewKey;
  label: string;
  icon: typeof Activity;
};

type NavParentItem = {
  label: string;
  icon: typeof Activity;
  children: NavLeafItem[];
};

type NavItem = NavLeafItem | NavParentItem;

type AppRole = "admin" | "security" | "team_leader" | "user";

type FieldType = "text" | "number" | "password" | "textarea" | "select" | "multi-select" | "tags" | "boolean";

type FieldConfig = {
  key: string;
  label: string;
  type?: FieldType;
  options?: string[];
  optionsFromData?: (data: AppData, currentUser?: AdminUser | null) => Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
  help?: string;
  readOnlyOnEdit?: boolean;
  visible?: (values: Record<string, string>) => boolean;
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
  visible?: (item: T) => boolean;
  run?: (ctx: ApiContext, item: T) => Promise<void>;
  modal?: (item: T, data: AppData) => ModalState<any>;
  doneMessage?: (item: T) => string;
};

type ToolbarAction = {
  label: string;
  title?: string;
  kind?: "import-users";
  run?: (ctx: ApiContext, items?: unknown[]) => Promise<void>;
  doneMessage?: () => string;
};

type UserImportResult = {
  created?: number;
  updated?: number;
  skipped?: number;
  errors?: string[];
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

type SettingsTabKey = "settings" | "role-configs" | "identity-providers";

const defaultBaseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
const sessionStorageKey = "tokenhub.admin.session";
const authExpiredEventName = "tokenhub-admin-auth-expired";
const languageStorageKey = "tokenhub.admin.language";

type AppLanguage = "zh-CN" | "en" | "ja";

const languageOptions: Array<{ value: AppLanguage; label: string; nativeLabel: string }> = [
  { value: "zh-CN", label: "Chinese", nativeLabel: "简体中文" },
  { value: "en", label: "English", nativeLabel: "English" },
  { value: "ja", label: "Japanese", nativeLabel: "日本語" },
];

let activeLanguage: AppLanguage = "zh-CN";

const translations: Record<Exclude<AppLanguage, "zh-CN">, Record<string, string>> = {
  en: {
    "总览": "Overview",
    "网关概览": "Gateway Overview",
    "模型演练场": "Model Playground",
    "接口文档": "API Documentation",
    "AI 接入": "AI Access",
    "Provider 渠道": "Provider Channels",
    "模型目录": "Model Catalog",
    "路由策略": "Routing Policies",
    "企业治理": "Enterprise Governance",
    "项目空间": "Projects",
    "Key 管理": "Key Management",
    "团队分组": "Teams",
    "用户管理": "Users",
    "审批记录": "Approval Records",
    "成本审计": "Cost Audit",
    "用量统计": "Usage Analytics",
    "请求日志": "Request Logs",
    "成本账单": "Cost Billing",
    "成本中心": "Cost Centers",
    "导出报表": "Report Export",
    "健康与告警": "Health and Alerts",
    "健康检测": "Health Checks",
    "告警规则": "Alert Rules",
    "告警事件": "Alert Events",
    "通知渠道": "Notification Channels",
    "通知记录": "Notification Records",
    "安全运维": "Security Ops",
    "安全策略": "Security Policies",
    "代理出口": "Proxy Egress",
    "数据备份": "Data Backups",
    "公告通知": "Announcements",
    "系统设置": "System Settings",
    "新增系统设置": "Create System Setting",
    "网关地址、审计保留、企业集成和默认策略": "Gateway address, audit retention, enterprise integration, and default policies",
    "选择标准模型，按当前路由策略发起测试对话，验证 Provider、路由和返回内容。": "Test a standard model through the current routing policy and verify Provider, route, and response behavior.",
    "面向业务开发者的模型 API 调用说明、认证方式、示例代码和错误排查。": "Model API usage, authentication, examples, and troubleshooting for application developers.",
    "按模型、项目和日期查看请求量、Token 和成本归因。": "View requests, tokens, and cost attribution by model, project, and date.",
    "按 Provider 和项目归集估算成本，辅助成本分摊。": "Summarize estimated cost by Provider and project for cost allocation.",
    "查看最近请求日志、状态码、模型路由和延迟。": "Inspect recent request logs, status codes, model routes, and latency.",
    "查看运行时触发的额度、成本和 Provider 健康告警。": "Review quota, cost, and Provider health alerts triggered at runtime.",
    "查看告警 Webhook 发送结果、目标和失败原因。": "Review alert delivery results, targets, and failure reasons.",
    "处理 Key 发放、额度提升和模型开通等治理审批。": "Handle governance approvals such as key issuance, quota increases, and model access.",
    "登录控制台": "Login console",
    "企业 AI 访问与成本治理平台": "Enterprise AI Access and Cost Governance",
    "账号 / 邮箱": "Account / Email",
    "密码": "Password",
    "登录中": "Signing in",
    "TokenHub 控制台": "TokenHub Console",
    "展开菜单": "Expand menu",
    "折叠菜单": "Collapse menu",
    "退出登录": "Sign out",
    "界面语言": "Interface Language",
    "选择控制台显示语言，偏好会保存在当前浏览器。": "Choose the console display language. The preference is saved in this browser.",
    "当前语言": "Current language",
    "平台管理员": "Platform Admin",
    "默认项目空间": "Default Project Space",
    "平台工程团队": "Platform Engineering Team",
    "负责内部 AI Gateway 接入与平台治理": "Owns internal AI Gateway onboarding and platform governance.",
    "AI 平台成本中心": "AI Platform Cost Center",
    "平台工程与共享 AI 基础设施费用归属": "Cost attribution for platform engineering and shared AI infrastructure.",
    "网关基础设置": "Gateway Base Settings",
    "模型 API 对外地址、请求超时和审计保留周期": "Public model API address, request timeout, and audit retention period.",
    "OpenAI Compatible Gateway 默认配置": "Default OpenAI-compatible gateway configuration.",
    "产品流程": "Product Flow",
    "当前状态": "Current Status",
    "接入 Provider": "Connect Provider",
    "配置上游服务商、Base URL、API Key，并映射到标准模型目录。": "Configure upstream Providers, Base URLs, API keys, and map them to the standard model catalog.",
    "维护模型目录": "Maintain Model Catalog",
    "定义内部对外模型名、上下文窗口和计价口径。": "Define public internal model names, context windows, and pricing units.",
    "建立路由策略": "Create Routing Policies",
    "把对外模型映射到 Provider 的上游模型，并配置优先级与权重。": "Map public models to upstream Provider models and configure priority and weight.",
    "发放 API Key": "Issue API Key",
    "创建和维护当前权限范围内的内部调用凭证。": "Create and maintain internal calling credentials within the current permission scope.",
    "管理团队": "Manage Teams",
    "维护团队资料、负责人和费用归属。": "Maintain team profiles, owners, and cost attribution.",
    "管理成员": "Manage Members",
    "维护本团队成员账号和状态。": "Maintain team member accounts and status.",
    "查看用量": "View Usage",
    "查看当前权限范围内的请求量、Token 和成本。": "View requests, tokens, and cost within the current permission scope.",
    "我的用量概览": "My Usage Overview",
    "个人范围": "Personal scope",
    "可见项目": "Visible Projects",
    "条用量记录": "usage records",
    "按当前账号权限汇总": "Summarized by current account permissions",
    "查看账单": "View Billing",
    "查看当前权限范围内的成本归因。": "View cost attribution within the current permission scope.",
    "日志与治理": "Logs and Governance",
    "查看请求日志、后台操作、告警规则和安全策略。": "Review request logs, admin operations, alert rules, and security policies.",
    "个可选聊天模型": "callable chat models",
    "条启用路由": "active routes",
    "条启用公告": "active announcements",
    "管理公告": "Manage Announcements",
    "暂无公告说明": "No announcement description",
    "数量": "Count",
    "企业内部应用治理单元": "Internal application governance units",
    "内部调用凭证": "Internal calling credentials",
    "上游渠道实例，包含 Base URL 与 Key": "Upstream channel instances with Base URL and key",
    "对外模型目录": "Public model catalog",
    "对外模型到 Provider 的映射规则": "Mapping rules from public models to Providers",
    "治理事件": "Governance events",
    "当前权限范围内的用户账号": "User accounts within the current permission scope",
    "系统设置分类": "System settings category",
    "基础设置": "General Settings",
    "角色配置": "Role Settings",
    "身份源": "Identity Sources",
    "搜索名称、ID、状态": "Search name, ID, or status",
    "搜索模型": "Search models",
    "搜索模型、能力、参数": "Search models, capabilities, parameters",
    "新增": "Create",
    "新增模型": "Create Model",
    "新增 Provider": "Create Provider",
    "配置": "Configure",
    "配置路由": "Configure Routes",
    "编辑": "Edit",
    "删除": "Delete",
    "保存": "Save",
    "取消": "Cancel",
    "关闭": "Close",
    "操作": "Actions",
    "暂无数据": "No data",
    "请选择": "Select",
    "开启": "On",
    "关闭开关": "Off",
    "启用": "Enabled",
    "停用": "Disabled",
    "禁用": "Disable",
    "重新加载": "Reload",
    "全选": "Select all",
    "清空": "Clear",
    "请选择至少一个统一模型": "Select at least one unified model",
    "确认删除": "Confirm Delete",
    "操作已完成": "Operation completed",
    "操作失败": "Operation failed",
    "保存失败": "Save failed",
    "删除失败": "Delete failed",
    "导出失败": "Export failed",
    "连接失败": "Connection failed",
    "登录失败": "Login failed",
    "数据加载中，请稍后再操作。": "Data is loading. Please try again later.",
    "请先创建项目，再在项目下发放 API Key。": "Create a project before issuing an API key.",
    "请先新增 Provider 渠道，再配置路由策略。": "Create a Provider channel before configuring routing policies.",
    "请先维护模型目录，再新增路由策略。": "Maintain the model catalog before creating routing policies.",
    "新 Key 仅展示一次：": "New key is shown only once: ",
    "新 Key 已生成": "New Key Generated",
    "请现在复制并保存这个 Key。关闭弹窗后将无法再次查看完整 Key，只能通过轮换生成新的 Key。": "Copy and save this key now. After closing this dialog, the full key cannot be viewed again. You can only generate a new one by rotating it.",
    "完整 Key": "Full Key",
    "已复制": "Copied",
    "复制 Key": "Copy Key",
    "我已保存，关闭": "Saved, Close",
    "第": "Items",
    "条，共": "of",
    "每页": "Per page",
    "第一页": "First page",
    "上一页": "Previous page",
    "下一页": "Next page",
    "最后一页": "Last page",
    "名称": "Name",
    "说明": "Description",
    "状态": "Status",
    "更新时间": "Updated At",
    "类型": "Type",
    "协议": "Protocol",
    "端口": "Port",
    "优先级": "Priority",
    "权重": "Weight",
    "模型": "Model",
    "模型名": "Model",
    "项目": "Project",
    "团队": "Team",
    "成员": "Member",
    "用户": "User",
    "邮箱": "Email",
    "用户名": "Username",
    "角色": "Role",
    "最近登录": "Last Login",
    "负责人": "Owner",
    "请求": "Requests",
    "总请求": "Total Requests",
    "总 Token": "Total Tokens",
    "总成本": "Total Cost",
    "模型调用 Token": "Model call tokens",
    "等待调用数据": "Waiting for usage data",
    "输入 Token": "Input Tokens",
    "输出 Token": "Output Tokens",
    "错误请求": "Error Requests",
    "成本": "Cost",
    "估算成本": "Estimated Cost",
    "时间": "Time",
    "延迟": "Latency",
    "最终 Provider": "Final Provider",
    "Provider 资源": "Provider Resource",
    "上游模型": "Upstream Model",
    "客户端 IP": "Client IP",
    "输入": "Input",
    "输出": "Output",
    "总量": "Total",
    "上下文": "Context",
    "条线路": "routes",
    "未配置线路": "No routes configured",
    "官方资源": "Official resource",
    "可访问": "Accessible",
    "能力": "Capability",
    "最近路由": "Last Route",
    "待请求": "Not requested",
    "请求与响应": "Request and Response",
    "已记录快照": "Snapshot recorded",
    "未记录": "Not recorded",
    "动作": "Action",
    "操作人": "Actor",
    "对象": "Object",
    "对象 ID": "Object ID",
    "来源 IP": "Source IP",
    "成功": "Success",
    "失败": "Failed",
    "成功率": "Success Rate",
    "失败请求": "Failed Requests",
    "平均延迟": "Avg Latency",
    "请求列表": "Request List",
    "请求详情": "Request Details",
    "大模型请求历史": "Model Request History",
    "后台操作审计": "Admin Operation Audit",
    "日志类型": "Log Type",
    "请求状态筛选": "Request Status Filter",
    "搜索请求历史": "Search request history",
    "搜索请求 ID、模型、Provider、状态码": "Search request ID, model, Provider, or status code",
    "全部": "All",
    "所有模型": "All Models",
    "精选": "Featured",
    "文本": "Text",
    "图像": "Image",
    "视频": "Video",
    "音频": "Audio",
    "嵌入": "Embedding",
    "重排序": "Rerank",
    "三方资源": "Third-party",
    "模型大类": "Model Categories",
    "模型能力筛选": "Model Capability Filter",
    "通知渠道类型": "Notification Channel Type",
    "自动路由": "Auto Routing",
    "搜索模型名称或 ID": "Search model name or ID",
    "个模型": "models",
    "个匹配模型": "matching models",
    "没有匹配的模型": "No matching models",
    "模型路由器": "Model Router",
    "模型路由规则": "Model Routing Rules",
    "参考模型路由器思路，按平衡、质量优先或成本优先模式选择候选 Provider 线路，并在失败时自动回退。": "Choose candidate Provider routes by balanced, quality-first, or cost-first strategy, and automatically fail over in order.",
    "平衡模式综合权重、质量和成本；质量优先会先选高质量线路；成本优先会先选低成本线路。调用失败时会按候选顺序自动回退。": "Balanced mode combines weight, quality, and cost. Quality-first prefers higher-quality routes, cost-first prefers lower-cost routes, and failures fall back in candidate order.",
    "条启用线路": "active routes",
    "个已配置路由": "configured routes",
    "统一模型": "Unified Model",
    "已配置": "Configured",
    "全部模型": "All Models",
    "路由显示范围": "Route Display Scope",
    "搜索模型或 Provider": "Search model or Provider",
    "新增路由": "Create Route",
    "未配置": "Not configured",
    "按上到下顺序调用": "Called from top to bottom",
    "该统一模型还没有 Provider 线路": "This unified model has no Provider route yet",
    "拖动调整调用顺序": "Drag to adjust call order",
    "未配置 Base URL": "Base URL not configured",
    "没有匹配的模型路由": "No matching model routes",
    "主": "P",
    "路由": "Routes",
    "自定义": "Custom",
    "对外模型列表": "Public Model List",
    "维护内部应用调用的对外模型名，并查看每个模型可用的 Provider 线路。": "Maintain public model names for internal applications and view available Provider routes per model.",
    "Provider 列表": "Provider List",
    "Provider 是一个可调用的上游渠道实例，包含服务商类型、Base URL、API Key、健康状态和标准模型路由。": "A Provider is a callable upstream channel instance with provider type, Base URL, API key, health status, and standard model routes.",
    "路由线路": "Routes",
    "系统管理员": "System Admin",
    "安全审计": "Security Auditor",
    "团队 Leader": "Team Leader",
    "普通用户": "Regular User",
    "全局": "Global",
    "本人": "Self",
    "可分配": "Assignable",
    "是": "Yes",
    "否": "No",
    "角色标识": "Role Key",
    "显示名称": "Display Name",
    "数据范围": "Data Scope",
    "已吊销": "Revoked",
    "草稿": "Draft",
    "已归档": "Archived",
    "待处理": "Pending",
    "已批准": "Approved",
    "已驳回": "Rejected",
    "已确认": "Confirmed",
    "健康": "Healthy",
    "正常": "OK",
    "告警": "Warning",
    "降级": "Degraded",
    "异常": "Error",
    "不可用": "Down",
    "已过期": "Expired",
    "未知": "Unknown",
    "直连": "Direct",
    "静默": "Silent",
    "弹窗": "Popup",
    "手动": "Manual",
    "每日": "Daily",
    "每周": "Weekly",
    "每月": "Monthly",
    "超额拦截": "Block when exceeded",
    "仅告警": "Warn only",
    "飞书": "Feishu",
    "钉钉": "DingTalk",
    "企业微信": "WeCom",
    "邮件": "Email",
    "操作审计": "Operation Audit",
    "Key 发放": "Key Issuance",
    "预算变更": "Budget Change",
    "模型开通": "Model Access",
    "额度提升": "Quota Increase",
    "账单确认": "Billing Confirmation",
    "账单驳回": "Billing Rejection",
    "平衡": "Balanced",
    "质量优先": "Quality First",
    "成本优先": "Cost First",
    "优先级 + 权重": "Priority + Weight",
    "仅优先级": "Priority Only",
    "文本对话": "Chat",
    "向量嵌入": "Embedding",
    "模拟渠道": "Mock Provider",
    "OpenAI 官方": "OpenAI Official",
    "OpenAI 兼容": "OpenAI Compatible",
    "本地模型": "Local Model",
    "Provider 健康": "Provider Health",
    "资源实例健康": "Resource Health",
    "请求额度": "Request Quota",
    "Token 额度": "Token Quota",
    "成本额度": "Cost Quota",
    "错误率": "Error Rate",
    "日成本额度": "Daily Cost Quota",
    "日 Token 额度": "Daily Token Quota",
    "P95 延迟": "P95 Latency",
    "测试": "Test",
    "健康变更": "Health Change",
    "确认": "Confirm",
    "驳回": "Reject",
    "导出": "Export",
    "切换主题": "Toggle theme",
    "企业 AI 网关": "Enterprise AI Gateway",
    "统一接入与成本治理平台": "Unified access and cost governance platform",
    "显示密码": "Show password",
    "隐藏密码": "Hide password",
    "保持登录": "Keep me signed in",
    "忘记密码？": "Forgot password?",
    "或": "or",
    "使用企业 SSO 登录": "Sign in with Enterprise SSO",
    "做一个乐于助人的助手": "Be a helpful assistant",
    "你是企业内部 AI 助手。": "You are an internal enterprise AI assistant.",
    "用两句话介绍 TokenHub": "Introduce TokenHub in two sentences",
    "总结今天的工单重点": "Summarize today's key tickets",
    "TokenHub 企业知识库": "TokenHub enterprise knowledge base",
    "请用三句话介绍 TokenHub。": "Introduce TokenHub in three sentences.",
    "请先粘贴 CSV 内容。": "Paste CSV content first.",
    "用户导入失败": "User import failed",
    "搜索控制台": "Search console",
    "搜索模型、Provider、日志...": "Search models, providers, logs...",
    "报表时间范围": "Report time range",
    "7 天": "7 days",
    "30 天": "30 days",
    "本月": "This Month",
    "近 7 天": "Last 7 days",
    "近 30 天": "Last 30 days",
    "在线": "Online",
    "全部健康 · 延迟 312ms": "All healthy · 312ms latency",
    "API Key": "API Key",
    "已发放": "Issued",
    "成本与用量趋势": "Cost and Usage Trend",
    "趋势指标": "Trend Metric",
    "Provider 成本占比": "Provider Cost Share",
    "暂无 Provider 成本数据": "No Provider cost data",
    "Top 模型 · 调用量": "Top Models · Requests",
    "暂无模型调用数据": "No model request data",
    "OpenAI 兼容协议": "OpenAI-compatible protocol",
    "接口基础信息": "API Basics",
    "面向业务开发者的模型 API 调用说明。业务侧只使用 ": "Model API usage for business developers. Business apps only use ",
    " 和项目 API Key；": " and project API Keys; ",
    " 仅用于控制台管理。": " is only for console administration.",
    "当前权限下还没有可展示模型，请先确认模型目录和路由策略。": "No models are available under the current permissions. Check the model catalog and routing policies.",
    "当前后台还没有启用可用模型路由，请让管理员在路由策略里启用模型。": "No available model routes are enabled yet. Ask an administrator to enable models in routing policies.",
    "示例模型": "Sample Model",
    "当前配置": "Current Config",
    "启用路由": "Active Routes",
    "API 导航": "API Navigation",
    "按接口类型查看详细说明": "View details by API type",
    "开始": "Start",
    "模型 API": "Model API",
    "管理 API": "Admin API",
    "参考": "Reference",
    "快速接入": "Quick Start",
    "用一个项目 API Key 调用 TokenHub 的 OpenAI 兼容模型接口。": "Call TokenHub's OpenAI-compatible model API with a project API Key.",
    "鉴权方式": "Authentication",
    "业务应用只需要调用 /v1/*，不需要也不应该访问 /api/admin/*。": "Business applications only need /v1/* and should not access /api/admin/*.",
    "每个 API Key 都会受到项目状态、模型白名单、额度、并发和 Provider 路由策略约束。": "Every API Key is constrained by project status, model allowlist, quotas, concurrency, and Provider routing policies.",
    "排查失败请求时，优先复制响应里的 request_id 到请求日志查看完整链路。": "When troubleshooting failures, copy the response request_id to request logs first.",
    "查询可用模型": "List available models",
    "发起一次对话": "Start a chat",
    "认证与权限": "Authentication and Permissions",
    "业务 API 使用项目下发的 API Key；控制台登录令牌不能替代业务 Key。": "Business APIs use project API Keys; console login tokens cannot replace business keys.",
    "格式": "Format",
    "当前 Key 数": "Current Keys",
    "项目 API Key，格式为 Bearer thk_xxx": "Project API Key in Bearer thk_xxx format",
    "POST 必填": "Required for POST",
    "JSON 请求使用 application/json": "Use application/json for JSON requests",
    "模型接口必填": "Required for model APIs",
    "统一模型名，需在 Key 白名单和路由策略中可用": "Unified model name available in the Key allowlist and routing policy",
    "401 通常表示 Key 缺失、格式错误、已停用或已过期。": "401 usually means the Key is missing, malformed, disabled, or expired.",
    "403 通常表示项目状态、模型白名单或权限范围不允许当前调用。": "403 usually means project status, model allowlist, or permission scope blocks the call.",
    "模型列表": "Model List",
    "按当前 API Key 的权限返回可用统一模型。": "Return available unified models for the current API Key.",
    "请求示例": "Request Example",
    "字段": "Field",
    "必填": "Required",
    "统一模型名称，用于后续调用的 model 字段": "Unified model name used as the model field in later calls",
    "OpenAI 兼容对象类型，通常为 model": "OpenAI-compatible object type, usually model",
    "模型归属或 Provider 标识": "Model owner or Provider identifier",
    "对话补全": "Chat Completions",
    "兼容 OpenAI Chat Completions，用于普通对话、工具调用和流式输出。": "Compatible with OpenAI Chat Completions for chat, tool calling, and streaming.",
    "统一模型名，例如 ": "Unified model name, for example ",
    "system/user/assistant 消息数组": "system/user/assistant message array",
    "采样温度，默认由上游模型决定": "Sampling temperature; defaults to the upstream model",
    "true 时返回 SSE 流式响应": "Returns SSE streaming responses when true",
    "兼容新版 Responses 风格调用，适合统一文本输入和多模态能力扩展。": "Compatible with the newer Responses style, suitable for unified text input and multimodal extension.",
    "统一模型名": "Unified model name",
    "用户输入内容": "User input",
    "是否流式返回": "Whether to stream responses",
    "文本向量": "Text Embeddings",
    "转发文本向量生成请求，并记录 Token 与成本归因。": "Forward text embedding requests and record token and cost attribution.",
    "向量统一模型名": "Unified embedding model name",
    "需要向量化的文本": "Text to embed",
    "可选 float/base64，取决于上游模型支持": "Optional float/base64 depending on upstream support",
    "当前可调用模型": "Currently Callable Models",
    "根据模型目录和路由策略汇总当前控制台可见模型。": "Summarize models visible to this console from the catalog and routing policy.",
    "控制台登录": "Console Login",
    "控制台用户登录接口，不等同于模型 API Key。": "Console user login API; not equivalent to a model API Key.",
    "用户名或邮箱": "Username or email",
    "控制台密码": "Console password",
    "管理 API 仅用于控制台和受信任后台程序，不应该暴露给业务应用前端。": "Admin APIs are only for the console and trusted backends and should not be exposed to business frontends.",
    "Provider 配置": "Provider Config",
    "管理上游 Provider、Base URL、凭证和健康状态。": "Manage upstream Providers, Base URLs, credentials, and health status.",
    "读取 Provider 列表": "Read Provider list",
    "新增 Provider 配置": "Create Provider config",
    "更新 Provider 凭证、状态和元信息": "Update Provider credentials, status, and metadata",
    "维护统一模型到 Provider 资源的优先级、权重和状态。": "Maintain priorities, weights, and status from unified models to Provider resources.",
    "当前路由": "Current Routes",
    "按权限查看模型调用日志、命中路由、耗时、Token 和错误信息。": "View model call logs, matched routes, latency, tokens, and errors by permission.",
    "日志样本": "Log Samples",
    "用途": "Purpose",
    "排查 request_id 和上游响应": "Troubleshoot request_id and upstream responses",
    "常见错误": "Common Errors",
    "按状态码定位 API Key、模型白名单、路由和额度问题。": "Locate API Key, model allowlist, route, and quota issues by status code.",
    "状态码": "Status",
    "错误码": "Error Code",
    "处理方式": "How to Handle",
    "检查 Authorization 是否使用 TokenHub API Key": "Check whether Authorization uses a TokenHub API Key",
    "检查 Key 的模型白名单和项目状态": "Check the Key model allowlist and project status",
    "为统一模型配置启用路由": "Configure an active route for the unified model",
    "检查项目额度、并发和 Provider 资源限制": "Check project quotas, concurrency, and Provider resource limits",
    "在请求日志里查看上游响应和 request_id": "Check upstream responses and request_id in request logs",
    "SDK 示例": "SDK Examples",
    "使用 OpenAI 兼容 SDK 接入 TokenHub。": "Use OpenAI-compatible SDKs to integrate with TokenHub.",
    "调用链路": "Call Flow",
    "从鉴权到 Provider 路由的完整治理链路。": "Full governance flow from authentication to Provider routing.",
    "阶段": "Stage",
    "当前数据": "Current Data",
    "认证": "Authentication",
    "权限": "Permissions",
    "模型白名单 + 项目状态": "Model allowlist + project status",
    "上游渠道实例、凭证和健康状态": "Upstream channel instances, credentials, and health",
    "对外模型到 Provider 的优先级/权重映射": "Priority/weight mapping from public models to Providers",
    "额度、审计、成本统计": "Quota, audit, and cost analytics",
    "请求参数": "Request Parameters",
    "明细": "Details",
    "示例": "Examples",
    "复制": "Copy",
    "复制代码": "Copy code",
    "企业 AI 用量看板": "Enterprise AI Usage Dashboard",
    "面向管理层的部门、个人与 Token 消耗对比": "Department, individual, and token comparisons for leadership",
    "按部门": "By Department",
    "Token 口径": "Token basis",
    "Token 消耗": "Token Usage",
    "总 Token 消耗": "Total Token Usage",
    "覆盖部门": "Covered Departments",
    "活跃成员": "Active Members",
    "统计时间": "Generated",
    "最高": "Top",
    "暂无部门归因": "No department attribution",
    "次请求": "requests",
    "部门 Token 消耗对比": "Department Token Comparison",
    "输入 Token 与输出 Token 分段展示，按总量排序": "Input and output tokens segmented and sorted by total",
    "部门排行": "Department Ranking",
    "个人排行": "Individual Ranking",
    "公司内部成员 Token 消耗 Top 20": "Top 20 internal members by token usage",
    "按 Token 降序": "Sorted by token descending",
    "可用于复盘配额": "Useful for quota review",
    "暂无部门 Token 数据": "No department token data",
    "暂无部门排行数据": "No department ranking data",
    "暂无个人排行数据": "No individual ranking data",
    "排名": "Rank",
    "部门": "Department",
    "占比": "Share",
    "未归属部门": "Unassigned Department",
    "团队用户": "Team Users",
    "关闭成员列表": "Close member list",
    "姓名": "Name",
    "成员数": "Members",
    "项目额度": "Project Quota",
    "关闭额度配置": "Close quota settings",
    "已配置项目专属额度": "Project-specific quota configured",
    "未配置项目专属额度": "No project-specific quota configured",
    "留空或填 0 表示该项不限额；Key 自身额度仍会叠加生效。": "Leave blank or 0 for unlimited; Key-level quotas still apply.",
    "已有额度提升申请待审批": "Quota increase request is pending approval",
    "最近触发了项目额度限制": "Project quota limit was recently triggered",
    "可在审批记录中处理。": "Handle it in approval records.",
    "次额度不足，请填写希望提升后的目标额度再提交审批。": "quota hits. Enter the target quota and submit for approval.",
    "待审批": "Pending approval",
    "需提升": "Increase needed",
    "日请求": "Daily Requests",
    "月请求": "Monthly Requests",
    "日 Token": "Daily Tokens",
    "月 Token": "Monthly Tokens",
    "日成本": "Daily Cost",
    "月成本": "Monthly Cost",
    "最大并发": "Max Concurrency",
    "提升额度申请": "Request Quota Increase",
    "提交项目额度提升审批": "Submit project quota increase approval",
    "保存额度": "Save Quota",
    "按需导出": "On-demand Export",
    "最近导出": "Recent Exports",
    "自动导出配置": "Scheduled Export Config",
    "新增配置": "Create Config",
    "数据集": "Dataset",
    "文件": "File",
    "账期": "Period",
    "导出 ": "Export ",
    "模型分类": "Model Categories",
    "Key 归属逻辑": "Key Ownership Logic",
    "内部应用配置项目下发放的 Key；额度、模型白名单、用量和成本都会归属到该项目。": "Keys are issued under internal application projects; quotas, model allowlists, usage, and costs are attributed to that project.",
    "个项目": "projects",
    "个 Key": "Keys",
    "批量导入": "Bulk Import",
    "CSV 内容": "CSV Content",
    "按 username 或 email 匹配已有用户；匹配到则更新，未匹配则创建。": "Match existing users by username or email; matched users are updated and unmatched users are created.",
    "字段顺序": "Field Order",
    "role 可填 admin、team_leader、user；status 可填 active 或 disabled。": "role supports admin, team_leader, user; status supports active or disabled.",
    "导入中": "Importing",
    "开始导入": "Start Import",
    "模型配置": "Model Config",
    "暂无聊天模型": "No chat models",
    "条路由": "routes",
    "未配置路由": "No route configured",
    "响应格式": "Response Format",
    "系统提示": "System Prompt",
    "函数": "Functions",
    "函数调用配置待接入": "Function calling config is not connected yet",
    "添加函数": "Add Function",
    "模型演练对话": "Model playground chat",
    "复制模型名": "Copy model name",
    "选择模型": "Select Model",
    "模型详情": "Model Details",
    "查看代码": "View Code",
    "清空历史": "Clear History",
    "默认资源": "Default Resource",
    "次尝试": "attempts",
    "当前模型": "Current Model",
    "试用": "Try",
    "当前还没有配置模型路由。": "No model routes are configured yet.",
    "体验一下，看看模型在 TokenHub 网关上的表现": "Try it and see how the model performs through TokenHub",
    "说点什么...": "Say something...",
    "文件上传待接入": "File upload is not connected yet",
    "上传文件": "Upload File",
    "发送": "Send",
    "API 使用": "API Usage",
    "使用以下代码示例集成 TokenHub 模型接口": "Use these code examples to integrate TokenHub model APIs",
    "API 调用语言": "API Language",
    "未选择模型": "No model selected",
    "模型没有返回可展示内容。": "The model did not return displayable content.",
    "演练请求失败": "Playground request failed",
    "Provider 模板加载失败": "Provider template failed to load",
    "Provider 已": "Provider ",
    "更新": "updated",
    "创建": "created",
    "模型类型": "Model Type",
    "类": "categories",
    "渠道商": "Provider",
    "个标准模型": "standard models",
    "自定义渠道商": "Custom Provider",
    "搜索渠道商、ID、类型": "Search providers, IDs, or types",
    "没有匹配的渠道商": "No matching providers",
    "使用自定义渠道商": "Use custom Provider",
    "请选择渠道商": "Select Provider",
    "例如 prv_company_proxy": "e.g. prv_company_proxy",
    "留空自动生成": "Leave blank to auto-generate",
    "渠道名称": "Channel Name",
    "渠道商类型": "Provider Type",
    "编辑时留空则不修改已保存密钥。": "Leave blank while editing to keep the saved secret.",
    "留空表示不修改现有 Key；填写新值才会覆盖。": "Leave blank to keep the existing Key; enter a new value to overwrite it.",
    "开启后会为下方勾选模型补齐缺失线路，不覆盖已有策略。": "When enabled, missing routes will be added for selected models without overwriting existing policies.",
    "保存渠道时会自动创建下方勾选模型的默认路由。": "Saving the Provider will create default routes for selected models.",
    "上游模型映射": "Upstream Model Mapping",
    "个可映射模型": "mappable models",
    "加载中": "Loading",
    "正在加载模型列表...": "Loading model list...",
    "该渠道商暂无可匹配当前标准模型目录的上游模型": "This Provider has no upstream models matching the current standard catalog",
    "已有路由": "Existing route",
    "已关闭自动路由：保存后只创建 Provider，不生成路由策略。": "Auto routing is off: saving creates only the Provider and no routing policy.",
    "当前没有勾选模型，保存后不会生成路由策略。": "No models are selected, so saving will not generate routing policies.",
    "保存后会为": "After saving, routes will be created for",
    "个已选": "selected",
    "模型创建缺失的默认路由。": "models with missing default routes.",
    "请求详情加载失败": "Request details failed to load",
    "全部 ": "All ",
    "成功 ": "Success ",
    "失败 ": "Failed ",
    "没有匹配的请求记录": "No matching request records",
    "暂无大模型请求记录": "No model request records",
    "正在加载请求详情...": "Loading request details...",
    "请选择一条请求": "Select a request",
    "复制请求 ID": "Copy request ID",
    "Token 与成本": "Tokens and Cost",
    "条记录": "records",
    "暂无记录": "No records",
    "路由尝试": "Route Attempts",
    "次，含 fallback": "attempts, with fallback",
    "没有记录到路由尝试": "No route attempts recorded",
    "这条历史记录没有保存 request / response 快照": "This history record has no saved request / response snapshot",
    "未记录请求内容": "Request content not recorded",
    "未记录响应内容": "Response content not recorded",
    "已截断": "Truncated",
    "上游模型 ": "Upstream model ",
    "资源 ": "Resource ",
    "路由 ": "Route ",
    "资源": "Resource",
    "大小": "Size",
    "触发方式": "Trigger",
    "创建时间": "Created At",
    "最近恢复": "Last Restored",
    "校验": "Checksum",
    "保留天数": "Retention Days",
    "0 表示不过期": "0 means never expire",
    "下载": "Download",
    "恢复": "Restore",
    "备份文件已开始下载": "Backup download has started",
    "已恢复备份": "Backup restored",
    "后台用户列表": "Admin User List",
    "新增用户": "Create User",
    "编辑时留空则不修改": "Leave blank while editing to keep unchanged",
    "导入用户": "Import Users",
    "从已有系统导出的 CSV 批量导入或更新用户": "Bulk import or update users from a CSV exported by an existing system",
    "指标": "Metric",
    "阈值": "Threshold",
    "级别": "Severity",
    "对象范围": "Scope",
    "规则列表": "Rule List",
    "触发事件": "Trigger Events",
    "来源": "Source",
    "系统默认": "System Default",
    "事件": "Event",
    "告警 ID": "Alert ID",
    "渠道": "Channel",
    "HTTP": "HTTP",
    "失败原因": "Failure Reason",
    "审批申请列表": "Approval Request List",
    "触发条件": "Trigger",
    "申请人": "Requester",
    "处理人": "Handler",
    "内容": "Content",
    "批准": "Approve",
    "批准并执行该申请": "Approve and execute this request",
    "驳回该申请": "Reject this request",
    "成本中心编码": "Cost Center Code",
    "编码": "Code",
    "月预算 USD": "Monthly Budget USD",
    "月预算": "Monthly Budget",
    "部门分摊": "Department Chargeback",
    "分摊成本 USD": "Allocated Cost USD",
    "请求数": "Requests",
    "分摊规则": "Allocation Rule",
    "分摊成本": "Allocated Cost",
    "审批流": "Approval Flow",
    "审批角色": "Approver Role",
    "金额阈值 USD": "Amount Threshold USD",
    "SLA 小时": "SLA Hours",
    "金额阈值": "Amount Threshold",
    "频率": "Frequency",
    "接收人": "Recipients",
    "导出 CSV 报表": "Export CSV report",
    "内部账单": "Internal Invoice",
    "金额 USD": "Amount USD",
    "发票备注": "Invoice Note",
    "确认人": "Confirmed By",
    "确认时间": "Confirmed At",
    "驳回原因": "Reject Reason",
    "金额": "Amount",
    "生成本月": "Generate This Month",
    "按当前账期生成分摊和内部账单": "Generate chargebacks and internal invoices for the current period",
    "输入账期 YYYY-MM，留空则导出全部": "Enter period YYYY-MM, leave blank to export all",
    "输入账期 YYYY-MM，留空则生成本月": "Enter period YYYY-MM, leave blank to generate this month",
    "请输入驳回原因": "Enter rejection reason",
    "已生成分摊和内部账单": "Chargebacks and internal invoices generated",
    "已提交审批：": "Approval submitted: ",
    "请选择项目空间后再发放 API Key": "Select a project before issuing an API Key",
    "发放 Key 失败": "Failed to issue Key",
    "请先填写至少一项希望提升后的目标额度": "Enter at least one target quota to increase",
    "不限额": "Unlimited",
    "项目空间内配置的专属模型调用额度": "Project-specific model call quota",
    "该记录": "this record",
    "通知模式": "Notification Mode",
    "目标对象": "Target Object",
    "脱敏 Prompt": "Mask Prompt",
    "错误透传": "Error Passthrough",
    "每行一个 CIDR 或 IP，留空表示不配置白名单。": "One CIDR or IP per line. Leave blank for no allowlist.",
    "开启后策略要求请求与响应审计避免直接展示完整 Prompt。": "When enabled, request and response audit should avoid showing full prompts directly.",
    "通用 Webhook 告警通知": "Generic Webhook alert notification",
    "飞书机器人告警通知": "Feishu bot alert notification",
    "钉钉机器人告警通知": "DingTalk bot alert notification",
    "企业微信机器人告警通知": "WeCom bot alert notification",
    "Slack Incoming Webhook 告警通知": "Slack Incoming Webhook alert notification",
    "SMTP 邮件告警通知": "SMTP email alert notification",
    "告警通知渠道": "Alert notification channel",
    "SMTP 已配置": "SMTP configured",
    "SMTP 未配置": "SMTP not configured",
    "通知渠道列表": "Notification Channel List",
    "新增通知渠道": "Create Notification Channel",
    "渠道类型": "Channel Type",
    "签名密钥": "Signing Secret",
    "可选预留。当前按普通机器人 Webhook 发送，留空不影响通知。": "Optional reserved field. Notifications are sent by normal bot Webhook; leaving it blank is fine.",
    "SMTP 端口": "SMTP Port",
    "SMTP 用户名": "SMTP Username",
    "SMTP 密码": "SMTP Password",
    "收件人": "Recipients",
    "多个邮箱用逗号分隔。": "Separate multiple emails with commas.",
    "地址/目标": "Address / Target",
    "凭证": "Credential",
    "告警类型": "Alert Type",
    "监控名称": "Monitor Name",
    "监控类型": "Monitor Type",
    "检查间隔": "Check Interval",
    "最近检查": "Last Check",
    "环境": "Environment",
    "区域": "Region",
    "资源类型": "Resource Type",
    "资源分组": "Resource Group",
    "失败次数": "Failures",
    "冷却至": "Cooldown Until",
    "速率限制 RPM": "Rate Limit RPM",
    "Token 限制 TPM": "Token Limit TPM",
    "质量分": "Quality Score",
    "成本分": "Cost Score",
    "粘性": "Sticky",
    "不限": "Unlimited",
    "系统提示词": "System Prompt",
    "支持参数": "Supported Parameters",
    "输入模态": "Input Modalities",
    "输出模态": "Output Modalities",
    "计费输入": "Input Price",
    "计费输出": "Output Price",
    "Embedding 计费": "Embedding Price",
    "模型家族": "Model Family",
    "上下文窗口": "Context Window",
    "公开 Base URL": "Public Base URL",
    "默认超时": "Default Timeout",
    "审计保留": "Audit Retention",
    "用户名字段": "Username Claim",
    "邮箱字段": "Email Claim",
    "团队字段": "Team Claim",
    "新增身份源": "Create Identity Source",
    "新增可选角色": "Create Assignable Role",
    "配置用户管理新增/编辑时可选择的后台角色。权限边界由系统内置角色模型控制。": "Configure roles available when creating or editing users. Permission boundaries are controlled by built-in role models.",
    "Embedding 价 USD/1M": "Embedding Price USD/1M",
    "IP 白名单": "IP Allowlist",
    "IP 白名单，逗号分隔": "IP Allowlist, comma-separated",
    "Key 名称": "Key Name",
    "Key 必须挂在已有项目下，用于该项目的内部应用调用网关。": "Keys must be attached to an existing project for that project's internal applications to call the gateway.",
    "SQLite 备份": "SQLite Backups",
    "上游模型/部署名": "Upstream Model / Deployment",
    "下载 SQLite 备份文件": "Download SQLite backup file",
    "为该 Provider 新增模型路由": "Create model route for this Provider",
    "为该对外模型新增 Provider 线路": "Create Provider route for this public model",
    "为该项目创建内部 API Key": "Create an internal API Key for this project",
    "从用户管理中选择团队负责人，用于审批和审计归属。": "Select a team owner from user management for approvals and audit attribution.",
    "作用域": "Scope",
    "作用域 ID": "Scope ID",
    "保存项目额度": "Save project quota",
    "内部 Key 列表": "Internal Key List",
    "创建、下载和恢复 TokenHub SQLite 数据库快照。": "Create, download, and restore TokenHub SQLite database snapshots.",
    "创建备份": "Create Backup",
    "发件人": "Sender",
    "发放 Key": "Issue Key",
    "可用供应商": "Available Providers",
    "后台操作、变更对象、操作人和时间": "Admin operations, changed objects, actors, and time",
    "告警事件列表": "Alert Event List",
    "告警通知的渠道、目标和发送结果": "Alert notification channel, target, and delivery result",
    "团队 ID": "Team ID",
    "团队名称": "Team Name",
    "处理 Key 发放、额度提升和模型开通审批。": "Handle approvals for Key issuance, quota increases, and model access.",
    "多个收件人用英文逗号分隔。": "Separate multiple recipients with commas.",
    "对外模型": "Public Model",
    "将数据库恢复到该备份": "Restore the database to this backup",
    "并发": "Concurrency",
    "归属项目": "Project",
    "成本中心、负责人和部门归属配置": "Cost center, owner, and department attribution config",
    "成本优先模式会优先选择该评分更高的线路，分数越高代表越省。": "Cost-first mode prefers routes with higher scores; higher means cheaper.",
    "成本评分 1-100": "Cost Score 1-100",
    "批量创建时留空，会为每个统一模型使用同名上游模型。": "Leave blank during bulk creation to use the same upstream model name for each unified model.",
    "按模型、项目和日期归集 Token 与成本": "Aggregate tokens and costs by model, project, and date",
    "按项目发放内部 API Key，限制模型白名单、额度、并发和有效期。": "Issue internal API Keys by project and limit model allowlists, quotas, concurrency, and validity.",
    "支持参数，逗号分隔": "Supported parameters, comma-separated",
    "数字越小越先调用；新增时留空会自动排在该统一模型已有 Provider 后面。": "Lower numbers are called first; leave blank when creating to place it after existing Providers for the unified model.",
    "新增路由时可多选模型；编辑已有路由时仍按单条规则调整。": "Select multiple models when creating routes; editing still adjusts a single rule.",
    "新增项目": "Create Project",
    "日成本 USD": "Daily Cost USD",
    "最近命中": "Last Hit",
    "最近检测": "Last Check",
    "最近消息": "Latest Message",
    "最近状态": "Latest Status",
    "月成本 USD": "Monthly Cost USD",
    "查看告警通知的发送状态、目标和失败原因。": "View alert notification delivery status, target, and failure reason.",
    "检测 Provider 可用性": "Check Provider availability",
    "模型白名单，逗号分隔": "Model allowlist, comma-separated",
    "渠道配置": "Channel Config",
    "生成新 Key，并立即吊销旧 Key": "Generate a new Key and revoke the old Key immediately",
    "用途/环境": "Purpose / Environment",
    "留空则沿用统一模型名": "Leave blank to use the unified model name",
    "留空自动追加": "Leave blank to append automatically",
    "留空表示不限制 Key 级模型白名单；实际可调用模型仍受模型目录和路由策略约束。": "Leave blank for no Key-level model allowlist; callable models are still constrained by the model catalog and routing policy.",
    "留空表示不限来源 IP。": "Leave blank to allow any source IP.",
    "目录计价": "Catalog Pricing",
    "目标": "Target",
    "目标类型": "Target Type",
    "确认该内部账单": "Confirm this internal invoice",
    "立即执行该健康检测": "Run this health check now",
    "立即检测": "Run Check",
    "策略": "Strategy",
    "管理 TokenHub 后台登录账号、角色权限、归属团队和账号状态。": "Manage TokenHub console accounts, roles, team attribution, and account status.",
    "粘性会话": "Sticky Session",
    "系列": "Family",
    "编辑时留空表示不修改。": "Leave blank while editing to keep unchanged.",
    "编辑时留空表示不修改现有 Key；只有填写新值才会覆盖。": "Leave blank while editing to keep the existing Key; only a new value overwrites it.",
    "能力标签，逗号分隔": "Capability tags, comma-separated",
    "评分": "Score",
    "请求 ID、模型、状态码、Provider 路由和延迟": "Request ID, model, status code, Provider route, and latency",
    "调度策略": "Scheduling Strategy",
    "负责人用户 ID": "Owner User ID",
    "质量优先模式会优先选择该评分更高的线路。": "Quality-first mode prefers routes with higher scores.",
    "质量评分 1-100": "Quality Score 1-100",
    "费用归集口径，可与团队不同；用于成本归集和用量统计。": "Cost attribution dimension; it may differ from the team and is used for cost and usage analytics.",
    "模型用量": "Model Usage",
    "成员用量": "Member Usage",
    "项目归因": "Project Attribution",
    "成员成本": "Member Cost",
    "Provider 成本": "Provider Cost",
    "Provider 明细成本": "Provider Detail Cost",
    "命中 Provider": "Matched Provider",
    "资源实例": "Resource Instance",
    "资源实例 ID": "Resource Instance ID",
    "路由数": "Routes",
    "轮换": "Rotate",
    "输入价 USD/1M": "Input Price USD/1M",
    "输出价 USD/1M": "Output Price USD/1M",
    "运行时触发的额度、成本和 Provider 健康事件。": "Quota, cost, and Provider health events triggered at runtime.",
    "通知发送记录": "Notification Delivery Records",
    "通过默认通知渠道发送该告警": "Send this alert through the default notification channel",
    "配置通知渠道": "Configure Notification Channel",
    "间隔秒数": "Interval Seconds",
    "项目 ID": "Project ID",
    "项目列表": "Project List",
    "项目名称": "Project Name",
    "项目是企业内部 AI 使用、Key、额度和成本归属的基本单元。": "Projects are the basic unit for internal AI usage, Keys, quotas, and cost attribution.",
    "额度": "Quota",
    "额度提升、Key 发放和模型开通审批记录": "Quota increase, Key issuance, and model access approval records",
    "驳回该内部账单": "Reject this internal invoice",
    "默认检测项": "Default Checks",
    "更新路由顺序失败": "Failed to update route order",
    "点击停用 API Key": "Click to disable API Key",
    "点击启用 API Key": "Click to enable API Key",
    },
  ja: {
    "总览": "概要",
    "网关概览": "ゲートウェイ概要",
    "模型演练场": "モデルプレイグラウンド",
    "接口文档": "API ドキュメント",
    "AI 接入": "AI 接続",
    "Provider 渠道": "Provider チャネル",
    "模型目录": "モデルカタログ",
    "路由策略": "ルーティングポリシー",
    "企业治理": "企業ガバナンス",
    "项目空间": "プロジェクト",
    "Key 管理": "Key 管理",
    "团队分组": "チーム",
    "用户管理": "ユーザー管理",
    "审批记录": "承認記録",
    "成本审计": "コスト監査",
    "用量统计": "利用統計",
    "请求日志": "リクエストログ",
    "成本账单": "コスト請求",
    "成本中心": "コストセンター",
    "导出报表": "レポート出力",
    "健康与告警": "ヘルスとアラート",
    "健康检测": "ヘルスチェック",
    "告警规则": "アラートルール",
    "告警事件": "アラートイベント",
    "通知渠道": "通知チャネル",
    "通知记录": "通知記録",
    "安全运维": "セキュリティ運用",
    "安全策略": "セキュリティポリシー",
    "代理出口": "プロキシ出口",
    "数据备份": "データバックアップ",
    "公告通知": "お知らせ",
    "系统设置": "システム設定",
    "新增系统设置": "システム設定を作成",
    "网关地址、审计保留、企业集成和默认策略": "ゲートウェイアドレス、監査保持、企業連携、デフォルトポリシー",
    "选择标准模型，按当前路由策略发起测试对话，验证 Provider、路由和返回内容。": "標準モデルを選択し、現在のルーティングでテスト会話を実行します。",
    "面向业务开发者的模型 API 调用说明、认证方式、示例代码和错误排查。": "開発者向けのモデル API、認証、サンプル、トラブルシュートです。",
    "按模型、项目和日期查看请求量、Token 和成本归因。": "モデル、プロジェクト、日付別にリクエスト、Token、コストを確認します。",
    "按 Provider 和项目归集估算成本，辅助成本分摊。": "Provider とプロジェクト別に推定コストを集計します。",
    "查看最近请求日志、状态码、模型路由和延迟。": "最近のリクエストログ、ステータス、モデルルート、レイテンシを確認します。",
    "查看运行时触发的额度、成本和 Provider 健康告警。": "実行時に発生したクォータ、コスト、Provider ヘルスのアラートを確認します。",
    "查看告警 Webhook 发送结果、目标和失败原因。": "アラート通知の送信結果、宛先、失敗理由を確認します。",
    "处理 Key 发放、额度提升和模型开通等治理审批。": "Key 発行、クォータ増額、モデル開通などの承認を処理します。",
    "登录控制台": "ログインコンソール",
    "企业 AI 访问与成本治理平台": "企業向け AI アクセス・コストガバナンス",
    "账号 / 邮箱": "アカウント / メール",
    "密码": "パスワード",
    "登录中": "ログイン中",
    "TokenHub 控制台": "TokenHub コンソール",
    "展开菜单": "メニューを展開",
    "折叠菜单": "メニューを折りたたむ",
    "退出登录": "ログアウト",
    "界面语言": "表示言語",
    "选择控制台显示语言，偏好会保存在当前浏览器。": "コンソールの表示言語を選択します。設定はこのブラウザに保存されます。",
    "当前语言": "現在の言語",
    "平台管理员": "プラットフォーム管理者",
    "默认项目空间": "デフォルトプロジェクトスペース",
    "平台工程团队": "プラットフォームエンジニアリングチーム",
    "负责内部 AI Gateway 接入与平台治理": "内部 AI Gateway のオンボーディングとプラットフォームガバナンスを担当します。",
    "AI 平台成本中心": "AI プラットフォームコストセンター",
    "平台工程与共享 AI 基础设施费用归属": "プラットフォームエンジニアリングと共有 AI インフラのコスト帰属です。",
    "网关基础设置": "ゲートウェイ基本設定",
    "模型 API 对外地址、请求超时和审计保留周期": "公開モデル API アドレス、リクエストタイムアウト、監査保持期間です。",
    "OpenAI Compatible Gateway 默认配置": "OpenAI 互換ゲートウェイのデフォルト設定です。",
    "产品流程": "プロダクトフロー",
    "当前状态": "現在の状態",
    "接入 Provider": "Provider 接続",
    "配置上游服务商、Base URL、API Key，并映射到标准模型目录。": "上流 Provider、Base URL、API Key を設定し、標準モデルカタログへマッピングします。",
    "维护模型目录": "モデルカタログ管理",
    "定义内部对外模型名、上下文窗口和计价口径。": "社内向け公開モデル名、コンテキスト長、課金単位を定義します。",
    "建立路由策略": "ルーティングポリシー作成",
    "把对外模型映射到 Provider 的上游模型，并配置优先级与权重。": "公開モデルを Provider の上流モデルへマッピングし、優先度と重みを設定します。",
    "发放 API Key": "API Key 発行",
    "创建和维护当前权限范围内的内部调用凭证。": "現在の権限範囲内で内部呼び出し用の認証情報を作成・管理します。",
    "管理团队": "チーム管理",
    "维护团队资料、负责人和费用归属。": "チーム情報、責任者、コスト帰属を管理します。",
    "管理成员": "メンバー管理",
    "维护本团队成员账号和状态。": "チームメンバーのアカウントと状態を管理します。",
    "查看用量": "利用量確認",
    "查看当前权限范围内的请求量、Token 和成本。": "現在の権限範囲内のリクエスト、Token、コストを確認します。",
    "我的用量概览": "自分の利用概要",
    "个人范围": "個人範囲",
    "可见项目": "表示可能なプロジェクト",
    "条用量记录": "件の利用記録",
    "按当前账号权限汇总": "現在のアカウント権限で集計",
    "查看账单": "請求確認",
    "查看当前权限范围内的成本归因。": "現在の権限範囲内のコスト帰属を確認します。",
    "日志与治理": "ログとガバナンス",
    "查看请求日志、后台操作、告警规则和安全策略。": "リクエストログ、管理操作、アラートルール、セキュリティポリシーを確認します。",
    "个可选聊天模型": "件の利用可能なチャットモデル",
    "条启用路由": "件の有効ルート",
    "条启用公告": "件の有効なお知らせ",
    "管理公告": "お知らせ管理",
    "暂无公告说明": "お知らせ説明なし",
    "数量": "数",
    "企业内部应用治理单元": "社内アプリケーションのガバナンス単位",
    "内部调用凭证": "内部呼び出し用認証情報",
    "上游渠道实例，包含 Base URL 与 Key": "Base URL と Key を含む上流チャネルインスタンス",
    "对外模型目录": "公開モデルカタログ",
    "对外模型到 Provider 的映射规则": "公開モデルから Provider へのマッピングルール",
    "治理事件": "ガバナンスイベント",
    "当前权限范围内的用户账号": "現在の権限範囲内のユーザーアカウント",
    "系统设置分类": "システム設定カテゴリ",
    "基础设置": "基本設定",
    "角色配置": "ロール設定",
    "身份源": "ID ソース",
    "搜索名称、ID、状态": "名前、ID、状態を検索",
    "搜索模型": "モデルを検索",
    "搜索模型、能力、参数": "モデル、機能、パラメータを検索",
    "新增": "作成",
    "新增模型": "モデル作成",
    "新增 Provider": "Provider 作成",
    "配置": "設定",
    "配置路由": "ルート設定",
    "编辑": "編集",
    "删除": "削除",
    "保存": "保存",
    "取消": "キャンセル",
    "关闭": "閉じる",
    "操作": "操作",
    "暂无数据": "データがありません",
    "请选择": "選択してください",
    "开启": "オン",
    "关闭开关": "オフ",
    "启用": "有効",
    "停用": "無効",
    "禁用": "無効化",
    "重新加载": "再読み込み",
    "全选": "すべて選択",
    "清空": "クリア",
    "请选择至少一个统一模型": "少なくとも 1 つの統一モデルを選択してください",
    "确认删除": "削除の確認",
    "操作已完成": "操作が完了しました",
    "操作失败": "操作に失敗しました",
    "保存失败": "保存に失敗しました",
    "删除失败": "削除に失敗しました",
    "导出失败": "エクスポートに失敗しました",
    "连接失败": "接続に失敗しました",
    "登录失败": "ログインに失敗しました",
    "数据加载中，请稍后再操作。": "データ読み込み中です。しばらくしてから操作してください。",
    "请先创建项目，再在项目下发放 API Key。": "先にプロジェクトを作成してから API Key を発行してください。",
    "请先新增 Provider 渠道，再配置路由策略。": "先に Provider チャネルを作成してからルートを設定してください。",
    "请先维护模型目录，再新增路由策略。": "先にモデルカタログを整備してからルートを作成してください。",
    "新 Key 仅展示一次：": "新しい Key は一度だけ表示されます: ",
    "新 Key 已生成": "新しい Key を生成しました",
    "请现在复制并保存这个 Key。关闭弹窗后将无法再次查看完整 Key，只能通过轮换生成新的 Key。": "この Key を今すぐコピーして保存してください。ダイアログを閉じると完全な Key は再表示できず、ローテーションで新しい Key を生成する必要があります。",
    "完整 Key": "完全な Key",
    "已复制": "コピー済み",
    "复制 Key": "Key をコピー",
    "我已保存，关闭": "保存して閉じる",
    "第": "項目",
    "条，共": "/",
    "每页": "件/ページ",
    "第一页": "最初のページ",
    "上一页": "前のページ",
    "下一页": "次のページ",
    "最后一页": "最後のページ",
    "名称": "名前",
    "说明": "説明",
    "状态": "状態",
    "更新时间": "更新日時",
    "类型": "タイプ",
    "协议": "プロトコル",
    "端口": "ポート",
    "优先级": "優先度",
    "权重": "重み",
    "模型": "モデル",
    "模型名": "モデル",
    "项目": "プロジェクト",
    "团队": "チーム",
    "成员": "メンバー",
    "用户": "ユーザー",
    "邮箱": "メール",
    "用户名": "ユーザー名",
    "角色": "ロール",
    "最近登录": "最終ログイン",
    "负责人": "責任者",
    "请求": "リクエスト",
    "总请求": "総リクエスト",
    "总 Token": "総 Token",
    "总成本": "総コスト",
    "模型调用 Token": "モデル呼び出し Token",
    "等待调用数据": "利用データ待ち",
    "输入 Token": "入力 Token",
    "输出 Token": "出力 Token",
    "错误请求": "エラーリクエスト",
    "成本": "コスト",
    "估算成本": "推定コスト",
    "时间": "時間",
    "延迟": "レイテンシ",
    "最终 Provider": "最終 Provider",
    "Provider 资源": "Provider リソース",
    "上游模型": "上流モデル",
    "客户端 IP": "クライアント IP",
    "输入": "入力",
    "输出": "出力",
    "总量": "合計",
    "上下文": "コンテキスト",
    "条线路": "件のルート",
    "未配置线路": "ルート未設定",
    "官方资源": "公式リソース",
    "可访问": "アクセス可",
    "能力": "機能",
    "最近路由": "最近のルート",
    "待请求": "未リクエスト",
    "请求与响应": "リクエストとレスポンス",
    "已记录快照": "スナップショット記録済み",
    "未记录": "未記録",
    "动作": "アクション",
    "操作人": "実行者",
    "对象": "対象",
    "对象 ID": "対象 ID",
    "来源 IP": "送信元 IP",
    "成功": "成功",
    "失败": "失敗",
    "成功率": "成功率",
    "失败请求": "失敗リクエスト",
    "平均延迟": "平均レイテンシ",
    "请求列表": "リクエスト一覧",
    "请求详情": "リクエスト詳細",
    "大模型请求历史": "モデルリクエスト履歴",
    "后台操作审计": "管理操作監査",
    "日志类型": "ログ種別",
    "请求状态筛选": "リクエスト状態フィルタ",
    "搜索请求历史": "リクエスト履歴を検索",
    "搜索请求 ID、模型、Provider、状态码": "リクエスト ID、モデル、Provider、状態コードを検索",
    "全部": "すべて",
    "所有模型": "すべてのモデル",
    "精选": "注目",
    "文本": "テキスト",
    "图像": "画像",
    "视频": "動画",
    "音频": "音声",
    "嵌入": "埋め込み",
    "重排序": "リランキング",
    "三方资源": "外部リソース",
    "模型大类": "モデルカテゴリ",
    "模型能力筛选": "モデル機能フィルタ",
    "通知渠道类型": "通知チャネル種別",
    "自动路由": "自動ルーティング",
    "搜索模型名称或 ID": "モデル名または ID を検索",
    "个模型": "モデル",
    "个匹配模型": "件の一致モデル",
    "没有匹配的模型": "一致するモデルがありません",
    "模型路由器": "モデルルーター",
    "模型路由规则": "モデルルーティングルール",
    "参考模型路由器思路，按平衡、质量优先或成本优先模式选择候选 Provider 线路，并在失败时自动回退。": "バランス、品質優先、コスト優先の戦略で Provider ルート候補を選択し、失敗時は順番に自動フォールバックします。",
    "平衡模式综合权重、质量和成本；质量优先会先选高质量线路；成本优先会先选低成本线路。调用失败时会按候选顺序自动回退。": "バランスモードは重み、品質、コストを統合します。品質優先は高品質ルート、コスト優先は低コストルートを優先し、失敗時は候補順にフォールバックします。",
    "条启用线路": "件の有効ルート",
    "个已配置路由": "件の設定済みルート",
    "统一模型": "統一モデル",
    "已配置": "設定済み",
    "全部模型": "すべてのモデル",
    "路由显示范围": "ルート表示範囲",
    "搜索模型或 Provider": "モデルまたは Provider を検索",
    "新增路由": "ルートを作成",
    "未配置": "未設定",
    "按上到下顺序调用": "上から順に呼び出します",
    "该统一模型还没有 Provider 线路": "この統一モデルには Provider ルートがありません",
    "拖动调整调用顺序": "ドラッグして呼び出し順を調整",
    "未配置 Base URL": "Base URL 未設定",
    "没有匹配的模型路由": "一致するモデルルートがありません",
    "主": "主",
    "路由": "ルート",
    "自定义": "カスタム",
    "对外模型列表": "公開モデル一覧",
    "维护内部应用调用的对外模型名，并查看每个模型可用的 Provider 线路。": "社内アプリケーションが呼び出す公開モデル名を管理し、モデルごとの利用可能な Provider ルートを確認します。",
    "Provider 列表": "Provider 一覧",
    "Provider 是一个可调用的上游渠道实例，包含服务商类型、Base URL、API Key、健康状态和标准模型路由。": "Provider は呼び出し可能な上流チャネルインスタンスで、Provider 種別、Base URL、API Key、ヘルス状態、標準モデルルートを含みます。",
    "路由线路": "ルート",
    "系统管理员": "システム管理者",
    "安全审计": "セキュリティ監査",
    "团队 Leader": "チームリーダー",
    "普通用户": "一般ユーザー",
    "全局": "グローバル",
    "本人": "本人",
    "可分配": "割り当て可",
    "是": "はい",
    "否": "いいえ",
    "角色标识": "ロールキー",
    "显示名称": "表示名",
    "数据范围": "データ範囲",
    "已吊销": "失効済み",
    "草稿": "下書き",
    "已归档": "アーカイブ済み",
    "待处理": "保留中",
    "已批准": "承認済み",
    "已驳回": "却下済み",
    "已确认": "確認済み",
    "健康": "正常",
    "正常": "正常",
    "告警": "警告",
    "降级": "低下",
    "异常": "異常",
    "不可用": "利用不可",
    "已过期": "期限切れ",
    "未知": "不明",
    "直连": "直接接続",
    "静默": "サイレント",
    "弹窗": "ポップアップ",
    "手动": "手動",
    "每日": "毎日",
    "每周": "毎週",
    "每月": "毎月",
    "超额拦截": "超過時ブロック",
    "仅告警": "警告のみ",
    "飞书": "Feishu",
    "钉钉": "DingTalk",
    "企业微信": "WeCom",
    "邮件": "メール",
    "操作审计": "操作監査",
    "Key 发放": "Key 発行",
    "预算变更": "予算変更",
    "模型开通": "モデル開通",
    "额度提升": "クォータ増額",
    "账单确认": "請求確認",
    "账单驳回": "請求却下",
    "平衡": "バランス",
    "质量优先": "品質優先",
    "成本优先": "コスト優先",
    "优先级 + 权重": "優先度 + 重み",
    "仅优先级": "優先度のみ",
    "文本对话": "チャット",
    "向量嵌入": "埋め込み",
    "模拟渠道": "Mock Provider",
    "OpenAI 官方": "OpenAI 公式",
    "OpenAI 兼容": "OpenAI 互換",
    "本地模型": "ローカルモデル",
    "Provider 健康": "Provider ヘルス",
    "资源实例健康": "リソースヘルス",
    "请求额度": "リクエストクォータ",
    "Token 额度": "Token クォータ",
    "成本额度": "コストクォータ",
    "错误率": "エラー率",
    "日成本额度": "日次コストクォータ",
    "日 Token 额度": "日次 Token クォータ",
    "P95 延迟": "P95 レイテンシ",
    "测试": "テスト",
    "健康变更": "ヘルス変更",
    "确认": "確認",
    "驳回": "却下",
    "导出": "エクスポート",
    "切换主题": "テーマ切替",
    "企业 AI 网关": "企業 AI ゲートウェイ",
    "统一接入与成本治理平台": "統合アクセス・コストガバナンス基盤",
    "显示密码": "パスワードを表示",
    "隐藏密码": "パスワードを隠す",
    "保持登录": "ログイン状態を保持",
    "忘记密码？": "パスワードを忘れた場合",
    "或": "または",
    "使用企业 SSO 登录": "企業 SSO でログイン",
    "做一个乐于助人的助手": "親切で役に立つアシスタントとして振る舞ってください",
    "你是企业内部 AI 助手。": "あなたは企業内 AI アシスタントです。",
    "用两句话介绍 TokenHub": "TokenHub を 2 文で紹介してください",
    "总结今天的工单重点": "今日のチケットの要点をまとめてください",
    "TokenHub 企业知识库": "TokenHub 企業ナレッジベース",
    "请用三句话介绍 TokenHub。": "TokenHub を 3 文で紹介してください。",
    "请先粘贴 CSV 内容。": "先に CSV 内容を貼り付けてください。",
    "用户导入失败": "ユーザーインポートに失敗しました",
    "搜索控制台": "コンソールを検索",
    "搜索模型、Provider、日志...": "モデル、Provider、ログを検索...",
    "报表时间范围": "レポート期間",
    "7 天": "7 日",
    "30 天": "30 日",
    "本月": "今月",
    "近 7 天": "直近 7 日",
    "近 30 天": "直近 30 日",
    "在线": "オンライン",
    "全部健康 · 延迟 312ms": "すべて正常 · レイテンシ 312ms",
    "API Key": "API Key",
    "已发放": "発行済み",
    "成本与用量趋势": "コストと利用量の推移",
    "趋势指标": "推移指標",
    "Provider 成本占比": "Provider コスト比率",
    "暂无 Provider 成本数据": "Provider コストデータがありません",
    "Top 模型 · 调用量": "上位モデル · 呼び出し数",
    "暂无模型调用数据": "モデル呼び出しデータがありません",
    "OpenAI 兼容协议": "OpenAI 互換プロトコル",
    "接口基础信息": "API 基本情報",
    "面向业务开发者的模型 API 调用说明。业务侧只使用 ": "業務開発者向けのモデル API 説明です。業務側は ",
    " 和项目 API Key；": " とプロジェクト API Key のみを使用し、",
    " 仅用于控制台管理。": " はコンソール管理専用です。",
    "当前权限下还没有可展示模型，请先确认模型目录和路由策略。": "現在の権限では表示可能なモデルがありません。モデルカタログとルーティングポリシーを確認してください。",
    "当前后台还没有启用可用模型路由，请让管理员在路由策略里启用模型。": "利用可能なモデルルートがまだ有効化されていません。管理者にルーティングポリシーでモデルを有効化してもらってください。",
    "示例模型": "サンプルモデル",
    "当前配置": "現在の設定",
    "启用路由": "有効ルート",
    "API 导航": "API ナビゲーション",
    "按接口类型查看详细说明": "API 種別ごとに詳細を表示",
    "开始": "開始",
    "模型 API": "モデル API",
    "管理 API": "管理 API",
    "参考": "リファレンス",
    "快速接入": "クイックスタート",
    "用一个项目 API Key 调用 TokenHub 的 OpenAI 兼容模型接口。": "プロジェクト API Key で TokenHub の OpenAI 互換モデル API を呼び出します。",
    "鉴权方式": "認証方式",
    "业务应用只需要调用 /v1/*，不需要也不应该访问 /api/admin/*。": "業務アプリは /v1/* だけを呼び出し、/api/admin/* にはアクセスしません。",
    "每个 API Key 都会受到项目状态、模型白名单、额度、并发和 Provider 路由策略约束。": "各 API Key はプロジェクト状態、モデル許可リスト、クォータ、同時実行数、Provider ルートに制約されます。",
    "排查失败请求时，优先复制响应里的 request_id 到请求日志查看完整链路。": "失敗調査では、レスポンスの request_id をコピーしてリクエストログで全経路を確認します。",
    "查询可用模型": "利用可能モデルを取得",
    "发起一次对话": "チャットを開始",
    "认证与权限": "認証と権限",
    "业务 API 使用项目下发的 API Key；控制台登录令牌不能替代业务 Key。": "業務 API はプロジェクト発行の API Key を使います。コンソールログイントークンでは代替できません。",
    "格式": "形式",
    "当前 Key 数": "現在の Key 数",
    "项目 API Key，格式为 Bearer thk_xxx": "プロジェクト API Key。形式は Bearer thk_xxx",
    "POST 必填": "POST で必須",
    "JSON 请求使用 application/json": "JSON リクエストは application/json を使用",
    "模型接口必填": "モデル API で必須",
    "统一模型名，需在 Key 白名单和路由策略中可用": "Key 許可リストとルートで利用可能な統一モデル名",
    "401 通常表示 Key 缺失、格式错误、已停用或已过期。": "401 は通常 Key の欠落、形式不正、無効化、期限切れを示します。",
    "403 通常表示项目状态、模型白名单或权限范围不允许当前调用。": "403 は通常プロジェクト状態、モデル許可リスト、権限範囲が呼び出しを許可していないことを示します。",
    "模型列表": "モデル一覧",
    "按当前 API Key 的权限返回可用统一模型。": "現在の API Key 権限で利用可能な統一モデルを返します。",
    "请求示例": "リクエスト例",
    "字段": "フィールド",
    "必填": "必須",
    "统一模型名称，用于后续调用的 model 字段": "以降の呼び出しで model フィールドに使う統一モデル名",
    "OpenAI 兼容对象类型，通常为 model": "OpenAI 互換オブジェクト型。通常は model",
    "模型归属或 Provider 标识": "モデル所有者または Provider 識別子",
    "对话补全": "チャット補完",
    "兼容 OpenAI Chat Completions，用于普通对话、工具调用和流式输出。": "OpenAI Chat Completions 互換。通常会話、ツール呼び出し、ストリーミングに利用します。",
    "统一模型名，例如 ": "統一モデル名。例: ",
    "system/user/assistant 消息数组": "system/user/assistant メッセージ配列",
    "采样温度，默认由上游模型决定": "サンプリング温度。デフォルトは上流モデルに依存",
    "true 时返回 SSE 流式响应": "true の場合 SSE ストリーミングレスポンスを返します",
    "兼容新版 Responses 风格调用，适合统一文本输入和多模态能力扩展。": "新しい Responses 形式に互換し、統一テキスト入力とマルチモーダル拡張に適します。",
    "统一模型名": "統一モデル名",
    "用户输入内容": "ユーザー入力",
    "是否流式返回": "ストリーミングするか",
    "文本向量": "テキスト埋め込み",
    "转发文本向量生成请求，并记录 Token 与成本归因。": "テキスト埋め込み生成リクエストを転送し、Token とコスト帰属を記録します。",
    "向量统一模型名": "統一埋め込みモデル名",
    "需要向量化的文本": "埋め込み対象テキスト",
    "可选 float/base64，取决于上游模型支持": "上流モデル対応に応じて float/base64 を選択",
    "当前可调用模型": "現在呼び出し可能なモデル",
    "根据模型目录和路由策略汇总当前控制台可见模型。": "モデルカタログとルートに基づき、このコンソールで見えるモデルを集計します。",
    "控制台登录": "コンソールログイン",
    "控制台用户登录接口，不等同于模型 API Key。": "コンソールユーザーログイン API。モデル API Key とは異なります。",
    "用户名或邮箱": "ユーザー名またはメール",
    "控制台密码": "コンソールパスワード",
    "管理 API 仅用于控制台和受信任后台程序，不应该暴露给业务应用前端。": "管理 API はコンソールと信頼されたバックエンド専用で、業務フロントエンドに公開しないでください。",
    "Provider 配置": "Provider 設定",
    "管理上游 Provider、Base URL、凭证和健康状态。": "上流 Provider、Base URL、認証情報、ヘルス状態を管理します。",
    "读取 Provider 列表": "Provider 一覧を取得",
    "新增 Provider 配置": "Provider 設定を作成",
    "更新 Provider 凭证、状态和元信息": "Provider 認証情報、状態、メタ情報を更新",
    "维护统一模型到 Provider 资源的优先级、权重和状态。": "統一モデルから Provider リソースへの優先度、重み、状態を管理します。",
    "当前路由": "現在のルート",
    "按权限查看模型调用日志、命中路由、耗时、Token 和错误信息。": "権限に応じてモデル呼び出しログ、命中ルート、所要時間、Token、エラーを確認します。",
    "日志样本": "ログサンプル",
    "用途": "用途",
    "排查 request_id 和上游响应": "request_id と上流レスポンスの調査",
    "常见错误": "よくあるエラー",
    "按状态码定位 API Key、模型白名单、路由和额度问题。": "ステータスコードから API Key、モデル許可リスト、ルート、クォータ問題を特定します。",
    "状态码": "ステータス",
    "错误码": "エラーコード",
    "处理方式": "対応方法",
    "检查 Authorization 是否使用 TokenHub API Key": "Authorization が TokenHub API Key を使っているか確認",
    "检查 Key 的模型白名单和项目状态": "Key のモデル許可リストとプロジェクト状態を確認",
    "为统一模型配置启用路由": "統一モデルに有効ルートを設定",
    "检查项目额度、并发和 Provider 资源限制": "プロジェクトクォータ、同時実行数、Provider リソース制限を確認",
    "在请求日志里查看上游响应和 request_id": "リクエストログで上流レスポンスと request_id を確認",
    "SDK 示例": "SDK 例",
    "使用 OpenAI 兼容 SDK 接入 TokenHub。": "OpenAI 互換 SDK で TokenHub に接続します。",
    "调用链路": "呼び出し経路",
    "从鉴权到 Provider 路由的完整治理链路。": "認証から Provider ルーティングまでの完全なガバナンス経路です。",
    "阶段": "段階",
    "当前数据": "現在データ",
    "认证": "認証",
    "权限": "権限",
    "模型白名单 + 项目状态": "モデル許可リスト + プロジェクト状態",
    "上游渠道实例、凭证和健康状态": "上流チャネルインスタンス、認証情報、ヘルス",
    "对外模型到 Provider 的优先级/权重映射": "公開モデルから Provider への優先度/重みマッピング",
    "额度、审计、成本统计": "クォータ、監査、コスト統計",
    "请求参数": "リクエストパラメータ",
    "明细": "詳細",
    "示例": "例",
    "复制": "コピー",
    "复制代码": "コードをコピー",
    "企业 AI 用量看板": "企業 AI 利用ダッシュボード",
    "面向管理层的部门、个人与 Token 消耗对比": "経営層向けの部門、個人、Token 消費比較",
    "按部门": "部門別",
    "Token 口径": "Token 基準",
    "Token 消耗": "Token 消費",
    "总 Token 消耗": "総 Token 消費",
    "覆盖部门": "対象部門",
    "活跃成员": "アクティブメンバー",
    "统计时间": "集計時刻",
    "最高": "最高",
    "暂无部门归因": "部門帰属がありません",
    "次请求": "件のリクエスト",
    "部门 Token 消耗对比": "部門別 Token 消費比較",
    "输入 Token 与输出 Token 分段展示，按总量排序": "入力 Token と出力 Token を区分表示し、総量順に並べます",
    "部门排行": "部門ランキング",
    "个人排行": "個人ランキング",
    "公司内部成员 Token 消耗 Top 20": "社内メンバー Token 消費 Top 20",
    "按 Token 降序": "Token 降順",
    "可用于复盘配额": "クォータ見直しに利用可能",
    "暂无部门 Token 数据": "部門 Token データがありません",
    "暂无部门排行数据": "部門ランキングデータがありません",
    "暂无个人排行数据": "個人ランキングデータがありません",
    "排名": "順位",
    "部门": "部門",
    "占比": "比率",
    "未归属部门": "未割当部門",
    "团队用户": "チームユーザー",
    "关闭成员列表": "メンバー一覧を閉じる",
    "姓名": "氏名",
    "成员数": "メンバー数",
    "项目额度": "プロジェクトクォータ",
    "关闭额度配置": "クォータ設定を閉じる",
    "已配置项目专属额度": "プロジェクト専用クォータ設定済み",
    "未配置项目专属额度": "プロジェクト専用クォータ未設定",
    "留空或填 0 表示该项不限额；Key 自身额度仍会叠加生效。": "空欄または 0 は無制限です。Key 自身のクォータも重ねて有効です。",
    "已有额度提升申请待审批": "クォータ増額申請が承認待ちです",
    "最近触发了项目额度限制": "最近プロジェクトクォータ制限に達しました",
    "可在审批记录中处理。": "承認記録で処理できます。",
    "次额度不足，请填写希望提升后的目标额度再提交审批。": "回クォータ不足です。増額後の目標値を入力して承認申請してください。",
    "待审批": "承認待ち",
    "需提升": "増額が必要",
    "日请求": "日次リクエスト",
    "月请求": "月次リクエスト",
    "日 Token": "日次 Token",
    "月 Token": "月次 Token",
    "日成本": "日次コスト",
    "月成本": "月次コスト",
    "最大并发": "最大同時実行数",
    "提升额度申请": "クォータ増額申請",
    "提交项目额度提升审批": "プロジェクトクォータ増額承認を申請",
    "保存额度": "クォータを保存",
    "按需导出": "オンデマンド出力",
    "最近导出": "最近の出力",
    "自动导出配置": "自動出力設定",
    "新增配置": "設定を作成",
    "数据集": "データセット",
    "文件": "ファイル",
    "账期": "期間",
    "导出 ": "エクスポート ",
    "模型分类": "モデル分類",
    "Key 归属逻辑": "Key 帰属ロジック",
    "内部应用配置项目下发放的 Key；额度、模型白名单、用量和成本都会归属到该项目。": "社内アプリのプロジェクト配下で Key を発行し、クォータ、モデル許可リスト、利用量、コストはそのプロジェクトに帰属します。",
    "个项目": "件のプロジェクト",
    "个 Key": "件の Key",
    "批量导入": "一括インポート",
    "导入用户": "ユーザーをインポート",
    "CSV 内容": "CSV 内容",
    "按 username 或 email 匹配已有用户；匹配到则更新，未匹配则创建。": "username または email で既存ユーザーを照合し、一致すれば更新、なければ作成します。",
    "字段顺序": "フィールド順",
    "role 可填 admin、team_leader、user；status 可填 active 或 disabled。": "role は admin、team_leader、user、status は active または disabled を指定できます。",
    "导入中": "インポート中",
    "开始导入": "インポート開始",
    "模型配置": "モデル設定",
    "暂无聊天模型": "チャットモデルがありません",
    "条路由": "件のルート",
    "未配置路由": "ルート未設定",
    "响应格式": "レスポンス形式",
    "系统提示": "システムプロンプト",
    "函数": "関数",
    "函数调用配置待接入": "関数呼び出し設定は未接続です",
    "添加函数": "関数を追加",
    "模型演练对话": "モデルプレイグラウンド会話",
    "复制模型名": "モデル名をコピー",
    "选择模型": "モデルを選択",
    "模型详情": "モデル詳細",
    "查看代码": "コード表示",
    "清空历史": "履歴をクリア",
    "默认资源": "デフォルトリソース",
    "次尝试": "回試行",
    "当前模型": "現在のモデル",
    "试用": "試用",
    "当前还没有配置模型路由。": "モデルルートはまだ設定されていません。",
    "体验一下，看看模型在 TokenHub 网关上的表现": "TokenHub ゲートウェイ上でのモデル動作を試せます",
    "说点什么...": "メッセージを入力...",
    "文件上传待接入": "ファイルアップロードは未接続です",
    "上传文件": "ファイルをアップロード",
    "发送": "送信",
    "API 使用": "API 利用",
    "使用以下代码示例集成 TokenHub 模型接口": "以下のコード例で TokenHub モデル API を統合します",
    "API 调用语言": "API 呼び出し言語",
    "未选择模型": "モデル未選択",
    "模型没有返回可展示内容。": "モデルは表示可能な内容を返しませんでした。",
    "演练请求失败": "プレイグラウンドリクエストに失敗しました",
    "Provider 模板加载失败": "Provider テンプレートの読み込みに失敗しました",
    "Provider 已": "Provider は",
    "更新": "更新済み",
    "创建": "作成済み",
    "模型类型": "モデルタイプ",
    "类": "カテゴリ",
    "渠道商": "Provider",
    "个标准模型": "件の標準モデル",
    "自定义渠道商": "カスタム Provider",
    "搜索渠道商、ID、类型": "Provider、ID、タイプを検索",
    "没有匹配的渠道商": "一致する Provider がありません",
    "使用自定义渠道商": "カスタム Provider を使用",
    "请选择渠道商": "Provider を選択",
    "例如 prv_company_proxy": "例: prv_company_proxy",
    "留空自动生成": "空欄で自動生成",
    "渠道名称": "チャネル名",
    "渠道商类型": "Provider タイプ",
    "编辑时留空则不修改已保存密钥。": "編集時に空欄の場合、保存済みシークレットは変更しません。",
    "留空表示不修改现有 Key；填写新值才会覆盖。": "空欄なら既存 Key を変更しません。新しい値を入力した場合のみ上書きします。",
    "开启后会为下方勾选模型补齐缺失线路，不覆盖已有策略。": "有効にすると、選択モデルの不足ルートを追加し、既存ポリシーは上書きしません。",
    "保存渠道时会自动创建下方勾选模型的默认路由。": "Provider 保存時に選択モデルのデフォルトルートを自動作成します。",
    "上游模型映射": "上流モデルマッピング",
    "个可映射模型": "件のマッピング可能モデル",
    "加载中": "読み込み中",
    "正在加载模型列表...": "モデル一覧を読み込み中...",
    "该渠道商暂无可匹配当前标准模型目录的上游模型": "この Provider には現在の標準モデルカタログに一致する上流モデルがありません",
    "已有路由": "既存ルート",
    "已关闭自动路由：保存后只创建 Provider，不生成路由策略。": "自動ルートはオフです。保存後は Provider のみ作成し、ルートは生成しません。",
    "当前没有勾选模型，保存后不会生成路由策略。": "モデルが選択されていないため、保存後にルートは生成されません。",
    "保存后会为": "保存後、",
    "个已选": "件の選択済み",
    "模型创建缺失的默认路由。": "モデルに不足しているデフォルトルートを作成します。",
    "请求详情加载失败": "リクエスト詳細の読み込みに失敗しました",
    "全部 ": "すべて ",
    "成功 ": "成功 ",
    "失败 ": "失敗 ",
    "没有匹配的请求记录": "一致するリクエスト記録がありません",
    "暂无大模型请求记录": "モデルリクエスト記録がありません",
    "正在加载请求详情...": "リクエスト詳細を読み込み中...",
    "请选择一条请求": "リクエストを選択してください",
    "复制请求 ID": "リクエスト ID をコピー",
    "Token 与成本": "Token とコスト",
    "条记录": "件の記録",
    "暂无记录": "記録なし",
    "路由尝试": "ルート試行",
    "次，含 fallback": "回、fallback 含む",
    "没有记录到路由尝试": "ルート試行は記録されていません",
    "这条历史记录没有保存 request / response 快照": "この履歴には request / response スナップショットが保存されていません",
    "未记录请求内容": "リクエスト内容未記録",
    "未记录响应内容": "レスポンス内容未記録",
    "已截断": "切り捨て済み",
    "上游模型 ": "上流モデル ",
    "资源 ": "リソース ",
    "路由 ": "ルート ",
    "资源": "リソース",
    "大小": "サイズ",
    "触发方式": "トリガー方式",
    "创建时间": "作成日時",
    "最近恢复": "最近の復元",
    "校验": "チェックサム",
    "保留天数": "保持日数",
    "0 表示不过期": "0 は期限なし",
    "下载": "ダウンロード",
    "恢复": "復元",
    "备份文件已开始下载": "バックアップのダウンロードを開始しました",
    "已恢复备份": "バックアップを復元しました",
    "后台用户列表": "管理ユーザー一覧",
    "新增用户": "ユーザーを作成",
    "编辑时留空则不修改": "編集時に空欄の場合は変更しません",
    "从已有系统导出的 CSV 批量导入或更新用户": "既存システムから出力した CSV でユーザーを一括作成または更新",
    "指标": "指標",
    "阈值": "しきい値",
    "级别": "レベル",
    "对象范围": "対象範囲",
    "规则列表": "ルール一覧",
    "触发事件": "発生イベント",
    "来源": "ソース",
    "系统默认": "システム既定",
    "事件": "イベント",
    "告警 ID": "アラート ID",
    "渠道": "チャネル",
    "HTTP": "HTTP",
    "失败原因": "失敗理由",
    "审批申请列表": "承認申請一覧",
    "触发条件": "トリガー条件",
    "申请人": "申請者",
    "处理人": "処理者",
    "内容": "内容",
    "批准": "承認",
    "批准并执行该申请": "この申請を承認して実行",
    "驳回该申请": "この申請を却下",
    "成本中心编码": "コストセンターコード",
    "编码": "コード",
    "月预算 USD": "月次予算 USD",
    "月预算": "月次予算",
    "部门分摊": "部門配賦",
    "分摊成本 USD": "配賦コスト USD",
    "请求数": "リクエスト数",
    "分摊规则": "配賦ルール",
    "分摊成本": "配賦コスト",
    "审批流": "承認フロー",
    "审批角色": "承認ロール",
    "金额阈值 USD": "金額しきい値 USD",
    "SLA 小时": "SLA 時間",
    "金额阈值": "金額しきい値",
    "频率": "頻度",
    "接收人": "受信者",
    "导出 CSV 报表": "CSV レポートを出力",
    "内部账单": "内部請求",
    "金额 USD": "金額 USD",
    "发票备注": "請求メモ",
    "确认人": "確認者",
    "确认时间": "確認日時",
    "驳回原因": "却下理由",
    "金额": "金額",
    "生成本月": "今月分を生成",
    "按当前账期生成分摊和内部账单": "現在期間の配賦と内部請求を生成",
    "输入账期 YYYY-MM，留空则导出全部": "期間 YYYY-MM を入力。空欄ならすべて出力",
    "输入账期 YYYY-MM，留空则生成本月": "期間 YYYY-MM を入力。空欄なら今月を生成",
    "请输入驳回原因": "却下理由を入力してください",
    "已生成分摊和内部账单": "配賦と内部請求を生成しました",
    "已提交审批：": "承認申請済み: ",
    "请选择项目空间后再发放 API Key": "API Key 発行前にプロジェクトを選択してください",
    "发放 Key 失败": "Key 発行に失敗しました",
    "请先填写至少一项希望提升后的目标额度": "増額後の目標クォータを少なくとも 1 つ入力してください",
    "不限额": "無制限",
    "项目空间内配置的专属模型调用额度": "プロジェクト内で設定する専用モデル呼び出しクォータ",
    "该记录": "このレコード",
    "通知模式": "通知モード",
    "目标对象": "対象",
    "脱敏 Prompt": "Prompt をマスク",
    "错误透传": "エラー透過",
    "每行一个 CIDR 或 IP，留空表示不配置白名单。": "1 行に CIDR または IP を 1 つ入力。空欄なら許可リストなし。",
    "开启后策略要求请求与响应审计避免直接展示完整 Prompt。": "有効にすると、リクエスト/レスポンス監査で完全な Prompt を直接表示しない方針になります。",
    "通用 Webhook 告警通知": "汎用 Webhook アラート通知",
    "飞书机器人告警通知": "Feishu ボットアラート通知",
    "钉钉机器人告警通知": "DingTalk ボットアラート通知",
    "企业微信机器人告警通知": "WeCom ボットアラート通知",
    "Slack Incoming Webhook 告警通知": "Slack Incoming Webhook アラート通知",
    "SMTP 邮件告警通知": "SMTP メールアラート通知",
    "告警通知渠道": "アラート通知チャネル",
    "SMTP 已配置": "SMTP 設定済み",
    "SMTP 未配置": "SMTP 未設定",
    "通知渠道列表": "通知チャネル一覧",
    "新增通知渠道": "通知チャネルを作成",
    "渠道类型": "チャネルタイプ",
    "签名密钥": "署名シークレット",
    "可选预留。当前按普通机器人 Webhook 发送，留空不影响通知。": "任意の予約項目です。現在は通常のボット Webhook で送信するため、空欄でも問題ありません。",
    "SMTP 端口": "SMTP ポート",
    "SMTP 用户名": "SMTP ユーザー名",
    "SMTP 密码": "SMTP パスワード",
    "收件人": "受信者",
    "多个邮箱用逗号分隔。": "複数メールはカンマで区切ってください。",
    "地址/目标": "アドレス / 対象",
    "凭证": "認証情報",
    "告警类型": "アラートタイプ",
    "监控名称": "監視名",
    "监控类型": "監視タイプ",
    "检查间隔": "チェック間隔",
    "最近检查": "最終チェック",
    "环境": "環境",
    "区域": "リージョン",
    "资源类型": "リソースタイプ",
    "资源分组": "リソースグループ",
    "失败次数": "失敗回数",
    "冷却至": "クールダウン終了",
    "速率限制 RPM": "レート制限 RPM",
    "Token 限制 TPM": "Token 制限 TPM",
    "质量分": "品質スコア",
    "成本分": "コストスコア",
    "粘性": "スティッキー",
    "不限": "無制限",
    "系统提示词": "システムプロンプト",
    "支持参数": "対応パラメータ",
    "输入模态": "入力モダリティ",
    "输出模态": "出力モダリティ",
    "计费输入": "入力単価",
    "计费输出": "出力単価",
    "Embedding 计费": "Embedding 単価",
    "模型家族": "モデルファミリー",
    "上下文窗口": "コンテキストウィンドウ",
    "公开 Base URL": "公開 Base URL",
    "默认超时": "デフォルトタイムアウト",
    "审计保留": "監査保持",
    "用户名字段": "ユーザー名 Claim",
    "邮箱字段": "メール Claim",
    "团队字段": "チーム Claim",
    "新增身份源": "ID ソースを作成",
    "新增可选角色": "割当可能ロールを作成",
    "配置用户管理新增/编辑时可选择的后台角色。权限边界由系统内置角色模型控制。": "ユーザー作成/編集時に選択できる管理ロールを設定します。権限境界は組み込みロールモデルで制御されます。",
    "Embedding 价 USD/1M": "Embedding 単価 USD/1M",
    "IP 白名单": "IP 許可リスト",
    "IP 白名单，逗号分隔": "IP 許可リスト、カンマ区切り",
    "Key 名称": "Key 名",
    "Key 必须挂在已有项目下，用于该项目的内部应用调用网关。": "Key は既存プロジェクトに紐づけ、そのプロジェクトの社内アプリがゲートウェイを呼び出すために使います。",
    "SQLite 备份": "SQLite バックアップ",
    "上游模型/部署名": "上流モデル / デプロイ名",
    "下载 SQLite 备份文件": "SQLite バックアップファイルをダウンロード",
    "为该 Provider 新增模型路由": "この Provider にモデルルートを作成",
    "为该对外模型新增 Provider 线路": "この公開モデルに Provider ルートを作成",
    "为该项目创建内部 API Key": "このプロジェクトに内部 API Key を作成",
    "从用户管理中选择团队负责人，用于审批和审计归属。": "ユーザー管理からチーム責任者を選び、承認と監査帰属に利用します。",
    "作用域": "スコープ",
    "作用域 ID": "スコープ ID",
    "保存项目额度": "プロジェクトクォータを保存",
    "内部 Key 列表": "内部 Key 一覧",
    "创建、下载和恢复 TokenHub SQLite 数据库快照。": "TokenHub SQLite データベーススナップショットを作成、ダウンロード、復元します。",
    "创建备份": "バックアップを作成",
    "发件人": "送信者",
    "发放 Key": "Key 発行",
    "可用供应商": "利用可能 Provider",
    "后台操作、变更对象、操作人和时间": "管理操作、変更対象、実行者、時刻",
    "告警事件列表": "アラートイベント一覧",
    "告警通知的渠道、目标和发送结果": "アラート通知のチャネル、対象、送信結果",
    "团队 ID": "チーム ID",
    "团队名称": "チーム名",
    "处理 Key 发放、额度提升和模型开通审批。": "Key 発行、クォータ増額、モデル開通の承認を処理します。",
    "多个收件人用英文逗号分隔。": "複数の受信者は英字カンマで区切ります。",
    "对外模型": "公開モデル",
    "将数据库恢复到该备份": "データベースをこのバックアップへ復元",
    "并发": "同時実行",
    "归属项目": "所属プロジェクト",
    "成本中心、负责人和部门归属配置": "コストセンター、責任者、部門帰属設定",
    "成本优先模式会优先选择该评分更高的线路，分数越高代表越省。": "コスト優先モードはスコアが高いルートを優先します。高いほど低コストです。",
    "成本评分 1-100": "コストスコア 1-100",
    "批量创建时留空，会为每个统一模型使用同名上游模型。": "一括作成時に空欄の場合、各統一モデルと同名の上流モデルを使います。",
    "按模型、项目和日期归集 Token 与成本": "モデル、プロジェクト、日付別に Token とコストを集計",
    "按项目发放内部 API Key，限制模型白名单、额度、并发和有效期。": "プロジェクト別に内部 API Key を発行し、モデル許可リスト、クォータ、同時実行、有効期限を制限します。",
    "支持参数，逗号分隔": "対応パラメータ、カンマ区切り",
    "数字越小越先调用；新增时留空会自动排在该统一模型已有 Provider 后面。": "数値が小さいほど先に呼び出します。作成時に空欄の場合、既存 Provider の後ろに自動配置されます。",
    "新增路由时可多选模型；编辑已有路由时仍按单条规则调整。": "ルート作成時は複数モデルを選択できます。既存ルート編集時は単一ルールを調整します。",
    "新增项目": "プロジェクトを作成",
    "日成本 USD": "日次コスト USD",
    "最近命中": "最終ヒット",
    "最近检测": "最終チェック",
    "最近消息": "最新メッセージ",
    "最近状态": "最新状態",
    "月成本 USD": "月次コスト USD",
    "查看告警通知的发送状态、目标和失败原因。": "アラート通知の送信状態、対象、失敗理由を確認します。",
    "检测 Provider 可用性": "Provider 可用性をチェック",
    "模型白名单，逗号分隔": "モデル許可リスト、カンマ区切り",
    "渠道配置": "チャネル設定",
    "生成新 Key，并立即吊销旧 Key": "新しい Key を生成し、古い Key をすぐ失効",
    "用途/环境": "用途 / 環境",
    "留空则沿用统一模型名": "空欄の場合は統一モデル名を使用",
    "留空自动追加": "空欄なら自動追加",
    "留空表示不限制 Key 级模型白名单；实际可调用模型仍受模型目录和路由策略约束。": "空欄なら Key レベルのモデル許可リストは無制限です。実際の呼び出し可能モデルはカタログとルートに制約されます。",
    "留空表示不限来源 IP。": "空欄なら送信元 IP を制限しません。",
    "目录计价": "カタログ単価",
    "目标": "対象",
    "目标类型": "対象タイプ",
    "确认该内部账单": "この内部請求を確認",
    "立即执行该健康检测": "このヘルスチェックを今すぐ実行",
    "立即检测": "今すぐチェック",
    "策略": "戦略",
    "管理 TokenHub 后台登录账号、角色权限、归属团队和账号状态。": "TokenHub 管理ログインアカウント、ロール権限、所属チーム、アカウント状態を管理します。",
    "粘性会话": "スティッキーセッション",
    "系列": "ファミリー",
    "编辑时留空表示不修改。": "編集時に空欄の場合は変更しません。",
    "编辑时留空表示不修改现有 Key；只有填写新值才会覆盖。": "編集時に空欄の場合、既存 Key は変更しません。新しい値を入力した場合のみ上書きします。",
    "能力标签，逗号分隔": "機能タグ、カンマ区切り",
    "评分": "スコア",
    "请求 ID、模型、状态码、Provider 路由和延迟": "リクエスト ID、モデル、ステータスコード、Provider ルート、レイテンシ",
    "调度策略": "スケジューリング戦略",
    "负责人用户 ID": "責任者ユーザー ID",
    "质量优先模式会优先选择该评分更高的线路。": "品質優先モードはスコアが高いルートを優先します。",
    "质量评分 1-100": "品質スコア 1-100",
    "费用归集口径，可与团队不同；用于成本归集和用量统计。": "コスト帰属単位です。チームと異なる場合があり、コスト集計と利用統計に使います。",
    "模型用量": "モデル利用量",
    "成员用量": "メンバー利用量",
    "项目归因": "プロジェクト帰属",
    "成员成本": "メンバーコスト",
    "Provider 成本": "Provider コスト",
    "Provider 明细成本": "Provider 詳細コスト",
    "命中 Provider": "命中 Provider",
    "资源实例": "リソースインスタンス",
    "资源实例 ID": "リソースインスタンス ID",
    "路由数": "ルート数",
    "轮换": "ローテーション",
    "输入价 USD/1M": "入力単価 USD/1M",
    "输出价 USD/1M": "出力単価 USD/1M",
    "运行时触发的额度、成本和 Provider 健康事件。": "実行時に発生したクォータ、コスト、Provider ヘルスイベントです。",
    "通知发送记录": "通知送信記録",
    "通过默认通知渠道发送该告警": "既定の通知チャネルでこのアラートを送信",
    "配置通知渠道": "通知チャネルを設定",
    "间隔秒数": "間隔秒数",
    "项目 ID": "プロジェクト ID",
    "项目列表": "プロジェクト一覧",
    "项目名称": "プロジェクト名",
    "项目是企业内部 AI 使用、Key、额度和成本归属的基本单元。": "プロジェクトは社内 AI 利用、Key、クォータ、コスト帰属の基本単位です。",
    "额度": "クォータ",
    "额度提升、Key 发放和模型开通审批记录": "クォータ増額、Key 発行、モデル開通の承認記録",
    "驳回该内部账单": "この内部請求を却下",
    "默认检测项": "デフォルトチェック項目",
    "更新路由顺序失败": "ルート順序の更新に失敗しました",
    "点击停用 API Key": "クリックして API Key を無効化",
    "点击启用 API Key": "クリックして API Key を有効化",
  },
};

function readSavedLanguage(): AppLanguage {
  if (typeof window === "undefined") return "zh-CN";
  const saved = window.localStorage.getItem(languageStorageKey);
  return saved === "en" || saved === "ja" || saved === "zh-CN" ? saved : "zh-CN";
}

function setActiveLanguage(language: AppLanguage) {
  activeLanguage = language;
}

function tx(value: string | undefined | null) {
  if (!value) return "";
  if (activeLanguage === "zh-CN") return value;
  return translations[activeLanguage][value] ?? translateGeneratedText(value, activeLanguage) ?? value;
}

function translateGeneratedText(value: string, language: Exclude<AppLanguage, "zh-CN">) {
  const createListMatch = value.match(/^(.+)列表$/);
  if (createListMatch) {
    const base = translations[language][createListMatch[1]] ?? createListMatch[1];
    return language === "ja" ? `${base}一覧` : `${base} List`;
  }
  const createMatch = value.match(/^新增(.+)$/);
  if (createMatch) {
    const base = translations[language][createMatch[1]] ?? createMatch[1];
    return language === "ja" ? `${base}を作成` : `Create ${base}`;
  }
  const approvalMatch = value.match(/^已提交审批：(.+)$/);
  if (approvalMatch) return language === "ja" ? `承認申請済み: ${approvalMatch[1]}` : `Approval submitted: ${approvalMatch[1]}`;
  const exportMatch = value.match(/^(.+) 已导出$/);
  if (exportMatch) return language === "ja" ? `${exportMatch[1]} をエクスポートしました` : `${exportMatch[1]} exported`;
  const sentMatch = value.match(/^(.+) 已发送$/);
  if (sentMatch) return language === "ja" ? `${sentMatch[1]} を送信しました` : `${sentMatch[1]} sent`;
  const approvedMatch = value.match(/^(.+) 已批准$/);
  if (approvedMatch) return language === "ja" ? `${approvedMatch[1]} を承認しました` : `${approvedMatch[1]} approved`;
  const rejectedMatch = value.match(/^(.+) 已驳回$/);
  if (rejectedMatch) return language === "ja" ? `${rejectedMatch[1]} を却下しました` : `${rejectedMatch[1]} rejected`;
  const confirmedMatch = value.match(/^(.+) 已确认$/);
  if (confirmedMatch) return language === "ja" ? `${confirmedMatch[1]} を確認しました` : `${confirmedMatch[1]} confirmed`;
  const quotaSubmittedMatch = value.match(/^(.+) 的额度提升申请已提交$/);
  if (quotaSubmittedMatch) return language === "ja" ? `${quotaSubmittedMatch[1]} のクォータ増額申請を送信しました` : `${quotaSubmittedMatch[1]} quota increase request submitted`;
  const quotaSavedMatch = value.match(/^(.+) 的额度已保存$/);
  if (quotaSavedMatch) return language === "ja" ? `${quotaSavedMatch[1]} のクォータを保存しました` : `${quotaSavedMatch[1]} quota saved`;
  const statusMatch = value.match(/^(.+) 已(启用|禁用|轮换，新 Key 已展示)$/);
  if (statusMatch) {
    const action = statusMatch[2];
    if (language === "ja") {
      const label = action === "启用" ? "有効化しました" : action === "禁用" ? "無効化しました" : "ローテーションしました。新しい Key を表示しています";
      return `${statusMatch[1]} を${label}`;
    }
    const label = action === "启用" ? "enabled" : action === "禁用" ? "disabled" : "rotated; new Key is displayed";
    return `${statusMatch[1]} ${label}`;
  }
  const routeOrderMatch = value.match(/^已更新 (.+) 的 Provider 调用顺序$/);
  if (routeOrderMatch) return language === "ja" ? `${routeOrderMatch[1]} の Provider 呼び出し順を更新しました` : `Updated Provider call order for ${routeOrderMatch[1]}`;
  return undefined;
}

function displayText(value: string | undefined | null) {
  return tx(value);
}

function isIssuedAPIKey(value: string) {
  return value.trim().startsWith("thk_");
}

function translatedCell(value: React.ReactNode) {
  return typeof value === "string" ? tx(value) : value;
}

function languageLocale() {
  if (activeLanguage === "en") return "en-US";
  if (activeLanguage === "ja") return "ja-JP";
  return "zh-CN";
}

function countWithUnit(count: number, zhUnit: string, enUnit: string, jaUnit: string) {
  const formatted = formatNumber(count);
  if (activeLanguage === "en") return `${formatted} ${enUnit}${count === 1 ? "" : "s"}`;
  if (activeLanguage === "ja") return `${formatted} ${jaUnit}`;
  return `${formatted} ${zhUnit}`;
}

function countWithLabel(count: number, label: string) {
  if (activeLanguage === "en") return `${formatNumber(count)} ${tx(label)}`;
  if (activeLanguage === "ja") return `${formatNumber(count)} ${tx(label)}`;
  return `${formatNumber(count)} ${label}`;
}

function selectedModelsText(count: number) {
  if (activeLanguage === "en") return `${count} models selected`;
  if (activeLanguage === "ja") return `${count} 件のモデルを選択済み`;
  return `已选择 ${count} 个模型`;
}

function defaultPlaygroundSystemPrompt() {
  return tx("做一个乐于助人的助手");
}

function isDefaultPlaygroundSystemPrompt(value: string) {
  return [
    "做一个乐于助人的助手",
    translations.en["做一个乐于助人的助手"],
    translations.ja["做一个乐于助人的助手"],
  ].includes(value);
}

function importUsersDoneMessage(created: number, updated: number, skipped: number) {
  if (activeLanguage === "en") {
    return `User import complete: ${created} created, ${updated} updated${skipped > 0 ? `, ${skipped} skipped` : ""}`;
  }
  if (activeLanguage === "ja") {
    return `ユーザーインポート完了: 作成 ${created}、更新 ${updated}${skipped > 0 ? `、スキップ ${skipped}` : ""}`;
  }
  return `用户导入完成：新增 ${created}，更新 ${updated}${skipped > 0 ? `，跳过 ${skipped}` : ""}`;
}

function importUsersSkippedMessage(skipped: number, errors: string) {
  if (activeLanguage === "en") return `${skipped} rows were not imported: ${errors}`;
  if (activeLanguage === "ja") return `${skipped} 件はインポートされませんでした: ${errors}`;
  return `有 ${skipped} 条未导入：${errors}`;
}

function deleteConfirmMessage(name: string) {
  if (activeLanguage === "en") return `After deleting "${name}", the current in-memory data will be removed immediately.`;
  if (activeLanguage === "ja") return `「${name}」を削除すると、現在のメモリ上のデータはすぐに削除されます。`;
  return `删除「${name}」后，当前内存数据会立即移除。`;
}

function routeAttemptCountText(count: number) {
  if (count > 1) {
    if (activeLanguage === "en") return `${formatNumber(count)} attempts, with fallback`;
    if (activeLanguage === "ja") return `${formatNumber(count)} 回、fallback 含む`;
    return `${formatNumber(count)} 次，含 fallback`;
  }
  return countWithUnit(count, "次", "attempt", "回");
}

type NavGroup = {
  title: string;
  items: NavItem[];
};

const userNavGroups: NavGroup[] = [
  {
    title: "开始使用",
    items: [
      { view: "overview", label: "总览", icon: LayoutDashboard },
      { view: "gateway", label: "接口文档", icon: Sparkles },
      { view: "playground", label: "模型演练场", icon: Send },
    ],
  },
  {
    title: "我的资源",
    items: [
      { view: "api-keys", label: "Key 管理", icon: KeyRound },
      { view: "models", label: "可用模型", icon: Boxes },
    ],
  },
  {
    title: "我的用量",
    items: [
      { view: "usage", label: "用量统计", icon: BarChart3 },
      { view: "audit", label: "请求日志", icon: FileText },
    ],
  },
];

const teamLeaderNavGroups: NavGroup[] = [
  {
    title: "团队工作台",
    items: [
      { view: "overview", label: "团队总览", icon: LayoutDashboard },
      { view: "usage", label: "团队报表", icon: BarChart3 },
      { view: "billing", label: "成本归因", icon: WalletCards },
    ],
  },
  {
    title: "项目治理",
    items: [
      { view: "projects", label: "项目空间", icon: LayoutDashboard },
      { view: "api-keys", label: "Key 管理", icon: KeyRound },
      { view: "models", label: "可用模型", icon: Boxes },
      { view: "approvals", label: "审批记录", icon: ShieldCheck },
    ],
  },
  {
    title: "团队管理",
    items: [
      { view: "users", label: "团队成员", icon: Users },
      { view: "teams", label: "团队信息", icon: Users },
      { view: "audit", label: "请求日志", icon: FileText },
      { view: "gateway", label: "接口文档", icon: Sparkles },
    ],
  },
];

const adminNavGroups: NavGroup[] = [
  {
    title: "平台工作台",
    items: [
      { view: "overview", label: "平台总览", icon: LayoutDashboard },
      { view: "usage", label: "全局用量", icon: BarChart3 },
      { view: "reports", label: "导出报表", icon: BarChart3 },
    ],
  },
  {
    title: "AI 资源",
    items: [
      { view: "providers", label: "Provider 渠道", icon: Server },
      { view: "models", label: "模型目录", icon: Boxes },
      { view: "routes", label: "路由策略", icon: Gauge },
    ],
  },
  {
    title: "组织治理",
    items: [
      { view: "projects", label: "项目空间", icon: LayoutDashboard },
      { view: "api-keys", label: "Key 管理", icon: KeyRound },
      { view: "teams", label: "团队分组", icon: Users },
      { view: "users", label: "用户管理", icon: Users },
      { view: "approvals", label: "审批记录", icon: ShieldCheck },
    ],
  },
  {
    title: "成本治理",
    items: [
      { view: "billing", label: "成本账单", icon: WalletCards },
      { view: "cost-centers", label: "成本中心", icon: Database },
    ],
  },
  {
    title: "健康与告警",
    items: [
      { view: "monitors", label: "健康检测", icon: Activity },
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

const securityNavGroups: NavGroup[] = [
  {
    title: "安全审计",
    items: [
      { view: "overview", label: "安全总览", icon: LayoutDashboard },
      { view: "usage", label: "用量统计", icon: BarChart3 },
      { view: "audit", label: "请求日志", icon: FileText },
      { view: "approvals", label: "审批记录", icon: ShieldCheck },
      { view: "security-policies", label: "安全策略", icon: ShieldCheck },
    ],
  },
  {
    title: "告警",
    items: [
      { view: "alerts", label: "告警规则", icon: AlertCircle },
      { view: "alert-events", label: "告警事件", icon: AlertCircle },
      { view: "notification-channels", label: "通知渠道", icon: Bell },
      { view: "alert-deliveries", label: "通知记录", icon: Bell },
    ],
  },
  {
    title: "接入参考",
    items: [
      { view: "gateway", label: "接口文档", icon: Sparkles },
    ],
  },
];

const navGroupsByRole: Record<AppRole, NavGroup[]> = {
  admin: adminNavGroups,
  security: securityNavGroups,
  team_leader: teamLeaderNavGroups,
  user: userNavGroups,
};

const allNavGroupTitles = Array.from(new Set(Object.values(navGroupsByRole).flatMap((groups) => groups.map((group) => group.title))));

const standaloneViewMeta: Partial<Record<ViewKey, { title: string; description: string }>> = {
  overview: {
    title: "网关概览",
    description: "",
  },
  playground: {
    title: "模型演练场",
    description: "选择标准模型，按当前路由策略发起测试对话，验证 Provider、路由和返回内容。",
  },
  gateway: {
    title: "接口文档",
    description: "面向业务开发者的模型 API 调用说明、认证方式、示例代码和错误排查。",
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
    title: "请求日志",
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
    description: "处理 Key 发放、额度提升和模型开通等治理审批。",
  },
};

const roleViewAccess: Record<AppRole, ViewKey[]> = {
  admin: (Object.keys(viewRoutes) as ViewKey[]).filter(
    (view) => view !== "project-members" && view !== "quota-policies" && view !== "approval-flows" && view !== "budgets" && view !== "chargebacks" && view !== "invoices",
  ),
  security: ["overview", "gateway", "usage", "audit", "alerts", "alert-events", "notification-channels", "alert-deliveries", "security-policies", "approvals"],
  team_leader: ["overview", "gateway", "playground", "models", "projects", "api-keys", "teams", "users", "usage", "billing", "audit", "approvals"],
  user: ["overview", "gateway", "playground", "models", "api-keys", "usage", "audit"],
};

function appRole(role: string): AppRole {
  const normalized = String(role || "").trim().toLowerCase();
  if (normalized === "admin" || normalized === "system_admin") return "admin";
  if (normalized === "security" || normalized === "security_admin") return "security";
  if (normalized === "team_leader" || normalized === "teamlead" || normalized === "project_admin") return "team_leader";
  return "user";
}

function canAccessView(user: AdminUser, view: ViewKey) {
  return roleViewAccess[appRole(user.role)].includes(view);
}

function navGroupsForUser(user: AdminUser) {
  return navGroupsByRole[appRole(user.role)];
}

function isNavParentItem(item: NavItem): item is NavParentItem {
  return "children" in item;
}

function filterNavItemByAccess(item: NavItem, user: AdminUser): NavItem | null {
  if (isNavParentItem(item)) {
    const children = item.children.filter((child) => canAccessView(user, child.view));
    return children.length > 0 ? { ...item, children } : null;
  }
  return canAccessView(user, item.view) ? item : null;
}

function isNavItemActive(item: NavItem, activeView: ViewKey) {
  if (isNavParentItem(item)) {
    return item.children.some((child) => child.view === activeView);
  }
  return item.view === activeView;
}

function canViewAdminAudit(user: AdminUser) {
  const role = appRole(user.role);
  return role === "admin" || role === "security";
}

function defaultViewForRole(user: AdminUser): ViewKey {
  return roleViewAccess[appRole(user.role)][0] ?? "overview";
}

type LoadPlan = {
  overview: boolean;
  providers: boolean;
  providerResources: boolean;
  keys: boolean;
  routes: boolean;
  logs: boolean;
  auditEvents: boolean;
  alerts: boolean;
  alertDeliveries: boolean;
  approvals: boolean;
  sqliteBackups: boolean;
  breakdown: boolean;
  timeseries: boolean;
  users: boolean;
  providerCatalog: boolean;
  resources: string[];
};

type LoadedData = Partial<Omit<AppData, "resources">> & {
  resources?: Record<string, AdminResource[]>;
};

function emptyLoadPlan(): LoadPlan {
  return {
    overview: false,
    providers: false,
    providerResources: false,
    keys: false,
    routes: false,
    logs: false,
    auditEvents: false,
    alerts: false,
    alertDeliveries: false,
    approvals: false,
    sqliteBackups: false,
    breakdown: false,
    timeseries: false,
    users: false,
    providerCatalog: false,
    resources: [],
  };
}

function addResourceDependency(plan: LoadPlan, kind: string) {
  if (!plan.resources.includes(kind)) {
    plan.resources.push(kind);
  }
}

function loadPlanForView(user: AdminUser, view: ViewKey): LoadPlan {
  const plan = emptyLoadPlan();
  const can = (target: ViewKey) => canAccessView(user, target);

  switch (view) {
    case "overview":
      plan.overview = true;
      plan.breakdown = true;
      plan.timeseries = true;
      addResourceDependency(plan, "announcements");
      break;
    case "playground":
      plan.overview = true;
      plan.routes = can("routes");
      break;
    case "gateway":
      plan.overview = true;
      plan.keys = can("api-keys");
      plan.routes = can("routes");
      plan.logs = can("audit");
      break;
    case "usage":
      plan.overview = true;
      plan.breakdown = true;
      plan.timeseries = true;
      plan.users = can("users") || appRole(user.role) === "team_leader";
      if (appRole(user.role) !== "user") {
        addResourceDependency(plan, "teams");
        addResourceDependency(plan, "cost-centers");
      }
      break;
    case "billing":
      plan.breakdown = true;
      plan.users = appRole(user.role) === "team_leader";
      break;
    case "audit":
      plan.overview = true;
      plan.keys = can("api-keys");
      plan.logs = true;
      plan.auditEvents = canViewAdminAudit(user);
      break;
    case "providers":
      plan.providers = true;
      plan.overview = true;
      plan.routes = true;
      plan.providerCatalog = true;
      break;
    case "models":
      plan.overview = true;
      plan.routes = can("routes");
      break;
    case "routes":
      plan.overview = true;
      plan.routes = true;
      break;
    case "projects":
      plan.overview = true;
      plan.logs = true;
      plan.users = can("users") || appRole(user.role) === "team_leader";
      plan.approvals = can("approvals");
      addResourceDependency(plan, "teams");
      addResourceDependency(plan, "cost-centers");
      addResourceDependency(plan, "quota-policies");
      break;
    case "project-members":
      plan.overview = true;
      plan.users = true;
      addResourceDependency(plan, "teams");
      addResourceDependency(plan, "project-members");
      break;
    case "api-keys":
      plan.overview = true;
      plan.keys = true;
      plan.users = can("users") || appRole(user.role) === "team_leader";
      if (appRole(user.role) !== "user") {
        addResourceDependency(plan, "teams");
      }
      addResourceDependency(plan, "project-members");
      break;
    case "teams":
      plan.users = true;
      addResourceDependency(plan, "teams");
      addResourceDependency(plan, "cost-centers");
      break;
    case "users":
      plan.users = true;
      addResourceDependency(plan, "teams");
      addResourceDependency(plan, "role-configs");
      break;
    case "settings":
      addResourceDependency(plan, "settings");
      addResourceDependency(plan, "role-configs");
      addResourceDependency(plan, "identity-providers");
      break;
    case "quota-policies":
    case "cost-centers":
    case "budgets":
    case "chargebacks":
    case "approval-flows":
    case "invoices":
    case "reports":
    case "notification-channels":
    case "monitors":
    case "proxies":
    case "announcements":
    case "security-policies":
    case "identity-providers":
      addResourceDependency(plan, view);
      break;
    case "alerts":
      addResourceDependency(plan, "alert-rules");
      break;
    case "alert-events":
      plan.alerts = true;
      break;
    case "alert-deliveries":
      plan.alertDeliveries = true;
      break;
    case "approvals":
      plan.approvals = true;
      break;
    case "sqlite-backups":
      plan.sqliteBackups = true;
      break;
  }

  return plan;
}

function mergeLoadedData(current: AppData, loaded: LoadedData): AppData {
  return {
    ...current,
    summary: loaded.summary ?? current.summary,
    projects: loaded.projects ?? current.projects,
    providers: loaded.providers ?? current.providers,
    providerResources: loaded.providerResources ?? current.providerResources,
    models: loaded.models ?? current.models,
    routes: loaded.routes ?? current.routes,
    logs: loaded.logs ?? current.logs,
    auditEvents: loaded.auditEvents ?? current.auditEvents,
    alerts: loaded.alerts ?? current.alerts,
    alertDeliveries: loaded.alertDeliveries ?? current.alertDeliveries,
    approvals: loaded.approvals ?? current.approvals,
    sqliteBackups: loaded.sqliteBackups ?? current.sqliteBackups,
    users: loaded.users ?? current.users,
    breakdown: loaded.breakdown ?? current.breakdown,
    timeseries: loaded.timeseries ?? current.timeseries,
    keys: loaded.keys ?? current.keys,
    providerCatalog: loaded.providerCatalog ?? current.providerCatalog,
    resources: loaded.resources ? { ...current.resources, ...loaded.resources } : current.resources,
  };
}

export default function AdminHome() {
  const [language, setLanguage] = useState<AppLanguage>(() => readSavedLanguage());
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [baseURL, setBaseURL] = useState(defaultBaseURL);
  const [adminToken, setAdminToken] = useState("");
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [loginIdentityProviders, setLoginIdentityProviders] = useState<LoginIdentityProvider[]>([]);
  const [oauthReturnURL, setOAuthReturnURL] = useState(viewRoutes.overview);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openNavGroups, setOpenNavGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(allNavGroupTitles.map((title) => [title, true])),
  );
  const [activeView, setActiveView] = useState<ViewKey>(() => initialView());
  const [data, setData] = useState<AppData>(emptyData());
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [modelCategoryFilter, setModelCategoryFilter] = useState("all");
  const [settingsTab, setSettingsTab] = useState<SettingsTabKey>("settings");
  const [modal, setModal] = useState<ModalState<any> | null>(null);
  const [providerCreateOpen, setProviderCreateOpen] = useState(false);
  const [providerEditItem, setProviderEditItem] = useState<Provider | null>(null);
  const [userImportOpen, setUserImportOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmState<any> | null>(null);
  const [issuedKey, setIssuedKey] = useState("");
  const [reportHistory, setReportHistory] = useState<ReportExportHistoryItem[]>([]);

  const api = useMemo(() => ({ baseURL, adminToken }), [baseURL, adminToken]);
  const activeConfig = resourceConfigs[activeView];
  const activeMeta = activeConfig ?? standaloneViewMeta[activeView] ?? standaloneViewMeta.overview!;
  setActiveLanguage(language);

  function changeLanguage(nextLanguage: AppLanguage) {
    setLanguage(nextLanguage);
  }

  function toggleTheme() {
    setTheme((value) => (value === "light" ? "dark" : "light"));
  }

  function selectView(view: ViewKey, options: { replace?: boolean } = {}) {
    if (view !== activeView) {
      setNotice("");
      setError("");
      setIssuedKey("");
      setModelCategoryFilter(view === "notification-channels" ? "webhook" : "all");
    }
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
    let cancelled = false;
    async function bootstrapSession() {
      const saved = readSavedSession();
      const oauth = readOAuthLoginResult();
      const sessionBaseURL = saved?.baseURL ?? defaultBaseURL;
      if (oauth?.error) {
        clearOAuthLoginResult();
        setError(tx("OAuth 登录失败"));
      }
      if (oauth?.token) {
        setBaseURL(sessionBaseURL);
        setLoading(true);
        try {
          const resp = await fetch(`${sessionBaseURL.replace(/\/$/, "")}/api/admin/auth/me`, {
            headers: { authorization: `Bearer ${oauth.token}` },
          });
          if (!resp.ok) throw new Error(`oauth me ${resp.status}`);
          const payload = (await resp.json()) as { user: AdminUser };
          const expiresAt = oauth.expiresAt || new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
          if (cancelled) return;
          setData(emptyData());
          setAdminToken(oauth.token);
          setCurrentUser(payload.user);
          saveSession({ baseURL: sessionBaseURL, token: oauth.token, user: payload.user, expiresAt });
          setError("");
        } catch (err) {
          if (!cancelled) setError(err instanceof Error ? err.message : tx("OAuth 登录失败"));
        } finally {
          clearOAuthLoginResult();
          if (!cancelled) {
            setLoading(false);
            setBootstrapped(true);
          }
        }
        return;
      }
      if (saved) {
        setBaseURL(saved.baseURL);
        setAdminToken(saved.token);
        setCurrentUser(saved.user);
      }
      setBootstrapped(true);
    }
    void bootstrapSession();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOAuthReturnURL(`${window.location.origin}${viewRoutes.overview}`);
    }
  }, []);

  useEffect(() => {
    if (!bootstrapped || currentUser) return;
    let cancelled = false;
    async function loadLoginIdentityProviders() {
      try {
        const resp = await fetch(`${baseURL.replace(/\/$/, "")}/api/admin/auth/identity-providers`);
        if (!resp.ok) {
          if (!cancelled) setLoginIdentityProviders([]);
          return;
        }
        const payload = (await resp.json()) as { data?: LoginIdentityProvider[] };
        if (!cancelled) setLoginIdentityProviders(payload.data ?? []);
      } catch {
        if (!cancelled) setLoginIdentityProviders([]);
      }
    }
    void loadLoginIdentityProviders();
    return () => {
      cancelled = true;
    };
  }, [baseURL, bootstrapped, currentUser]);

  useEffect(() => {
    setActiveLanguage(language);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(languageStorageKey, language);
      document.documentElement.lang = language === "zh-CN" ? "zh-CN" : language;
    }
  }, [language]);

  useEffect(() => {
    if (!bootstrapped || !adminToken || !currentUser) return;
    if (!canAccessView(currentUser, activeView)) return;
    void load(activeView);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrapped, adminToken, currentUser, activeView]);

  useEffect(() => {
    if (activeView === "notification-channels" && !notificationChannelTypes.includes(modelCategoryFilter)) {
      setModelCategoryFilter("webhook");
    }
  }, [activeView, modelCategoryFilter]);

  useEffect(() => {
    if (!currentUser) return;
    if (!canAccessView(currentUser, activeView)) {
      selectView(defaultViewForRole(currentUser), { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, activeView]);

  useEffect(() => {
    if (!currentUser || typeof window === "undefined") return;
    if (!canAccessView(currentUser, activeView)) return;
    const expectedPath = viewRoutes[activeView];
    if (window.location.pathname !== expectedPath) {
      window.history.replaceState({ view: activeView }, "", expectedPath);
    }
  }, [currentUser, activeView]);

  useEffect(() => {
    const view = viewFromPath(window.location.pathname);
    setActiveView(view);
    if (window.location.pathname !== viewRoutes[view]) {
      window.history.replaceState({ view }, "", viewRoutes[view]);
    }
    function onPopState() {
      setNotice("");
      setError("");
      const nextView = viewFromPath(window.location.pathname);
      setModelCategoryFilter(nextView === "notification-channels" ? "webhook" : "all");
      setActiveView(nextView);
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
      setUserImportOpen(false);
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
      if (!detail) return;
      if (isIssuedAPIKey(detail)) {
        setNotice("");
        setIssuedKey(detail);
      } else {
        setIssuedKey("");
        setNotice(detail);
      }
    }
    window.addEventListener("tokenhub-issued-key", onIssuedKey);
    return () => window.removeEventListener("tokenhub-issued-key", onIssuedKey);
  }, []);

  async function load(view: ViewKey = activeView) {
    if (!adminToken || !currentUser) return;
    if (!canAccessView(currentUser, view)) return;
    setLoading(true);
    setError("");
    try {
      const plan = loadPlanForView(currentUser, view);
      const requests: Array<{ name: string; request: Promise<Response> }> = [];
      const queue = (enabled: boolean, name: string, path: string) => {
        if (enabled) requests.push({ name, request: adminFetch(api, path) });
      };

      queue(plan.overview, "overview", "/api/admin/overview");
      queue(plan.providers, "providers", "/api/admin/providers");
      queue(plan.providerResources, "provider-resources", "/api/admin/provider-resources");
      queue(plan.keys, "api-keys", "/api/admin/api-keys");
      queue(plan.routes, "routes", "/api/admin/routing-rules");
      queue(plan.logs, "audit", "/api/admin/audit/requests");
      queue(plan.auditEvents, "audit-events", "/api/admin/audit/events");
      queue(plan.alerts, "alerts", "/api/admin/alerts");
      queue(plan.alertDeliveries, "alert-deliveries", "/api/admin/alert-deliveries");
      queue(plan.approvals, "approvals", "/api/admin/approvals");
      queue(plan.sqliteBackups, "sqlite-backups", "/api/admin/sqlite/backups");
      queue(plan.breakdown, "breakdown", "/api/admin/usage/breakdown");
      queue(plan.timeseries, "timeseries", "/api/admin/usage/timeseries");
      queue(plan.users, "users", "/api/admin/users");
      queue(plan.providerCatalog, "provider-catalog", "/api/admin/provider-catalog");
      for (const kind of plan.resources) {
        requests.push({ name: `resource:${kind}`, request: adminFetch(api, `/api/admin/resources/${kind}`) });
      }

      const responses = await Promise.all(requests.map((item) => item.request));
      for (let index = 0; index < responses.length; index += 1) {
        const resp = responses[index];
        if (!resp.ok) {
          throw new Error(`${requests[index].name} ${resp.status}`);
        }
      }

      const loaded: LoadedData = {};
      for (let index = 0; index < responses.length; index += 1) {
        const name = requests[index].name;
        const resp = responses[index];
        if (name === "overview") {
          const overview = await resp.json();
          loaded.summary = overview.summary ?? emptySummary();
          loaded.projects = overview.projects ?? [];
          loaded.providers = overview.providers ?? [];
          loaded.providerResources = overview.provider_resources ?? [];
          loaded.models = overview.models ?? [];
          loaded.alerts = overview.alerts ?? [];
        } else if (name === "providers") {
          const payload = (await resp.json()) as { data: Provider[] };
          loaded.providers = payload.data ?? [];
        } else if (name === "provider-resources") {
          const payload = (await resp.json()) as { data: ProviderResource[] };
          loaded.providerResources = payload.data ?? [];
        } else if (name === "api-keys") {
          const payload = (await resp.json()) as { data: APIKey[] };
          loaded.keys = payload.data ?? [];
        } else if (name === "routes") {
          const payload = (await resp.json()) as { data: ModelRoute[] };
          loaded.routes = payload.data ?? [];
        } else if (name === "audit") {
          const payload = (await resp.json()) as { data: RequestLog[] };
          loaded.logs = payload.data ?? [];
        } else if (name === "audit-events") {
          const payload = (await resp.json()) as { data: AuditEvent[] };
          loaded.auditEvents = payload.data ?? [];
        } else if (name === "alerts") {
          const payload = (await resp.json()) as { data: AlertEvent[] };
          loaded.alerts = payload.data ?? [];
        } else if (name === "alert-deliveries") {
          const payload = (await resp.json()) as { data: AlertDelivery[] };
          loaded.alertDeliveries = payload.data ?? [];
        } else if (name === "approvals") {
          const payload = (await resp.json()) as { data: ApprovalRequest[] };
          loaded.approvals = payload.data ?? [];
        } else if (name === "sqlite-backups") {
          const payload = (await resp.json()) as { data: SQLiteBackup[] };
          loaded.sqliteBackups = payload.data ?? [];
        } else if (name === "breakdown") {
          loaded.breakdown = (await resp.json()) as UsageBreakdown;
        } else if (name === "timeseries") {
          const payload = (await resp.json()) as { data: UsagePoint[] };
          loaded.timeseries = payload.data ?? [];
        } else if (name === "users") {
          const payload = (await resp.json()) as { data: AdminUser[] };
          loaded.users = payload.data ?? [];
        } else if (name === "provider-catalog") {
          const payload = (await resp.json()) as { data: ProviderCatalogEntry[] };
          loaded.providerCatalog = payload.data ?? [];
        } else if (name.startsWith("resource:")) {
          const kind = name.slice("resource:".length);
          const payload = (await resp.json()) as { data: AdminResource[] };
          loaded.resources = { ...(loaded.resources ?? {}), [kind]: payload.data ?? [] };
        }
      }

      setData((current) => mergeLoadedData(current, loaded));
    } catch (err) {
      if (isAuthExpiredError(err)) return;
      setError(err instanceof Error ? err.message : tx("连接失败"));
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
      setData(emptyData());
      setAdminToken(payload.token);
      setCurrentUser(payload.user);
      saveSession({ baseURL, token: payload.token, user: payload.user, expiresAt: payload.expires_at });
    } catch (err) {
      setError(err instanceof Error ? err.message : tx("登录失败"));
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
    setUserImportOpen(false);
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
      setError(err instanceof Error ? err.message : tx("保存失败"));
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
      setIssuedKey("");
      setConfirmDelete(null);
      await load();
    } catch (err) {
      if (isAuthExpiredError(err)) return;
      setError(err instanceof Error ? err.message : tx("删除失败"));
    } finally {
      setLoading(false);
    }
  }

  async function importUsersFromCSV(content: string) {
    const trimmed = content.trim();
    if (!trimmed) {
      setNotice("");
      setError(tx("请先粘贴 CSV 内容。"));
      return;
    }
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const result = await importUsersFromCSVContent(api, trimmed);
      const created = result.created ?? 0;
      const updated = result.updated ?? 0;
      const skipped = result.skipped ?? 0;
      setUserImportOpen(false);
      await load("users");
      setNotice(importUsersDoneMessage(created, updated, skipped));
      if (skipped > 0 && result.errors?.length) {
        setError(importUsersSkippedMessage(skipped, result.errors.slice(0, 3).join("；")));
      }
    } catch (err) {
      if (isAuthExpiredError(err)) return;
      setError(err instanceof Error ? err.message : tx("用户导入失败"));
    } finally {
      setLoading(false);
    }
  }

  function openCreateRoute() {
    if (!activeConfig) return;
    if (loading) {
      setNotice("");
      setError(tx("数据加载中，请稍后再操作。"));
      return;
    }
    if (data.models.length === 0) {
      setNotice("");
      setError(tx("请先维护模型目录，再新增路由策略。"));
      selectView("models");
      return;
    }
    if (data.providers.length === 0) {
      setNotice("");
      setError(tx("请先新增 Provider 渠道，再配置路由策略。"));
      selectView("providers");
      return;
    }
    setModal({ config: activeConfig });
  }

  function openCreateForCurrentView() {
    if (!activeConfig) return;
    if (activeView === "routes") {
      openCreateRoute();
      return;
    }
    if (loading) {
      setNotice("");
      setError(tx("数据加载中，请稍后再操作。"));
      return;
    }
    if (activeConfig.view === "providers") {
      setProviderCreateOpen(true);
      return;
    }
    if (activeConfig.view === "api-keys" && data.projects.length === 0) {
      setNotice("");
      setError(tx("请先创建项目，再在项目下发放 API Key。"));
      selectView("projects");
      return;
    }
    if (activeConfig.view === "notification-channels") {
      setModal({ config: activeConfig, initialValues: notificationChannelDefaults(modelCategoryFilter) });
      return;
    }
    if (activeConfig.view === "api-keys") {
      setIssuedKey("");
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
      setNotice(tx(`已更新 ${model.name} 的 Provider 调用顺序`));
      await load();
    } catch (err) {
      if (isAuthExpiredError(err)) return;
      setError(err instanceof Error ? err.message : tx("更新路由顺序失败"));
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
        baseURL={baseURL}
        identityProviders={loginIdentityProviders}
        oauthReturnURL={oauthReturnURL}
        theme={theme}
        onThemeToggle={toggleTheme}
        onLogin={(identity, password) => void login(identity, password)}
      />
    );
  }

  return (
    <main className={sidebarCollapsed ? "app-shell sidebar-collapsed" : "app-shell"} data-theme={theme}>
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
        <TopNav
          theme={theme}
          onThemeToggle={toggleTheme}
        />

        <div className={activeView === "playground" ? "content-panel playground-content-panel" : "content-panel"}>
          {activeView === "playground" || activeView === "overview" ? null : (
            <header className="page-header">
              <div>
                <p className="eyebrow">Enterprise AI Gateway</p>
                <h1>{tx(activeMeta.title)}</h1>
              </div>
            </header>
          )}

          {error ? <div className="status-line error">{error}</div> : null}
          {notice ? <div className="status-line success">{notice}</div> : null}

          {activeView === "playground" ? null : <div className="divider" />}

          {activeView === "overview" ? (
            <OverviewView data={data} user={currentUser} />
          ) : activeView === "playground" ? (
            <PlaygroundPage api={api} data={data} canViewRoutes={canAccessView(currentUser, "routes")} />
          ) : activeView === "gateway" ? (
            <GatewayView api={api} data={data} />
          ) : activeView === "usage" ? (
            <UsageView data={data} user={currentUser} />
          ) : activeView === "billing" ? (
            <BillingView data={data} user={currentUser} />
          ) : activeView === "audit" ? (
            <AuditView api={api} data={data} user={currentUser} />
          ) : activeView === "settings" ? (
            <SettingsView
              data={data}
              activeTab={settingsTab}
              language={language}
              onTabChange={setSettingsTab}
              onLanguageChange={changeLanguage}
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
              readOnly={!canAccessView(currentUser, "routes")}
              onCreate={() => setModal({ config: activeConfig })}
              onEdit={(item) => setModal({ config: activeConfig, item })}
              onDelete={(item) => setConfirmDelete({ config: activeConfig, item })}
              onAction={(action, item) => void runResourceAction(action, item, data)}
            />
          ) : activeView === "reports" && activeConfig ? (
            <ReportsView
              config={activeConfig as ResourceConfig<AdminResource>}
              data={data}
              history={reportHistory}
              loading={loading}
              onCreate={() => setModal({ config: activeConfig })}
              onEdit={(item) => setModal({ config: activeConfig, item })}
              onDelete={(item) => setConfirmDelete({ config: activeConfig, item })}
              onAction={(action, item) => void runResourceAction(action, item, data)}
              onExport={(dataset) => void exportReportDataset(dataset)}
            />
          ) : activeConfig ? (
            <CrudView
              config={activeConfig}
              data={data}
              items={pagedItems}
              totalItems={filteredItems.length}
              query={query}
              pagination={crudPagination}
              categoryFilter={modelCategoryFilter}
              onCategoryFilter={setModelCategoryFilter}
              onQuery={setQuery}
              onCreate={openCreateForCurrentView}
              onEdit={(item) => {
                if (activeConfig.view === "providers") {
                  setProviderEditItem(item as Provider);
                  return;
                }
                setModal({ config: activeConfig, item });
              }}
              onDelete={(item) => setConfirmDelete({ config: activeConfig, item })}
              onAction={(action, item) => void runResourceAction(action, item, data)}
              onProjectMemberCreate={(project) => setModal({ config: projectMemberConfig(), initialValues: projectMemberInitialValues(project) })}
              onProjectMemberEdit={(member) => setModal({ config: projectMemberConfig(), item: member })}
              onProjectMemberDelete={(member) => setConfirmDelete({ config: projectMemberConfig(), item: member })}
              onToolbarAction={(action) => void runToolbarAction(action, filteredItems)}
            />
          ) : null}
        </div>
      </section>

      {modal ? (
        <EditModal
          state={modal}
          data={data}
          currentUser={currentUser}
          loading={loading}
          onClose={() => setModal(null)}
          onSave={(values) => {
            if (modal.config.view === "api-keys" && !modal.item) {
              void createKeyWithCapture(api, values, setIssuedKey, setNotice, load, setLoading, setError, setModal);
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

      {userImportOpen ? (
        <UserImportModal
          loading={loading}
          onClose={() => setUserImportOpen(false)}
          onImport={(content) => void importUsersFromCSV(content)}
        />
      ) : null}

      {confirmDelete ? (
        <ConfirmDialog
          title={tx("确认删除")}
          message={deleteConfirmMessage(rowTitle(confirmDelete.item))}
          loading={loading}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => void deleteItem(confirmDelete.config, confirmDelete.item)}
        />
      ) : null}

      {issuedKey ? (
        <IssuedKeyModal
          value={issuedKey}
          onClose={() => setIssuedKey("")}
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
      setNotice(tx(action.doneMessage?.(item) ?? "操作已完成"));
      await load();
    } catch (err) {
      if (isAuthExpiredError(err)) return;
      setError(err instanceof Error ? err.message : tx("操作失败"));
    } finally {
      setLoading(false);
    }
  }

  async function runToolbarAction(action: ToolbarAction, items: unknown[]) {
    if (action.kind === "import-users") {
      setError("");
      setNotice("");
      setUserImportOpen(true);
      return;
    }
    if (!action.run) return;
    setLoading(true);
    setError("");
    setNotice("");
    try {
      await action.run(api, items);
      setNotice(tx(action.doneMessage?.() ?? "操作已完成"));
      await load();
    } catch (err) {
      if (isAuthExpiredError(err)) return;
      setError(err instanceof Error ? err.message : tx("操作失败"));
    } finally {
      setLoading(false);
    }
  }

  async function exportReportDataset(dataset: string) {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const result = await downloadReport(api, dataset);
      if (result) {
        setNotice(tx(`${reportDatasetLabel(dataset)} 已导出`));
        setReportHistory((current) => [
          {
            id: uniqueUIID("export"),
            dataset,
            file_name: result.fileName,
            period: result.period,
            exported_at: new Date().toISOString(),
          },
          ...current,
        ].slice(0, 8));
      }
    } catch (err) {
      if (isAuthExpiredError(err)) return;
      setError(err instanceof Error ? err.message : tx("导出失败"));
    } finally {
      setLoading(false);
    }
  }
}

const identityProviderIconOptions = [
  "auto",
  "gitlab",
  "github",
  "google",
  "microsoft",
  "okta",
  "keycloak",
  "oidc",
  "oauth2",
  "saml",
  "ldap",
  "sso",
];

type LoginIdentityProviderIconComponent = React.ComponentType<{ size?: number }>;

function identityProviderLoginURL(baseURL: string, provider: LoginIdentityProvider, returnURL: string) {
  const target = new URL(`${baseURL.replace(/\/$/, "")}/api/admin/auth/oauth/start`);
  target.searchParams.set("id", provider.id);
  target.searchParams.set("return_url", returnURL);
  return target.toString();
}

function loginIdentityProviderDisplayName(provider: LoginIdentityProvider) {
  if (provider.display_name) return provider.display_name;
  const iconKey = loginIdentityProviderIconKey(provider);
  const label = identityProviderIconLabel(iconKey);
  if (label !== "自动" && label !== "SSO" && label !== "OIDC" && label !== "OAuth2" && label !== "SAML" && label !== "LDAP") {
    return label;
  }
  return provider.name;
}

function LoginIdentityProviderIcon({ provider }: { provider: LoginIdentityProvider }) {
  const iconKey = loginIdentityProviderIconKey(provider);
  const iconConfig = loginIdentityProviderIconConfig(iconKey);
  const Icon = iconConfig.icon;
  return (
    <span className={`login-sso-icon ${iconConfig.key}`} aria-hidden="true">
      <Icon size={15} />
    </span>
  );
}

function loginIdentityProviderIconKey(provider: LoginIdentityProvider) {
  const configured = normalizedIdentityProviderIconKey(provider.icon_key);
  if (configured && configured !== "auto") return configured;
  const providerType = stringifyValue(provider.provider_type).trim().toLowerCase();
  const fingerprint = `${provider.name} ${provider.issuer_url ?? ""} ${providerType}`.toLowerCase();
  for (const key of ["gitlab", "github", "google", "microsoft", "azure", "entra", "okta", "keycloak"]) {
    if (fingerprint.includes(key)) {
      return key === "azure" || key === "entra" ? "microsoft" : key;
    }
  }
  return normalizedIdentityProviderIconKey(providerType) || "sso";
}

function normalizedIdentityProviderIconKey(value: string | undefined) {
  const normalized = stringifyValue(value).trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  return identityProviderIconOptions.includes(normalized) ? normalized : "";
}

function GoogleBrandIcon({ size = 15 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path fill="#4285f4" d="M22.6 12.2c0-.8-.1-1.6-.2-2.3H12v4.4h5.9c-.3 1.4-1.1 2.6-2.3 3.4v2.8h3.7c2.1-2 3.3-4.8 3.3-8.3z" />
      <path fill="#34a853" d="M12 23c3 0 5.5-1 7.3-2.6l-3.7-2.8c-1 .7-2.2 1.1-3.6 1.1-2.8 0-5.2-1.9-6.1-4.5H2.1V17C3.9 20.6 7.6 23 12 23z" />
      <path fill="#fbbc05" d="M5.9 14.2c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2V7H2.1C1.4 8.5 1 10.2 1 12s.4 3.5 1.1 5l3.8-2.8z" />
      <path fill="#ea4335" d="M12 5.3c1.6 0 3.1.6 4.2 1.7l3.2-3.2C17.5 2 15 1 12 1 7.6 1 3.9 3.4 2.1 7l3.8 2.8C6.8 7.2 9.2 5.3 12 5.3z" />
    </svg>
  );
}

function GitLabBrandIcon({ size = 15 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path fill="#fc6d26" d="M12 22 3.2 8.7h5.3L12 22z" />
      <path fill="#e24329" d="M3.2 8.7 4.8 3.9c.2-.6 1-.6 1.2 0l2.5 4.8H3.2z" />
      <path fill="#fca326" d="M12 22 20.8 8.7h-5.3L12 22z" />
      <path fill="#e24329" d="m20.8 8.7-1.6-4.8c-.2-.6-1-.6-1.2 0l-2.5 4.8h5.3z" />
      <path fill="#fc6d26" d="M8.5 8.7h7L12 22 8.5 8.7z" />
    </svg>
  );
}

function GitHubBrandIcon({ size = 15 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 1.8C6.4 1.8 1.8 6.4 1.8 12c0 4.5 2.9 8.3 7 9.7.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.2-3.4-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 0 1.6 1.1 1.6 1.1.9 1.6 2.4 1.1 2.9.9.1-.7.4-1.1.7-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1.1-2.8-.1-.3-.5-1.3.1-2.7 0 0 .9-.3 2.9 1.1.8-.2 1.7-.3 2.6-.3s1.8.1 2.6.3c2-1.4 2.9-1.1 2.9-1.1.6 1.4.2 2.4.1 2.7.7.8 1.1 1.7 1.1 2.8 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.8v2.6c0 .3.2.6.7.5 4.1-1.4 7-5.2 7-9.7C22.2 6.4 17.6 1.8 12 1.8z"
      />
    </svg>
  );
}

function MicrosoftBrandIcon({ size = 15 }: { size?: number }) {
  const gap = 1.2;
  const cell = (24 - gap) / 2;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <rect x="0" y="0" width={cell} height={cell} fill="#f25022" />
      <rect x={cell + gap} y="0" width={cell} height={cell} fill="#7fba00" />
      <rect x="0" y={cell + gap} width={cell} height={cell} fill="#00a4ef" />
      <rect x={cell + gap} y={cell + gap} width={cell} height={cell} fill="#ffb900" />
    </svg>
  );
}

function loginIdentityProviderIconConfig(key: string): { key: string; icon: LoginIdentityProviderIconComponent } {
  switch (key) {
    case "gitlab":
      return { key, icon: GitLabBrandIcon };
    case "github":
      return { key, icon: GitHubBrandIcon };
    case "google":
      return { key, icon: GoogleBrandIcon };
    case "microsoft":
      return { key, icon: MicrosoftBrandIcon };
    case "okta":
      return { key, icon: UserRoundCheck };
    case "keycloak":
      return { key, icon: LockKeyhole };
    case "oidc":
      return { key, icon: Fingerprint };
    case "oauth2":
      return { key, icon: KeyRound };
    case "saml":
      return { key, icon: ShieldCheck };
    case "ldap":
      return { key, icon: Users };
    default:
      return { key: "sso", icon: ShieldCheck };
  }
}

function LoginView({
  loading,
  error,
  baseURL,
  identityProviders,
  oauthReturnURL,
  theme,
  onThemeToggle,
  onLogin,
}: {
  loading: boolean;
  error: string;
  baseURL: string;
  identityProviders: LoginIdentityProvider[];
  oauthReturnURL: string;
  theme: "light" | "dark";
  onThemeToggle: () => void;
  onLogin: (identity: string, password: string) => void;
}) {
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onLogin(identity, password);
  }

  const ssoListClassName = [
    "login-sso-list",
    identityProviders.length > 1 ? "multi" : "",
    identityProviders.length > 1 ? `count-${Math.min(identityProviders.length, 3)}` : "",
  ].filter(Boolean).join(" ");

  return (
    <main className="login-shell" data-theme={theme}>
      <button className="login-theme-toggle" onClick={onThemeToggle} title={tx("切换主题")} type="button">
        {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
      </button>
      <section className="login-stage">
        <aside className="login-hero-panel" aria-label="TokenHub">
          <div className="login-hero-orbit" aria-hidden="true" />
          <div className="login-flow-scene">
            <svg className="login-flow-svg" viewBox="0 0 460 320" aria-hidden="true">
              <path id="login-key-flow-one" className="login-flow-link" d="M 92 84 C 150 84 165 138 208 151" />
              <path id="login-key-flow-two" className="login-flow-link" d="M 92 160 C 142 160 166 160 208 160" />
              <path id="login-key-flow-three" className="login-flow-link" d="M 92 236 C 150 236 165 182 208 169" />
              <path id="login-provider-flow-one" className="login-flow-link login-provider-flow" d="M 260 150 C 298 116 318 82 362 82" />
              <path id="login-provider-flow-two" className="login-flow-link login-provider-flow" d="M 260 160 C 302 160 320 160 362 160" />
              <path id="login-provider-flow-three" className="login-flow-link login-provider-flow" d="M 260 170 C 298 204 318 238 362 238" />
              {[
                ["#login-key-flow-one", "0s"],
                ["#login-key-flow-one", "-1.25s"],
                ["#login-key-flow-two", "-0.35s"],
                ["#login-key-flow-two", "-1.7s"],
                ["#login-key-flow-three", "-0.7s"],
                ["#login-key-flow-three", "-2.05s"],
                ["#login-provider-flow-one", "-0.1s"],
                ["#login-provider-flow-one", "-1.45s"],
                ["#login-provider-flow-two", "-0.65s"],
                ["#login-provider-flow-two", "-2s"],
                ["#login-provider-flow-three", "-1.1s"],
                ["#login-provider-flow-three", "-2.45s"],
              ].map(([path, begin], index) => (
                <circle className="login-flow-token" key={`${path}-${begin}-${index}`} r={4}>
                  <animateMotion dur="3.1s" begin={begin} repeatCount="indefinite">
                    <mpath href={path} />
                  </animateMotion>
                </circle>
              ))}
            </svg>

            <div className="login-key-stack" aria-hidden="true">
              <span className="login-key-chip key-one">
                <span className="login-key-icon" />
                Key 01
              </span>
              <span className="login-key-chip key-two">
                <span className="login-key-icon" />
                Key 02
              </span>
              <span className="login-key-chip key-three">
                <span className="login-key-icon" />
                Key 03
              </span>
            </div>

            <div className="login-hub-node">
              <span className="login-logo-tile">
                <img src="/brand/tokenhub-logo.png" alt="" />
              </span>
              <span className="login-hub-copy">
                <strong>TokenHub</strong>
                <small>Gateway</small>
              </span>
            </div>

            <div className="login-provider-stack" aria-hidden="true">
              <span className="login-provider-node provider-one">
                <span className="login-provider-orb" />
                <strong>Provider A</strong>
                <span className="login-provider-bars">
                  <span />
                  <span />
                  <span />
                </span>
              </span>
              <span className="login-provider-node provider-two">
                <span className="login-provider-orb" />
                <strong>Provider B</strong>
                <span className="login-provider-bars">
                  <span />
                  <span />
                  <span />
                </span>
              </span>
              <span className="login-provider-node provider-three">
                <span className="login-provider-orb" />
                <strong>Provider C</strong>
                <span className="login-provider-bars">
                  <span />
                  <span />
                  <span />
                </span>
              </span>
            </div>
          </div>
          <div className="login-signal-strip" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </aside>

        <form className="login-card" onSubmit={submit}>
          <div className="login-card-head">
            <h1>{tx("登录控制台")}</h1>
          </div>
          <label className="field">
            <span>{tx("账号 / 邮箱")}</span>
            <input value={identity} onChange={(event) => setIdentity(event.target.value)} required />
          </label>
          <label className="field">
            <span>{tx("密码")}</span>
            <span className="password-field">
              <input
                value={password}
                type={passwordVisible ? "text" : "password"}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                aria-label={passwordVisible ? tx("隐藏密码") : tx("显示密码")}
                className="password-toggle"
                onClick={() => setPasswordVisible((value) => !value)}
                type="button"
              >
                {passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </span>
          </label>
          <div className="login-helper-row">
            <span>
              <span className="login-checkmark">
                <Check size={13} />
              </span>
              {tx("保持登录")}
            </span>
            <button type="button">{tx("忘记密码？")}</button>
          </div>
          {error ? <div className="login-error">{error}</div> : null}
          <button className="button login-submit" disabled={loading} type="submit">
            {loading ? tx("登录中") : tx("登录控制台")}
          </button>
          {identityProviders.length > 0 ? (
            <>
              <div className="login-divider" aria-hidden="true">
                <span />
                <small>{tx("或")}</small>
                <span />
              </div>
              <div className={ssoListClassName}>
                {identityProviders.map((provider) => {
                  const displayName = loginIdentityProviderDisplayName(provider);
                  return (
                    <a
                      aria-disabled={loading}
                      aria-label={`${tx("使用")} ${displayName} ${tx("登录")}`}
                      className="login-sso-button"
                      href={identityProviderLoginURL(baseURL, provider, oauthReturnURL)}
                      key={provider.id}
                      onClick={(event) => {
                        if (loading) event.preventDefault();
                      }}
                    >
                      <LoginIdentityProviderIcon provider={provider} />
                      <span className="login-sso-label">
                        {identityProviders.length > 1 ? displayName : `${tx("使用")} ${displayName} ${tx("登录")}`}
                      </span>
                    </a>
                  );
                })}
              </div>
            </>
          ) : null}
        </form>
      </section>
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
  const visibleGroups = navGroupsForUser(user)
    .map((group) => ({ ...group, items: group.items.map((item) => filterNavItemByAccess(item, user)).filter((item): item is NavItem => Boolean(item)) }))
    .filter((group) => group.items.length > 0);
  return (
    <aside className={collapsed ? "sidebar collapsed" : "sidebar"}>
      <div className="brand">
        <img src="/brand/tokenhub-logo.png" alt="TokenHub" className="brand-logo" />
        <span className="brand-name">TokenHub</span>
        <span className="version">v0.2.0</span>
        <button
          className="sidebar-toggle"
          aria-label={collapsed ? tx("展开菜单") : tx("折叠菜单")}
          onClick={onToggleCollapse}
          title={collapsed ? tx("展开菜单") : tx("折叠菜单")}
          type="button"
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>
      <div className="sidebar-nav-scroll">
        {visibleGroups.map((group) => {
          const groupOpen = collapsed || openGroups[group.title] !== false;
          return (
            <div className={groupOpen ? "nav-group" : "nav-group closed"} key={group.title}>
              <button
                aria-expanded={groupOpen}
                className={groupOpen ? "nav-title" : "nav-title closed"}
                onClick={() => onToggleGroup(group.title)}
                type="button"
              >
                <span>{tx(group.title)}</span>
                <ChevronDown className="nav-chevron" size={14} />
              </button>
              {groupOpen ? (
                <div className="nav">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    if (isNavParentItem(item)) {
                      if (collapsed) {
                        return item.children.map((child) => {
                          const ChildIcon = child.icon;
                          return (
                            <button
                              className={activeView === child.view ? "nav-item active" : "nav-item"}
                              key={child.view}
                              onClick={() => onSelect(child.view)}
                              title={tx(child.label)}
                              type="button"
                            >
                              <ChildIcon size={17} />
                              <span>{tx(child.label)}</span>
                            </button>
                          );
                        });
                      }
	                      const childOpen = openGroups[`nav:${item.label}`] !== false || isNavItemActive(item, activeView);
                      return (
                        <div className={childOpen ? "nav-branch" : "nav-branch closed"} key={item.label}>
                          <button
                            aria-expanded={childOpen}
                            className={isNavItemActive(item, activeView) ? "nav-item nav-parent active-parent" : "nav-item nav-parent"}
                            onClick={() => onToggleGroup(`nav:${item.label}`)}
                            type="button"
                          >
                            <Icon size={17} />
	                            <span>{tx(item.label)}</span>
                            <ChevronDown className="nav-chevron" size={14} />
                          </button>
                          {childOpen ? (
                            <div className="nav-subnav">
                              {item.children.map((child) => {
                                const ChildIcon = child.icon;
                                return (
                                  <button
                                    className={activeView === child.view ? "nav-item nav-child active" : "nav-item nav-child"}
                                    key={child.view}
                                    onClick={() => onSelect(child.view)}
                                    type="button"
                                  >
                                    <ChildIcon size={16} />
	                                    <span>{tx(child.label)}</span>
                                  </button>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      );
                    }
                    return (
                      <button
                        className={activeView === item.view ? "nav-item active" : "nav-item"}
                        key={item.view}
                        onClick={() => onSelect(item.view)}
	                        title={collapsed ? tx(item.label) : undefined}
                        type="button"
                      >
                        <Icon size={17} />
	                        <span>{tx(item.label)}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="sidebar-account">
        <div className="account-avatar">{userInitial(user)}</div>
        <div className="account-meta">
          <strong>{displayText(user.name) || user.username}</strong>
          <span>{roleLabel(user.role)}</span>
        </div>
        <button className="account-logout" onClick={onLogout} type="button" title={tx("退出登录")}>
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
}

function TopNav({
  theme,
  onThemeToggle,
}: {
  theme: "light" | "dark";
  onThemeToggle: () => void;
}) {
  return (
    <header className="topbar">
      <label className="top-search" aria-label={tx("搜索控制台")}>
        <Search size={16} />
        <input placeholder={tx("搜索模型、Provider、日志...")} />
        <span>⌘K</span>
      </label>
      <div className="topbar-spacer" />
      <div className="topbar-actions">
        <button className="top-icon-button" onClick={onThemeToggle} title={tx("切换主题")} type="button">
          {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
        </button>
      </div>
    </header>
  );
}

function OverviewView({
  data,
  user,
}: {
  data: AppData;
  user: AdminUser;
}) {
  const [range, setRange] = useState<OverviewRangeKey>("7d");
  const [chartMetric, setChartMetric] = useState<OverviewMetricKey>("requests");
  const apiKeyCount = data.summary.api_key_count ?? data.keys.length;
  const can = (view: ViewKey) => canAccessView(user, view);
  const activeProviders = data.providers.filter((provider) => provider.status === "active" && provider.healthy).length;
  const providerTotal = data.providers.length;
  const series = overviewRangePoints(data, range);
  const requestValues = series.map((point) => point.request_count);
  const tokenValues = series.map((point) => point.total_tokens);
  const costValues = series.map((point) => point.estimated_cost_usd);
  const providerRows = overviewProviderShareRows(data);
  const topModels = overviewTopModelRows(data);
  const cards = [
    {
      label: "总请求",
      value: formatNumber(data.summary.request_count),
      icon: BarChart3,
      delta: overviewDeltaLabel(requestValues),
      values: requestValues,
    },
    {
      label: "总 Token",
      value: compactNumber(data.summary.total_tokens),
      icon: Database,
      delta: overviewDeltaLabel(tokenValues),
      values: tokenValues,
    },
    {
      label: "总成本",
      value: `$${formatMoney(data.summary.estimated_cost_usd)}`,
      icon: CircleDollarSign,
      delta: overviewDeltaLabel(costValues),
      values: costValues,
    },
    can("providers")
      ? {
          label: "Provider",
          value: `${formatNumber(activeProviders)} / ${formatNumber(providerTotal)}`,
          icon: Server,
          badge: `${tx("在线")} ${formatNumber(activeProviders)}`,
          caption: "全部健康 · 延迟 312ms",
          values: series.map(() => activeProviders),
        }
      : {
          label: "API Key",
          value: formatNumber(apiKeyCount),
          icon: KeyRound,
          badge: "已发放",
          caption: "内部调用凭证",
          values: series.map(() => apiKeyCount),
        },
  ].filter(Boolean);
  const chartValue = overviewMetricValue(series, chartMetric);

  return (
    <div className="overview-report">
      <header className="overview-report-head">
        <div>
          <p className="eyebrow">Enterprise AI Gateway</p>
          <h1>{tx("网关概览")}</h1>
        </div>
        <div className="overview-range-tabs" role="tablist" aria-label={tx("报表时间范围")}>
          {overviewRangeTabs.map((item) => (
            <button
              className={range === item.key ? "active" : ""}
              key={item.key}
              onClick={() => setRange(item.key)}
              type="button"
            >
              {tx(item.label)}
            </button>
          ))}
        </div>
      </header>

      <section className="metrics overview-metrics">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <OverviewMetricCard
              badge={"badge" in card ? card.badge : card.delta}
              caption={"caption" in card ? card.caption : undefined}
              icon={Icon}
              key={card.label}
              label={card.label}
              value={card.value}
              values={card.values}
            />
          );
        })}
      </section>

      <section className="overview-report-grid">
        <article className="overview-panel overview-trend-panel">
          <div className="overview-panel-head">
            <div>
              <h2>{tx("成本与用量趋势")}</h2>
              <p>
                <strong>{chartValue.value}</strong>
                <span>{chartValue.delta}</span>
                <em>· {overviewRangeLabel(range)}</em>
              </p>
            </div>
            <div className="overview-metric-tabs" role="tablist" aria-label={tx("趋势指标")}>
              {overviewMetricTabs.map((item) => (
                <button
                  className={chartMetric === item.key ? "active" : ""}
                  key={item.key}
                  onClick={() => setChartMetric(item.key)}
                  type="button"
                >
                  {tx(item.label)}
                </button>
              ))}
            </div>
          </div>
          <OverviewTrendChart metric={chartMetric} points={series} />
        </article>

        <aside className="overview-side-stack">
          <OverviewProviderShare rows={providerRows} />
          <OverviewTopModels rows={topModels} />
        </aside>
      </section>
    </div>
  );
}

type OverviewRangeKey = "7d" | "30d" | "month";
type OverviewMetricKey = "requests" | "tokens" | "cost";

const overviewRangeTabs: Array<{ key: OverviewRangeKey; label: string }> = [
  { key: "7d", label: "7 天" },
  { key: "30d", label: "30 天" },
  { key: "month", label: "本月" },
];

const overviewMetricTabs: Array<{ key: OverviewMetricKey; label: string }> = [
  { key: "requests", label: "请求" },
  { key: "tokens", label: "Token" },
  { key: "cost", label: "成本" },
];

function OverviewMetricCard({
  badge,
  caption,
  icon: Icon,
  label,
  value,
  values,
}: {
  badge?: string;
  caption?: string;
  icon: typeof Activity;
  label: string;
  value: string;
  values: number[];
}) {
  return (
    <article className="metric compact-metric overview-metric-card">
      <div className="overview-card-head">
        <div className="metric-label">
          <Icon size={17} />
          {tx(label)}
        </div>
        {badge ? <span>{tx(badge)}</span> : null}
      </div>
      <div className="metric-value">{value}</div>
      {caption ? (
        <div className="overview-health-caption">
          <span />
          {tx(caption)}
        </div>
      ) : (
        <OverviewSparkline values={values} />
      )}
    </article>
  );
}

function OverviewSparkline({ values }: { values: number[] }) {
  const path = overviewLinePath(values, 160, 34, 3);
  return (
    <svg className="overview-sparkline" viewBox="0 0 160 34" preserveAspectRatio="none" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

function OverviewTrendChart({ metric, points }: { metric: OverviewMetricKey; points: UsagePoint[] }) {
  const values = points.map((point) => usagePointMetric(point, metric));
  const width = 900;
  const height = 330;
  const left = 52;
  const right = 24;
  const top = 28;
  const bottom = 46;
  const baseline = height - bottom;
  const line = overviewLinePath(values, width - left - right, baseline - top, 0, left, top);
  const area = line ? `${line} L ${width - right} ${baseline} L ${left} ${baseline} Z` : "";
  const max = Math.max(...values, 1);
  const ticks = [0.25, 0.5, 0.75];
  const labels = overviewAxisLabels(points);

  return (
    <div className="overview-chart-wrap">
      <svg className="overview-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={tx("成本与用量趋势")}>
        <defs>
          <linearGradient id="overviewArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((tick) => {
          const y = baseline - (baseline - top) * tick;
          return (
            <g key={tick}>
              <line x1={left} x2={width - right} y1={y} y2={y} />
              <text x={8} y={y + 4}>{overviewMetricDisplay(max * tick, metric)}</text>
            </g>
          );
        })}
        <path className="overview-chart-area" d={area} />
        <path className="overview-chart-line" d={line} />
        {labels.map((item) => (
          <text className="overview-axis-label" key={`${item.label}-${item.x}`} x={item.x} y={height - 10}>{item.label}</text>
        ))}
      </svg>
    </div>
  );
}

function OverviewProviderShare({ rows }: { rows: Array<{ id: string; label: string; percent: number; value: number; cost: number }> }) {
  const totalCost = rows.reduce((sum, row) => sum + row.cost, 0);
  return (
    <article className="overview-panel overview-share-panel">
      <h2>{tx("Provider 成本占比")}</h2>
      <div className="overview-share-content">
        <div className="overview-donut" style={{ background: overviewDonutGradient(rows) }}>
          <div>
            <strong>{totalCost > 0 ? `$${compactNumber(totalCost)}` : "$0"}</strong>
            <span>{tx("总成本")}</span>
          </div>
        </div>
        <div className="overview-share-list">
          {rows.length ? rows.map((row, index) => (
            <div className="overview-share-row" key={row.id}>
              <span className={`overview-share-dot color-${index}`} />
              <span>{row.label}</span>
              <strong>{row.percent}%</strong>
            </div>
          )) : (
            <div className="compact-empty">{tx("暂无 Provider 成本数据")}</div>
          )}
        </div>
      </div>
    </article>
  );
}

function OverviewTopModels({ rows }: { rows: UsageBreakdownRow[] }) {
  const max = Math.max(...rows.map((row) => row.request_count), 1);
  return (
    <article className="overview-panel overview-top-panel">
      <h2>{tx("Top 模型 · 调用量")}</h2>
      <div className="overview-top-list">
        {rows.length ? rows.map((row) => (
          <div className="overview-top-row" key={row.id}>
            <div>
              <span>{row.id}</span>
              <em>{formatNumber(row.request_count)}</em>
            </div>
            <span className="overview-progress">
              <span style={{ width: `${Math.max(4, Math.round((row.request_count / max) * 100))}%` }} />
            </span>
          </div>
        )) : (
          <div className="compact-empty">{tx("暂无模型调用数据")}</div>
        )}
      </div>
    </article>
  );
}

function overviewRangePoints(data: AppData, range: OverviewRangeKey) {
  const source = (data.timeseries.length ? data.timeseries : fallbackOverviewDays(data.summary))
    .slice()
    .sort((left, right) => left.date.localeCompare(right.date));
  if (range === "7d") return source.slice(-7);
  if (range === "30d") return source.slice(-30);
  const latestMonth = source.at(-1)?.date.slice(0, 7);
  const monthPoints = latestMonth ? source.filter((point) => point.date.startsWith(latestMonth)) : source;
  return monthPoints.length ? monthPoints : source.slice(-30);
}

function fallbackOverviewDays(summary: Summary): UsagePoint[] {
  const weights = [0.56, 0.48, 0.79, 0.68, 0.96, 0.86, 1.08, 0.99, 1.17, 1.25];
  const totalWeight = weights.reduce((sum, item) => sum + item, 0);
  return weights.map((weight, index) => {
    const ratio = weight / totalWeight;
    const totalTokens = Math.round((summary.total_tokens || 0) * ratio);
    const inputTokens = Math.round((summary.input_tokens || totalTokens * 0.58) * ratio);
    const outputTokens = Math.max(0, totalTokens - inputTokens);
    return {
      date: `2026-06-${String(index + 9).padStart(2, "0")}`,
      request_count: Math.round((summary.request_count || 0) * ratio),
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens,
      estimated_cost_usd: Number(((summary.estimated_cost_usd || 0) * ratio).toFixed(6)),
    };
  });
}

function usagePointMetric(point: UsagePoint, metric: OverviewMetricKey) {
  if (metric === "tokens") return point.total_tokens;
  if (metric === "cost") return point.estimated_cost_usd;
  return point.request_count;
}

function overviewMetricValue(points: UsagePoint[], metric: OverviewMetricKey) {
  const values = points.map((point) => usagePointMetric(point, metric));
  const total = values.reduce((sum, value) => sum + value, 0);
  return {
    value: overviewMetricDisplay(total, metric),
    delta: overviewDeltaLabel(values),
  };
}

function overviewMetricDisplay(value: number, metric: OverviewMetricKey) {
  if (metric === "cost") return `$${formatMoney(value)}`;
  if (metric === "tokens") return compactNumber(value);
  return formatNumber(Math.round(value || 0));
}

function overviewDeltaLabel(values: number[]) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (clean.length < 2) return "+0%";
  const previous = clean[0] || 0;
  const current = clean.at(-1) || 0;
  if (previous <= 0 && current <= 0) return "+0%";
  if (previous <= 0) return "+100%";
  const delta = ((current - previous) / previous) * 100;
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(Math.abs(delta) >= 10 ? 0 : 1)}%`;
}

function overviewRangeLabel(range: OverviewRangeKey) {
  if (range === "7d") return tx("近 7 天");
  if (range === "30d") return tx("近 30 天");
  return tx("本月");
}

function overviewLinePath(values: number[], width: number, height: number, pad = 0, offsetX = 0, offsetY = 0) {
  if (!values.length) return "";
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = Math.max(max - min, 1);
  const usableWidth = Math.max(1, width - pad * 2);
  const usableHeight = Math.max(1, height - pad * 2);
  return values
    .map((value, index) => {
      const x = offsetX + pad + (values.length === 1 ? usableWidth : (index / (values.length - 1)) * usableWidth);
      const y = offsetY + pad + usableHeight - ((value - min) / span) * usableHeight;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function overviewAxisLabels(points: UsagePoint[]) {
  if (!points.length) return [];
  const indexes = [0, Math.floor((points.length - 1) / 3), Math.floor(((points.length - 1) * 2) / 3), points.length - 1];
  const unique = Array.from(new Set(indexes));
  const left = 52;
  const right = 24;
  const width = 900 - left - right;
  return unique.map((index) => ({
    x: left + (points.length === 1 ? 0 : (index / (points.length - 1)) * width),
    label: overviewDateLabel(points[index].date),
  }));
}

function overviewDateLabel(date: string) {
  const [, , month, day] = date.match(/^(\d{4})-(\d{2})-(\d{2})/) ?? [];
  return month && day ? `${month}/${day}` : date;
}

function overviewProviderShareRows(data: AppData) {
  const source = (data.breakdown.providers ?? [])
    .filter((row) => row.estimated_cost_usd > 0 || row.request_count > 0)
    .sort((left, right) => right.estimated_cost_usd - left.estimated_cost_usd || right.request_count - left.request_count);
  const rows = source.length ? source.slice(0, 3) : data.providers.slice(0, 3).map((provider) => ({
    id: provider.id,
    request_count: 0,
    input_tokens: 0,
    output_tokens: 0,
    total_tokens: 0,
    estimated_cost_usd: 0,
  }));
  const total = rows.reduce((sum, row) => sum + row.estimated_cost_usd, 0);
  const fallbackTotal = rows.reduce((sum, row) => sum + row.request_count, 0);
  return rows.map((row) => {
    const value = total > 0 ? row.estimated_cost_usd : row.request_count;
    const denominator = total > 0 ? total : fallbackTotal;
    return {
      id: row.id,
      label: findProvider(data, row.id)?.name || row.id || "其他",
      cost: row.estimated_cost_usd,
      value,
      percent: denominator > 0 ? Math.round((value / denominator) * 100) : 0,
    };
  });
}

function overviewDonutGradient(rows: Array<{ percent: number }>) {
  if (!rows.length || rows.every((row) => row.percent <= 0)) return "conic-gradient(var(--surface-3) 0 100%)";
  const colors = ["var(--accent)", "var(--accent-2)", "var(--ink-4)"];
  let start = 0;
  const segments = rows.map((row, index) => {
    const end = Math.min(100, start + row.percent);
    const segment = `${colors[index] ?? "var(--border-strong)"} ${start}% ${end}%`;
    start = end;
    return segment;
  });
  if (start < 100) segments.push(`var(--surface-3) ${start}% 100%`);
  return `conic-gradient(${segments.join(", ")})`;
}

function overviewTopModelRows(data: AppData) {
  const breakdownRows = (data.breakdown.models ?? [])
    .filter((row) => row.request_count > 0 || row.total_tokens > 0)
    .sort((left, right) => right.request_count - left.request_count || right.total_tokens - left.total_tokens)
    .slice(0, 4);
  if (breakdownRows.length) return breakdownRows;

  const logs = new Map<string, UsageBreakdownRow>();
  for (const log of data.logs) {
    const id = log.model || "-";
    const current = logs.get(id) ?? {
      id,
      request_count: 0,
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0,
      estimated_cost_usd: 0,
    };
    current.request_count += 1;
    logs.set(id, current);
  }
  const logRows = Array.from(logs.values()).sort((left, right) => right.request_count - left.request_count).slice(0, 4);
  if (logRows.length) return logRows;

  return data.models.slice(0, 4).map((model) => ({
    id: model.name,
    request_count: 0,
    input_tokens: 0,
    output_tokens: 0,
    total_tokens: 0,
    estimated_cost_usd: 0,
  }));
}

function GatewayView({ api, data }: { api: ApiContext; data: AppData }) {
  const baseURL = apiGatewayBaseURL(api.baseURL);
  const activeRoutes = data.routes.filter((route) => route.status === "active").length;
  const callableModels = playgroundModels(data);
  const sampleModel = callableModels.find((model) => activeRouteCount(model.name, data) > 0)?.name ?? callableModels[0]?.name ?? "gpt-4.1-mini";
  const keyHint = data.keys[0] ? `${data.keys[0].key_prefix}...${data.keys[0].key_suffix}` : "YOUR_TOKENHUB_API_KEY";
  const docGroups = gatewayDocGroups({ baseURL, keyHint, sampleModel, activeRoutes, data });
  const [activeDocID, setActiveDocID] = useState("quickstart");
  const allDocs = docGroups.flatMap((group) => group.items);
  const activeDoc = allDocs.find((item) => item.id === activeDocID) ?? allDocs[0]!;

  return (
    <div className="gateway-docs">
      <div className="api-doc-shell">
        <GatewayDocNav groups={docGroups} activeID={activeDoc.id} onSelect={setActiveDocID} />
        <section className="api-doc-main">
          <header className="api-doc-main-head">
            <div>
              <p className="eyebrow">Model API</p>
              <h2>{tx("接口文档")}</h2>
              <p>
                {tx("面向业务开发者的模型 API 调用说明。业务侧只使用 ")}<code>/v1/*</code>{tx(" 和项目 API Key；")}<code>/api/admin/*</code>{tx(" 仅用于控制台管理。")}
              </p>
            </div>
            <a href="https://docs.newapi.pro/zh/docs/api" target="_blank" rel="noreferrer">
              <Globe2 size={15} />
              {tx("OpenAI 兼容协议")}
            </a>
          </header>

          <section className="api-doc-quick-grid" aria-label={tx("接口基础信息")}>
            <GatewayCopyCard label="Base URL" value={baseURL} />
            <GatewayCopyCard label="Authorization" value={`Bearer ${keyHint}`} />
            <GatewayCopyCard label="示例模型" value={sampleModel} />
            <article className="gateway-copy-card api-doc-config-card">
              <span>{tx("当前配置")}</span>
              <strong>{countWithUnit(activeRoutes || data.summary.active_route_count || 0, "条启用路由", "active route", "件の有効ルート")}</strong>
              <small>{countWithUnit(data.keys.length || data.summary.api_key_count || 0, "个 API Key", "API Key", "件の API Key")}</small>
            </article>
          </section>

          <GatewayDocContent doc={activeDoc} data={data} callableModels={callableModels} baseURL={baseURL} modelName={sampleModel} />
        </section>
      </div>
    </div>
  );
}

type GatewayDocItem = {
  id: string;
  group: string;
  title: string;
  description: string;
  method?: string;
  path?: string;
  status?: string;
  details?: Array<{ label: string; value: string }>;
  notes?: string[];
  params?: React.ReactNode[][];
  examples?: Array<{ title: string; code: string }>;
  table?: {
    columns: string[];
    rows: React.ReactNode[][];
  };
};

type GatewayDocGroup = {
  title: string;
  items: GatewayDocItem[];
};

function GatewayDocNav({
  groups,
  activeID,
  onSelect,
}: {
  groups: GatewayDocGroup[];
  activeID: string;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="api-doc-nav" aria-label={tx("API 导航")}>
      <div className="api-doc-nav-head">
        <FileText size={16} />
        <div>
          <strong>{tx("API 导航")}</strong>
          <span>{tx("按接口类型查看详细说明")}</span>
        </div>
      </div>
      <div className="api-doc-nav-list">
        {groups.map((group) => (
          <section className="api-doc-nav-group" key={group.title}>
            <h3>{tx(group.title)}</h3>
            {group.items.map((item) => (
              <button
                aria-selected={activeID === item.id}
                className={activeID === item.id ? "api-doc-nav-item active" : "api-doc-nav-item"}
                key={item.id}
                onClick={() => onSelect(item.id)}
                type="button"
              >
                {item.method ? <span className={`api-method ${apiMethodClass(item.method)}`}>{item.method}</span> : <span className="api-method muted">DOC</span>}
                <span>
                  <strong>{tx(item.title)}</strong>
                  {item.path ? <em>{item.path}</em> : <em>{tx(item.description)}</em>}
                </span>
              </button>
            ))}
          </section>
        ))}
      </div>
    </aside>
  );
}

function GatewayDocContent({
  doc,
  data,
  callableModels,
  baseURL,
  modelName,
}: {
  doc: GatewayDocItem;
  data: AppData;
  callableModels: Model[];
  baseURL: string;
  modelName: string;
}) {
  if (doc.id === "sdk") {
    return (
      <article className="api-doc-content-card">
        <GatewayDocTitle doc={doc} />
        <PlaygroundAPIExamples baseURL={baseURL} modelName={modelName} />
      </article>
    );
  }

  if (doc.id === "models-current") {
    return (
      <article className="api-doc-content-card">
        <GatewayDocTitle doc={doc} />
        {callableModels.length > 0 ? (
          <div className="gateway-model-list api-doc-model-list">
            {callableModels.slice(0, 18).map((model) => (
              <span key={model.name}>
                {model.name}
                <em>{countWithUnit(activeRouteCount(model.name, data), "条路由", "route", "件のルート")}</em>
              </span>
            ))}
          </div>
        ) : (
          <div className="empty">{tx("当前后台还没有启用可用模型路由，请让管理员在路由策略里启用模型。")}</div>
        )}
      </article>
    );
  }

  return (
    <article className="api-doc-content-card">
      <GatewayDocTitle doc={doc} />
      {doc.details ? (
        <div className="api-doc-detail-grid">
          {doc.details.map((item) => (
            <div key={item.label}>
              <span>{tx(item.label)}</span>
              <strong>{tx(item.value)}</strong>
            </div>
          ))}
        </div>
      ) : null}
      {doc.notes ? (
        <section className="api-doc-panel">
          <h3>{tx("说明")}</h3>
          <ul className="api-doc-notes">
            {doc.notes.map((note) => <li key={note}>{tx(note)}</li>)}
          </ul>
        </section>
      ) : null}
      {doc.params ? (
        <section className="api-doc-panel">
          <h3>{tx("请求参数")}</h3>
          <SimpleTable columns={["字段", "类型", "必填", "说明"]} rows={doc.params} />
        </section>
      ) : null}
      {doc.table ? (
        <section className="api-doc-panel">
          <h3>{tx("明细")}</h3>
          <SimpleTable columns={doc.table.columns} rows={doc.table.rows} />
        </section>
      ) : null}
      {doc.examples ? (
        <section className="api-doc-panel">
          <h3>{tx("示例")}</h3>
          <div className="api-doc-code-grid">
            {doc.examples.map((example) => (
              <div className="api-doc-code-card" key={example.title}>
                <strong>{tx(example.title)}</strong>
                <GatewayCodeBlock code={example.code} />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}

function GatewayDocTitle({ doc }: { doc: GatewayDocItem }) {
  return (
    <div className="api-doc-title">
      <div>
        <span>{tx(doc.group)}</span>
        <h2>{tx(doc.title)}</h2>
        <p>{tx(doc.description)}</p>
      </div>
      {doc.path ? (
        <div className="api-doc-endpoint">
          <span className={`api-method ${apiMethodClass(doc.method)}`}>{doc.method}</span>
          <code>{doc.path}</code>
        </div>
      ) : doc.status ? (
        <StatusPill status={doc.status} label={doc.status} />
      ) : null}
    </div>
  );
}

function gatewayDocGroups({
  baseURL,
  keyHint,
  sampleModel,
  activeRoutes,
  data,
}: {
  baseURL: string;
  keyHint: string;
  sampleModel: string;
  activeRoutes: number;
  data: AppData;
}): GatewayDocGroup[] {
  const authHeader = `Authorization: Bearer ${keyHint}`;
  const sampleSystemPrompt = tx("你是企业内部 AI 助手。");
  const sampleIntroPrompt = tx("用两句话介绍 TokenHub");
  const sampleWorkOrderPrompt = tx("总结今天的工单重点");
  const sampleKnowledgeInput = tx("TokenHub 企业知识库");
  const chatCurl = `curl -X POST "${baseURL}/chat/completions" \\
  -H "${authHeader}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${sampleModel}",
    "messages": [
      {"role": "system", "content": "${sampleSystemPrompt}"},
      {"role": "user", "content": "${sampleIntroPrompt}"}
    ],
    "temperature": 0.7,
    "stream": false
  }'`;

  return [
    {
      title: "开始",
      items: [
        {
          id: "quickstart",
          group: "开始",
          title: "快速接入",
          description: "用一个项目 API Key 调用 TokenHub 的 OpenAI 兼容模型接口。",
          details: [
            { label: "Base URL", value: baseURL },
            { label: "鉴权方式", value: "Bearer API Key" },
            { label: "示例模型", value: sampleModel },
            { label: "启用路由", value: countWithUnit(activeRoutes || data.summary.active_route_count || 0, "条", "route", "件") },
          ],
          notes: [
            "业务应用只需要调用 /v1/*，不需要也不应该访问 /api/admin/*。",
            "每个 API Key 都会受到项目状态、模型白名单、额度、并发和 Provider 路由策略约束。",
            "排查失败请求时，优先复制响应里的 request_id 到请求日志查看完整链路。",
          ],
          examples: [
            {
              title: "查询可用模型",
              code: `curl "${baseURL}/models" \\
  -H "${authHeader}"`,
            },
            { title: "发起一次对话", code: chatCurl },
          ],
        },
        {
          id: "auth",
          group: "开始",
          title: "认证与权限",
          description: "业务 API 使用项目下发的 API Key；控制台登录令牌不能替代业务 Key。",
          details: [
            { label: "Header", value: "Authorization" },
            { label: "格式", value: "Bearer YOUR_TOKENHUB_API_KEY" },
            { label: "当前 Key 数", value: countWithUnit(data.keys.length || data.summary.api_key_count || 0, "个", "Key", "件") },
          ],
          params: [
            ["Authorization", "header", "是", "项目 API Key，格式为 Bearer thk_xxx"],
            ["Content-Type", "header", "POST 必填", "JSON 请求使用 application/json"],
            ["model", "body", "模型接口必填", "统一模型名，需在 Key 白名单和路由策略中可用"],
          ],
          notes: [
            "401 通常表示 Key 缺失、格式错误、已停用或已过期。",
            "403 通常表示项目状态、模型白名单或权限范围不允许当前调用。",
          ],
        },
      ],
    },
    {
      title: "模型 API",
      items: [
        {
          id: "models",
          group: "模型 API",
          title: "模型列表",
          method: "GET",
          path: "/v1/models",
          description: "按当前 API Key 的权限返回可用统一模型。",
          status: "active",
          params: [["Authorization", "header", "是", "Bearer API Key"]],
          examples: [{ title: "请求示例", code: `curl "${baseURL}/models" -H "${authHeader}"` }],
          table: {
            columns: ["字段", "说明"],
            rows: [
              ["id", "统一模型名称，用于后续调用的 model 字段"],
              ["object", "OpenAI 兼容对象类型，通常为 model"],
              ["owned_by", "模型归属或 Provider 标识"],
            ],
          },
        },
        {
          id: "chat",
          group: "模型 API",
          title: "对话补全",
          method: "POST",
          path: "/v1/chat/completions",
          description: "兼容 OpenAI Chat Completions，用于普通对话、工具调用和流式输出。",
          status: "active",
          params: [
            ["model", "string", "是", "统一模型名，例如 " + sampleModel],
            ["messages", "array", "是", "system/user/assistant 消息数组"],
            ["temperature", "number", "否", "采样温度，默认由上游模型决定"],
            ["stream", "boolean", "否", "true 时返回 SSE 流式响应"],
          ],
          examples: [{ title: "cURL", code: chatCurl }],
        },
        {
          id: "responses",
          group: "模型 API",
          title: "Responses API",
          method: "POST",
          path: "/v1/responses",
          description: "兼容新版 Responses 风格调用，适合统一文本输入和多模态能力扩展。",
          status: "active",
          params: [
            ["model", "string", "是", "统一模型名"],
            ["input", "string | array", "是", "用户输入内容"],
            ["stream", "boolean", "否", "是否流式返回"],
          ],
          examples: [
            {
              title: "cURL",
              code: `curl -X POST "${baseURL}/responses" \\
  -H "${authHeader}" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"${sampleModel}","input":"${sampleWorkOrderPrompt}"}'`,
            },
          ],
        },
        {
          id: "embeddings",
          group: "模型 API",
          title: "文本向量",
          method: "POST",
          path: "/v1/embeddings",
          description: "转发文本向量生成请求，并记录 Token 与成本归因。",
          status: "active",
          params: [
            ["model", "string", "是", "向量统一模型名"],
            ["input", "string | array", "是", "需要向量化的文本"],
            ["encoding_format", "string", "否", "可选 float/base64，取决于上游模型支持"],
          ],
          examples: [
            {
              title: "cURL",
              code: `curl -X POST "${baseURL}/embeddings" \\
  -H "${authHeader}" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"text-embedding-3-small","input":"${sampleKnowledgeInput}"}'`,
            },
          ],
        },
        {
          id: "models-current",
          group: "模型 API",
          title: "当前可调用模型",
          description: "根据模型目录和路由策略汇总当前控制台可见模型。",
        },
      ],
    },
    {
      title: "管理 API",
      items: [
        {
          id: "admin-login",
          group: "管理 API",
          title: "控制台登录",
          method: "POST",
          path: "/api/admin/auth/login",
          description: "控制台用户登录接口，不等同于模型 API Key。",
          params: [
            ["identity", "string", "是", "用户名或邮箱"],
            ["password", "string", "是", "控制台密码"],
          ],
          notes: ["管理 API 仅用于控制台和受信任后台程序，不应该暴露给业务应用前端。"],
        },
        {
          id: "admin-providers",
          group: "管理 API",
          title: "Provider 配置",
          method: "GET/POST",
          path: "/api/admin/providers",
          description: "管理上游 Provider、Base URL、凭证和健康状态。",
          table: {
            columns: ["能力", "说明"],
            rows: [
              ["GET", "读取 Provider 列表"],
              ["POST", "新增 Provider 配置"],
              ["PATCH", "更新 Provider 凭证、状态和元信息"],
            ],
          },
        },
        {
          id: "admin-routes",
          group: "管理 API",
          title: "路由策略",
          method: "GET/POST",
          path: "/api/admin/routing-rules",
          description: "维护统一模型到 Provider 资源的优先级、权重和状态。",
          details: [
            { label: "当前路由", value: countWithUnit(data.routes.length, "条", "route", "件") },
            { label: "启用路由", value: countWithUnit(activeRoutes, "条", "active route", "件") },
          ],
        },
        {
          id: "admin-audit",
          group: "管理 API",
          title: "请求日志",
          method: "GET",
          path: "/api/admin/audit/requests",
          description: "按权限查看模型调用日志、命中路由、耗时、Token 和错误信息。",
          details: [
            { label: "日志样本", value: countWithUnit(data.logs.length, "条", "log", "件") },
            { label: "用途", value: "排查 request_id 和上游响应" },
          ],
        },
      ],
    },
    {
      title: "参考",
      items: [
        {
          id: "errors",
          group: "参考",
          title: "常见错误",
          description: "按状态码定位 API Key、模型白名单、路由和额度问题。",
          table: {
            columns: ["状态", "错误码", "处理方式"],
            rows: [
              ["401", "invalid_api_key", "检查 Authorization 是否使用 TokenHub API Key"],
              ["403", "model_not_allowed", "检查 Key 的模型白名单和项目状态"],
              ["404/503", "provider_unavailable", "为统一模型配置启用路由"],
              ["429", "quota_exceeded", "检查项目额度、并发和 Provider 资源限制"],
              ["500", "upstream_error", "在请求日志里查看上游响应和 request_id"],
            ],
          },
        },
        {
          id: "sdk",
          group: "参考",
          title: "SDK 示例",
          description: "使用 OpenAI 兼容 SDK 接入 TokenHub。",
        },
        {
          id: "pipeline",
          group: "参考",
          title: "调用链路",
          description: "从鉴权到 Provider 路由的完整治理链路。",
          table: {
            columns: ["阶段", "能力", "当前数据"],
            rows: [
              ["认证", "Bearer API Key", `${formatNumber(data.keys.length)} keys`],
              ["权限", "模型白名单 + 项目状态", `${formatNumber(data.projects.length)} projects`],
              ["Provider", "上游渠道实例、凭证和健康状态", `${formatNumber(data.providers.length)} providers`],
              ["路由", "对外模型到 Provider 的优先级/权重映射", `${formatNumber(data.routes.length)} rules`],
              ["治理", "额度、审计、成本统计", `${formatNumber(data.logs.length)} logs`],
            ],
          },
        },
      ],
    },
  ];
}

function apiMethodClass(method?: string) {
  const normalized = (method || "").toLowerCase();
  if (normalized.includes("/") || normalized.includes(",")) return "mixed";
  return normalized || "muted";
}

function GatewayCopyCard({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  async function copyValue() {
    try {
      await navigator.clipboard?.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }
  return (
    <article className="gateway-copy-card">
      <span>{tx(label)}</span>
      <strong>{value}</strong>
      <button className="icon-button subtle" onClick={() => void copyValue()} type="button" title={tx("复制")}>
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </button>
    </article>
  );
}

function GatewayCodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  async function copyCode() {
    try {
      await navigator.clipboard?.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className="gateway-code-block">
      <button className="icon-button subtle" onClick={() => void copyCode()} type="button" title={tx("复制代码")}>
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </button>
      <pre><code>{code}</code></pre>
    </div>
  );
}

function UsageView({ data, user }: { data: AppData; user: AdminUser }) {
  const modelBreakdown = data.breakdown.models ?? [];
  const showMemberBreakdown = appRole(user.role) === "team_leader";
  const showExecutiveReport = appRole(user.role) !== "user";
  return (
    <>
      {showExecutiveReport ? <ExecutiveUsageReport data={data} /> : <PersonalUsageSummary data={data} />}
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
        <DataSection title={showMemberBreakdown ? "成员用量" : "项目归因"}>
          <SimpleTable
            columns={[showMemberBreakdown ? "成员" : "项目", "请求", "Token", "成本"]}
            paginationKey={showMemberBreakdown ? "usage-members" : "usage-projects"}
            rows={(showMemberBreakdown ? data.breakdown.members ?? [] : data.breakdown.projects ?? []).map((row) => [
              showMemberBreakdown ? usageMemberLabel(data, row.id) : row.id,
              formatNumber(row.request_count),
              compactNumber(row.total_tokens),
              `$${formatMoney(row.estimated_cost_usd)}`,
            ])}
          />
        </DataSection>
      </div>
      {showMemberBreakdown ? (
        <DataSection title="项目归因">
          <SimpleTable
            columns={["项目", "请求", "Token", "成本"]}
            paginationKey="usage-projects"
            rows={(data.breakdown.projects ?? []).map((row) => [
              projectName(data, row.id),
              formatNumber(row.request_count),
              compactNumber(row.total_tokens),
              `$${formatMoney(row.estimated_cost_usd)}`,
            ])}
          />
        </DataSection>
      ) : null}
    </>
  );
}

function PersonalUsageSummary({ data }: { data: AppData }) {
  return (
    <section className="executive-report personal-usage-report">
      <header className="executive-report-head">
        <div>
          <p className="eyebrow">Personal Usage</p>
          <h2>{tx("我的用量概览")}</h2>
        </div>
        <div className="executive-report-tools">
          <span>{tx("个人范围")}</span>
          <span>{tx("Token 口径")}</span>
        </div>
      </header>

      <div className="executive-kpi-grid">
        <ExecutiveKPI label="总 Token 消耗" value={compactNumber(data.summary.total_tokens)} detail={`${tx("输入")} ${compactNumber(data.summary.input_tokens)} / ${tx("输出")} ${compactNumber(data.summary.output_tokens)}`} />
        <ExecutiveKPI label="请求数" value={formatNumber(data.summary.request_count)} detail={countWithUnit(data.summary.usage_record_count ?? 0, "条用量记录", "usage record", "件の利用記録")} />
        <ExecutiveKPI label="估算成本" value={`$${formatMoney(data.summary.estimated_cost_usd)}`} detail={countWithUnit(data.summary.errors, "个错误", "error", "件のエラー")} />
        <ExecutiveKPI label="可见项目" value={formatNumber(data.projects.length)} detail={tx("按当前账号权限汇总")} />
      </div>
    </section>
  );
}

type ExecutiveDepartmentRow = UsageBreakdownRow & {
  name: string;
  member_count: number;
};

type ExecutiveMemberRow = UsageBreakdownRow & {
  name: string;
  department: string;
};

function ExecutiveUsageReport({ data }: { data: AppData }) {
  const departments = executiveDepartmentRows(data);
  const members = executiveMemberRows(data);
  const totalTokens = data.summary.total_tokens || departments.reduce((sum, row) => sum + row.total_tokens, 0);
  const totalInput = data.summary.input_tokens || departments.reduce((sum, row) => sum + row.input_tokens, 0);
  const totalOutput = data.summary.output_tokens || departments.reduce((sum, row) => sum + row.output_tokens, 0);
  const topDepartment = departments[0];
  const activeMembers = members.filter((row) => row.total_tokens > 0 || row.request_count > 0).length;
  const departmentShare = topDepartment && totalTokens > 0 ? Math.round((topDepartment.total_tokens / totalTokens) * 100) : 0;
  const generatedAt = new Intl.DateTimeFormat(languageLocale(), {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
  const tokenDetail = `${tx("输入")} ${compactNumber(totalInput)} / ${tx("输出")} ${compactNumber(totalOutput)}`;
  const departmentDetail = topDepartment
    ? `${tx("最高")}：${topDepartment.name} · ${departmentShare}%`
    : tx("暂无部门归因");
  const generatedDetail = `${tx("统计时间")} ${generatedAt}`;
  const requestDetail = countWithUnit(data.summary.request_count, "次请求", "request", "件のリクエスト");

  return (
    <section className="executive-report">
      <header className="executive-report-head">
        <div>
          <p className="eyebrow">Executive Usage Report</p>
          <h2>{tx("企业 AI 用量看板")}</h2>
          <span>{tx("面向管理层的部门、个人与 Token 消耗对比")}</span>
        </div>
        <div className="executive-report-tools">
          <span>{tx("本月")}</span>
          <span>{tx("按部门")}</span>
          <span>{tx("Token 口径")}</span>
        </div>
      </header>

      <div className="executive-kpi-grid">
        <ExecutiveKPI label="总 Token 消耗" value={compactNumber(totalTokens)} detail={tokenDetail} />
        <ExecutiveKPI label="覆盖部门" value={formatNumber(departments.length)} detail={departmentDetail} />
        <ExecutiveKPI label="活跃成员" value={formatNumber(activeMembers)} detail={generatedDetail} />
        <ExecutiveKPI label="估算成本" value={`$${formatMoney(data.summary.estimated_cost_usd)}`} detail={requestDetail} />
      </div>

      <div className="executive-grid">
        <article className="executive-panel executive-chart-panel">
          <div className="executive-panel-head">
            <div>
              <h3>{tx("部门 Token 消耗对比")}</h3>
              <span>{tx("输入 Token 与输出 Token 分段展示，按总量排序")}</span>
            </div>
            <div className="executive-legend">
              <span><i className="input" />{tx("输入")}</span>
              <span><i className="output" />{tx("输出")}</span>
            </div>
          </div>
          <ExecutiveDepartmentChart rows={departments.slice(0, 8)} />
        </article>

        <article className="executive-panel executive-department-panel">
          <div className="executive-panel-head compact">
            <div>
              <h3>{tx("部门排行")}</h3>
              <span>Top {Math.min(departments.length, 8)} · {tx("Token 消耗")}</span>
            </div>
          </div>
          <ExecutiveDepartmentRanking rows={departments.slice(0, 8)} totalTokens={totalTokens} />
        </article>
      </div>

      <article className="executive-panel executive-member-panel">
        <div className="executive-panel-head">
          <div>
            <h3>{tx("个人排行")}</h3>
            <span>{tx("公司内部成员 Token 消耗 Top 20")}</span>
          </div>
          <div className="executive-report-tools subtle">
            <span>{tx("按 Token 降序")}</span>
            <span>{tx("可用于复盘配额")}</span>
          </div>
        </div>
        <ExecutiveMemberTable rows={members.slice(0, 20)} totalTokens={totalTokens} />
      </article>
    </section>
  );
}

function ExecutiveKPI({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="executive-kpi">
      <span>{tx(label)}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function ExecutiveDepartmentChart({ rows }: { rows: ExecutiveDepartmentRow[] }) {
  if (rows.length === 0) return <div className="empty">{tx("暂无部门 Token 数据")}</div>;
  const width = 960;
  const height = 320;
  const left = 54;
  const right = 28;
  const top = 28;
  const bottom = 70;
  const chartHeight = height - top - bottom;
  const baseline = height - bottom;
  const max = Math.max(...rows.map((row) => row.total_tokens), 1);
  const gap = 18;
  const barWidth = Math.max(28, (width - left - right - gap * (rows.length - 1)) / rows.length);
  const ticks = [0.25, 0.5, 0.75, 1];

  return (
    <div className="executive-chart-wrap">
      <svg className="executive-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={tx("部门 Token 消耗对比")}>
        {ticks.map((tick) => {
          const y = baseline - chartHeight * tick;
          return (
            <g key={tick}>
              <line x1={left} x2={width - right} y1={y} y2={y} />
              <text x={10} y={y + 4}>{compactNumber(max * tick)}</text>
            </g>
          );
        })}
        {rows.map((row, index) => {
          const x = left + index * (barWidth + gap);
          const inputHeight = Math.max(0, (row.input_tokens / max) * chartHeight);
          const outputHeight = Math.max(0, (row.output_tokens / max) * chartHeight);
          const totalHeight = inputHeight + outputHeight || Math.max(4, (row.total_tokens / max) * chartHeight);
          const inputY = baseline - inputHeight;
          const outputY = inputY - outputHeight;
          return (
            <g key={row.id}>
              <rect className="executive-bar-bg" x={x} y={top} width={barWidth} height={chartHeight} rx="8" />
              {row.output_tokens > 0 ? <rect className="executive-bar-output" x={x} y={outputY} width={barWidth} height={outputHeight} rx="8" /> : null}
              <rect className="executive-bar-input" x={x} y={row.input_tokens > 0 ? inputY : baseline - totalHeight} width={barWidth} height={row.input_tokens > 0 ? inputHeight : totalHeight} rx="8" />
              <text className="executive-bar-value" x={x + barWidth / 2} y={Math.max(18, baseline - totalHeight - 8)}>{compactNumber(row.total_tokens)}</text>
              <text className="executive-bar-label" x={x + barWidth / 2} y={height - 34}>{shortLabel(row.name, 8)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ExecutiveDepartmentRanking({ rows, totalTokens }: { rows: ExecutiveDepartmentRow[]; totalTokens: number }) {
  if (rows.length === 0) return <div className="empty">{tx("暂无部门排行数据")}</div>;
  return (
    <div className="executive-rank-list">
      {rows.map((row, index) => {
        const percent = totalTokens > 0 ? Math.round((row.total_tokens / totalTokens) * 100) : 0;
        return (
          <div className="executive-rank-row" key={row.id}>
            <span className="executive-rank-index">{index + 1}</span>
            <div>
              <strong>{row.name}</strong>
              <small>{countWithUnit(row.member_count, "人", "member", "人")} · {countWithUnit(row.request_count, "次请求", "request", "件のリクエスト")}</small>
              <span className="executive-progress"><span style={{ width: `${Math.max(3, percent)}%` }} /></span>
            </div>
            <em>{compactNumber(row.total_tokens)}</em>
          </div>
        );
      })}
    </div>
  );
}

function ExecutiveMemberTable({ rows, totalTokens }: { rows: ExecutiveMemberRow[]; totalTokens: number }) {
  if (rows.length === 0) return <div className="empty">{tx("暂无个人排行数据")}</div>;
  return (
    <div className="executive-table-wrap">
      <table className="executive-rank-table">
        <thead>
          <tr>
            <th>{tx("排名")}</th>
            <th>{tx("成员")}</th>
            <th>{tx("部门")}</th>
            <th>{tx("请求")}</th>
            <th>{tx("输入 Token")}</th>
            <th>{tx("输出 Token")}</th>
            <th>{tx("总 Token")}</th>
            <th>{tx("占比")}</th>
            <th>{tx("成本")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const percent = totalTokens > 0 ? (row.total_tokens / totalTokens) * 100 : 0;
            return (
              <tr key={row.id}>
                <td><span className="executive-rank-badge">{index + 1}</span></td>
                <td><strong>{row.name}</strong><small>{row.id}</small></td>
                <td>{tx(row.department)}</td>
                <td>{formatNumber(row.request_count)}</td>
                <td>{compactNumber(row.input_tokens)}</td>
                <td>{compactNumber(row.output_tokens)}</td>
                <td><strong>{compactNumber(row.total_tokens)}</strong></td>
                <td>{percent.toFixed(percent >= 10 ? 0 : 1)}%</td>
                <td>${formatMoney(row.estimated_cost_usd)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function executiveDepartmentRows(data: AppData): ExecutiveDepartmentRow[] {
  const costCenterRows = (data.breakdown.cost_centers ?? [])
    .filter((row) => hasUsage(row))
    .map((row) => ({
      ...row,
      name: costCenterLabel(data, row.id),
      member_count: membersInCostCenter(data, row.id),
    }));
  if (costCenterRows.length) return sortUsageRows(costCenterRows);

  const memberRows = data.breakdown.members ?? [];
  if (memberRows.length && data.users.length) {
    const byTeam = new Map<string, ExecutiveDepartmentRow>();
    for (const row of memberRows) {
      if (!hasUsage(row)) continue;
      const user = findUsageUser(data, row.id);
      const teamID = user?.team_id || "unknown";
      const current = byTeam.get(teamID) ?? {
        id: teamID,
        name: teamID === "unknown" ? tx("未归属部门") : teamLabel(data, teamID),
        member_count: 0,
        request_count: 0,
        input_tokens: 0,
        output_tokens: 0,
        total_tokens: 0,
        estimated_cost_usd: 0,
      };
      current.member_count += 1;
      addUsageRow(current, row);
      byTeam.set(teamID, current);
    }
    const rows = Array.from(byTeam.values());
    if (rows.length) return sortUsageRows(rows);
  }

  const projectRows = (data.breakdown.projects ?? [])
    .filter((row) => hasUsage(row))
    .map((row) => ({
      ...row,
      name: projectName(data, row.id),
      member_count: 0,
    }));
  return sortUsageRows(projectRows);
}

function executiveMemberRows(data: AppData): ExecutiveMemberRow[] {
  const rows = (data.breakdown.members ?? [])
    .filter((row) => hasUsage(row))
    .map((row) => {
      const user = findUsageUser(data, row.id);
      return {
        ...row,
        name: user ? displayText(user.name) || user.username || user.email : usageMemberLabel(data, row.id),
        department: user?.team_id ? teamLabel(data, user.team_id) : tx("未归属部门"),
      };
    });
  return sortUsageRows(rows);
}

function hasUsage(row: UsageBreakdownRow) {
  return row.request_count > 0 || row.input_tokens > 0 || row.output_tokens > 0 || row.total_tokens > 0 || row.estimated_cost_usd > 0;
}

function sortUsageRows<T extends UsageBreakdownRow>(rows: T[]): T[] {
  return rows
    .slice()
    .sort((left, right) => right.total_tokens - left.total_tokens || right.request_count - left.request_count || right.estimated_cost_usd - left.estimated_cost_usd);
}

function addUsageRow(target: UsageBreakdownRow, source: UsageBreakdownRow) {
  target.request_count += source.request_count;
  target.input_tokens += source.input_tokens;
  target.output_tokens += source.output_tokens;
  target.total_tokens += source.total_tokens;
  target.estimated_cost_usd += source.estimated_cost_usd;
}

function findUsageUser(data: AppData, id: string) {
  return data.users.find((item) => item.id === id || item.username === id || item.email === id);
}

function membersInCostCenter(data: AppData, costCenterID: string) {
  const projectIDs = data.projects
    .filter((project) => project.cost_center === costCenterID)
    .map((project) => project.id);
  if (projectIDs.length === 0) return 0;
  const teamIDs = new Set(data.projects.filter((project) => projectIDs.includes(project.id) && project.team_id).map((project) => project.team_id as string));
  return data.users.filter((user) => user.team_id && teamIDs.has(user.team_id)).length;
}

function shortLabel(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}

function BillingView({ data, user }: { data: AppData; user: AdminUser }) {
  const showMemberBreakdown = appRole(user.role) === "team_leader";
  const costCenterSection = (
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
  );
  const memberCostSection = (
    <DataSection title="成员成本">
      <SimpleTable
        columns={["成员", "请求", "Token", "估算成本"]}
        paginationKey="billing-members"
        rows={(data.breakdown.members ?? []).map((row) => [
          usageMemberLabel(data, row.id),
          formatNumber(row.request_count),
          compactNumber(row.total_tokens),
          `$${formatMoney(row.estimated_cost_usd)}`,
        ])}
      />
    </DataSection>
  );
  return (
    <>
      {showMemberBreakdown ? (
        <div className="two-column">
          {costCenterSection}
          {memberCostSection}
        </div>
      ) : (
        costCenterSection
      )}
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

function AuditView({ api, data, user }: { api: ApiContext; data: AppData; user: AdminUser }) {
  const [activeAuditTab, setActiveAuditTab] = useState<"requests" | "admin">("requests");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "ok" | "error">("all");
  const [selectedRequestID, setSelectedRequestID] = useState("");
  const [detail, setDetail] = useState<RequestDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const showAdminAudit = canViewAdminAudit(user);

  useEffect(() => {
    if (!showAdminAudit && activeAuditTab === "admin") {
      setActiveAuditTab("requests");
    }
  }, [activeAuditTab, showAdminAudit]);

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
        setDetailError(err instanceof Error ? err.message : tx("请求详情加载失败"));
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
    { key: "all", label: `${tx("全部")} ${data.logs.length}` },
    { key: "ok", label: `${tx("成功")} ${data.logs.length - requestStats.failures}` },
    { key: "error", label: `${tx("失败")} ${requestStats.failures}` },
  ] as const;

  return (
    <div className="audit-view">
      <div className="audit-tabs" role="tablist" aria-label={tx("日志类型")}>
        <button
          type="button"
          className={`audit-tab ${activeAuditTab === "requests" ? "active" : ""}`}
          onClick={() => setActiveAuditTab("requests")}
          role="tab"
          aria-selected={activeAuditTab === "requests"}
        >
          <Activity size={15} />
          <span>{tx("大模型请求历史")}</span>
          <strong>{formatNumber(data.logs.length)}</strong>
        </button>
        {showAdminAudit ? (
          <button
            type="button"
            className={`audit-tab ${activeAuditTab === "admin" ? "active" : ""}`}
            onClick={() => setActiveAuditTab("admin")}
            role="tab"
            aria-selected={activeAuditTab === "admin"}
          >
            <ShieldCheck size={15} />
            <span>{tx("后台操作审计")}</span>
            <strong>{formatNumber(data.auditEvents.length)}</strong>
          </button>
        ) : null}
      </div>

      {activeAuditTab === "requests" || !showAdminAudit ? (
        <DataSection title="大模型请求历史">
          <div className="request-history">
            <div className="request-history-toolbar">
              <label className="request-search" aria-label={tx("搜索请求历史")}>
                <Search size={15} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={tx("搜索请求 ID、模型、Provider、状态码")}
                />
              </label>
              <div className="request-filter-tabs" role="tablist" aria-label={tx("请求状态筛选")}>
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
                  <span>{tx("请求列表")}</span>
                  <strong>{countWithUnit(filteredLogs.length, "条", "record", "件")}</strong>
                </div>
                {filteredLogs.length === 0 ? (
                  <div className="compact-empty">{tx("没有匹配的请求记录")}</div>
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
        <div className="compact-empty">{tx("暂无大模型请求记录")}</div>
      </div>
    );
  }

  if (loading && !detail) {
    return (
      <div className="request-detail-panel">
        <div className="compact-empty">{tx("正在加载请求详情...")}</div>
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
        <div className="compact-empty">{tx("请选择一条请求")}</div>
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
          <span>{tx("请求详情")}</span>
          <strong>{log.model || "-"}</strong>
        </div>
        <StatusPill status={isError ? "error" : "ok"} label={String(log.status_code || "-")} />
      </div>

      <div className="request-id-line">
        <code>{log.request_id}</code>
        <button type="button" className="request-copy-button" onClick={() => void copyRequestID()} title={tx("复制请求 ID")}>
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
          <span>{tx("Token 与成本")}</span>
          <strong>{detail.usage.length ? countWithUnit(detail.usage.length, "条记录", "record", "件の記録") : tx("暂无记录")}</strong>
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
          <span>{tx("路由尝试")}</span>
          <strong>{routeAttemptCountText(detail.attempts.length)}</strong>
        </div>
        {detail.attempts.length === 0 ? (
          <div className="compact-empty">{tx("没有记录到路由尝试")}</div>
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
                    <span>{tx("上游模型")} {attempt.provider_model || "-"}</span>
                    <span>{tx("资源")} {providerResourceAuditLabel(data, attempt.provider_resource_id)}</span>
                    <span>{tx("路由")} {attempt.route_id || "-"}</span>
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
      <span>{tx(label)}</span>
      <strong>{value}</strong>
    </div>
  );
}

function UsageStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="usage-stat">
      <span>{tx(label)}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RequestPayloadSection({ payload }: { payload: RequestPayloadLog | null }) {
  return (
    <div className="request-subsection">
      <div className="request-subsection-title">
        <span>{tx("请求与响应")}</span>
        <strong>{payload ? tx("已记录快照") : tx("未记录")}</strong>
      </div>
      {!payload ? (
        <div className="compact-empty">{tx("这条历史记录没有保存 request / response 快照")}</div>
      ) : (
        <div className="payload-grid">
          <PayloadBlock
            title="Request"
            body={payload.request_body || tx("未记录请求内容")}
            truncated={payload.request_truncated}
          />
          <PayloadBlock
            title="Response"
            body={payload.response_body || tx("未记录响应内容")}
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
        {truncated ? <strong>{tx("已截断")}</strong> : null}
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
        {tx(label)}
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
  categoryFilter,
  onCategoryFilter,
  onQuery,
  onCreate,
  onEdit,
  onDelete,
  onAction,
  onProjectMemberCreate,
  onProjectMemberEdit,
  onProjectMemberDelete,
  onToolbarAction,
}: {
  config: ResourceConfig<T>;
  data: AppData;
  items: T[];
  totalItems: number;
  query: string;
  pagination: PaginationState;
  categoryFilter: string;
  onCategoryFilter: (value: string) => void;
  onQuery: (value: string) => void;
  onCreate: () => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  onAction: (action: ResourceAction<T>, item: T) => void;
  onProjectMemberCreate?: (project: Project) => void;
  onProjectMemberEdit?: (member: AdminResource) => void;
  onProjectMemberDelete?: (member: AdminResource) => void;
  onToolbarAction: (action: ToolbarAction) => void;
}) {
  const [selectedTeamID, setSelectedTeamID] = useState("");
  const [selectedProjectID, setSelectedProjectID] = useState("");
  const isTeamView = config.view === "teams";
  const isProjectView = config.view === "projects";
  const selectedTeam = isTeamView
    ? (items as AdminResource[]).find((item) => item.id === selectedTeamID)
    : undefined;
  const selectedProject = isProjectView
    ? (items as Project[]).find((item) => item.id === selectedProjectID)
    : undefined;

  useEffect(() => {
    if (!isTeamView) return;
    const teamItems = items as AdminResource[];
    if (!selectedTeamID || !teamItems.some((item) => item.id === selectedTeamID)) {
      setSelectedTeamID("");
    }
  }, [isTeamView, items, selectedTeamID]);

  useEffect(() => {
    if (!isProjectView) return;
    const projectItems = items as Project[];
    if (!selectedProjectID || !projectItems.some((item) => item.id === selectedProjectID)) {
      setSelectedProjectID("");
    }
  }, [isProjectView, items, selectedProjectID]);

  const detailPanelOpen = (isTeamView && selectedTeam) || (isProjectView && selectedProject);

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
      {config.view === "notification-channels" ? (
        <NotificationChannelTabs
          data={data}
          active={categoryFilter}
          onChange={onCategoryFilter}
        />
      ) : null}
      <div className="table-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input value={query} onChange={(event) => onQuery(event.target.value)} placeholder={tx("搜索名称、ID、状态")} />
        </div>
        <div className="table-toolbar-actions">
          {config.create ? (
            <button className="button" onClick={onCreate} type="button">
              <Plus size={17} />
              {config.view === "notification-channels" ? `${tx("配置")} ${notificationChannelLabel(categoryFilter)}` : tx(config.createLabel ?? "新增")}
            </button>
          ) : null}
          {(config.toolbarActions ?? []).map((action) => (
            <button className="secondary-button" key={action.label} onClick={() => onToolbarAction(action)} title={tx(action.title ?? action.label)} type="button">
              {tx(action.label)}
            </button>
          ))}
        </div>
      </div>
      <div className={detailPanelOpen ? "resource-detail-layout with-panel" : "resource-detail-layout"}>
        <div className="resource-table-pane">
          <EntityTable
            config={config}
            data={data}
            items={items}
            onEdit={onEdit}
            onDelete={onDelete}
            onAction={onAction}
            onRowClick={
              isTeamView
                ? (item) => setSelectedTeamID((item as AdminResource).id)
                : isProjectView
                  ? (item) => setSelectedProjectID((item as Project).id)
                  : undefined
            }
            selectedRowID={isTeamView ? selectedTeam?.id : isProjectView ? selectedProject?.id : undefined}
          />
          <PaginationControls pagination={pagination} totalItems={totalItems} />
        </div>
        {isTeamView && selectedTeam ? (
          <TeamMembersPanel data={data} team={selectedTeam} onClose={() => setSelectedTeamID("")} />
        ) : null}
        {isProjectView && selectedProject ? (
          <ProjectQuotaPanel
            data={data}
            project={selectedProject}
            onClose={() => setSelectedProjectID("")}
            onAction={(action) => onAction(action as unknown as ResourceAction<T>, selectedProject as T)}
            onCreateMember={() => onProjectMemberCreate?.(selectedProject)}
            onEditMember={(member) => onProjectMemberEdit?.(member)}
            onDeleteMember={(member) => onProjectMemberDelete?.(member)}
          />
        ) : null}
      </div>
    </DataSection>
  );
}

function TeamMembersPanel({ data, team, onClose }: { data: AppData; team: AdminResource; onClose: () => void }) {
  const users = data.users
    .filter((user) => user.team_id === team.id)
    .sort((left, right) => (left.name || left.username).localeCompare(right.name || right.username));
  return (
    <div className="team-members-panel">
      <div className="team-members-head">
        <div>
          <span>{tx("团队用户")}</span>
          <strong>{team.name || team.id}</strong>
        </div>
        <span>{countWithUnit(users.length, "人", "member", "人")}</span>
        <button className="icon-button subtle" onClick={onClose} type="button" title={tx("关闭成员列表")}>
          <X size={15} />
        </button>
      </div>
      <SimpleTable
        columns={["姓名", "邮箱", "用户名", "角色", "状态", "最近登录"]}
        rows={users.map((user) => [
          user.name || "-",
          user.email || "-",
          user.username || "-",
          roleLabel(user.role),
          <StatusPill key={user.id} status={user.status} />,
          formatTime(user.last_login_at ?? ""),
        ])}
      />
    </div>
  );
}

type ProjectQuotaValues = {
  status: string;
  daily_requests: string;
  monthly_requests: string;
  daily_tokens: string;
  monthly_tokens: string;
  daily_cost_usd: string;
  monthly_cost_usd: string;
  max_concurrency: string;
};

const projectQuotaFields: Array<{ key: keyof ProjectQuotaValues; label: string; suffix?: string }> = [
  { key: "daily_requests", label: "日请求" },
  { key: "monthly_requests", label: "月请求" },
  { key: "daily_tokens", label: "日 Token" },
  { key: "monthly_tokens", label: "月 Token" },
  { key: "daily_cost_usd", label: "日成本", suffix: "USD" },
  { key: "monthly_cost_usd", label: "月成本", suffix: "USD" },
  { key: "max_concurrency", label: "最大并发" },
];

function ProjectQuotaPanel({
  data,
  project,
  onClose,
  onAction,
  onCreateMember,
  onEditMember,
  onDeleteMember,
}: {
  data: AppData;
  project: Project;
  onClose: () => void;
  onAction: (action: ResourceAction<Project>) => void;
  onCreateMember?: () => void;
  onEditMember?: (member: AdminResource) => void;
  onDeleteMember?: (member: AdminResource) => void;
}) {
  const quota = projectQuotaPolicy(data, project);
  const [values, setValues] = useState<ProjectQuotaValues>(() => projectQuotaValues(quota));

  useEffect(() => {
    setValues(projectQuotaValues(quota));
  }, [project.id, quota?.id]);

  const hasQuota = Boolean(quota);
  const quotaIssue = projectQuotaIssue(data, project);
  const pendingApproval = pendingProjectQuotaApproval(data, project);
  const members = projectMembersForProject(data, project.id);
  return (
    <div className="project-quota-panel project-detail-panel">
      <div className="project-quota-head">
        <div>
          <span>{tx("项目详情")}</span>
          <strong>{project.name || project.id}</strong>
        </div>
        <button className="icon-button subtle" onClick={onClose} type="button" title={tx("关闭项目详情")}>
          <X size={15} />
        </button>
      </div>
      <div className="project-quota-body">
        <div className="project-panel-section-head">
          <div>
            <strong>{tx("项目成员")}</strong>
            <span>{countWithUnit(members.length, "人", "member", "人")}</span>
          </div>
          <button className="secondary-button compact-button" onClick={onCreateMember} type="button">
            <Plus size={15} />
            {tx("添加成员")}
          </button>
        </div>
        <div className="project-member-list">
          {members.length === 0 ? (
            <div className="empty compact-empty">{tx("暂无项目成员")}</div>
          ) : members.map((member) => (
            <ProjectMemberRow
              key={member.id}
              data={data}
              member={member}
              onEdit={() => onEditMember?.(member)}
              onDelete={() => onDeleteMember?.(member)}
            />
          ))}
        </div>

        <div className="project-panel-section-head">
          <div>
            <strong>{tx("项目额度")}</strong>
            <span>{hasQuota ? tx("已配置项目专属额度") : tx("未配置项目专属额度")}</span>
          </div>
        </div>
        <div className="quota-status-row">
          <div>
            <strong>{hasQuota ? tx("已配置项目专属额度") : tx("未配置项目专属额度")}</strong>
            <span>{tx("留空或填 0 表示该项不限额；Key 自身额度仍会叠加生效。")}</span>
          </div>
          <StatusPill status={values.status || "active"} />
        </div>

        {quotaIssue || pendingApproval ? (
          <div className="quota-request-banner">
            <div>
              <strong>{pendingApproval ? tx("已有额度提升申请待审批") : tx("最近触发了项目额度限制")}</strong>
              <span>
                {pendingApproval
                  ? `${approvalTriggerLabel(pendingApproval.trigger)} ${pendingApproval.id}，${tx("可在审批记录中处理。")}`
                  : `${formatNumber(quotaIssue?.count ?? 0)} ${tx("次额度不足，请填写希望提升后的目标额度再提交审批。")}`}
              </span>
            </div>
            {pendingApproval ? <StatusPill status="pending" label="待审批" /> : <StatusPill status="warning" label="需提升" />}
          </div>
        ) : null}

        <label className="field">
          <span>{tx("状态")}</span>
          <select value={values.status} onChange={(event) => setValues((current) => ({ ...current, status: event.target.value }))}>
            <option value="active">{tx("启用")}</option>
            <option value="disabled">{tx("停用")}</option>
          </select>
        </label>

        <div className="project-quota-grid">
          {projectQuotaFields.map((field) => (
            <label className="field" key={field.key}>
              <span>{tx(field.label)}</span>
              <input
                min="0"
                type="number"
                value={values[field.key]}
                onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}
              />
              {field.suffix ? <small>{field.suffix}</small> : null}
            </label>
          ))}
        </div>

        <div className="project-quota-actions">
          {quotaIssue && !pendingApproval ? (
            <button
              className="secondary-button"
              onClick={() =>
                onAction({
                  label: "提升额度申请",
                  title: "提交项目额度提升审批",
                  run: (ctx) => requestProjectQuotaIncrease(ctx, project, quota, values),
                  doneMessage: () => `${project.name || project.id} 的额度提升申请已提交`,
                })
              }
              type="button"
            >
              {tx("提升额度申请")}
            </button>
          ) : null}
          <button
            className="button"
            onClick={() =>
              onAction({
                label: "保存额度",
                title: "保存项目额度",
                run: (ctx) => saveProjectQuota(ctx, project, quota, values),
                doneMessage: () => `${project.name || project.id} 的额度已保存`,
              })
            }
            type="button"
          >
            {tx("保存额度")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProjectMemberRow({
  data,
  member,
  onEdit,
  onDelete,
}: {
  data: AppData;
  member: AdminResource;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const userID = stringifyValue(member.fields?.user_id);
  const user = data.users.find((item) => item.id === userID);
  const title = user ? user.name || user.username : userID || "-";
  const subtitle = user ? [user.email, user.username].filter(Boolean).join(" / ") : userID;
  return (
    <div className="project-member-row">
      <div className="project-member-user">
        <span className="project-member-avatar"><UserRoundCheck size={16} /></span>
        <div>
          <strong>{title}</strong>
          <span>{subtitle || "-"}</span>
        </div>
      </div>
      <div className="project-member-meta">
        <span>{projectMemberRoleLabel(stringifyValue(member.fields?.role))}</span>
        <span>{projectMemberCanIssueLabel(member)}</span>
        <StatusPill status={member.status} />
      </div>
      <div className="project-member-actions">
        <button className="text-button" onClick={onEdit} type="button">{tx("编辑")}</button>
        <button className="danger-button" onClick={onDelete} type="button" title={tx("删除")}>
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

function ReportsView({
  config,
  data,
  history,
  loading,
  onCreate,
  onEdit,
  onDelete,
  onAction,
  onExport,
}: {
  config: ResourceConfig<AdminResource>;
  data: AppData;
  history: ReportExportHistoryItem[];
  loading: boolean;
  onCreate: () => void;
  onEdit: (item: AdminResource) => void;
  onDelete: (item: AdminResource) => void;
  onAction: (action: ResourceAction<AdminResource>, item: AdminResource) => void;
  onExport: (dataset: string) => void;
}) {
  const savedReports = config.list(data);
  const exports = reportExportDefinitions();
  return (
    <div className="reports-center">
      <div className="reports-export-head">
        <div>
          <h2>{tx("按需导出")}</h2>
          <span>CSV</span>
        </div>
      </div>
      <div className="reports-export-grid">
        {exports.map((item) => {
          const Icon = item.icon;
          return (
            <button
              className={`report-export-card ${item.tone}`}
              disabled={loading}
              key={item.dataset}
              onClick={() => onExport(item.dataset)}
              title={`${tx("导出")} ${item.label}`}
              type="button"
            >
              <span className="report-export-icon">
                <Icon size={18} />
              </span>
              <span className="report-export-copy">
                <strong>{item.label}</strong>
                <span>{tx(item.description)}</span>
              </span>
              <em>CSV</em>
            </button>
          );
        })}
      </div>

      {history.length > 0 ? (
        <DataSection title="最近导出">
          <SimpleTable
            columns={["数据集", "文件", "时间", "账期"]}
            rows={history.map((item) => [
              reportDatasetLabel(item.dataset),
              item.file_name,
              formatTime(item.exported_at),
              item.period || "-",
            ])}
          />
        </DataSection>
      ) : null}

      {savedReports.length > 0 ? (
        <DataSection title="自动导出配置">
          <div className="reports-config-toolbar">
            <button className="button" onClick={onCreate} type="button">
              <Plus size={16} />
              {tx("新增配置")}
            </button>
          </div>
          <EntityTable
            config={config}
            data={data}
            items={savedReports}
            onEdit={onEdit}
            onDelete={onDelete}
            onAction={onAction}
          />
        </DataSection>
      ) : null}
    </div>
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
    <div className="category-tabs" role="tablist" aria-label={tx("模型分类")}>
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

function NotificationChannelTabs({
  data,
  active,
  onChange,
}: {
  data: AppData;
  active: string;
  onChange: (value: string) => void;
}) {
  const tabs = notificationChannelTabs(data);
  return (
    <div className="category-tabs" role="tablist" aria-label={tx("通知渠道类型")}>
      {tabs.map((tab) => (
        <button
          aria-selected={active === tab.key}
          className={active === tab.key ? "category-tab active" : "category-tab"}
          key={tab.key}
          onClick={() => onChange(tab.key)}
          role="tab"
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
  readOnly = false,
  onCreate,
  onEdit,
  onDelete,
  onAction,
}: {
  config: ResourceConfig<Model>;
  data: AppData;
  readOnly?: boolean;
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
            <strong>{tx("模型大类")}</strong>
            <span>{data.models.length} {tx("个模型")}</span>
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
                <strong>{tx(item.label)}</strong>
                <em>{item.count}</em>
              </button>
            ))}
          </div>
        </aside>

        <section className="model-catalog-main">
          <div className="model-filterbar">
            <div className="model-capability-tabs" role="tablist" aria-label={tx("模型能力筛选")}>
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
                <span>{tx(item.label)}</span>
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
                  placeholder={tx("搜索模型名称或 ID")}
                />
              </div>
              {!readOnly ? (
                <button className="button" onClick={onCreate} type="button">
                  <Plus size={17} />
                  {tx(config.createLabel ?? "新增模型")}
                </button>
              ) : null}
            </div>
          </div>

          <div className="model-catalog-summary">
            <span>{tx(modelCatalogFilterLabel(categories, category))}</span>
            <strong>{filtered.length}</strong>
            <em>{tx("个匹配模型")}</em>
          </div>

          {filtered.length === 0 ? (
            <div className="empty model-catalog-empty">
              {data.models.length === 0 && readOnly
                ? tx("当前后台还没有启用可用模型路由，请让管理员在路由策略里启用模型。")
                : tx("没有匹配的模型")}
            </div>
          ) : (
            <div className="model-card-grid">
              {filtered.map((model) => (
                <ModelCatalogCard
                  key={model.name}
                  model={model}
                  data={data}
                  readOnly={readOnly}
                  actions={readOnly ? [] : config.actions ?? []}
                  onAction={onAction}
                  onEdit={readOnly ? undefined : onEdit}
                  onDelete={readOnly ? undefined : onDelete}
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
            <strong>{tx("统一模型")}</strong>
            <span>{configuredCount} {tx("个已配置路由")}</span>
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
                <strong>{tx(item.label)}</strong>
                <em>{item.count}</em>
              </button>
            ))}
          </div>
        </aside>

        <section className="model-catalog-main">
          <div className="model-filterbar">
            <div className="model-capability-tabs" role="tablist" aria-label={tx("路由显示范围")}>
              <button
                aria-selected={scope === "configured"}
                className={scope === "configured" ? "model-capability-tab active" : "model-capability-tab"}
                onClick={() => setScope("configured")}
                role="tab"
                type="button"
              >
                <Gauge size={14} />
                <span>{tx("已配置")}</span>
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
                <span>{tx("全部模型")}</span>
                <em>{data.models.length}</em>
              </button>
            </div>
            <div className="model-catalog-actions">
              <div className="search-box model-search">
                <Search size={16} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tx("搜索模型或 Provider")} />
              </div>
              <button className="button" onClick={onCreate} type="button">
                <Plus size={17} />
                {tx(config.createLabel ?? "新增路由")}
              </button>
            </div>
          </div>

          <div className="model-catalog-summary">
            <span>{tx(modelCatalogFilterLabel(categories, category))}</span>
            <strong>{filtered.length}</strong>
            <em>{tx("个模型")} · {activeRouteCount}/{data.routes.length} {tx("条启用线路")}</em>
          </div>

          {filtered.length === 0 ? (
            <div className="empty model-catalog-empty">{tx("没有匹配的模型路由")}</div>
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
          <StatusPill status={routes.length > 0 ? "active" : "disabled"} label={routes.length > 0 ? `${activeRoutes.length}/${routes.length} ${tx("启用")}` : tx("未配置")} />
          <span>{tx("按上到下顺序调用")}</span>
        </div>
      </div>

      {routes.length === 0 ? (
        <div className="empty route-empty">{tx("该统一模型还没有 Provider 线路")}</div>
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
      <button className="route-drag-handle" disabled={loading} title={tx("拖动调整调用顺序")} type="button">
        <GripVertical size={15} />
      </button>
      <div className="route-order-badge">{index === 0 ? tx("主") : index + 1}</div>
      <div className="route-provider-main">
        <strong>{provider?.name || route.provider_id}</strong>
        <span>{providerTypeLabel(provider?.type)} · {provider?.base_url || tx("未配置 Base URL")}</span>
      </div>
      <div className="route-upstream-model">
        <strong>{route.provider_model}</strong>
        <span>{routeStrategyLabel(route.strategy)} · P{route.priority} · W{route.weight}</span>
      </div>
      <StatusPill status={route.status} />
      <div className="route-row-actions">
        <button className="text-button" onClick={onEdit} type="button">{tx("编辑")}</button>
        <button className="danger-button" onClick={onDelete} title={tx("删除")} type="button">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

function ModelCatalogCard({
  model,
  data,
  readOnly = false,
  actions,
  onAction,
  onEdit,
  onDelete,
}: {
  model: Model;
  data: AppData;
  readOnly?: boolean;
  actions: ResourceAction<Model>[];
  onAction: (action: ResourceAction<Model>, item: Model) => void;
  onEdit?: (item: Model) => void;
  onDelete?: (item: Model) => void;
}) {
  const category = modelCategory(model);
  const routeCount = activeRouteCount(model.name, data);
  const hasConfiguredRoute = routeCount > 0;
  const cardClassName = !readOnly && !hasConfiguredRoute ? "model-card unrouted" : "model-card";
  return (
    <article className={cardClassName}>
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
        {readOnly ? (
          <span className="official">{tx("可访问")}</span>
        ) : (
          <>
            <span className={hasConfiguredRoute ? undefined : "unrouted-tag"}>{hasConfiguredRoute ? `${routeCount} ${tx("条线路")}` : tx("未配置线路")}</span>
            {hasThirdPartyRoute(model, data) ? <span className="third">{tx("三方资源")}</span> : <span className="official">{tx("官方资源")}</span>}
          </>
        )}
      </div>

      <div className="model-card-pricing">
        <ModelMetric label="输入" value={priceMetric(model.input_price_usd_per_1m)} muted={!model.input_price_usd_per_1m} />
        <ModelMetric label="输出" value={priceMetric(model.output_price_usd_per_1m)} muted={!model.output_price_usd_per_1m} />
        <ModelMetric label="上下文" value={model.context_window ? formatNumber(model.context_window) : "-"} />
        <ModelMetric label="Embedding" value={priceMetric(model.embedding_price_usd_per_1m)} muted={!model.embedding_price_usd_per_1m} />
      </div>

      {!readOnly ? (
        <div className="model-card-routes">
          <ModelRouteProviders model={model} data={data} />
        </div>
      ) : null}

      {actions.length > 0 || onEdit || onDelete ? (
        <div className="model-card-actions">
          {actions.map((action) => (
            <button className="text-button" key={action.label} onClick={() => onAction(action, model)} type="button">
              {tx(action.label)}
            </button>
          ))}
          {onEdit ? <button className="text-button" onClick={() => onEdit(model)} type="button">{tx("编辑")}</button> : null}
          {onDelete ? (
            <button className="danger-button" onClick={() => onDelete(model)} title={tx("删除")} type="button">
              <Trash2 size={15} />
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function ModelMetric({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={muted ? "model-metric muted" : "model-metric"}>
      <strong>{value}</strong>
      <span>{tx(label)}</span>
    </div>
  );
}

function SettingsView({
  data,
  activeTab,
  language,
  onTabChange,
  onLanguageChange,
  onCreate,
  onEdit,
  onDelete,
  onAction,
  onToolbarAction,
}: {
  data: AppData;
  activeTab: SettingsTabKey;
  language: AppLanguage;
  onTabChange: (tab: SettingsTabKey) => void;
  onLanguageChange: (language: AppLanguage) => void;
  onCreate: (config: ResourceConfig<AdminResource>) => void;
  onEdit: (config: ResourceConfig<AdminResource>, item: AdminResource) => void;
  onDelete: (config: ResourceConfig<AdminResource>, item: AdminResource) => void;
  onAction: (action: ResourceAction<AdminResource>, item: AdminResource) => void;
  onToolbarAction: (action: ToolbarAction, items: AdminResource[]) => void;
}) {
  const configs = useMemo(() => [systemSettingConfig(), roleConfig(), identityProviderConfig()], []);
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
      <LanguagePreferenceCard language={language} onChange={onLanguageChange} />
      <div className="settings-tabs" role="tablist" aria-label={tx("系统设置分类")}>
        {configs.map((config) => (
          <button
            aria-selected={activeConfig.view === config.view}
            className={activeConfig.view === config.view ? "settings-tab active" : "settings-tab"}
            key={config.view}
            onClick={() => onTabChange(config.view as SettingsTabKey)}
            role="tab"
            type="button"
          >
            {settingsTabLabel(config.view as SettingsTabKey)}
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

function LanguagePreferenceCard({
  language,
  onChange,
}: {
  language: AppLanguage;
  onChange: (language: AppLanguage) => void;
}) {
  const current = languageOptions.find((option) => option.value === language) ?? languageOptions[0];
  return (
    <section className="language-card">
      <div>
        <strong>{tx("界面语言")}</strong>
        <span>{tx("选择控制台显示语言，偏好会保存在当前浏览器。")}</span>
      </div>
      <div className="language-card-control">
        <small>{tx("当前语言")}: {languageOptionLabel(current, language)}</small>
        <LanguageSwitcher language={language} onChange={onChange} />
      </div>
    </section>
  );
}

function LanguageSwitcher({
  language,
  onChange,
  className,
}: {
  language: AppLanguage;
  onChange: (language: AppLanguage) => void;
  className?: string;
}) {
  return (
    <div className={className ? `language-switcher ${className}` : "language-switcher"} role="radiogroup" aria-label={tx("界面语言")}>
      {languageOptions.map((option) => (
        <button
          aria-checked={language === option.value}
          className={language === option.value ? "active" : ""}
          key={option.value}
          onClick={() => onChange(option.value)}
          role="radio"
          type="button"
        >
          <span>{languageOptionLabel(option, language)}</span>
        </button>
      ))}
    </div>
  );
}

function languageOptionLabel(option: { label: string; nativeLabel: string }, language: AppLanguage) {
  return language === "en" ? option.label : option.nativeLabel;
}

function APIKeyFlowHint({ data }: { data: AppData }) {
  return (
    <div className="workflow-hint">
      <div>
        <strong>{tx("Key 归属逻辑")}</strong>
        <span>{tx("内部应用配置项目下发放的 Key；额度、模型白名单、用量和成本都会归属到该项目。")}</span>
      </div>
      <div className="workflow-hint-stats">
        <span>{countWithLabel(data.projects.length, "个项目")}</span>
        <span>{countWithLabel(data.keys.length, "个 Key")}</span>
      </div>
    </div>
  );
}

function RouteStrategyHint({ data }: { data: AppData }) {
  const activeRoutes = data.routes.filter((route) => route.status === "active").length;
  return (
    <div className="workflow-hint">
      <div>
        <strong>{tx("模型路由器")}</strong>
        <span>{tx("平衡模式综合权重、质量和成本；质量优先会先选高质量线路；成本优先会先选低成本线路。调用失败时会按候选顺序自动回退。")}</span>
      </div>
      <div className="workflow-hint-stats">
        <span>{activeRoutes} {tx("条启用线路")}</span>
        <span>{data.providers.filter((provider) => provider.status === "active").length} Provider</span>
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
  onRowClick,
  selectedRowID,
}: {
  config: ResourceConfig<T>;
  data: AppData;
  items: T[];
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  onAction: (action: ResourceAction<T>, item: T) => void;
  onRowClick?: (item: T) => void;
  selectedRowID?: string;
}) {
  if (items.length === 0) {
    return <div className="empty">{tx("暂无数据")}</div>;
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {config.columns.map((column) => (
              <th key={column.key}>{tx(column.label)}</th>
            ))}
            <th>{tx("操作")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              className={`${onRowClick ? "clickable-row" : ""} ${selectedRowID === rowID(item) ? "selected-row" : ""}`}
              key={rowID(item)}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
            >
              {config.columns.map((column) => (
                <td key={column.key}>
                  {config.view === "api-keys" && column.key === "status" ? (
                    <APIKeyStatusSwitch
                      item={item as APIKey}
                      onToggle={(nextStatus) => onAction(apiKeyStatusAction(nextStatus) as unknown as ResourceAction<T>, item)}
                    />
                  ) : column.render ? (
                    translatedCell(column.render(item, data))
                  ) : (
                    displayCellValue(readPath(item, column.key))
                  )}
                </td>
              ))}
              <td>
                <div className="row-actions" onClick={(event) => event.stopPropagation()}>
                  {(config.actions ?? [])
                    .filter((action) => action.visible?.(item) ?? true)
                    .map((action) => (
                      <button
                        className="text-button"
                        key={action.label}
                        onClick={() => onAction(action, item)}
                        title={tx(action.title ?? action.label)}
                        type="button"
                      >
                        {tx(action.label)}
                      </button>
                    ))}
                  {config.update ? (
                    <button className="text-button" onClick={() => onEdit(item)} type="button">
                      {tx("编辑")}
                    </button>
                  ) : null}
                  {config.remove ? (
                    <button className="danger-button" onClick={() => onDelete(item)} type="button" title={tx("删除")}>
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

function displayCellValue(value: unknown) {
  if (typeof value === "string") return displayText(value);
  return value as React.ReactNode;
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
        {activeLanguage === "zh-CN"
          ? `第 ${pagination.startIndex + 1}-${pagination.endIndex} 条，共 ${totalItems} 条`
          : activeLanguage === "ja"
            ? `${pagination.startIndex + 1}-${pagination.endIndex} / ${totalItems} 件`
            : `${pagination.startIndex + 1}-${pagination.endIndex} of ${totalItems}`}
      </div>
      <div className="pagination-controls">
        <label className="page-size">
          <span>{tx("每页")}</span>
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
            title={tx("第一页")}
            onClick={() => pagination.setPage(1)}
            disabled={pagination.page <= 1}
          >
            <ChevronsLeft size={15} />
          </button>
          <button
            type="button"
            title={tx("上一页")}
            onClick={() => pagination.setPage(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            <ChevronLeft size={15} />
          </button>
          <span>{pagination.page} / {pagination.pageCount}</span>
          <button
            type="button"
            title={tx("下一页")}
            onClick={() => pagination.setPage(pagination.page + 1)}
            disabled={pagination.page >= pagination.pageCount}
          >
            <ChevronRight size={15} />
          </button>
          <button
            type="button"
            title={tx("最后一页")}
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
  currentUser,
  loading,
  onClose,
  onSave,
}: {
  state: ModalState<T>;
  data: AppData;
  currentUser?: AdminUser | null;
  loading: boolean;
  onClose: () => void;
  onSave: (values: Record<string, string>) => void;
}) {
  const initial = {
    ...(state.item ? state.config.toForm?.(state.item) ?? {} : defaultFormValues(state.config, data, currentUser)),
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
            <p className="eyebrow">{state.item ? tx("编辑") : tx("新增")}</p>
            <h2>{tx(state.config.title)}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button" title={tx("关闭")}>×</button>
        </div>
        <div className="modal-body">
          {state.config.fields.filter((field) => field.visible?.(values) ?? true).map((field) => (
            <FieldInput
              key={field.key}
              field={field}
              data={data}
              currentUser={currentUser}
              value={values[field.key] ?? ""}
              editing={Boolean(state.item)}
              onChange={(value) => setValues((prev) => ({ ...prev, [field.key]: value }))}
            />
          ))}
        </div>
        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose} type="button">{tx("取消")}</button>
          <button className="button" disabled={loading} type="submit">{tx("保存")}</button>
        </div>
      </form>
    </div>
  );
}

function UserImportModal({
  loading,
  onClose,
  onImport,
}: {
  loading: boolean;
  onClose: () => void;
  onImport: (content: string) => void;
}) {
  const [content, setContent] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onImport(content);
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="modal user-import-modal" onSubmit={submit}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">{tx("批量导入")}</p>
            <h2>{tx("导入用户")}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button" title={tx("关闭")}>×</button>
        </div>
        <div className="modal-body user-import-body">
          <label className="field">
            <span>{tx("CSV 内容")}</span>
            <textarea
              className="user-import-textarea"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={"username,name,email,role,team_id,status\nzhangsan,张三,zhangsan@example.com,user,team_platform,active"}
              required
            />
            <small>{tx("按 username 或 email 匹配已有用户；匹配到则更新，未匹配则创建。")}</small>
          </label>
          <div className="user-import-example">
            <strong>{tx("字段顺序")}</strong>
            <code>username,name,email,role,team_id,status</code>
            <span>{tx("role 可填 admin、team_leader、user；status 可填 active 或 disabled。")}</span>
          </div>
        </div>
        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose} type="button">{tx("取消")}</button>
          <button className="button" disabled={loading} type="submit">{loading ? tx("导入中") : tx("开始导入")}</button>
        </div>
      </form>
    </div>
  );
}

function PlaygroundPage({ api, data, canViewRoutes }: { api: ApiContext; data: AppData; canViewRoutes: boolean }) {
  return (
    <section className="playground-page">
      <PlaygroundPanel api={api} data={data} canViewRoutes={canViewRoutes} />
    </section>
  );
}

function PlaygroundPanel({
  api,
  data,
  canViewRoutes,
}: {
  api: ApiContext;
  data: AppData;
  canViewRoutes: boolean;
}) {
  const models = useMemo(() => playgroundModels(data, canViewRoutes), [data.models, data.routes, canViewRoutes]);
  const [modelName, setModelName] = useState(models[0]?.name ?? "");
  const [messages, setMessages] = useState<PlaygroundMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(defaultPlaygroundSystemPrompt);
  const [responseFormat, setResponseFormat] = useState("text");
  const [maxTokens, setMaxTokens] = useState("4096");
  const [temperature, setTemperature] = useState("0.7");
  const [presencePenalty, setPresencePenalty] = useState("0.0");
  const [frequencyPenalty, setFrequencyPenalty] = useState("0.0");
  const [minP, setMinP] = useState("0.00");
  const [topK, setTopK] = useState("50");
  const [showCode, setShowCode] = useState(false);
  const [showModelDetails, setShowModelDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState<PlaygroundChatPayload | null>(null);
  const selectedModel = models.find((model) => model.name === modelName);
  const selectedModelRouteCount = canViewRoutes && selectedModel ? activeRouteCount(selectedModel.name, data) : 0;
  const contextWindow = selectedModel?.context_window ?? 0;
  const maxTokenLimit = Math.max(4096, Math.min(contextWindow || 32768, 200000));
  const inputPrice = selectedModel?.input_price_usd_per_1m ?? 0;
  const outputPrice = selectedModel?.output_price_usd_per_1m ?? 0;

  useEffect(() => {
    if (!modelName && models[0]?.name) {
      setModelName(models[0].name);
    }
  }, [modelName, models]);

  const languageVersion = activeLanguage;
  useEffect(() => {
    setSystemPrompt((current) => isDefaultPlaygroundSystemPrompt(current) ? defaultPlaygroundSystemPrompt() : current);
  }, [languageVersion]);

  useEffect(() => {
    const parsed = Number(maxTokens);
    if (Number.isFinite(parsed) && parsed > maxTokenLimit) {
      setMaxTokens(String(maxTokenLimit));
    }
  }, [maxTokenLimit, maxTokens]);

  async function sendMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const content = draft.trim();
    if (!content || !modelName || loading) return;
    const userMessage: PlaygroundMessage = { id: uniqueUIID("msg"), role: "user", content };
    const nextMessages = [...messages, userMessage];
    const messagesForRequest = systemPrompt.trim()
      ? [{ role: "system", content: systemPrompt.trim() }, ...nextMessages.map((message) => ({ role: message.role, content: message.content }))]
      : nextMessages.map((message) => ({ role: message.role, content: message.content }));
    setMessages(nextMessages);
    setDraft("");
    setError("");
    setLoading(true);
    try {
      const numericTemperature = Number(temperature);
      const numericMaxTokens = Number(maxTokens);
      const resp = await adminFetch(api, "/api/admin/playground/chat", {
        method: "POST",
        body: JSON.stringify({
          model: modelName,
          messages: messagesForRequest,
          max_tokens: Number.isFinite(numericMaxTokens) && numericMaxTokens > 0 ? Math.round(numericMaxTokens) : undefined,
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
          content: assistantText || tx("模型没有返回可展示内容。"),
        },
      ]);
    } catch (err) {
      if (isAuthExpiredError(err)) return;
      setError(err instanceof Error ? err.message : tx("演练请求失败"));
    } finally {
      setLoading(false);
    }
  }

  function clearHistory() {
    setMessages([]);
    setLastResult(null);
    setError("");
  }

  return (
    <div className="playground-shell">
      <aside className="playground-config" aria-label={tx("模型配置")}>
        <label className="playground-model-select">
          <select value={modelName} onChange={(event) => setModelName(event.target.value)} disabled={models.length === 0}>
            {models.length === 0 ? <option value="">{tx("暂无聊天模型")}</option> : null}
            {models.map((model) => {
              const routeCount = canViewRoutes ? activeRouteCount(model.name, data) : 0;
              return (
                <option key={model.name} value={model.name}>
                  {!canViewRoutes ? model.name : routeCount > 0 ? `${model.name} · ${countWithUnit(routeCount, "条路由", "route", "件のルート")}` : `${model.name} · ${tx("未配置路由")}`}
                </option>
              );
            })}
          </select>
        </label>

        <div className="playground-config-body">
          <h2>{tx("模型配置")}</h2>
          <label className="playground-field">
            <span>{tx("响应格式")}</span>
            <select value={responseFormat} onChange={(event) => setResponseFormat(event.target.value)}>
              <option value="text">text</option>
            </select>
          </label>
          <label className="playground-field">
            <span>{tx("系统提示")}</span>
            <textarea value={systemPrompt} onChange={(event) => setSystemPrompt(event.target.value)} />
          </label>
          <PlaygroundConfigSlider label="max_tokens" value={maxTokens} onChange={setMaxTokens} min={128} max={maxTokenLimit} step={128} />
          <PlaygroundConfigSlider label="temperature" value={temperature} onChange={setTemperature} min={0} max={2} step={0.1} />
          <PlaygroundConfigSlider label="presence_penalty" value={presencePenalty} onChange={setPresencePenalty} min={-2} max={2} step={0.1} />
          <PlaygroundConfigSlider label="frequency_penalty" value={frequencyPenalty} onChange={setFrequencyPenalty} min={-2} max={2} step={0.1} />
          <PlaygroundConfigSlider label="min_p" value={minP} onChange={setMinP} min={0} max={1} step={0.01} />
          <PlaygroundConfigSlider label="top_k" value={topK} onChange={setTopK} min={0} max={100} step={1} />
          <div className="playground-functions">
            <strong>{tx("函数")}</strong>
            <button type="button" className="secondary-button compact" disabled title={tx("函数调用配置待接入")}>
              <Plus size={14} />
              {tx("添加函数")}
            </button>
          </div>
        </div>
      </aside>

      <section className="playground-main" aria-label={tx("模型演练对话")}>
        <div className="playground-model-bar">
          <div className="playground-model-title">
            <button type="button" className="playground-copy-model" title={tx("复制模型名")} onClick={() => navigator.clipboard?.writeText(modelName).catch(() => undefined)}>
              <strong>{modelName || tx("选择模型")}</strong>
              <Copy size={13} />
            </button>
            <span>
              {contextWindow ? `${formatNumber(contextWindow)} ${tx("上下文")}` : `${tx("上下文")} -`}
              <em />
              ${formatMoney(inputPrice)}/Mt {tx("输入")}
              <em />
              ${formatMoney(outputPrice)}/Mt {tx("输出")}
              {canViewRoutes ? (
                <>
                  <em />
                  {countWithUnit(selectedModelRouteCount, "条启用路由", "active route", "件の有効ルート")}
                </>
              ) : null}
            </span>
          </div>
          <div className="playground-actions">
            <button type="button" className={showModelDetails ? "secondary-button compact active" : "secondary-button compact"} onClick={() => setShowModelDetails((value) => !value)}>
              <Sparkles size={14} />
              {tx("模型详情")}
            </button>
            <button type="button" className={showCode ? "secondary-button compact active" : "secondary-button compact"} onClick={() => setShowCode((value) => !value)}>
              <Code2 size={14} />
              {tx("查看代码")}
            </button>
            <button type="button" className="secondary-button compact" onClick={clearHistory} disabled={messages.length === 0 && !lastResult}>
              <Trash2 size={14} />
              {tx("清空历史")}
            </button>
          </div>
        </div>

        {showModelDetails ? (
          <div className="playground-detail-strip">
            <DetailField label="类型" value={selectedModel ? modelCategoryLabel(modelCategory(selectedModel)) : "-"} />
            <DetailField label="能力" value={selectedModel?.modality || "chat"} />
            <DetailField label="上下文" value={contextWindow ? formatNumber(contextWindow) : "-"} />
            <DetailField label="最近路由" value={lastResult?.route ? `${lastResult.route.provider_name || lastResult.route.provider_id} / ${lastResult.route.provider_model}` : "待请求"} />
          </div>
        ) : null}

        {showCode ? (
          <div className="playground-code-drawer">
            <PlaygroundAPIExamples baseURL={api.baseURL} modelName={modelName || selectedModel?.name || "gpt-4.1-mini"} />
          </div>
        ) : null}

        {lastResult?.route ? (
          <div className="playground-route">
            <span>{lastResult.route.provider_name || lastResult.route.provider_id || "-"}</span>
            <em>{lastResult.route.provider_model || "-"}</em>
            <small>{lastResult.route.resource_name || lastResult.route.resource_id || tx("默认资源")} · {routeStrategyLabel(lastResult.route.strategy)} · {countWithUnit(lastResult.attempts?.length ?? 0, "次尝试", "attempt", "回試行")}</small>
          </div>
        ) : null}

        {error ? <div className="status-line error playground-error">{error}</div> : null}

        <div className="playground-chat">
          {messages.length === 0 ? (
            <div className="playground-empty">
              <Sparkles size={22} />
              <strong>{tx("试用")} {modelName || tx("当前模型")}</strong>
              <span>{canViewRoutes && data.routes.length === 0 ? tx("当前还没有配置模型路由。") : tx("体验一下，看看模型在 TokenHub 网关上的表现")}</span>
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
            placeholder={tx("说点什么...")}
            disabled={loading || models.length === 0}
          />
          <div className="playground-composer-actions">
            <button className="secondary-button compact" type="button" disabled title={tx("文件上传待接入")}>
              <Plus size={14} />
              {tx("上传文件")}
            </button>
            {lastResult?.usage ? (
              <div className="playground-foot">
                <span>Prompt {formatNumber(lastResult.usage.prompt_tokens ?? 0)}</span>
                <span>Completion {formatNumber(lastResult.usage.completion_tokens ?? 0)}</span>
                <span>Total {formatNumber(lastResult.usage.total_tokens ?? 0)}</span>
                {lastResult.request_id ? <span>{lastResult.request_id}</span> : null}
              </div>
            ) : null}
            <button className="playground-send-button" disabled={loading || !draft.trim() || models.length === 0} type="submit" title={tx("发送")}>
              <Send size={18} />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function PlaygroundConfigSlider({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min: number;
  max: number;
  step: number;
}) {
  const numeric = Number(value);
  const rangeValue = Number.isFinite(numeric) ? Math.min(max, Math.max(min, numeric)) : min;
  return (
    <label className="playground-slider">
      <div>
        <span>{label}</span>
        <input type="number" value={value} min={min} max={max} step={step} onChange={(event) => onChange(event.target.value)} />
      </div>
      <input type="range" value={rangeValue} min={min} max={max} step={step} onChange={(event) => onChange(event.target.value)} />
    </label>
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
          <strong>{tx("API 使用")}</strong>
          <span>{tx("使用以下代码示例集成 TokenHub 模型接口")}</span>
        </div>
        <button className="icon-button subtle" onClick={() => void copyCurrent()} type="button" title={tx("复制代码")}>
          {copied ? <Check size={15} /> : <Copy size={15} />}
        </button>
      </div>
      <div className="api-example-tabs" role="tablist" aria-label={tx("API 调用语言")}>
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
        <em>{modelName || tx("未选择模型")}</em>
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
          const message = err instanceof Error ? err.message : tx("Provider 模板加载失败");
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
      setNotice(`${tx("Provider 已")}${tx(mode === "edit" ? "更新" : "新增")}${routed ? `，${tx("创建")} ${countWithUnit(routed, `条${modelCategoryLabel(modelCategory)}路由`, `${modelCategoryLabel(modelCategory)} route`, `${modelCategoryLabel(modelCategory)} ルート`)}` : ""}`);
      await onSaved();
    } catch (err) {
      if (isAuthExpiredError(err)) return;
      setError(err instanceof Error ? err.message : tx("保存失败"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="modal provider-modal" onSubmit={submit}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">{tx(mode === "edit" ? "编辑" : "新增")}</p>
            <h2>{tx("Provider 渠道")}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button" title={tx("关闭")}>×</button>
        </div>
        <div className="provider-modal-body">
          <section className="provider-catalog-pane">
            <div className="provider-catalog-head">
              <strong>{tx("模型类型")}</strong>
              <span>{countWithLabel(availableCategories.length, "类")}</span>
            </div>
            <div className="provider-category-list">
              {availableCategories.map((category) => (
                <button
                  className={category.key === modelCategory ? "provider-category-item active" : "provider-category-item"}
                  key={category.key}
                  onClick={() => selectCategory(category.key)}
                  type="button"
                >
                  <strong>{tx(category.label)}</strong>
                  <span>{countWithLabel(category.count, "个模型")}</span>
                </button>
              ))}
            </div>

            <div className="provider-catalog-head provider-catalog-subhead">
              <strong>{tx("渠道商")}</strong>
              <span>{filteredCatalog.length}/{categoryCatalog.length}</span>
            </div>
            <button
              className={catalogID === "custom" ? "custom-provider-button active" : "custom-provider-button"}
              onClick={selectCustomCatalog}
              type="button"
            >
              <Plus size={14} />
              <span>{tx("自定义渠道商")}</span>
              <em>{modelCategoryLabel(modelCategory)} · {countWithLabel(customCatalogEntry.models_count, "个标准模型")}</em>
            </button>
            <div className="provider-template-search">
              <Search size={14} />
              <input
                value={catalogQuery}
                onChange={(event) => setCatalogQuery(event.target.value)}
                placeholder={tx("搜索渠道商、ID、类型")}
              />
            </div>
            <div className="provider-catalog-list compact">
              {filteredCatalog.length === 0 ? (
                <div className="empty compact-empty">
                  <span>{tx("没有匹配的渠道商")}</span>
                  <button className="secondary-button" onClick={selectCustomCatalog} type="button">{tx("使用自定义渠道商")}</button>
                </div>
              ) : filteredCatalog.map((entry) => (
                <button
                  className={entry.id === catalogID ? "catalog-item active" : "catalog-item"}
                  key={entry.id}
                  onClick={() => selectCatalog(entry)}
                  type="button"
                >
                  <strong>{entry.display_name || entry.name}</strong>
                  <span>{providerTypeLabel(entry.type)} · {countWithLabel(providerEntryCategoryCount(entry, modelCategory), "个模型")}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="provider-config-pane">
            <div className="provider-selected-summary">
              <strong>{modelCategoryLabel(modelCategory)}</strong>
              <span>{selectedEntry?.display_name || selectedEntry?.name || tx("请选择渠道商")}</span>
              <em>{providerTypeLabel(selectedEntry?.type || values.type || "openai_compatible")}</em>
            </div>
            <div className="provider-form-grid">
              <label className="field">
                <span>Provider ID</span>
                <input value={values.id ?? ""} onChange={(event) => update("id", event.target.value)} placeholder={catalogID === "custom" ? tx("例如 prv_company_proxy") : tx("留空自动生成")} readOnly={mode === "edit"} />
              </label>
              <label className="field">
                <span>{tx("渠道名称")}</span>
                <input value={values.name ?? ""} onChange={(event) => update("name", event.target.value)} required />
              </label>
              <label className="field">
                <span>{tx("渠道商类型")}</span>
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
                {mode === "edit" ? <small>{tx("留空表示不修改现有 Key；填写新值才会覆盖。")}</small> : null}
              </label>
              <label className="field">
                <span>{tx("优先级")}</span>
                <input value={values.priority ?? "10"} type="number" onChange={(event) => update("priority", event.target.value)} />
              </label>
            </div>

            <div className="provider-import-options">
              <div>
                <strong>{tx("自动路由")}</strong>
                <span>{mode === "edit" ? tx("开启后会为下方勾选模型补齐缺失线路，不覆盖已有策略。") : tx("保存渠道时会自动创建下方勾选模型的默认路由。")}</span>
              </div>
              <div className="boolean-toggle provider-route-toggle" role="radiogroup" aria-label={tx("自动路由")}>
                <button
                  aria-checked={autoRouteEnabled}
                  className={autoRouteEnabled ? "active" : ""}
                  onClick={() => update("create_routes", "true")}
                  role="radio"
                  type="button"
                >
                  {tx("开启")}
                </button>
                <button
                  aria-checked={!autoRouteEnabled}
                  className={!autoRouteEnabled ? "active" : ""}
                  onClick={() => update("create_routes", "false")}
                  role="radio"
                  type="button"
                >
                  {tx("关闭开关")}
                </button>
              </div>
            </div>

            <div className="provider-model-head">
              <div>
                <strong>{tx("上游模型映射")}</strong>
                <span>{detail ? `${models.length}/${detail.models_count} ${tx("个可映射模型")}` : tx("加载中")}</span>
              </div>
              <div className="provider-model-tools">
                <input value={modelQuery} onChange={(event) => setModelQuery(event.target.value)} placeholder={tx("搜索模型、能力、参数")} />
                <button className="secondary-button" onClick={() => selectedEntry && selectCatalog(selectedEntry)} type="button">
                  {tx("重新加载")}
                </button>
              </div>
            </div>
            <div className="provider-model-list">
              {modelLoading ? (
                <div className="empty">{tx("正在加载模型列表...")}</div>
              ) : modelError ? (
                <div className="empty">{modelError}</div>
              ) : filteredModels.length === 0 ? (
                <div className="empty">{models.length === 0 ? tx("该渠道商暂无可匹配当前标准模型目录的上游模型") : tx("没有匹配的模型")}</div>
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
                      {existingRouteModels.has(model.canonical_name || canonicalModelNameForUI(model.id, model.display_name)) ? ` · ${tx("已有路由")}` : ""}
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
                ? tx("已关闭自动路由：保存后只创建 Provider，不生成路由策略。")
                : selectedRouteCount > 0
                  ? `${tx("保存后会为")} ${selectedRouteCount} ${tx("个已选")} ${modelCategoryLabel(modelCategory)} ${tx("模型创建缺失的默认路由。")}`
                  : tx("当前没有勾选模型，保存后不会生成路由策略。")}
            </p>
          </section>
        </div>
        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose} type="button">{tx("取消")}</button>
          <button className="button" disabled={loading} type="submit">{tx("保存")}</button>
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
        <h2>{tx(title)}</h2>
        <p>{tx(message)}</p>
        <div className="modal-actions">
          <button className="secondary-button" onClick={onCancel} type="button">{tx("取消")}</button>
          <button className="danger-confirm" onClick={onConfirm} disabled={loading} type="button">{tx("删除")}</button>
        </div>
      </div>
    </div>
  );
}

function IssuedKeyModal({ value, onClose }: { value: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copyKey() {
    try {
      await navigator.clipboard?.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="confirm-modal issued-key-modal" role="dialog" aria-modal="true" aria-labelledby="issued-key-title">
        <div className="issued-key-icon" aria-hidden="true">
          <KeyRound size={18} />
        </div>
        <div>
          <p className="eyebrow">{tx("新 Key 仅展示一次：")}</p>
          <h2 id="issued-key-title">{tx("新 Key 已生成")}</h2>
          <p>{tx("请现在复制并保存这个 Key。关闭弹窗后将无法再次查看完整 Key，只能通过轮换生成新的 Key。")}</p>
        </div>
        <label className="issued-key-field">
          <span>{tx("完整 Key")}</span>
          <textarea
            readOnly
            value={value}
            onFocus={(event) => event.currentTarget.select()}
          />
        </label>
        <div className="modal-actions">
          <button className="secondary-button" onClick={() => void copyKey()} type="button">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? tx("已复制") : tx("复制 Key")}
          </button>
          <button className="button" onClick={onClose} type="button">{tx("我已保存，关闭")}</button>
        </div>
      </div>
    </div>
  );
}

function FieldInput({
  field,
  data,
  currentUser,
  value,
  editing,
  onChange,
}: {
  field: FieldConfig;
  data: AppData;
  currentUser?: AdminUser | null;
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
}) {
  const [filter, setFilter] = useState("");
  const readOnly = editing && field.readOnlyOnEdit;
  let options = field.optionsFromData?.(data, currentUser) ?? (field.options ?? []).map((option) => ({ value: option, label: enumOptionLabel(field.key, option) }));
  if (value && !options.some((option) => option.value === value)) {
    options = [...options, { value, label: value }];
  }
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
        <span>{tx(field.label)}</span>
        <div className="multi-select-tools">
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder={tx("搜索模型")}
            type="search"
          />
          <button
            className="secondary-button"
            onClick={() => updateSelected(new Set([...selected, ...filteredOptions.map((option) => option.value)]))}
            type="button"
          >
            {tx("全选")}
          </button>
          <button className="secondary-button" onClick={() => onChange("")} type="button">
            {tx("清空")}
          </button>
        </div>
        <div className="multi-select-list">
          {filteredOptions.length === 0 ? (
            <div className="empty">{tx("没有匹配的模型")}</div>
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
              <span>{tx(option.label)}</span>
            </label>
          ))}
        </div>
        <small>{selectedCount > 0 ? selectedModelsText(selectedCount) : tx("请选择至少一个统一模型")}</small>
        {field.help ? <small>{tx(field.help)}</small> : null}
      </div>
    );
  }
  if (field.type === "select" || field.type === "multi-select") {
    return (
      <label className="field">
        <span>{tx(field.label)}</span>
        <select value={value} onChange={(event) => onChange(event.target.value)} required={field.required} disabled={readOnly}>
          <option value="">{tx("请选择")}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>{tx(option.label)}</option>
          ))}
        </select>
        {field.help ? <small>{tx(field.help)}</small> : null}
      </label>
    );
  }
  if (field.type === "textarea") {
    return (
      <label className="field">
        <span>{tx(field.label)}</span>
        <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={tx(field.placeholder)} required={field.required} readOnly={readOnly} />
        {field.help ? <small>{tx(field.help)}</small> : null}
      </label>
    );
  }
  if (field.type === "boolean") {
    const checked = value === "true";
    return (
      <label className="field">
        <span>{tx(field.label)}</span>
        <div className="boolean-toggle" role="radiogroup" aria-label={tx(field.label)}>
          <button
            aria-checked={checked}
            className={checked ? "active" : ""}
            disabled={readOnly}
            onClick={() => onChange("true")}
            role="radio"
            type="button"
          >
            {tx("开启")}
          </button>
          <button
            aria-checked={!checked}
            className={!checked ? "active" : ""}
            disabled={readOnly}
            onClick={() => onChange("false")}
            role="radio"
            type="button"
          >
            {tx("关闭开关")}
          </button>
        </div>
        {field.help ? <small>{tx(field.help)}</small> : null}
      </label>
    );
  }
  return (
    <label className="field">
      <span>{tx(field.label)}</span>
      <input
        value={value}
        type={field.type === "number" ? "number" : field.type === "password" ? "password" : "text"}
        onChange={(event) => onChange(event.target.value)}
        placeholder={tx(field.placeholder)}
        required={field.required}
        readOnly={readOnly}
      />
      {field.help ? <small>{tx(field.help)}</small> : null}
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
        <h2>{tx(title)}</h2>
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
  if (rows.length === 0) return <div className="empty">{tx("暂无数据")}</div>;
  if (paginationKey) {
    return <PaginatedSimpleTable columns={columns} rows={rows} paginationKey={paginationKey} />;
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column}>{tx(column)}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{translatedCell(cell)}</td>)}</tr>
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
            <tr>{columns.map((column) => <th key={column}>{tx(column)}</th>)}</tr>
          </thead>
          <tbody>
            {visibleRows.map((row, index) => (
              <tr key={pagination.startIndex + index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{translatedCell(cell)}</td>)}</tr>
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
        <span>{points.some((point) => point.total_tokens > 0) ? tx("模型调用 Token") : tx("等待调用数据")}</span>
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
  return <span className={`pill ${kind}`}>{label ? tx(label) : enumValueLabel(status)}</span>;
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
    return <span className="muted-inline">{tx("未配置线路")}</span>;
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
  "project-members": projectMemberConfig(),
  "api-keys": apiKeyConfig(),
  teams: teamConfig(),
  users: adminUserConfig(),
  "quota-policies": genericResourceConfig("quota-policies", "项目额度", "项目、Key、用户维度的请求、Token、成本与并发上限", [
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
  "approval-flows": approvalFlowConfig(),
  reports: reportConfig(),
  "notification-channels": notificationChannelConfig(),
  monitors: monitorConfig(),
  alerts: alertRuleConfig(),
  "alert-events": alertEventConfig(),
  "alert-deliveries": alertDeliveryConfig(),
  approvals: approvalConfig(),
  "security-policies": genericResourceConfig("security-policies", "安全策略", "敏感数据、错误透传、IP 访问和审计策略", [
    { key: "mask_prompts", label: "脱敏 Prompt", type: "boolean", help: "开启后策略要求请求与响应审计避免直接展示完整 Prompt。" },
    { key: "ip_allowlist", label: "IP 白名单", type: "textarea", placeholder: "127.0.0.1/32\n10.0.0.0/8", help: "每行一个 CIDR 或 IP，留空表示不配置白名单。" },
    { key: "error_passthrough", label: "错误透传", type: "select", options: ["sanitized", "passthrough", "hidden"], required: true },
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
  "identity-providers": identityProviderConfig(),
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

function identityProviderConfig(): ResourceConfig<AdminResource> {
  const fields: FieldConfig[] = [
    { key: "provider_type", label: "类型", type: "select", options: ["oidc", "oauth2", "saml", "ldap"], required: true },
    { key: "icon_key", label: "登录图标", type: "select", options: identityProviderIconOptions, help: "auto 会根据名称、Issuer URL 和类型自动选择登录页图标。" },
    { key: "login_label", label: "登录显示名称", placeholder: "Google", help: "登录按钮上的名称；留空时按图标、Issuer 或身份源名称自动推断。" },
    { key: "issuer_url", label: "Issuer URL" },
    { key: "client_id", label: "Client ID" },
    { key: "client_secret", label: "Client Secret", type: "password", help: "编辑时留空则不修改已保存密钥。" },
    { key: "authorize_url", label: "Authorize URL" },
    { key: "token_url", label: "Token URL" },
    { key: "userinfo_url", label: "UserInfo URL" },
    { key: "redirect_uri", label: "Callback URL", help: "必须与 OAuth 应用中登记的 Redirect URI 完全一致；留空时按当前后端访问地址自动生成。" },
    { key: "scopes", label: "Scopes" },
    { key: "username_claim", label: "用户名字段" },
    { key: "email_claim", label: "邮箱字段" },
    { key: "team_claim", label: "团队字段" },
  ];
  const base = genericResourceConfig("identity-providers", "身份源", "配置企业已有 SSO/OAuth/OIDC/SAML/LDAP 身份系统。当前用于记录配置和用户同步导入，登录回调可在该配置基础上继续接入。", fields);
  return {
    ...base,
    eyebrow: "身份源",
    createLabel: "新增身份源",
    columns: [
      { key: "name", label: "名称" },
      { key: "provider_type", label: "类型", render: (item) => identityProviderTypeLabel(stringifyValue(item.fields?.provider_type)) },
      { key: "icon_key", label: "图标", render: (item) => identityProviderIconLabel(stringifyValue(item.fields?.icon_key)) },
      { key: "login_label", label: "登录显示", render: (item) => stringifyValue(item.fields?.login_label) || "-" },
      { key: "issuer_url", label: "Issuer", render: (item) => stringifyValue(item.fields?.issuer_url) || "-" },
      { key: "client_id", label: "Client ID", render: (item) => stringifyValue(item.fields?.client_id) || "-" },
      { key: "scopes", label: "Scopes", render: (item) => compactList(item.fields?.scopes) },
      { key: "status", label: "状态", render: (item) => <StatusPill status={item.status} /> },
    ],
    create: (ctx, values) => adminMutate(ctx, "/api/admin/resources/identity-providers", "POST", identityProviderPayload(values, fields)),
    update: (ctx, item, values) => adminMutate(ctx, `/api/admin/resources/identity-providers/${item.id}`, "PATCH", identityProviderPayload(values, fields, item)),
  };
}

function roleConfig(): ResourceConfig<AdminResource> {
  const fields: FieldConfig[] = [
    { key: "role_key", label: "角色标识", required: true, placeholder: "user", readOnlyOnEdit: true },
    { key: "display_name", label: "显示名称", required: true, placeholder: "普通用户" },
    { key: "data_scope", label: "数据范围", type: "select", options: ["global", "team", "project", "self"], required: true },
    { key: "assignable", label: "可分配", type: "boolean" },
  ];
  return {
    ...genericResourceConfig("role-configs", "角色配置", "配置用户管理新增/编辑时可选择的后台角色。权限边界由系统内置角色模型控制。", fields),
    eyebrow: "角色配置",
    createLabel: "新增可选角色",
    columns: [
      { key: "name", label: "名称" },
      { key: "role_key", label: "角色标识", render: (item) => stringifyValue(item.fields?.role_key) || item.id },
      { key: "display_name", label: "显示名称", render: (item) => stringifyValue(item.fields?.display_name) || item.name },
      { key: "data_scope", label: "数据范围", render: (item) => dataScopeLabel(stringifyValue(item.fields?.data_scope)) },
      { key: "assignable", label: "可分配", render: (item) => boolLabel(item.fields?.assignable) },
      { key: "status", label: "状态", render: (item) => <StatusPill status={item.status} /> },
    ],
  };
}

function teamConfig(): ResourceConfig<AdminResource> {
  const fields: FieldConfig[] = [
    {
      key: "owner",
      label: "负责人",
      type: "select",
      optionsFromData: userSelectOptions,
      help: "从用户管理中选择团队负责人，用于审批和审计归属。",
    },
    {
      key: "cost_center",
      label: "成本中心",
      type: "select",
      optionsFromData: costCenterSelectOptions,
      help: "费用归集口径，可与团队不同；用于成本归集和用量统计。",
    },
  ];
  return {
    ...genericResourceConfig("teams", "团队分组", "企业团队、负责人和费用归属", fields),
    columns: [
      { key: "name", label: "团队名称" },
      { key: "owner", label: "负责人", render: (item, ctx) => ownerUserLabel(ctx, stringifyValue(item.fields?.owner)) },
      { key: "cost_center", label: "成本中心", render: (item, ctx) => costCenterLabel(ctx, stringifyValue(item.fields?.cost_center)) },
      { key: "members", label: "成员数", render: (item, ctx) => formatNumber(teamMemberCount(ctx, item)) },
      { key: "status", label: "状态", render: (item) => <StatusPill status={item.status} /> },
      { key: "updated_at", label: "更新时间", render: (item) => formatTime(item.updated_at ?? "") },
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
        doneMessage: () => tx("备份文件已开始下载"),
      },
      {
        label: "恢复",
        title: "将数据库恢复到该备份",
        run: async (ctx, item) => restoreSQLiteBackup(ctx, item),
        doneMessage: (item) => `${tx("已恢复备份")} ${item.id}`,
      },
    ],
  };
}

function notificationChannelConfig(): ResourceConfig<AdminResource> {
  const fields: FieldConfig[] = [
    { key: "type", label: "渠道类型", type: "select", options: notificationChannelTypes, required: true },
    { key: "webhook_url", label: "Webhook URL", required: true, visible: notificationChannelUsesWebhook },
    { key: "secret", label: "签名密钥", type: "password", help: "可选预留。当前按普通机器人 Webhook 发送，留空不影响通知。", visible: notificationChannelUsesWebhook },
    { key: "smtp_host", label: "SMTP Host", required: true, visible: notificationChannelUsesEmail },
    { key: "smtp_port", label: "SMTP 端口", type: "number", required: true, visible: notificationChannelUsesEmail },
    { key: "smtp_username", label: "SMTP 用户名", visible: notificationChannelUsesEmail },
    { key: "smtp_password", label: "SMTP 密码", type: "password", help: "编辑时留空表示不修改。", visible: notificationChannelUsesEmail },
    { key: "smtp_from", label: "发件人", required: true, visible: notificationChannelUsesEmail },
    { key: "email_to", label: "收件人", required: true, help: "多个收件人用英文逗号分隔。", visible: notificationChannelUsesEmail },
  ];
  const config = genericResourceConfig(
    "notification-channels",
    "通知渠道",
    "按 Webhook、飞书、钉钉、企业微信、Slack 和邮件快速配置告警通知目标。",
    fields,
  );
  return {
    ...config,
    eyebrow: "渠道配置",
    createLabel: "配置通知渠道",
    columns: [
      { key: "name", label: "名称" },
      { key: "fields.type", label: "渠道", render: (item) => notificationChannelLabel(notificationChannelType(item)) },
      { key: "fields.webhook_url", label: "目标", render: (item) => notificationChannelTargetSummary(item) },
      { key: "fields.secret", label: "凭证", render: (item) => notificationCredentialSummary(item) },
      { key: "status", label: "状态", render: (item) => <StatusPill status={item.status} /> },
      { key: "updated_at", label: "更新时间", render: (item) => formatTime(item.updated_at ?? "") },
    ],
    create: (ctx, values) => adminMutate(ctx, "/api/admin/resources/notification-channels", "POST", notificationChannelPayload(values)),
    update: (ctx, item, values) => adminMutate(ctx, `/api/admin/resources/notification-channels/${item.id}`, "PATCH", notificationChannelPayload(values, item)),
    toForm: (item) => ({
      name: item.name,
      description: item.description ?? "",
      status: item.status,
      type: notificationChannelType(item),
      webhook_url: stringifyValue(item.fields?.webhook_url),
      secret: "",
      smtp_host: stringifyValue(item.fields?.smtp_host),
      smtp_port: stringifyValue(item.fields?.smtp_port),
      smtp_username: stringifyValue(item.fields?.smtp_username),
      smtp_password: "",
      smtp_from: stringifyValue(item.fields?.smtp_from),
      email_to: stringifyValue(item.fields?.email_to),
    }),
  };
}

function monitorConfig(): ResourceConfig<AdminResource> {
  const fields: FieldConfig[] = [
    { key: "target_type", label: "目标类型", type: "select", options: ["provider", "resource", "model"], required: true },
    { key: "provider_id", label: "Provider ID" },
    { key: "provider_resource_id", label: "资源实例 ID" },
    { key: "model", label: "模型" },
    { key: "interval_seconds", label: "间隔秒数", type: "number" },
  ];
  const config = genericResourceConfig(
    "monitors",
    "健康检测",
    "系统自动检测 Provider、资源实例和模型路由状态，帮助确认模型 API 链路是否可用。",
    fields,
  );
  return {
    ...config,
    eyebrow: "默认检测项",
    columns: [
      { key: "name", label: "名称" },
      { key: "fields.target_type", label: "目标类型", render: (item) => monitorTargetLabel(item.fields) },
      { key: "fields.provider_id", label: "Provider", render: (item) => stringifyValue(item.fields?.provider_id) || "-" },
      { key: "fields.provider_resource_id", label: "资源实例", render: (item) => stringifyValue(item.fields?.provider_resource_id) || "-" },
      { key: "fields.model", label: "模型", render: (item) => stringifyValue(item.fields?.model) || "-" },
      { key: "fields.last_status", label: "最近状态", render: (item) => <StatusPill status={stringifyValue(item.fields?.last_status || item.fields?.last_result || "unknown")} /> },
      { key: "fields.last_message", label: "最近消息", render: (item) => stringifyValue(item.fields?.last_message) || "-" },
      { key: "fields.latency_ms", label: "延迟", render: (item) => `${numberFromUnknown(item.fields?.latency_ms)}ms` },
      { key: "fields.last_checked_at", label: "最近检测", render: (item) => formatTime(stringifyValue(item.fields?.last_checked_at)) },
      { key: "status", label: "状态", render: (item) => <StatusPill status={item.status} /> },
    ],
    create: undefined,
    update: undefined,
    remove: undefined,
    actions: [
      {
        label: "立即检测",
        title: "立即执行该健康检测",
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
      { key: "sticky_session", label: "粘性", render: (item) => item.sticky_session ? tx("开启") : tx("关闭开关") },
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
      { key: "team_id", label: "团队", render: (item, ctx) => teamLabel(ctx, item.team_id ?? "") },
      { key: "owner_user_id", label: "负责人", render: (item, ctx) => ownerUserLabel(ctx, item.owner_user_id ?? "") },
      { key: "cost_center", label: "成本中心", render: (item, ctx) => costCenterLabel(ctx, item.cost_center ?? "") },
      { key: "quota", label: "额度", render: (item, ctx) => projectQuotaSummary(ctx, item) },
      { key: "status", label: "状态", render: (item) => <StatusPill status={item.status} /> },
    ],
    fields: [
      { key: "name", label: "项目名称", required: true },
      { key: "team_id", label: "所属团队", type: "select", optionsFromData: teamSelectOptions, help: "管理员分配项目归属团队；团队 Leader 创建时会自动固定为自己的团队。" },
      { key: "owner_user_id", label: "项目负责人", type: "select", optionsFromData: userSelectOptions, help: "负责人默认拥有该项目的 Key 管理权限。" },
      { key: "cost_center", label: "成本中心", type: "select", optionsFromData: costCenterSelectOptions },
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

function projectMemberConfig(): ResourceConfig<AdminResource> {
  const fields: FieldConfig[] = [
    {
      key: "project_id",
      label: "项目空间",
      type: "select",
      optionsFromData: projectMemberProjectSelectOptions,
      required: true,
      visible: () => false,
    },
    {
      key: "user_id",
      label: "用户",
      type: "select",
      optionsFromData: userSelectOptions,
      required: true,
      readOnlyOnEdit: true,
    },
    {
      key: "role",
      label: "项目角色",
      type: "select",
      optionsFromData: projectMemberRoleOptions,
      required: true,
      help: "owner/maintainer 可管理项目 Key；developer 可发放自己的 Key；viewer 只用于可见和统计。",
    },
    {
      key: "can_issue_keys",
      label: "允许发 Key",
      type: "boolean",
      help: "需要单独给 viewer 或特殊成员开放发 Key 时启用。",
    },
    { key: "status", label: "状态", type: "select", options: ["active", "disabled"], required: true },
  ];
  return {
    view: "project-members",
    title: "项目成员",
    eyebrow: "项目成员",
    description: "把用户分配到一个或多个项目空间，并控制项目内 Key 发放权限。",
    createLabel: "分配项目成员",
    columns: [
      { key: "user_id", label: "用户", render: (item, ctx) => ownerUserLabel(ctx, stringifyValue(item.fields?.user_id)) },
      { key: "role", label: "项目角色", render: (item) => projectMemberRoleLabel(stringifyValue(item.fields?.role)) },
      { key: "can_issue_keys", label: "发 Key", render: (item) => projectMemberCanIssueLabel(item) },
      { key: "status", label: "状态", render: (item) => <StatusPill status={item.status} /> },
    ],
    fields,
    list: (ctx) => ctx.resources["project-members"] ?? [],
    create: (ctx, values, data) => adminMutate(ctx, "/api/admin/resources/project-members", "POST", projectMemberPayload(values, data)),
    update: (ctx, item, values) => adminMutate(ctx, `/api/admin/resources/project-members/${item.id}`, "PATCH", projectMemberPayload(values, undefined, item)),
    remove: (ctx, item) => adminDelete(ctx, `/api/admin/resources/project-members/${item.id}`),
    toForm: (item) => ({
      project_id: stringifyValue(item.fields?.project_id),
      user_id: stringifyValue(item.fields?.user_id),
      role: stringifyValue(item.fields?.role) || "developer",
      can_issue_keys: stringifyValue(item.fields?.can_issue_keys || "false"),
      status: item.status,
    }),
  };
}

function projectMemberInitialValues(project: Project): Record<string, string> {
  return {
    project_id: project.id,
    role: "developer",
    can_issue_keys: "false",
    status: "active",
  };
}

function projectMemberPayload(values: Record<string, string>, data?: AppData, existing?: AdminResource) {
  const user = data?.users.find((item) => item.id === values.user_id);
  const displayName = user ? user.name || user.username || user.email : values.user_id;
  return {
    name: existing?.name || `${displayName || "项目成员"} 项目成员`,
    status: values.status || existing?.status || "active",
    fields: {
      project_id: values.project_id || stringifyValue(existing?.fields?.project_id),
      user_id: values.user_id || stringifyValue(existing?.fields?.user_id),
      role: values.role || stringifyValue(existing?.fields?.role) || "developer",
      can_issue_keys: truthyValue(values.can_issue_keys),
    },
  };
}

function apiKeyConfig(): ResourceConfig<APIKey> {
  return {
    view: "api-keys",
    title: "Key 管理",
    eyebrow: "内部 Key 列表",
    description: "按项目发放内部 API Key，限制模型白名单、额度、并发和有效期。",
    createLabel: "发放 Key",
    columns: [
      { key: "name", label: "名称" },
      { key: "project_id", label: "归属项目", render: (item, ctx) => projectName(ctx, item.project_id) },
      { key: "project_owner", label: "负责人", render: (item, ctx) => projectOwnerLabel(ctx, item.project_id) },
      { key: "project_team", label: "团队", render: (item, ctx) => projectTeamLabel(ctx, item.project_id) },
      { key: "key_prefix", label: "Key", render: (item) => `${item.key_prefix}...${item.key_suffix}` },
      { key: "allowed_models", label: "模型", render: (item) => (item.allowed_models ?? []).join(", ") || tx("全部") },
      { key: "ip_allowlist", label: "IP 白名单", render: (item) => (item.ip_allowlist ?? []).join(", ") || tx("不限") },
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
        help: "只显示当前账号拥有发 Key 权限的项目；一个人可以被分配到多个项目。",
        readOnlyOnEdit: true,
      },
      { key: "name", label: "Key 名称", required: true },
      { key: "group", label: "用途/环境", placeholder: "prod、dev、backend-service" },
      { key: "allowed_models", label: "模型白名单，逗号分隔", help: "留空表示不限制 Key 级模型白名单；实际可调用模型仍受模型目录和路由策略约束。" },
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

function APIKeyStatusSwitch({
  item,
  onToggle,
}: {
  item: APIKey;
  onToggle: (status: "active" | "disabled") => void;
}) {
  if (item.status !== "active" && item.status !== "disabled") {
    return <StatusPill status={item.status} />;
  }
  const enabled = item.status === "active";
  const nextStatus = enabled ? "disabled" : "active";
  return (
    <button
      aria-checked={enabled}
      className={enabled ? "status-switch active" : "status-switch"}
      onClick={(event) => {
        event.stopPropagation();
        onToggle(nextStatus);
      }}
      role="switch"
      title={enabled ? tx("点击停用 API Key") : tx("点击启用 API Key")}
      type="button"
    >
      <span className="status-switch-track">
        <span className="status-switch-thumb" />
      </span>
      <strong>{enabled ? tx("启用") : tx("停用")}</strong>
    </button>
  );
}

function apiKeyStatusAction(status: "active" | "disabled"): ResourceAction<APIKey> {
  return {
    label: status === "active" ? "启用" : "禁用",
    title: status === "active" ? "重新启用该 API Key" : "立即禁用该 API Key",
    run: (ctx, item) => updateAPIKeyStatus(ctx, item, status),
    doneMessage: (item) => tx(`${item.name} 已${status === "active" ? "启用" : "禁用"}`),
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
      { key: "role", label: "角色", render: (item, ctx) => roleDisplayLabel(ctx, item.role) },
      { key: "team_id", label: "团队", render: (item, ctx) => teamLabel(ctx, item.team_id ?? "") },
      { key: "last_login_at", label: "最近登录", render: (item) => formatTime(item.last_login_at ?? "") },
      { key: "status", label: "状态", render: (item) => <StatusPill status={item.status} /> },
    ],
    fields: [
      { key: "username", label: "用户名", required: true },
      { key: "name", label: "姓名", required: true },
      { key: "email", label: "邮箱", required: true },
      { key: "password", label: "密码", type: "password", placeholder: "编辑时留空则不修改" },
      { key: "role", label: "角色", type: "select", optionsFromData: roleSelectOptions, required: true },
      { key: "team_id", label: "团队", type: "select", optionsFromData: teamSelectOptions },
      { key: "status", label: "状态", type: "select", options: ["active", "disabled"], required: true },
    ],
    list: (ctx) => ctx.users,
    create: (ctx, values) => adminMutate(ctx, "/api/admin/users", "POST", userPayload(values, true)),
    update: (ctx, item, values) => adminMutate(ctx, `/api/admin/users/${item.id}`, "PATCH", userPayload(values, false)),
    remove: (ctx, item) => adminDelete(ctx, `/api/admin/users/${item.id}`),
    toolbarActions: [
      {
        label: "导入用户",
        title: "从已有系统导出的 CSV 批量导入或更新用户",
        kind: "import-users",
      },
    ],
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

function alertRuleConfig(): ResourceConfig<AdminResource> {
  const fields: FieldConfig[] = [
    {
      key: "metric",
      label: "指标",
      type: "select",
      options: ["provider_health", "provider_resource_health", "request_quota_usage", "token_quota_usage", "cost_quota_usage", "error_rate", "latency_p95"],
      required: true,
    },
    { key: "threshold", label: "阈值", required: true },
    { key: "severity", label: "级别", type: "select", options: ["info", "warning", "critical"], required: true },
    { key: "scope", label: "对象范围", type: "select", options: ["provider", "provider_resource", "quota", "api_key", "project", "model"], required: true },
    { key: "channel", label: "通知渠道" },
  ];
  return {
    ...genericResourceConfig("alert-rules", "告警规则", "Provider 健康、资源实例状态和额度风险的默认告警规则。", fields),
    eyebrow: "规则列表",
    columns: [
      { key: "name", label: "名称" },
      { key: "fields.metric", label: "指标", render: (item) => alertMetricLabel(stringifyValue(item.fields?.metric)) },
      { key: "fields.threshold", label: "阈值", render: (item) => stringifyValue(item.fields?.threshold) || "-" },
      { key: "fields.severity", label: "级别", render: (item) => <StatusPill status={stringifyValue(item.fields?.severity || "warning")} /> },
      { key: "fields.channel", label: "通知渠道", render: (item) => stringifyValue(item.fields?.channel) || "default" },
      { key: "fields.event_codes", label: "触发事件", render: (item) => compactList(item.fields?.event_codes) },
      { key: "fields.managed_by", label: "来源", render: (item) => stringifyValue(item.fields?.managed_by) === "tokenhub_auto" ? tx("系统默认") : tx("自定义") },
      { key: "status", label: "状态", render: (item) => <StatusPill status={item.status} /> },
    ],
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
    description: "处理 Key 发放、额度提升和模型开通审批。",
    columns: [
      { key: "created_at", label: "时间", render: (item) => formatTime(item.created_at) },
      { key: "trigger", label: "触发条件", render: (item) => approvalTriggerLabel(item.trigger) },
      { key: "resource_type", label: "对象", render: (item) => resourceTypeLabel(item.resource_type) },
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
        visible: (item) => item.status === "pending",
        run: async (ctx, item) => runApprovalAction(ctx, item, "approve"),
        doneMessage: (item) => `${approvalTriggerLabel(item.trigger)} 已批准`,
      },
      {
        label: "驳回",
        title: "驳回该申请",
        visible: (item) => item.status === "pending",
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
    { key: "dataset", label: "数据集", type: "select", options: ["requests", "usage", "cost-centers", "approvals", "audit-events", "alert-deliveries"], required: true },
    { key: "schedule", label: "频率", type: "select", options: ["manual", "daily", "weekly", "monthly"], required: true },
    { key: "recipients", label: "接收人" },
  ];
  return {
    ...genericResourceConfig("reports", "导出报表", "按需导出审计、用量和治理数据集", fields),
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
        doneMessage: () => tx("已生成分摊和内部账单"),
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

function reportExportDefinitions(): Array<{
  dataset: string;
  label: string;
  description: string;
  icon: typeof Activity;
  tone: string;
}> {
  return [
    {
      dataset: "requests",
      label: reportDatasetLabel("requests"),
      description: "请求 ID、模型、状态码、Provider 路由和延迟",
      icon: FileText,
      tone: "blue",
    },
    {
      dataset: "usage",
      label: reportDatasetLabel("usage"),
      description: "按模型、项目和日期归集 Token 与成本",
      icon: BarChart3,
      tone: "green",
    },
    {
      dataset: "cost-centers",
      label: reportDatasetLabel("cost-centers"),
      description: "成本中心、负责人和部门归属配置",
      icon: Database,
      tone: "slate",
    },
    {
      dataset: "approvals",
      label: reportDatasetLabel("approvals"),
      description: "额度提升、Key 发放和模型开通审批记录",
      icon: ShieldCheck,
      tone: "amber",
    },
    {
      dataset: "audit-events",
      label: reportDatasetLabel("audit-events"),
      description: "后台操作、变更对象、操作人和时间",
      icon: Activity,
      tone: "violet",
    },
    {
      dataset: "alert-deliveries",
      label: reportDatasetLabel("alert-deliveries"),
      description: "告警通知的渠道、目标和发送结果",
      icon: Bell,
      tone: "red",
    },
  ];
}

function reportExportActions(): ToolbarAction[] {
  return reportExportDefinitions().map(({ dataset, label }) => ({
    label,
    title: `导出 ${label} CSV`,
    run: async (ctx) => {
      await downloadReport(ctx, dataset);
    },
    doneMessage: () => `${label} 已导出`,
  }));
}

async function downloadReport(ctx: ApiContext, dataset: string) {
  const period = reportPeriodPrompt(dataset);
  if (period === null) return null;
  const resp = await adminFetch(ctx, reportExportPath(dataset, period));
  if (!resp.ok) throw new Error(`export ${dataset} ${resp.status}`);
  const blob = await resp.blob();
  const fileName = reportFilename(dataset, period);
  downloadBlob(blob, fileName);
  return { fileName, period };
}

function reportPeriodPrompt(dataset: string) {
  if (!["usage", "budgets"].includes(dataset)) return "";
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
  setNotice: (value: string) => void,
  load: () => Promise<void>,
  setLoading: (value: boolean) => void,
  setError: (value: string) => void,
  setModal: (value: ModalState<any> | null) => void,
) {
  setLoading(true);
  setError("");
  setNotice("");
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
      setIssuedKey("");
      setNotice(`已提交审批：${data.approval?.id ?? ""}`);
    } else if (data.api_key) {
      setNotice("");
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

function projectQuotaPolicy(data: AppData, project: Project) {
  const policies = data.resources["quota-policies"] ?? [];
  if (project.default_quota_ref) {
    const byRef = policies.find((item) => item.id === project.default_quota_ref);
    if (byRef) return byRef;
  }
  return policies.find((item) => {
    const scope = stringifyValue(item.fields?.scope || item.fields?.scope_type).toLowerCase();
    const scopeID = stringifyValue(item.fields?.scope_id);
    return scope === "project" && scopeID === project.id;
  });
}

function projectQuotaValues(quota?: AdminResource): ProjectQuotaValues {
  return {
    status: quota?.status || "active",
    daily_requests: quotaFieldValue(quota, "daily_requests"),
    monthly_requests: quotaFieldValue(quota, "monthly_requests"),
    daily_tokens: quotaFieldValue(quota, "daily_tokens"),
    monthly_tokens: quotaFieldValue(quota, "monthly_tokens"),
    daily_cost_usd: quotaFieldValue(quota, "daily_cost_usd"),
    monthly_cost_usd: quotaFieldValue(quota, "monthly_cost_usd"),
    max_concurrency: quotaFieldValue(quota, "max_concurrency"),
  };
}

function quotaFieldValue(quota: AdminResource | undefined, key: string) {
  const value = quota?.fields?.[key];
  if (value === undefined || value === null || value === "" || Number(value) === 0) return "";
  return String(value);
}

function projectQuotaPayload(project: Project, values: ProjectQuotaValues) {
  return {
    name: `${project.name || project.id} 项目额度`,
    description: "项目空间内配置的专属模型调用额度",
    status: values.status || "active",
    fields: {
      scope: "project",
      scope_id: project.id,
      daily_requests: numberOr(values.daily_requests, 0),
      monthly_requests: numberOr(values.monthly_requests, 0),
      daily_tokens: numberOr(values.daily_tokens, 0),
      monthly_tokens: numberOr(values.monthly_tokens, 0),
      daily_cost_usd: numberOr(values.daily_cost_usd, 0),
      monthly_cost_usd: numberOr(values.monthly_cost_usd, 0),
      max_concurrency: numberOr(values.max_concurrency, 0),
    },
  };
}

async function saveProjectQuota(ctx: ApiContext, project: Project, quota: AdminResource | undefined, values: ProjectQuotaValues) {
  const payload = projectQuotaPayload(project, values);
  const path = quota ? `/api/admin/resources/quota-policies/${quota.id}` : "/api/admin/resources/quota-policies";
  const resp = await adminFetch(ctx, path, {
    method: quota ? "PATCH" : "POST",
    body: JSON.stringify(payload),
  });
  if (resp.status === 202) {
    await handleApprovalOrJSON(resp);
    return;
  }
  if (!resp.ok) throw new Error(`save project quota ${resp.status}`);
  const saved = (await resp.json()) as AdminResource;
  if (saved.id && project.default_quota_ref !== saved.id) {
    const projectResp = await adminFetch(ctx, `/api/admin/projects/${project.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: project.name,
        team_id: project.team_id ?? "",
        owner_user_id: project.owner_user_id ?? "",
        cost_center: project.cost_center ?? "",
        status: project.status,
        default_quota_ref: saved.id,
      }),
    });
    if (!projectResp.ok) throw new Error(`link project quota ${projectResp.status}`);
    await projectResp.json().catch(() => undefined);
  }
}

async function requestProjectQuotaIncrease(ctx: ApiContext, project: Project, quota: AdminResource | undefined, values: ProjectQuotaValues) {
  if (!projectQuotaValuesHaveLimit(values)) {
    throw new Error("请先填写至少一项希望提升后的目标额度");
  }
  const payload = projectQuotaPayload(project, values);
  const resp = await adminFetch(ctx, `/api/admin/projects/${project.id}/quota-increase`, {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      resource_id: quota?.id ?? "",
    }),
  });
  if (resp.status === 202) {
    await handleApprovalOrJSON(resp);
    return;
  }
  if (!resp.ok) throw new Error(`request project quota increase ${resp.status}`);
  await resp.json().catch(() => undefined);
}

function projectQuotaValuesHaveLimit(values: ProjectQuotaValues) {
  return projectQuotaFields.some((field) => numberOr(values[field.key], 0) > 0);
}

function projectQuotaSummary(data: AppData, project: Project) {
  const quota = projectQuotaPolicy(data, project);
  if (!quota) return "未配置";
  if (quota.status !== "active") return enumValueLabel(quota.status);
  const parts = [
    quotaSummaryPart(quota, "daily_requests", "日请求"),
    quotaSummaryPart(quota, "monthly_requests", "月请求"),
    quotaSummaryPart(quota, "daily_tokens", "日 Token"),
    quotaSummaryPart(quota, "monthly_tokens", "月 Token"),
    quotaSummaryPart(quota, "daily_cost_usd", "日成本", "$"),
    quotaSummaryPart(quota, "monthly_cost_usd", "月成本", "$"),
    quotaSummaryPart(quota, "max_concurrency", "并发"),
  ].filter(Boolean);
  return parts.slice(0, 2).join(" · ") || "不限额";
}

function quotaSummaryPart(quota: AdminResource, key: string, label: string, prefix = "") {
  const value = numberFromUnknown(quota.fields?.[key]);
  if (!value) return "";
  return `${label} ${prefix}${compactNumber(value)}`;
}

function projectQuotaIssue(data: AppData, project: Project) {
  const quotaLogs = data.logs.filter(
    (log) => log.project_id === project.id && (log.error_code === "quota_exceeded" || log.status_code === 429),
  );
  const quotaAlerts = data.alerts.filter((alert) => {
    const code = String(alert.code || "").toLowerCase();
    if (!code.includes("quota")) return false;
    if (alert.scope_type === "project" && alert.scope_id === project.id) return true;
    return alert.scope_id === project.id;
  });
  const count = quotaLogs.length + quotaAlerts.length;
  if (count === 0) return null;
  const latest = [...quotaLogs.map((log) => log.created_at), ...quotaAlerts.map((alert) => alert.created_at)]
    .filter(Boolean)
    .sort()
    .at(-1);
  return { count, latest };
}

function pendingProjectQuotaApproval(data: AppData, project: Project) {
  return data.approvals.find((approval) => {
    if (approval.status !== "pending" || approval.trigger !== "quota_increase" || approval.resource_type !== "quota-policies") {
      return false;
    }
    const payload = parseApprovalPayload(approval.payload);
    if (stringifyValue(payload.project_id) === project.id) return true;
    const fields = payload.fields && typeof payload.fields === "object" ? payload.fields as Record<string, unknown> : {};
    return stringifyValue(fields.scope).toLowerCase() === "project" && stringifyValue(fields.scope_id) === project.id;
  });
}

function parseApprovalPayload(payload?: string): Record<string, unknown> {
  if (!payload) return {};
  try {
    const data = JSON.parse(payload);
    return data && typeof data === "object" && !Array.isArray(data) ? data as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function defaultFormValues<T>(config: ResourceConfig<T>, data: AppData, currentUser?: AdminUser | null) {
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
    if (field.key === "project_id") values[field.key] = config.view === "api-keys" ? firstIssueableProject(data, currentUser) : (firstActiveProject(data)?.id ?? "");
    if (field.key === "team_id") values[field.key] = firstActiveTeam(data)?.id ?? "";
    if (field.key === "allowed_models") values[field.key] = "";
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
    if (field.key === "role") values[field.key] = config.view === "project-members" ? "developer" : "user";
    if (field.key === "user_id") values[field.key] = firstActiveUser(data)?.id ?? "";
    if (field.key === "can_issue_keys") values[field.key] = "false";
    if (field.key === "owner") values[field.key] = firstActiveUser(data)?.id ?? "";
    if (field.key === "cost_center") values[field.key] = firstCostCenterCode(data);
    if (field.key === "role_key") values[field.key] = "user";
    if (field.key === "display_name") values[field.key] = "普通用户";
    if (field.key === "data_scope") values[field.key] = "self";
    if (field.key === "permissions") values[field.key] = "overview:read, project:read";
    if (field.key === "menu_scopes") values[field.key] = "overview, projects";
    if (field.key === "assignable") values[field.key] = "true";
    if (field.key === "provider_type") values[field.key] = "oidc";
    if (field.key === "icon_key") values[field.key] = "auto";
    if (field.key === "login_label") values[field.key] = "";
    if (field.key === "issuer_url") values[field.key] = "https://sso.example.com";
    if (field.key === "client_id") values[field.key] = "tokenhub-admin";
    if (field.key === "redirect_uri") values[field.key] = "http://localhost:8080/api/admin/auth/oauth/callback";
    if (field.key === "scopes") values[field.key] = "openid, profile, email";
    if (field.key === "username_claim") values[field.key] = "preferred_username";
    if (field.key === "email_claim") values[field.key] = "email";
    if (field.key === "team_claim") values[field.key] = "department";
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

function notificationChannelPayload(values: Record<string, string>, existing?: AdminResource) {
  const type = normalizeNotificationChannelType(values.type);
  const secret = values.secret || stringifyValue(existing?.fields?.secret);
  const smtpPassword = values.smtp_password || stringifyValue(existing?.fields?.smtp_password);
  const fields = type === "email"
    ? {
        type,
        smtp_host: values.smtp_host,
        smtp_port: numberOr(values.smtp_port, 587),
        smtp_username: values.smtp_username,
        smtp_password: smtpPassword,
        smtp_from: values.smtp_from,
        email_to: values.email_to,
      }
    : {
        type,
        webhook_url: values.webhook_url,
        secret,
      };
  return {
    name: values.name || `${notificationChannelLabel(type)} 通知渠道`,
    description: values.description || notificationChannelDescription(type),
    status: values.status || "active",
    fields,
  };
}

function notificationChannelDefaults(type: string) {
  const normalized = normalizeNotificationChannelType(type);
  return {
    name: `${notificationChannelLabel(normalized)} 通知渠道`,
    description: notificationChannelDescription(normalized),
    status: "active",
    type: normalized,
    webhook_url: notificationChannelURLPlaceholder(normalized),
    secret: "",
    smtp_host: "smtp.example.com",
    smtp_port: "587",
    smtp_username: "tokenhub@example.com",
    smtp_password: "",
    smtp_from: "tokenhub@example.com",
    email_to: "ops@example.com",
  };
}

async function updateAPIKeyStatus(ctx: ApiContext, item: APIKey, status: "active" | "disabled") {
  const resp = await adminFetch(ctx, `/api/admin/api-keys/${item.id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  if (!resp.ok) throw new Error(`update api key ${resp.status}`);
  await resp.json().catch(() => undefined);
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
    role: values.role || "user",
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

function identityProviderPayload(values: Record<string, string>, fields: FieldConfig[], existing?: AdminResource) {
  const payload = resourcePayload(values, fields);
  if (existing && !values.client_secret) {
    payload.fields.client_secret = stringifyValue(existing.fields?.client_secret);
  }
  return payload;
}

async function importUsersFromCSVContent(ctx: ApiContext, content: string): Promise<UserImportResult> {
  const resp = await adminFetch(ctx, "/api/admin/users/import", {
    method: "POST",
    body: JSON.stringify({
      source: "manual_csv",
      format: "csv",
      content,
    }),
  });
  if (!resp.ok) {
    const message = await readAdminError(resp, "用户导入失败");
    throw new Error(message);
  }
  return await resp.json() as UserImportResult;
}

async function readAdminError(resp: Response, fallback: string) {
  const body = await resp.text().catch(() => "");
  if (!body) return `${fallback} (${resp.status})`;
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string }; message?: string };
    return parsed.error?.message || parsed.message || `${fallback} (${resp.status})`;
  } catch {
    return body.length > 180 ? `${body.slice(0, 180)}...` : body;
  }
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
    breakdown: { projects: [], models: [], members: [], providers: [], provider_resources: [], cost_centers: [] },
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
    api_key_count: 0,
    route_count: 0,
    active_route_count: 0,
    user_count: 0,
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
  if (view === "notification-channels") {
    return items.filter((item) => notificationChannelType(item as AdminResource) === category);
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

function notificationChannelTabs(data: AppData) {
  const counts = new Map<string, number>();
  for (const item of data.resources["notification-channels"] ?? []) {
    const type = notificationChannelType(item);
    counts.set(type, (counts.get(type) ?? 0) + 1);
  }
  return notificationChannelTypes.map((type) => ({
    key: type,
    label: notificationChannelLabel(type),
    count: counts.get(type) ?? 0,
  }));
}

function notificationChannelType(item: AdminResource) {
  return normalizeNotificationChannelType(stringifyValue(item.fields?.type));
}

function notificationChannelFormType(values: Record<string, string>) {
  return normalizeNotificationChannelType(values.type);
}

function notificationChannelUsesWebhook(values: Record<string, string>) {
  return notificationChannelFormType(values) !== "email";
}

function notificationChannelUsesEmail(values: Record<string, string>) {
  return notificationChannelFormType(values) === "email";
}

function normalizeNotificationChannelType(type: string) {
  const normalized = type.trim().toLowerCase();
  if (normalized === "dingding" || normalized === "ding_talk") return "dingtalk";
  if (normalized === "wechat_work" || normalized === "weixin_work" || normalized === "enterprise_wechat") return "wecom";
  if (notificationChannelTypes.includes(normalized)) return normalized;
  return "webhook";
}

function notificationChannelLabel(type: string) {
  const labels: Record<string, string> = {
    webhook: "Webhook",
    feishu: "飞书",
    dingtalk: "钉钉",
    wecom: "企业微信",
    slack: "Slack",
    email: "邮件",
  };
  return tx(labels[normalizeNotificationChannelType(type)] ?? type);
}

function notificationChannelDescription(type: string) {
  const descriptions: Record<string, string> = {
    webhook: "通用 Webhook 告警通知",
    feishu: "飞书机器人告警通知",
    dingtalk: "钉钉机器人告警通知",
    wecom: "企业微信机器人告警通知",
    slack: "Slack Incoming Webhook 告警通知",
    email: "SMTP 邮件告警通知",
  };
  return descriptions[normalizeNotificationChannelType(type)] ?? "告警通知渠道";
}

function notificationChannelURLPlaceholder(type: string) {
  const urls: Record<string, string> = {
    webhook: "http://localhost:8081/tokenhub-alert",
    feishu: "https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    dingtalk: "https://oapi.dingtalk.com/robot/send?access_token=xxxxxxxx",
    wecom: "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    slack: "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX",
  };
  return urls[normalizeNotificationChannelType(type)] ?? urls.webhook;
}

function notificationChannelTargetSummary(item: AdminResource) {
  if (notificationChannelType(item) === "email") {
    return compactList(item.fields?.email_to);
  }
  return maskWebhookURL(stringifyValue(item.fields?.webhook_url));
}

function notificationCredentialSummary(item: AdminResource) {
  if (notificationChannelType(item) === "email") {
    return stringifyValue(item.fields?.smtp_password) ? "SMTP 已配置" : "SMTP 未配置";
  }
  return stringifyValue(item.fields?.secret) ? "已配置" : "未配置";
}

function maskWebhookURL(url: string) {
  if (!url) return "-";
  try {
    const parsed = new URL(url);
    const token = parsed.pathname.split("/").filter(Boolean).at(-1) || "";
    const maskedToken = token.length > 8 ? `${token.slice(0, 4)}...${token.slice(-4)}` : token;
    parsed.pathname = parsed.pathname.replace(token, maskedToken);
    if (parsed.search) parsed.search = "?...";
    return parsed.toString();
  } catch {
    return url.length > 24 ? `${url.slice(0, 14)}...${url.slice(-6)}` : url;
  }
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
    { key: "all", label: modelCategoryLabel("all"), count: data.models.length },
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
  return modelCapabilityKeys(model).map((key) => tx(labels[key] ?? key)).slice(0, 3).join(" / ");
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
  return tx(modelCategoryLabels[category] ?? category);
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
  return String(readPath(item, "name") || readPath(item, "id") || tx("该记录"));
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

function firstIssueableProject(data: AppData, currentUser?: AdminUser | null) {
  return projectSelectOptions(data, currentUser)[0]?.value ?? "";
}

function firstActiveModel(data: AppData) {
  return data.models.find((model) => model.status === "active") ?? data.models[0];
}

function firstActiveProvider(data: AppData) {
  return data.providers.find((provider) => provider.status === "active") ?? data.providers[0];
}

function firstActiveUser(data: AppData) {
  return data.users.find((user) => user.status === "active") ?? data.users[0];
}

function firstActiveTeam(data: AppData) {
  return (data.resources.teams ?? []).find((team) => team.status === "active") ?? data.resources.teams?.[0];
}

function firstCostCenterCode(data: AppData) {
  const item = (data.resources["cost-centers"] ?? []).find((resource) => resource.status === "active")
    ?? data.resources["cost-centers"]?.[0];
  if (!item) return "";
  return stringifyValue(item.fields?.code) || item.id;
}

function projectSelectOptions(data: AppData, currentUser?: AdminUser | null) {
  return data.projects.filter((project) => projectCanIssueKey(data, project, currentUser)).map((project) => ({
    value: project.id,
    label: projectOptionLabel(data, project),
  }));
}

function projectMemberProjectSelectOptions(data: AppData) {
  return data.projects
    .filter((project) => project.status === "active")
    .map((project) => ({
      value: project.id,
      label: projectOptionLabel(data, project),
    }));
}

function projectMemberRoleOptions() {
  return [
    { value: "owner", label: "负责人" },
    { value: "maintainer", label: "维护者" },
    { value: "developer", label: "开发者" },
    { value: "viewer", label: "只读" },
  ];
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

function roleSelectOptions(data: AppData) {
  const configured = (data.resources["role-configs"] ?? [])
    .filter((role) => role.status === "active" && roleConfigAssignable(role))
    .map((role) => {
      const value = stringifyValue(role.fields?.role_key) || role.id;
      return {
        value,
        label: roleDisplayName(role) || roleLabel(value),
      };
    })
    .filter((option) => option.value);
  if (configured.length > 0) {
    return configured;
  }
  return ["user", "team_leader", "admin"].map((role) => ({ value: role, label: roleLabel(role) }));
}

function roleConfigAssignable(role: AdminResource) {
  const value = stringifyValue(role.fields?.assignable).trim().toLowerCase();
  return value === "" || value === "true" || value === "1" || value === "yes";
}

function roleDisplayName(role: AdminResource) {
  return stringifyValue(role.fields?.display_name) || role.name;
}

function roleDisplayLabel(data: AppData, role: string) {
  const normalized = String(role || "").trim();
  const configured = (data.resources["role-configs"] ?? []).find((item) => stringifyValue(item.fields?.role_key) === normalized);
  return configured ? roleDisplayName(configured) : roleLabel(normalized);
}

function userSelectOptions(data: AppData) {
  return data.users
    .slice()
    .sort((left, right) => (left.status === "active" ? 0 : 1) - (right.status === "active" ? 0 : 1) || (left.name || left.username).localeCompare(right.name || right.username))
    .map((user) => ({
      value: user.id,
      label: `${user.name || user.username} / ${user.email || user.username}${user.status !== "active" ? ` / ${enumValueLabel(user.status)}` : ""}`,
    }));
}

function teamSelectOptions(data: AppData) {
  return (data.resources.teams ?? [])
    .slice()
    .sort((left, right) => (left.status === "active" ? 0 : 1) - (right.status === "active" ? 0 : 1) || (left.name || left.id).localeCompare(right.name || right.id))
    .map((team) => ({
      value: team.id,
      label: `${team.name || team.id}${team.status !== "active" ? ` / ${enumValueLabel(team.status)}` : ""}`,
    }));
}

function costCenterSelectOptions(data: AppData) {
  return (data.resources["cost-centers"] ?? [])
    .slice()
    .sort((left, right) => (left.name || left.id).localeCompare(right.name || right.id))
    .map((item) => {
      const code = stringifyValue(item.fields?.code) || item.id;
      return {
        value: code,
        label: `${code} / ${item.name || item.id}${item.status !== "active" ? ` / ${enumValueLabel(item.status)}` : ""}`,
      };
    });
}

function projectOptionLabel(data: AppData, project: Project) {
  return [
    project.name || project.id,
    project.team_id ? `团队 ${teamLabel(data, project.team_id)}` : "",
    project.owner_user_id ? `负责人 ${ownerUserLabel(data, project.owner_user_id)}` : "",
  ]
    .filter(Boolean)
    .join(" / ");
}

function projectCanIssueKey(data: AppData, project: Project, currentUser?: AdminUser | null) {
  if (project.status !== "active") return false;
  if (!currentUser) return true;
  const role = appRole(currentUser.role);
  if (role === "admin") return true;
  if (role === "security") return false;
  if (project.owner_user_id && project.owner_user_id === currentUser.id) return true;
  if (role === "team_leader" && currentUser.team_id && project.team_id === currentUser.team_id) return true;
  return projectIssueMembership(data, project.id, currentUser.id);
}

function projectIssueMembership(data: AppData, projectID: string, userID: string) {
  return (data.resources["project-members"] ?? []).some((member) => {
    if (member.status !== "active") return false;
    if (stringifyValue(member.fields?.project_id) !== projectID || stringifyValue(member.fields?.user_id) !== userID) return false;
    const role = stringifyValue(member.fields?.role).trim().toLowerCase();
    return ["owner", "maintainer", "developer"].includes(role) || truthyValue(member.fields?.can_issue_keys);
  });
}

function projectMembersForProject(data: AppData, projectID: string) {
  return (data.resources["project-members"] ?? [])
    .filter((member) => stringifyValue(member.fields?.project_id) === projectID)
    .slice()
    .sort((left, right) => {
      const leftUser = data.users.find((user) => user.id === stringifyValue(left.fields?.user_id));
      const rightUser = data.users.find((user) => user.id === stringifyValue(right.fields?.user_id));
      return (leftUser?.name || leftUser?.username || stringifyValue(left.fields?.user_id))
        .localeCompare(rightUser?.name || rightUser?.username || stringifyValue(right.fields?.user_id));
    });
}

function projectMemberCanIssueLabel(item: AdminResource) {
  const role = stringifyValue(item.fields?.role).trim().toLowerCase();
  return ["owner", "maintainer", "developer"].includes(role) || truthyValue(item.fields?.can_issue_keys) ? tx("允许") : tx("不允许");
}

function projectMemberRoleLabel(role: string) {
  switch (role.trim().toLowerCase()) {
    case "owner":
      return tx("负责人");
    case "maintainer":
      return tx("维护者");
    case "developer":
      return tx("开发者");
    case "viewer":
      return tx("只读");
    default:
      return role || "-";
  }
}

function truthyValue(value: unknown) {
  const text = stringifyValue(value).trim().toLowerCase();
  return ["true", "1", "yes", "y", "on", "enabled"].includes(text);
}

function overviewAnnouncements(data: AppData, user: AdminUser) {
  return (data.resources.announcements ?? [])
    .filter((item) => item.status === "active" && announcementTargetsUser(item, user))
    .slice()
    .sort((left, right) => Date.parse(right.updated_at || right.created_at || "") - Date.parse(left.updated_at || left.created_at || ""));
}

function announcementTargetsUser(item: AdminResource, user: AdminUser) {
  const target = stringifyValue(item.fields?.target).trim();
  if (!target || ["all", "all_users", "everyone"].includes(target.toLowerCase())) return true;
  const targets = splitList(target).map((value) => value.toLowerCase());
  const role = appRole(user.role);
  const identityValues = [
    user.id,
    user.username,
    user.email,
    user.team_id,
    role,
    user.role,
  ].filter(Boolean).map((value) => String(value).toLowerCase());
  if (targets.includes("all_admins") && role !== "user") return true;
  return targets.some((value) => identityValues.includes(value));
}

function announcementMode(item: AdminResource) {
  const mode = stringifyValue(item.fields?.notify_mode).toLowerCase();
  return mode === "popup" ? "popup" : "silent";
}

function announcementModeLabel(item: AdminResource) {
  return announcementMode(item) === "popup" ? "弹窗" : "静默";
}

function ownerUserLabel(data: AppData, owner: string) {
  if (!owner) return "-";
  const user = data.users.find((item) => item.id === owner || item.username === owner || item.email === owner);
  if (!user) return owner;
  return [user.name || user.username, user.email].filter(Boolean).join(" / ");
}

function usageMemberLabel(data: AppData, memberID: string) {
  if (!memberID || memberID === "unknown") return "未归属成员";
  return ownerUserLabel(data, memberID);
}

function teamLabel(data: AppData, teamID: string) {
  if (!teamID) return "-";
  const team = (data.resources.teams ?? []).find((item) => item.id === teamID);
  return team?.name || teamID;
}

function teamMemberCount(data: AppData, team: AdminResource) {
  return data.users.filter((user) => user.team_id === team.id).length;
}

function costCenterLabel(data: AppData, costCenter: string) {
  if (!costCenter) return "-";
  const item = (data.resources["cost-centers"] ?? []).find((resource) => {
    const code = stringifyValue(resource.fields?.code);
    return resource.id === costCenter || code === costCenter;
  });
  if (!item) return costCenter;
  const code = stringifyValue(item.fields?.code) || item.id;
  return `${code} / ${item.name || item.id}`;
}

function projectName(data: AppData, projectID: string) {
  const project = findProject(data, projectID);
  return project ? project.name : projectID || "-";
}

function projectOwnerLabel(data: AppData, projectID: string) {
  const project = findProject(data, projectID);
  return ownerUserLabel(data, project?.owner_user_id ?? "");
}

function projectTeamLabel(data: AppData, projectID: string) {
  const project = findProject(data, projectID);
  return teamLabel(data, project?.team_id ?? "");
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
  return [{ key: "all", label: modelCategoryLabel("all"), count: total }, ...items];
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
  return text === "false" || text === "0" || text === "no" ? tx("否") : tx("是");
}

function settingsTabLabel(tab: SettingsTabKey) {
  const labels: Record<SettingsTabKey, string> = {
    settings: "基础设置",
    "role-configs": "角色配置",
    "identity-providers": "身份源",
  };
  return tx(labels[tab]);
}

function identityProviderTypeLabel(type: string) {
  const labels: Record<string, string> = {
    oidc: "OIDC",
    oauth2: "OAuth2",
    saml: "SAML",
    ldap: "LDAP",
  };
  return labels[type] ?? (type || "-");
}

function identityProviderIconLabel(iconKey: string) {
  const normalized = normalizedIdentityProviderIconKey(iconKey);
  const labels: Record<string, string> = {
    auto: "自动",
    gitlab: "GitLab",
    github: "GitHub",
    google: "Google",
    microsoft: "Microsoft",
    okta: "Okta",
    keycloak: "Keycloak",
    oidc: "OIDC",
    oauth2: "OAuth2",
    saml: "SAML",
    ldap: "LDAP",
    sso: "SSO",
  };
  return labels[normalized] ?? (iconKey || "-");
}

function dataScopeLabel(scope: string) {
  const labels: Record<string, string> = {
    global: "全局",
    team: "团队",
    project: "项目",
    self: "本人",
  };
  return tx(labels[scope] ?? (scope || "-"));
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
    feishu: "飞书",
    dingtalk: "钉钉",
    wecom: "企业微信",
    slack: "Slack",
    email: "邮件",
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
  return tx(labels[normalized] ?? roleLabel(normalized) ?? value ?? "-");
}

function fieldValueLabel(fieldKey: string, value: unknown): string {
  if (Array.isArray(value)) return value.map((item) => fieldValueLabel(fieldKey, item)).join(", ");
  const text = stringifyValue(value).trim();
  if (!text) return "-";
  const normalizedKey = fieldKey.toLowerCase();
  if (normalizedKey.includes("role")) return roleLabel(text);
  if (normalizedKey.includes("scope")) return dataScopeLabel(text);
  if (normalizedKey.includes("provider_type")) return providerTypeLabel(text);
  if (normalizedKey === "icon_key") return identityProviderIconLabel(text);
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
    webhook_url: "Webhook URL",
    secret: "签名密钥",
    smtp_host: "SMTP Host",
    smtp_port: "SMTP 端口",
    smtp_username: "SMTP 用户名",
    smtp_password: "SMTP 密码",
    smtp_from: "发件人",
    email_to: "收件人",
  };
  return tx(labels[key] ?? key);
}

function monitorTargetLabel(fields?: Record<string, unknown>) {
  const target = stringifyValue(fields?.target_type || "").toLowerCase();
  const labels: Record<string, string> = {
    provider: "Provider",
    resource: "资源实例",
    provider_resource: "资源实例",
    model: "模型路由",
  };
  return tx(labels[target] ?? (target || "-"));
}

function alertMetricLabel(metric: string) {
  const labels: Record<string, string> = {
    provider_health: "Provider 健康",
    provider_resource_health: "资源实例健康",
    request_quota_usage: "请求额度",
    token_quota_usage: "Token 额度",
    cost_quota_usage: "成本额度",
    daily_cost_usd: "日成本额度",
    daily_tokens: "日 Token 额度",
    error_rate: "错误率",
    latency_p95: "P95 延迟",
  };
  return tx(labels[metric] ?? (metric || "-"));
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
    team_leader: "团队 Leader",
    project_admin: "团队 Leader",
    user: "普通用户",
    member: "普通用户",
    viewer: "普通用户",
    readonly: "普通用户",
    read_only: "普通用户",
  };
  return tx(labels[role] ?? role);
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
  return tx(labels[normalized] ?? type ?? "-");
}

function budgetScopeLabel(scope: string) {
  const labels: Record<string, string> = {
    project: "项目",
    team: "团队",
    cost_center: "成本中心",
    "cost-center": "成本中心",
  };
  return tx(labels[scope] ?? scope);
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
  return tx(labels[value || "block"] ?? value);
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
  return tx(labels[dataset] ?? dataset);
}

function reportScheduleLabel(schedule: string) {
  const labels: Record<string, string> = {
    manual: "手动",
    daily: "每日",
    weekly: "每周",
    monthly: "每月",
  };
  return tx(labels[schedule] ?? schedule);
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
  return tx(labels[action] ?? action);
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
    "quota-policies": "项目额度",
    "security-policies": "安全策略",
    "alert-rules": "告警规则",
  };
  return tx(labels[type] ?? type);
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
  return tx(labels[trigger] ?? trigger);
}

function approvalStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "待审批",
    approved: "已批准",
    rejected: "已驳回",
  };
  return tx(labels[status] ?? status);
}

function invoiceStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "待确认",
    confirmed: "已确认",
    rejected: "已驳回",
    active: "有效",
    disabled: "停用",
  };
  return tx(labels[status] ?? status);
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
  const source = displayText(user.name) || user.username || user.email || "U";
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

function playgroundModels(data: AppData, sortByRoutes = data.routes.length > 0) {
  return data.models
    .filter((model) => model.status === "active" && (model.modality === "" || model.modality === "chat"))
    .sort((a, b) => {
      const routeDiff = sortByRoutes ? activeRouteCount(b.name, data) - activeRouteCount(a.name, data) : 0;
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
  const systemPrompt = tx("你是企业内部 AI 助手。");
  const prompt = tx("请用三句话介绍 TokenHub。");
  return {
    python: `from openai import OpenAI

client = OpenAI(
    api_key="YOUR_TOKENHUB_API_KEY",
    base_url="${normalizedBaseURL}"
)

response = client.chat.completions.create(
    model="${model}",
    messages=[
        {"role": "system", "content": "${systemPrompt}"},
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
    { role: "system", content: "${systemPrompt}" },
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
        .addSystemMessage("${systemPrompt}")
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
			openai.SystemMessage("${systemPrompt}"),
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
  return tx(labels[value || "balanced"] ?? value ?? "平衡");
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

type OAuthLoginResult = {
  token?: string;
  expiresAt?: string;
  error?: string;
};

function readOAuthLoginResult(): OAuthLoginResult | null {
  if (typeof window === "undefined") return null;
  const sources = [window.location.hash.replace(/^#/, ""), window.location.search.replace(/^\?/, "")];
  for (const source of sources) {
    if (!source) continue;
    const params = new URLSearchParams(source);
    const token = params.get("oauth_token") ?? "";
    const error = params.get("oauth_error") ?? "";
    if (token || error) {
      return {
        token,
        error,
        expiresAt: params.get("oauth_expires_at") ?? undefined,
      };
    }
  }
  return null;
}

function clearOAuthLoginResult() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  let changed = false;
  for (const key of ["oauth_token", "oauth_expires_at", "oauth_error"]) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }
  if (url.hash) {
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
    let hashChanged = false;
    for (const key of ["oauth_token", "oauth_expires_at", "oauth_error"]) {
      if (hashParams.has(key)) {
        hashParams.delete(key);
        hashChanged = true;
      }
    }
    if (hashChanged) {
      const nextHash = hashParams.toString();
      url.hash = nextHash ? `#${nextHash}` : "";
      changed = true;
    }
  }
  if (changed) {
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }
}

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
