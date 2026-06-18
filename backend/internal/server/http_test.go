package server

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestGatewayModelsAndChatCompletion(t *testing.T) {
	app := newTestServer()

	models := doJSON(t, app, http.MethodGet, "/v1/models", nil, "thk_demo_local")
	if models.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", models.Code, models.Body)
	}
	if !strings.Contains(models.Body, "gpt-4.1-mini") {
		t.Fatalf("model list does not include demo model: %s", models.Body)
	}

	resp := doJSON(t, app, http.MethodPost, "/v1/chat/completions", map[string]any{
		"model": "gpt-4.1-mini",
		"messages": []map[string]any{
			{"role": "user", "content": "hello tokenhub"},
		},
	}, "thk_demo_local")
	if resp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.Code, resp.Body)
	}
	if !strings.Contains(resp.Body, "Echo: hello tokenhub") {
		t.Fatalf("unexpected chat body: %s", resp.Body)
	}

	usage := doJSON(t, app, http.MethodGet, "/api/admin/usage/summary", nil, "")
	if usage.Code != http.StatusOK {
		t.Fatalf("usage summary failed: %d %s", usage.Code, usage.Body)
	}
	var summary struct {
		RequestCount int   `json:"request_count"`
		TotalTokens  int64 `json:"total_tokens"`
	}
	if err := json.Unmarshal([]byte(usage.Body), &summary); err != nil {
		t.Fatal(err)
	}
	if summary.RequestCount < 1 {
		t.Fatalf("expected audited requests: %s", usage.Body)
	}
	if summary.TotalTokens < 1 {
		t.Fatalf("expected token usage: %s", usage.Body)
	}

	breakdown := doJSON(t, app, http.MethodGet, "/api/admin/usage/breakdown", nil, "")
	if breakdown.Code != http.StatusOK {
		t.Fatalf("usage breakdown failed: %d %s", breakdown.Code, breakdown.Body)
	}
	if !strings.Contains(breakdown.Body, `"projects"`) || !strings.Contains(breakdown.Body, `"gpt-4.1-mini"`) {
		t.Fatalf("expected project and model breakdown: %s", breakdown.Body)
	}

	timeseries := doJSON(t, app, http.MethodGet, "/api/admin/usage/timeseries", nil, "")
	if timeseries.Code != http.StatusOK {
		t.Fatalf("usage timeseries failed: %d %s", timeseries.Code, timeseries.Body)
	}
	if !strings.Contains(timeseries.Body, `"data"`) || !strings.Contains(timeseries.Body, `"total_tokens"`) {
		t.Fatalf("expected timeseries data: %s", timeseries.Body)
	}
}

func TestGatewayStreamingChatCompletion(t *testing.T) {
	app := newTestServer()
	resp := doJSON(t, app, http.MethodPost, "/v1/chat/completions", map[string]any{
		"model":  "gpt-4.1-mini",
		"stream": true,
		"messages": []map[string]any{
			{"role": "user", "content": "stream this"},
		},
	}, "thk_demo_local")
	if resp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.Code, resp.Body)
	}
	if !strings.Contains(resp.Body, "data:") || !strings.Contains(resp.Body, "[DONE]") {
		t.Fatalf("expected SSE stream, got: %s", resp.Body)
	}
}

func TestAdminPlaygroundChatUsesRoutesWithoutProjectBilling(t *testing.T) {
	app := newTestServer()
	before := doJSON(t, app, http.MethodGet, "/api/admin/usage/summary", nil, "")
	if before.Code != http.StatusOK {
		t.Fatalf("usage summary before failed: %d %s", before.Code, before.Body)
	}
	var beforeSummary struct {
		RequestCount int `json:"request_count"`
	}
	if err := json.Unmarshal([]byte(before.Body), &beforeSummary); err != nil {
		t.Fatal(err)
	}

	resp := doJSON(t, app, http.MethodPost, "/api/admin/playground/chat", map[string]any{
		"model": "gpt-4.1-mini",
		"messages": []map[string]any{
			{"role": "user", "content": "playground smoke"},
		},
	}, "")
	if resp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.Code, resp.Body)
	}
	if !strings.Contains(resp.Body, "Echo: playground smoke") {
		t.Fatalf("unexpected playground body: %s", resp.Body)
	}
	if !strings.Contains(resp.Body, `"provider_name":"Mock Provider"`) || !strings.Contains(resp.Body, `"provider_model":"mock-chat"`) {
		t.Fatalf("expected route summary without provider secrets: %s", resp.Body)
	}
	if strings.Contains(resp.Body, "thk_demo_local") {
		t.Fatalf("playground response leaked a key: %s", resp.Body)
	}

	after := doJSON(t, app, http.MethodGet, "/api/admin/usage/summary", nil, "")
	if after.Code != http.StatusOK {
		t.Fatalf("usage summary after failed: %d %s", after.Code, after.Body)
	}
	var afterSummary struct {
		RequestCount int `json:"request_count"`
	}
	if err := json.Unmarshal([]byte(after.Body), &afterSummary); err != nil {
		t.Fatal(err)
	}
	if afterSummary.RequestCount != beforeSummary.RequestCount {
		t.Fatalf("playground should not create project usage records: before=%d after=%d", beforeSummary.RequestCount, afterSummary.RequestCount)
	}
}

func TestGatewayEmbeddings(t *testing.T) {
	app := newTestServer()
	resp := doJSON(t, app, http.MethodPost, "/v1/embeddings", map[string]any{
		"model": "text-embedding-3-small",
		"input": "enterprise ai gateway",
	}, "thk_demo_local")
	if resp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.Code, resp.Body)
	}
	if !strings.Contains(resp.Body, `"embedding"`) {
		t.Fatalf("expected embedding response: %s", resp.Body)
	}
}

func TestBootstrapSeedsStandardModelCatalog(t *testing.T) {
	t.Setenv("TOKENHUB_MODEL_CATALOG_FILE", "../../../data/model-catalog.yaml")
	store := NewMemoryStore()
	if err := BootstrapBaseData(store); err != nil {
		t.Fatal(err)
	}
	project, ok := store.GetProject(defaultProjectID)
	if !ok {
		t.Fatalf("expected default project %s", defaultProjectID)
	}
	if project.Name != "Default Project Space" || project.Status != StatusActive {
		t.Fatalf("unexpected default project: %+v", project)
	}
	if project.OwnerUserID != "usr_admin" || project.TeamID != "team_platform" || project.CostCenter != "AI-PLATFORM" {
		t.Fatalf("default project should have enterprise ownership fields: %+v", project)
	}
	models := store.ListModels()
	if len(models) < 220 {
		t.Fatalf("expected standard model catalog, got %d models", len(models))
	}
	byName := map[string]Model{}
	for _, model := range models {
		byName[strings.ToLower(model.Name)] = model
	}
	for name, category := range map[string]string{
		"deepseek-v3.2-thinking": "deepseek",
		"gemini-3-pro-preview":   "gemini",
		"minimax-m2":             "minimax",
		"step-tts-mini":          "stepfun",
		"baichuan-m2-128k":       "baichuan",
		"ernie-4.5-turbo-128k":   "ernie",
		"wanx2.1-t2i-plus":       "wanx",
	} {
		model, ok := byName[name]
		if !ok {
			t.Fatalf("expected model %s in catalog", name)
		}
		if model.Category != category {
			t.Fatalf("expected %s category %s, got %s", name, category, model.Category)
		}
	}
	if byName["gpt-image-2"].Modality != "image" {
		t.Fatalf("expected gpt-image-2 image modality, got %s", byName["gpt-image-2"].Modality)
	}
	if byName["sora-2"].Modality != "video" {
		t.Fatalf("expected sora-2 video modality, got %s", byName["sora-2"].Modality)
	}
	if byName["step-tts-mini"].Modality != "audio" {
		t.Fatalf("expected step-tts-mini audio modality, got %s", byName["step-tts-mini"].Modality)
	}
}

func TestDefaultModelCatalogLoadsYAMLFile(t *testing.T) {
	catalogPath := filepath.Join(t.TempDir(), "model-catalog.yaml")
	content := []byte(`
version: 1
models:
  - name: "test-chat-128k"
    category: "custom"
  - name: "test-embedding"
    category: "custom"
    modality: "embedding"
    embedding_price_usd_per_1m: 0.01
`)
	if err := os.WriteFile(catalogPath, content, 0o644); err != nil {
		t.Fatal(err)
	}

	models, err := defaultModelCatalog(catalogPath)
	if err != nil {
		t.Fatal(err)
	}
	if len(models) != 2 {
		t.Fatalf("expected 2 models, got %d", len(models))
	}
	if models[0].Name != "test-chat-128k" || models[0].ContextWindow != 128000 {
		t.Fatalf("unexpected chat model: %+v", models[0])
	}
	if models[1].Modality != "embedding" || models[1].EmbeddingPriceUSDPer1M != 0.01 {
		t.Fatalf("unexpected embedding model: %+v", models[1])
	}
}

func TestAdminCreatesAPIKeyUnderDefaultProject(t *testing.T) {
	store := NewMemoryStore()
	if err := BootstrapBaseData(store); err != nil {
		t.Fatal(err)
	}
	app := New(store).Handler()

	resp := doJSON(t, app, http.MethodPost, "/api/admin/projects/"+defaultProjectID+"/keys", map[string]any{
		"name":           "Default Project Key",
		"group":          "default",
		"allowed_models": []string{"gpt-4.1-mini"},
		"limits": map[string]any{
			"daily_requests":   1000,
			"monthly_requests": 30000,
			"daily_tokens":     1000000,
			"monthly_tokens":   20000000,
			"daily_cost_usd":   100,
			"monthly_cost_usd": 2000,
			"max_concurrency":  20,
		},
	}, "")
	if resp.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", resp.Code, resp.Body)
	}
	if !strings.Contains(resp.Body, `"project_id":"`+defaultProjectID+`"`) || !strings.Contains(resp.Body, `"api_key"`) {
		t.Fatalf("expected issued key under default project: %s", resp.Body)
	}

	keys := store.ListProjectKeys(defaultProjectID)
	if len(keys) != 1 {
		t.Fatalf("expected one default project key, got %d", len(keys))
	}
	if keys[0].ProjectID != defaultProjectID {
		t.Fatalf("expected key project %s, got %s", defaultProjectID, keys[0].ProjectID)
	}
}

func TestBootstrapBaseDataSeedsGovernanceResources(t *testing.T) {
	store := NewMemoryStore()
	if err := BootstrapBaseData(store); err != nil {
		t.Fatal(err)
	}

	policies := store.ListResources("security-policies")
	var found AdminResource
	for _, policy := range policies {
		if policy.ID == "sec_ip_allowlist" {
			found = policy
			break
		}
	}
	if found.ID == "" {
		t.Fatalf("expected seeded security policy, got %+v", policies)
	}
	if found.Name != "Production IP Allowlist Policy" || found.Status != StatusActive {
		t.Fatalf("unexpected security policy metadata: %+v", found)
	}
	if stringField(found.Fields, "error_passthrough") != "sanitized" || !strings.Contains(stringField(found.Fields, "ip_allowlist"), "127.0.0.1/32") {
		t.Fatalf("unexpected security policy fields: %+v", found.Fields)
	}

	settings := store.ListResources("settings")
	if len(settings) != 1 || settings[0].ID != "cfg_gateway" {
		t.Fatalf("expected gateway system setting, got %+v", settings)
	}
	if stringField(settings[0].Fields, "public_base_url") == "" || stringField(settings[0].Fields, "audit_retention") == "" {
		t.Fatalf("expected configurable system setting fields, got %+v", settings[0].Fields)
	}

	roles := store.ListResources("role-configs")
	if len(roles) != 3 {
		t.Fatalf("expected three role configs, got %+v", roles)
	}
	roleKeys := map[string]bool{}
	for _, role := range roles {
		roleKeys[stringField(role.Fields, "role_key")] = true
		if role.Status != StatusActive || stringField(role.Fields, "display_name") == "" {
			t.Fatalf("unexpected role config: %+v", role)
		}
	}
	for _, key := range []string{"user", "team_leader", "admin"} {
		if !roleKeys[key] {
			t.Fatalf("expected seeded role key %s, got %+v", key, roleKeys)
		}
	}

	identityProviders := store.ListResources("identity-providers")
	if len(identityProviders) != 1 || identityProviders[0].ID != "idp_oidc_template" {
		t.Fatalf("expected default identity provider template, got %+v", identityProviders)
	}
	if stringField(identityProviders[0].Fields, "provider_type") != "oidc" || stringField(identityProviders[0].Fields, "client_id") == "" {
		t.Fatalf("unexpected identity provider fields: %+v", identityProviders[0].Fields)
	}
}

func TestAdminImportsUsersFromExistingSystemCSV(t *testing.T) {
	store := NewMemoryStore()
	if err := BootstrapBaseData(store); err != nil {
		t.Fatal(err)
	}
	app := New(store).Handler()

	content := "username,name,email,role,team_id,status\nimported_user,导入用户,imported@example.com,user,team_platform,active\n"
	resp := doJSON(t, app, http.MethodPost, "/api/admin/users/import", map[string]any{
		"source":  "manual_csv",
		"format":  "csv",
		"content": content,
	}, "")
	if resp.Code != http.StatusOK {
		t.Fatalf("expected import 200, got %d: %s", resp.Code, resp.Body)
	}
	if !strings.Contains(resp.Body, `"created":1`) || !strings.Contains(resp.Body, `"updated":0`) {
		t.Fatalf("expected one created user: %s", resp.Body)
	}

	update := "username,name,email,role,team_id,status\nimported_user,导入用户已更新,imported@example.com,team_leader,team_platform,active\n"
	updated := doJSON(t, app, http.MethodPost, "/api/admin/users/import", map[string]any{
		"source":  "manual_csv",
		"format":  "csv",
		"content": update,
	}, "")
	if updated.Code != http.StatusOK {
		t.Fatalf("expected import update 200, got %d: %s", updated.Code, updated.Body)
	}
	if !strings.Contains(updated.Body, `"created":0`) || !strings.Contains(updated.Body, `"updated":1`) {
		t.Fatalf("expected one updated user: %s", updated.Body)
	}
	users := store.ListAdminUsers()
	var found AdminUser
	for _, user := range users {
		if user.Email == "imported@example.com" {
			found = user
			break
		}
	}
	if found.ID == "" || found.Name != "导入用户已更新" || found.Role != "team_leader" {
		t.Fatalf("expected imported user update, got %+v", found)
	}
}

