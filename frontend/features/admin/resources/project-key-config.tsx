import { type AdminResource, type APIKey, type AppData, type FieldConfig, type Project, type ResourceAction, type ResourceConfig } from "../core/types";
import { costCenterLabel, costCenterSelectOptions, ownerUserLabel, projectMemberCanIssueLabel, projectMemberProjectSelectOptions, projectMemberRoleLabel, projectMemberRoleOptions, projectName, projectOwnerLabel, projectSelectOptions, projectTeamLabel, stringifyForm, stringifyValue, teamLabel, teamSelectOptions, truthyValue, userSelectOptions } from "../domain/entities";
import { tx } from "../i18n/runtime";
import { adminDelete, adminFetch, adminMutate, keyPatchPayload, projectQuotaSummary, updateAPIKeyStatus } from "./payloads";
import { StatusPill } from "../shared/ui";

export function projectConfig(): ResourceConfig<Project> {
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

export function projectMemberConfig(): ResourceConfig<AdminResource> {
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

export function projectMemberInitialValues(project: Project): Record<string, string> {
  return {
    project_id: project.id,
    role: "developer",
    can_issue_keys: "false",
    status: "active",
  };
}

export function projectMemberPayload(values: Record<string, string>, data?: AppData, existing?: AdminResource) {
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

export function apiKeyConfig(): ResourceConfig<APIKey> {
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

export function APIKeyStatusSwitch({
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

export function apiKeyStatusAction(status: "active" | "disabled"): ResourceAction<APIKey> {
  return {
    label: status === "active" ? "启用" : "禁用",
    title: status === "active" ? "重新启用该 API Key" : "立即禁用该 API Key",
    run: (ctx, item) => updateAPIKeyStatus(ctx, item, status),
    doneMessage: (item) => tx(`${item.name} 已${status === "active" ? "启用" : "禁用"}`),
  };
}
