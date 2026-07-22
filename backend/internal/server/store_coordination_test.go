package server

import (
	"context"
	"errors"
	"sync/atomic"
	"testing"
	"time"
)

func TestLeaseHeartbeatRetriesTransientRenewalErrors(t *testing.T) {
	const ttl = 600 * time.Millisecond
	var attempts atomic.Int64
	renewed := make(chan struct{})
	heartbeat := startLeaseHeartbeat(context.Background(), ttl, time.Now().Add(ttl), func(context.Context, time.Time) (bool, error) {
		attempt := attempts.Add(1)
		if attempt == 1 {
			return false, errors.New("transient database error")
		}
		if attempt == 2 {
			close(renewed)
		}
		return true, nil
	})

	select {
	case <-renewed:
	case <-time.After(2 * time.Second):
		t.Fatal("heartbeat did not retry the transient renewal error")
	}
	select {
	case <-heartbeat.ctx.Done():
		t.Fatalf("heartbeat canceled after a recoverable error: %v", context.Cause(heartbeat.ctx))
	default:
	}
	if err := stopLeaseHeartbeat(heartbeat); err != nil {
		t.Fatalf("stop heartbeat: %v", err)
	}
}

func TestLeaseHeartbeatCancelsWhenOwnershipIsLost(t *testing.T) {
	const ttl = 600 * time.Millisecond
	heartbeat := startLeaseHeartbeat(context.Background(), ttl, time.Now().Add(ttl), func(context.Context, time.Time) (bool, error) {
		return false, nil
	})

	select {
	case <-heartbeat.ctx.Done():
	case <-time.After(2 * time.Second):
		t.Fatal("heartbeat did not cancel after ownership was lost")
	}
	if !errors.Is(context.Cause(heartbeat.ctx), ErrCoordinationLeaseLost) {
		t.Fatalf("unexpected cancellation cause: %v", context.Cause(heartbeat.ctx))
	}
	if err := stopLeaseHeartbeat(heartbeat); !errors.Is(err, ErrCoordinationLeaseLost) {
		t.Fatalf("expected lease loss from stop, got %v", err)
	}
}

func TestFinishProviderAttemptReleasesLeaseAfterAccountingFailure(t *testing.T) {
	store := NewMemoryStore()
	provider := store.AddProvider(Provider{
		ID:      "provider-fallback-release",
		Name:    "Fallback release",
		Type:    ProviderMock,
		Status:  StatusActive,
		Healthy: true,
	})
	resource, err := store.AddProviderResource(ProviderResource{
		ID:             "resource-fallback-release",
		ProviderID:     provider.ID,
		Name:           "Fallback release",
		ResourceType:   "mock",
		Status:         StatusActive,
		Healthy:        true,
		MaxConcurrency: 1,
	})
	if err != nil {
		t.Fatal(err)
	}
	leaseID, _, err := store.CheckProviderResourceCapacity(context.Background(), resource.ID)
	if err != nil {
		t.Fatal(err)
	}
	if leaseID == "" {
		t.Fatal("expected provider concurrency lease")
	}
	if err := store.db.Delete(&ProviderResource{}, "id = ?", resource.ID).Error; err != nil {
		t.Fatal(err)
	}

	store.FinishProviderResourceAttempt(resource.ID, leaseID, true, Usage{})
	var count int64
	if err := store.db.Model(&InFlightLease{}).Where("id = ?", leaseID).Count(&count).Error; err != nil {
		t.Fatal(err)
	}
	if count != 0 {
		t.Fatalf("provider lease remained after accounting rollback: count=%d", count)
	}
}