func TestGatewayRejectsUnauthorizedModel(t *testing.T) {
	app := newTestServer()
	resp := doJSON(t, app, http.MethodPost, "/v1/chat/completions", map[string]any{
		"model": "not-allowed",
		"messages": []map[string]any{
			{"role": "user", "content": "hello"},
		},
	}, "thk_demo_local")
	if resp.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d: %s", resp.Code, resp.Body)
	}
	if !strings.Contains(resp.Body, "model_not_allowed") {
		t.Fatalf("expected model_not_allowed: %s", resp.Body)
	}
}

func TestGatewayQuotaExceeded(t *testing.T) {
	store := NewMemoryStore()
	project := store.CreateProject(Project{Name: "Limited"})
	_, secret, err := store.CreateAPIKey(project.ID, APIKey{
		Name:    "limited",
		Allowed: []string{"gpt-4.1-mini"},
		Limits:  QuotaLimits{DailyRequests: 1, MonthlyRequests: 1, MaxConcurrency: 1},
		Status:  StatusActive,
	}, "thk_limited")
	if err != nil {
		t.Fatal(err)
	}
	mock := store.AddProvider(Provider{Name: "Mock", Type: ProviderMock, Status: StatusActive, Healthy: true})
	store.AddModel(Model{Name: "gpt-4.1-mini", Modality: "chat", Status: StatusActive})
	store.AddRoute(ModelRoute{ModelName: "gpt-4.1-mini", ProviderID: mock.ID, ProviderModel: "mock-chat", Status: StatusActive})
	app := New(store).Handler()

	for i := 0; i < 2; i++ {
		resp := doJSON(t, app, http.MethodPost, "/v1/chat/completions", map[string]any{
			"model": "gpt-4.1-mini",
			"messages": []map[string]any{
				{"role": "user", "content": "hello"},
			},
		}, secret)
		if i == 0 && resp.Code != http.StatusOK {
			t.Fatalf("first request expected 200, got %d: %s", resp.Code, resp.Body)
		}
		if i == 1 && resp.Code != http.StatusTooManyRequests {
			t.Fatalf("second request expected 429, got %d: %s", resp.Code, resp.Body)
		}
	}
}

func TestQuotaPolicyAppliesAtRuntime(t *testing.T) {
	store := NewMemoryStore()
	project := store.CreateProject(Project{Name: "Policy Limited", TeamID: "team_policy"})
	_, secret, err := store.CreateAPIKey(project.ID, APIKey{
		Name:    "policy-key",
		Allowed: []string{"gpt-4.1-mini"},
		Limits:  QuotaLimits{DailyRequests: 100},
		Status:  StatusActive,
	}, "thk_policy_limited")
	if err != nil {
		t.Fatal(err)
	}
	store.CreateResource("quota-policies", AdminResource{
		Name:   "Project hard cap",
		Status: StatusActive,
		Fields: map[string]any{
			"scope":          "project",
			"scope_id":       project.ID,
			"daily_requests": 1,
		},
	})
	mock := store.AddProvider(Provider{Name: "Mock", Type: ProviderMock, Status: StatusActive, Healthy: true})
	store.AddModel(Model{Name: "gpt-4.1-mini", Modality: "chat", Status: StatusActive})
	store.AddRoute(ModelRoute{ModelName: "gpt-4.1-mini", ProviderID: mock.ID, ProviderModel: "mock-chat", Status: StatusActive})
	app := New(store).Handler()

	for i := 0; i < 2; i++ {
		resp := doJSON(t, app, http.MethodPost, "/v1/chat/completions", map[string]any{
			"model": "gpt-4.1-mini",
			"messages": []map[string]any{
				{"role": "user", "content": "quota policy"},
			},
		}, secret)
		if i == 0 && resp.Code != http.StatusOK {
			t.Fatalf("first request expected 200, got %d: %s", resp.Code, resp.Body)
		}
		if i == 1 && resp.Code != http.StatusTooManyRequests {
			t.Fatalf("second request expected 429 from quota policy, got %d: %s", resp.Code, resp.Body)
		}
	}
}

func TestBudgetExceededBlocksRuntimeCalls(t *testing.T) {
	store := NewMemoryStore()
	project := store.CreateProject(Project{Name: "Budget Limited", CostCenter: "CC-BLOCK"})
	apiKey, secret, err := store.CreateAPIKey(project.ID, APIKey{
		Name:    "budget-key",
		Allowed: []string{"gpt-4.1-mini"},
		Limits:  QuotaLimits{DailyRequests: 100},
		Status:  StatusActive,
	}, "thk_budget_limited")
	if err != nil {
		t.Fatal(err)
	}
	now := time.Now().UTC()
	period := now.Format("2006-01")
	store.CreateResource("budgets", AdminResource{
		Name:   "Blocking budget",
		Status: StatusActive,
		Fields: map[string]any{
			"scope":       "cost_center",
			"scope_id":    "CC-BLOCK",
			"period_ref":  period,
			"amount_usd":  1,
			"enforcement": "block",
		},
	})
	if err := store.db.Create(&UsageRecord{
		ID:          NewID("usage"),
		RequestID:   NewID("req"),
		ProjectID:   project.ID,
		APIKeyID:    apiKey.ID,
		ModelName:   "gpt-4.1-mini",
		InputTokens: 10,
		TotalTokens: 10,
		CostUSD:     1,
		CreatedAt:   now,
	}).Error; err != nil {
		t.Fatal(err)
	}
	mock := store.AddProvider(Provider{Name: "Mock", Type: ProviderMock, Status: StatusActive, Healthy: true})
	store.AddModel(Model{Name: "gpt-4.1-mini", Modality: "chat", Status: StatusActive})
	store.AddRoute(ModelRoute{ModelName: "gpt-4.1-mini", ProviderID: mock.ID, ProviderModel: "mock-chat", Status: StatusActive})
	app := New(store).Handler()

	blocked := doJSON(t, app, http.MethodPost, "/v1/chat/completions", map[string]any{
		"model": "gpt-4.1-mini",
		"messages": []map[string]any{
			{"role": "user", "content": "budget should block"},
		},
	}, secret)
	if blocked.Code != http.StatusTooManyRequests || !strings.Contains(blocked.Body, "budget_exceeded") {
		t.Fatalf("expected budget_exceeded, got %d: %s", blocked.Code, blocked.Body)
	}
	budgets := store.ListResources("budgets")
	budgets[0].Fields["enforcement"] = "warn"
	if _, err := store.UpdateResource("budgets", budgets[0].ID, budgets[0]); err != nil {
		t.Fatal(err)
	}
	allowed := doJSON(t, app, http.MethodPost, "/v1/chat/completions", map[string]any{
		"model": "gpt-4.1-mini",
		"messages": []map[string]any{
			{"role": "user", "content": "budget warn only"},
		},
	}, secret)
	if allowed.Code != http.StatusOK {
		t.Fatalf("warn-only budget should allow runtime call, got %d: %s", allowed.Code, allowed.Body)
	}
}

func TestRuntimeBudgetUsesActualUsageInsteadOfCachedUsedField(t *testing.T) {
	store := NewMemoryStore()
	project := store.CreateProject(Project{Name: "Fresh Budget", CostCenter: "CC-FRESH"})
	_, secret, err := store.CreateAPIKey(project.ID, APIKey{
		Name:    "fresh-budget-key",
		Allowed: []string{"gpt-4.1-mini"},
		Limits:  QuotaLimits{DailyRequests: 100},
		Status:  StatusActive,
	}, "thk_fresh_budget")
	if err != nil {
		t.Fatal(err)
	}
	store.CreateResource("budgets", AdminResource{
		Name:   "Stale report cache",
		Status: StatusActive,
		Fields: map[string]any{
			"scope":       "cost_center",
			"scope_id":    "CC-FRESH",
			"period_ref":  time.Now().UTC().Format("2006-01"),
			"amount_usd":  1,
			"used_usd":    99,
			"enforcement": "block",
		},
	})
	mock := store.AddProvider(Provider{Name: "Mock", Type: ProviderMock, Status: StatusActive, Healthy: true})
	store.AddModel(Model{Name: "gpt-4.1-mini", Modality: "chat", Status: StatusActive})
	store.AddRoute(ModelRoute{ModelName: "gpt-4.1-mini", ProviderID: mock.ID, ProviderModel: "mock-chat", Status: StatusActive})
	app := New(store).Handler()

	resp := doJSON(t, app, http.MethodPost, "/v1/chat/completions", map[string]any{
		"model": "gpt-4.1-mini",
		"messages": []map[string]any{
			{"role": "user", "content": "budget should use actual usage"},
		},
	}, secret)
	if resp.Code != http.StatusOK {
		t.Fatalf("stale used_usd should not block runtime call, got %d: %s", resp.Code, resp.Body)
	}
}

func TestAPIKeyIPAllowlistAndRotation(t *testing.T) {
	store := NewMemoryStore()
	project := store.CreateProject(Project{Name: "Key Ops"})
	key, secret, err := store.CreateAPIKey(project.ID, APIKey{
		Name:        "restricted",
		Group:       "dedicated",
		Allowed:     []string{"gpt-4.1-mini"},
		IPAllowlist: []string{"10.0.0.0/8"},
		Status:      StatusActive,
	}, "thk_restricted")
	if err != nil {
		t.Fatal(err)
	}
	if _, _, err := store.ValidateAPIKey(secret, "127.0.0.1"); AsHTTPError(err).Code != "api_key_disabled" {
		t.Fatalf("expected ip allowlist rejection, got %v", err)
	}
	if _, valid, err := store.ValidateAPIKey(secret, "10.1.2.3"); err != nil || valid.Group != "dedicated" {
		t.Fatalf("expected valid key with group, got key=%+v err=%v", valid, err)
	}
	rotated, newSecret, err := store.RotateAPIKey(key.ID, nil)
	if err != nil {
		t.Fatal(err)
	}
	if rotated.RotatedFromID != key.ID || newSecret == "" {
		t.Fatalf("unexpected rotated key: %+v secret=%q", rotated, newSecret)
	}
	if _, _, err := store.ValidateAPIKey(secret, "10.1.2.3"); AsHTTPError(err).Code != "api_key_disabled" {
		t.Fatalf("old key should be revoked, got %v", err)
	}
	if _, _, err := store.ValidateAPIKey(newSecret, "10.1.2.3"); err != nil {
		t.Fatalf("new key should work: %v", err)
	}
}

func TestAPIKeyStatusUpdatePreservesExpiration(t *testing.T) {
	store := NewMemoryStore()
	project := store.CreateProject(Project{Name: "Expiring Key Ops"})
	expiresAt := time.Now().UTC().Add(24 * time.Hour).Truncate(time.Second)
	key, _, err := store.CreateAPIKey(project.ID, APIKey{
		Name:      "expiring",
		Status:    StatusActive,
		ExpiresAt: &expiresAt,
	}, "thk_expiring")
	if err != nil {
		t.Fatal(err)
	}
	updated, err := store.UpdateAPIKey(key.ID, APIKey{Status: StatusDisabled})
	if err != nil {
		t.Fatal(err)
	}
	if updated.Status != StatusDisabled {
		t.Fatalf("expected disabled key, got %s", updated.Status)
	}
	if updated.ExpiresAt == nil || !updated.ExpiresAt.Equal(expiresAt) {
		t.Fatalf("expected expiration to be preserved, got %v want %v", updated.ExpiresAt, expiresAt)
	}
}

func TestAdminCreatesProjectAndKey(t *testing.T) {
	app := newTestServer()
	project := doJSON(t, app, http.MethodPost, "/api/admin/projects", map[string]any{
		"name":    "Production App",
		"team_id": "team_ai",
	}, "")
	if project.Code != http.StatusCreated {
		t.Fatalf("expected project created, got %d: %s", project.Code, project.Body)
	}
	var created Project
	if err := json.Unmarshal([]byte(project.Body), &created); err != nil {
		t.Fatal(err)
	}

	key := doJSON(t, app, http.MethodPost, "/api/admin/projects/"+created.ID+"/keys", map[string]any{
		"name":           "prod-key",
		"allowed_models": []string{"gpt-4.1-mini"},
		"limits": map[string]any{
			"daily_requests":  10,
			"max_concurrency": 2,
		},
	}, "")
	if key.Code != http.StatusCreated {
		t.Fatalf("expected key created, got %d: %s", key.Code, key.Body)
	}
	if !strings.Contains(key.Body, `"plain_text_visible_once":true`) || !strings.Contains(key.Body, `"api_key":"thk_`) {
		t.Fatalf("expected one-time key response: %s", key.Body)
	}
}

func TestApprovalFlowInterceptsAPIKeyCreate(t *testing.T) {
	store := NewMemoryStore()
	project := store.CreateProject(Project{Name: "Approval Project"})
	store.CreateResource("approval-flows", AdminResource{
		Name:   "Key approval",
		Status: StatusActive,
		Fields: map[string]any{
			"trigger":       "api_key_create",
			"approver_role": "admin",
		},
	})
	app := New(store).Handler()

	key := doJSON(t, app, http.MethodPost, "/api/admin/projects/"+project.ID+"/keys", map[string]any{
		"name":           "needs-approval",
		"allowed_models": []string{"gpt-4.1-mini"},
		"limits": map[string]any{
			"daily_requests": 10,
		},
	}, "")
	if key.Code != http.StatusAccepted {
		t.Fatalf("expected approval response, got %d: %s", key.Code, key.Body)
	}
	if !strings.Contains(key.Body, `"approval_required":true`) || strings.Contains(key.Body, `"api_key":"thk_`) {
		t.Fatalf("expected pending approval without secret: %s", key.Body)
	}

	approvals := doJSON(t, app, http.MethodGet, "/api/admin/approvals", nil, "")
	if approvals.Code != http.StatusOK {
		t.Fatalf("expected approvals list, got %d: %s", approvals.Code, approvals.Body)
	}
	var list struct {
		Data []ApprovalRequest `json:"data"`
	}
	if err := json.Unmarshal([]byte(approvals.Body), &list); err != nil {
		t.Fatal(err)
	}
	if len(list.Data) != 1 || list.Data[0].Status != "pending" || list.Data[0].Trigger != "api_key_create" {
		t.Fatalf("unexpected approvals: %s", approvals.Body)
	}

	approved := doJSON(t, app, http.MethodPost, "/api/admin/approvals/"+list.Data[0].ID+"/approve", map[string]any{}, "")
	if approved.Code != http.StatusOK {
		t.Fatalf("expected approval apply, got %d: %s", approved.Code, approved.Body)
	}
	if !strings.Contains(approved.Body, `"api_key":"thk_`) || !strings.Contains(approved.Body, `"status":"approved"`) {
		t.Fatalf("expected approved key result: %s", approved.Body)
	}
	if len(store.ListAPIKeys()) != 1 {
		t.Fatalf("expected key created after approval")
	}
}

