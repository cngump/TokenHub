package server

// IsPostgreSQL 返回当前存储是否使用 PostgreSQL
func (s *GormStore) IsPostgreSQL() bool {
	return s.dbDriver == "postgres"
}

// IsSQLite 返回当前存储是否使用 SQLite
func (s *GormStore) IsSQLite() bool {
	return s.dbDriver == "sqlite"
}

// CreatePostgreSQLBackup 为 PostgreSQL 创建备份（使用 pg_dump）
func (s *GormStore) CreatePostgreSQLBackup(createdBy string, expireDays int) (SQLiteBackupRecord, error) {
	// PostgreSQL 备份需要外部工具 pg_dump
	// 本实现返回不支持错误，建议用户使用外部备份工具
	return SQLiteBackupRecord{}, NewHTTPError(501, "backup_not_supported",
		"PostgreSQL backup requires external tools like pg_dump. Please use your database backup solution.")
}

// RestorePostgreSQLBackup 恢复 PostgreSQL 备份
func (s *GormStore) RestorePostgreSQLBackup(id string, restoredBy string) (SQLiteBackupRecord, error) {
	return SQLiteBackupRecord{}, NewHTTPError(501, "restore_not_supported",
		"PostgreSQL restore requires external tools. Please use your database restore solution.")
}
