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

// loadDotEnv 从常见位置加载 .env 文件到环境变量。
// 使用 godotenv.Load（非 Overload），已存在的系统环境变量优先，不会被 .env 覆盖。
func loadDotEnv() {
	candidates := []string{
		".env",           // 从 backend 目录运行
		"backend/.env",   // 从仓库根目录运行
		"../.env",        // 从 backend/cmd 等子目录运行
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