func TestProjectQuotaIncreaseApprovalCreatesAndLinksPolicy(t *testing.T) {
	store := NewMemoryStore()
	project := store.CreateProject(Project{Name: "Quota Project", Status: StatusActive})
	app := New(store).Handler()

	request := doJSON(t, app, http.MethodPost, "/api/admin/projects/"+project.ID+"/quota-increase", map[string]any{
		"name": "Quota Project 提升额度",
		"fields": map[string]any{
			"daily_requests":   20,
			"monthly_requests": 500,
			"monthly_cost_usd": 25,
		},
	}, "")
	if request.Code != http.StatusAccepted {
		t.Fatalf("expected quota approval request, got %d: %s", request.Code, request.Body)
	}
	if !strings.Contains(request.Body, `"approval_required":true`) || !strings.Contains(request.Body, `"trigger":"quota_increase"`) {
		t.Fatalf("expected quota approval payload: %s", request.Body)
	}

	approvals := store.ListApprovalRequests()
	if len(approvals) != 1 || approvals[0].ResourceType != "quota-policies" || approvals[0].ResourceID != "" {
		t.Fatalf("unexpected quota approvals: %+v", approvals)
	}

	approved := doJSON(t, app, http.MethodPost, "/api/admin/approvals/"+approvals[0].ID+"/approve", map[string]any{}, "")
	if approved.Code != http.StatusOK {
		t.Fatalf("expected quota approval apply, got %d: %s", approved.Code, approved.Body)
	}

	quotas := store.ListResources("quota-policies")
	if len(quotas) != 1 {
		t.Fatalf("expected one quota policy after approval, got %+v", quotas)
	}
	if stringField(quotas[0].Fields, "scope") != "project" || stringField(quotas[0].Fields, "scope_id") != project.ID {
		t.Fatalf("expected project-scoped quota policy, got %+v", quotas[0].Fields)
	}
	if int64Field(quotas[0].Fields, "daily_requests") != 20 || int64Field(quotas[0].Fields, "monthly_requests") != 500 {
		t.Fatalf("expected approved quota limits, got %+v", quotas[0].Fields)
	}
	updatedProject, ok := store.GetProject(project.ID)
	if !ok || updatedProject.DefaultQuotaRef != quotas[0].ID {
		t.Fatalf("expected project quota ref %s, got %+v", quotas[0].ID, updatedProject)
	}
}

func TestAlertWebhookDeliveryIsRecorded(t *testing.T) {
	store := NewMemoryStore()
	var received bytes.Buffer
	webhook := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Fatalf("expected POST webhook, got %s", r.Method)
		}
		_, _ = io.Copy(&received, r.Body)
		w.WriteHeader(http.StatusAccepted)
	}))
	defer webhook.Close()

	store.CreateResource("notification-channels", AdminResource{
		Name:   "Webhook",
		Status: StatusActive,
		Fields: map[string]any{
			"type":        "webhook",
			"webhook_url": webhook.URL,
		},
	})
	alert := AlertEvent{
		ID:        "alt_test",
		ScopeType: "api_key",
		ScopeID:   "key_demo",
		Severity:  "warning",
		Code:      "monthly_cost_near_limit",
		Message:   "Monthly cost quota is near or above limit",
		CreatedAt: time.Now().UTC(),
	}
	if err := store.db.Create(&alert).Error; err != nil {
		t.Fatal(err)
	}
	app := New(store).Handler()

	resp := doJSON(t, app, http.MethodPost, "/api/admin/alerts/"+alert.ID+"/deliver", map[string]any{}, "")
	if resp.Code != http.StatusOK {
		t.Fatalf("expected delivery success, got %d: %s", resp.Code, resp.Body)
	}
	if !strings.Contains(resp.Body, `"status":"success"`) || !strings.Contains(resp.Body, `"status_code":202`) {
		t.Fatalf("unexpected delivery response: %s", resp.Body)
	}
	if !strings.Contains(received.String(), "monthly_cost_near_limit") {
		t.Fatalf("webhook did not receive alert payload: %s", received.String())
	}
	deliveries := store.ListAlertDeliveries()
	if len(deliveries) < 1 || deliveries[0].AlertID != alert.ID || deliveries[0].Status != "success" {
		t.Fatalf("expected recorded delivery, got %+v", deliveries)
	}
}

func TestAlertBotDeliveryFormats(t *testing.T) {
	tests := []struct {
		channelType string
		bodyMarker  string
	}{
		{channelType: "feishu", bodyMarker: `"msg_type":"text"`},
		{channelType: "dingtalk", bodyMarker: `"msgtype":"text"`},
		{channelType: "wecom", bodyMarker: `"msgtype":"text"`},
		{channelType: "slack", bodyMarker: `"text":"[TokenHub] monitor_check_failed`},
	}
	for _, tt := range tests {
		t.Run(tt.channelType, func(t *testing.T) {
			store := NewMemoryStore()
			var received bytes.Buffer
			webhook := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.Method != http.MethodPost {
					t.Fatalf("expected POST webhook, got %s", r.Method)
				}
				_, _ = io.Copy(&received, r.Body)
				w.WriteHeader(http.StatusOK)
			}))
			defer webhook.Close()

			store.CreateResource("notification-channels", AdminResource{
				Name:   tt.channelType,
				Status: StatusActive,
				Fields: map[string]any{
					"type":        tt.channelType,
					"webhook_url": webhook.URL,
				},
			})
			alert := AlertEvent{
				ID:        "alt_" + tt.channelType,
				ScopeType: "provider",
				ScopeID:   "prv_test",
				Severity:  "warning",
				Code:      "monitor_check_failed",
				Message:   "Provider failed",
				CreatedAt: time.Now().UTC(),
			}
			if err := store.db.Create(&alert).Error; err != nil {
				t.Fatal(err)
			}
			app := New(store).Handler()

			resp := doJSON(t, app, http.MethodPost, "/api/admin/alerts/"+alert.ID+"/deliver", map[string]any{}, "")
			if resp.Code != http.StatusOK || !strings.Contains(resp.Body, `"status":"success"`) {
				t.Fatalf("expected delivery success, got %d: %s", resp.Code, resp.Body)
			}
			if !strings.Contains(received.String(), tt.bodyMarker) || !strings.Contains(received.String(), "monitor_check_failed") {
				t.Fatalf("unexpected %s payload: %s", tt.channelType, received.String())
			}
		})
	}
}

func TestAlertEmailDeliveryMissingConfigIsRecorded(t *testing.T) {
	store := NewMemoryStore()
	store.CreateResource("notification-channels", AdminResource{
		Name:   "Email",
		Status: StatusActive,
		Fields: map[string]any{
			"type":     "email",
			"email_to": "ops@example.com",
		},
	})
	alert := AlertEvent{
		ID:        "alt_email",
		ScopeType: "provider",
		ScopeID:   "prv_test",
		Severity:  "warning",
		Code:      "monitor_check_failed",
		Message:   "Provider failed",
		CreatedAt: time.Now().UTC(),
	}
	if err := store.db.Create(&alert).Error; err != nil {
		t.Fatal(err)
	}
	app := New(store).Handler()

	resp := doJSON(t, app, http.MethodPost, "/api/admin/alerts/"+alert.ID+"/deliver", map[string]any{}, "")
	if resp.Code != http.StatusOK || !strings.Contains(resp.Body, `"status":"failed"`) || !strings.Contains(resp.Body, "smtp_host is required") {
		t.Fatalf("expected recorded email config failure, got %d: %s", resp.Code, resp.Body)
	}
	deliveries := store.ListAlertDeliveries()
	if len(deliveries) < 1 || deliveries[0].Channel != "email" || deliveries[0].Status != "failed" {
		t.Fatalf("expected failed email delivery record, got %+v", deliveries)
	}
}

func TestBillingGenerationUpdatesBudgetsAndInvoices(t *testing.T) {
	store := NewMemoryStore()
	period := time.Now().UTC().Format("2006-01")
	store.CreateResource("teams", AdminResource{
		ID:     "team_finance",
		Name:   "Finance",
		Status: StatusActive,
		Fields: map[string]any{
			"cost_center": "CC-FIN",
		},
	})
	project := store.CreateProject(Project{Name: "Finance App", TeamID: "team_finance"})
	directProject := store.CreateProject(Project{Name: "Direct Cost Center App", TeamID: "team_finance", CostCenter: "CC-DIRECT"})
	store.CreateResource("budgets", AdminResource{
		ID:     "bdg_finance",
		Name:   "Finance monthly budget",
		Status: StatusActive,
		Fields: map[string]any{
			"scope":        "cost_center",
			"scope_id":     "CC-FIN",
			"period":       "monthly",
			"period_ref":   period,
			"amount_usd":   1,
			"warn_percent": 50,
		},
	})
	store.CreateResource("budgets", AdminResource{
		ID:     "bdg_project",
		Name:   "Project monthly budget",
		Status: StatusActive,
		Fields: map[string]any{
			"scope":        "project",
			"scope_id":     project.ID,
			"period":       "monthly",
			"period_ref":   period,
			"amount_usd":   2,
			"warn_percent": 90,
		},
	})
	store.CreateResource("budgets", AdminResource{
		ID:     "bdg_direct",
		Name:   "Direct cost center monthly budget",
		Status: StatusActive,
		Fields: map[string]any{
			"scope":        "cost_center",
			"scope_id":     "CC-DIRECT",
			"period":       "monthly",
			"period_ref":   period,
			"amount_usd":   2,
			"warn_percent": 90,
		},
	})
	if err := store.db.Create(&UsageRecord{
		ID:           "use_finance_1",
		RequestID:    "req_finance_1",
		ProjectID:    project.ID,
		APIKeyID:     "key_finance",
		ModelName:    "gpt-4.1-mini",
		ProviderID:   "prv_mock",
		InputTokens:  1000,
		OutputTokens: 1000,
		TotalTokens:  2000,
		CostUSD:      0.75,
		CreatedAt:    time.Now().UTC(),
	}).Error; err != nil {
		t.Fatal(err)
	}
	if err := store.db.Create(&UsageRecord{
		ID:           "use_direct_1",
		RequestID:    "req_direct_1",
		ProjectID:    directProject.ID,
		APIKeyID:     "key_direct",
		ModelName:    "gpt-4.1-mini",
		ProviderID:   "prv_mock",
		InputTokens:  100,
		OutputTokens: 100,
		TotalTokens:  200,
		CostUSD:      0.25,
		CreatedAt:    time.Now().UTC(),
	}).Error; err != nil {
		t.Fatal(err)
	}
	app := New(store).Handler()

	resp := doJSON(t, app, http.MethodPost, "/api/admin/billing/generate", map[string]any{"period": period}, "")
	if resp.Code != http.StatusOK {
		t.Fatalf("expected billing generation, got %d: %s", resp.Code, resp.Body)
	}
	if !strings.Contains(resp.Body, `"chargebacks":2`) || !strings.Contains(resp.Body, `"invoices":2`) {
		t.Fatalf("expected generated chargeback and invoice: %s", resp.Body)
	}
	chargebacks := store.ListResources("chargebacks")
	invoices := store.ListResources("invoices")
	if len(chargebacks) != 2 {
		t.Fatalf("unexpected chargebacks: %+v", chargebacks)
	}
	var hasFinanceChargeback, hasDirectChargeback bool
	for _, chargeback := range chargebacks {
		if stringField(chargeback.Fields, "cost_center") == "CC-FIN" {
			hasFinanceChargeback = true
		}
		if stringField(chargeback.Fields, "cost_center") == "CC-DIRECT" {
			hasDirectChargeback = true
		}
	}
	if !hasFinanceChargeback || !hasDirectChargeback {
		t.Fatalf("expected finance and direct cost center chargebacks: %+v", chargebacks)
	}
	if len(invoices) != 2 {
		t.Fatalf("unexpected invoices: %+v", invoices)
	}
	var hasDirectInvoice bool
	for _, invoice := range invoices {
		if strings.Contains(stringField(invoice.Fields, "invoice_note"), "CC-DIRECT") {
			hasDirectInvoice = true
		}
	}
	if !hasDirectInvoice {
		t.Fatalf("expected direct cost center invoice: %+v", invoices)
	}
	budgets := store.ListResources("budgets")
	if len(budgets) != 3 {
		t.Fatalf("expected two budgets, got %+v", budgets)
	}
	var costCenterBudget, projectBudget, directBudget AdminResource
	for _, budget := range budgets {
		switch budget.ID {
		case "bdg_finance":
			costCenterBudget = budget
		case "bdg_project":
			projectBudget = budget
		case "bdg_direct":
			directBudget = budget
		}
	}
	if float64Field(costCenterBudget.Fields, "used_usd") != 0.75 ||
		float64Field(projectBudget.Fields, "used_usd") != 0.75 ||
		float64Field(directBudget.Fields, "used_usd") != 0.25 {
		t.Fatalf("expected budget usage update: %+v", budgets)
	}
	alerts := store.ListAlerts()
	if len(alerts) != 1 || alerts[0].Code != "budget_warn_threshold" {
		t.Fatalf("expected budget threshold alert, got %+v", alerts)
	}
}

