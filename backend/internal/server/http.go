package server

import (
	"bytes"
	"context"
	"encoding/csv"
	"encoding/json"
	"hash/fnv"
	"io"
	"net"
	"net/http"
	"os"
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
	s.mux.HandleFunc("/api/admin/playground/chat", s.handleAdminPlaygroundChat)
	s.mux.HandleFunc("/api/admin/projects", s.handleAdminProjects)
	s.mux.HandleFunc("/api/admin/projects/", s.handleAdminProjectNested)
	s.mux.HandleFunc("/api/admin/users", s.handleAdminUsers)
	s.mux.HandleFunc("/api/admin/users/", s.handleAdminUserItem)
	s.mux.HandleFunc("/api/admin/provider-catalog", s.handleAdminProviderCatalog)
	s.mux.HandleFunc("/api/admin/provider-catalog/", s.handleAdminProviderCatalogItem)
	s.mux.HandleFunc("/api/admin/api-keys", s.handleAdminAPIKeys)
	s.mux.HandleFunc("/api/admin/api-keys/", s.handleAdminAPIKeyItem)
	s.mux.HandleFunc("/api/admin/providers", s.handleAdminProviders)
	s.mux.HandleFunc("/api/admin/providers/", s.handleAdminProviderNested)
	s.mux.HandleFunc("/api/admin/provider-resources", s.handleAdminProviderResources)
	s.mux.HandleFunc("/api/admin/provider-resources/", s.handleAdminProviderResourceNested)
	s.mux.HandleFunc("/api/admin/models", s.handleAdminModels)
	s.mux.HandleFunc("/api/admin/models/", s.handleAdminModelItem)
	s.mux.HandleFunc("/api/admin/routing-rules", s.handleAdminRoutes)
	s.mux.HandleFunc("/api/admin/routing-rules/", s.handleAdminRouteItem)
	s.mux.HandleFunc("/api/admin/resources/", s.handleAdminResources)
	s.mux.HandleFunc("/api/admin/sqlite/backups", s.handleAdminSQLiteBackups)
	s.mux.HandleFunc("/api/admin/sqlite/backups/", s.handleAdminSQLiteBackupItem)
	s.mux.HandleFunc("/api/admin/billing/generate", s.handleAdminGenerateBilling)
	s.mux.HandleFunc("/api/admin/export/", s.handleAdminExport)
	s.mux.HandleFunc("/api/admin/usage/summary", s.handleAdminUsageSummary)
	s.mux.HandleFunc("/api/admin/usage/breakdown", s.handleAdminUsageBreakdown)
	s.mux.HandleFunc("/api/admin/usage/timeseries", s.handleAdminUsageTimeseries)
	s.mux.HandleFunc("/api/admin/audit/requests", s.handleAdminRequestLogs)
	s.mux.HandleFunc("/api/admin/audit/requests/", s.handleAdminRequestDetail)
	s.mux.HandleFunc("/api/admin/audit/events", s.handleAdminAuditEvents)
	s.mux.HandleFunc("/api/admin/alerts", s.handleAdminAlerts)
	s.mux.HandleFunc("/api/admin/alerts/", s.handleAdminAlertItem)
	s.mux.HandleFunc("/api/admin/alert-deliveries", s.handleAdminAlertDeliveries)
	s.mux.HandleFunc("/api/admin/approvals", s.handleAdminApprovals)
	s.mux.HandleFunc("/api/admin/approvals/", s.handleAdminApprovalItem)
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

	routed, ok := s.startRoutedCall(w, r, project, key, req.Model, req)
	if !ok {
		return
	}

	if req.Stream {
		route := routed.Routes[0]
		resourceID := routeResourceID(route)
		if err := s.store.CheckProviderResourceCapacity(resourceID); err != nil {
			s.finishFailedRoutedCall(r, routed, []RouteAttempt{{
				Selection: route,
				Status:    AsHTTPError(err).Status,
				ErrorCode: AsHTTPError(err).Code,
				Error:     err.Error(),
			}}, err)
			s.recordRequestPayload(routed.Call.RequestID, req, auditErrorPayload(err, routed.Call.RequestID))
			writeError(w, r, err)
			return
		}
		adapter, err := s.adapterForRoute(route)
		if err != nil {
			s.store.FinishProviderResourceAttempt(resourceID, false, Usage{})
			httpErr := AsHTTPError(err)
			s.store.FinishCall(routed.Call, route, Usage{}, httpErr.Status, httpErr.Code, clientIP(r), r.UserAgent())
			s.recordRequestPayload(routed.Call.RequestID, req, auditErrorPayload(err, routed.Call.RequestID))
			writeError(w, r, err)
			return
		}
		w.Header().Set("content-type", "text/event-stream")
		w.Header().Set("cache-control", "no-cache")
		w.Header().Set("x-request-id", routed.Call.RequestID)
		s.writeRouteHeaders(w, routed.Call, route, 1)
		usage, err := adapter.ChatStream(r.Context(), route.Provider, route.ProviderModel, req, w)
		s.store.FinishProviderResourceAttempt(resourceID, err == nil, usage)
		status, code := statusAndCode(err)
		if err == nil {
			s.store.MarkRouteUsed(route.Route.ID)
			s.store.MarkProviderResourceUsed(routeResourceID(route))
		}
		s.store.RecordRouteAttempts(routed.Call.RequestID, []RouteAttempt{{
			Selection: route,
			Status:    status,
			ErrorCode: code,
			Error:     errorMessage(err),
		}})
		s.store.FinishCall(routed.Call, route, usage, status, code, clientIP(r), r.UserAgent())
		s.recordRequestPayload(routed.Call.RequestID, req, auditStreamPayload(status, code, err))
		return
	}

	resp, route, usage, attempts, err := s.executeRoutedChat(r, routed, req)
	if err != nil {
		s.finishFailedRoutedCall(r, routed, attempts, err)
		s.recordRequestPayload(routed.Call.RequestID, req, auditErrorPayload(err, routed.Call.RequestID))
		writeError(w, r, err)
		return
	}
	s.store.MarkRouteUsed(route.Route.ID)
	s.store.MarkProviderResourceUsed(routeResourceID(route))
	s.store.RecordRouteAttempts(routed.Call.RequestID, attempts)
	s.store.FinishCall(routed.Call, route, usage, http.StatusOK, "", clientIP(r), r.UserAgent())
	s.recordRequestPayload(routed.Call.RequestID, req, resp)
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
	routed, ok := s.startRoutedCall(w, r, project, key, req.Model, req)
	if !ok {
		return
	}
	resp, route, usage, attempts, err := s.executeRoutedResponses(r, routed, req)
	if err != nil {
		s.finishFailedRoutedCall(r, routed, attempts, err)
		s.recordRequestPayload(routed.Call.RequestID, req, auditErrorPayload(err, routed.Call.RequestID))
		writeError(w, r, err)
		return
	}
	s.store.MarkRouteUsed(route.Route.ID)
	s.store.MarkProviderResourceUsed(routeResourceID(route))
	s.store.RecordRouteAttempts(routed.Call.RequestID, attempts)
	s.store.FinishCall(routed.Call, route, usage, http.StatusOK, "", clientIP(r), r.UserAgent())
	s.recordRequestPayload(routed.Call.RequestID, req, resp)
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
	routed, ok := s.startRoutedCall(w, r, project, key, req.Model, req)
	if !ok {
		return
	}
	resp, route, usage, attempts, err := s.executeRoutedEmbeddings(r, routed, req)
	if err != nil {
		s.finishFailedRoutedCall(r, routed, attempts, err)
		s.recordRequestPayload(routed.Call.RequestID, req, auditErrorPayload(err, routed.Call.RequestID))
		writeError(w, r, err)
		return
	}
	s.store.MarkRouteUsed(route.Route.ID)
	s.store.MarkProviderResourceUsed(routeResourceID(route))
	s.store.RecordRouteAttempts(routed.Call.RequestID, attempts)
	s.store.FinishCall(routed.Call, route, usage, http.StatusOK, "", clientIP(r), r.UserAgent())
	s.recordRequestPayload(routed.Call.RequestID, req, resp)
	w.Header().Set("x-request-id", routed.Call.RequestID)
	s.writeRouteHeaders(w, routed.Call, route, len(attempts))
	writeJSON(w, http.StatusOK, resp)
}

func (s *Server) startRoutedCall(w http.ResponseWriter, r *http.Request, project Project, key APIKey, model string, requestPayload any) (RoutedCall, bool) {
	call, err := s.store.StartCall(project, key, model)
	if err != nil {
		httpErr := AsHTTPError(err)
		requestID := s.store.RecordRejectedRequest(project, key, model, httpErr.Status, httpErr.Code, clientIP(r), r.UserAgent())
		s.recordRequestPayload(requestID, requestPayload, auditErrorPayload(err, requestID))
		writeError(w, r, err)
		return RoutedCall{}, false
	}
	routes, err := s.store.SelectRouteCandidates(model)
	if err != nil {
		httpErr := AsHTTPError(err)
		s.store.FinishCall(call, RouteSelection{}, Usage{}, httpErr.Status, httpErr.Code, clientIP(r), r.UserAgent())
		s.recordRequestPayload(call.RequestID, requestPayload, auditErrorPayload(err, call.RequestID))
		writeError(w, r, err)
		return RoutedCall{}, false
	}
	return RoutedCall{Call: call, Routes: s.planRouteOrder(call, routes)}, true
}

func (s *Server) executeRoutedChat(r *http.Request, routed RoutedCall, req ChatCompletionRequest) (any, RouteSelection, Usage, []RouteAttempt, error) {
	return executeRoutedWithStore(s.store, routed, func(route RouteSelection) (any, Usage, error) {
		adapter, err := s.adapterForRoute(route)
		if err != nil {
			return nil, Usage{}, err
		}
		return adapter.Chat(r.Context(), route.Provider, route.ProviderModel, req)
	})
}

func (s *Server) executeRoutedResponses(r *http.Request, routed RoutedCall, req ResponsesRequest) (any, RouteSelection, Usage, []RouteAttempt, error) {
	return executeRoutedWithStore(s.store, routed, func(route RouteSelection) (any, Usage, error) {
		adapter, err := s.adapterForRoute(route)
		if err != nil {
			return nil, Usage{}, err
		}
		return adapter.Responses(r.Context(), route.Provider, route.ProviderModel, req)
	})
}

func (s *Server) executeRoutedEmbeddings(r *http.Request, routed RoutedCall, req EmbeddingsRequest) (any, RouteSelection, Usage, []RouteAttempt, error) {
	return executeRoutedWithStore(s.store, routed, func(route RouteSelection) (any, Usage, error) {
		adapter, err := s.adapterForRoute(route)
		if err != nil {
			return nil, Usage{}, err
		}
		return adapter.Embeddings(r.Context(), route.Provider, route.ProviderModel, req)
	})
}

