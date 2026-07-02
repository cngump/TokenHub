package server

import (
	"encoding/base64"
	"encoding/json"
	"strings"
)

type openAIIDTokenClaims struct {
	Email      string            `json:"email"`
	OpenAIAuth *openAIAuthClaims `json:"https://api.openai.com/auth,omitempty"`
}

type openAIAuthClaims struct {
	ChatGPTAccountID string                    `json:"chatgpt_account_id"`
	ChatGPTUserID    string                    `json:"chatgpt_user_id"`
	ChatGPTPlanType  string                    `json:"chatgpt_plan_type"`
	UserID           string                    `json:"user_id"`
	Organizations    []openAIOrganizationClaim `json:"organizations"`
}

type openAIOrganizationClaim struct {
	ID        string `json:"id"`
	IsDefault bool   `json:"is_default"`
}

func (s *GormStore) prepareProviderResourceForCreate(resource *ProviderResource) {
	if resource == nil || !isOpenAIAccountResource(resource.ResourceType) {
		return
	}
	if strings.TrimSpace(resource.BaseURL) == "" {
		resource.BaseURL = "https://api.openai.com/v1"
	}
	if resource.Options == nil {
		resource.Options = map[string]string{}
	}
	s.mergeOpenAIAccountCredentials(resource, nil)
}

func (s *GormStore) prepareProviderResourceForUpdate(resource *ProviderResource, patch ProviderResource) {
	if resource == nil || !isOpenAIAccountResource(resource.ResourceType) {
		return
	}
	if strings.TrimSpace(resource.BaseURL) == "" {
		resource.BaseURL = "https://api.openai.com/v1"
	}
	if resource.Options == nil {
		resource.Options = map[string]string{}
	}
	s.mergeOpenAIAccountCredentials(resource, &patch)
}

func (s *GormStore) mergeOpenAIAccountCredentials(resource *ProviderResource, patch *ProviderResource) {
	creds := ProviderResourceCredentials{}
	if resource.Credentials != nil {
		creds = *resource.Credentials
	}
	if patch != nil && patch.Credentials != nil {
		creds = *patch.Credentials
	}
	if strings.TrimSpace(creds.AccessToken) == "" && resource.APIKey != "" && !strings.HasPrefix(resource.APIKey, "enc:v1:") {
		creds.AccessToken = resource.APIKey
	}
	if strings.TrimSpace(creds.AuthType) == "" {
		creds.AuthType = firstNonEmpty(resource.Options["auth_type"], "oauth")
	}
	if claims := decodeOpenAIIDTokenClaims(creds.IDToken); claims != nil {
		creds.Email = firstNonEmpty(creds.Email, claims.Email)
		if claims.OpenAIAuth != nil {
			creds.AccountID = firstNonEmpty(creds.AccountID, claims.OpenAIAuth.ChatGPTAccountID)
			creds.UserID = firstNonEmpty(creds.UserID, claims.OpenAIAuth.UserID, claims.OpenAIAuth.ChatGPTUserID)
			creds.PlanType = firstNonEmpty(creds.PlanType, claims.OpenAIAuth.ChatGPTPlanType)
			creds.OrganizationID = firstNonEmpty(creds.OrganizationID, defaultOpenAIOrganizationID(claims.OpenAIAuth.Organizations))
		}
	}
	if strings.TrimSpace(creds.AccessToken) != "" {
		resource.APIKey = creds.AccessToken
	}
	if hasOpenAIAccountSecret(creds) {
		resource.CredentialBlob = s.encryptOpenAIAccountCredentialBlob(creds)
	} else if patch == nil && resource.CredentialBlob == "" {
		resource.CredentialBlob = ""
	}
	applyOpenAIAccountOptions(resource.Options, creds)
	resource.Credentials = nil
}

func hasOpenAIAccountSecret(creds ProviderResourceCredentials) bool {
	return strings.TrimSpace(creds.RefreshToken) != "" ||
		strings.TrimSpace(creds.IDToken) != "" ||
		strings.TrimSpace(creds.ClientID) != "" ||
		strings.TrimSpace(creds.Scopes) != "" ||
		strings.TrimSpace(creds.TokenType) != "" ||
		strings.TrimSpace(creds.ExpiresAt) != ""
}

