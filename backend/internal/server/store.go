package server

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	gormlogger "gorm.io/gorm/logger"
)

const defaultSQLiteDatabaseURL = "sqlite://data/tokenhub.db"

type QuotaBucket struct {
	KeyID  string `gorm:"primaryKey;index"`
	Scope  string `gorm:"primaryKey"`
	Bucket string `gorm:"primaryKey;index"`
	QuotaCounter
}

type Store interface {
	CreateProject(project Project) Project
	ListProjects() []Project
	UpdateProject(id string, patch Project) (Project, error)
	DeleteProject(id string) error
	GetProject(id string) (Project, bool)
	CreateAPIKey(projectID string, key APIKey, rawSecret string) (APIKey, string, error)
	ListProjectKeys(projectID string) []APIKey
	ListAPIKeys() []APIKey
	UpdateAPIKey(id string, patch APIKey) (APIKey, error)
	DeleteAPIKey(id string) error
	ValidateAPIKey(rawSecret string) (Project, APIKey, error)
	AddProvider(provider Provider) Provider
	ListProviders() []Provider
	UpdateProvider(id string, patch Provider) (Provider, error)
	DeleteProvider(id string) error
	SetProviderHealth(providerID string, healthy bool) (Provider, error)
	AddProviderResource(resource ProviderResource) (ProviderResource, error)
	ListProviderResources() []ProviderResource
	UpdateProviderResource(id string, patch ProviderResource) (ProviderResource, error)
	DeleteProviderResource(id string) error
	SetProviderResourceHealth(resourceID string, healthy bool) (ProviderResource, error)
	AddModel(model Model) Model
	ListModels() []Model
	UpdateModel(name string, patch Model) (Model, error)
	DeleteModel(name string) error
	AddRoute(route ModelRoute) ModelRoute
	ListRoutes() []ModelRoute
	UpdateRoute(id string, patch ModelRoute) (ModelRoute, error)
	DeleteRoute(id string) error
	SelectRoute(modelName string) (RouteSelection, error)
	SelectRouteCandidates(modelName string) ([]RouteSelection, error)
	MarkRouteUsed(routeID string)
	MarkProviderResourceUsed(resourceID string)
	StartCall(project Project, key APIKey, modelName string) (CallContext, error)
	FinishCall(call CallContext, route RouteSelection, usage Usage, statusCode int, errorCode string, clientIP string, userAgent string)
	RecordRejectedRequest(project Project, key APIKey, modelName string, statusCode int, errorCode string, clientIP string, userAgent string)
	UsageSummary() map[string]any
	UsageBreakdown() map[string]any
	UsageTimeseries(days int) []map[string]any
	ListRequestLogs() []RequestLog
	ListAlerts() []AlertEvent
	ListAuditEvents() []AuditEvent
	RecordAuditEvent(event AuditEvent)
	CreateResource(kind string, resource AdminResource) AdminResource
	ListResources(kind string) []AdminResource
	UpdateResource(kind string, id string, patch AdminResource) (AdminResource, error)
	DeleteResource(kind string, id string) error
	CreateAdminUser(user AdminUser, password string) (AdminUser, error)
	ListAdminUsers() []AdminUser
	UpdateAdminUser(id string, patch AdminUser, password string) (AdminUser, error)
	DeleteAdminUser(id string) error
	AuthenticateAdminUser(identity string, password string, ttl time.Duration) (AdminUser, AdminSession, error)
	ValidateAdminSession(token string) (AdminUser, bool)
	RevokeAdminSession(token string)
	AccessibleModels(key APIKey) []Model
	CheckProviderResourceCapacity(resourceID string) error
	FinishProviderResourceAttempt(resourceID string, success bool, usage Usage)
	TestProvider(id string) (Provider, error)
	TestProviderResource(id string) (ProviderResource, error)
}

type GormStore struct {
	db               *gorm.DB
	mu               sync.Mutex
	inFlight         map[string]int64
	resourceInFlight map[string]int64
	secretKey        string
	failureThreshold int
	cooldownDuration time.Duration
}

// MemoryStore is kept as a compatibility alias for existing tests and callers.
// It is now backed by GORM and SQLite, not process-local maps.
type MemoryStore = GormStore

func OpenStore(databaseURL string) (*GormStore, error) {
	return OpenStoreWithConfig(databaseURL, ConfigFromEnv())
}

func OpenStoreWithConfig(databaseURL string, config Config) (*GormStore, error) {
	if strings.TrimSpace(databaseURL) == "" {
		databaseURL = defaultSQLiteDatabaseURL
	}
	return NewSQLiteStoreWithConfig(databaseURL, config)
}

func NewSQLiteStore(databaseURL string) (*GormStore, error) {
	return NewSQLiteStoreWithConfig(databaseURL, ConfigFromEnv())
}

func NewSQLiteStoreWithConfig(databaseURL string, config Config) (*GormStore, error) {
	dsn, err := sqliteDSN(databaseURL)
	if err != nil {
		return nil, err
	}
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{
		TranslateError: true,
		Logger: gormlogger.New(
			log.New(os.Stdout, "\r\n", log.LstdFlags),
			gormlogger.Config{
				SlowThreshold:             time.Second,
				LogLevel:                  gormlogger.Silent,
				IgnoreRecordNotFoundError: true,
			},
		),
	})
	if err != nil {
		return nil, err
	}
	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}
	sqlDB.SetMaxOpenConns(1)
	if err := db.Exec("PRAGMA foreign_keys = ON").Error; err != nil {
		return nil, err
	}
	if err := db.Exec("PRAGMA busy_timeout = 5000").Error; err != nil {
		return nil, err
	}
	if err := db.AutoMigrate(
		&Project{},
		&APIKey{},
		&Provider{},
		&ProviderResource{},
		&Model{},
		&ModelRoute{},
		&QuotaBucket{},
		&UsageRecord{},
		&RequestLog{},
		&AlertEvent{},
		&ProviderResourceBucket{},
		&AuditEvent{},
		&AdminResource{},
		&AdminUser{},
		&AdminSession{},
	); err != nil {
		return nil, err
	}
	return &GormStore{
		db:               db,
		inFlight:         map[string]int64{},
		resourceInFlight: map[string]int64{},
		secretKey:        config.SecretKey,
		failureThreshold: defaultInt(config.ResourceFailureThreshold, 3),
		cooldownDuration: time.Duration(defaultInt(config.ResourceCooldownSeconds, 300)) * time.Second,
	}, nil
}

func NewMemoryStore() *MemoryStore {
	store, err := NewSQLiteStoreWithConfig(fmt.Sprintf("file:%s?mode=memory&cache=shared", NewID("mem")), ConfigFromEnv())
	if err != nil {
		panic(err)
	}
	return store
}

func sqliteDSN(databaseURL string) (string, error) {
	databaseURL = strings.TrimSpace(databaseURL)
	if databaseURL == "" {
		databaseURL = defaultSQLiteDatabaseURL
	}
	if strings.HasPrefix(databaseURL, "sqlite://") {
		parsed, err := url.Parse(databaseURL)
		if err != nil {
			return "", err
		}
		path := parsed.Path
		if parsed.Host != "" {
			path = filepath.Join(parsed.Host, strings.TrimPrefix(parsed.Path, "/"))
		} else if !strings.HasPrefix(databaseURL, "sqlite:///") {
			path = strings.TrimPrefix(parsed.Path, "/")
		}
		if path == "" {
			path = "data/tokenhub.db"
		}
		if parsed.RawQuery != "" {
			path += "?" + parsed.RawQuery
		}
		return prepareSQLitePath(path)
	}
	if strings.HasPrefix(databaseURL, "sqlite:") {
		return prepareSQLitePath(strings.TrimPrefix(databaseURL, "sqlite:"))
	}
	if strings.Contains(databaseURL, "://") {
		return "", fmt.Errorf("unsupported database URL %q: only sqlite is configured", databaseURL)
	}
	return prepareSQLitePath(databaseURL)
}

func prepareSQLitePath(dsn string) (string, error) {
	if dsn == "" || dsn == ":memory:" || strings.HasPrefix(dsn, "file:") {
		return dsn, nil
	}
	path := dsn
	if idx := strings.Index(path, "?"); idx >= 0 {
		path = path[:idx]
	}
	if path != "" {
		dir := filepath.Dir(path)
		if dir != "." && dir != "" {
			if err := os.MkdirAll(dir, 0o755); err != nil {
				return "", err
			}
		}
	}
	return dsn, nil
}

