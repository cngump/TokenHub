package server

import (
	"encoding/json"
	"hash/fnv"
	"io"
	"net"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"
)

type Server struct {
	store    Store
	adapters map[string]ProviderAdapter
	mux      *http.ServeMux
	config   Config
}

func New(store Store) *Server {
	return NewWithConfig(store, Config{AdminToken: "dev_admin_token"})
}

func NewWithConfig(store Store, config Config) *Server {
	client := &http.Client{Timeout: 120 * time.Second}
	openai := OpenAICompatibleAdapter{Client: client}
	s := &Server{
		store: store,
		adapters: map[string]ProviderAdapter{
			ProviderMock:             MockAdapter{},
			ProviderOpenAI:           openai,
			ProviderOpenAICompatible: openai,
			"deepseek":               openai,
			"qwen":                   openai,
			"local":                  openai,
			ProviderAzureOpenAI:      AzureOpenAIAdapter{Client: client},
			ProviderAnthropic:        AnthropicAdapter{Client: client},
			ProviderGemini:           GeminiAdapter{Client: client},
		},
		mux:    http.NewServeMux(),
		config: config,
	}
	s.routes()
	return s
}

func (s *Server) Handler() http.Handler {
	return cors(s.mux)
}

func (s *Server) routes() {
	s.mux.HandleFunc("/healthz", s.handleHealth)
	s.mux.HandleFunc("/v1/models", s.handleModels)
	s.mux.HandleFunc("/v1/chat/completions", s.handleChatCompletions)
	s.mux.HandleFunc("/v1/responses", s.handleResponses)
	s.mux.HandleFunc("/v1/embeddings", s.handleEmbeddings)

	s.mux.HandleFunc("/api/admin/auth/login", s.handleAdminLogin)
	s.mux.HandleFunc("/api/admin/auth/logout", s.handleAdminLogout)
	s.mux.HandleFunc("/api/admin/auth/me", s.handleAdminMe)
	s.mux.HandleFunc("/api/admin/overview", s.handleAdminOverview)
	s.mux.HandleFunc("/api/admin/projects", s.handleAdminProjects)
	s.mux.HandleFunc("/api/admin/projects/", s.handleAdminProjectNested)
	s.mux.HandleFunc("/api/admin/users", s.handleAdminUsers)
	s.mux.HandleFunc("/api/admin/users/", s.handleAdminUserItem)
	s.mux.HandleFunc("/api/admin/api-keys", s.handleAdminAPIKeys)
	s.mux.HandleFunc("/api/admin/api-keys/", s.handleAdminAPIKeyItem)
	s.mux.HandleFunc("/api/admin/providers", s.handleAdminProviders)
	s.mux.HandleFunc("/api/admin/providers/", s.handleAdminProviderNested)
	s.mux.HandleFunc("/api/admin/models", s.handleAdminModels)
	s.mux.HandleFunc("/api/admin/models/", s.handleAdminModelItem)
	s.mux.HandleFunc("/api/admin/routing-rules", s.handleAdminRoutes)
	s.mux.HandleFunc("/api/admin/routing-rules/", s.handleAdminRouteItem)
	s.mux.HandleFunc("/api/admin/resources/", s.handleAdminResources)
	s.mux.HandleFunc("/api/admin/usage/summary", s.handleAdminUsageSummary)
	s.mux.HandleFunc("/api/admin/usage/breakdown", s.handleAdminUsageBreakdown)
	s.mux.HandleFunc("/api/admin/usage/timeseries", s.handleAdminUsageTimeseries)
	s.mux.HandleFunc("/api/admin/audit/requests", s.handleAdminRequestLogs)
	s.mux.HandleFunc("/api/admin/alerts", s.handleAdminAlerts)
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"status": "ok", "service": "tokenhub-backend"})
}

func (s *Server) handleModels(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	_, key, err := s.authenticate(r)
	if err != nil {
		writeError(w, r, err)
		return
	}
	models := s.store.AccessibleModels(key)
	data := make([]map[string]any, 0, len(models))
	for _, model := range models {
		data = append(data, map[string]any{
			"id":       model.Name,
			"object":   "model",
			"owned_by": "tokenhub",
		})
	}
	writeJSON(w, http.StatusOK, map[string]any{"object": "list", "data": data})
}