func TestInvoiceConfirmRejectAndStructuredExport(t *testing.T) {
	store := NewMemoryStore()
	if _, err := store.CreateAdminUser(AdminUser{
		Username: "finance-admin",
		Name:     "Finance Admin",
		Email:    "finance-admin@tokenhub.local",
		Role:     "admin",
		Status:   StatusActive,
	}, "admin123456"); err != nil {
		t.Fatal(err)
	}
	invoice := store.CreateResource("invoices", AdminResource{
		ID:     "inv_confirm_me",
		Name:   "2026-06 CC-FIN internal invoice",
		Status: "pending",
		Fields: map[string]any{
			"period":       "2026-06",
			"cost_center":  "CC-FIN",
			"amount_usd":   12.34,
			"invoice_note": "Initial note",
		},
	})
	rejected := store.CreateResource("invoices", AdminResource{
		ID:     "inv_reject_me",
		Name:   "2026-06 CC-RND internal invoice",
		Status: "pending",
		Fields: map[string]any{
			"period":       "2026-06",
			"cost_center":  "CC-RND",
			"amount_usd":   2.5,
			"invoice_note": "Needs review",
		},
	})
	app := New(store).Handler()

	confirmed := doJSON(t, app, http.MethodPost, "/api/admin/resources/invoices/"+invoice.ID+"/confirm", map[string]any{
		"invoice_note": "PO-2026-06-FIN",
	}, "")
	if confirmed.Code != http.StatusOK {
		t.Fatalf("expected invoice confirm 200, got %d: %s", confirmed.Code, confirmed.Body)
	}
	if !strings.Contains(confirmed.Body, `"status":"confirmed"`) ||
		!strings.Contains(confirmed.Body, `"confirmed_by":"Finance Admin"`) ||
		!strings.Contains(confirmed.Body, `"invoice_note":"PO-2026-06-FIN"`) {
		t.Fatalf("unexpected confirm body: %s", confirmed.Body)
	}
	again := doJSON(t, app, http.MethodPost, "/api/admin/resources/invoices/"+invoice.ID+"/confirm", map[string]any{}, "")
	if again.Code != http.StatusConflict || !strings.Contains(again.Body, "invoice_already_decided") {
		t.Fatalf("expected already decided conflict, got %d: %s", again.Code, again.Body)
	}

	rejectResp := doJSON(t, app, http.MethodPost, "/api/admin/resources/invoices/"+rejected.ID+"/reject", map[string]any{
		"reject_reason": "department disputed allocation",
	}, "")
	if rejectResp.Code != http.StatusOK {
		t.Fatalf("expected invoice reject 200, got %d: %s", rejectResp.Code, rejectResp.Body)
	}
	if !strings.Contains(rejectResp.Body, `"status":"rejected"`) ||
		!strings.Contains(rejectResp.Body, `"reject_reason":"department disputed allocation"`) {
		t.Fatalf("unexpected reject body: %s", rejectResp.Body)
	}

	exported := doJSON(t, app, http.MethodGet, "/api/admin/export/invoices", nil, "")
	if exported.Code != http.StatusOK {
		t.Fatalf("expected invoice export 200, got %d: %s", exported.Code, exported.Body)
	}
	if !strings.HasPrefix(exported.Body, "period,cost_center,amount_usd,invoice_note,confirmed_by,confirmed_at,reject_reason,status,updated_at") {
		t.Fatalf("expected structured invoice csv, got: %s", exported.Body)
	}
	if !strings.Contains(exported.Body, "2026-06,CC-FIN,12.34,PO-2026-06-FIN,Finance Admin") ||
		!strings.Contains(exported.Body, "2026-06,CC-RND,2.5,Needs review,,,department disputed allocation,rejected") {
		t.Fatalf("expected invoice rows in export: %s", exported.Body)
	}
	filtered := doJSON(t, app, http.MethodGet, "/api/admin/export/invoices?period=2026-05", nil, "")
	if filtered.Code != http.StatusOK {
		t.Fatalf("expected filtered invoice export 200, got %d: %s", filtered.Code, filtered.Body)
	}
	if strings.Contains(filtered.Body, "CC-FIN") || strings.Contains(filtered.Body, "CC-RND") {
		t.Fatalf("period filtered export should not include 2026-06 rows: %s", filtered.Body)
	}
	audit := store.ListAuditEvents()
	if len(audit) < 3 {
		t.Fatalf("expected audit events for invoice actions and export, got %+v", audit)
	}
}

func TestInvoiceConfirmCanRequireApproval(t *testing.T) {
	store := NewMemoryStore()
	if _, err := store.CreateAdminUser(AdminUser{
		Username: "approver",
		Name:     "Approver",
		Email:    "approver@tokenhub.local",
		Role:     "admin",
		Status:   StatusActive,
	}, "admin123456"); err != nil {
		t.Fatal(err)
	}
	projectApprover, err := store.CreateAdminUser(AdminUser{
		Username: "project-approver",
		Name:     "Project Approver",
		Email:    "project-approver@tokenhub.local",
		Role:     "project_admin",
		Status:   StatusActive,
	}, "admin123456")
	if err != nil {
		t.Fatal(err)
	}
	_, projectSession, err := store.AuthenticateAdminUser(projectApprover.Email, "admin123456", time.Hour)
	if err != nil {
		t.Fatal(err)
	}
	invoice := store.CreateResource("invoices", AdminResource{
		ID:     "inv_needs_approval",
		Name:   "2026-06 CC-AI internal invoice",
		Status: "pending",
		Fields: map[string]any{
			"period":       "2026-06",
			"cost_center":  "CC-AI",
			"amount_usd":   100,
			"invoice_note": "Pending approval",
		},
	})
	store.CreateResource("approval-flows", AdminResource{
		Name:   "Invoice confirmation approval",
		Status: StatusActive,
		Fields: map[string]any{
			"trigger":       "invoice_confirm",
			"approver_role": "admin",
			"threshold_usd": 50,
		},
	})
	app := New(store).Handler()

	confirm := doJSON(t, app, http.MethodPost, "/api/admin/resources/invoices/"+invoice.ID+"/confirm", map[string]any{
		"invoice_note": "Approve this invoice",
	}, "")
	if confirm.Code != http.StatusAccepted {
		t.Fatalf("expected invoice confirmation approval, got %d: %s", confirm.Code, confirm.Body)
	}
	if !strings.Contains(confirm.Body, `"approval_required":true`) || !strings.Contains(confirm.Body, `"trigger":"invoice_confirm"`) {
		t.Fatalf("expected invoice approval payload: %s", confirm.Body)
	}
	pendingInvoices := store.ListResources("invoices")
	if len(pendingInvoices) != 1 || pendingInvoices[0].Status != "pending" {
		t.Fatalf("invoice should remain pending before approval, got %+v", pendingInvoices)
	}
	approvals := store.ListApprovalRequests()
	if len(approvals) != 1 || approvals[0].ResourceID != invoice.ID {
		t.Fatalf("expected one invoice approval, got %+v", approvals)
	}
	forbidden := doJSON(t, app, http.MethodPost, "/api/admin/approvals/"+approvals[0].ID+"/approve", map[string]any{}, projectSession.Token)
	if forbidden.Code != http.StatusForbidden || !strings.Contains(forbidden.Body, "approval_role_forbidden") {
		t.Fatalf("expected approval role forbidden, got %d: %s", forbidden.Code, forbidden.Body)
	}
	approved := doJSON(t, app, http.MethodPost, "/api/admin/approvals/"+approvals[0].ID+"/approve", map[string]any{}, "")
	if approved.Code != http.StatusOK {
		t.Fatalf("expected invoice approval apply, got %d: %s", approved.Code, approved.Body)
	}
	items := store.ListResources("invoices")
	if len(items) != 1 || items[0].Status != "confirmed" || stringField(items[0].Fields, "confirmed_by") != "Approver" {
		t.Fatalf("expected approved invoice confirmation, got %+v", items)
	}
	var applied bool
	for _, event := range store.ListAuditEvents() {
		if event.Action == "apply_approval" && event.ResourceType == "invoices" && event.ResourceID == invoice.ID {
			applied = true
		}
	}
	if !applied {
		t.Fatalf("expected apply_approval audit event, got %+v", store.ListAuditEvents())
	}
}

func TestSQLiteBackupCreateDownloadRestoreAndDelete(t *testing.T) {
	tmp := t.TempDir()
	store, err := NewSQLiteStoreWithConfig("sqlite:"+filepath.Join(tmp, "tokenhub.db"), Config{
		AdminToken:      "dev_admin_token",
		SQLiteBackupDir: filepath.Join(tmp, "backups"),
		SecretKey:       "test-secret",
	})
	if err != nil {
		t.Fatal(err)
	}
	if err := SeedDemoData(store); err != nil {
		t.Fatal(err)
	}
	project := store.CreateProject(Project{Name: "Backup Restore Project", Status: StatusActive})
	app := New(store).Handler()

	created := doJSON(t, app, http.MethodPost, "/api/admin/sqlite/backups", map[string]any{"expire_days": 7}, "")
	if created.Code != http.StatusCreated {
		t.Fatalf("create backup failed: %d %s", created.Code, created.Body)
	}
	var backup SQLiteBackupRecord
	if err := json.Unmarshal([]byte(created.Body), &backup); err != nil {
		t.Fatal(err)
	}
	if backup.ID == "" || backup.Status != "ready" || backup.SizeBytes <= 0 || backup.ChecksumSHA256 == "" {
		t.Fatalf("unexpected backup payload: %+v body=%s", backup, created.Body)
	}

	if err := store.DeleteProject(project.ID); err != nil {
		t.Fatal(err)
	}
	if _, ok := store.GetProject(project.ID); ok {
		t.Fatal("project should be deleted before restore")
	}

	invalidRestore := doJSON(t, app, http.MethodPost, "/api/admin/sqlite/backups/"+backup.ID+"/restore", map[string]any{
		"confirmation": "RESTORE wrong",
	}, "")
	if invalidRestore.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid restore confirmation, got %d %s", invalidRestore.Code, invalidRestore.Body)
	}

	restored := doJSON(t, app, http.MethodPost, "/api/admin/sqlite/backups/"+backup.ID+"/restore", map[string]any{
		"confirmation": "RESTORE " + backup.ID,
	}, "")
	if restored.Code != http.StatusOK {
		t.Fatalf("restore failed: %d %s", restored.Code, restored.Body)
	}
	if _, ok := store.GetProject(project.ID); !ok {
		t.Fatalf("project %s should exist after restore", project.ID)
	}

	download := doJSON(t, app, http.MethodGet, "/api/admin/sqlite/backups/"+backup.ID+"/download", nil, "")
	if download.Code != http.StatusOK || !strings.Contains(download.Body, "SQLite format") {
		t.Fatalf("download failed: %d %q", download.Code, download.Body[:minInt(len(download.Body), 80)])
	}

	listed := doJSON(t, app, http.MethodGet, "/api/admin/sqlite/backups", nil, "")
	if listed.Code != http.StatusOK || !strings.Contains(listed.Body, backup.ID) {
		t.Fatalf("list backups failed: %d %s", listed.Code, listed.Body)
	}

	deleted := doJSON(t, app, http.MethodDelete, "/api/admin/sqlite/backups/"+backup.ID, nil, "")
	if deleted.Code != http.StatusNoContent {
		t.Fatalf("delete backup failed: %d %s", deleted.Code, deleted.Body)
	}
}

func TestAdminAPIRequiresToken(t *testing.T) {
	app := newTestServer()
	req := httptest.NewRequest(http.MethodGet, "/api/admin/overview", nil)
	rr := httptest.NewRecorder()
	app.ServeHTTP(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d: %s", rr.Code, rr.Body.String())
	}
	if !strings.Contains(rr.Body.String(), "invalid_admin_token") {
		t.Fatalf("expected invalid_admin_token: %s", rr.Body.String())
	}
}

func TestAdminLoginAndUserManagement(t *testing.T) {
	app := newTestServer()
	login := doJSON(t, app, http.MethodPost, "/api/admin/auth/login", map[string]any{
		"identity": "admin@tokenhub.local",
		"password": "admin123456",
	}, "")
	if login.Code != http.StatusOK {
		t.Fatalf("expected login 200, got %d: %s", login.Code, login.Body)
	}
	var payload struct {
		Token string    `json:"token"`
		User  AdminUser `json:"user"`
	}
	if err := json.Unmarshal([]byte(login.Body), &payload); err != nil {
		t.Fatal(err)
	}
	if payload.Token == "" || payload.User.Email != "admin@tokenhub.local" {
		t.Fatalf("unexpected login payload: %s", login.Body)
	}

	users := doJSON(t, app, http.MethodGet, "/api/admin/users", nil, payload.Token)
	if users.Code != http.StatusOK {
		t.Fatalf("expected users 200, got %d: %s", users.Code, users.Body)
	}
	if !strings.Contains(users.Body, `"email":"admin@tokenhub.local"`) || strings.Contains(users.Body, "PasswordHash") {
		t.Fatalf("unexpected users payload: %s", users.Body)
	}
}

func TestRBACAndAdminAuditEvents(t *testing.T) {
	store := NewMemoryStore()
	if err := SeedDemoData(store); err != nil {
		t.Fatal(err)
	}
	viewer, err := store.CreateAdminUser(AdminUser{
		Username: "viewer",
		Name:     "Viewer",
		Email:    "viewer@tokenhub.local",
		Role:     "viewer",
		Status:   StatusActive,
	}, "viewer123456")
	if err != nil {
		t.Fatal(err)
	}
	_ = viewer
	app := New(store).Handler()

	login := doJSON(t, app, http.MethodPost, "/api/admin/auth/login", map[string]any{
		"identity": "viewer@tokenhub.local",
		"password": "viewer123456",
	}, "")
	var payload struct {
		Token string `json:"token"`
	}
	if err := json.Unmarshal([]byte(login.Body), &payload); err != nil {
		t.Fatal(err)
	}
	forbidden := doJSON(t, app, http.MethodPost, "/api/admin/providers", map[string]any{
		"name": "Forbidden Provider",
		"type": "mock",
	}, payload.Token)
	if forbidden.Code != http.StatusForbidden {
		t.Fatalf("viewer should not create provider, got %d: %s", forbidden.Code, forbidden.Body)
	}

	created := doJSON(t, app, http.MethodPost, "/api/admin/projects", map[string]any{"name": "Audited Project"}, "")
	if created.Code != http.StatusCreated {
		t.Fatalf("admin project create failed: %d %s", created.Code, created.Body)
	}
	audit := doJSON(t, app, http.MethodGet, "/api/admin/audit/events", nil, "")
	if audit.Code != http.StatusOK {
		t.Fatalf("audit events failed: %d %s", audit.Code, audit.Body)
	}
	if !strings.Contains(audit.Body, `"resource_type":"project"`) || !strings.Contains(audit.Body, `"action":"create"`) {
		t.Fatalf("expected project create audit event: %s", audit.Body)
	}
}