func (s *GormStore) CreateProject(project Project) Project {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now().UTC()
	if project.ID == "" {
		project.ID = NewID("prj")
	}
	if project.Status == "" {
		project.Status = StatusActive
	}
	if project.CreatedAt.IsZero() {
		project.CreatedAt = now
	}
	project.UpdatedAt = now
	_ = s.db.Clauses(clause.OnConflict{UpdateAll: true}).Create(&project).Error
	return project
}

func (s *GormStore) ListProjects() []Project {
	var items []Project
	_ = s.db.Order("created_at asc").Find(&items).Error
	return items
}

func (s *GormStore) UpdateProject(id string, patch Project) (Project, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	var project Project
	if err := s.db.First(&project, "id = ?", id).Error; err != nil {
		return Project{}, notFound(err, "project_not_found", "Project not found")
	}
	if patch.Name != "" {
		project.Name = patch.Name
	}
	project.TeamID = patch.TeamID
	project.OwnerUserID = patch.OwnerUserID
	if patch.Status != "" {
		project.Status = patch.Status
	}
	project.DefaultQuotaRef = patch.DefaultQuotaRef
	project.UpdatedAt = time.Now().UTC()
	return project, s.db.Save(&project).Error
}

func (s *GormStore) DeleteProject(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	return s.db.Transaction(func(tx *gorm.DB) error {
		var project Project
		if err := tx.First(&project, "id = ?", id).Error; err != nil {
			return notFound(err, "project_not_found", "Project not found")
		}
		var keys []APIKey
		if err := tx.Where("project_id = ?", id).Find(&keys).Error; err != nil {
			return err
		}
		keyIDs := make([]string, 0, len(keys))
		for _, key := range keys {
			keyIDs = append(keyIDs, key.ID)
			delete(s.inFlight, key.ID)
		}
		if len(keyIDs) > 0 {
			if err := tx.Where("key_id IN ?", keyIDs).Delete(&QuotaBucket{}).Error; err != nil {
				return err
			}
			if err := tx.Where("id IN ?", keyIDs).Delete(&APIKey{}).Error; err != nil {
				return err
			}
		}
		return tx.Delete(&project).Error
	})
}

func (s *GormStore) GetProject(id string) (Project, bool) {
	var project Project
	if err := s.db.First(&project, "id = ?", id).Error; err != nil {
		return Project{}, false
	}
	return project, true
}

func (s *GormStore) CreateAPIKey(projectID string, key APIKey, rawSecret string) (APIKey, string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if err := s.db.First(&Project{}, "id = ?", projectID).Error; err != nil {
		return APIKey{}, "", notFound(err, "project_not_found", "Project not found")
	}
	if rawSecret == "" {
		rawSecret = GenerateAPIKey()
	}
	prefix, suffix := PrefixSuffix(rawSecret)
	now := time.Now().UTC()
	if key.ID == "" {
		key.ID = NewID("key")
	}
	if key.Status == "" {
		key.Status = StatusActive
	}
	key.ProjectID = projectID
	key.KeyHash = HashSecret(rawSecret)
	key.KeyPrefix = prefix
	key.KeySuffix = suffix
	if key.CreatedAt.IsZero() {
		key.CreatedAt = now
	}
	if key.Allowed == nil {
		key.Allowed = []string{}
	}
	key.AllowedModels = AllowedModelSet(key.Allowed)
	if err := s.db.Create(&key).Error; err != nil {
		return APIKey{}, "", writeConflict(err, "api_key_conflict", "API key already exists")
	}
	return publicKey(key), rawSecret, nil
}

func (s *GormStore) ListProjectKeys(projectID string) []APIKey {
	var items []APIKey
	_ = s.db.Where("project_id = ?", projectID).Order("created_at asc").Find(&items).Error
	return publicKeys(items)
}

func (s *GormStore) ListAPIKeys() []APIKey {
	var items []APIKey
	_ = s.db.Order("created_at asc").Find(&items).Error
	return publicKeys(items)
}

func (s *GormStore) UpdateAPIKey(id string, patch APIKey) (APIKey, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	var key APIKey
	if err := s.db.First(&key, "id = ?", id).Error; err != nil {
		return APIKey{}, notFound(err, "api_key_not_found", "API key not found")
	}
	hydrateAPIKey(&key)
	if patch.Name != "" {
		key.Name = patch.Name
	}
	if patch.Status != "" {
		key.Status = patch.Status
	}
	if patch.Allowed != nil {
		key.Allowed = patch.Allowed
		key.AllowedModels = AllowedModelSet(patch.Allowed)
	}
	if patch.Limits != (QuotaLimits{}) {
		key.Limits = patch.Limits
	}
	key.ExpiresAt = patch.ExpiresAt
	if err := s.db.Save(&key).Error; err != nil {
		return APIKey{}, err
	}
	return publicKey(key), nil
}

func (s *GormStore) DeleteAPIKey(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	return s.db.Transaction(func(tx *gorm.DB) error {
		var key APIKey
		if err := tx.First(&key, "id = ?", id).Error; err != nil {
			return notFound(err, "api_key_not_found", "API key not found")
		}
		if err := tx.Where("key_id = ?", id).Delete(&QuotaBucket{}).Error; err != nil {
			return err
		}
		delete(s.inFlight, id)
		return tx.Delete(&key).Error
	})
}

func (s *GormStore) ValidateAPIKey(rawSecret string) (Project, APIKey, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	var key APIKey
	if err := s.db.First(&key, "key_hash = ?", HashSecret(rawSecret)).Error; err != nil {
		return Project{}, APIKey{}, ErrInvalidAPIKey
	}
	hydrateAPIKey(&key)
	if key.Status == StatusDisabled || key.Status == StatusRevoked {
		return Project{}, APIKey{}, ErrAPIKeyDisabled
	}
	if key.ExpiresAt != nil && time.Now().UTC().After(*key.ExpiresAt) {
		return Project{}, APIKey{}, ErrAPIKeyExpired
	}
	var project Project
	if err := s.db.First(&project, "id = ?", key.ProjectID).Error; err != nil || project.Status != StatusActive {
		return Project{}, APIKey{}, ErrAPIKeyDisabled
	}
	now := time.Now().UTC()
	key.LastUsedAt = &now
	if err := s.db.Model(&key).Update("last_used_at", now).Error; err != nil {
		return Project{}, APIKey{}, err
	}
	return project, publicKey(key), nil
}

func (s *GormStore) AddProvider(provider Provider) Provider {
	s.mu.Lock()
	defer s.mu.Unlock()

	if provider.ID == "" {
		provider.ID = NewID("prv")
	}
	if provider.Status == "" {
		provider.Status = StatusActive
	}
	if !provider.Healthy {
		provider.Healthy = true
	}
	if provider.CreatedAt.IsZero() {
		provider.CreatedAt = time.Now().UTC()
	}
	provider.APIKey = s.encryptSecret(provider.APIKey)
	_ = s.db.Clauses(clause.OnConflict{UpdateAll: true}).Create(&provider).Error
	return provider
}

func (s *GormStore) ListProviders() []Provider {
	var items []Provider
	_ = s.db.Order("priority asc").Find(&items).Error
	for i := range items {
		items[i].APIKey = ""
	}
	return items
}

func (s *GormStore) UpdateProvider(id string, patch Provider) (Provider, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	var provider Provider
	if err := s.db.First(&provider, "id = ?", id).Error; err != nil {
		return Provider{}, notFound(err, "provider_not_found", "Provider not found")
	}
	if patch.Name != "" {
		provider.Name = patch.Name
	}
	if patch.Type != "" {
		provider.Type = patch.Type
	}
	provider.BaseURL = patch.BaseURL
	if patch.APIKey != "" {
		provider.APIKey = s.encryptSecret(patch.APIKey)
	}
	if patch.Status != "" {
		provider.Status = patch.Status
	}
	provider.Healthy = patch.Healthy
	if patch.Priority != 0 {
		provider.Priority = patch.Priority
	}
	if patch.Headers != nil {
		provider.Headers = patch.Headers
	}
	if patch.Options != nil {
		provider.Options = patch.Options
	}
	if err := s.db.Save(&provider).Error; err != nil {
		return Provider{}, err
	}
	provider.APIKey = ""
	return provider, nil
}

