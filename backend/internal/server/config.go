package server

import (
	"fmt"
	"os"
	"strings"
)

type Config struct {
	Environment              string
	AdminToken               string
	BootstrapAdminPassword   string
	DatabaseURL              string
	SQLiteBackupDir          string
	ModelCatalogFile         string
	SecretKey                string
	TrustedProxyCIDRs        []string
	SeedDemo                 bool
	ResourceFailureThreshold int
	ResourceCooldownSeconds  int
}

func ConfigFromEnv() Config {
	return Config{
		Environment:              getenv("TOKENHUB_ENV", "dev"),
		AdminToken:               getenv("TOKENHUB_ADMIN_TOKEN", "dev_admin_token"),
		BootstrapAdminPassword:   getenv("TOKENHUB_BOOTSTRAP_ADMIN_PASSWORD", "admin123456"),
		DatabaseURL:              getenv("TOKENHUB_DATABASE_URL", defaultConfigDatabaseURL()),
		SQLiteBackupDir:          getenv("TOKENHUB_SQLITE_BACKUP_DIR", defaultSQLiteBackupDir()),
		ModelCatalogFile:         getenv("TOKENHUB_MODEL_CATALOG_FILE", defaultModelCatalogFile()),
		SecretKey:                getenv("TOKENHUB_SECRET_KEY", "dev_tokenhub_secret_key"),
		TrustedProxyCIDRs:        getenvList("TOKENHUB_TRUSTED_PROXY_CIDRS"),
		SeedDemo:                 getenvBool("TOKENHUB_SEED_DEMO", false),
		ResourceFailureThreshold: getenvInt("TOKENHUB_RESOURCE_FAILURE_THRESHOLD", 3),
		ResourceCooldownSeconds:  getenvInt("TOKENHUB_RESOURCE_COOLDOWN_SECONDS", 300),
	}
}

func (c Config) ValidateForStartup() error {
	environment := strings.ToLower(strings.TrimSpace(c.Environment))
	if environment == "" {
		return fmt.Errorf("unsafe TOKENHUB_ENV configuration: set an explicit environment")
	}
	switch environment {
	case "dev", "development", "local", "test":
		return nil
	}
	invalid := make([]string, 0, 3)
	if reason := weakProductionSecretReason(c.AdminToken, 32, "dev_admin_token", "change-me-tokenhub-admin-token"); reason != "" {
		invalid = append(invalid, "TOKENHUB_ADMIN_TOKEN "+reason)
	}
	if reason := weakProductionSecretReason(c.SecretKey, 32, "dev_tokenhub_secret_key", "change-me-tokenhub-secret-key"); reason != "" {
		invalid = append(invalid, "TOKENHUB_SECRET_KEY "+reason)
	}
	if reason := weakProductionSecretReason(c.BootstrapAdminPassword, 12, "admin123456", "change-me-tokenhub-admin-password"); reason != "" {
		invalid = append(invalid, "TOKENHUB_BOOTSTRAP_ADMIN_PASSWORD "+reason)
	}
	if len(invalid) > 0 {
		return fmt.Errorf("unsafe %s configuration: %s", environment, strings.Join(invalid, "; "))
	}
	return nil
}

func weakProductionSecretReason(value string, minimumLength int, blocked ...string) string {
	value = strings.TrimSpace(value)
	for _, candidate := range blocked {
		if value == candidate {
			return "must not use a default placeholder value"
		}
	}
	if len(value) < minimumLength {
		return fmt.Sprintf("must be at least %d bytes after trimming whitespace", minimumLength)
	}
	return ""
}

func getenvList(key string) []string {
	fields := strings.FieldsFunc(os.Getenv(key), func(r rune) bool {
		return r == ',' || r == ';' || r == '\n' || r == '\t' || r == ' '
	})
	values := make([]string, 0, len(fields))
	for _, field := range fields {
		if value := strings.TrimSpace(field); value != "" {
			values = append(values, value)
		}
	}
	return values
}

func defaultConfigDatabaseURL() string {
	if pathExists("backend/data") {
		return "sqlite://backend/data/tokenhub.db"
	}
	return defaultSQLiteDatabaseURL
}

func defaultSQLiteBackupDir() string {
	if pathExists("backend/data") {
		return "backend/data/backups"
	}
	return "data/backups"
}

func defaultModelCatalogFile() string {
	for _, path := range []string{
		"data/model-catalog.yaml",
		"../data/model-catalog.yaml",
		"../../data/model-catalog.yaml",
		"../../../data/model-catalog.yaml",
		"/app/catalog/model-catalog.yaml",
		"/app/data/model-catalog.yaml",
	} {
		if pathExists(path) {
			return path
		}
	}
	return "data/model-catalog.yaml"
}

func pathExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func getenv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func getenvInt(key string, fallback int) int {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	var parsed int
	for _, ch := range value {
		if ch < '0' || ch > '9' {
			return fallback
		}
		parsed = parsed*10 + int(ch-'0')
	}
	if parsed <= 0 {
		return fallback
	}
	return parsed
}

func getenvBool(key string, fallback bool) bool {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	switch value {
	case "1", "true", "TRUE", "True", "yes", "YES", "on", "ON":
		return true
	case "0", "false", "FALSE", "False", "no", "NO", "off", "OFF":
		return false
	default:
		return fallback
	}
}
