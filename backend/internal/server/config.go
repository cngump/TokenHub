package server

import "os"

type Config struct {
	AdminToken                   string
	DatabaseURL                  string
	SQLiteBackupDir              string
	ModelCatalogFile             string
	SecretKey                    string
	SeedDemo                     bool
	ResourceFailureThreshold     int
	ResourceCooldownSeconds      int
	DBMaxOpenConns               int
	DBMaxIdleConns               int
	DBConnMaxLifetimeMinutes     int
}

func ConfigFromEnv() Config {
	return Config{
		AdminToken:                   getenv("TOKENHUB_ADMIN_TOKEN", "dev_admin_token"),
		DatabaseURL:                  getenv("TOKENHUB_DATABASE_URL", defaultConfigDatabaseURL()),
		SQLiteBackupDir:              getenv("TOKENHUB_SQLITE_BACKUP_DIR", defaultSQLiteBackupDir()),
		ModelCatalogFile:             getenv("TOKENHUB_MODEL_CATALOG_FILE", defaultModelCatalogFile()),
		SecretKey:                    getenv("TOKENHUB_SECRET_KEY", "dev_tokenhub_secret_key"),
		SeedDemo:                     getenvBool("TOKENHUB_SEED_DEMO", false),
		ResourceFailureThreshold:     getenvInt("TOKENHUB_RESOURCE_FAILURE_THRESHOLD", 3),
		ResourceCooldownSeconds:      getenvInt("TOKENHUB_RESOURCE_COOLDOWN_SECONDS", 300),
		DBMaxOpenConns:               getenvInt("TOKENHUB_DB_MAX_OPEN_CONNS", 25),
		DBMaxIdleConns:               getenvInt("TOKENHUB_DB_MAX_IDLE_CONNS", 5),
		DBConnMaxLifetimeMinutes:     getenvInt("TOKENHUB_DB_CONN_MAX_LIFETIME_MINUTES", 30),
	}
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
