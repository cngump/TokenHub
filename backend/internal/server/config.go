package server

import "os"

type Config struct {
	AdminToken               string
	DatabaseURL              string
	SecretKey                string
	ResourceFailureThreshold int
	ResourceCooldownSeconds  int
}

func ConfigFromEnv() Config {
	return Config{
		AdminToken:               getenv("TOKENHUB_ADMIN_TOKEN", "dev_admin_token"),
		DatabaseURL:              getenv("TOKENHUB_DATABASE_URL", defaultSQLiteDatabaseURL),
		SecretKey:                getenv("TOKENHUB_SECRET_KEY", "dev_tokenhub_secret_key"),
		ResourceFailureThreshold: getenvInt("TOKENHUB_RESOURCE_FAILURE_THRESHOLD", 3),
		ResourceCooldownSeconds:  getenvInt("TOKENHUB_RESOURCE_COOLDOWN_SECONDS", 300),
	}
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
