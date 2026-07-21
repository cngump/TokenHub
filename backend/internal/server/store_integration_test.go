// +build integration

package server

import (
	"os"
	"testing"
	"time"
)

// TestPostgreSQLIntegration 测试 PostgreSQL 数据库集成
func TestPostgreSQLIntegration(t *testing.T) {
	// 跳过测试如果没有配置 PostgreSQL
	pgURL := os.Getenv("TEST_POSTGRES_URL")
	if pgURL == "" {
		t.Skip("TEST_POSTGRES_URL not set, skipping PostgreSQL integration test")
	}

	config := Config{
		AdminToken:                   "test_admin_token",
		DatabaseURL:                  pgURL,
		SecretKey:                    "test_secret_key",
		ResourceFailureThreshold:     3,
		ResourceCooldownSeconds:      300,
		DBMaxOpenConns:               10,
		DBMaxIdleConns:               2,
		DBConnMaxLifetimeMinutes:     30,
	}

	store, err := NewStoreWithDialect(pgURL, config)
	if err != nil {
		t.Fatalf("Failed to create PostgreSQL store: %v", err)
	}

	// 验证数据库类型
	if !store.IsPostgreSQL() {
		t.Error("Expected PostgreSQL driver, got SQLite")
	}

	// 测试基本 CRUD 操作
	t.Run("CreateProject", func(t *testing.T) {
		project := Project{
			ID:     NewID("prj"),
			Name:   "Test Project",
			Status: StatusActive,
		}

		created := store.CreateProject(project)
		if created.ID != project.ID {
			t.Errorf("Expected project ID %s, got %s", project.ID, created.ID)
		}

		// 清理
		defer store.DeleteProject(created.ID)
	})

	t.Run("CreateAndValidateAPIKey", func(t *testing.T) {
		// 先创建项目
		project := store.CreateProject(Project{
			ID:     NewID("prj"),
			Name:   "API Key Test Project",
			Status: StatusActive,
		})
		defer store.DeleteProject(project.ID)

		// 创建 API Key
		key := APIKey{
			Name:   "Test Key",
			Status: StatusActive,
			Group:  "default",
		}

		created, secret, err := store.CreateAPIKey(project.ID, key, "")
		if err != nil {
			t.Fatalf("Failed to create API key: %v", err)
		}

		// 验证 API Key
		validatedProj, validatedKey, err := store.ValidateAPIKey(secret, "127.0.0.1")
		if err != nil {
			t.Fatalf("Failed to validate API key: %v", err)
		}

		if validatedProj.ID != project.ID {
			t.Errorf("Expected project ID %s, got %s", project.ID, validatedProj.ID)
		}

		if validatedKey.ID != created.ID {
			t.Errorf("Expected key ID %s, got %s", created.ID, validatedKey.ID)
		}

		// 清理
		defer store.DeleteAPIKey(created.ID)
	})

	t.Run("AdminUserAuthentication", func(t *testing.T) {
		// 创建管理员用户
		user := AdminUser{
			Username: "testuser",
			Email:    "test@example.com",
			Name:     "Test User",
			Role:     "admin",
			Status:   StatusActive,
		}

		created, err := store.CreateAdminUser(user, "password123")
		if err != nil {
			t.Fatalf("Failed to create admin user: %v", err)
		}
		defer store.DeleteAdminUser(created.ID)

		// 测试认证
		authUser, session, err := store.AuthenticateAdminUser("test@example.com", "password123", 24*time.Hour)
		if err != nil {
			t.Fatalf("Failed to authenticate: %v", err)
		}

		if authUser.ID != created.ID {
			t.Errorf("Expected user ID %s, got %s", created.ID, authUser.ID)
		}

		// 验证 session
		validatedUser, valid := store.ValidateAdminSession(session.Token)
		if !valid {
			t.Error("Session validation failed")
		}

		if validatedUser.ID != created.ID {
			t.Errorf("Expected user ID %s, got %s", created.ID, validatedUser.ID)
		}

		// 清理
		store.RevokeAdminSession(session.Token)
	})

	t.Run("BackupNotSupported", func(t *testing.T) {
		// PostgreSQL 备份应该返回错误
		_, err := store.CreateSQLiteBackup("test", 7)
		if err == nil {
			t.Error("Expected error for PostgreSQL backup, got nil")
		}

		httpErr := AsHTTPError(err)
		if httpErr.Status != 501 {
			t.Errorf("Expected status 501, got %d", httpErr.Status)
		}
	})
}

// TestSQLiteCompatibility 确保 SQLite 功能仍然正常工作
func TestSQLiteCompatibility(t *testing.T) {
	store := NewMemoryStore()

	// 验证数据库类型
	if !store.IsSQLite() {
		t.Error("Expected SQLite driver for memory store")
	}

	// 测试备份功能
	t.Run("SQLiteBackup", func(t *testing.T) {
		backup, err := store.CreateSQLiteBackup("test", 7)
		if err != nil {
			t.Fatalf("Failed to create SQLite backup: %v", err)
		}

		if backup.Status != "ready" && backup.Status != "creating" {
			t.Errorf("Unexpected backup status: %s", backup.Status)
		}
	})
}
