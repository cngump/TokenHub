package server

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"
)

const (
	StatusActive   = "active"
	StatusDisabled = "disabled"
	StatusRevoked  = "revoked"

	ProviderMock             = "mock"
	ProviderOpenAI           = "openai"
	ProviderOpenAICompatible = "openai_compatible"
	ProviderAzureOpenAI      = "azure_openai"
	ProviderAnthropic        = "anthropic"
	ProviderGemini           = "gemini"
)

var (
	ErrInvalidAPIKey     = NewHTTPError(401, "invalid_api_key", "Invalid API key")
	ErrAPIKeyDisabled    = NewHTTPError(403, "api_key_disabled", "API key is disabled")
	ErrAPIKeyExpired     = NewHTTPError(403, "api_key_expired", "API key has expired")
	ErrModelNotAllowed   = NewHTTPError(403, "model_not_allowed", "Model is not allowed for this API key")
	ErrRateLimitExceeded = NewHTTPError(429, "rate_limit_exceeded", "Rate limit exceeded")
	ErrQuotaExceeded     = NewHTTPError(429, "quota_exceeded", "Quota exceeded")
	ErrProviderMissing   = NewHTTPError(503, "provider_unavailable", "No available provider route")
)

type HTTPError struct {
	Status  int
	Code    string
	Message string
}

func (e *HTTPError) Error() string {
	return e.Message
}

func NewHTTPError(status int, code, message string) *HTTPError {
	return &HTTPError{Status: status, Code: code, Message: message}
}

func AsHTTPError(err error) *HTTPError {
	if err == nil {
		return nil
	}
	var httpErr *HTTPError
	if errors.As(err, &httpErr) {
		return httpErr
	}
	return NewHTTPError(500, "internal_error", err.Error())
}

type Project struct {
	ID              string    `json:"id" gorm:"primaryKey"`
	Name            string    `json:"name"`
	TeamID          string    `json:"team_id,omitempty"`
	OwnerUserID     string    `json:"owner_user_id,omitempty"`
	Status          string    `json:"status"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	DefaultQuotaRef string    `json:"default_quota_ref,omitempty"`
}

type APIKey struct {
	ID            string            `json:"id" gorm:"primaryKey"`
	ProjectID     string            `json:"project_id" gorm:"index"`
	Name          string            `json:"name"`
	KeyHash       string            `json:"-" gorm:"uniqueIndex"`
	KeyPrefix     string            `json:"key_prefix"`
	KeySuffix     string            `json:"key_suffix"`
	AllowedModels map[string]bool   `json:"-" gorm:"-"`
	Allowed       []string          `json:"allowed_models" gorm:"serializer:json"`
	Limits        QuotaLimits       `json:"limits" gorm:"embedded;embeddedPrefix:limit_"`
	Status        string            `json:"status"`
	ExpiresAt     *time.Time        `json:"expires_at,omitempty"`
	CreatedAt     time.Time         `json:"created_at"`
	LastUsedAt    *time.Time        `json:"last_used_at,omitempty"`
	Metadata      map[string]string `json:"metadata,omitempty" gorm:"serializer:json"`
}

type QuotaLimits struct {
	DailyRequests   int64   `json:"daily_requests"`
	MonthlyRequests int64   `json:"monthly_requests"`
	DailyTokens     int64   `json:"daily_tokens"`
	MonthlyTokens   int64   `json:"monthly_tokens"`
	DailyCostUSD    float64 `json:"daily_cost_usd"`
	MonthlyCostUSD  float64 `json:"monthly_cost_usd"`
	MaxConcurrency  int64   `json:"max_concurrency"`
}

type QuotaCounter struct {
	Requests         int64   `json:"requests"`
	PromptTokens     int64   `json:"prompt_tokens"`
	CompletionTokens int64   `json:"completion_tokens"`
	TotalTokens      int64   `json:"total_tokens"`
	CostUSD          float64 `json:"cost_usd"`
}

type Model struct {
	ID                     string    `json:"id" gorm:"primaryKey"`
	Name                   string    `json:"name" gorm:"uniqueIndex"`
	Family                 string    `json:"family"`
	Modality               string    `json:"modality"`
	ContextWindow          int64     `json:"context_window"`
	InputPriceUSDPer1M     float64   `json:"input_price_usd_per_1m"`
	OutputPriceUSDPer1M    float64   `json:"output_price_usd_per_1m"`
	EmbeddingPriceUSDPer1M float64   `json:"embedding_price_usd_per_1m"`
	Status                 string    `json:"status"`
	CreatedAt              time.Time `json:"created_at"`
}

type Provider struct {
	ID        string            `json:"id" gorm:"primaryKey"`
	Name      string            `json:"name"`
	Type      string            `json:"type"`
	BaseURL   string            `json:"base_url,omitempty"`
	APIKey    string            `json:"-"`
	Status    string            `json:"status"`
	Healthy   bool              `json:"healthy"`
	Priority  int               `json:"priority"`
	Headers   map[string]string `json:"headers,omitempty" gorm:"serializer:json"`
	Options   map[string]string `json:"options,omitempty" gorm:"serializer:json"`
	CreatedAt time.Time         `json:"created_at"`
}

type ModelRoute struct {
	ID            string    `json:"id" gorm:"primaryKey"`
	ModelName     string    `json:"model_name" gorm:"index"`
	ProviderID    string    `json:"provider_id" gorm:"index"`
	ProviderModel string    `json:"provider_model"`
	Priority      int       `json:"priority"`
	Weight        int       `json:"weight"`
	Status        string    `json:"status"`
	Strategy      string    `json:"strategy,omitempty"`
	LastUsedAt    *time.Time `json:"last_used_at,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
}