func TestUserRequestAuditIsScopedToOwnLogs(t *testing.T) {
	store := NewMemoryStore()
	user, err := store.CreateAdminUser(AdminUser{
		Username: "request-auditor",
		Name:     "Request Auditor",
		Email:    "request-auditor@tokenhub.local",
		Role:     "user",
		Status:   StatusActive,
	}, "user123456")
	if err != nil {
		t.Fatal(err)
	}
	otherUser, err := store.CreateAdminUser(AdminUser{
		Username: "other-request-auditor",
		Name:     "Other Request Auditor",
		Email:    "other-request-auditor@tokenhub.local",
		Role:     "user",
		Status:   StatusActive,
	}, "other123456")
	if err != nil {
		t.Fatal(err)
	}
	project := store.CreateProject(Project{Name: "User Audit Project", OwnerUserID: user.ID})
	otherProject := store.CreateProject(Project{Name: "Other Audit Project", OwnerUserID: otherUser.ID})
	key, _, err := store.CreateAPIKey(project.ID, APIKey{
		Name:     "user-owned-key",
		Status:   StatusActive,
		Metadata: map[string]string{"created_by": user.ID},
	}, "thk_user_audit")
	if err != nil {
		t.Fatal(err)
	}
	otherKey, _, err := store.CreateAPIKey(otherProject.ID, APIKey{
		Name:     "other-owned-key",
		Status:   StatusActive,
		Metadata: map[string]string{"created_by": otherUser.ID},
	}, "thk_other_audit")
	if err != nil {
		t.Fatal(err)
	}
	now := time.Now().UTC()
	if err := store.db.Create(&RequestLog{
		ID:         "log_user_visible",
		RequestID:  "req_user_visible",
		ProjectID:  project.ID,
		APIKeyID:   key.ID,
		ModelName:  "gpt-4.1-mini",
		StatusCode: http.StatusOK,
		LatencyMS:  120,
		CreatedAt:  now,
	}).Error; err != nil {
		t.Fatal(err)
	}
	if err := store.db.Create(&RequestLog{
		ID:         "log_other_hidden",
		RequestID:  "req_other_hidden",
		ProjectID:  otherProject.ID,
		APIKeyID:   otherKey.ID,
		ModelName:  "gpt-4.1-mini",
		StatusCode: http.StatusOK,
		LatencyMS:  95,
		CreatedAt:  now,
	}).Error; err != nil {
		t.Fatal(err)
	}
	if err := store.db.Create(&RequestPayloadLog{
		ID:           "payload_user_visible",
		RequestID:    "req_user_visible",
		RequestBody:  `{"model":"gpt-4.1-mini"}`,
		ResponseBody: `{"id":"chatcmpl_user"}`,
		CreatedAt:    now,
	}).Error; err != nil {
		t.Fatal(err)
	}
	app := New(store).Handler()

	login := doJSON(t, app, http.MethodPost, "/api/admin/auth/login", map[string]any{
		"identity": "request-auditor@tokenhub.local",
		"password": "user123456",
	}, "")
	var payload struct {
		Token string `json:"token"`
	}
	if err := json.Unmarshal([]byte(login.Body), &payload); err != nil {
		t.Fatal(err)
	}
	logs := doJSON(t, app, http.MethodGet, "/api/admin/audit/requests", nil, payload.Token)
	if logs.Code != http.StatusOK {
		t.Fatalf("expected user request audit 200, got %d: %s", logs.Code, logs.Body)
	}
	if !strings.Contains(logs.Body, "req_user_visible") || strings.Contains(logs.Body, "req_other_hidden") {
		t.Fatalf("request audit should only include user's logs: %s", logs.Body)
	}
	detail := doJSON(t, app, http.MethodGet, "/api/admin/audit/requests/req_user_visible", nil, payload.Token)
	if detail.Code != http.StatusOK || !strings.Contains(detail.Body, "chatcmpl_user") {
		t.Fatalf("expected own request detail, got %d: %s", detail.Code, detail.Body)
	}
	hiddenDetail := doJSON(t, app, http.MethodGet, "/api/admin/audit/requests/req_other_hidden", nil, payload.Token)
	if hiddenDetail.Code != http.StatusForbidden {
		t.Fatalf("expected hidden request detail 403, got %d: %s", hiddenDetail.Code, hiddenDetail.Body)
	}
	adminAudit := doJSON(t, app, http.MethodGet, "/api/admin/audit/events", nil, payload.Token)
	if adminAudit.Code != http.StatusForbidden {
		t.Fatalf("user should not read admin audit events, got %d: %s", adminAudit.Code, adminAudit.Body)
	}
}

func TestTeamLeaderUsageBreakdownIncludesMembers(t *testing.T) {
	store := NewMemoryStore()
	leader, err := store.CreateAdminUser(AdminUser{
		Username: "usage-leader",
		Name:     "Usage Leader",
		Email:    "usage-leader@tokenhub.local",
		Role:     "team_leader",
		TeamID:   "team_usage",
		Status:   StatusActive,
	}, "leader123456")
	if err != nil {
		t.Fatal(err)
	}
	memberA, err := store.CreateAdminUser(AdminUser{
		Username: "usage-member-a",
		Name:     "Usage Member A",
		Email:    "usage-member-a@tokenhub.local",
		Role:     "user",
		TeamID:   leader.TeamID,
		Status:   StatusActive,
	}, "member123456")
	if err != nil {
		t.Fatal(err)
	}
	memberB, err := store.CreateAdminUser(AdminUser{
		Username: "usage-member-b",
		Name:     "Usage Member B",
		Email:    "usage-member-b@tokenhub.local",
		Role:     "user",
		TeamID:   leader.TeamID,
		Status:   StatusActive,
	}, "member123456")
	if err != nil {
		t.Fatal(err)
	}
	otherMember, err := store.CreateAdminUser(AdminUser{
		Username: "usage-member-other",
		Name:     "Usage Member Other",
		Email:    "usage-member-other@tokenhub.local",
		Role:     "user",
		TeamID:   "team_other",
		Status:   StatusActive,
	}, "member123456")
	if err != nil {
		t.Fatal(err)
	}
	project := store.CreateProject(Project{Name: "Team Usage App", TeamID: leader.TeamID})
	otherProject := store.CreateProject(Project{Name: "Other Usage App", TeamID: otherMember.TeamID})
	keyA, _, err := store.CreateAPIKey(project.ID, APIKey{Name: "member-a-key", Status: StatusActive, Metadata: map[string]string{"created_by": memberA.ID}}, "thk_usage_member_a")
	if err != nil {
		t.Fatal(err)
	}
	keyB, _, err := store.CreateAPIKey(project.ID, APIKey{Name: "member-b-key", Status: StatusActive, Metadata: map[string]string{"created_by": memberB.ID}}, "thk_usage_member_b")
	if err != nil {
		t.Fatal(err)
	}
	otherKey, _, err := store.CreateAPIKey(otherProject.ID, APIKey{Name: "other-member-key", Status: StatusActive, Metadata: map[string]string{"created_by": otherMember.ID}}, "thk_usage_other")
	if err != nil {
		t.Fatal(err)
	}
	now := time.Now().UTC()
	records := []UsageRecord{
		{ID: "usage_member_a", RequestID: "req_member_a", ProjectID: project.ID, APIKeyID: keyA.ID, ModelName: "gpt-4.1-mini", TotalTokens: 100, CostUSD: 0.1, CreatedAt: now},
		{ID: "usage_member_b", RequestID: "req_member_b", ProjectID: project.ID, APIKeyID: keyB.ID, ModelName: "gpt-4.1-mini", TotalTokens: 250, CostUSD: 0.2, CreatedAt: now},
		{ID: "usage_other", RequestID: "req_other", ProjectID: otherProject.ID, APIKeyID: otherKey.ID, ModelName: "gpt-4.1-mini", TotalTokens: 999, CostUSD: 9.9, CreatedAt: now},
	}
	if err := store.db.Create(&records).Error; err != nil {
		t.Fatal(err)
	}
	app := New(store).Handler()

	login := doJSON(t, app, http.MethodPost, "/api/admin/auth/login", map[string]any{
		"identity": "usage-leader@tokenhub.local",
		"password": "leader123456",
	}, "")
	var payload struct {
		Token string `json:"token"`
	}
	if err := json.Unmarshal([]byte(login.Body), &payload); err != nil {
		t.Fatal(err)
	}
	resp := doJSON(t, app, http.MethodGet, "/api/admin/usage/breakdown", nil, payload.Token)
	if resp.Code != http.StatusOK {
		t.Fatalf("expected team leader usage breakdown, got %d: %s", resp.Code, resp.Body)
	}
	var breakdown struct {
		Members []struct {
			ID           string `json:"id"`
			RequestCount int64  `json:"request_count"`
			TotalTokens  int64  `json:"total_tokens"`
		} `json:"members"`
	}
	if err := json.Unmarshal([]byte(resp.Body), &breakdown); err != nil {
		t.Fatal(err)
	}
	totals := map[string]int64{}
	for _, row := range breakdown.Members {
		totals[row.ID] = row.TotalTokens
		if row.RequestCount != 1 {
			t.Fatalf("expected one request per member row, got %+v", row)
		}
	}
	if totals[memberA.ID] != 100 || totals[memberB.ID] != 250 {
		t.Fatalf("expected member totals for team members, got %+v", totals)
	}
	if _, ok := totals[otherMember.ID]; ok {
		t.Fatalf("other team member should not be included: %+v", totals)
	}
}

func TestAdminCreatesProviderModelAndRoute(t *testing.T) {
	app := newTestServer()

	providerResp := doJSON(t, app, http.MethodPost, "/api/admin/providers", map[string]any{
		"name":     "Local vLLM",
		"type":     "local",
		"base_url": "http://localhost:8000/v1",
		"status":   "active",
		"healthy":  true,
		"priority": 2,
	}, "")
	if providerResp.Code != http.StatusCreated {
		t.Fatalf("expected provider created, got %d: %s", providerResp.Code, providerResp.Body)
	}
	var providerPayload struct {
		Provider Provider `json:"provider"`
	}
	if err := json.Unmarshal([]byte(providerResp.Body), &providerPayload); err != nil {
		t.Fatal(err)
	}
	provider := providerPayload.Provider

	modelResp := doJSON(t, app, http.MethodPost, "/api/admin/models", map[string]any{
		"name":                    "local-coder",
		"family":                  "qwen",
		"modality":                "chat",
		"context_window":          32768,
		"input_price_usd_per_1m":  0.1,
		"output_price_usd_per_1m": 0.2,
	}, "")
	if modelResp.Code != http.StatusCreated {
		t.Fatalf("expected model created, got %d: %s", modelResp.Code, modelResp.Body)
	}

	routeResp := doJSON(t, app, http.MethodPost, "/api/admin/routing-rules", map[string]any{
		"model_name":     "local-coder",
		"provider_id":    provider.ID,
		"provider_model": "qwen2.5-coder",
		"priority":       1,
		"weight":         100,
		"status":         "active",
	}, "")
	if routeResp.Code != http.StatusCreated {
		t.Fatalf("expected route created, got %d: %s", routeResp.Code, routeResp.Body)
	}

	secondRouteResp := doJSON(t, app, http.MethodPost, "/api/admin/routing-rules", map[string]any{
		"model_name":     "local-coder",
		"provider_id":    provider.ID,
		"provider_model": "qwen2.5-coder-backup",
		"weight":         100,
		"status":         "active",
	}, "")
	if secondRouteResp.Code != http.StatusCreated {
		t.Fatalf("expected second route created, got %d: %s", secondRouteResp.Code, secondRouteResp.Body)
	}
	var secondRoute ModelRoute
	if err := json.Unmarshal([]byte(secondRouteResp.Body), &secondRoute); err != nil {
		t.Fatal(err)
	}
	if secondRoute.Priority != 2 {
		t.Fatalf("expected second route to append with priority 2, got %d: %s", secondRoute.Priority, secondRouteResp.Body)
	}

	routes := doJSON(t, app, http.MethodGet, "/api/admin/routing-rules", nil, "")
	if routes.Code != http.StatusOK {
		t.Fatalf("expected routes list, got %d: %s", routes.Code, routes.Body)
	}
	if !strings.Contains(routes.Body, "local-coder") || !strings.Contains(routes.Body, "qwen2.5-coder") {
		t.Fatalf("expected new route in list: %s", routes.Body)
	}
}

