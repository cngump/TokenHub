package server

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestConfigDefaultDatabaseURLPrefersBackendDataFromRepoRoot(t *testing.T) {
	tmp := t.TempDir()
	if err := os.MkdirAll(filepath.Join(tmp, "backend", "data"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(tmp, "data"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(tmp, "data", "model-catalog.yaml"), []byte("version: 1\nmodels:\n  - name: test-model\n    category: test\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	withWorkingDir(t, tmp)
	t.Setenv("TOKENHUB_DATABASE_URL", "")
	t.Setenv("TOKENHUB_SQLITE_BACKUP_DIR", "")
	t.Setenv("TOKENHUB_MODEL_CATALOG_FILE", "")

	config := ConfigFromEnv()
	if config.DatabaseURL != "sqlite://backend/data/tokenhub.db" {
		t.Fatalf("expected backend data database, got %q", config.DatabaseURL)
	}
	if config.SQLiteBackupDir != "backend/data/backups" {
		t.Fatalf("expected backend data backup dir, got %q", config.SQLiteBackupDir)
	}
	if config.ModelCatalogFile != "data/model-catalog.yaml" {
		t.Fatalf("expected root model catalog, got %q", config.ModelCatalogFile)
	}
}

func TestConfigDefaultDatabaseURLUsesLocalDataFromBackendDir(t *testing.T) {
	tmp := t.TempDir()
	backendDir := filepath.Join(tmp, "backend")
	if err := os.MkdirAll(filepath.Join(backendDir, "data"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(tmp, "data"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(tmp, "data", "model-catalog.yaml"), []byte("version: 1\nmodels:\n  - name: test-model\n    category: test\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	withWorkingDir(t, backendDir)
	t.Setenv("TOKENHUB_DATABASE_URL", "")
	t.Setenv("TOKENHUB_SQLITE_BACKUP_DIR", "")
	t.Setenv("TOKENHUB_MODEL_CATALOG_FILE", "")

	config := ConfigFromEnv()
	if config.DatabaseURL != defaultSQLiteDatabaseURL {
		t.Fatalf("expected local backend database, got %q", config.DatabaseURL)
	}
	if config.SQLiteBackupDir != "data/backups" {
		t.Fatalf("expected local backup dir, got %q", config.SQLiteBackupDir)
	}
	if config.ModelCatalogFile != "../data/model-catalog.yaml" {
		t.Fatalf("expected parent model catalog, got %q", config.ModelCatalogFile)
	}
}

func TestConfigParsesTrustedProxyCIDRs(t *testing.T) {
	t.Setenv("TOKENHUB_TRUSTED_PROXY_CIDRS", "127.0.0.1, 10.0.0.0/8;2001:db8::/32")

	config := ConfigFromEnv()
	if len(config.TrustedProxyCIDRs) != 3 {
		t.Fatalf("expected three trusted proxy entries, got %#v", config.TrustedProxyCIDRs)
	}
}

func TestProductionConfigRejectsPlaceholderCredentials(t *testing.T) {
	config := Config{
		Environment:            "prod",
		AdminToken:             "change-me-tokenhub-admin-token",
		SecretKey:              "change-me-tokenhub-secret-key",
		BootstrapAdminPassword: "admin123456",
	}
	err := config.ValidateForStartup()
	if err == nil {
		t.Fatal("expected production credential validation to fail")
	}
	for _, name := range []string{"TOKENHUB_ADMIN_TOKEN", "TOKENHUB_SECRET_KEY", "TOKENHUB_BOOTSTRAP_ADMIN_PASSWORD"} {
		if !strings.Contains(err.Error(), name) {
			t.Fatalf("expected validation error to mention %s: %v", name, err)
		}
	}
}

func TestProductionConfigAcceptsStrongCredentials(t *testing.T) {
	config := Config{
		Environment:            "production",
		AdminToken:             strings.Repeat("a", 32),
		SecretKey:              strings.Repeat("s", 32),
		BootstrapAdminPassword: "strong-admin-password",
	}
	if err := config.ValidateForStartup(); err != nil {
		t.Fatalf("expected strong production credentials to pass: %v", err)
	}
}

func TestDevelopmentConfigKeepsLocalDefaults(t *testing.T) {
	config := Config{
		Environment:            "dev",
		AdminToken:             "dev_admin_token",
		SecretKey:              "dev_tokenhub_secret_key",
		BootstrapAdminPassword: "admin123456",
	}
	if err := config.ValidateForStartup(); err != nil {
		t.Fatalf("expected development defaults to remain available: %v", err)
	}
}

func TestBlankEnvironmentIsRejected(t *testing.T) {
	for _, environment := range []string{"", " \t\n"} {
		config := Config{
			Environment:            environment,
			AdminToken:             strings.Repeat("a", 32),
			SecretKey:              strings.Repeat("s", 32),
			BootstrapAdminPassword: "strong-admin-password",
		}
		err := config.ValidateForStartup()
		if err == nil || !strings.Contains(err.Error(), "TOKENHUB_ENV") {
			t.Fatalf("expected %q environment to be rejected, got %v", environment, err)
		}
	}
}

func withWorkingDir(t *testing.T, dir string) {
	t.Helper()
	previous, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	if err := os.Chdir(dir); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		if err := os.Chdir(previous); err != nil {
			t.Fatalf("restore working dir: %v", err)
		}
	})
}