func (s *Server) handleChatCompletions(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	project, key, err := s.authenticate(r)
	if err != nil {
		writeError(w, r, err)
		return
	}
	var req ChatCompletionRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
		return
	}
	if req.Model == "" {
		writeError(w, r, NewHTTPError(400, "missing_model", "model is required"))
		return
	}

	routed, ok := s.startRoutedCall(w, r, project, key, req.Model)
	if !ok {
		return
	}

	if req.Stream {
		route := routed.Routes[0]
		adapter, err := s.adapterForRoute(route)
		if err != nil {
			httpErr := AsHTTPError(err)
			s.store.FinishCall(routed.Call, route, Usage{}, httpErr.Status, httpErr.Code, clientIP(r), r.UserAgent())
			writeError(w, r, err)
			return
		}
		w.Header().Set("content-type", "text/event-stream")
		w.Header().Set("cache-control", "no-cache")
		w.Header().Set("x-request-id", routed.Call.RequestID)
		s.writeRouteHeaders(w, routed.Call, route, 1)
		usage, err := adapter.ChatStream(r.Context(), route.Provider, route.ProviderModel, req, w)
		status, code := statusAndCode(err)
		if err == nil {
			s.store.MarkRouteUsed(route.Route.ID)
		}
		s.store.FinishCall(routed.Call, route, usage, status, code, clientIP(r), r.UserAgent())
		return
	}

	resp, route, usage, attempts, err := s.executeRoutedChat(r, routed, req)
	if err != nil {
		s.finishFailedRoutedCall(r, routed, attempts, err)
		writeError(w, r, err)
		return
	}
	s.store.MarkRouteUsed(route.Route.ID)
	s.store.FinishCall(routed.Call, route, usage, http.StatusOK, "", clientIP(r), r.UserAgent())
	w.Header().Set("x-request-id", routed.Call.RequestID)
	s.writeRouteHeaders(w, routed.Call, route, len(attempts))
	writeJSON(w, http.StatusOK, resp)
}

func (s *Server) handleResponses(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	project, key, err := s.authenticate(r)
	if err != nil {
		writeError(w, r, err)
		return
	}
	var req ResponsesRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
		return
	}
	if req.Model == "" {
		writeError(w, r, NewHTTPError(400, "missing_model", "model is required"))
		return
	}
	routed, ok := s.startRoutedCall(w, r, project, key, req.Model)
	if !ok {
		return
	}
	resp, route, usage, attempts, err := s.executeRoutedResponses(r, routed, req)
	if err != nil {
		s.finishFailedRoutedCall(r, routed, attempts, err)
		writeError(w, r, err)
		return
	}
	s.store.MarkRouteUsed(route.Route.ID)
	s.store.FinishCall(routed.Call, route, usage, http.StatusOK, "", clientIP(r), r.UserAgent())
	w.Header().Set("x-request-id", routed.Call.RequestID)
	s.writeRouteHeaders(w, routed.Call, route, len(attempts))
	writeJSON(w, http.StatusOK, resp)
}

func (s *Server) handleEmbeddings(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	project, key, err := s.authenticate(r)
	if err != nil {
		writeError(w, r, err)
		return
	}
	var req EmbeddingsRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
		return
	}
	if req.Model == "" {
		writeError(w, r, NewHTTPError(400, "missing_model", "model is required"))
		return
	}
	routed, ok := s.startRoutedCall(w, r, project, key, req.Model)
	if !ok {
		return
	}
	resp, route, usage, attempts, err := s.executeRoutedEmbeddings(r, routed, req)
	if err != nil {
		s.finishFailedRoutedCall(r, routed, attempts, err)
		writeError(w, r, err)
		return
	}
	s.store.MarkRouteUsed(route.Route.ID)
	s.store.FinishCall(routed.Call, route, usage, http.StatusOK, "", clientIP(r), r.UserAgent())
	w.Header().Set("x-request-id", routed.Call.RequestID)
	s.writeRouteHeaders(w, routed.Call, route, len(attempts))
	writeJSON(w, http.StatusOK, resp)
}

func (s *Server) startRoutedCall(w http.ResponseWriter, r *http.Request, project Project, key APIKey, model string) (RoutedCall, bool) {
	call, err := s.store.StartCall(project, key, model)
	if err != nil {
		httpErr := AsHTTPError(err)
		s.store.RecordRejectedRequest(project, key, model, httpErr.Status, httpErr.Code, clientIP(r), r.UserAgent())
		writeError(w, r, err)
		return RoutedCall{}, false
	}
	routes, err := s.store.SelectRouteCandidates(model)
	if err != nil {
		httpErr := AsHTTPError(err)
		s.store.FinishCall(call, RouteSelection{}, Usage{}, httpErr.Status, httpErr.Code, clientIP(r), r.UserAgent())
		writeError(w, r, err)
		return RoutedCall{}, false
	}
	return RoutedCall{Call: call, Routes: s.planRouteOrder(call.RequestID, routes)}, true
}