func TestAdminProviderCatalogAndTemplateRouteMapping(t *testing.T) {
	app := newTestServer()

	catalogResp := doJSON(t, app, http.MethodGet, "/api/admin/provider-catalog/openai", nil, "")
	if catalogResp.Code != http.StatusOK {
		t.Fatalf("expected openai catalog, got %d: %s", catalogResp.Code, catalogResp.Body)
	}
	if !strings.Contains(catalogResp.Body, `"gpt-5"`) || !strings.Contains(catalogResp.Body, `"category":"openai"`) {
		t.Fatalf("expected openai model details: %s", catalogResp.Body)
	}

	createResp := doJSON(t, app, http.MethodPost, "/api/admin/providers", map[string]any{
		"catalog_id":      "openai",
		"id":              "prv_openai_test",
		"name":            "OpenAI Test",
		"base_url":        "https://api.openai.com/v1",
		"status":          "active",
		"healthy":         true,
		"create_routes":   true,
		"selected_models": []string{"gpt-5"},
	}, "")
	if createResp.Code != http.StatusCreated {
		t.Fatalf("expected template provider created, got %d: %s", createResp.Code, createResp.Body)
	}
	var result ProviderCreateResult
	if err := json.Unmarshal([]byte(createResp.Body), &result); err != nil {
		t.Fatal(err)
	}
	if result.Provider.ID != "prv_openai_test" || result.CreatedRoutes != 1 {
		t.Fatalf("unexpected route result: %s", createResp.Body)
	}

	models := doJSON(t, app, http.MethodGet, "/api/admin/models", nil, "")
	if models.Code != http.StatusOK {
		t.Fatalf("expected models list, got %d: %s", models.Code, models.Body)
	}
	if !strings.Contains(models.Body, `"gpt-5"`) || !strings.Contains(models.Body, `"claude-sonnet-4.5"`) {
		t.Fatalf("expected default model catalog: %s", models.Body)
	}

	routes := doJSON(t, app, http.MethodGet, "/api/admin/routing-rules", nil, "")
	if routes.Code != http.StatusOK {
		t.Fatalf("expected routes list, got %d: %s", routes.Code, routes.Body)
	}
	if !strings.Contains(routes.Body, `"provider_id":"prv_openai_test"`) || !strings.Contains(routes.Body, `"model_name":"gpt-5"`) || !strings.Contains(routes.Body, `"provider_model":"gpt-5"`) {
		t.Fatalf("expected mapped route: %s", routes.Body)
	}

	autoResp := doJSON(t, app, http.MethodPost, "/api/admin/providers", map[string]any{
		"catalog_id":     "openai",
		"id":             "prv_openai_auto",
		"name":           "OpenAI Auto",
		"base_url":       "https://api.openai.com/v1",
		"status":         "active",
		"healthy":        true,
		"model_category": "openai",
	}, "")
	if autoResp.Code != http.StatusCreated {
		t.Fatalf("expected auto provider created, got %d: %s", autoResp.Code, autoResp.Body)
	}
	var autoResult ProviderCreateResult
	if err := json.Unmarshal([]byte(autoResp.Body), &autoResult); err != nil {
		t.Fatal(err)
	}
	if autoResult.CreatedRoutes < 2 {
		t.Fatalf("expected default openai routes, got %d: %s", autoResult.CreatedRoutes, autoResp.Body)
	}
	hasGPT5 := false
	for _, modelName := range autoResult.ModelNames {
		if modelName == "gpt-5" {
			hasGPT5 = true
			break
		}
	}
	if !hasGPT5 {
		t.Fatalf("expected auto-created gpt-5 route: %s", autoResp.Body)
	}
	routesAfterAuto := doJSON(t, app, http.MethodGet, "/api/admin/routing-rules", nil, "")
	if routesAfterAuto.Code != http.StatusOK {
		t.Fatalf("expected routes list after auto provider, got %d: %s", routesAfterAuto.Code, routesAfterAuto.Body)
	}
	var routeList struct {
		Data []ModelRoute `json:"data"`
	}
	if err := json.Unmarshal([]byte(routesAfterAuto.Body), &routeList); err != nil {
		t.Fatal(err)
	}
	gpt5Priorities := map[string]int{}
	for _, route := range routeList.Data {
		if route.ModelName == "gpt-5" {
			gpt5Priorities[route.ProviderID] = route.Priority
		}
	}
	if gpt5Priorities["prv_openai_test"] != 1 || gpt5Priorities["prv_openai_auto"] != 2 {
		t.Fatalf("expected gpt-5 provider routes to append by priority, got %#v", gpt5Priorities)
	}

	autoAgainResp := doJSON(t, app, http.MethodPost, "/api/admin/providers", map[string]any{
		"catalog_id":     "openai",
		"id":             "prv_openai_auto",
		"name":           "OpenAI Auto",
		"base_url":       "https://api.openai.com/v1",
		"status":         "active",
		"healthy":        true,
		"model_category": "openai",
	}, "")
	if autoAgainResp.Code != http.StatusCreated {
		t.Fatalf("expected idempotent auto provider create, got %d: %s", autoAgainResp.Code, autoAgainResp.Body)
	}
	var autoAgainResult ProviderCreateResult
	if err := json.Unmarshal([]byte(autoAgainResp.Body), &autoAgainResult); err != nil {
		t.Fatal(err)
	}
	if autoAgainResult.CreatedRoutes != 0 {
		t.Fatalf("expected existing routes to be preserved, got %d: %s", autoAgainResult.CreatedRoutes, autoAgainResp.Body)
	}

	off := false
	disabledReq := map[string]any{
		"catalog_id":     "openai",
		"id":             "prv_openai_no_routes",
		"name":           "OpenAI No Routes",
		"base_url":       "https://api.openai.com/v1",
		"status":         "active",
		"healthy":        true,
		"model_category": "openai",
		"create_routes":  off,
	}
	disabledResp := doJSON(t, app, http.MethodPost, "/api/admin/providers", disabledReq, "")
	if disabledResp.Code != http.StatusCreated {
		t.Fatalf("expected disabled auto provider created, got %d: %s", disabledResp.Code, disabledResp.Body)
	}
	var disabledResult ProviderCreateResult
	if err := json.Unmarshal([]byte(disabledResp.Body), &disabledResult); err != nil {
		t.Fatal(err)
	}
	if disabledResult.CreatedRoutes != 0 {
		t.Fatalf("expected no routes when create_routes is false: %s", disabledResp.Body)
	}
}

func TestProviderCatalogUsesStandardModelCategories(t *testing.T) {
	entries := []ProviderCatalogEntry{
		{
			ID: "mixed",
			Models: []ProviderCatalogModel{
				{ID: "deepseekv4", DisplayName: "DeepSeek V4"},
				{ID: "Phi-4-multimodal-instruct"},
				{ID: "agent-max-preview"},
			},
		},
	}

	categories, counts := catalogCategorySummary(entries[0].Models)
	joined := strings.Join(categories, ",")
	if joined != "custom,deepseek,microsoft" {
		t.Fatalf("expected standard categories, got %s", joined)
	}
	if counts["deepseek"] != 1 || counts["microsoft"] != 1 || counts["custom"] != 1 {
		t.Fatalf("unexpected standard category counts: %+v", counts)
	}
	if counts["agent"] != 0 || counts["phi"] != 0 {
		t.Fatalf("unexpected raw long-tail categories: %+v", counts)
	}
	if normalizeModelLookupName("DeepSeekV4") != "deepseek-v4" || normalizeModelLookupName("openai/gpt5") != "gpt-5" {
		t.Fatalf("expected compact provider model names to normalize")
	}
	if got := normalizeProviderBaseURL("302ai", "https://api.highwayapi.ai/openai"); got != "https://api.highwayapi.ai/openai/v1" {
		t.Fatalf("expected JieKou OpenAI-compatible base URL to include /v1, got %s", got)
	}
	if got := normalizeProviderBaseURL("dmxapi", "https://www.dmxapi.cn"); got != "https://www.dmxapi.cn/v1" {
		t.Fatalf("expected dmxapi OpenAI-compatible base URL to include /v1, got %s", got)
	}
}

func TestAdminCreatesProviderResource(t *testing.T) {
	app := newTestServer()

	resourceResp := doJSON(t, app, http.MethodPost, "/api/admin/provider-resources", map[string]any{
		"provider_id":     "prv_mock",
		"name":            "Mock Backup Resource",
		"resource_type":   "mock",
		"region":          "sg",
		"environment":     "backup",
		"status":          "active",
		"healthy":         true,
		"priority":        2,
		"weight":          80,
		"rate_limit_rpm":  600,
		"token_limit_tpm": 90000,
		"api_key":         "secret-resource-key",
	}, "")
	if resourceResp.Code != http.StatusCreated {
		t.Fatalf("expected provider resource created, got %d: %s", resourceResp.Code, resourceResp.Body)
	}
	if strings.Contains(resourceResp.Body, "secret-resource-key") {
		t.Fatalf("resource secret should not be returned: %s", resourceResp.Body)
	}
	var resource ProviderResource
	if err := json.Unmarshal([]byte(resourceResp.Body), &resource); err != nil {
		t.Fatal(err)
	}
	if resource.ID == "" || resource.ProviderID != "prv_mock" || resource.APIKey != "" {
		t.Fatalf("unexpected provider resource response: %s", resourceResp.Body)
	}

	resources := doJSON(t, app, http.MethodGet, "/api/admin/provider-resources", nil, "")
	if resources.Code != http.StatusOK {
		t.Fatalf("expected resources list, got %d: %s", resources.Code, resources.Body)
	}
	if !strings.Contains(resources.Body, "Mock Backup Resource") || strings.Contains(resources.Body, "secret-resource-key") {
		t.Fatalf("unexpected resources list: %s", resources.Body)
	}

	health := doJSON(t, app, http.MethodPost, "/api/admin/provider-resources/"+resource.ID+"/health", map[string]any{
		"healthy": false,
	}, "")
	if health.Code != http.StatusOK {
		t.Fatalf("expected resource health update, got %d: %s", health.Code, health.Body)
	}
	if !strings.Contains(health.Body, `"healthy":false`) {
		t.Fatalf("expected unhealthy resource: %s", health.Body)
	}
}

func TestProviderCredentialsAreEncryptedAndUsable(t *testing.T) {
	store := NewMemoryStore()
	project := store.CreateProject(Project{Name: "Encrypted Credentials App"})
	_, secret, err := store.CreateAPIKey(project.ID, APIKey{
		Name:    "encrypted-key",
		Allowed: []string{"gpt-4.1-mini"},
		Status:  StatusActive,
	}, "thk_encrypted")
	if err != nil {
		t.Fatal(err)
	}
	provider := store.AddProvider(Provider{
		ID:      "prv_encrypted",
		Name:    "Encrypted Provider",
		Type:    "capture",
		APIKey:  "provider-secret",
		Status:  StatusActive,
		Healthy: true,
	})
	resource, err := store.AddProviderResource(ProviderResource{
		ID:           "rsrc_encrypted",
		ProviderID:   provider.ID,
		Name:         "Encrypted Resource",
		ResourceType: "api_key",
		APIKey:       "resource-secret",
		Status:       StatusActive,
		Healthy:      true,
	})
	if err != nil {
		t.Fatal(err)
	}
	var persisted ProviderResource
	if err := store.db.First(&persisted, "id = ?", resource.ID).Error; err != nil {
		t.Fatal(err)
	}
	if persisted.APIKey == "resource-secret" || !strings.HasPrefix(persisted.APIKey, "enc:v1:") {
		t.Fatalf("resource secret should be stored encrypted, got %q", persisted.APIKey)
	}
	store.AddModel(Model{Name: "gpt-4.1-mini", Modality: "chat", Status: StatusActive})
	store.AddRoute(ModelRoute{
		ModelName:          "gpt-4.1-mini",
		ProviderID:         provider.ID,
		ProviderResourceID: resource.ID,
		ProviderModel:      "encrypted-chat",
		Status:             StatusActive,
	})
	adapter := &captureAdapter{}
	server := New(store)
	server.adapters["capture"] = adapter
	app := server.Handler()

	resp := doJSON(t, app, http.MethodPost, "/v1/chat/completions", map[string]any{
		"model": "gpt-4.1-mini",
		"messages": []map[string]any{
			{"role": "user", "content": "secret route"},
		},
	}, secret)
	if resp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.Code, resp.Body)
	}
	if adapter.seenKey != "resource-secret" {
		t.Fatalf("expected decrypted resource secret, got %q", adapter.seenKey)
	}
	if strings.Contains(resp.Body, "resource-secret") {
		t.Fatalf("secret should not be returned: %s", resp.Body)
	}
}

func TestProviderAndResourceTestEndpoints(t *testing.T) {
	app := newTestServer()
	provider := doJSON(t, app, http.MethodPost, "/api/admin/providers/prv_mock/test", nil, "")
	if provider.Code != http.StatusOK {
		t.Fatalf("expected provider test 200, got %d: %s", provider.Code, provider.Body)
	}
	if !strings.Contains(provider.Body, `"healthy":true`) {
		t.Fatalf("expected healthy provider response: %s", provider.Body)
	}

	resource := doJSON(t, app, http.MethodPost, "/api/admin/provider-resources/rsrc_mock_primary/test", nil, "")
	if resource.Code != http.StatusOK {
		t.Fatalf("expected resource test 200, got %d: %s", resource.Code, resource.Body)
	}
	if !strings.Contains(resource.Body, `"healthy":true`) || !strings.Contains(resource.Body, `"last_checked_at"`) {
		t.Fatalf("expected checked healthy resource: %s", resource.Body)
	}
}

func TestProviderResourceBulkOperations(t *testing.T) {
	store := NewMemoryStore()
	if err := SeedDemoData(store); err != nil {
		t.Fatal(err)
	}
	provider := store.AddProvider(Provider{Name: "Bulk Provider", Type: ProviderMock, Status: StatusActive, Healthy: true})
	resource, err := store.AddProviderResource(ProviderResource{
		Name:           "Bulk Resource",
		ProviderID:     provider.ID,
		ResourceType:   "api_key",
		Status:         StatusActive,
		Healthy:        true,
		RateLimitRPM:   1,
		TokenLimitTPM:  1,
		MaxConcurrency: 1,
	})
	if err != nil {
		t.Fatal(err)
	}
	store.FinishProviderResourceAttempt(resource.ID, false, Usage{})
	store.FinishProviderResourceAttempt(resource.ID, false, Usage{})
	store.FinishProviderResourceAttempt(resource.ID, false, Usage{})
	if err := store.CheckProviderResourceCapacity(resource.ID); AsHTTPError(err).Code != "provider_resource_cooling_down" {
		t.Fatalf("expected cooldown before clear_error, got %v", err)
	}
	app := New(store).Handler()

	disabled := doJSON(t, app, http.MethodPost, "/api/admin/provider-resources/bulk", map[string]any{
		"action": "disable",
		"ids":    []string{resource.ID},
	}, "")
	if disabled.Code != http.StatusOK || !strings.Contains(disabled.Body, `"success":1`) {
		t.Fatalf("disable failed: %d %s", disabled.Code, disabled.Body)
	}
	found := findResource(t, store, resource.ID)
	if found.Status != StatusDisabled || found.Healthy {
		t.Fatalf("expected disabled unhealthy resource, got %+v", found)
	}

	cleared := doJSON(t, app, http.MethodPost, "/api/admin/provider-resources/bulk", map[string]any{
		"action": "clear_error",
		"ids":    []string{resource.ID, resource.ID},
	}, "")
	if cleared.Code != http.StatusOK || !strings.Contains(cleared.Body, `"success":1`) {
		t.Fatalf("clear error failed: %d %s", cleared.Code, cleared.Body)
	}
	if err := store.CheckProviderResourceCapacity(resource.ID); err != nil {
		t.Fatalf("capacity should be available after clear_error: %v", err)
	}
	store.FinishProviderResourceAttempt(resource.ID, true, Usage{TotalTokens: 5})
	if err := store.CheckProviderResourceCapacity(resource.ID); AsHTTPError(err).Code != "provider_resource_rpm_exceeded" {
		t.Fatalf("expected rpm limit before reset, got %v", err)
	}
	reset := doJSON(t, app, http.MethodPost, "/api/admin/provider-resources/bulk", map[string]any{
		"action": "reset_usage",
		"ids":    []string{resource.ID},
	}, "")
	if reset.Code != http.StatusOK || !strings.Contains(reset.Body, `"success":1`) {
		t.Fatalf("reset usage failed: %d %s", reset.Code, reset.Body)
	}
	if err := store.CheckProviderResourceCapacity(resource.ID); err != nil {
		t.Fatalf("capacity should be available after reset_usage: %v", err)
	}
	store.FinishProviderResourceAttempt(resource.ID, true, Usage{})
}