func (s *GormStore) DeleteProvider(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	return s.db.Transaction(func(tx *gorm.DB) error {
		var provider Provider
		if err := tx.First(&provider, "id = ?", id).Error; err != nil {
			return notFound(err, "provider_not_found", "Provider not found")
		}
		if err := tx.Where("provider_id = ?", id).Delete(&ModelRoute{}).Error; err != nil {
			return err
		}
		if err := tx.Where("provider_id = ?", id).Delete(&ProviderResource{}).Error; err != nil {
			return err
		}
		return tx.Delete(&provider).Error
	})
}

func (s *GormStore) SetProviderHealth(providerID string, healthy bool) (Provider, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	var provider Provider
	if err := s.db.First(&provider, "id = ?", providerID).Error; err != nil {
		return Provider{}, notFound(err, "provider_not_found", "Provider not found")
	}
	if err := s.db.Model(&Provider{}).Where("id = ?", providerID).Update("healthy", healthy).Error; err != nil {
		return Provider{}, err
	}
	provider.Healthy = healthy
	provider.APIKey = ""
	return provider, nil
}

func (s *GormStore) AddProviderResource(resource ProviderResource) (ProviderResource, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if err := s.db.First(&Provider{}, "id = ?", resource.ProviderID).Error; err != nil {
		return ProviderResource{}, notFound(err, "provider_not_found", "Provider not found")
	}
	now := time.Now().UTC()
	if resource.ID == "" {
		resource.ID = NewID("rsrc")
	}
	if resource.Status == "" {
		resource.Status = StatusActive
	}
	if resource.ResourceType == "" {
		resource.ResourceType = "api_key"
	}
	if !resource.Healthy {
		resource.Healthy = true
	}
	if resource.Weight <= 0 {
		resource.Weight = 100
	}
	if resource.CreatedAt.IsZero() {
		resource.CreatedAt = now
	}
	resource.UpdatedAt = now
	resource.APIKey = s.encryptSecret(resource.APIKey)
	if err := s.db.Clauses(clause.OnConflict{UpdateAll: true}).Create(&resource).Error; err != nil {
		return ProviderResource{}, err
	}
	resource.APIKey = ""
	return resource, nil
}

func (s *GormStore) ListProviderResources() []ProviderResource {
	var items []ProviderResource
	_ = s.db.Order("provider_id asc, priority asc, weight desc, created_at asc").Find(&items).Error
	for i := range items {
		items[i].APIKey = ""
	}
	return items
}

func (s *GormStore) UpdateProviderResource(id string, patch ProviderResource) (ProviderResource, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	var resource ProviderResource
	if err := s.db.First(&resource, "id = ?", id).Error; err != nil {
		return ProviderResource{}, notFound(err, "provider_resource_not_found", "Provider resource not found")
	}
	if patch.ProviderID != "" && patch.ProviderID != resource.ProviderID {
		if err := s.db.First(&Provider{}, "id = ?", patch.ProviderID).Error; err != nil {
			return ProviderResource{}, notFound(err, "provider_not_found", "Provider not found")
		}
		resource.ProviderID = patch.ProviderID
	}
	if patch.Name != "" {
		resource.Name = patch.Name
	}
	if patch.ResourceType != "" {
		resource.ResourceType = patch.ResourceType
	}
	resource.BaseURL = patch.BaseURL
	if patch.APIKey != "" {
		resource.APIKey = s.encryptSecret(patch.APIKey)
	}
	resource.Region = patch.Region
	resource.Environment = patch.Environment
	if patch.Status != "" {
		resource.Status = patch.Status
	}
	resource.Healthy = patch.Healthy
	if patch.Priority != 0 {
		resource.Priority = patch.Priority
	}
	if patch.Weight != 0 {
		resource.Weight = patch.Weight
	}
	resource.RateLimitRPM = patch.RateLimitRPM
	resource.TokenLimitTPM = patch.TokenLimitTPM
	resource.MaxConcurrency = patch.MaxConcurrency
	if patch.Headers != nil {
		resource.Headers = patch.Headers
	}
	if patch.Options != nil {
		resource.Options = patch.Options
	}
	resource.UpdatedAt = time.Now().UTC()
	if err := s.db.Save(&resource).Error; err != nil {
		return ProviderResource{}, err
	}
	resource.APIKey = ""
	return resource, nil
}

func (s *GormStore) DeleteProviderResource(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	return s.db.Transaction(func(tx *gorm.DB) error {
		var resource ProviderResource
		if err := tx.First(&resource, "id = ?", id).Error; err != nil {
			return notFound(err, "provider_resource_not_found", "Provider resource not found")
		}
		if err := tx.Model(&ModelRoute{}).
			Where("provider_resource_id = ?", id).
			Update("provider_resource_id", "").Error; err != nil {
			return err
		}
		return tx.Delete(&resource).Error
	})
}

func (s *GormStore) SetProviderResourceHealth(resourceID string, healthy bool) (ProviderResource, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	var resource ProviderResource
	if err := s.db.First(&resource, "id = ?", resourceID).Error; err != nil {
		return ProviderResource{}, notFound(err, "provider_resource_not_found", "Provider resource not found")
	}
	now := time.Now().UTC()
	if err := s.db.Model(&ProviderResource{}).
		Where("id = ?", resourceID).
		Updates(map[string]any{"healthy": healthy, "last_checked_at": now, "updated_at": now}).Error; err != nil {
		return ProviderResource{}, err
	}
	resource.Healthy = healthy
	resource.LastCheckedAt = &now
	resource.UpdatedAt = now
	resource.APIKey = ""
	return resource, nil
}

