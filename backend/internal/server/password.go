package server

import (
	"crypto/subtle"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

const passwordHashCost = bcrypt.DefaultCost

func hashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), passwordHashCost)
	if err != nil {
		if err == bcrypt.ErrPasswordTooLong {
			return "", NewHTTPError(400, "invalid_password", "Password must not exceed 72 bytes")
		}
		return "", err
	}
	return string(hash), nil
}

func verifyPassword(hash string, password string) (valid bool, needsUpgrade bool) {
	if strings.HasPrefix(hash, "$2") {
		if bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) != nil {
			return false, false
		}
		cost, err := bcrypt.Cost([]byte(hash))
		return true, err == nil && cost < passwordHashCost
	}
	legacyHash := HashSecret(password)
	if subtle.ConstantTimeCompare([]byte(hash), []byte(legacyHash)) == 1 {
		return true, true
	}
	return false, false
}
