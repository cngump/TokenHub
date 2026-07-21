package server

import "testing"

func TestDeleteAdminUserProtectsLastActivePlatformAdmin(t *testing.T) {
	store := NewMemoryStore()
	admin := createTestAdminUser(t, store, "only-admin", "admin")
	member := createTestAdminUser(t, store, "member", "user")

	if err := store.DeleteAdminUser(admin.ID); AsHTTPError(err).Code != "last_admin_user" {
		t.Fatalf("expected last admin deletion to be rejected, got %v", err)
	}
	if err := store.DeleteAdminUser(member.ID); err != nil {
		t.Fatalf("expected ordinary user deletion to remain allowed, got %v", err)
	}
}

func TestUpdateAdminUserProtectsLastActivePlatformAdmin(t *testing.T) {
	tests := []struct {
		name  string
		patch AdminUser
	}{
		{name: "disable", patch: AdminUser{Status: StatusDisabled}},
		{name: "demote", patch: AdminUser{Role: "user"}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := NewMemoryStore()
			admin := createTestAdminUser(t, store, "only-admin-"+tt.name, "system_admin")
			createTestAdminUser(t, store, "member-"+tt.name, "user")

			if _, err := store.UpdateAdminUser(admin.ID, tt.patch, ""); AsHTTPError(err).Code != "last_admin_user" {
				t.Fatalf("expected last admin update to be rejected, got %v", err)
			}
		})
	}
}

func TestAdminUserChangesAllowedWhenAnotherAdminRemains(t *testing.T) {
	store := NewMemoryStore()
	first := createTestAdminUser(t, store, "first-admin", "admin")
	createTestAdminUser(t, store, "second-admin", "system_admin")

	updated, err := store.UpdateAdminUser(first.ID, AdminUser{Role: "user"}, "")
	if err != nil {
		t.Fatalf("expected demotion with another active admin to succeed, got %v", err)
	}
	if updated.Role != "user" {
		t.Fatalf("expected demoted user role, got %q", updated.Role)
	}
}

func createTestAdminUser(t *testing.T, store *GormStore, username string, role string) AdminUser {
	t.Helper()
	user, err := store.CreateAdminUser(AdminUser{
		Username: username,
		Email:    username + "@example.com",
		Role:     role,
		Status:   StatusActive,
	}, "test-password")
	if err != nil {
		t.Fatal(err)
	}
	return user
}