func (s *GormStore) encryptOpenAIAccountCredentialBlob(creds ProviderResourceCredentials) string {
	secret := map[string]string{}
	addNonEmpty(secret, "auth_type", creds.AuthType)
	addNonEmpty(secret, "refresh_token", creds.RefreshToken)
	addNonEmpty(secret, "id_token", creds.IDToken)
	addNonEmpty(secret, "client_id", creds.ClientID)
	addNonEmpty(secret, "scopes", creds.Scopes)
	addNonEmpty(secret, "token_type", creds.TokenType)
	addNonEmpty(secret, "expires_at", creds.ExpiresAt)
	addNonEmpty(secret, "account_id", creds.AccountID)
	addNonEmpty(secret, "user_id", creds.UserID)
	addNonEmpty(secret, "email", creds.Email)
	addNonEmpty(secret, "organization_id", creds.OrganizationID)
	addNonEmpty(secret, "plan_type", creds.PlanType)
	data, err := json.Marshal(secret)
	if err != nil {
		return ""
	}
	return s.encryptSecret(string(data))
}

func applyOpenAIAccountOptions(options map[string]string, creds ProviderResourceCredentials) {
	if options == nil {
		return
	}
	for _, key := range []string{
		"access_token",
		"refresh_token",
		"id_token",
		"api_key",
		"credential_blob",
	} {
		delete(options, key)
	}
	options["credential_source"] = ProviderResourceOpenAISubscription
	options["auth_type"] = firstNonEmpty(creds.AuthType, options["auth_type"], "oauth")
	if strings.TrimSpace(creds.RefreshToken) != "" {
		options["has_refresh_token"] = "true"
	} else if options["has_refresh_token"] == "" {
		options["has_refresh_token"] = "false"
	}
	setOptionIfValue(options, "token_expires_at", creds.ExpiresAt)
	setOptionIfValue(options, "account_id", creds.AccountID)
	setOptionIfValue(options, "account_email", creds.Email)
	setOptionIfValue(options, "user_id", creds.UserID)
	setOptionIfValue(options, "organization_id", creds.OrganizationID)
	setOptionIfValue(options, "plan_type", creds.PlanType)
}

func isOpenAIAccountResource(resourceType string) bool {
	normalized := strings.ToLower(strings.TrimSpace(resourceType))
	return normalized == ProviderResourceOpenAISubscription ||
		normalized == "openai_oauth" ||
		normalized == "openai_account"
}

func providerResourceCredentialSummary(resource ProviderResource) map[string]string {
	if !isOpenAIAccountResource(resource.ResourceType) {
		return nil
	}
	summary := map[string]string{}
	for _, key := range []string{
		"credential_source",
		"auth_type",
		"account_email",
		"account_id",
		"user_id",
		"organization_id",
		"plan_type",
		"token_expires_at",
		"has_refresh_token",
	} {
		if value := strings.TrimSpace(resource.Options[key]); value != "" {
			summary[key] = value
		}
	}
	if len(summary) == 0 {
		return nil
	}
	return summary
}

func redactProviderResourceSecrets(resource *ProviderResource) {
	if resource == nil {
		return
	}
	resource.APIKey = ""
	resource.CredentialBlob = ""
	resource.Credentials = nil
	resource.CredentialSummary = providerResourceCredentialSummary(*resource)
}

func setOptionIfValue(options map[string]string, key string, value string) {
	value = strings.TrimSpace(value)
	if value != "" {
		options[key] = value
	}
}

func addNonEmpty(values map[string]string, key string, value string) {
	value = strings.TrimSpace(value)
	if value != "" {
		values[key] = value
	}
}

func decodeOpenAIIDTokenClaims(idToken string) *openAIIDTokenClaims {
	parts := strings.Split(strings.TrimSpace(idToken), ".")
	if len(parts) != 3 {
		return nil
	}
	payload := parts[1]
	if padding := len(payload) % 4; padding != 0 {
		payload += strings.Repeat("=", 4-padding)
	}
	data, err := base64.URLEncoding.DecodeString(payload)
	if err != nil {
		data, err = base64.StdEncoding.DecodeString(payload)
	}
	if err != nil {
		return nil
	}
	var claims openAIIDTokenClaims
	if err := json.Unmarshal(data, &claims); err != nil {
		return nil
	}
	return &claims
}

func defaultOpenAIOrganizationID(organizations []openAIOrganizationClaim) string {
	if len(organizations) == 0 {
		return ""
	}
	for _, organization := range organizations {
		if organization.IsDefault && strings.TrimSpace(organization.ID) != "" {
			return strings.TrimSpace(organization.ID)
		}
	}
	return strings.TrimSpace(organizations[0].ID)
}
