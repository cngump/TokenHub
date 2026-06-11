package server

import "os"

type Config struct {
	AdminToken  string
	DatabaseURL string
}

func ConfigFromEnv() Config {
	return Config{
		AdminToken:  getenv("TOKENHUB_ADMIN_TOKEN", "dev_admin_token"),
		DatabaseURL: getenv("TOKENHUB_DATABASE_URL", defaultSQLiteDatabaseURL),
	}
}

func getenv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