type Usage struct {
	PromptTokens     int64   `json:"prompt_tokens"`
	CompletionTokens int64   `json:"completion_tokens"`
	TotalTokens      int64   `json:"total_tokens"`
	CostUSD          float64 `json:"estimated_cost_usd,omitempty"`
}

type UsageRecord struct {
	ID           string    `json:"id" gorm:"primaryKey"`
	RequestID    string    `json:"request_id" gorm:"index"`
	ProjectID    string    `json:"project_id" gorm:"index"`
	APIKeyID     string    `json:"api_key_id" gorm:"index"`
	ModelName    string    `json:"model" gorm:"index"`
	ProviderID   string    `json:"provider_id" gorm:"index"`
	InputTokens  int64     `json:"input_tokens"`
	OutputTokens int64     `json:"output_tokens"`
	TotalTokens  int64     `json:"total_tokens"`
	CostUSD      float64   `json:"estimated_cost_usd"`
	CreatedAt    time.Time `json:"created_at"`
}

type RequestLog struct {
	ID            string    `json:"id" gorm:"primaryKey"`
	RequestID     string    `json:"request_id" gorm:"index"`
	ProjectID     string    `json:"project_id" gorm:"index"`
	APIKeyID      string    `json:"api_key_id" gorm:"index"`
	ModelName     string    `json:"model" gorm:"index"`
	ProviderID    string    `json:"provider_id,omitempty" gorm:"index"`
	ProviderModel string    `json:"provider_model,omitempty"`
	StatusCode    int       `json:"status_code"`
	ErrorCode     string    `json:"error_code,omitempty"`
	LatencyMS     int64     `json:"latency_ms"`
	ClientIP      string    `json:"client_ip,omitempty"`
	UserAgent     string    `json:"user_agent,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
}

type AlertEvent struct {
	ID         string    `json:"id" gorm:"primaryKey"`
	ScopeType  string    `json:"scope_type" gorm:"index"`
	ScopeID    string    `json:"scope_id" gorm:"index"`
	Severity   string    `json:"severity"`
	Code       string    `json:"code"`
	Message    string    `json:"message"`
	ResourceID string    `json:"resource_id,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}

type AdminResource struct {
	ID          string         `json:"id" gorm:"primaryKey"`
	Kind        string         `json:"kind" gorm:"primaryKey;index"`
	Name        string         `json:"name"`
	Description string         `json:"description,omitempty"`
	Status      string         `json:"status"`
	Fields      map[string]any `json:"fields,omitempty" gorm:"serializer:json"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
}

type AdminUser struct {
	ID           string     `json:"id" gorm:"primaryKey"`
	Username     string     `json:"username" gorm:"uniqueIndex"`
	Name         string     `json:"name"`
	Email        string     `json:"email" gorm:"uniqueIndex"`
	Role         string     `json:"role"`
	TeamID       string     `json:"team_id,omitempty"`
	Status       string     `json:"status"`
	PasswordHash string     `json:"-"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	LastLoginAt  *time.Time `json:"last_login_at,omitempty"`
}

type AdminSession struct {
	Token     string    `json:"token" gorm:"primaryKey"`
	UserID    string    `json:"user_id" gorm:"index"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}

type ChatMessage struct {
	Role    string `json:"role"`
	Content any    `json:"content"`
}

type ChatCompletionRequest struct {
	Model       string         `json:"model"`
	Messages    []ChatMessage  `json:"messages"`
	Stream      bool           `json:"stream,omitempty"`
	MaxTokens   int            `json:"max_tokens,omitempty"`
	Temperature *float64       `json:"temperature,omitempty"`
	Metadata    map[string]any `json:"metadata,omitempty"`
}

type ResponsesRequest struct {
	Model       string   `json:"model"`
	Input       any      `json:"input"`
	Stream      bool     `json:"stream,omitempty"`
	MaxTokens   int      `json:"max_output_tokens,omitempty"`
	Temperature *float64 `json:"temperature,omitempty"`
}

type EmbeddingsRequest struct {
	Model string `json:"model"`
	Input any    `json:"input"`
}

type RouteSelection struct {
	Provider      Provider
	ProviderModel string
	Route         ModelRoute
}

type RouteAttempt struct {
	Selection RouteSelection `json:"selection"`
	Status    int            `json:"status"`
	ErrorCode string         `json:"error_code,omitempty"`
	Error     string         `json:"error,omitempty"`
}

type RoutedCall struct {
	Call   CallContext
	Routes []RouteSelection
}

type CallContext struct {
	RequestID string
	Project   Project
	Key       APIKey
	Model     Model
	StartedAt time.Time
}

func NewID(prefix string) string {
	var buf [12]byte
	if _, err := rand.Read(buf[:]); err != nil {
		return fmt.Sprintf("%s_%d", prefix, time.Now().UnixNano())
	}
	return prefix + "_" + base64.RawURLEncoding.EncodeToString(buf[:])
}

func GenerateAPIKey() string {
	return "thk_" + NewID("live")
}

func GenerateAdminSessionToken() string {
	return "tha_" + NewID("session")
}

func HashSecret(secret string) string {
	sum := sha256.Sum256([]byte(secret))
	return hex.EncodeToString(sum[:])
}

func PrefixSuffix(secret string) (string, string) {
	if len(secret) <= 12 {
		return secret, secret
	}
	return secret[:8], secret[len(secret)-6:]
}

func AllowedModelSet(models []string) map[string]bool {
	set := make(map[string]bool, len(models))
	for _, model := range models {
		model = strings.TrimSpace(model)
		if model != "" {
			set[model] = true
		}
	}
	return set
}

func EstimateTextTokens(text string) int64 {
	text = strings.TrimSpace(text)
	if text == "" {
		return 0
	}
	words := int64(len(strings.Fields(text)))
	chars := int64(math.Ceil(float64(len([]rune(text))) / 4.0))
	if words > chars {
		return words
	}
	return chars
}

func ChatPromptText(messages []ChatMessage) string {
	parts := make([]string, 0, len(messages))
	for _, msg := range messages {
		parts = append(parts, contentToText(msg.Content))
	}
	return strings.Join(parts, "\n")
}

func ResponsesInputText(input any) string {
	return contentToText(input)
}

func EmbeddingInputText(input any) string {
	return contentToText(input)
}

func contentToText(value any) string {
	switch typed := value.(type) {
	case nil:
		return ""
	case string:
		return typed
	case []any:
		var parts []string
		for _, item := range typed {
			parts = append(parts, contentToText(item))
		}
		return strings.Join(parts, " ")
	case map[string]any:
		if text, ok := typed["text"].(string); ok {
			return text
		}
		if value, ok := typed["content"]; ok {
			return contentToText(value)
		}
		var parts []string
		for _, item := range typed {
			parts = append(parts, contentToText(item))
		}
		return strings.Join(parts, " ")
	default:
		return fmt.Sprint(value)
	}
}