func (s *Server) executeRoutedChat(r *http.Request, routed RoutedCall, req ChatCompletionRequest) (any, RouteSelection, Usage, []RouteAttempt, error) {
	return executeRouted(routed, func(route RouteSelection) (any, Usage, error) {
		adapter, err := s.adapterForRoute(route)
		if err != nil {
			return nil, Usage{}, err
		}
		return adapter.Chat(r.Context(), route.Provider, route.ProviderModel, req)
	})
}

func (s *Server) executeRoutedResponses(r *http.Request, routed RoutedCall, req ResponsesRequest) (any, RouteSelection, Usage, []RouteAttempt, error) {
	return executeRouted(routed, func(route RouteSelection) (any, Usage, error) {
		adapter, err := s.adapterForRoute(route)
		if err != nil {
			return nil, Usage{}, err
		}
		return adapter.Responses(r.Context(), route.Provider, route.ProviderModel, req)
	})
}

func (s *Server) executeRoutedEmbeddings(r *http.Request, routed RoutedCall, req EmbeddingsRequest) (any, RouteSelection, Usage, []RouteAttempt, error) {
	return executeRouted(routed, func(route RouteSelection) (any, Usage, error) {
		adapter, err := s.adapterForRoute(route)
		if err != nil {
			return nil, Usage{}, err
		}
		return adapter.Embeddings(r.Context(), route.Provider, route.ProviderModel, req)
	})
}

func executeRouted[T any](routed RoutedCall, call func(RouteSelection) (T, Usage, error)) (T, RouteSelection, Usage, []RouteAttempt, error) {
	var zero T
	var lastErr error = ErrProviderMissing
	attempts := make([]RouteAttempt, 0, len(routed.Routes))
	for _, route := range routed.Routes {
		resp, usage, err := call(route)
		status, code := statusAndCode(err)
		attempts = append(attempts, RouteAttempt{
			Selection: route,
			Status:    status,
			ErrorCode: code,
			Error:     errorMessage(err),
		})
		if err == nil {
			return resp, route, usage, attempts, nil
		}
		lastErr = err
		if !shouldFailoverProviderError(err) {
			return zero, route, usage, attempts, err
		}
	}
	return zero, RouteSelection{}, Usage{}, attempts, lastErr
}

func (s *Server) finishFailedRoutedCall(r *http.Request, routed RoutedCall, attempts []RouteAttempt, err error) {
	httpErr := AsHTTPError(err)
	route := lastAttemptRoute(attempts)
	s.store.FinishCall(routed.Call, route, Usage{}, httpErr.Status, httpErr.Code, clientIP(r), r.UserAgent())
}

func (s *Server) adapterForRoute(route RouteSelection) (ProviderAdapter, error) {
	adapter, ok := s.adapters[route.Provider.Type]
	if !ok {
		return nil, NewHTTPError(503, "provider_adapter_missing", "Provider adapter is not registered")
	}
	return adapter, nil
}

func (s *Server) planRouteOrder(requestID string, routes []RouteSelection) []RouteSelection {
	ordered := append([]RouteSelection(nil), routes...)
	sort.SliceStable(ordered, func(i, j int) bool {
		if ordered[i].Route.Priority != ordered[j].Route.Priority {
			return ordered[i].Route.Priority < ordered[j].Route.Priority
		}
		if routeWeight(ordered[i].Route) != routeWeight(ordered[j].Route) {
			return routeWeight(ordered[i].Route) > routeWeight(ordered[j].Route)
		}
		return ordered[i].Route.ID < ordered[j].Route.ID
	})

	var planned []RouteSelection
	for len(ordered) > 0 {
		priority := ordered[0].Route.Priority
		end := 0
		for end < len(ordered) && ordered[end].Route.Priority == priority {
			end++
		}
		group := append([]RouteSelection(nil), ordered[:end]...)
		if routeStrategy(group[0].Route) == "priority_only" {
			planned = append(planned, group...)
			ordered = ordered[end:]
			continue
		}
		for len(group) > 0 {
			index := weightedRouteIndex(requestID, len(planned), group)
			planned = append(planned, group[index])
			group = append(group[:index], group[index+1:]...)
		}
		ordered = ordered[end:]
	}
	return planned
}