func (s *GormStore) CheckProviderResourceCapacity(resourceID string) error {
	if resourceID == "" {
		return nil
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	var resource ProviderResource
	if err := s.db.First(&resource, "id = ?", resourceID).Error; err != nil {
		return notFound(err, "provider_resource_not_found", "Provider resource not found")
	}
	now := time.Now().UTC()
	if resource.CooldownUntil != nil && now.Before(*resource.CooldownUntil) {
		return NewHTTPError(http.StatusTooManyRequests, "provider_resource_cooling_down", "Provider resource is cooling down")
	}
	if resource.MaxConcurrency > 0 && s.resourceInFlight[resource.ID] >= resource.MaxConcurrency {
		return NewHTTPError(http.StatusTooManyRequests, "provider_resource_concurrency_exceeded", "Provider resource concurrency limit exceeded")
	}
	if resource.RateLimitRPM > 0 || resource.TokenLimitTPM > 0 {
		bucket, err := providerResourceBucket(s.db, resource.ID, minuteBucket(now))
		if err != nil {
			return err
		}
		if resource.RateLimitRPM > 0 && bucket.Requests >= resource.RateLimitRPM {
			return NewHTTPError(http.StatusTooManyRequests, "provider_resource_rpm_exceeded", "Provider resource RPM limit exceeded")
		}
		if resource.TokenLimitTPM > 0 && bucket.Tokens >= resource.TokenLimitTPM {
			return NewHTTPError(http.StatusTooManyRequests, "provider_resource_tpm_exceeded", "Provider resource TPM limit exceeded")
		}
		bucket.Requests++
		bucket.UpdatedAt = now
		if err := s.db.Save(&bucket).Error; err != nil {
			return err
		}
	}
	s.resourceInFlight[resource.ID]++
	return nil
}

func (s *GormStore) FinishProviderResourceAttempt(resourceID string, success bool, usage Usage) {
	if resourceID == "" {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.resourceInFlight[resourceID] > 0 {
		s.resourceInFlight[resourceID]--
	}
	var resource ProviderResource
	if err := s.db.First(&resource, "id = ?", resourceID).Error; err != nil {
		return
	}
	now := time.Now().UTC()
	updates := map[string]any{"updated_at": now}
	if success {
		if usage.TotalTokens == 0 {
			usage.TotalTokens = usage.PromptTokens + usage.CompletionTokens
		}
		if usage.TotalTokens > 0 {
			_ = addProviderResourceTokens(s.db, resourceID, minuteBucket(now), usage.TotalTokens)
		}
		updates["failure_count"] = 0
		if resource.CooldownUntil != nil && now.After(*resource.CooldownUntil) {
			updates["cooldown_until"] = nil
		}
	} else {
		nextFailures := resource.FailureCount + 1
		updates["failure_count"] = nextFailures
		if nextFailures >= s.failureThreshold {
			cooldownUntil := now.Add(s.cooldownDuration)
			updates["healthy"] = false
			updates["cooldown_until"] = &cooldownUntil
			updates["last_checked_at"] = now
			_ = s.db.Create(&AlertEvent{
				ID:         NewID("alt"),
				ScopeType:  "provider_resource",
				ScopeID:    resource.ID,
				Severity:   "warning",
				Code:       "provider_resource_cooling_down",
				Message:    "Provider resource entered cooldown after repeated failures",
				ResourceID: resource.ProviderID,
				CreatedAt:  now,
			}).Error
		}
	}
	_ = s.db.Model(&ProviderResource{}).Where("id = ?", resourceID).Updates(updates).Error
}

func (s *GormStore) TestProvider(id string) (Provider, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	var provider Provider
	if err := s.db.First(&provider, "id = ?", id).Error; err != nil {
		return Provider{}, notFound(err, "provider_not_found", "Provider not found")
	}
	healthy := provider.Status == StatusActive
	if err := s.db.Model(&Provider{}).Where("id = ?", id).Update("healthy", healthy).Error; err != nil {
		return Provider{}, err
	}
	provider.Healthy = healthy
	provider.APIKey = ""
	return provider, nil
}

func (s *GormStore) TestProviderResource(id string) (ProviderResource, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	var resource ProviderResource
	if err := s.db.First(&resource, "id = ?", id).Error; err != nil {
		return ProviderResource{}, notFound(err, "provider_resource_not_found", "Provider resource not found")
	}
	now := time.Now().UTC()
	healthy := resource.Status == StatusActive
	updates := map[string]any{
		"healthy":         healthy,
		"last_checked_at": now,
		"updated_at":      now,
	}
	if healthy {
		updates["failure_count"] = 0
		updates["cooldown_until"] = nil
	}
	if err := s.db.Model(&ProviderResource{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return ProviderResource{}, err
	}
	resource.Healthy = healthy
	resource.LastCheckedAt = &now
	resource.FailureCount = 0
	resource.CooldownUntil = nil
	resource.UpdatedAt = now
	resource.APIKey = ""
	return resource, nil
}

func (s *GormStore) AddModel(model Model) Model {
	s.mu.Lock()
	defer s.mu.Unlock()

	if model.ID == "" {
		model.ID = model.Name
	}
	if model.Status == "" {
		model.Status = StatusActive
	}
	if model.CreatedAt.IsZero() {
		model.CreatedAt = time.Now().UTC()
	}
	_ = s.db.Clauses(clause.OnConflict{UpdateAll: true}).Create(&model).Error
	return model
}

func (s *GormStore) ListModels() []Model {
	var items []Model
	_ = s.db.Order("name asc").Find(&items).Error
	return items
}

func (s *GormStore) UpdateModel(name string, patch Model) (Model, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	var updated Model
	err := s.db.Transaction(func(tx *gorm.DB) error {
		var model Model
		if err := tx.First(&model, "name = ?", name).Error; err != nil {
			return notFound(err, "model_not_found", "Model not found")
		}
		originalID := model.ID
		originalName := model.Name
		renamed := patch.Name != "" && patch.Name != name
		if renamed {
			model.Name = patch.Name
			model.ID = patch.Name
		}
		if patch.Family != "" {
			model.Family = patch.Family
		}
		if patch.Modality != "" {
			model.Modality = patch.Modality
		}
		if patch.ContextWindow != 0 {
			model.ContextWindow = patch.ContextWindow
		}
		model.InputPriceUSDPer1M = patch.InputPriceUSDPer1M
		model.OutputPriceUSDPer1M = patch.OutputPriceUSDPer1M
		model.EmbeddingPriceUSDPer1M = patch.EmbeddingPriceUSDPer1M
		if patch.Status != "" {
			model.Status = patch.Status
		}
		if renamed {
			if err := tx.Delete(&Model{}, "id = ?", originalID).Error; err != nil {
				return err
			}
			if err := tx.Create(&model).Error; err != nil {
				return writeConflict(err, "model_conflict", "Model already exists")
			}
			if err := tx.Model(&ModelRoute{}).Where("model_name = ?", originalName).Update("model_name", model.Name).Error; err != nil {
				return err
			}
		} else if err := tx.Save(&model).Error; err != nil {
			return err
		}
		updated = model
		return nil
	})
	return updated, err
}

func (s *GormStore) DeleteModel(name string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	return s.db.Transaction(func(tx *gorm.DB) error {
		var model Model
		if err := tx.First(&model, "name = ?", name).Error; err != nil {
			return notFound(err, "model_not_found", "Model not found")
		}
		if err := tx.Where("model_name = ?", name).Delete(&ModelRoute{}).Error; err != nil {
			return err
		}
		return tx.Delete(&model).Error
	})
}

func (s *GormStore) AddRoute(route ModelRoute) ModelRoute {
	s.mu.Lock()
	defer s.mu.Unlock()

	if route.ID == "" {
		route.ID = NewID("route")
	}
	if route.Status == "" {
		route.Status = StatusActive
	}
	if route.Weight <= 0 {
		route.Weight = 1
	}
	if route.Strategy == "" {
		route.Strategy = "priority_weighted"
	}
	if route.CreatedAt.IsZero() {
		route.CreatedAt = time.Now().UTC()
	}
	_ = s.db.Clauses(clause.OnConflict{UpdateAll: true}).Create(&route).Error
	return route
}

func (s *GormStore) ListRoutes() []ModelRoute {
	var items []ModelRoute
	_ = s.db.Order("model_name asc, priority asc").Find(&items).Error
	return items
}

func (s *GormStore) UpdateRoute(id string, patch ModelRoute) (ModelRoute, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	var route ModelRoute
	if err := s.db.First(&route, "id = ?", id).Error; err != nil {
		return ModelRoute{}, notFound(err, "route_not_found", "Route not found")
	}
	if patch.ModelName != "" {
		route.ModelName = patch.ModelName
	}
	if patch.ProviderID != "" {
		route.ProviderID = patch.ProviderID
	}
	route.ProviderResourceID = patch.ProviderResourceID
	if patch.ProviderModel != "" {
		route.ProviderModel = patch.ProviderModel
	}
	if patch.Priority != 0 {
		route.Priority = patch.Priority
	}
	if patch.Weight != 0 {
		route.Weight = patch.Weight
	}
	if patch.Status != "" {
		route.Status = patch.Status
	}
	if patch.Strategy != "" {
		route.Strategy = patch.Strategy
	}
	return route, s.db.Save(&route).Error
}

func (s *GormStore) DeleteRoute(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	var route ModelRoute
	if err := s.db.First(&route, "id = ?", id).Error; err != nil {
		return notFound(err, "route_not_found", "Route not found")
	}
	return s.db.Delete(&route).Error
}

func (s *GormStore) SelectRoute(modelName string) (RouteSelection, error) {
	routes, err := s.SelectRouteCandidates(modelName)
	if err != nil {
		return RouteSelection{}, err
	}
	if len(routes) == 0 {
		return RouteSelection{}, ErrProviderMissing
	}
	return routes[0], nil
}

func (s *GormStore) SelectRouteCandidates(modelName string) ([]RouteSelection, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	var routes []ModelRoute
	if err := s.db.Where("model_name = ? AND status = ?", modelName, StatusActive).
		Order("priority asc, weight desc, created_at asc").
		Find(&routes).Error; err != nil {
		return nil, err
	}
	selections := make([]RouteSelection, 0, len(routes))
	for _, route := range routes {
		var provider Provider
		if err := s.db.First(&provider, "id = ?", route.ProviderID).Error; err != nil {
			continue
		}
		if provider.Status != StatusActive || !provider.Healthy {
			continue
		}
		if route.ProviderResourceID != "" {
			var resource ProviderResource
			if err := s.db.First(&resource, "id = ? AND provider_id = ?", route.ProviderResourceID, provider.ID).Error; err != nil {
				continue
			}
			if resource.Status != StatusActive || !resource.Healthy {
				continue
			}
			selections = append(selections, s.routeSelection(provider, &resource, route))
			continue
		}

		var resources []ProviderResource
		if err := s.db.Where("provider_id = ? AND status = ? AND healthy = ?", provider.ID, StatusActive, true).
			Order("priority asc, weight desc, created_at asc").
			Find(&resources).Error; err != nil {
			return nil, err
		}
		if len(resources) == 0 {
			selections = append(selections, s.routeSelection(provider, nil, route))
			continue
		}
		for _, resource := range resources {
			resourceRoute := route
			resourceRoute.ProviderResourceID = resource.ID
			if resource.Weight > 0 {
				resourceRoute.Weight = resource.Weight
			}
			selections = append(selections, s.routeSelection(provider, &resource, resourceRoute))
		}
	}
	if len(selections) == 0 {
		return nil, ErrProviderMissing
	}
	return selections, nil
}

func (s *GormStore) routeSelection(provider Provider, resource *ProviderResource, route ModelRoute) RouteSelection {
	provider.APIKey = s.decryptSecret(provider.APIKey)
	if resource == nil {
		return RouteSelection{
			Provider:      provider,
			ProviderModel: route.ProviderModel,
			Route:         route,
		}
	}
	effective := provider
	if resource.BaseURL != "" {
		effective.BaseURL = resource.BaseURL
	}
	if resource.APIKey != "" {
		effective.APIKey = s.decryptSecret(resource.APIKey)
	}
	if len(resource.Headers) > 0 {
		headers := map[string]string{}
		for key, value := range provider.Headers {
			headers[key] = value
		}
		for key, value := range resource.Headers {
			headers[key] = value
		}
		effective.Headers = headers
	}
	if len(resource.Options) > 0 {
		options := map[string]string{}
		for key, value := range provider.Options {
			options[key] = value
		}
		for key, value := range resource.Options {
			options[key] = value
		}
		effective.Options = options
	}
	publicResource := *resource
	publicResource.APIKey = ""
	return RouteSelection{
		Provider:      effective,
		Resource:      &publicResource,
		ProviderModel: route.ProviderModel,
		Route:         route,
	}
}

func (s *GormStore) MarkRouteUsed(routeID string) {
	if routeID == "" {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now().UTC()
	_ = s.db.Model(&ModelRoute{}).Where("id = ?", routeID).Update("last_used_at", now).Error
}

func (s *GormStore) MarkProviderResourceUsed(resourceID string) {
	if resourceID == "" {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now().UTC()
	_ = s.db.Model(&ProviderResource{}).
		Where("id = ?", resourceID).
		Updates(map[string]any{"last_used_at": now, "updated_at": now}).Error
}

func (s *GormStore) StartCall(project Project, key APIKey, modelName string) (CallContext, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	var call CallContext
	var keyID string
	err := s.db.Transaction(func(tx *gorm.DB) error {
		var privateKey APIKey
		if err := tx.First(&privateKey, "id = ?", key.ID).Error; err != nil {
			return ErrInvalidAPIKey
		}
		hydrateAPIKey(&privateKey)
		var model Model
		if err := tx.First(&model, "name = ? AND status = ?", modelName, StatusActive).Error; err != nil {
			return ErrModelNotAllowed
		}
		if len(privateKey.AllowedModels) > 0 && !privateKey.AllowedModels[modelName] {
			return ErrModelNotAllowed
		}
		effectiveLimits := mergeQuotaLimits(privateKey.Limits, quotaPolicyLimits(tx, project, privateKey))
		now := time.Now().UTC()
		dayCounter, err := quotaBucket(tx, privateKey.ID, "day", dayBucket(now))
		if err != nil {
			return err
		}
		monthCounter, err := quotaBucket(tx, privateKey.ID, "month", monthBucket(now))
		if err != nil {
			return err
		}
		if effectiveLimits.MaxConcurrency > 0 && s.inFlight[privateKey.ID] >= effectiveLimits.MaxConcurrency {
			return ErrRateLimitExceeded
		}
		if exceedsRequestQuota(effectiveLimits, &dayCounter.QuotaCounter, &monthCounter.QuotaCounter) ||
			exceedsTokenQuota(effectiveLimits, &dayCounter.QuotaCounter, &monthCounter.QuotaCounter) ||
			exceedsCostQuota(effectiveLimits, &dayCounter.QuotaCounter, &monthCounter.QuotaCounter) {
			return ErrQuotaExceeded
		}
		dayCounter.Requests++
		monthCounter.Requests++
		if err := tx.Save(&dayCounter).Error; err != nil {
			return err
		}
		if err := tx.Save(&monthCounter).Error; err != nil {
			return err
		}
		keyID = privateKey.ID
		call = CallContext{
			RequestID: NewID("req"),
			Project:   project,
			Key:       publicKey(privateKey),
			Model:     model,
			StartedAt: now,
		}
		return nil
	})
	if err != nil {
		return CallContext{}, err
	}
	s.inFlight[keyID]++
	return call, nil
}

func (s *GormStore) FinishCall(call CallContext, route RouteSelection, usage Usage, statusCode int, errorCode string, clientIP string, userAgent string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if call.Key.ID != "" && s.inFlight[call.Key.ID] > 0 {
		s.inFlight[call.Key.ID]--
	}
	usage = priceUsage(call.Model, usage)
	now := time.Now().UTC()
	_ = s.db.Transaction(func(tx *gorm.DB) error {
		var key APIKey
		if err := tx.First(&key, "id = ?", call.Key.ID).Error; err == nil {
			dayCounter, err := quotaBucket(tx, key.ID, "day", dayBucket(now))
			if err != nil {
				return err
			}
			monthCounter, err := quotaBucket(tx, key.ID, "month", monthBucket(now))
			if err != nil {
				return err
			}
			addUsage(&dayCounter.QuotaCounter, usage)
			addUsage(&monthCounter.QuotaCounter, usage)
			if err := tx.Save(&dayCounter).Error; err != nil {
				return err
			}
			if err := tx.Save(&monthCounter).Error; err != nil {
				return err
			}
			if err := raiseQuotaAlerts(tx, key, &dayCounter.QuotaCounter, &monthCounter.QuotaCounter); err != nil {
				return err
			}
		}
		if usage.TotalTokens > 0 || usage.CostUSD > 0 {
			if err := tx.Create(&UsageRecord{
				ID:                 NewID("use"),
				RequestID:          call.RequestID,
				ProjectID:          call.Project.ID,
				APIKeyID:           call.Key.ID,
				ModelName:          call.Model.Name,
				ProviderID:         route.Provider.ID,
				ProviderResourceID: routeResourceID(route),
				InputTokens:        usage.PromptTokens,
				OutputTokens:       usage.CompletionTokens,
				TotalTokens:        usage.TotalTokens,
				CostUSD:            usage.CostUSD,
				CreatedAt:          now,
			}).Error; err != nil {
				return err
			}
		}
		return tx.Create(&RequestLog{
			ID:                 NewID("log"),
			RequestID:          call.RequestID,
			ProjectID:          call.Project.ID,
			APIKeyID:           call.Key.ID,
			ModelName:          call.Model.Name,
			ProviderID:         route.Provider.ID,
			ProviderResourceID: routeResourceID(route),
			ProviderModel:      route.ProviderModel,
			StatusCode:         statusCode,
			ErrorCode:          errorCode,
			LatencyMS:          time.Since(call.StartedAt).Milliseconds(),
			ClientIP:           clientIP,
			UserAgent:          userAgent,
			CreatedAt:          now,
		}).Error
	})
}

func (s *GormStore) RecordRejectedRequest(project Project, key APIKey, modelName string, statusCode int, errorCode string, clientIP string, userAgent string) {
	_ = s.db.Create(&RequestLog{
		ID:         NewID("log"),
		RequestID:  NewID("req"),
		ProjectID:  project.ID,
		APIKeyID:   key.ID,
		ModelName:  modelName,
		StatusCode: statusCode,
		ErrorCode:  errorCode,
		ClientIP:   clientIP,
		UserAgent:  userAgent,
		CreatedAt:  time.Now().UTC(),
	}).Error
}

func (s *GormStore) UsageSummary() map[string]any {
	var records []UsageRecord
	var logs []RequestLog
	_ = s.db.Find(&records).Error
	_ = s.db.Find(&logs).Error

	var input, output, total int64
	var cost float64
	errorsCount := 0
	for _, record := range records {
		input += record.InputTokens
		output += record.OutputTokens
		total += record.TotalTokens
		cost += record.CostUSD
	}
	for _, log := range logs {
		if log.StatusCode >= 400 {
			errorsCount++
		}
	}
	return map[string]any{
		"request_count":      len(logs),
		"usage_record_count": len(records),
		"input_tokens":       input,
		"output_tokens":      output,
		"total_tokens":       total,
		"estimated_cost_usd": cost,
		"errors":             errorsCount,
	}
}

func (s *GormStore) UsageBreakdown() map[string]any {
	var records []UsageRecord
	_ = s.db.Find(&records).Error
	return map[string]any{
		"projects":  aggregateUsage(records, func(record UsageRecord) string { return record.ProjectID }),
		"models":    aggregateUsage(records, func(record UsageRecord) string { return record.ModelName }),
		"providers": aggregateUsage(records, func(record UsageRecord) string { return record.ProviderID }),
		"provider_resources": aggregateUsage(records, func(record UsageRecord) string {
			return record.ProviderResourceID
		}),
	}
}

func (s *GormStore) UsageTimeseries(days int) []map[string]any {
	if days <= 0 {
		days = 31
	}
	if days > 90 {
		days = 90
	}
	now := time.Now().UTC()
	series := make([]map[string]any, 0, days)
	indexByDay := map[string]int{}
	for i := days - 1; i >= 0; i-- {
		day := now.AddDate(0, 0, -i).Format("2006-01-02")
		indexByDay[day] = len(series)
		series = append(series, map[string]any{
			"date":               day,
			"request_count":      int64(0),
			"input_tokens":       int64(0),
			"output_tokens":      int64(0),
			"total_tokens":       int64(0),
			"estimated_cost_usd": float64(0),
		})
	}
	var records []UsageRecord
	_ = s.db.Where("created_at >= ?", now.AddDate(0, 0, -days+1)).Find(&records).Error
	for _, record := range records {
		day := record.CreatedAt.UTC().Format("2006-01-02")
		idx, ok := indexByDay[day]
		if !ok {
			continue
		}
		series[idx]["request_count"] = series[idx]["request_count"].(int64) + 1
		series[idx]["input_tokens"] = series[idx]["input_tokens"].(int64) + record.InputTokens
		series[idx]["output_tokens"] = series[idx]["output_tokens"].(int64) + record.OutputTokens
		series[idx]["total_tokens"] = series[idx]["total_tokens"].(int64) + record.TotalTokens
		series[idx]["estimated_cost_usd"] = series[idx]["estimated_cost_usd"].(float64) + record.CostUSD
	}
	return series
}

func (s *GormStore) ListRequestLogs() []RequestLog {
	var items []RequestLog
	_ = s.db.Order("created_at desc").Find(&items).Error
	return items
}

func (s *GormStore) ListAlerts() []AlertEvent {
	var items []AlertEvent
	_ = s.db.Order("created_at desc").Find(&items).Error
	return items
}

func (s *GormStore) ListAuditEvents() []AuditEvent {
	var items []AuditEvent
	_ = s.db.Order("created_at desc").Limit(500).Find(&items).Error
	return items
}

func (s *GormStore) RecordAuditEvent(event AuditEvent) {
	if event.ID == "" {
		event.ID = NewID("audit")
	}
	if event.CreatedAt.IsZero() {
		event.CreatedAt = time.Now().UTC()
	}
	if event.Status == "" {
		event.Status = "success"
	}
	_ = s.db.Create(&event).Error
}

func (s *GormStore) CreateResource(kind string, resource AdminResource) AdminResource {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now().UTC()
	if resource.ID == "" {
		resource.ID = NewID(resourcePrefix(kind))
	}
	if resource.Status == "" {
		resource.Status = StatusActive
	}
	if resource.Fields == nil {
		resource.Fields = map[string]any{}
	}
	resource.Kind = kind
	if resource.CreatedAt.IsZero() {
		resource.CreatedAt = now
	}
	resource.UpdatedAt = now
	_ = s.db.Clauses(clause.OnConflict{UpdateAll: true}).Create(&resource).Error
	return resource
}

func (s *GormStore) ListResources(kind string) []AdminResource {
	var items []AdminResource
	_ = s.db.Where("kind = ?", kind).Order("created_at asc").Find(&items).Error
	return items
}

func (s *GormStore) UpdateResource(kind string, id string, patch AdminResource) (AdminResource, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	var resource AdminResource
	if err := s.db.First(&resource, "kind = ? AND id = ?", kind, id).Error; err != nil {
		return AdminResource{}, notFound(err, "resource_not_found", "Resource not found")
	}
	if patch.Name != "" {
		resource.Name = patch.Name
	}
	resource.Description = patch.Description
	if patch.Status != "" {
		resource.Status = patch.Status
	}
	if patch.Fields != nil {
		resource.Fields = patch.Fields
	}
	resource.UpdatedAt = time.Now().UTC()
	return resource, s.db.Save(&resource).Error
}

func (s *GormStore) DeleteResource(kind string, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	var resource AdminResource
	if err := s.db.First(&resource, "kind = ? AND id = ?", kind, id).Error; err != nil {
		return notFound(err, "resource_not_found", "Resource not found")
	}
	return s.db.Delete(&resource).Error
}

func (s *GormStore) CreateAdminUser(user AdminUser, password string) (AdminUser, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	return createAdminUser(s.db, user, password)
}

func (s *GormStore) ListAdminUsers() []AdminUser {
	var items []AdminUser
	_ = s.db.Order("created_at asc").Find(&items).Error
	for i := range items {
		items[i] = publicAdminUser(items[i])
	}
	return items
}

func (s *GormStore) UpdateAdminUser(id string, patch AdminUser, password string) (AdminUser, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	var user AdminUser
	if err := s.db.First(&user, "id = ?", id).Error; err != nil {
		return AdminUser{}, notFound(err, "admin_user_not_found", "Admin user not found")
	}
	if patch.Username != "" {
		var count int64
		if err := s.db.Model(&AdminUser{}).Where("id <> ? AND username = ?", id, patch.Username).Count(&count).Error; err != nil {
			return AdminUser{}, err
		}
		if count > 0 {
			return AdminUser{}, NewHTTPError(409, "admin_user_conflict", "Username already exists")
		}
		user.Username = patch.Username
	}
	if patch.Name != "" {
		user.Name = patch.Name
	}
	if patch.Email != "" {
		var count int64
		if err := s.db.Model(&AdminUser{}).Where("id <> ? AND email = ?", id, patch.Email).Count(&count).Error; err != nil {
			return AdminUser{}, err
		}
		if count > 0 {
			return AdminUser{}, NewHTTPError(409, "admin_user_conflict", "Email already exists")
		}
		user.Email = patch.Email
	}
	if patch.Role != "" {
		user.Role = patch.Role
	}
	user.TeamID = patch.TeamID
	if patch.Status != "" {
		user.Status = patch.Status
	}
	if password != "" {
		user.PasswordHash = HashSecret(password)
	}
	user.UpdatedAt = time.Now().UTC()
	if err := s.db.Save(&user).Error; err != nil {
		return AdminUser{}, err
	}
	return publicAdminUser(user), nil
}

func (s *GormStore) DeleteAdminUser(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	return s.db.Transaction(func(tx *gorm.DB) error {
		var user AdminUser
		if err := tx.First(&user, "id = ?", id).Error; err != nil {
			return notFound(err, "admin_user_not_found", "Admin user not found")
		}
		var activeUsers int64
		if err := tx.Model(&AdminUser{}).Where("status = ?", StatusActive).Count(&activeUsers).Error; err != nil {
			return err
		}
		if activeUsers <= 1 && user.Status == StatusActive {
			return NewHTTPError(400, "last_admin_user", "Cannot delete the last active admin user")
		}
		if err := tx.Where("user_id = ?", id).Delete(&AdminSession{}).Error; err != nil {
			return err
		}
		return tx.Delete(&user).Error
	})
}

func (s *GormStore) AuthenticateAdminUser(identity string, password string, ttl time.Duration) (AdminUser, AdminSession, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	identity = strings.ToLower(strings.TrimSpace(identity))
	var user AdminUser
	if err := s.db.Where("lower(email) = ? OR lower(username) = ?", identity, identity).First(&user).Error; err != nil {
		return AdminUser{}, AdminSession{}, NewHTTPError(401, "invalid_credentials", "Invalid username or password")
	}
	if user.Status != StatusActive {
		return AdminUser{}, AdminSession{}, NewHTTPError(403, "admin_user_disabled", "Admin user is disabled")
	}
	if user.PasswordHash != HashSecret(password) {
		return AdminUser{}, AdminSession{}, NewHTTPError(401, "invalid_credentials", "Invalid username or password")
	}
	now := time.Now().UTC()
	session := AdminSession{
		Token:     GenerateAdminSessionToken(),
		UserID:    user.ID,
		CreatedAt: now,
		ExpiresAt: now.Add(ttl),
	}
	user.LastLoginAt = &now
	user.UpdatedAt = now
	err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&user).Error; err != nil {
			return err
		}
		return tx.Create(&session).Error
	})
	if err != nil {
		return AdminUser{}, AdminSession{}, err
	}
	return publicAdminUser(user), session, nil
}

func (s *GormStore) ValidateAdminSession(token string) (AdminUser, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	var session AdminSession
	if err := s.db.First(&session, "token = ?", token).Error; err != nil {
		return AdminUser{}, false
	}
	if time.Now().UTC().After(session.ExpiresAt) {
		_ = s.db.Delete(&session).Error
		return AdminUser{}, false
	}
	var user AdminUser
	if err := s.db.First(&user, "id = ? AND status = ?", session.UserID, StatusActive).Error; err != nil {
		return AdminUser{}, false
	}
	return publicAdminUser(user), true
}

func (s *GormStore) RevokeAdminSession(token string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	_ = s.db.Delete(&AdminSession{}, "token = ?", token).Error
}

func (s *GormStore) AccessibleModels(key APIKey) []Model {
	s.mu.Lock()
	defer s.mu.Unlock()

	var privateKey APIKey
	if err := s.db.First(&privateKey, "id = ?", key.ID).Error; err != nil {
		return nil
	}
	hydrateAPIKey(&privateKey)
	var models []Model
	if err := s.db.Where("status = ?", StatusActive).Order("name asc").Find(&models).Error; err != nil {
		return nil
	}
	if len(privateKey.AllowedModels) == 0 {
		return models
	}
	items := make([]Model, 0, len(models))
	for _, model := range models {
		if privateKey.AllowedModels[model.Name] {
			items = append(items, model)
		}
	}
	return items
}

func quotaBucket(tx *gorm.DB, keyID, scope, bucket string) (QuotaBucket, error) {
	item := QuotaBucket{KeyID: keyID, Scope: scope, Bucket: bucket}
	err := tx.First(&item, "key_id = ? AND scope = ? AND bucket = ?", keyID, scope, bucket).Error
	if err == nil {
		return item, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return QuotaBucket{}, err
	}
	if err := tx.Create(&item).Error; err != nil {
		return QuotaBucket{}, err
	}
	return item, nil
}

func providerResourceBucket(tx *gorm.DB, resourceID, bucket string) (ProviderResourceBucket, error) {
	item := ProviderResourceBucket{ResourceID: resourceID, Bucket: bucket}
	err := tx.First(&item, "resource_id = ? AND bucket = ?", resourceID, bucket).Error
	if err == nil {
		return item, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return ProviderResourceBucket{}, err
	}
	item.UpdatedAt = time.Now().UTC()
	if err := tx.Create(&item).Error; err != nil {
		return ProviderResourceBucket{}, err
	}
	return item, nil
}

func addProviderResourceTokens(tx *gorm.DB, resourceID string, bucket string, tokens int64) error {
	if tokens <= 0 {
		return nil
	}
	item, err := providerResourceBucket(tx, resourceID, bucket)
	if err != nil {
		return err
	}
	item.Tokens += tokens
	item.UpdatedAt = time.Now().UTC()
	return tx.Save(&item).Error
}

func priceUsage(model Model, usage Usage) Usage {
	if usage.TotalTokens == 0 {
		usage.TotalTokens = usage.PromptTokens + usage.CompletionTokens
	}
	if usage.CostUSD == 0 {
		if model.Modality == "embedding" && model.EmbeddingPriceUSDPer1M > 0 {
			usage.CostUSD = float64(usage.TotalTokens) * model.EmbeddingPriceUSDPer1M / 1_000_000
		} else {
			usage.CostUSD = float64(usage.PromptTokens)*model.InputPriceUSDPer1M/1_000_000 +
				float64(usage.CompletionTokens)*model.OutputPriceUSDPer1M/1_000_000
		}
	}
	return usage
}

func raiseQuotaAlerts(tx *gorm.DB, key APIKey, dayCounter, monthCounter *QuotaCounter) error {
	checks := []struct {
		limit     float64
		current   float64
		code      string
		message   string
		scopeType string
	}{
		{float64(key.Limits.DailyTokens), float64(dayCounter.TotalTokens), "daily_tokens_near_limit", "Daily token quota is near or above limit", "api_key"},
		{float64(key.Limits.MonthlyTokens), float64(monthCounter.TotalTokens), "monthly_tokens_near_limit", "Monthly token quota is near or above limit", "api_key"},
		{key.Limits.DailyCostUSD, dayCounter.CostUSD, "daily_cost_near_limit", "Daily cost quota is near or above limit", "api_key"},
		{key.Limits.MonthlyCostUSD, monthCounter.CostUSD, "monthly_cost_near_limit", "Monthly cost quota is near or above limit", "api_key"},
	}
	for _, check := range checks {
		if check.limit <= 0 || check.current < check.limit {
			continue
		}
		if err := tx.Create(&AlertEvent{
			ID:         NewID("alt"),
			ScopeType:  check.scopeType,
			ScopeID:    key.ID,
			Severity:   "warning",
			Code:       check.code,
			Message:    check.message,
			ResourceID: key.ProjectID,
			CreatedAt:  time.Now().UTC(),
		}).Error; err != nil {
			return err
		}
	}
	return nil
}

func quotaPolicyLimits(tx *gorm.DB, project Project, key APIKey) QuotaLimits {
	var resources []AdminResource
	_ = tx.Where("kind = ? AND status = ?", "quota-policies", StatusActive).Find(&resources).Error
	var limits QuotaLimits
	for _, resource := range resources {
		scope := strings.ToLower(strings.TrimSpace(stringField(resource.Fields, "scope")))
		if scope == "" {
			scope = strings.ToLower(strings.TrimSpace(stringField(resource.Fields, "scope_type")))
		}
		scopeID := strings.TrimSpace(stringField(resource.Fields, "scope_id"))
		if !quotaPolicyApplies(scope, scopeID, project, key) {
			continue
		}
		limits = mergeQuotaLimits(limits, QuotaLimits{
			DailyRequests:   int64Field(resource.Fields, "daily_requests"),
			MonthlyRequests: int64Field(resource.Fields, "monthly_requests"),
			DailyTokens:     int64Field(resource.Fields, "daily_tokens"),
			MonthlyTokens:   int64Field(resource.Fields, "monthly_tokens"),
			DailyCostUSD:    float64Field(resource.Fields, "daily_cost_usd"),
			MonthlyCostUSD:  float64Field(resource.Fields, "monthly_cost_usd"),
			MaxConcurrency:  int64Field(resource.Fields, "max_concurrency"),
		})
	}
	return limits
}

func quotaPolicyApplies(scope string, scopeID string, project Project, key APIKey) bool {
	if scope == "" || scope == "global" || scope == "organization" {
		return scopeID == "" || scopeID == "default" || scopeID == "global"
	}
	switch scope {
	case "project":
		return scopeID == "" || scopeID == project.ID
	case "api_key", "key":
		return scopeID == "" || scopeID == key.ID
	case "team":
		return scopeID == "" || scopeID == project.TeamID
	default:
		return false
	}
}

func mergeQuotaLimits(base QuotaLimits, override QuotaLimits) QuotaLimits {
	return QuotaLimits{
		DailyRequests:   strictInt64(base.DailyRequests, override.DailyRequests),
		MonthlyRequests: strictInt64(base.MonthlyRequests, override.MonthlyRequests),
		DailyTokens:     strictInt64(base.DailyTokens, override.DailyTokens),
		MonthlyTokens:   strictInt64(base.MonthlyTokens, override.MonthlyTokens),
		DailyCostUSD:    strictFloat64(base.DailyCostUSD, override.DailyCostUSD),
		MonthlyCostUSD:  strictFloat64(base.MonthlyCostUSD, override.MonthlyCostUSD),
		MaxConcurrency:  strictInt64(base.MaxConcurrency, override.MaxConcurrency),
	}
}

func strictInt64(a int64, b int64) int64 {
	if a <= 0 {
		return b
	}
	if b <= 0 {
		return a
	}
	if a < b {
		return a
	}
	return b
}

func strictFloat64(a float64, b float64) float64 {
	if a <= 0 {
		return b
	}
	if b <= 0 {
		return a
	}
	if a < b {
		return a
	}
	return b
}

func stringField(fields map[string]any, key string) string {
	if fields == nil {
		return ""
	}
	value, ok := fields[key]
	if !ok || value == nil {
		return ""
	}
	switch typed := value.(type) {
	case string:
		return typed
	default:
		return fmt.Sprint(typed)
	}
}

func int64Field(fields map[string]any, key string) int64 {
	if fields == nil {
		return 0
	}
	value, ok := fields[key]
	if !ok || value == nil {
		return 0
	}
	switch typed := value.(type) {
	case int:
		return int64(typed)
	case int64:
		return typed
	case float64:
		return int64(typed)
	case json.Number:
		parsed, _ := typed.Int64()
		return parsed
	case string:
		var parsed int64
		for _, ch := range strings.TrimSpace(typed) {
			if ch < '0' || ch > '9' {
				return 0
			}
			parsed = parsed*10 + int64(ch-'0')
		}
		return parsed
	default:
		return 0
	}
}

func float64Field(fields map[string]any, key string) float64 {
	if fields == nil {
		return 0
	}
	value, ok := fields[key]
	if !ok || value == nil {
		return 0
	}
	switch typed := value.(type) {
	case int:
		return float64(typed)
	case int64:
		return float64(typed)
	case float64:
		return typed
	case json.Number:
		parsed, _ := typed.Float64()
		return parsed
	case string:
		var parsed float64
		var scale float64
		for _, ch := range strings.TrimSpace(typed) {
			if ch == '.' && scale == 0 {
				scale = 1
				continue
			}
			if ch < '0' || ch > '9' {
				return 0
			}
			if scale > 0 {
				scale *= 10
				parsed += float64(ch-'0') / scale
			} else {
				parsed = parsed*10 + float64(ch-'0')
			}
		}
		return parsed
	default:
		return 0
	}
}

func createAdminUser(db *gorm.DB, user AdminUser, password string) (AdminUser, error) {
	now := time.Now().UTC()
	if user.ID == "" {
		user.ID = NewID("usr")
	}
	if user.Username == "" {
		user.Username = user.Email
	}
	if user.Email == "" {
		return AdminUser{}, NewHTTPError(400, "invalid_admin_user", "email is required")
	}
	if user.Name == "" {
		user.Name = user.Username
	}
	if user.Role == "" {
		user.Role = "viewer"
	}
	if user.Status == "" {
		user.Status = StatusActive
	}
	if password == "" && user.PasswordHash == "" {
		return AdminUser{}, NewHTTPError(400, "invalid_admin_user", "password is required")
	}
	var count int64
	if err := db.Model(&AdminUser{}).
		Where("username = ? OR email = ?", user.Username, user.Email).
		Count(&count).Error; err != nil {
		return AdminUser{}, err
	}
	if count > 0 {
		return AdminUser{}, NewHTTPError(409, "admin_user_conflict", "Username or email already exists")
	}
	if user.PasswordHash == "" {
		user.PasswordHash = HashSecret(password)
	}
	if user.CreatedAt.IsZero() {
		user.CreatedAt = now
	}
	user.UpdatedAt = now
	if err := db.Create(&user).Error; err != nil {
		return AdminUser{}, writeConflict(err, "admin_user_conflict", "Username or email already exists")
	}
	return publicAdminUser(user), nil
}

func publicKeys(keys []APIKey) []APIKey {
	items := make([]APIKey, 0, len(keys))
	for _, key := range keys {
		hydrateAPIKey(&key)
		items = append(items, publicKey(key))
	}
	return items
}

func hydrateAPIKey(key *APIKey) {
	key.AllowedModels = AllowedModelSet(key.Allowed)
}

func publicKey(key APIKey) APIKey {
	key.KeyHash = ""
	if key.Allowed == nil && key.AllowedModels != nil {
		key.Allowed = make([]string, 0, len(key.AllowedModels))
		for model := range key.AllowedModels {
			key.Allowed = append(key.Allowed, model)
		}
		sort.Strings(key.Allowed)
	}
	return key
}

func publicAdminUser(user AdminUser) AdminUser {
	user.PasswordHash = ""
	return user
}

func notFound(err error, code, message string) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return NewHTTPError(404, code, message)
	}
	return err
}

