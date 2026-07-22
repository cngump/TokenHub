package main

import (
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"tokenhub/backend/internal/server"
)

func main() {
	loadDotEnv()

	addr := getenv("TOKENHUB_HTTP_ADDR", ":8080")
	config := server.ConfigFromEnv()
	if err := config.ValidateForStartup(); err != nil {
		log.Fatal(err)
	}

	store, err := server.OpenStoreWithConfig(config.DatabaseURL, config)
	if err != nil {
		log.Fatal(err)
	}
	if config.SeedDemo {
		if err := server.SeedDemoDataWithConfig(store, config); err != nil {
			log.Fatal(err)
		}
	} else if err := server.BootstrapBaseDataWithConfig(store, config); err != nil {
		log.Fatal(err)
	}

	srv := &http.Server{
		Addr:    addr,
		Handler: server.NewWithConfig(store, config).Handler(),
	}

	log.Printf("tokenhub backend listening on %s", addr)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}

// loadDotEnv loads the .env file into environment variables from common locations.
// It uses godotenv.Load (not Overload), so existing system environment variables
// take precedence and are not overridden by .env.
func loadDotEnv() {
	candidates := []string{
		".env",         // running from the backend directory
		"backend/.env", // running from the repository root
		"../.env",      // running from a subdirectory such as backend/cmd
	}
	for _, path := range candidates {
		if _, err := os.Stat(path); err != nil {
			continue
		}
		if err := godotenv.Load(path); err != nil {
			log.Printf("[tokenhub] failed to load env file %s: %v", path, err)
			continue
		}
		log.Printf("[tokenhub] loaded environment from %s", path)
		return
	}
}

func getenv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
