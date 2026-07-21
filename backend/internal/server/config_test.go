package server

import (
	"os"
	"path/filepath"
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