func writeConflict(err error, code, message string) error {
	if errors.Is(err, gorm.ErrDuplicatedKey) {
		return NewHTTPError(409, code, message)
	}
	return err
}

func (s *GormStore) encryptSecret(secret string) string {
	if strings.TrimSpace(secret) == "" || strings.HasPrefix(secret, "enc:v1:") {
		return secret
	}
	block, err := aes.NewCipher(secretKeyBytes(s.secretKey))
	if err != nil {
		return secret
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return secret
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return secret
	}
	ciphertext := gcm.Seal(nil, nonce, []byte(secret), nil)
	return "enc:v1:" + base64.RawURLEncoding.EncodeToString(append(nonce, ciphertext...))
}

func (s *GormStore) decryptSecret(secret string) string {
	if !strings.HasPrefix(secret, "enc:v1:") {
		return secret
	}
	data, err := base64.RawURLEncoding.DecodeString(strings.TrimPrefix(secret, "enc:v1:"))
	if err != nil {
		return ""
	}
	block, err := aes.NewCipher(secretKeyBytes(s.secretKey))
	if err != nil {
		return ""
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return ""
	}
	if len(data) < gcm.NonceSize() {
		return ""
	}
	nonce := data[:gcm.NonceSize()]
	ciphertext := data[gcm.NonceSize():]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return ""
	}
	return string(plaintext)
}