func (s *Server) handleAdminPlaygroundChat(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireAdmin(w, r, "routing", r.Method)
	if !ok {
		return
	}
	if r.Method != http.MethodPost {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	var req ChatCompletionRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
		return
	}
	req.Model = strings.TrimSpace(req.Model)
	req.Stream = false
	if req.Model == "" {
		writeError(w, r, NewHTTPError(400, "missing_model", "model is required"))
		return
	}
	if len(req.Messages) == 0 {
		writeError(w, r, NewHTTPError(400, "missing_messages", "messages are required"))
		return
	}
	for _, message := range req.Messages {
		if strings.TrimSpace(message.Role) == "" {
			writeError(w, r, NewHTTPError(400, "invalid_message", "message role is required"))
			return
		}
	}

	routes, err := s.store.SelectRouteCandidates(req.Model)
	if err != nil {
		writeError(w, r, err)
		return
	}
	requestID := NewID("pg")
	routed := RoutedCall{
		Call: CallContext{
			RequestID: requestID,
			Project:   Project{ID: "admin_playground", Name: "Admin Playground", Status: StatusActive},
			Key:       APIKey{ID: user.ID, Name: "Admin Playground"},
			Model:     Model{Name: req.Model, Status: StatusActive},
			StartedAt: time.Now().UTC(),
		},
	}
	routed.Routes = s.planRouteOrder(routed.Call, routes)
	resp, route, usage, attempts, err := s.executeRoutedChat(r, routed, req)
	if err != nil {
		s.recordAdminAudit(r, user, "chat_failed", "playground", req.Model, "", map[string]any{
			"model":    req.Model,
			"attempts": playgroundRouteAttempts(attempts),
			"error":    AsHTTPError(err).Code,
		})
		writeError(w, r, err)
		return
	}
	s.store.MarkRouteUsed(route.Route.ID)
	s.store.MarkProviderResourceUsed(routeResourceID(route))
	s.recordAdminAudit(r, user, "chat", "playground", req.Model, "", map[string]any{
		"model":    req.Model,
		"route":    playgroundRouteSummary(route),
		"usage":    usage,
		"attempts": len(attempts),
	})
	w.Header().Set("x-request-id", requestID)
	writeJSON(w, http.StatusOK, PlaygroundChatResponse{
		Response:  resp,
		Route:     playgroundRouteSummary(route),
		Usage:     usage,
		Attempts:  playgroundRouteAttempts(attempts),
		RequestID: requestID,
	})
}