func TestProviderResourceImport(t *testing.T) {
	store := NewMemoryStore()
	if err := SeedDemoData(store); err != nil {
		t.Fatal(err)
	}
	provider := store.AddProvider(Provider{Name: "Import Provider", Type: ProviderMock, Status: StatusActive, Healthy: true})
	app := New(store).Handler()

	resp := doJSON(t, app, http.MethodPost, "/api/admin/provider-resources/import", map[string]any{
		"resources": []map[string]any{
			{
				"provider_id":     provider.ID,
				"name":            "Imported Primary",
				"group":           "prod-east",
				"resource_type":   "api_key",
				"api_key":         "import-secret-1",
				"region":          "us-east-1",
				"environment":     "prod",
				"priority":        1,
				"weight":          80,
				"rate_limit_rpm":  120,
				"token_limit_tpm": 60000,
				"max_concurrency": 8,
			},
			{
				"provider_id": "missing-provider",
				"name":        "Broken Resource",
			},
		},
	}, "")
	if resp.Code != http.StatusMultiStatus || !strings.Contains(resp.Body, `"success":1`) || !strings.Contains(resp.Body, `"failed":1`) {
		t.Fatalf("expected partial import result, got %d %s", resp.Code, resp.Body)
	}
	if strings.Contains(resp.Body, "import-secret-1") {
		t.Fatalf("resource secret should not be returned: %s", resp.Body)
	}
	resources := store.ListProviderResources()
	var imported ProviderResource
	for _, item := range resources {
		if item.Name == "Imported Primary" {
			imported = item
			break
		}
	}
	if imported.ID == "" || imported.Group != "prod-east" || imported.RateLimitRPM != 120 || imported.APIKey != "" {
		t.Fatalf("expected imported resource with redacted key, got %+v", imported)
	}
}

func TestMonitorRunUpdatesResourceAndCreatesAlert(t *testing.T) {
	store := NewMemoryStore()
	if err := SeedDemoData(store); err != nil {
		t.Fatal(err)
	}
	monitor := store.CreateResource("monitors", AdminResource{
		Name:   "Mock resource monitor",
		Status: StatusActive,
		Fields: map[string]any{
			"target_type":          "resource",
			"provider_resource_id": "rsrc_mock_primary",
		},
	})
	app := New(store).Handler()

	okRun := doJSON(t, app, http.MethodPost, "/api/admin/resources/monitors/"+monitor.ID+"/run", map[string]any{}, "")
	if okRun.Code != http.StatusOK || !strings.Contains(okRun.Body, `"status":"ok"`) {
		t.Fatalf("monitor ok run failed: %d %s", okRun.Code, okRun.Body)
	}
	updated, err := store.UpdateProviderResource("rsrc_mock_primary", ProviderResource{Status: StatusDisabled, Healthy: false})
	if err != nil {
		t.Fatal(err)
	}
	if updated.Status != StatusDisabled {
		t.Fatalf("expected disabled resource before failed monitor, got %+v", updated)
	}
	failedRun := doJSON(t, app, http.MethodPost, "/api/admin/resources/monitors/"+monitor.ID+"/run", map[string]any{}, "")
	if failedRun.Code != http.StatusOK || !strings.Contains(failedRun.Body, `"status":"failed"`) || !strings.Contains(failedRun.Body, `"alert_id"`) {
		t.Fatalf("monitor failed run did not create alert: %d %s", failedRun.Code, failedRun.Body)
	}
	alerts := store.ListAlerts()
	if len(alerts) == 0 || alerts[0].Code != "monitor_check_failed" || alerts[0].ScopeID != monitor.ID {
		t.Fatalf("expected monitor alert, got %+v", alerts)
	}
	monitors := store.ListResources("monitors")
	var found AdminResource
	for _, item := range monitors {
		if item.ID == monitor.ID {
			found = item
			break
		}
	}
	if stringifyValueForTest(found.Fields["last_status"]) != "failed" || stringifyValueForTest(found.Fields["last_checked_at"]) == "" {
		t.Fatalf("monitor fields not updated: %+v", found.Fields)
	}
}

func TestMonitorRunInfersLegacyModelMonitor(t *testing.T) {
	store := NewMemoryStore()
	if err := SeedDemoData(store); err != nil {
		t.Fatal(err)
	}
	monitor := store.CreateResource("monitors", AdminResource{
		Name:   "Legacy model monitor",
		Status: StatusActive,
		Fields: map[string]any{
			"provider": "mock",
			"model":    "gpt-4.1-mini",
		},
	})
	app := New(store).Handler()

	run := doJSON(t, app, http.MethodPost, "/api/admin/resources/monitors/"+monitor.ID+"/run", map[string]any{}, "")
	if run.Code != http.StatusOK || !strings.Contains(run.Body, `"target_type":"model"`) || !strings.Contains(run.Body, `"status":"ok"`) {
		t.Fatalf("expected legacy monitor to run as model monitor, got %d %s", run.Code, run.Body)
	}
}

func TestDefaultMonitorsAreAutoDiscovered(t *testing.T) {
	store := NewMemoryStore()
	if err := BootstrapBaseData(store); err != nil {
		t.Fatal(err)
	}
	provider := store.AddProvider(Provider{
		ID:       "prv_health_default",
		Name:     "Health Default Provider",
		Type:     ProviderMock,
		Status:   StatusActive,
		Healthy:  true,
		Priority: 1,
	})
	resource, err := store.AddProviderResource(ProviderResource{
		ID:           "rsrc_health_default",
		ProviderID:   provider.ID,
		Name:         "Health Default Resource",
		ResourceType: "mock",
		Status:       StatusActive,
		Healthy:      true,
		Priority:     1,
		Weight:       100,
	})
	if err != nil {
		t.Fatal(err)
	}
	store.AddModel(Model{
		ID:       "health-default-model",
		Name:     "health-default-model",
		Family:   "test",
		Modality: "chat",
		Status:   StatusActive,
	})
	store.AddRoute(ModelRoute{
		ID:                 "route_health_default",
		ModelName:          "health-default-model",
		ProviderID:         provider.ID,
		ProviderResourceID: resource.ID,
		ProviderModel:      "health-default-upstream",
		Priority:           1,
		Weight:             100,
		Status:             StatusActive,
	})
	app := New(store).Handler()

	resp := doJSON(t, app, http.MethodGet, "/api/admin/resources/monitors", nil, "")
	if resp.Code != http.StatusOK {
		t.Fatalf("default monitor list failed: %d %s", resp.Code, resp.Body)
	}
	monitors := store.ListResources("monitors")
	if len(monitors) != 3 {
		t.Fatalf("expected provider/resource/model monitors, got %d: %+v", len(monitors), monitors)
	}
	found := map[string]bool{}
	for _, monitor := range monitors {
		key := monitorTargetKey(monitor.Fields)
		found[key] = true
		if stringifyValueForTest(monitor.Fields["managed_by"]) != "tokenhub_auto" {
			t.Fatalf("expected auto-managed monitor, got %+v", monitor.Fields)
		}
		if stringifyValueForTest(monitor.Fields["last_status"]) != "ok" || stringifyValueForTest(monitor.Fields["last_checked_at"]) == "" {
			t.Fatalf("expected monitor to run immediately, got %+v", monitor.Fields)
		}
	}
	for _, key := range []string{"provider:" + provider.ID, "resource:" + resource.ID, "model:health-default-model"} {
		if !found[key] {
			t.Fatalf("missing default monitor target %s in %+v", key, found)
		}
	}

	resp = doJSON(t, app, http.MethodGet, "/api/admin/resources/monitors", nil, "")
	if resp.Code != http.StatusOK {
		t.Fatalf("second default monitor list failed: %d %s", resp.Code, resp.Body)
	}
	if got := len(store.ListResources("monitors")); got != len(monitors) {
		t.Fatalf("default monitor discovery should be idempotent, before=%d after=%d", len(monitors), got)
	}
}

func TestDefaultAlertRulesAreAutoDiscovered(t *testing.T) {
	store := NewMemoryStore()
	app := New(store).Handler()

	resp := doJSON(t, app, http.MethodGet, "/api/admin/resources/alert-rules", nil, "")
	if resp.Code != http.StatusOK {
		t.Fatalf("default alert rule list failed: %d %s", resp.Code, resp.Body)
	}
	rules := store.ListResources("alert-rules")
	if len(rules) != 5 {
		t.Fatalf("expected default provider and quota alert rules, got %d: %+v", len(rules), rules)
	}
	found := map[string]bool{}
	for _, rule := range rules {
		key := alertRuleKey(rule.Fields)
		found[key] = true
		if stringifyValueForTest(rule.Fields["managed_by"]) != "tokenhub_auto" {
			t.Fatalf("expected auto-managed alert rule, got %+v", rule.Fields)
		}
		if stringifyValueForTest(rule.Fields["metric"]) == "" || stringifyValueForTest(rule.Fields["threshold"]) == "" {
			t.Fatalf("expected metric and threshold, got %+v", rule.Fields)
		}
	}
	for _, key := range []string{
		"provider_health_failed",
		"provider_resource_health_failed",
		"request_quota_near_limit",
		"token_quota_near_limit",
		"cost_quota_near_limit",
	} {
		if !found[key] {
			t.Fatalf("missing default alert rule %s in %+v", key, found)
		}
	}

	resp = doJSON(t, app, http.MethodGet, "/api/admin/resources/alert-rules", nil, "")
	if resp.Code != http.StatusOK {
		t.Fatalf("second default alert rule list failed: %d %s", resp.Code, resp.Body)
	}
	if got := len(store.ListResources("alert-rules")); got != len(rules) {
		t.Fatalf("default alert rule discovery should be idempotent, before=%d after=%d", len(rules), got)
	}
}

func TestProviderResourceCooldownAfterFailures(t *testing.T) {
	store, secret, resourceID := newResourceRoutedStore(t, "failing_resource")
	store.failureThreshold = 2
	server := New(store)
	server.adapters["failing_resource"] = failingAdapter{}
	app := server.Handler()

	for i := 0; i < 2; i++ {
		resp := doJSON(t, app, http.MethodPost, "/v1/chat/completions", map[string]any{
			"model": "gpt-4.1-mini",
			"messages": []map[string]any{
				{"role": "user", "content": "cooldown"},
			},
		}, secret)
		if resp.Code != http.StatusBadGateway {
			t.Fatalf("request %d expected 502 provider error, got %d: %s", i+1, resp.Code, resp.Body)
		}
	}

	resource := findResource(t, store, resourceID)
	if resource.FailureCount < 2 || resource.CooldownUntil == nil || resource.Healthy {
		t.Fatalf("expected resource in cooldown, got failures=%d healthy=%v cooldown=%v", resource.FailureCount, resource.Healthy, resource.CooldownUntil)
	}
	resp := doJSON(t, app, http.MethodPost, "/api/admin/provider-resources/"+resourceID+"/test", nil, "")
	if resp.Code != http.StatusOK {
		t.Fatalf("resource test should clear cooldown, got %d: %s", resp.Code, resp.Body)
	}
	resource = findResource(t, store, resourceID)
	if resource.FailureCount != 0 || resource.CooldownUntil != nil || !resource.Healthy {
		t.Fatalf("expected test to restore resource, got failures=%d healthy=%v cooldown=%v", resource.FailureCount, resource.Healthy, resource.CooldownUntil)
	}
}

func TestProviderResourceRPMLimit(t *testing.T) {
	store, secret, resourceID := newResourceRoutedStore(t, ProviderMock)
	if err := store.db.Model(&ProviderResource{}).Where("id = ?", resourceID).Update("rate_limit_rpm", 1).Error; err != nil {
		t.Fatal(err)
	}
	app := New(store).Handler()

	first := doJSON(t, app, http.MethodPost, "/v1/chat/completions", map[string]any{
		"model": "gpt-4.1-mini",
		"messages": []map[string]any{
			{"role": "user", "content": "first"},
		},
	}, secret)
	if first.Code != http.StatusOK {
		t.Fatalf("first request expected 200, got %d: %s", first.Code, first.Body)
	}
	second := doJSON(t, app, http.MethodPost, "/v1/chat/completions", map[string]any{
		"model": "gpt-4.1-mini",
		"messages": []map[string]any{
			{"role": "user", "content": "second"},
		},
	}, secret)
	if second.Code != http.StatusTooManyRequests || !strings.Contains(second.Body, "provider_resource_rpm_exceeded") {
		t.Fatalf("second request expected RPM limit, got %d: %s", second.Code, second.Body)
	}
}