func weightedRouteIndex(requestID string, salt int, routes []RouteSelection) int {
	if len(routes) <= 1 {
		return 0
	}
	total := 0
	for _, route := range routes {
		total += routeWeight(route.Route)
	}
	if total <= 0 {
		return 0
	}
	needle := stableHashInt(requestID, salt) % total
	for index, route := range routes {
		needle -= routeWeight(route.Route)
		if needle < 0 {
			return index
		}
	}
	return len(routes) - 1
}

func stableHashInt(value string, salt int) int {
	hash := fnv.New64a()
	_, _ = hash.Write([]byte(value))
	_, _ = hash.Write([]byte(":"))
	_, _ = hash.Write([]byte(strconv.Itoa(salt)))
	return int(hash.Sum64() % uint64(^uint(0)>>1))
}

func routeWeight(route ModelRoute) int {
	if route.Weight <= 0 {
		return 1
	}
	return route.Weight
}

func routeStrategy(route ModelRoute) string {
	if strings.TrimSpace(route.Strategy) == "" {
		return "priority_weighted"
	}
	return strings.TrimSpace(route.Strategy)
}

func shouldFailoverProviderError(err error) bool {
	if err == nil {
		return false
	}
	httpErr := AsHTTPError(err)
	switch httpErr.Status {
	case http.StatusTooManyRequests, http.StatusBadGateway, http.StatusServiceUnavailable, http.StatusGatewayTimeout:
		return true
	default:
		return httpErr.Status >= 500
	}
}

func lastAttemptRoute(attempts []RouteAttempt) RouteSelection {
	if len(attempts) == 0 {
		return RouteSelection{}
	}
	return attempts[len(attempts)-1].Selection
}

func errorMessage(err error) string {
	if err == nil {
		return ""
	}
	return err.Error()
}

func (s *Server) writeRouteHeaders(w http.ResponseWriter, call CallContext, route RouteSelection, attempts int) {
	w.Header().Set("x-tokenhub-project-id", call.Project.ID)
	w.Header().Set("x-tokenhub-provider", route.Provider.ID)
	w.Header().Set("x-tokenhub-model", route.ProviderModel)
	w.Header().Set("x-tokenhub-route-id", route.Route.ID)
	w.Header().Set("x-tokenhub-route-attempts", strconv.Itoa(attempts))
}

func (s *Server) authenticate(r *http.Request) (Project, APIKey, error) {
	auth := r.Header.Get("authorization")
	if auth == "" {
		return Project{}, APIKey{}, ErrInvalidAPIKey
	}
	const prefix = "Bearer "
	if !strings.HasPrefix(auth, prefix) {
		return Project{}, APIKey{}, ErrInvalidAPIKey
	}
	return s.store.ValidateAPIKey(strings.TrimSpace(strings.TrimPrefix(auth, prefix)))
}