func secretKeyBytes(secret string) []byte {
	sum := sha256.Sum256([]byte(secret))
	return sum[:]
}

func defaultInt(value int, fallback int) int {
	if value <= 0 {
		return fallback
	}
	return value
}

func exceedsRequestQuota(limits QuotaLimits, day, month *QuotaCounter) bool {
	return (limits.DailyRequests > 0 && day.Requests >= limits.DailyRequests) ||
		(limits.MonthlyRequests > 0 && month.Requests >= limits.MonthlyRequests)
}

func exceedsTokenQuota(limits QuotaLimits, day, month *QuotaCounter) bool {
	return (limits.DailyTokens > 0 && day.TotalTokens >= limits.DailyTokens) ||
		(limits.MonthlyTokens > 0 && month.TotalTokens >= limits.MonthlyTokens)
}

func exceedsCostQuota(limits QuotaLimits, day, month *QuotaCounter) bool {
	return (limits.DailyCostUSD > 0 && day.CostUSD >= limits.DailyCostUSD) ||
		(limits.MonthlyCostUSD > 0 && month.CostUSD >= limits.MonthlyCostUSD)
}

func addUsage(counter *QuotaCounter, usage Usage) {
	counter.PromptTokens += usage.PromptTokens
	counter.CompletionTokens += usage.CompletionTokens
	counter.TotalTokens += usage.TotalTokens
	counter.CostUSD += usage.CostUSD
}