func TestGatewayRoutesThroughProviderResource(t *testing.T) {
	store := NewMemoryStore()
	project := store.CreateProject(Project{Name: "Resource Routed App"})
	_, secret, err := store.CreateAPIKey(project.ID, APIKey{
		Name:    "resource-key",
		Allowed: []string{"gpt-4.1-mini"},
		Status:  StatusActive,
	}, "thk_resource_route")
	if err != nil {
		t.Fatal(err)
	}
	provider := store.AddProvider(Provider{ID: "prv_resource", Name: "Resource Provider", Type: ProviderMock, Status: StatusActive, Healthy: true})
	resource, err := store.AddProviderResource(ProviderResource{
		ID:           "rsrc_primary",
		ProviderID:   provider.ID,
		Name:         "Primary Resource",
		ResourceType: "mock",
		Status:       StatusActive,
		Healthy:      true,
		Priority:     1,
		Weight:       100,
	})
	if err != nil {
		t.Fatal(err)
	}
	store.AddModel(Model{Name: "gpt-4.1-mini", Modality: "chat", Status: StatusActive})
	store.AddRoute(ModelRoute{
		ID:                 "route_resource",
		ModelName:          "gpt-4.1-mini",
		ProviderID:         provider.ID,
		ProviderResourceID: resource.ID,
		ProviderModel:      "resource-chat",
		Priority:           1,
		Weight:             100,
		Status:             StatusActive,
	})
	app := New(store).Handler()

	resp := doJSON(t, app, http.MethodPost, "/v1/chat/completions", map[string]any{
		"model": "gpt-4.1-mini",
		"messages": []map[string]any{
			{"role": "user", "content": "resource hit"},
		},
	}, secret)
	if resp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.Code, resp.Body)
	}

	logs := store.ListRequestLogs()
	if len(logs) != 1 {
		t.Fatalf("expected one request log, got %d", len(logs))
	}
	if logs[0].ProviderID != provider.ID || logs[0].ProviderResourceID != resource.ID {
		t.Fatalf("expected provider resource audit log, got provider=%s resource=%s", logs[0].ProviderID, logs[0].ProviderResourceID)
	}
	resources := store.ListProviderResources()
	var touched bool
	for _, item := range resources {
		if item.ID == resource.ID && item.LastUsedAt != nil {
			touched = true
		}
	}
	if !touched {
		t.Fatalf("provider resource should be marked last used")
	}
}

func TestProviderHealthAffectsRouting(t *testing.T) {
	app := newTestServer()
	health := doJSON(t, app, http.MethodPost, "/api/admin/providers/prv_mock/health", map[string]any{
		"healthy": false,
	}, "")
	if health.Code != http.StatusOK {
		t.Fatalf("expected health update, got %d: %s", health.Code, health.Body)
	}

	resp := doJSON(t, app, http.MethodPost, "/v1/chat/completions", map[string]any{
		"model": "gpt-4.1-mini",
		"messages": []map[string]any{
			{"role": "user", "content": "hello"},
		},
	}, "thk_demo_local")
	if resp.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503, got %d: %s", resp.Code, resp.Body)
	}
	if !strings.Contains(resp.Body, "provider_unavailable") {
		t.Fatalf("expected provider_unavailable: %s", resp.Body)
	}
}

func TestGatewayFailoverUsesBackupRoute(t *testing.T) {
	store := NewMemoryStore()
	project := store.CreateProject(Project{Name: "Failover App"})
	_, secret, err := store.CreateAPIKey(project.ID, APIKey{
		Name:    "failover-key",
		Allowed: []string{"gpt-4.1-mini"},
		Status:  StatusActive,
	}, "thk_failover")
	if err != nil {
		t.Fatal(err)
	}
	failing := store.AddProvider(Provider{ID: "prv_failing", Name: "Failing", Type: "failing_mock", Status: StatusActive, Healthy: true})
	backup := store.AddProvider(Provider{ID: "prv_backup", Name: "Backup", Type: ProviderMock, Status: StatusActive, Healthy: true})
	store.AddModel(Model{Name: "gpt-4.1-mini", Modality: "chat", Status: StatusActive})
	store.AddRoute(ModelRoute{ID: "route_failing", ModelName: "gpt-4.1-mini", ProviderID: failing.ID, ProviderModel: "failing-chat", Priority: 1, Weight: 100, Status: StatusActive, Strategy: "priority_only"})
	store.AddRoute(ModelRoute{ID: "route_backup", ModelName: "gpt-4.1-mini", ProviderID: backup.ID, ProviderModel: "backup-chat", Priority: 2, Weight: 100, Status: StatusActive, Strategy: "priority_only"})

	server := New(store)
	server.adapters["failing_mock"] = failingAdapter{}
	app := server.Handler()

	resp := doJSON(t, app, http.MethodPost, "/v1/chat/completions", map[string]any{
		"model": "gpt-4.1-mini",
		"messages": []map[string]any{
			{"role": "user", "content": "fail over please"},
		},
	}, secret)
	if resp.Code != http.StatusOK {
		t.Fatalf("expected failover success, got %d: %s", resp.Code, resp.Body)
	}
	if !strings.Contains(resp.Body, "Echo: fail over please") {
		t.Fatalf("expected backup mock response: %s", resp.Body)
	}

	logs := store.ListRequestLogs()
	if len(logs) != 1 {
		t.Fatalf("expected one request log, got %d", len(logs))
	}
	if logs[0].ProviderID != backup.ID || logs[0].ProviderModel != "backup-chat" {
		t.Fatalf("expected backup route audit log, got provider=%s model=%s", logs[0].ProviderID, logs[0].ProviderModel)
	}
	routes := store.ListRoutes()
	var backupTouched bool
	for _, route := range routes {
		if route.ID == "route_backup" && route.LastUsedAt != nil {
			backupTouched = true
		}
		if route.ID == "route_failing" && route.LastUsedAt != nil {
			t.Fatalf("failing route should not be marked last used")
		}
	}
	if !backupTouched {
		t.Fatalf("backup route should be marked last used")
	}

	detail := doJSON(t, app, http.MethodGet, "/api/admin/audit/requests/"+logs[0].RequestID, nil, "")
	if detail.Code != http.StatusOK {
		t.Fatalf("request detail failed: %d %s", detail.Code, detail.Body)
	}
	if !strings.Contains(detail.Body, `"attempts"`) || !strings.Contains(detail.Body, `"route_failing"`) || !strings.Contains(detail.Body, `"route_backup"`) {
		t.Fatalf("expected route attempts in detail: %s", detail.Body)
	}
}

func TestModelRouterStrategiesRankCandidates(t *testing.T) {
	store := NewMemoryStore()
	project := store.CreateProject(Project{Name: "Router Strategy App"})
	key := APIKey{ID: "key_router_strategy", ProjectID: project.ID, Name: "router-key", Status: StatusActive}
	model := Model{Name: "gpt-4.1-mini", Modality: "chat", Status: StatusActive}
	call := CallContext{RequestID: "req_router_strategy", Project: project, Key: key, Model: model}
	fast := store.AddProvider(Provider{ID: "prv_fast", Name: "Fast", Type: ProviderMock, Status: StatusActive, Healthy: true})
	cheap := store.AddProvider(Provider{ID: "prv_cheap", Name: "Cheap", Type: ProviderMock, Status: StatusActive, Healthy: true})
	quality := store.AddProvider(Provider{ID: "prv_quality", Name: "Quality", Type: ProviderMock, Status: StatusActive, Healthy: true})
	store.AddModel(model)
	store.AddRoute(ModelRoute{ID: "route_fast", ModelName: model.Name, ProviderID: fast.ID, ProviderModel: "fast-chat", Priority: 1, Weight: 100, QualityScore: 50, CostScore: 50, Status: StatusActive, Strategy: RouteStrategyQuality})
	store.AddRoute(ModelRoute{ID: "route_cheap", ModelName: model.Name, ProviderID: cheap.ID, ProviderModel: "cheap-chat", Priority: 1, Weight: 80, QualityScore: 40, CostScore: 95, Status: StatusActive, Strategy: RouteStrategyQuality})
	store.AddRoute(ModelRoute{ID: "route_quality", ModelName: model.Name, ProviderID: quality.ID, ProviderModel: "quality-chat", Priority: 1, Weight: 60, QualityScore: 95, CostScore: 35, Status: StatusActive, Strategy: RouteStrategyQuality})

	server := New(store)
	candidates, err := store.SelectRouteCandidates(model.Name)
	if err != nil {
		t.Fatal(err)
	}
	planned := server.planRouteOrder(call, candidates)
	if planned[0].Route.ID != "route_quality" {
		t.Fatalf("quality strategy should pick highest quality first, got %s", planned[0].Route.ID)
	}

	for _, route := range store.ListRoutes() {
		route.Strategy = RouteStrategyCost
		if _, err := store.UpdateRoute(route.ID, route); err != nil {
			t.Fatal(err)
		}
	}
	candidates, err = store.SelectRouteCandidates(model.Name)
	if err != nil {
		t.Fatal(err)
	}
	planned = server.planRouteOrder(call, candidates)
	if planned[0].Route.ID != "route_cheap" {
		t.Fatalf("cost strategy should pick highest cost score first, got %s", planned[0].Route.ID)
	}
}

func TestHealth(t *testing.T) {
	app := newTestServer()
	resp := doJSON(t, app, http.MethodGet, "/healthz", nil, "")
	if resp.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", resp.Code, resp.Body)
	}
}

func newTestServer() http.Handler {
	store := NewMemoryStore()
	if err := SeedDemoData(store); err != nil {
		panic(err)
	}
	return New(store).Handler()
}

type responseBody struct {
	Code int
	Body string
}

func doJSON(t *testing.T, handler http.Handler, method string, path string, payload any, token string) responseBody {
	t.Helper()
	var body io.Reader
	if payload != nil {
		data, err := json.Marshal(payload)
		if err != nil {
			t.Fatal(err)
		}
		body = bytes.NewReader(data)
	}
	req := httptest.NewRequest(method, path, body)
	if payload != nil {
		req.Header.Set("content-type", "application/json")
	}
	if token == "" && strings.HasPrefix(path, "/api/admin") {
		token = "dev_admin_token"
	}
	if token != "" {
		req.Header.Set("authorization", "Bearer "+token)
	}
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	return responseBody{Code: rr.Code, Body: rr.Body.String()}
}

func minInt(a int, b int) int {
	if a < b {
		return a
	}
	return b
}

func stringifyValueForTest(value any) string {
	if value == nil {
		return ""
	}
	if text, ok := value.(string); ok {
		return text
	}
	data, _ := json.Marshal(value)
	return strings.Trim(string(data), `"`)
}

func newResourceRoutedStore(t *testing.T, providerType string) (*GormStore, string, string) {
	t.Helper()
	store := NewMemoryStore()
	project := store.CreateProject(Project{Name: "Resource Ops App"})
	_, secret, err := store.CreateAPIKey(project.ID, APIKey{
		Name:    "resource-ops-key",
		Allowed: []string{"gpt-4.1-mini"},
		Status:  StatusActive,
	}, "thk_resource_ops_"+providerType)
	if err != nil {
		t.Fatal(err)
	}
	provider := store.AddProvider(Provider{ID: "prv_" + providerType, Name: "Resource Ops Provider", Type: providerType, Status: StatusActive, Healthy: true})
	resource, err := store.AddProviderResource(ProviderResource{
		ID:             "rsrc_" + providerType,
		ProviderID:     provider.ID,
		Name:           "Resource Ops Instance",
		ResourceType:   "mock",
		Status:         StatusActive,
		Healthy:        true,
		Priority:       1,
		Weight:         100,
		RateLimitRPM:   0,
		TokenLimitTPM:  100000,
		MaxConcurrency: 10,
	})
	if err != nil {
		t.Fatal(err)
	}
	store.AddModel(Model{Name: "gpt-4.1-mini", Modality: "chat", Status: StatusActive})
	store.AddRoute(ModelRoute{
		ModelName:          "gpt-4.1-mini",
		ProviderID:         provider.ID,
		ProviderResourceID: resource.ID,
		ProviderModel:      "resource-ops-chat",
		Priority:           1,
		Weight:             100,
		Status:             StatusActive,
		Strategy:           "priority_only",
	})
	return store, secret, resource.ID
}

func findResource(t *testing.T, store *GormStore, id string) ProviderResource {
	t.Helper()
	for _, resource := range store.ListProviderResources() {
		if resource.ID == id {
			return resource
		}
	}
	t.Fatalf("resource %s not found", id)
	return ProviderResource{}
}

type captureAdapter struct {
	seenKey string
}

func (a *captureAdapter) Chat(ctx context.Context, provider Provider, providerModel string, req ChatCompletionRequest) (any, Usage, error) {
	a.seenKey = provider.APIKey
	return MockAdapter{}.Chat(ctx, provider, providerModel, req)
}

func (a *captureAdapter) ChatStream(ctx context.Context, provider Provider, providerModel string, req ChatCompletionRequest, w io.Writer) (Usage, error) {
	a.seenKey = provider.APIKey
	return MockAdapter{}.ChatStream(ctx, provider, providerModel, req, w)
}

func (a *captureAdapter) Responses(ctx context.Context, provider Provider, providerModel string, req ResponsesRequest) (any, Usage, error) {
	a.seenKey = provider.APIKey
	return MockAdapter{}.Responses(ctx, provider, providerModel, req)
}

func (a *captureAdapter) Embeddings(ctx context.Context, provider Provider, providerModel string, req EmbeddingsRequest) (any, Usage, error) {
	a.seenKey = provider.APIKey
	return MockAdapter{}.Embeddings(ctx, provider, providerModel, req)
}

type failingAdapter struct{}

func (a failingAdapter) Chat(ctx context.Context, provider Provider, providerModel string, req ChatCompletionRequest) (any, Usage, error) {
	return nil, Usage{}, NewHTTPError(http.StatusBadGateway, "provider_error", "upstream failed")
}

func (a failingAdapter) ChatStream(ctx context.Context, provider Provider, providerModel string, req ChatCompletionRequest, w io.Writer) (Usage, error) {
	return Usage{}, NewHTTPError(http.StatusBadGateway, "provider_error", "upstream failed")
}

func (a failingAdapter) Responses(ctx context.Context, provider Provider, providerModel string, req ResponsesRequest) (any, Usage, error) {
	return nil, Usage{}, NewHTTPError(http.StatusBadGateway, "provider_error", "upstream failed")
}

func (a failingAdapter) Embeddings(ctx context.Context, provider Provider, providerModel string, req EmbeddingsRequest) (any, Usage, error) {
	return nil, Usage{}, NewHTTPError(http.StatusBadGateway, "provider_error", "upstream failed")
}