func (s *Server) handleAdminLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	var req struct {
		Identity string `json:"identity"`
		Password string `json:"password"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
		return
	}
	if strings.TrimSpace(req.Identity) == "" || req.Password == "" {
		writeError(w, r, NewHTTPError(400, "invalid_request", "identity and password are required"))
		return
	}
	user, session, err := s.store.AuthenticateAdminUser(req.Identity, req.Password, 12*time.Hour)
	if err != nil {
		writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"token":      session.Token,
		"expires_at": session.ExpiresAt,
		"user":       user,
	})
}

func (s *Server) handleAdminLogout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	token := bearerToken(r)
	if token != "" && token != strings.TrimSpace(s.config.AdminToken) {
		s.store.RevokeAdminSession(token)
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) handleAdminMe(w http.ResponseWriter, r *http.Request) {
	user, ok := s.authorizeAdminUser(w, r)
	if !ok {
		return
	}
	if r.Method != http.MethodGet {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"user": user})
}

func (s *Server) handleAdminOverview(w http.ResponseWriter, r *http.Request) {
	if !s.authorizeAdmin(w, r) {
		return
	}
	if r.Method != http.MethodGet {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"summary":   s.store.UsageSummary(),
		"projects":  s.store.ListProjects(),
		"providers": s.store.ListProviders(),
		"models":    s.store.ListModels(),
		"alerts":    s.store.ListAlerts(),
	})
}

func (s *Server) handleAdminProjects(w http.ResponseWriter, r *http.Request) {
	if !s.authorizeAdmin(w, r) {
		return
	}
	switch r.Method {
	case http.MethodGet:
		writeJSON(w, http.StatusOK, map[string]any{"data": s.store.ListProjects()})
	case http.MethodPost:
		var req Project
		if err := decodeJSON(r, &req); err != nil {
			writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
			return
		}
		writeJSON(w, http.StatusCreated, s.store.CreateProject(req))
	default:
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
	}
}

func (s *Server) handleAdminProjectNested(w http.ResponseWriter, r *http.Request) {
	if !s.authorizeAdmin(w, r) {
		return
	}
	parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/admin/projects/"), "/")
	projectID := parts[0]
	if len(parts) == 1 {
		switch r.Method {
		case http.MethodPatch:
			var req Project
			if err := decodeJSON(r, &req); err != nil {
				writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
				return
			}
			project, err := s.store.UpdateProject(projectID, req)
			if err != nil {
				writeError(w, r, err)
				return
			}
			writeJSON(w, http.StatusOK, project)
		case http.MethodDelete:
			if err := s.store.DeleteProject(projectID); err != nil {
				writeError(w, r, err)
				return
			}
			w.WriteHeader(http.StatusNoContent)
		default:
			writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		}
		return
	}
	if len(parts) != 2 || parts[1] != "keys" {
		writeError(w, r, NewHTTPError(404, "not_found", "Not found"))
		return
	}
	switch r.Method {
	case http.MethodGet:
		writeJSON(w, http.StatusOK, map[string]any{"data": s.store.ListProjectKeys(projectID)})
	case http.MethodPost:
		var req struct {
			Name          string      `json:"name"`
			AllowedModels []string    `json:"allowed_models"`
			Limits        QuotaLimits `json:"limits"`
			ExpiresAt     *time.Time  `json:"expires_at"`
		}
		if err := decodeJSON(r, &req); err != nil {
			writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
			return
		}
		key, secret, err := s.store.CreateAPIKey(projectID, APIKey{
			Name:      req.Name,
			Allowed:   req.AllowedModels,
			Limits:    req.Limits,
			ExpiresAt: req.ExpiresAt,
			Status:    StatusActive,
		}, "")
		if err != nil {
			writeError(w, r, err)
			return
		}
		writeJSON(w, http.StatusCreated, map[string]any{
			"id":                      key.ID,
			"api_key":                 secret,
			"name":                    key.Name,
			"project_id":              key.ProjectID,
			"plain_text_visible_once": true,
		})
	default:
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
	}
}

func (s *Server) handleAdminUsers(w http.ResponseWriter, r *http.Request) {
	if !s.authorizeAdmin(w, r) {
		return
	}
	switch r.Method {
	case http.MethodGet:
		writeJSON(w, http.StatusOK, map[string]any{"data": s.store.ListAdminUsers()})
	case http.MethodPost:
		var req struct {
			Username string `json:"username"`
			Name     string `json:"name"`
			Email    string `json:"email"`
			Role     string `json:"role"`
			TeamID   string `json:"team_id"`
			Status   string `json:"status"`
			Password string `json:"password"`
		}
		if err := decodeJSON(r, &req); err != nil {
			writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
			return
		}
		user, err := s.store.CreateAdminUser(AdminUser{
			Username: req.Username,
			Name:     req.Name,
			Email:    req.Email,
			Role:     req.Role,
			TeamID:   req.TeamID,
			Status:   req.Status,
		}, req.Password)
		if err != nil {
			writeError(w, r, err)
			return
		}
		writeJSON(w, http.StatusCreated, user)
	default:
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
	}
}

func (s *Server) handleAdminUserItem(w http.ResponseWriter, r *http.Request) {
	if !s.authorizeAdmin(w, r) {
		return
	}
	userID := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/admin/users/"), "/")
	if userID == "" || strings.Contains(userID, "/") {
		writeError(w, r, NewHTTPError(404, "not_found", "Not found"))
		return
	}
	switch r.Method {
	case http.MethodPatch:
		var req struct {
			Username string `json:"username"`
			Name     string `json:"name"`
			Email    string `json:"email"`
			Role     string `json:"role"`
			TeamID   string `json:"team_id"`
			Status   string `json:"status"`
			Password string `json:"password"`
		}
		if err := decodeJSON(r, &req); err != nil {
			writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
			return
		}
		user, err := s.store.UpdateAdminUser(userID, AdminUser{
			Username: req.Username,
			Name:     req.Name,
			Email:    req.Email,
			Role:     req.Role,
			TeamID:   req.TeamID,
			Status:   req.Status,
		}, req.Password)
		if err != nil {
			writeError(w, r, err)
			return
		}
		writeJSON(w, http.StatusOK, user)
	case http.MethodDelete:
		if err := s.store.DeleteAdminUser(userID); err != nil {
			writeError(w, r, err)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	default:
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
	}
}

func (s *Server) handleAdminAPIKeys(w http.ResponseWriter, r *http.Request) {
	if !s.authorizeAdmin(w, r) {
		return
	}
	if r.Method != http.MethodGet {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": s.store.ListAPIKeys()})
}

func (s *Server) handleAdminAPIKeyItem(w http.ResponseWriter, r *http.Request) {
	if !s.authorizeAdmin(w, r) {
		return
	}
	keyID := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/admin/api-keys/"), "/")
	if keyID == "" || strings.Contains(keyID, "/") {
		writeError(w, r, NewHTTPError(404, "not_found", "Not found"))
		return
	}
	switch r.Method {
	case http.MethodPatch:
		var req APIKey
		if err := decodeJSON(r, &req); err != nil {
			writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
			return
		}
		key, err := s.store.UpdateAPIKey(keyID, req)
		if err != nil {
			writeError(w, r, err)
			return
		}
		writeJSON(w, http.StatusOK, key)
	case http.MethodDelete:
		if err := s.store.DeleteAPIKey(keyID); err != nil {
			writeError(w, r, err)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	default:
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
	}
}

func (s *Server) handleAdminProviders(w http.ResponseWriter, r *http.Request) {
	if !s.authorizeAdmin(w, r) {
		return
	}
	switch r.Method {
	case http.MethodGet:
		writeJSON(w, http.StatusOK, map[string]any{"data": s.store.ListProviders()})
	case http.MethodPost:
		var req struct {
			ID       string            `json:"id"`
			Name     string            `json:"name"`
			Type     string            `json:"type"`
			BaseURL  string            `json:"base_url"`
			APIKey   string            `json:"api_key"`
			Status   string            `json:"status"`
			Healthy  bool              `json:"healthy"`
			Priority int               `json:"priority"`
			Headers  map[string]string `json:"headers"`
			Options  map[string]string `json:"options"`
		}
		if err := decodeJSON(r, &req); err != nil {
			writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
			return
		}
		provider := Provider{
			ID:       req.ID,
			Name:     req.Name,
			Type:     req.Type,
			BaseURL:  req.BaseURL,
			APIKey:   req.APIKey,
			Status:   req.Status,
			Healthy:  req.Healthy,
			Priority: req.Priority,
			Headers:  req.Headers,
			Options:  req.Options,
		}
		if provider.Name == "" || provider.Type == "" {
			writeError(w, r, NewHTTPError(400, "invalid_provider", "name and type are required"))
			return
		}
		writeJSON(w, http.StatusCreated, s.store.AddProvider(provider))
	default:
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
	}
}

func (s *Server) handleAdminProviderNested(w http.ResponseWriter, r *http.Request) {
	if !s.authorizeAdmin(w, r) {
		return
	}
	parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/admin/providers/"), "/")
	if len(parts) == 1 {
		switch r.Method {
		case http.MethodPatch:
			var req Provider
			if err := decodeJSON(r, &req); err != nil {
				writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
				return
			}
			provider, err := s.store.UpdateProvider(parts[0], req)
			if err != nil {
				writeError(w, r, err)
				return
			}
			writeJSON(w, http.StatusOK, provider)
		case http.MethodDelete:
			if err := s.store.DeleteProvider(parts[0]); err != nil {
				writeError(w, r, err)
				return
			}
			w.WriteHeader(http.StatusNoContent)
		default:
			writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		}
		return
	}
	if len(parts) != 2 || parts[1] != "health" {
		writeError(w, r, NewHTTPError(404, "not_found", "Not found"))
		return
	}
	if r.Method != http.MethodPost {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	var req struct {
		Healthy bool `json:"healthy"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
		return
	}
	provider, err := s.store.SetProviderHealth(parts[0], req.Healthy)
	if err != nil {
		writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, provider)
}

