package main

import (
	"log"
	"net/http"
	"os"

	"tokenhub/backend/internal/server"
)

func main() {
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

func getenv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
