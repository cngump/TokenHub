package server

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
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
	var provider Provider
	if err := json.Unmarshal([]byte(providerResp.Body), &provider); err != nil {
		t.Fatal(err)
	}

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

	routes := doJSON(t, app, http.MethodGet, "/api/admin/routing-rules", nil, "")
	if routes.Code != http.StatusOK {
		t.Fatalf("expected routes list, got %d: %s", routes.Code, routes.Body)
	}
	if !strings.Contains(routes.Body, "local-coder") || !strings.Contains(routes.Body, "qwen2.5-coder") {
		t.Fatalf("expected new route in list: %s", routes.Body)
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
