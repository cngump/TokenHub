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
	withWorkingDir(t, tmp)
	t.Setenv("TOKENHUB_DATABASE_URL", "")
	t.Setenv("TOKENHUB_SQLITE_BACKUP_DIR", "")

	config := ConfigFromEnv()
	if config.DatabaseURL != "sqlite://backend/data/tokenhub.db" {
		t.Fatalf("expected backend data database, got %q", config.DatabaseURL)
	}
	if config.SQLiteBackupDir != "backend/data/backups" {
		t.Fatalf("expected backend data backup dir, got %q", config.SQLiteBackupDir)
	}
}

func TestConfigDefaultDatabaseURLUsesLocalDataFromBackendDir(t *testing.T) {
	tmp := t.TempDir()
	backendDir := filepath.Join(tmp, "backend")
	if err := os.MkdirAll(filepath.Join(backendDir, "data"), 0o755); err != nil {
		t.Fatal(err)
	}
	withWorkingDir(t, backendDir)
	t.Setenv("TOKENHUB_DATABASE_URL", "")
	t.Setenv("TOKENHUB_SQLITE_BACKUP_DIR", "")

	config := ConfigFromEnv()
	if config.DatabaseURL != defaultSQLiteDatabaseURL {
		t.Fatalf("expected local backend database, got %q", config.DatabaseURL)
	}
	if config.SQLiteBackupDir != "data/backups" {
		t.Fatalf("expected local backup dir, got %q", config.SQLiteBackupDir)
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