func (s *Server) handleAdminModels(w http.ResponseWriter, r *http.Request) {
	if !s.authorizeAdmin(w, r) {
		return
	}
	switch r.Method {
	case http.MethodGet:
		writeJSON(w, http.StatusOK, map[string]any{"data": s.store.ListModels()})
	case http.MethodPost:
		var req struct {
			Model
			Routes []ModelRoute `json:"routes"`
		}
		if err := decodeJSON(r, &req); err != nil {
			writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
			return
		}
		model := s.store.AddModel(req.Model)
		for _, route := range req.Routes {
			route.ModelName = model.Name
			s.store.AddRoute(route)
		}
		writeJSON(w, http.StatusCreated, model)
	default:
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
	}
}

func (s *Server) handleAdminModelItem(w http.ResponseWriter, r *http.Request) {
	if !s.authorizeAdmin(w, r) {
		return
	}
	modelName := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/admin/models/"), "/")
	if modelName == "" || strings.Contains(modelName, "/") {
		writeError(w, r, NewHTTPError(404, "not_found", "Not found"))
		return
	}
	switch r.Method {
	case http.MethodPatch:
		var req Model
		if err := decodeJSON(r, &req); err != nil {
			writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
			return
		}
		model, err := s.store.UpdateModel(modelName, req)
		if err != nil {
			writeError(w, r, err)
			return
		}
		writeJSON(w, http.StatusOK, model)
	case http.MethodDelete:
		if err := s.store.DeleteModel(modelName); err != nil {
			writeError(w, r, err)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	default:
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
	}
}

func (s *Server) handleAdminRoutes(w http.ResponseWriter, r *http.Request) {
	if !s.authorizeAdmin(w, r) {
		return
	}
	switch r.Method {
	case http.MethodGet:
		writeJSON(w, http.StatusOK, map[string]any{"data": s.store.ListRoutes()})
	case http.MethodPost:
		var req ModelRoute
		if err := decodeJSON(r, &req); err != nil {
			writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
			return
		}
		if req.ModelName == "" || req.ProviderID == "" || req.ProviderModel == "" {
			writeError(w, r, NewHTTPError(400, "invalid_route", "model_name, provider_id and provider_model are required"))
			return
		}
		writeJSON(w, http.StatusCreated, s.store.AddRoute(req))
	default:
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
	}
}

func (s *Server) handleAdminRouteItem(w http.ResponseWriter, r *http.Request) {
	if !s.authorizeAdmin(w, r) {
		return
	}
	routeID := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/admin/routing-rules/"), "/")
	if routeID == "" || strings.Contains(routeID, "/") {
		writeError(w, r, NewHTTPError(404, "not_found", "Not found"))
		return
	}
	switch r.Method {
	case http.MethodPatch:
		var req ModelRoute
		if err := decodeJSON(r, &req); err != nil {
			writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
			return
		}
		route, err := s.store.UpdateRoute(routeID, req)
		if err != nil {
			writeError(w, r, err)
			return
		}
		writeJSON(w, http.StatusOK, route)
	case http.MethodDelete:
		if err := s.store.DeleteRoute(routeID); err != nil {
			writeError(w, r, err)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	default:
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
	}
}

func (s *Server) handleAdminResources(w http.ResponseWriter, r *http.Request) {
	if !s.authorizeAdmin(w, r) {
		return
	}
	parts := strings.Split(strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/admin/resources/"), "/"), "/")
	if len(parts) == 0 || parts[0] == "" {
		writeError(w, r, NewHTTPError(404, "not_found", "Not found"))
		return
	}
	kind := parts[0]
	if len(parts) == 1 {
		switch r.Method {
		case http.MethodGet:
			writeJSON(w, http.StatusOK, map[string]any{"data": s.store.ListResources(kind)})
		case http.MethodPost:
			var req AdminResource
			if err := decodeJSON(r, &req); err != nil {
				writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
				return
			}
			if req.Name == "" {
				writeError(w, r, NewHTTPError(400, "invalid_resource", "name is required"))
				return
			}
			writeJSON(w, http.StatusCreated, s.store.CreateResource(kind, req))
		default:
			writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		}
		return
	}
	if len(parts) != 2 || parts[1] == "" {
		writeError(w, r, NewHTTPError(404, "not_found", "Not found"))
		return
	}
	switch r.Method {
	case http.MethodPatch:
		var req AdminResource
		if err := decodeJSON(r, &req); err != nil {
			writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
			return
		}
		resource, err := s.store.UpdateResource(kind, parts[1], req)
		if err != nil {
			writeError(w, r, err)
			return
		}
		writeJSON(w, http.StatusOK, resource)
	case http.MethodDelete:
		if err := s.store.DeleteResource(kind, parts[1]); err != nil {
			writeError(w, r, err)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	default:
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
	}
}

func (s *Server) handleAdminUsageSummary(w http.ResponseWriter, r *http.Request) {
	if !s.authorizeAdmin(w, r) {
		return
	}
	if r.Method != http.MethodGet {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	writeJSON(w, http.StatusOK, s.store.UsageSummary())
}

func (s *Server) handleAdminUsageBreakdown(w http.ResponseWriter, r *http.Request) {
	if !s.authorizeAdmin(w, r) {
		return
	}
	if r.Method != http.MethodGet {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	writeJSON(w, http.StatusOK, s.store.UsageBreakdown())
}

func (s *Server) handleAdminUsageTimeseries(w http.ResponseWriter, r *http.Request) {
	if !s.authorizeAdmin(w, r) {
		return
	}
	if r.Method != http.MethodGet {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": s.store.UsageTimeseries(31)})
}

func (s *Server) handleAdminRequestLogs(w http.ResponseWriter, r *http.Request) {
	if !s.authorizeAdmin(w, r) {
		return
	}
	if r.Method != http.MethodGet {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": s.store.ListRequestLogs()})
}

func (s *Server) handleAdminAlerts(w http.ResponseWriter, r *http.Request) {
	if !s.authorizeAdmin(w, r) {
		return
	}
	if r.Method != http.MethodGet {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": s.store.ListAlerts()})
}

func (s *Server) authorizeAdmin(w http.ResponseWriter, r *http.Request) bool {
	expected := strings.TrimSpace(s.config.AdminToken)
	if expected == "" {
		writeError(w, r, NewHTTPError(500, "admin_auth_not_configured", "Admin token is not configured"))
		return false
	}
	token := bearerToken(r)
	if token == expected {
		return true
	}
	if _, ok := s.store.ValidateAdminSession(token); ok {
		return true
	}
	writeError(w, r, NewHTTPError(401, "invalid_admin_token", "Invalid admin token"))
	return false
}

func (s *Server) authorizeAdminUser(w http.ResponseWriter, r *http.Request) (AdminUser, bool) {
	token := bearerToken(r)
	if token == "" {
		writeError(w, r, NewHTTPError(401, "invalid_admin_token", "Invalid admin token"))
		return AdminUser{}, false
	}
	if token == strings.TrimSpace(s.config.AdminToken) {
		users := s.store.ListAdminUsers()
		if len(users) > 0 {
			return users[0], true
		}
		return AdminUser{ID: "dev_admin", Username: "dev_admin", Name: "开发管理员", Email: "admin@tokenhub.local", Role: "admin", Status: StatusActive}, true
	}
	user, ok := s.store.ValidateAdminSession(token)
	if !ok {
		writeError(w, r, NewHTTPError(401, "invalid_admin_token", "Invalid admin token"))
		return AdminUser{}, false
	}
	return user, true
}

func bearerToken(r *http.Request) string {
	auth := r.Header.Get("authorization")
	if !strings.HasPrefix(auth, "Bearer ") {
		return ""
	}
	return strings.TrimSpace(strings.TrimPrefix(auth, "Bearer "))
}

func decodeJSON(r *http.Request, target any) error {
	defer r.Body.Close()
	decoder := json.NewDecoder(io.LimitReader(r.Body, 4<<20))
	decoder.UseNumber()
	return decoder.Decode(target)
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("content-type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func writeError(w http.ResponseWriter, r *http.Request, err error) {
	httpErr := AsHTTPError(err)
	writeJSON(w, httpErr.Status, map[string]any{
		"error": map[string]any{
			"message": httpErr.Message,
			"type":    httpErr.Code,
			"code":    httpErr.Code,
		},
		"request_id": NewID("req"),
	})
}

func statusAndCode(err error) (int, string) {
	if err == nil {
		return http.StatusOK, ""
	}
	httpErr := AsHTTPError(err)
	return httpErr.Status, httpErr.Code
}

func clientIP(r *http.Request) string {
	forwarded := r.Header.Get("x-forwarded-for")
	if forwarded != "" {
		return strings.TrimSpace(strings.Split(forwarded, ",")[0])
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil {
		return host
	}
	return r.RemoteAddr
}

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("access-control-allow-origin", "*")
		w.Header().Set("access-control-allow-methods", "GET,POST,PATCH,DELETE,OPTIONS")
		w.Header().Set("access-control-allow-headers", "authorization,content-type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