func aggregateUsage(records []UsageRecord, keyFn func(UsageRecord) string) []map[string]any {
	type bucket struct {
		Key          string
		Requests     int64
		InputTokens  int64
		OutputTokens int64
		TotalTokens  int64
		CostUSD      float64
	}
	buckets := map[string]*bucket{}
	for _, record := range records {
		key := keyFn(record)
		if key == "" {
			key = "unknown"
		}
		item, ok := buckets[key]
		if !ok {
			item = &bucket{Key: key}
			buckets[key] = item
		}
		item.Requests++
		item.InputTokens += record.InputTokens
		item.OutputTokens += record.OutputTokens
		item.TotalTokens += record.TotalTokens
		item.CostUSD += record.CostUSD
	}
	items := make([]bucket, 0, len(buckets))
	for _, item := range buckets {
		items = append(items, *item)
	}
	sort.Slice(items, func(i, j int) bool {
		if items[i].CostUSD == items[j].CostUSD {
			return items[i].TotalTokens > items[j].TotalTokens
		}
		return items[i].CostUSD > items[j].CostUSD
	})
	result := make([]map[string]any, 0, len(items))
	for _, item := range items {
		result = append(result, map[string]any{
			"id":                 item.Key,
			"request_count":      item.Requests,
			"input_tokens":       item.InputTokens,
			"output_tokens":      item.OutputTokens,
			"total_tokens":       item.TotalTokens,
			"estimated_cost_usd": item.CostUSD,
		})
	}
	return result
}

func dayBucket(t time.Time) string {
	return t.UTC().Format("2006-01-02")
}

func monthBucket(t time.Time) string {
	return t.UTC().Format("2006-01")
}

func minuteBucket(t time.Time) string {
	return t.UTC().Format("2006-01-02T15:04")
}

func resourcePrefix(kind string) string {
	switch kind {
	case "teams":
		return "team"
	case "users":
		return "usr"
	case "monitors":
		return "mon"
	case "proxies":
		return "prx"
	case "announcements":
		return "ann"
	case "settings":
		return "cfg"
	case "security-policies":
		return "sec"
	case "alert-rules":
		return "alr"
	case "quota-policies":
		return "quo"
	default:
		return "res"
	}
}