func executeRoutedWithStore[T any](store Store, routed RoutedCall, call func(RouteSelection) (T, Usage, error)) (T, RouteSelection, Usage, []RouteAttempt, error) {
	var zero T
	var lastErr error = ErrProviderMissing
	attempts := make([]RouteAttempt, 0, len(routed.Routes))
	for _, route := range routed.Routes {
		resourceID := routeResourceID(route)
		if err := store.CheckProviderResourceCapacity(resourceID); err != nil {
			status, code := statusAndCode(err)
			attempts = append(attempts, RouteAttempt{
				Selection: route,
				Status:    status,
				ErrorCode: code,
				Error:     errorMessage(err),
			})
			lastErr = err
			if !shouldFailoverProviderError(err) {
				return zero, route, Usage{}, attempts, err
			}
			continue
		}
		resp, usage, err := call(route)
		if resourceID != "" {
			store.FinishProviderResourceAttempt(resourceID, err == nil, usage)
		}
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
	s.store.RecordRouteAttempts(routed.Call.RequestID, attempts)
	s.store.FinishCall(routed.Call, route, Usage{}, httpErr.Status, httpErr.Code, clientIP(r), r.UserAgent())
}

func (s *Server) adapterForRoute(route RouteSelection) (ProviderAdapter, error) {
	adapter, ok := s.adapters[route.Provider.Type]
	if !ok {
		return nil, NewHTTPError(503, "provider_adapter_missing", "Provider adapter is not registered")
	}
	return adapter, nil
}

func (s *Server) planRouteOrder(call CallContext, routes []RouteSelection) []RouteSelection {
	ordered := append([]RouteSelection(nil), routes...)
	sort.SliceStable(ordered, func(i, j int) bool {
		if ordered[i].Route.Priority != ordered[j].Route.Priority {
			return ordered[i].Route.Priority < ordered[j].Route.Priority
		}
		if routeResourcePriority(ordered[i]) != routeResourcePriority(ordered[j]) {
			return routeResourcePriority(ordered[i]) < routeResourcePriority(ordered[j])
		}
		if routeWeight(ordered[i].Route) != routeWeight(ordered[j].Route) {
			return routeWeight(ordered[i].Route) > routeWeight(ordered[j].Route)
		}
		return routeSortID(ordered[i]) < routeSortID(ordered[j])
	})

	var planned []RouteSelection
	for len(ordered) > 0 {
		priority := ordered[0].Route.Priority
		end := 0
		for end < len(ordered) && ordered[end].Route.Priority == priority {
			end++
		}
		priorityGroup := append([]RouteSelection(nil), ordered[:end]...)
		for len(priorityGroup) > 0 {
			resourcePriority := routeResourcePriority(priorityGroup[0])
			groupEnd := 0
			for groupEnd < len(priorityGroup) && routeResourcePriority(priorityGroup[groupEnd]) == resourcePriority {
				groupEnd++
			}
			group := append([]RouteSelection(nil), priorityGroup[:groupEnd]...)
			strategy := routeStrategy(group[0].Route)
			if strategy == RouteStrategyPriorityOnly || strategy == RouteStrategyQuality || strategy == RouteStrategyCost {
				sortRouteGroupByStrategy(strategy, group)
				planned = append(planned, group...)
				priorityGroup = priorityGroup[groupEnd:]
				continue
			}
			if group[0].Route.StickySession {
				index := stickyRouteIndex(call, group)
				planned = append(planned, group[index])
				group = append(group[:index], group[index+1:]...)
			}
			for len(group) > 0 {
				index := weightedRouteIndex(call.RequestID, len(planned), group)
				planned = append(planned, group[index])
				group = append(group[:index], group[index+1:]...)
			}
			priorityGroup = priorityGroup[groupEnd:]
		}
		ordered = ordered[end:]
	}
	return planned
}

func sortRouteGroupByStrategy(strategy string, routes []RouteSelection) {
	sort.SliceStable(routes, func(i, j int) bool {
		switch strategy {
		case RouteStrategyQuality:
			if routeQualityScore(routes[i].Route) != routeQualityScore(routes[j].Route) {
				return routeQualityScore(routes[i].Route) > routeQualityScore(routes[j].Route)
			}
		case RouteStrategyCost:
			if routeCostScore(routes[i].Route) != routeCostScore(routes[j].Route) {
				return routeCostScore(routes[i].Route) > routeCostScore(routes[j].Route)
			}
		}
		if routeWeight(routes[i].Route) != routeWeight(routes[j].Route) {
			return routeWeight(routes[i].Route) > routeWeight(routes[j].Route)
		}
		return routeSortID(routes[i]) < routeSortID(routes[j])
	})
}

func stickyRouteIndex(call CallContext, routes []RouteSelection) int {
	if len(routes) <= 1 {
		return 0
	}
	stickyKey := call.Key.ID
	if stickyKey == "" {
		stickyKey = call.Project.ID
	}
	return stableHashInt(stickyKey, len(routes)) % len(routes)
}

func weightedRouteIndex(requestID string, salt int, routes []RouteSelection) int {
	if len(routes) <= 1 {
		return 0
	}
	total := 0
	for _, route := range routes {
		total += routeEffectiveWeight(route.Route)
	}
	if total <= 0 {
		return 0
	}
	needle := stableHashInt(requestID, salt) % total
	for index, route := range routes {
		needle -= routeEffectiveWeight(route.Route)
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

func routeEffectiveWeight(route ModelRoute) int {
	weight := routeWeight(route)
	switch routeStrategy(route) {
	case RouteStrategyBalanced:
		return maxInt(1, weight+routeQualityScore(route)+routeCostScore(route))
	default:
		return weight
	}
}

func routeQualityScore(route ModelRoute) int {
	if route.QualityScore <= 0 {
		return 50
	}
	if route.QualityScore > 100 {
		return 100
	}
	return route.QualityScore
}

func routeCostScore(route ModelRoute) int {
	if route.CostScore <= 0 {
		return 50
	}
	if route.CostScore > 100 {
		return 100
	}
	return route.CostScore
}

func maxInt(left int, right int) int {
	if left > right {
		return left
	}
	return right
}

func routeResourcePriority(route RouteSelection) int {
	if route.Resource == nil || route.Resource.Priority == 0 {
		return 9999
	}
	return route.Resource.Priority
}

func routeResourceID(route RouteSelection) string {
	if route.Resource != nil {
		return route.Resource.ID
	}
	return route.Route.ProviderResourceID
}

func routeSortID(route RouteSelection) string {
	if resourceID := routeResourceID(route); resourceID != "" {
		return route.Route.ID + ":" + resourceID
	}
	return route.Route.ID
}

func routeStrategy(route ModelRoute) string {
	if strings.TrimSpace(route.Strategy) == "" {
		return RouteStrategyBalanced
	}
	strategy := strings.TrimSpace(route.Strategy)
	if strategy == RouteStrategyPriorityWeighted {
		return RouteStrategyBalanced
	}
	return strategy
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

func playgroundRouteAttempts(attempts []RouteAttempt) []PlaygroundRouteAttempt {
	out := make([]PlaygroundRouteAttempt, 0, len(attempts))
	for _, attempt := range attempts {
		out = append(out, PlaygroundRouteAttempt{
			Route:  playgroundRouteSummary(attempt.Selection),
			Status: attempt.Status,
			Code:   attempt.ErrorCode,
			Error:  attempt.Error,
		})
	}
	return out
}

func playgroundRouteSummary(route RouteSelection) PlaygroundRouteSummary {
	summary := PlaygroundRouteSummary{
		RouteID:          route.Route.ID,
		ProviderID:       route.Provider.ID,
		ProviderName:     route.Provider.Name,
		ResourceID:       routeResourceID(route),
		ProviderModel:    route.ProviderModel,
		Priority:         route.Route.Priority,
		ResourcePriority: routeResourcePriority(route),
		Weight:           routeWeight(route.Route),
		QualityScore:     routeQualityScore(route.Route),
		CostScore:        routeCostScore(route.Route),
		Strategy:         routeStrategy(route.Route),
	}
	if route.Resource != nil {
		summary.ResourceName = route.Resource.Name
	}
	return summary
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
	if resourceID := routeResourceID(route); resourceID != "" {
		w.Header().Set("x-tokenhub-provider-resource-id", resourceID)
	}
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
	return s.store.ValidateAPIKey(strings.TrimSpace(strings.TrimPrefix(auth, prefix)), clientIP(r))
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
	if _, ok := s.requireAdmin(w, r, "overview", r.Method); !ok {
		return
	}
	if r.Method != http.MethodGet {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"summary":            s.store.UsageSummary(),
		"projects":           s.store.ListProjects(),
		"providers":          s.store.ListProviders(),
		"provider_resources": s.store.ListProviderResources(),
		"models":             s.store.ListModels(),
		"alerts":             s.store.ListAlerts(),
	})
}

func (s *Server) handleAdminProjects(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireAdmin(w, r, "project", r.Method)
	if !ok {
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
		project := s.store.CreateProject(req)
		s.recordAdminAudit(r, user, "create", "project", project.ID, "", project)
		writeJSON(w, http.StatusCreated, project)
	default:
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
	}
}

func (s *Server) handleAdminProjectNested(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireAdmin(w, r, "project", r.Method)
	if !ok {
		return
	}
	parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/admin/projects/"), "/")
	projectID := parts[0]
	if projectID == "" {
		writeError(w, r, NewHTTPError(400, "project_required", "Project ID is required"))
		return
	}
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
			s.recordAdminAudit(r, user, "update", "project", project.ID, "", project)
			writeJSON(w, http.StatusOK, project)
		case http.MethodDelete:
			if err := s.store.DeleteProject(projectID); err != nil {
				writeError(w, r, err)
				return
			}
			s.recordAdminAudit(r, user, "delete", "project", projectID, "", nil)
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
			Group         string      `json:"group"`
			AllowedModels []string    `json:"allowed_models"`
			IPAllowlist   []string    `json:"ip_allowlist"`
			Limits        QuotaLimits `json:"limits"`
			ExpiresAt     *time.Time  `json:"expires_at"`
		}
		if err := decodeJSON(r, &req); err != nil {
			writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
			return
		}
		payload := map[string]any{
			"project_id":       projectID,
			"name":             req.Name,
			"group":            req.Group,
			"allowed_models":   req.AllowedModels,
			"ip_allowlist":     req.IPAllowlist,
			"limits":           req.Limits,
			"expires_at":       req.ExpiresAt,
			"requested_action": "api_key_create",
		}
		if approval, required := s.approvalRequired(user, "api_key_create", "api_key", "", payload); required {
			s.recordAdminAudit(r, user, "request_approval", "api_key", approval.ID, "", approval)
			writeJSON(w, http.StatusAccepted, map[string]any{"approval_required": true, "approval": approval})
			return
		}
		key, secret, err := s.store.CreateAPIKey(projectID, APIKey{
			Name:        req.Name,
			Group:       req.Group,
			Allowed:     req.AllowedModels,
			IPAllowlist: req.IPAllowlist,
			Limits:      req.Limits,
			ExpiresAt:   req.ExpiresAt,
			Status:      StatusActive,
		}, "")
		if err != nil {
			writeError(w, r, err)
			return
		}
		s.recordAdminAudit(r, user, "create", "api_key", key.ID, "", map[string]any{"project_id": key.ProjectID, "name": key.Name})
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
	actor, ok := s.requireAdmin(w, r, "identity", r.Method)
	if !ok {
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
		s.recordAdminAudit(r, actor, "create", "admin_user", user.ID, "", user)
		writeJSON(w, http.StatusCreated, user)
	default:
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
	}
}

func (s *Server) handleAdminUserItem(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireAdmin(w, r, "identity", r.Method)
	if !ok {
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
		s.recordAdminAudit(r, user, "update", "admin_user", userID, "", user)
		writeJSON(w, http.StatusOK, user)
	case http.MethodDelete:
		if err := s.store.DeleteAdminUser(userID); err != nil {
			writeError(w, r, err)
			return
		}
		s.recordAdminAudit(r, user, "delete", "admin_user", userID, "", nil)
		w.WriteHeader(http.StatusNoContent)
	default:
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
	}
}

func (s *Server) handleAdminAPIKeys(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireAdmin(w, r, "api_key", r.Method); !ok {
		return
	}
	if r.Method != http.MethodGet {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": s.store.ListAPIKeys()})
}

func (s *Server) handleAdminAPIKeyItem(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireAdmin(w, r, "api_key", r.Method)
	if !ok {
		return
	}
	parts := strings.Split(strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/admin/api-keys/"), "/"), "/")
	keyID := parts[0]
	if keyID == "" || len(parts) > 2 {
		writeError(w, r, NewHTTPError(404, "not_found", "Not found"))
		return
	}
	if len(parts) == 2 {
		if parts[1] != "rotate" {
			writeError(w, r, NewHTTPError(404, "not_found", "Not found"))
			return
		}
		if r.Method != http.MethodPost {
			writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
			return
		}
		var req struct {
			GraceUntil *time.Time `json:"grace_until"`
		}
		if r.Body != nil && r.ContentLength != 0 {
			if err := decodeJSON(r, &req); err != nil {
				writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
				return
			}
		}
		key, secret, err := s.store.RotateAPIKey(keyID, req.GraceUntil)
		if err != nil {
			writeError(w, r, err)
			return
		}
		s.recordAdminAudit(r, user, "rotate", "api_key", keyID, "", map[string]any{"new_key_id": key.ID})
		writeJSON(w, http.StatusCreated, map[string]any{
			"id":                      key.ID,
			"api_key":                 secret,
			"name":                    key.Name,
			"project_id":              key.ProjectID,
			"rotated_from_id":         key.RotatedFromID,
			"plain_text_visible_once": true,
		})
		return
	}
	switch r.Method {
	case http.MethodPatch:
		var req APIKey
		if err := decodeJSON(r, &req); err != nil {
			writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
			return
		}
		if approval, required := s.apiKeyUpdateApproval(user, keyID, req); required {
			s.recordAdminAudit(r, user, "request_approval", "api_key", approval.ID, "", approval)
			writeJSON(w, http.StatusAccepted, map[string]any{"approval_required": true, "approval": approval})
			return
		}
		key, err := s.store.UpdateAPIKey(keyID, req)
		if err != nil {
			writeError(w, r, err)
			return
		}
		s.recordAdminAudit(r, user, "update", "api_key", keyID, "", key)
		writeJSON(w, http.StatusOK, key)
	case http.MethodDelete:
		if err := s.store.DeleteAPIKey(keyID); err != nil {
			writeError(w, r, err)
			return
		}
		s.recordAdminAudit(r, user, "delete", "api_key", keyID, "", nil)
		w.WriteHeader(http.StatusNoContent)
	default:
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
	}
}

func (s *Server) handleAdminProviders(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireAdmin(w, r, "provider", r.Method)
	if !ok {
		return
	}
	switch r.Method {
	case http.MethodGet:
		writeJSON(w, http.StatusOK, map[string]any{"data": s.store.ListProviders()})
	case http.MethodPost:
		var req ProviderCreateRequest
		if err := decodeJSON(r, &req); err != nil {
			writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
			return
		}
		provider, catalog, catalogSource, err := s.providerFromCreateRequest(r.Context(), req)
		if err != nil {
			writeError(w, r, err)
			return
		}
		if provider.Name == "" || provider.Type == "" {
			writeError(w, r, NewHTTPError(400, "invalid_provider", "name and type are required"))
			return
		}
		created := s.store.AddProvider(provider)
		result := ProviderCreateResult{
			Provider:      created,
			CatalogSource: catalogSource,
		}
		if shouldCreateProviderRoutes(req, catalog, true) {
			result.CreatedRoutes, result.ModelNames, result.RouteIDs = s.createProviderCatalogRoutes(created.ID, catalog, req)
		}
		s.recordAdminAudit(r, user, "create", "provider", created.ID, "", result)
		writeJSON(w, http.StatusCreated, result)
	default:
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
	}
}

func (s *Server) handleAdminProviderCatalog(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireAdmin(w, r, "provider", r.Method); !ok {
		return
	}
	if r.Method != http.MethodGet {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	refresh := r.URL.Query().Get("refresh") == "true"
	entries, source, err := LoadProviderCatalog(r.Context(), http.DefaultClient, refresh)
	if err != nil {
		writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": entries, "source": source})
}

func (s *Server) handleAdminProviderCatalogItem(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireAdmin(w, r, "provider", r.Method); !ok {
		return
	}
	if r.Method != http.MethodGet {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	id := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/admin/provider-catalog/"), "/")
	if id == "" || strings.Contains(id, "/") {
		writeError(w, r, NewHTTPError(404, "not_found", "Not found"))
		return
	}
	refresh := r.URL.Query().Get("refresh") == "true"
	entry, source, ok, err := GetProviderCatalogEntry(r.Context(), http.DefaultClient, id, refresh)
	if err != nil {
		writeError(w, r, err)
		return
	}
	if !ok {
		writeError(w, r, NewHTTPError(404, "provider_catalog_not_found", "Provider catalog entry not found"))
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": entry, "source": source})
}

func (s *Server) providerFromCreateRequest(ctx context.Context, req ProviderCreateRequest) (Provider, ProviderCatalogEntry, string, error) {
	var catalog ProviderCatalogEntry
	catalogSource := ""
	catalogID := strings.TrimSpace(req.CatalogID)
	if catalogID != "" {
		entry, source, ok, err := GetProviderCatalogEntry(ctx, http.DefaultClient, catalogID, false)
		if err != nil {
			return Provider{}, ProviderCatalogEntry{}, source, err
		}
		if !ok {
			return Provider{}, ProviderCatalogEntry{}, source, NewHTTPError(400, "provider_catalog_not_found", "Provider catalog entry not found")
		}
		catalog = entry
		catalogSource = source
	}
	if catalog.ID == "custom" {
		catalog = s.customProviderCatalogFromStandardModels(req.ModelCategory)
	}
	id := strings.TrimSpace(req.ID)
	if id == "" && catalog.ID != "" && catalog.ID != "custom" {
		id = "prv_" + sanitizeIdentifier(catalog.ID)
	}
	provider := Provider{
		ID:       id,
		Name:     firstNonEmpty(req.Name, catalog.DisplayName, catalog.Name),
		Type:     firstNonEmpty(req.Type, catalog.Type, ProviderOpenAICompatible),
		BaseURL:  firstNonEmpty(req.BaseURL, catalog.BaseURL),
		APIKey:   req.APIKey,
		Status:   firstNonEmpty(req.Status, StatusActive),
		Healthy:  req.Healthy,
		Priority: req.Priority,
		Headers:  req.Headers,
		Options:  req.Options,
	}
	if provider.Priority == 0 {
		provider.Priority = 10
	}
	provider.BaseURL = normalizeProviderBaseURL(provider.ID, provider.BaseURL)
	if provider.Options == nil {
		provider.Options = map[string]string{}
	}
	if catalog.ID != "" {
		provider.Options["catalog_id"] = catalog.ID
		provider.Options["catalog_source"] = catalogSource
		if catalog.DocURL != "" {
			provider.Options["doc_url"] = catalog.DocURL
		}
	}
	if strings.TrimSpace(req.ModelCategory) != "" {
		provider.Options["model_category"] = strings.TrimSpace(req.ModelCategory)
	}
	return provider, catalog, catalogSource, nil
}

func (s *Server) createProviderCatalogRoutes(providerID string, catalog ProviderCatalogEntry, req ProviderCreateRequest) (int, []string, []string) {
	selected := map[string]bool{}
	for _, modelID := range req.SelectedModels {
		modelID = strings.TrimSpace(modelID)
		if modelID != "" {
			selected[modelID] = true
		}
	}
	modelNames := []string{}
	routeIDs := []string{}
	category := strings.TrimSpace(req.ModelCategory)
	standardModelNames := standardModelNameSet(s.store.ListModels())
	existingRoutes := s.store.ListRoutes()
	existingRouteIDs := existingRouteIDSet(existingRoutes)
	routePriorities := routePriorityByModel(existingRoutes)
	for _, catalogModel := range catalog.Models {
		if len(selected) > 0 && !selected[catalogModel.ID] {
			continue
		}
		modelCategory := standardModelCategory(firstNonEmpty(catalogModel.Category, inferModelCategory(catalogModel.ID, catalogModel.DisplayName)))
		if category != "" && category != "all" && modelCategory != category {
			continue
		}
		route := ProviderCatalogModelRoute(providerID, catalogModel)
		if !standardModelNames[normalizeModelLookupName(route.ModelName)] {
			continue
		}
		if existingRouteIDs[route.ID] {
			continue
		}
		route.Priority = takeNextRoutePriority(routePriorities, route.ModelName)
		route = s.store.AddRoute(route)
		existingRouteIDs[route.ID] = true
		routeIDs = append(routeIDs, route.ID)
		modelNames = append(modelNames, route.ModelName)
	}
	return len(routeIDs), modelNames, routeIDs
}

func (s *Server) customProviderCatalogFromStandardModels(category string) ProviderCatalogEntry {
	models := []ProviderCatalogModel{}
	normalizedCategory := standardModelCategory(category)
	for _, model := range s.store.ListModels() {
		modelCategory := standardModelCategory(firstNonEmpty(model.Category, inferModelCategory(model.Name, model.Name)))
		if normalizedCategory != "" && normalizedCategory != "all" && modelCategory != normalizedCategory {
			continue
		}
		models = append(models, ProviderCatalogModel{
			ID:                  model.Name,
			Name:                model.Name,
			DisplayName:         model.Name,
			CanonicalName:       model.Name,
			Category:            modelCategory,
			Family:              model.Family,
			Type:                model.Modality,
			ContextWindow:       model.ContextWindow,
			InputPriceUSDPer1M:  model.InputPriceUSDPer1M,
			OutputPriceUSDPer1M: model.OutputPriceUSDPer1M,
			InputModalities:     append([]string(nil), model.InputModalities...),
			OutputModalities:    append([]string(nil), model.OutputModalities...),
			Capabilities:        append([]string(nil), model.Capabilities...),
			SupportedParameters: append([]string(nil), model.SupportedParameters...),
			Metadata:            map[string]string{"source": "tokenhub-standard-catalog"},
		})
	}
	categories, categoryCounts := catalogCategorySummary(models)
	if len(models) == 0 {
		entry := customProviderCatalogEntry()
		entry.Categories = []string{firstNonEmpty(normalizedCategory, "custom")}
		entry.CategoryCounts = map[string]int{firstNonEmpty(normalizedCategory, "custom"): 0}
		entry.Models = nil
		entry.ModelsCount = 0
		return entry
	}
	entry := customProviderCatalogEntry()
	entry.Categories = categories
	entry.CategoryCounts = categoryCounts
	entry.Models = models
	entry.ModelsCount = len(models)
	return entry
}

func shouldCreateProviderRoutes(req ProviderCreateRequest, catalog ProviderCatalogEntry, isCreate bool) bool {
	if catalog.ID == "" || len(catalog.Models) == 0 {
		return false
	}
	if req.CreateRoutes != nil {
		return *req.CreateRoutes
	}
	return isCreate
}

func standardModelNameSet(models []Model) map[string]bool {
	set := map[string]bool{}
	for _, model := range models {
		for _, name := range []string{model.Name, model.ID} {
			normalized := normalizeModelLookupName(name)
			if normalized != "" {
				set[normalized] = true
			}
		}
	}
	return set
}

func existingRouteIDSet(routes []ModelRoute) map[string]bool {
	set := map[string]bool{}
	for _, route := range routes {
		id := strings.TrimSpace(route.ID)
		if id != "" {
			set[id] = true
		}
	}
	return set
}

func routePriorityByModel(routes []ModelRoute) map[string]int {
	priorities := map[string]int{}
	for _, route := range routes {
		modelName := strings.TrimSpace(route.ModelName)
		if modelName == "" {
			continue
		}
		if route.Priority > priorities[modelName] {
			priorities[modelName] = route.Priority
		}
	}
	return priorities
}

func takeNextRoutePriority(priorities map[string]int, modelName string) int {
	modelName = strings.TrimSpace(modelName)
	next := priorities[modelName] + 1
	if next <= 0 {
		next = 1
	}
	priorities[modelName] = next
	return next
}

func normalizeModelLookupName(value string) string {
	return canonicalModelName(value, value)
}

func (s *Server) handleAdminProviderNested(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireAdmin(w, r, "provider", r.Method)
	if !ok {
		return
	}
	parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/admin/providers/"), "/")
	if len(parts) == 1 {
		switch r.Method {
		case http.MethodPatch:
			var req ProviderCreateRequest
			if err := decodeJSON(r, &req); err != nil {
				writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
				return
			}
			provider, catalog, catalogSource, err := s.providerFromCreateRequest(r.Context(), req)
			if err != nil {
				writeError(w, r, err)
				return
			}
			provider.ID = parts[0]
			updated, err := s.store.UpdateProvider(parts[0], provider)
			if err != nil {
				writeError(w, r, err)
				return
			}
			result := ProviderCreateResult{
				Provider:      updated,
				CatalogSource: catalogSource,
			}
			if shouldCreateProviderRoutes(req, catalog, false) {
				result.CreatedRoutes, result.ModelNames, result.RouteIDs = s.createProviderCatalogRoutes(updated.ID, catalog, req)
			}
			s.recordAdminAudit(r, user, "update", "provider", parts[0], "", result)
			writeJSON(w, http.StatusOK, result)
		case http.MethodDelete:
			if err := s.store.DeleteProvider(parts[0]); err != nil {
				writeError(w, r, err)
				return
			}
			s.recordAdminAudit(r, user, "delete", "provider", parts[0], "", nil)
			w.WriteHeader(http.StatusNoContent)
		default:
			writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		}
		return
	}
	if len(parts) != 2 || (parts[1] != "health" && parts[1] != "test") {
		writeError(w, r, NewHTTPError(404, "not_found", "Not found"))
		return
	}
	if r.Method != http.MethodPost {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	if parts[1] == "test" {
		provider, err := s.store.TestProvider(parts[0])
		if err != nil {
			writeError(w, r, err)
			return
		}
		s.recordAdminAudit(r, user, "test", "provider", parts[0], "", map[string]any{"healthy": provider.Healthy})
		writeJSON(w, http.StatusOK, provider)
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
	s.recordAdminAudit(r, user, "health", "provider", parts[0], "", provider)
	writeJSON(w, http.StatusOK, provider)
}

func (s *Server) handleAdminProviderResources(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireAdmin(w, r, "provider", r.Method)
	if !ok {
		return
	}
	switch r.Method {
	case http.MethodGet:
		writeJSON(w, http.StatusOK, map[string]any{"data": s.store.ListProviderResources()})
	case http.MethodPost:
		var req ProviderResource
		if err := decodeJSON(r, &req); err != nil {
			writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
			return
		}
		if req.ProviderID == "" || req.Name == "" {
			writeError(w, r, NewHTTPError(400, "invalid_provider_resource", "provider_id and name are required"))
			return
		}
		resource, err := s.store.AddProviderResource(req)
		if err != nil {
			writeError(w, r, err)
			return
		}
		s.recordAdminAudit(r, user, "create", "provider_resource", resource.ID, "", resource)
		writeJSON(w, http.StatusCreated, resource)
	default:
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
	}
}

func (s *Server) handleAdminProviderResourceNested(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireAdmin(w, r, "provider", r.Method)
	if !ok {
		return
	}
	parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/admin/provider-resources/"), "/")
	if len(parts) == 1 && parts[0] == "bulk" {
		s.handleAdminProviderResourceBulk(w, r, user)
		return
	}
	if len(parts) == 1 && parts[0] == "import" {
		s.handleAdminProviderResourceImport(w, r, user)
		return
	}
	if len(parts) == 1 {
		switch r.Method {
		case http.MethodPatch:
			var req ProviderResource
			if err := decodeJSON(r, &req); err != nil {
				writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
				return
			}
			resource, err := s.store.UpdateProviderResource(parts[0], req)
			if err != nil {
				writeError(w, r, err)
				return
			}
			s.recordAdminAudit(r, user, "update", "provider_resource", parts[0], "", resource)
			writeJSON(w, http.StatusOK, resource)
		case http.MethodDelete:
			if err := s.store.DeleteProviderResource(parts[0]); err != nil {
				writeError(w, r, err)
				return
			}
			s.recordAdminAudit(r, user, "delete", "provider_resource", parts[0], "", nil)
			w.WriteHeader(http.StatusNoContent)
		default:
			writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		}
		return
	}
	if len(parts) != 2 || (parts[1] != "health" && parts[1] != "test") {
		writeError(w, r, NewHTTPError(404, "not_found", "Not found"))
		return
	}
	if r.Method != http.MethodPost {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	if parts[1] == "test" {
		resource, err := s.store.TestProviderResource(parts[0])
		if err != nil {
			writeError(w, r, err)
			return
		}
		s.recordAdminAudit(r, user, "test", "provider_resource", parts[0], "", map[string]any{"healthy": resource.Healthy})
		writeJSON(w, http.StatusOK, resource)
		return
	}
	var req struct {
		Healthy bool `json:"healthy"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
		return
	}
	resource, err := s.store.SetProviderResourceHealth(parts[0], req.Healthy)
	if err != nil {
		writeError(w, r, err)
		return
	}
	s.recordAdminAudit(r, user, "health", "provider_resource", parts[0], "", resource)
	writeJSON(w, http.StatusOK, resource)
}

func (s *Server) handleAdminProviderResourceBulk(w http.ResponseWriter, r *http.Request, user AdminUser) {
	if r.Method != http.MethodPost {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	var req struct {
		Action string   `json:"action"`
		IDs    []string `json:"ids"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
		return
	}
	result, err := s.store.BulkOperateProviderResources(req.Action, req.IDs)
	if err != nil {
		writeError(w, r, err)
		return
	}
	s.recordAdminAudit(r, user, "bulk_"+req.Action, "provider_resource", strings.Join(req.IDs, ","), "", result)
	writeJSON(w, http.StatusOK, result)
}

func (s *Server) handleAdminProviderResourceImport(w http.ResponseWriter, r *http.Request, user AdminUser) {
	if r.Method != http.MethodPost {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	var req struct {
		Resources []ProviderResource `json:"resources"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
		return
	}
	result, err := s.store.ImportProviderResources(req.Resources)
	if err != nil {
		writeError(w, r, err)
		return
	}
	s.recordAdminAudit(r, user, "import", "provider_resource", "", "", result)
	status := http.StatusCreated
	if result.Failed > 0 {
		status = http.StatusMultiStatus
	}
	writeJSON(w, status, result)
}

func (s *Server) handleAdminModels(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireAdmin(w, r, "model", r.Method)
	if !ok {
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
		s.recordAdminAudit(r, user, "create", "model", model.Name, "", model)
		writeJSON(w, http.StatusCreated, model)
	default:
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
	}
}

func (s *Server) handleAdminModelItem(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireAdmin(w, r, "model", r.Method)
	if !ok {
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
		s.recordAdminAudit(r, user, "update", "model", modelName, "", model)
		writeJSON(w, http.StatusOK, model)
	case http.MethodDelete:
		if err := s.store.DeleteModel(modelName); err != nil {
			writeError(w, r, err)
			return
		}
		s.recordAdminAudit(r, user, "delete", "model", modelName, "", nil)
		w.WriteHeader(http.StatusNoContent)
	default:
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
	}
}

func (s *Server) handleAdminRoutes(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireAdmin(w, r, "routing", r.Method)
	if !ok {
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
		if req.Priority <= 0 {
			req.Priority = takeNextRoutePriority(routePriorityByModel(s.store.ListRoutes()), req.ModelName)
		}
		route := s.store.AddRoute(req)
		s.recordAdminAudit(r, user, "create", "routing_rule", route.ID, "", route)
		writeJSON(w, http.StatusCreated, route)
	default:
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
	}
}

func (s *Server) handleAdminRouteItem(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireAdmin(w, r, "routing", r.Method)
	if !ok {
		return
	}
	parts := strings.Split(strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/admin/routing-rules/"), "/"), "/")
	routeID := parts[0]
	if routeID == "" || len(parts) > 2 {
		writeError(w, r, NewHTTPError(404, "not_found", "Not found"))
		return
	}
	if len(parts) == 2 {
		if parts[1] != "explain" {
			writeError(w, r, NewHTTPError(404, "not_found", "Not found"))
			return
		}
		if r.Method != http.MethodGet {
			writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
			return
		}
		modelName := r.URL.Query().Get("model")
		if modelName == "" {
			writeError(w, r, NewHTTPError(400, "missing_model", "model query is required"))
			return
		}
		routes, err := s.store.SelectRouteCandidates(modelName)
		if err != nil {
			writeError(w, r, err)
			return
		}
		call := CallContext{RequestID: NewID("exp"), Project: Project{ID: r.URL.Query().Get("project_id")}, Key: APIKey{ID: r.URL.Query().Get("api_key_id")}}
		planned := s.planRouteOrder(call, routes)
		steps := make([]RouteExplainStep, 0, len(planned))
		for _, route := range planned {
			steps = append(steps, RouteExplainStep{
				RouteID:          route.Route.ID,
				ProviderID:       route.Provider.ID,
				ResourceID:       routeResourceID(route),
				ProviderModel:    route.ProviderModel,
				Priority:         route.Route.Priority,
				ResourcePriority: routeResourcePriority(route),
				Weight:           routeWeight(route.Route),
				QualityScore:     routeQualityScore(route.Route),
				CostScore:        routeCostScore(route.Route),
				Strategy:         routeStrategy(route.Route),
				Status:           "candidate",
			})
		}
		writeJSON(w, http.StatusOK, map[string]any{"data": steps})
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
		s.recordAdminAudit(r, user, "update", "routing_rule", routeID, "", route)
		writeJSON(w, http.StatusOK, route)
	case http.MethodDelete:
		if err := s.store.DeleteRoute(routeID); err != nil {
			writeError(w, r, err)
			return
		}
		s.recordAdminAudit(r, user, "delete", "routing_rule", routeID, "", nil)
		w.WriteHeader(http.StatusNoContent)
	default:
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
	}
}

func (s *Server) handleAdminResources(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireAdmin(w, r, adminResourcePermission(r.URL.Path), r.Method)
	if !ok {
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
			if approval, required := s.adminResourceApproval(user, kind, "", req); required {
				s.recordAdminAudit(r, user, "request_approval", kind, approval.ID, "", approval)
				writeJSON(w, http.StatusAccepted, map[string]any{"approval_required": true, "approval": approval})
				return
			}
			resource := s.store.CreateResource(kind, req)
			s.recordAdminAudit(r, user, "create", kind, resource.ID, "", resource)
			writeJSON(w, http.StatusCreated, resource)
		default:
			writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		}
		return
	}
	if kind == "invoices" && len(parts) == 3 && parts[1] != "" {
		s.handleAdminInvoiceAction(w, r, user, parts[1], parts[2])
		return
	}
	if kind == "monitors" && len(parts) == 3 && parts[1] != "" && parts[2] == "run" {
		s.handleAdminMonitorRun(w, r, user, parts[1])
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
		if approval, required := s.adminResourceApproval(user, kind, parts[1], req); required {
			s.recordAdminAudit(r, user, "request_approval", kind, approval.ID, "", approval)
			writeJSON(w, http.StatusAccepted, map[string]any{"approval_required": true, "approval": approval})
			return
		}
		resource, err := s.store.UpdateResource(kind, parts[1], req)
		if err != nil {
			writeError(w, r, err)
			return
		}
		s.recordAdminAudit(r, user, "update", kind, parts[1], "", resource)
		writeJSON(w, http.StatusOK, resource)
	case http.MethodDelete:
		if err := s.store.DeleteResource(kind, parts[1]); err != nil {
			writeError(w, r, err)
			return
		}
		s.recordAdminAudit(r, user, "delete", kind, parts[1], "", nil)
		w.WriteHeader(http.StatusNoContent)
	default:
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
	}
}

func (s *Server) handleAdminMonitorRun(w http.ResponseWriter, r *http.Request, user AdminUser, monitorID string) {
	if r.Method != http.MethodPost {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	result, err := s.store.RunMonitor(monitorID)
	if err != nil {
		writeError(w, r, err)
		return
	}
	s.recordAdminAudit(r, user, "run", "monitor", monitorID, "", result)
	writeJSON(w, http.StatusOK, result)
}

func (s *Server) handleAdminSQLiteBackups(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireAdmin(w, r, "backup", r.Method)
	if !ok {
		return
	}
	switch r.Method {
	case http.MethodGet:
		writeJSON(w, http.StatusOK, map[string]any{"data": s.store.ListSQLiteBackups()})
	case http.MethodPost:
		var req struct {
			ExpireDays int `json:"expire_days"`
		}
		if r.Body != nil && r.ContentLength != 0 {
			if err := decodeJSON(r, &req); err != nil {
				writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
				return
			}
		}
		backup, err := s.store.CreateSQLiteBackup(user.ID, req.ExpireDays)
		if err != nil {
			writeError(w, r, err)
			return
		}
		s.recordAdminAudit(r, user, "create", "sqlite_backup", backup.ID, "", backup)
		writeJSON(w, http.StatusCreated, backup)
	default:
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
	}
}

func (s *Server) handleAdminSQLiteBackupItem(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireAdmin(w, r, "backup", r.Method)
	if !ok {
		return
	}
	parts := strings.Split(strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/admin/sqlite/backups/"), "/"), "/")
	if len(parts) == 0 || parts[0] == "" || len(parts) > 2 {
		writeError(w, r, NewHTTPError(404, "not_found", "Not found"))
		return
	}
	backupID := parts[0]
	if len(parts) == 1 {
		switch r.Method {
		case http.MethodGet:
			backup, err := s.store.GetSQLiteBackup(backupID)
			if err != nil {
				writeError(w, r, err)
				return
			}
			writeJSON(w, http.StatusOK, backup)
		case http.MethodDelete:
			before, _ := s.store.GetSQLiteBackup(backupID)
			if err := s.store.DeleteSQLiteBackup(backupID); err != nil {
				writeError(w, r, err)
				return
			}
			s.recordAdminAudit(r, user, "delete", "sqlite_backup", backupID, before, nil)
			w.WriteHeader(http.StatusNoContent)
		default:
			writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		}
		return
	}
	switch parts[1] {
	case "download":
		if r.Method != http.MethodGet {
			writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
			return
		}
		backup, err := s.store.GetSQLiteBackup(backupID)
		if err != nil {
			writeError(w, r, err)
			return
		}
		if backup.Status != "ready" && backup.Status != "restored" {
			writeError(w, r, NewHTTPError(409, "backup_not_ready", "Backup is not ready to download"))
			return
		}
		if _, err := os.Stat(backup.FilePath); err != nil {
			writeError(w, r, NewHTTPError(404, "backup_file_missing", "Backup file is missing"))
			return
		}
		w.Header().Set("content-type", "application/vnd.sqlite3")
		w.Header().Set("content-disposition", `attachment; filename="`+backup.FileName+`"`)
		http.ServeFile(w, r, backup.FilePath)
		s.recordAdminAudit(r, user, "download", "sqlite_backup", backupID, "", map[string]any{"file_name": backup.FileName})
	case "restore":
		if r.Method != http.MethodPost {
			writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
			return
		}
		var req struct {
			Confirmation string `json:"confirmation"`
		}
		if err := decodeJSON(r, &req); err != nil {
			writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
			return
		}
		if strings.TrimSpace(req.Confirmation) != "RESTORE "+backupID {
			writeError(w, r, NewHTTPError(400, "invalid_restore_confirmation", "Restore confirmation is invalid"))
			return
		}
		before, _ := s.store.GetSQLiteBackup(backupID)
		backup, err := s.store.RestoreSQLiteBackup(backupID, user.ID)
		if err != nil {
			writeError(w, r, err)
			return
		}
		s.recordAdminAudit(r, user, "restore", "sqlite_backup", backupID, before, backup)
		writeJSON(w, http.StatusOK, backup)
	default:
		writeError(w, r, NewHTTPError(404, "not_found", "Not found"))
	}
}

func (s *Server) handleAdminInvoiceAction(w http.ResponseWriter, r *http.Request, user AdminUser, invoiceID string, action string) {
	if action != "confirm" && action != "reject" {
		writeError(w, r, NewHTTPError(404, "not_found", "Not found"))
		return
	}
	if r.Method != http.MethodPost {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	var req struct {
		InvoiceNote  string `json:"invoice_note"`
		RejectReason string `json:"reject_reason"`
	}
	if r.Body != nil && r.ContentLength != 0 {
		if err := decodeJSON(r, &req); err != nil {
			writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
			return
		}
	}
	invoice, err := s.findResource("invoices", invoiceID)
	if err != nil {
		writeError(w, r, err)
		return
	}
	payload := invoiceDecisionPayload(invoice, action, req.InvoiceNote, req.RejectReason)
	if approval, required := s.approvalRequired(user, "invoice_"+action, "invoices", invoiceID, payload); required {
		s.recordAdminAudit(r, user, "request_approval", "invoices", approval.ID, "", approval)
		writeJSON(w, http.StatusAccepted, map[string]any{"approval_required": true, "approval": approval})
		return
	}
	updated, err := s.applyInvoiceDecision(invoice, action, user, req.InvoiceNote, req.RejectReason)
	if err != nil {
		writeError(w, r, err)
		return
	}
	s.recordAdminAudit(r, user, action, "invoices", invoiceID, invoice, updated)
	writeJSON(w, http.StatusOK, updated)
}

func (s *Server) handleAdminUsageSummary(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireAdmin(w, r, "usage", r.Method); !ok {
		return
	}
	if r.Method != http.MethodGet {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	writeJSON(w, http.StatusOK, s.store.UsageSummary())
}

func (s *Server) handleAdminUsageBreakdown(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireAdmin(w, r, "usage", r.Method); !ok {
		return
	}
	if r.Method != http.MethodGet {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	writeJSON(w, http.StatusOK, s.store.UsageBreakdown())
}

func (s *Server) handleAdminUsageTimeseries(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireAdmin(w, r, "usage", r.Method); !ok {
		return
	}
	if r.Method != http.MethodGet {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": s.store.UsageTimeseries(31)})
}

func (s *Server) handleAdminGenerateBilling(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireAdmin(w, r, "usage", r.Method)
	if !ok {
		return
	}
	if r.Method != http.MethodPost {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	var req struct {
		Period string `json:"period"`
	}
	if r.Body != nil && r.ContentLength != 0 {
		if err := decodeJSON(r, &req); err != nil {
			writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
			return
		}
	}
	result, err := s.store.GenerateBillingPeriod(req.Period)
	if err != nil {
		writeError(w, r, err)
		return
	}
	s.recordAdminAudit(r, user, "generate", "billing", stringifyCSV(result["period"]), "", result)
	writeJSON(w, http.StatusOK, result)
}

func (s *Server) handleAdminRequestLogs(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireAdmin(w, r, "audit", r.Method); !ok {
		return
	}
	if r.Method != http.MethodGet {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": s.store.ListRequestLogs()})
}

func (s *Server) handleAdminRequestDetail(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireAdmin(w, r, "audit", r.Method); !ok {
		return
	}
	if r.Method != http.MethodGet {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	requestID := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/admin/audit/requests/"), "/")
	if requestID == "" || strings.Contains(requestID, "/") {
		writeError(w, r, NewHTTPError(404, "not_found", "Not found"))
		return
	}
	detail, err := s.store.GetRequestDetail(requestID)
	if err != nil {
		writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, detail)
}

func (s *Server) handleAdminAuditEvents(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireAdmin(w, r, "audit", r.Method); !ok {
		return
	}
	if r.Method != http.MethodGet {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": s.store.ListAuditEvents()})
}

func (s *Server) handleAdminExport(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireAdmin(w, r, "usage", r.Method)
	if !ok {
		return
	}
	if r.Method != http.MethodGet {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	kind := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/admin/export/"), "/")
	if kind == "" || strings.Contains(kind, "/") {
		writeError(w, r, NewHTTPError(404, "not_found", "Not found"))
		return
	}
	periodFilter := normalizeExportPeriod(r.URL.Query().Get("period"))
	w.Header().Set("content-type", "text/csv; charset=utf-8")
	w.Header().Set("content-disposition", `attachment; filename="tokenhub-`+kind+`.csv"`)
	writer := csv.NewWriter(w)
	switch kind {
	case "requests":
		_ = writer.Write([]string{"created_at", "request_id", "project_id", "api_key_id", "model", "provider_id", "provider_resource_id", "status_code", "error_code", "latency_ms"})
		for _, item := range s.store.ListRequestLogs() {
			_ = writer.Write([]string{
				item.CreatedAt.Format(time.RFC3339),
				item.RequestID,
				item.ProjectID,
				item.APIKeyID,
				item.ModelName,
				item.ProviderID,
				item.ProviderResourceID,
				strconv.Itoa(item.StatusCode),
				item.ErrorCode,
				strconv.FormatInt(item.LatencyMS, 10),
			})
		}
	case "usage":
		_ = writer.Write([]string{"dimension", "id", "request_count", "input_tokens", "output_tokens", "total_tokens", "estimated_cost_usd"})
		breakdown := s.store.UsageBreakdown()
		if periodFilter != "" {
			breakdown = s.store.UsageBreakdownForPeriod(periodFilter)
		}
		for _, dimension := range []string{"projects", "models", "providers", "provider_resources", "cost_centers"} {
			rows, _ := breakdown[dimension].([]map[string]any)
			for _, row := range rows {
				_ = writer.Write([]string{
					dimension,
					stringifyCSV(row["id"]),
					stringifyCSV(row["request_count"]),
					stringifyCSV(row["input_tokens"]),
					stringifyCSV(row["output_tokens"]),
					stringifyCSV(row["total_tokens"]),
					stringifyCSV(row["estimated_cost_usd"]),
				})
			}
		}
	case "cost-centers":
		s.writeResourceExport(writer, "cost-centers", "", []resourceExportColumn{
			{Header: "code", Field: "code"},
			{Header: "name", Source: "name"},
			{Header: "department", Field: "department"},
			{Header: "owner", Field: "owner"},
			{Header: "monthly_budget_usd", Field: "monthly_budget_usd"},
			{Header: "status", Source: "status"},
			{Header: "updated_at", Source: "updated_at"},
		})
	case "budgets":
		s.writeResourceExport(writer, "budgets", periodFilter, []resourceExportColumn{
			{Header: "name", Source: "name"},
			{Header: "scope", Field: "scope"},
			{Header: "scope_id", Field: "scope_id"},
			{Header: "period", Field: "period"},
			{Header: "period_ref", Field: "period_ref"},
			{Header: "amount_usd", Field: "amount_usd"},
			{Header: "warn_percent", Field: "warn_percent"},
			{Header: "used_usd", Field: "used_usd"},
			{Header: "remaining_usd", Field: "remaining_usd"},
			{Header: "usage_percent", Field: "usage_percent"},
			{Header: "status", Source: "status"},
			{Header: "updated_at", Source: "updated_at"},
		})
	case "chargebacks":
		s.writeResourceExport(writer, "chargebacks", periodFilter, []resourceExportColumn{
			{Header: "period", Field: "period"},
			{Header: "cost_center", Field: "cost_center"},
			{Header: "team_id", Field: "team_id"},
			{Header: "project_id", Field: "project_id"},
			{Header: "allocated_cost_usd", Field: "allocated_cost_usd"},
			{Header: "request_count", Field: "request_count"},
			{Header: "input_tokens", Field: "input_tokens"},
			{Header: "output_tokens", Field: "output_tokens"},
			{Header: "total_tokens", Field: "total_tokens"},
			{Header: "allocation_rule", Field: "allocation_rule"},
			{Header: "status", Source: "status"},
			{Header: "updated_at", Source: "updated_at"},
		})
	case "invoices":
		s.writeResourceExport(writer, "invoices", periodFilter, []resourceExportColumn{
			{Header: "period", Field: "period"},
			{Header: "cost_center", Field: "cost_center"},
			{Header: "amount_usd", Field: "amount_usd"},
			{Header: "invoice_note", Field: "invoice_note"},
			{Header: "confirmed_by", Field: "confirmed_by"},
			{Header: "confirmed_at", Field: "confirmed_at"},
			{Header: "reject_reason", Field: "reject_reason"},
			{Header: "status", Source: "status"},
			{Header: "updated_at", Source: "updated_at"},
		})
	case "approvals":
		_ = writer.Write([]string{"created_at", "id", "trigger", "resource_type", "resource_id", "requester", "status", "decided_by", "decided_at", "reason"})
		for _, item := range s.store.ListApprovalRequests() {
			decidedAt := ""
			if item.DecidedAt != nil {
				decidedAt = item.DecidedAt.Format(time.RFC3339)
			}
			_ = writer.Write([]string{
				item.CreatedAt.Format(time.RFC3339),
				item.ID,
				item.Trigger,
				item.ResourceType,
				item.ResourceID,
				item.Requester,
				item.Status,
				item.DecidedBy,
				decidedAt,
				item.Reason,
			})
		}
	case "audit-events":
		_ = writer.Write([]string{"created_at", "actor_user_id", "actor_name", "actor_role", "action", "resource_type", "resource_id", "status", "message", "ip"})
		for _, item := range s.store.ListAuditEvents() {
			_ = writer.Write([]string{
				item.CreatedAt.Format(time.RFC3339),
				item.ActorUserID,
				item.ActorName,
				item.ActorRole,
				item.Action,
				item.ResourceType,
				item.ResourceID,
				item.Status,
				item.Message,
				item.IP,
			})
		}
	case "alert-deliveries":
		_ = writer.Write([]string{"created_at", "alert_id", "channel_id", "channel", "target", "status", "status_code", "error"})
		for _, item := range s.store.ListAlertDeliveries() {
			_ = writer.Write([]string{
				item.CreatedAt.Format(time.RFC3339),
				item.AlertID,
				item.ChannelID,
				item.Channel,
				item.Target,
				item.Status,
				strconv.Itoa(item.StatusCode),
				item.Error,
			})
		}
	default:
		items := s.store.ListResources(kind)
		_ = writer.Write([]string{"id", "kind", "name", "status", "description", "fields", "updated_at"})
		for _, item := range items {
			_ = writer.Write([]string{
				item.ID,
				item.Kind,
				item.Name,
				item.Status,
				item.Description,
				snapshotJSON(item.Fields),
				item.UpdatedAt.Format(time.RFC3339),
			})
		}
	}
	writer.Flush()
	s.recordAdminAudit(r, user, "export", kind, "", "", map[string]any{"format": "csv", "period": periodFilter})
}

func (s *Server) handleAdminAlerts(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireAdmin(w, r, "alert", r.Method); !ok {
		return
	}
	if r.Method != http.MethodGet {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": s.store.ListAlerts()})
}

func (s *Server) handleAdminAlertItem(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireAdmin(w, r, "alert", r.Method)
	if !ok {
		return
	}
	parts := strings.Split(strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/admin/alerts/"), "/"), "/")
	if len(parts) != 2 || parts[0] == "" || parts[1] != "deliver" {
		writeError(w, r, NewHTTPError(404, "not_found", "Not found"))
		return
	}
	if r.Method != http.MethodPost {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	var req struct {
		ChannelID string `json:"channel_id"`
	}
	if r.Body != nil && r.ContentLength != 0 {
		if err := decodeJSON(r, &req); err != nil {
			writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
			return
		}
	}
	delivery, err := s.deliverAlert(r.Context(), parts[0], req.ChannelID)
	if err != nil {
		writeError(w, r, err)
		return
	}
	s.recordAdminAudit(r, user, "deliver", "alert", parts[0], "", delivery)
	writeJSON(w, http.StatusOK, delivery)
}

func (s *Server) handleAdminAlertDeliveries(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireAdmin(w, r, "alert", r.Method); !ok {
		return
	}
	if r.Method != http.MethodGet {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": s.store.ListAlertDeliveries()})
}

func (s *Server) handleAdminApprovals(w http.ResponseWriter, r *http.Request) {
	if _, ok := s.requireAdmin(w, r, "approval", r.Method); !ok {
		return
	}
	if r.Method != http.MethodGet {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": s.store.ListApprovalRequests()})
}

func (s *Server) handleAdminApprovalItem(w http.ResponseWriter, r *http.Request) {
	user, ok := s.requireAdmin(w, r, "approval", r.Method)
	if !ok {
		return
	}
	parts := strings.Split(strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/admin/approvals/"), "/"), "/")
	if len(parts) != 2 || parts[0] == "" || (parts[1] != "approve" && parts[1] != "reject") {
		writeError(w, r, NewHTTPError(404, "not_found", "Not found"))
		return
	}
	if r.Method != http.MethodPost {
		writeError(w, r, NewHTTPError(405, "method_not_allowed", "Method not allowed"))
		return
	}
	var req struct {
		Reason string `json:"reason"`
	}
	if r.Body != nil && r.ContentLength != 0 {
		if err := decodeJSON(r, &req); err != nil {
			writeError(w, r, NewHTTPError(400, "invalid_request", err.Error()))
			return
		}
	}
	status := "approved"
	if parts[1] == "reject" {
		status = "rejected"
	}
	pending, err := s.store.GetApprovalRequest(parts[0])
	if err != nil {
		writeError(w, r, err)
		return
	}
	if err := s.requireApprovalRole(pending, user); err != nil {
		writeError(w, r, err)
		return
	}
	var result any
	if status == "approved" {
		result, err = s.applyApprovalRequest(pending, user)
		if err != nil {
			writeError(w, r, err)
			return
		}
		s.recordAdminAudit(r, user, "apply_approval", pending.ResourceType, pending.ResourceID, pending, result)
	}
	item, err := s.store.UpdateApprovalRequestStatus(parts[0], status, user.ID, req.Reason)
	if err != nil {
		writeError(w, r, err)
		return
	}
	s.recordAdminAudit(r, user, status, "approval", item.ID, "", item)
	writeJSON(w, http.StatusOK, map[string]any{"approval": item, "result": result})
}

func (s *Server) requireApprovalRole(request ApprovalRequest, user AdminUser) error {
	if strings.TrimSpace(request.FlowID) == "" {
		return nil
	}
	flow, err := s.findResource("approval-flows", request.FlowID)
	if err != nil {
		return err
	}
	required := strings.TrimSpace(stringField(flow.Fields, "approver_role"))
	if required == "" {
		return nil
	}
	if !adminRoleMatches(user.Role, required) {
		return NewHTTPError(http.StatusForbidden, "approval_role_forbidden", "Admin role is not allowed to decide this approval")
	}
	return nil
}

func (s *Server) approvalRequired(user AdminUser, trigger string, resourceType string, resourceID string, payload any) (ApprovalRequest, bool) {
	flow, ok := s.matchApprovalFlow(trigger, payload)
	if !ok {
		return ApprovalRequest{}, false
	}
	request := ApprovalRequest{
		FlowID:       flow.ID,
		Trigger:      trigger,
		ResourceType: resourceType,
		ResourceID:   resourceID,
		RequesterID:  user.ID,
		Requester:    user.Name,
		Status:       "pending",
		Payload:      snapshotJSON(payload),
	}
	return s.store.CreateApprovalRequest(request), true
}

func (s *Server) matchApprovalFlow(trigger string, payload any) (AdminResource, bool) {
	flows := s.store.ListResources("approval-flows")
	payloadCost := approvalPayloadCost(payload)
	for _, flow := range flows {
		if flow.Status != StatusActive {
			continue
		}
		if strings.TrimSpace(stringField(flow.Fields, "trigger")) != trigger {
			continue
		}
		threshold := float64Field(flow.Fields, "threshold_usd")
		if threshold > 0 && payloadCost > 0 && payloadCost < threshold {
			continue
		}
		return flow, true
	}
	return AdminResource{}, false
}

func (s *Server) apiKeyUpdateApproval(user AdminUser, keyID string, patch APIKey) (ApprovalRequest, bool) {
	trigger := ""
	if patch.Limits != (QuotaLimits{}) {
		trigger = "quota_increase"
	}
	if trigger == "" && len(patch.Allowed) > 0 {
		trigger = "model_access"
	}
	if trigger == "" {
		return ApprovalRequest{}, false
	}
	payload := map[string]any{
		"api_key_id":       keyID,
		"requested_action": trigger,
		"allowed_models":   patch.Allowed,
		"limits":           patch.Limits,
		"status":           patch.Status,
	}
	return s.approvalRequired(user, trigger, "api_key", keyID, payload)
}

func (s *Server) adminResourceApproval(user AdminUser, kind string, resourceID string, resource AdminResource) (ApprovalRequest, bool) {
	trigger := ""
	switch kind {
	case "budgets":
		trigger = "budget_change"
	case "quota-policies":
		trigger = "quota_increase"
	default:
		return ApprovalRequest{}, false
	}
	payload := map[string]any{
		"kind":             kind,
		"resource_id":      resourceID,
		"name":             resource.Name,
		"description":      resource.Description,
		"status":           resource.Status,
		"fields":           resource.Fields,
		"requested_action": trigger,
	}
	return s.approvalRequired(user, trigger, kind, resourceID, payload)
}

func approvalPayloadCost(payload any) float64 {
	switch typed := payload.(type) {
	case map[string]any:
		if fields, ok := typed["fields"].(map[string]any); ok {
			if amount := float64Field(fields, "amount_usd"); amount > 0 {
				return amount
			}
		}
		if limits, ok := typed["limits"].(QuotaLimits); ok {
			return limits.MonthlyCostUSD
		}
		if limits, ok := typed["limits"].(map[string]any); ok {
			if amount := float64Field(limits, "monthly_cost_usd"); amount > 0 {
				return amount
			}
			return float64Field(limits, "daily_cost_usd")
		}
	}
	return 0
}

func (s *Server) deliverAlert(ctx context.Context, alertID string, channelID string) (AlertDelivery, error) {
	alert, err := s.store.GetAlert(alertID)
	if err != nil {
		return AlertDelivery{}, err
	}
	channel, err := s.resolveNotificationChannel(channelID)
	if err != nil {
		return AlertDelivery{}, err
	}
	payload := map[string]any{
		"source":     "tokenhub",
		"alert":      alert,
		"channel":    channel.Name,
		"sent_at":    time.Now().UTC().Format(time.RFC3339),
		"severity":   alert.Severity,
		"scope":      alert.ScopeType,
		"scope_id":   alert.ScopeID,
		"message":    alert.Message,
		"event_code": alert.Code,
	}
	delivery := AlertDelivery{
		AlertID:   alert.ID,
		ChannelID: channel.ID,
		Channel:   stringField(channel.Fields, "type"),
		Target:    stringField(channel.Fields, "webhook_url"),
		Status:    "success",
		Payload:   snapshotJSON(payload),
	}
	if delivery.Channel == "" {
		delivery.Channel = "webhook"
	}
	if delivery.Channel != "webhook" {
		delivery.Status = "failed"
		delivery.Error = "only webhook notification channels are implemented"
		return s.store.RecordAlertDelivery(delivery), nil
	}
	if delivery.Target == "" {
		delivery.Status = "failed"
		delivery.Error = "webhook_url is required"
		return s.store.RecordAlertDelivery(delivery), nil
	}
	body, _ := json.Marshal(payload)
	reqCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(reqCtx, http.MethodPost, delivery.Target, bytes.NewReader(body))
	if err != nil {
		delivery.Status = "failed"
		delivery.Error = err.Error()
		return s.store.RecordAlertDelivery(delivery), nil
	}
	req.Header.Set("content-type", "application/json")
	resp, err := (&http.Client{Timeout: 5 * time.Second}).Do(req)
	if err != nil {
		delivery.Status = "failed"
		delivery.Error = err.Error()
		return s.store.RecordAlertDelivery(delivery), nil
	}
	defer resp.Body.Close()
	delivery.StatusCode = resp.StatusCode
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		delivery.Status = "failed"
		delivery.Error = resp.Status
	}
	return s.store.RecordAlertDelivery(delivery), nil
}

func (s *Server) resolveNotificationChannel(channelID string) (AdminResource, error) {
	channels := s.store.ListResources("notification-channels")
	var fallback *AdminResource
	for i := range channels {
		channel := channels[i]
		if channel.Status != StatusActive {
			continue
		}
		if channelID != "" && channel.ID == channelID {
			return channel, nil
		}
		if fallback == nil {
			copy := channel
			fallback = &copy
		}
	}
	if channelID != "" {
		return AdminResource{}, NewHTTPError(404, "notification_channel_not_found", "Notification channel not found")
	}
	if fallback == nil {
		return AdminResource{}, NewHTTPError(404, "notification_channel_not_found", "No active notification channel")
	}
	return *fallback, nil
}

func (s *Server) applyApprovalRequest(request ApprovalRequest, actor AdminUser) (any, error) {
	if request.Status != "pending" {
		return nil, NewHTTPError(http.StatusConflict, "approval_already_decided", "Approval request has already been decided")
	}
	payload := map[string]any{}
	if request.Payload != "" {
		if err := json.Unmarshal([]byte(request.Payload), &payload); err != nil {
			return nil, NewHTTPError(http.StatusBadRequest, "invalid_approval_payload", "Approval payload is invalid")
		}
	}
	switch {
	case request.Trigger == "api_key_create":
		projectID := stringFromPayload(payload, "project_id")
		key, secret, err := s.store.CreateAPIKey(projectID, APIKey{
			Name:        stringFromPayload(payload, "name"),
			Group:       stringFromPayload(payload, "group"),
			Allowed:     stringSliceFromPayload(payload["allowed_models"]),
			IPAllowlist: stringSliceFromPayload(payload["ip_allowlist"]),
			Limits:      quotaLimitsFromPayload(payload["limits"]),
			Status:      StatusActive,
		}, "")
		if err != nil {
			return nil, err
		}
		return map[string]any{
			"id":                      key.ID,
			"api_key":                 secret,
			"name":                    key.Name,
			"project_id":              key.ProjectID,
			"plain_text_visible_once": true,
		}, nil
	case request.ResourceType == "api_key":
		key, err := s.store.UpdateAPIKey(request.ResourceID, APIKey{
			Allowed:     stringSliceFromPayload(payload["allowed_models"]),
			IPAllowlist: stringSliceFromPayload(payload["ip_allowlist"]),
			Limits:      quotaLimitsFromPayload(payload["limits"]),
			Status:      stringFromPayload(payload, "status"),
		})
		return key, err
	case request.ResourceType == "budgets" || request.ResourceType == "quota-policies":
		resource := AdminResource{
			Name:        stringFromPayload(payload, "name"),
			Description: stringFromPayload(payload, "description"),
			Status:      stringFromPayload(payload, "status"),
			Fields:      fieldsFromPayload(payload["fields"]),
		}
		if request.ResourceID == "" {
			return s.store.CreateResource(request.ResourceType, resource), nil
		}
		return s.store.UpdateResource(request.ResourceType, request.ResourceID, resource)
	case request.ResourceType == "invoices" && (request.Trigger == "invoice_confirm" || request.Trigger == "invoice_reject"):
		invoice, err := s.findResource("invoices", request.ResourceID)
		if err != nil {
			return nil, err
		}
		action := strings.TrimPrefix(request.Trigger, "invoice_")
		return s.applyInvoiceDecision(invoice, action, actor, stringFromPayload(payload, "invoice_note"), stringFromPayload(payload, "reject_reason"))
	default:
		return map[string]any{"applied": false, "reason": "no runtime apply handler"}, nil
	}
}

type resourceExportColumn struct {
	Header string
	Field  string
	Source string
}

func (s *Server) writeResourceExport(writer *csv.Writer, kind string, periodFilter string, columns []resourceExportColumn) {
	headers := make([]string, 0, len(columns))
	for _, column := range columns {
		headers = append(headers, column.Header)
	}
	_ = writer.Write(headers)
	for _, item := range s.store.ListResources(kind) {
		if periodFilter != "" && !resourceMatchesPeriod(item, periodFilter) {
			continue
		}
		row := make([]string, 0, len(columns))
		for _, column := range columns {
			row = append(row, resourceExportValue(item, column))
		}
		_ = writer.Write(row)
	}
}

func normalizeExportPeriod(period string) string {
	period = strings.TrimSpace(period)
	if period == "" {
		return ""
	}
	return normalizeBillingPeriod(period, time.Now().UTC())
}

func resourceMatchesPeriod(item AdminResource, period string) bool {
	if period == "" {
		return true
	}
	for _, key := range []string{"period", "period_ref", "last_calculated_period"} {
		if normalizeExportPeriod(stringField(item.Fields, key)) == period {
			return true
		}
	}
	return false
}

func resourceExportValue(item AdminResource, column resourceExportColumn) string {
	switch column.Source {
	case "id":
		return item.ID
	case "kind":
		return item.Kind
	case "name":
		return item.Name
	case "description":
		return item.Description
	case "status":
		return item.Status
	case "created_at":
		return item.CreatedAt.Format(time.RFC3339)
	case "updated_at":
		return item.UpdatedAt.Format(time.RFC3339)
	}
	return stringifyCSV(item.Fields[column.Field])
}

func (s *Server) findResource(kind string, id string) (AdminResource, error) {
	for _, item := range s.store.ListResources(kind) {
		if item.ID == id {
			return item, nil
		}
	}
	return AdminResource{}, NewHTTPError(404, "resource_not_found", "Resource not found")
}

func invoiceDecisionPayload(invoice AdminResource, action string, invoiceNote string, rejectReason string) map[string]any {
	fields := map[string]any{}
	for key, value := range invoice.Fields {
		fields[key] = value
	}
	return map[string]any{
		"kind":             "invoices",
		"resource_id":      invoice.ID,
		"name":             invoice.Name,
		"status":           invoice.Status,
		"fields":           fields,
		"amount_usd":       float64Field(invoice.Fields, "amount_usd"),
		"invoice_note":     invoiceNote,
		"reject_reason":    rejectReason,
		"requested_action": "invoice_" + action,
	}
}

func (s *Server) applyInvoiceDecision(invoice AdminResource, action string, actor AdminUser, invoiceNote string, rejectReason string) (AdminResource, error) {
	if invoice.Kind != "invoices" {
		return AdminResource{}, NewHTTPError(400, "invalid_invoice", "Resource is not an invoice")
	}
	status := strings.ToLower(strings.TrimSpace(invoice.Status))
	if status == "confirmed" || status == "rejected" {
		return AdminResource{}, NewHTTPError(http.StatusConflict, "invoice_already_decided", "Invoice has already been decided")
	}
	fields := map[string]any{}
	for key, value := range invoice.Fields {
		fields[key] = value
	}
	now := time.Now().UTC().Format(time.RFC3339)
	if strings.TrimSpace(invoiceNote) != "" {
		fields["invoice_note"] = strings.TrimSpace(invoiceNote)
	}
	switch action {
	case "confirm":
		fields["confirmed_by"] = actor.Name
		fields["confirmed_by_id"] = actor.ID
		fields["confirmed_at"] = now
		fields["reject_reason"] = ""
		invoice.Status = "confirmed"
	case "reject":
		fields["rejected_by"] = actor.Name
		fields["rejected_by_id"] = actor.ID
		fields["rejected_at"] = now
		fields["reject_reason"] = strings.TrimSpace(rejectReason)
		invoice.Status = "rejected"
	default:
		return AdminResource{}, NewHTTPError(400, "invalid_invoice_action", "Invalid invoice action")
	}
	invoice.Fields = fields
	return s.store.UpdateResource("invoices", invoice.ID, invoice)
}

func stringFromPayload(payload map[string]any, key string) string {
	value, ok := payload[key]
	if !ok || value == nil {
		return ""
	}
	if str, ok := value.(string); ok {
		return str
	}
	return strings.TrimSpace(stringifyCSV(value))
}

func stringSliceFromPayload(value any) []string {
	switch typed := value.(type) {
	case nil:
		return nil
	case []string:
		return typed
	case []any:
		items := make([]string, 0, len(typed))
		for _, item := range typed {
			text := strings.TrimSpace(stringifyCSV(item))
			if text != "" {
				items = append(items, text)
			}
		}
		return items
	case string:
		items := strings.Split(typed, ",")
		result := make([]string, 0, len(items))
		for _, item := range items {
			if item = strings.TrimSpace(item); item != "" {
				result = append(result, item)
			}
		}
		return result
	default:
		return nil
	}
}

func fieldsFromPayload(value any) map[string]any {
	if value == nil {
		return map[string]any{}
	}
	if fields, ok := value.(map[string]any); ok {
		return fields
	}
	return map[string]any{}
}

func quotaLimitsFromPayload(value any) QuotaLimits {
	switch typed := value.(type) {
	case QuotaLimits:
		return typed
	case map[string]any:
		return QuotaLimits{
			DailyRequests:   int64Field(typed, "daily_requests"),
			MonthlyRequests: int64Field(typed, "monthly_requests"),
			DailyTokens:     int64Field(typed, "daily_tokens"),
			MonthlyTokens:   int64Field(typed, "monthly_tokens"),
			DailyCostUSD:    float64Field(typed, "daily_cost_usd"),
			MonthlyCostUSD:  float64Field(typed, "monthly_cost_usd"),
			MaxConcurrency:  int64Field(typed, "max_concurrency"),
		}
	default:
		return QuotaLimits{}
	}
}

func (s *Server) authorizeAdmin(w http.ResponseWriter, r *http.Request) bool {
	_, ok := s.requireAdmin(w, r, "overview", r.Method)
	return ok
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

func (s *Server) requireAdmin(w http.ResponseWriter, r *http.Request, resource string, method string) (AdminUser, bool) {
	user, ok := s.authorizeAdminUser(w, r)
	if !ok {
		return AdminUser{}, false
	}
	if !canAdmin(user.Role, resource, method) {
		writeError(w, r, NewHTTPError(403, "admin_forbidden", "Admin role is not allowed to perform this action"))
		return AdminUser{}, false
	}
	return user, true
}

func canAdmin(role string, resource string, method string) bool {
	role = normalizeAdminRole(role)
	if role == "" {
		role = "viewer"
	}
	resource = strings.ToLower(strings.TrimSpace(resource))
	write := method != http.MethodGet
	switch role {
	case "admin", "system_admin":
		return true
	case "security_admin":
		if resource == "backup" {
			return false
		}
		if write {
			return resource == "alert" || resource == "security" || resource == "audit" || resource == "approval"
		}
		return resource == "overview" || resource == "usage" || resource == "audit" || resource == "alert" || resource == "security" || resource == "approval"
	case "project_admin":
		if resource == "backup" {
			return false
		}
		if write {
			return resource == "project" || resource == "api_key" || resource == "quota" || resource == "approval"
		}
		return resource == "overview" || resource == "project" || resource == "api_key" || resource == "quota" || resource == "usage" || resource == "audit" || resource == "approval"
	case "viewer", "readonly", "read_only":
		if resource == "backup" {
			return false
		}
		return !write && resource != "identity" && resource != "provider"
	default:
		return !write && resource == "overview"
	}
}

func adminRoleMatches(actual string, required string) bool {
	actual = normalizeAdminRole(actual)
	required = normalizeAdminRole(required)
	if actual == "admin" || actual == "system_admin" {
		return true
	}
	return actual == required
}

func normalizeAdminRole(role string) string {
	role = strings.ToLower(strings.TrimSpace(role))
	switch role {
	case "security":
		return "security_admin"
	case "readonly":
		return "read_only"
	default:
		return role
	}
}

func adminResourcePermission(path string) string {
	if strings.Contains(path, "/quota-policies") {
		return "quota"
	}
	if strings.Contains(path, "/security-policies") {
		return "security"
	}
	if strings.Contains(path, "/alert-rules") {
		return "alert"
	}
	if strings.Contains(path, "/notification-channels") {
		return "alert"
	}
	if strings.Contains(path, "/cost-centers") || strings.Contains(path, "/budgets") ||
		strings.Contains(path, "/chargebacks") || strings.Contains(path, "/invoices") ||
		strings.Contains(path, "/approval-flows") || strings.Contains(path, "/reports") {
		return "usage"
	}
	if strings.Contains(path, "/teams") || strings.Contains(path, "/role-configs") {
		return "identity"
	}
	if strings.Contains(path, "/monitors") || strings.Contains(path, "/proxies") || strings.Contains(path, "/settings") {
		return "provider"
	}
	return "overview"
}

func (s *Server) recordAdminAudit(r *http.Request, user AdminUser, action string, resourceType string, resourceID string, before any, after any) {
	s.store.RecordAuditEvent(AuditEvent{
		ActorUserID:    user.ID,
		ActorName:      user.Name,
		ActorRole:      user.Role,
		Action:         action,
		ResourceType:   resourceType,
		ResourceID:     resourceID,
		Status:         "success",
		BeforeSnapshot: snapshotJSON(before),
		AfterSnapshot:  snapshotJSON(after),
		IP:             clientIP(r),
		UserAgent:      r.UserAgent(),
	})
}

func snapshotJSON(value any) string {
	if value == nil {
		return ""
	}
	data, err := json.Marshal(value)
	if err != nil {
		return ""
	}
	return string(data)
}

func stringifyCSV(value any) string {
	switch typed := value.(type) {
	case nil:
		return ""
	case string:
		return typed
	case int:
		return strconv.Itoa(typed)
	case int64:
		return strconv.FormatInt(typed, 10)
	case float64:
		return strconv.FormatFloat(typed, 'f', -1, 64)
	default:
		return strings.Trim(snapshotJSON(typed), `"`)
	}
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

const auditPayloadMaxChars = 64 * 1024

func (s *Server) recordRequestPayload(requestID string, requestPayload any, responsePayload any) {
	requestBody, requestTruncated := auditPayloadBody(requestPayload)
	responseBody, responseTruncated := auditPayloadBody(responsePayload)
	s.store.RecordRequestPayload(requestID, requestBody, requestTruncated, responseBody, responseTruncated)
}

func auditPayloadBody(value any) (string, bool) {
	if value == nil {
		return "", false
	}
	raw, err := json.MarshalIndent(redactAuditPayload(value), "", "  ")
	if err != nil {
		raw, _ = json.MarshalIndent(map[string]any{"error": "payload_not_serializable"}, "", "  ")
	}
	text := string(raw)
	runes := []rune(text)
	if len(runes) <= auditPayloadMaxChars {
		return text, false
	}
	return string(runes[:auditPayloadMaxChars]) + "\n... truncated", true
}

func redactAuditPayload(value any) any {
	raw, err := json.Marshal(value)
	if err != nil {
		return value
	}
	var decoded any
	if err := json.Unmarshal(raw, &decoded); err != nil {
		return value
	}
	return redactAuditValue(decoded)
}

func redactAuditValue(value any) any {
	switch typed := value.(type) {
	case map[string]any:
		out := make(map[string]any, len(typed))
		for key, item := range typed {
			if isSensitiveAuditKey(key) {
				out[key] = "[redacted]"
				continue
			}
			out[key] = redactAuditValue(item)
		}
		return out
	case []any:
		out := make([]any, 0, len(typed))
		for _, item := range typed {
			out = append(out, redactAuditValue(item))
		}
		return out
	default:
		return value
	}
}

func isSensitiveAuditKey(key string) bool {
	normalized := strings.NewReplacer("_", "", "-", "", ".", "").Replace(strings.ToLower(key))
	switch normalized {
	case "authorization", "apikey", "accesstoken", "refreshtoken", "clientsecret", "secretkey", "password", "token", "secret":
		return true
	default:
		return strings.Contains(normalized, "authorization") || strings.Contains(normalized, "password") || strings.Contains(normalized, "secret")
	}
}

func auditErrorPayload(err error, requestID string) map[string]any {
	httpErr := AsHTTPError(err)
	return map[string]any{
		"error": map[string]any{
			"message": httpErr.Message,
			"type":    httpErr.Code,
			"code":    httpErr.Code,
		},
		"request_id": requestID,
	}
}

func auditStreamPayload(status int, code string, err error) map[string]any {
	payload := map[string]any{
		"stream":      true,
		"captured":    false,
		"status_code": status,
	}
	if err != nil {
		payload["error"] = map[string]any{
			"message": errorMessage(err),
			"type":    code,
			"code":    code,
		}
	}
	return payload
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
