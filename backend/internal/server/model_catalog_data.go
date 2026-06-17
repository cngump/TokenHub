package server

import "strings"

type modelCatalogSeed struct {
	Name     string
	Category string
}

var defaultModelCatalogSeeds = []modelCatalogSeed{
	{Name: "aqa", Category: "custom"},
	{Name: "Baichuan-M2", Category: "baichuan"},
	{Name: "Baichuan-M2-128K", Category: "baichuan"},
	{Name: "Baichuan-M3", Category: "baichuan"},
	{Name: "cnshenyang/qwen3-nothink:30b", Category: "qwen"},
	{Name: "dall-e-2", Category: "openai"},
	{Name: "dall-e-3", Category: "openai"},
	{Name: "deep-research-pro-preview-12-2025", Category: "custom"},
	{Name: "DeepSeek-OCR", Category: "deepseek"},
	{Name: "deepseek-r1", Category: "deepseek"},
	{Name: "DeepSeek-R1-0528", Category: "deepseek"},
	{Name: "DeepSeek-R1-MS", Category: "deepseek"},
	{Name: "deepseek-v3-1-terminus", Category: "deepseek"},
	{Name: "DeepSeek-V3-250324", Category: "deepseek"},
	{Name: "DeepSeek-V3.1", Category: "deepseek"},
	{Name: "DeepSeek-V3.1-Terminus", Category: "deepseek"},
	{Name: "DeepSeek-V3.2", Category: "deepseek"},
	{Name: "DeepSeek-V3.2-Exp", Category: "deepseek"},
	{Name: "DeepSeek-V3.2-Instruct", Category: "deepseek"},
	{Name: "DeepSeek-V3.2-Thinking", Category: "deepseek"},
	{Name: "DeepSeek-V4-Flash", Category: "deepseek"},
	{Name: "DeepSeek-V4-Pro", Category: "deepseek"},
	{Name: "doubao-pro", Category: "doubao"},
	{Name: "doubao-seed-1-6-250615", Category: "doubao"},
	{Name: "doubao-seed-1-6-flash-250828", Category: "doubao"},
	{Name: "Doubao-Seedance-1.0-Pro", Category: "doubao"},
	{Name: "Doubao-Seedream-3.0-T2I", Category: "doubao"},
	{Name: "Doubao-Seedream-4.0", Category: "doubao"},
	{Name: "dr-search-api", Category: "custom"},
	{Name: "ep-20240706055451-cpwf8", Category: "custom"},
	{Name: "ERNIE-4.5-Turbo-128K", Category: "ernie"},
	{Name: "ERNIE-4.5-Turbo-32K", Category: "ernie"},
	{Name: "ERNIE-4.5-Turbo-VL-32K", Category: "ernie"},
	{Name: "ERNIE-5.0-Thinking-Preview", Category: "ernie"},
	{Name: "gemini-2.0-flash", Category: "gemini"},
	{Name: "gemini-2.0-flash-001", Category: "gemini"},
	{Name: "gemini-2.0-flash-exp-image-generation", Category: "gemini"},
	{Name: "gemini-2.0-flash-lite", Category: "gemini"},
	{Name: "gemini-2.0-flash-lite-001", Category: "gemini"},
	{Name: "gemini-2.0-flash-thinking-exp-01-21", Category: "gemini"},
	{Name: "gemini-2.0-pro", Category: "gemini"},
	{Name: "gemini-2.0-pro-exp-02-05", Category: "gemini"},
	{Name: "gemini-2.5-computer-use-preview-10-2025", Category: "gemini"},
	{Name: "gemini-2.5-flash", Category: "gemini"},
	{Name: "gemini-2.5-flash-image", Category: "gemini"},
	{Name: "gemini-2.5-flash-lite", Category: "gemini"},
	{Name: "gemini-2.5-flash-native-audio-latest", Category: "gemini"},
	{Name: "gemini-2.5-flash-native-audio-preview-09-2025", Category: "gemini"},
	{Name: "gemini-2.5-flash-native-audio-preview-12-2025", Category: "gemini"},
	{Name: "gemini-2.5-flash-preview-tts", Category: "gemini"},
	{Name: "gemini-2.5-pro", Category: "gemini"},
	{Name: "gemini-2.5-pro-preview-tts", Category: "gemini"},
	{Name: "gemini-3-flash-preview", Category: "gemini"},
	{Name: "gemini-3-pro-image-preview", Category: "gemini"},
	{Name: "gemini-3-pro-preview", Category: "gemini"},
	{Name: "gemini-3.1-flash-image-preview", Category: "gemini"},
	{Name: "gemini-3.1-flash-lite-preview", Category: "gemini"},
	{Name: "gemini-3.1-flash-live-preview", Category: "gemini"},
	{Name: "gemini-3.1-pro-preview", Category: "gemini"},
	{Name: "gemini-3.1-pro-preview-customtools", Category: "gemini"},
	{Name: "gemini-embedding-001", Category: "gemini"},
	{Name: "gemini-embedding-2-preview", Category: "gemini"},
	{Name: "gemini-flash-latest", Category: "gemini"},
	{Name: "gemini-flash-lite-latest", Category: "gemini"},
	{Name: "gemini-pro-latest", Category: "gemini"},
	{Name: "gemini-robotics-er-1.5-preview", Category: "gemini"},
	{Name: "gemma-3-12b-it", Category: "gemini"},
	{Name: "gemma-3-1b-it", Category: "gemini"},
	{Name: "gemma-3-27b-it", Category: "gemini"},
	{Name: "gemma-3-4b-it", Category: "gemini"},
	{Name: "gemma-3n-e2b-it", Category: "gemini"},
	{Name: "gemma-3n-e4b-it", Category: "gemini"},
	{Name: "gemma-4-26b-a4b-it", Category: "gemini"},
	{Name: "gemma-4-31b-it", Category: "gemini"},
	{Name: "GLM-4-9B", Category: "glm"},
	{Name: "GLM-4-Air", Category: "glm"},
	{Name: "GLM-4-AirX", Category: "glm"},
	{Name: "GLM-4-Flash", Category: "glm"},
	{Name: "GLM-4-FlashX", Category: "glm"},
	{Name: "GLM-4-Long", Category: "glm"},
	{Name: "GLM-4-Plus", Category: "glm"},
	{Name: "glm-4.5", Category: "glm"},
	{Name: "glm-4.5-air", Category: "glm"},
	{Name: "GLM-4.5-AirX", Category: "glm"},
	{Name: "GLM-4.5-Flash", Category: "glm"},
	{Name: "GLM-4.5-X", Category: "glm"},
	{Name: "GLM-4.5V", Category: "glm"},
	{Name: "glm-4.6", Category: "glm"},
	{Name: "GLM-4.6V", Category: "glm"},
	{Name: "glm-4.7", Category: "glm"},
	{Name: "GLM-4V", Category: "glm"},
	{Name: "GLM-4V-Flash", Category: "glm"},
	{Name: "GLM-4V-Plus-0111", Category: "glm"},
	{Name: "glm-5", Category: "glm"},
	{Name: "glm-5-turbo", Category: "glm"},
	{Name: "glm-5.1", Category: "glm"},
	{Name: "GLM-ASR-2512", Category: "glm"},
	{Name: "GLM-CogView3-Flash", Category: "glm"},
	{Name: "GLM-Embedding-2", Category: "glm"},
	{Name: "GLM-Embedding-3", Category: "glm"},
	{Name: "GLM-Rerank", Category: "glm"},
	{Name: "GLM-X-F", Category: "glm"},
	{Name: "GLM-Z1-Air", Category: "glm"},
	{Name: "GLM-Z1-AirX", Category: "glm"},
	{Name: "GLM-Z1-Flash", Category: "glm"},
	{Name: "gpt-3.5-turbo", Category: "openai"},
	{Name: "gpt-4", Category: "openai"},
	{Name: "gpt-4-0125-preview", Category: "openai"},
	{Name: "gpt-4-turbo-preview", Category: "openai"},
	{Name: "gpt-4-vision-preview", Category: "openai"},
	{Name: "gpt-4.1", Category: "openai"},
	{Name: "gpt-41", Category: "openai"},
	{Name: "gpt-4o", Category: "openai"},
	{Name: "gpt-4o-mini", Category: "openai"},
	{Name: "gpt-5", Category: "openai"},
	{Name: "gpt-5.2", Category: "openai"},
	{Name: "gpt-5.2-codex", Category: "openai"},
	{Name: "gpt-5.4", Category: "openai"},
	{Name: "gpt-5.4-mini", Category: "openai"},
	{Name: "gpt-image-2", Category: "openai"},
	{Name: "grok-3", Category: "grok"},
	{Name: "grok-3-mini", Category: "grok"},
	{Name: "grok-4-0709", Category: "grok"},
	{Name: "grok-4-1-fast-non-reasoning", Category: "grok"},
	{Name: "grok-4-1-fast-reasoning", Category: "grok"},
	{Name: "grok-4-fast-non-reasoning", Category: "grok"},
	{Name: "grok-4-fast-reasoning", Category: "grok"},
	{Name: "grok-4.20-0309-non-reasoning", Category: "grok"},
	{Name: "grok-4.20-0309-reasoning", Category: "grok"},
	{Name: "grok-4.20-multi-agent-0309", Category: "grok"},
	{Name: "grok-code-fast-1", Category: "grok"},
	{Name: "grok-imagine-image", Category: "grok"},
	{Name: "grok-imagine-image-pro", Category: "grok"},
	{Name: "grok-imagine-video", Category: "grok"},
	{Name: "imagen-4.0-fast-generate-001", Category: "gemini"},
	{Name: "imagen-4.0-generate-001", Category: "gemini"},
	{Name: "imagen-4.0-ultra-generate-001", Category: "gemini"},
	{Name: "kimi-k2.5", Category: "kimi"},
	{Name: "lyria-3-clip-preview", Category: "gemini"},
	{Name: "lyria-3-pro-preview", Category: "gemini"},
	{Name: "MiniMax-Hailuo-02", Category: "minimax"},
	{Name: "MiniMax-I2V-01", Category: "minimax"},
	{Name: "MiniMax-I2V-01-Director", Category: "minimax"},
	{Name: "MiniMax-I2V-01-Live", Category: "minimax"},
	{Name: "MiniMax-M1-80k", Category: "minimax"},
	{Name: "MiniMax-M2", Category: "minimax"},
	{Name: "MiniMax-M2.5", Category: "minimax"},
	{Name: "MiniMax-M2.7", Category: "minimax"},
	{Name: "MiniMax-T2V-01", Category: "minimax"},
	{Name: "MiniMax-T2V-01-Director", Category: "minimax"},
	{Name: "MiniMax-Text-01", Category: "minimax"},
	{Name: "moonshotai/kimi-k2.5", Category: "kimi"},
	{Name: "nano-banana-pro-preview", Category: "gemini"},
	{Name: "o1-mini", Category: "openai"},
	{Name: "o3-mini", Category: "openai"},
	{Name: "openai/gpt-oss-20b", Category: "openai"},
	{Name: "PaddleOCR-VL-0.9B", Category: "paddlepaddle"},
	{Name: "PaddleOCR-VL-1.5", Category: "paddlepaddle"},
	{Name: "phi-4", Category: "microsoft"},
	{Name: "Phi-4-multimodal-instruct-kcrcb", Category: "microsoft"},
	{Name: "Qwen-Long", Category: "qwen"},
	{Name: "Qwen2.5-72B-Instruct", Category: "qwen"},
	{Name: "Qwen3-235B-A22B", Category: "qwen"},
	{Name: "Qwen3-235B-A22B-Instruct-2507", Category: "qwen"},
	{Name: "Qwen3-235B-A22B-Thinking-2507", Category: "qwen"},
	{Name: "qwen3-30b-a3b", Category: "qwen"},
	{Name: "Qwen3-30B-A3B-Instruct-2507", Category: "qwen"},
	{Name: "Qwen3-30B-A3B-Thinking-2507", Category: "qwen"},
	{Name: "Qwen3-32B", Category: "qwen"},
	{Name: "Qwen3-Coder-480B-A35B-Instruct", Category: "qwen"},
	{Name: "Qwen3-Coder-Plus", Category: "qwen"},
	{Name: "Qwen3-Next-80B-A3B-Instruct", Category: "qwen"},
	{Name: "Qwen3-Next-80B-A3B-Thinking", Category: "qwen"},
	{Name: "Qwen3-VL-235B-A22B-Instruct", Category: "qwen"},
	{Name: "Qwen3-VL-235B-A22B-Thinking", Category: "qwen"},
	{Name: "Qwen3-VL-30B-A3B-Instruct", Category: "qwen"},
	{Name: "Qwen3-VL-30B-A3B-Thinking", Category: "qwen"},
	{Name: "Qwen3.5-Plus", Category: "qwen"},
	{Name: "scorpion7slayer/GLM-4.6V-Flash", Category: "glm"},
	{Name: "sora-2", Category: "openai"},
	{Name: "step-1-256k", Category: "stepfun"},
	{Name: "step-1-32k", Category: "stepfun"},
	{Name: "step-1-8k", Category: "stepfun"},
	{Name: "step-1f-audio", Category: "stepfun"},
	{Name: "step-1o-audio", Category: "stepfun"},
	{Name: "step-1o-turbo-vision", Category: "stepfun"},
	{Name: "step-1o-vision-32k", Category: "stepfun"},
	{Name: "step-1v-32k", Category: "stepfun"},
	{Name: "step-1v-8k", Category: "stepfun"},
	{Name: "step-1x-edit", Category: "stepfun"},
	{Name: "step-1x-medium", Category: "stepfun"},
	{Name: "step-2-16k", Category: "stepfun"},
	{Name: "step-2-16k-202411", Category: "stepfun"},
	{Name: "step-2-16k-exp", Category: "stepfun"},
	{Name: "step-2-mini", Category: "stepfun"},
	{Name: "step-2x-large", Category: "stepfun"},
	{Name: "step-3", Category: "stepfun"},
	{Name: "step-3-agent-lite", Category: "stepfun"},
	{Name: "step-3.5-flash", Category: "stepfun"},
	{Name: "step-3.5-flash-2603", Category: "stepfun"},
	{Name: "step-asr", Category: "stepfun"},
	{Name: "step-asr-1.1", Category: "stepfun"},
	{Name: "step-asr-1.1-stream", Category: "stepfun"},
	{Name: "step-audio-2", Category: "stepfun"},
	{Name: "step-audio-2-mini", Category: "stepfun"},
	{Name: "step-audio-2-think", Category: "stepfun"},
	{Name: "step-audio-r1.1", Category: "stepfun"},
	{Name: "step-gui", Category: "stepfun"},
	{Name: "step-r1-v-mini", Category: "stepfun"},
	{Name: "step-tts-2", Category: "stepfun"},
	{Name: "step-tts-mini", Category: "stepfun"},
	{Name: "step-tts-vivid", Category: "stepfun"},
	{Name: "veo-2.0-generate-001", Category: "gemini"},
	{Name: "veo-3.0-fast-generate-001", Category: "gemini"},
	{Name: "veo-3.0-generate-001", Category: "gemini"},
	{Name: "veo-3.1-fast-generate-preview", Category: "gemini"},
	{Name: "veo-3.1-generate-preview", Category: "gemini"},
	{Name: "veo-3.1-lite-generate-preview", Category: "gemini"},
	{Name: "WanX2.1-T2I-Plus", Category: "wanx"},
	{Name: "WanX2.1-T2I-Turbo", Category: "wanx"},
	{Name: "yeahdongcn/AutoGLM-Phone-9B", Category: "glm"},
	{Name: "gpt-4.1-mini", Category: "openai"},
	{Name: "text-embedding-3-small", Category: "openai"},
	{Name: "claude-sonnet-4.5", Category: "claude"},
	{Name: "claude-haiku-4.5", Category: "claude"},
	{Name: "deepseek-chat", Category: "deepseek"},
	{Name: "deepseek-reasoner", Category: "deepseek"},
	{Name: "qwen-max", Category: "qwen"},
	{Name: "qwen-plus", Category: "qwen"},
}

func defaultModelCatalog() []Model {
	seen := map[string]bool{}
	models := make([]Model, 0, len(defaultModelCatalogSeeds))
	for _, seed := range defaultModelCatalogSeeds {
		name := strings.TrimSpace(seed.Name)
		if name == "" || seen[strings.ToLower(name)] {
			continue
		}
		seen[strings.ToLower(name)] = true
		models = append(models, buildCatalogModel(name, seed.Category))
	}
	return models
}

func buildCatalogModel(name string, category string) Model {
	modality := inferCatalogModelModality(name)
	capabilities := standardModelCapabilities(name, modality)
	return Model{
		ID:                  name,
		Name:                name,
		Category:            category,
		Family:              inferCatalogModelFamily(name, category),
		Modality:            modality,
		ContextWindow:       inferCatalogContextWindow(name, modality),
		Capabilities:        capabilities,
		SupportedParameters: standardModelSupportedParameters(capabilities),
		InputPriceUSDPer1M:  catalogInputPrice(name, modality),
		OutputPriceUSDPer1M: catalogOutputPrice(name, modality),
		Status:              StatusActive,
		Metadata: map[string]string{
			"source": "tokenhub-standard-catalog",
		},
	}
}

func inferCatalogModelFamily(name string, category string) string {
	normalized := strings.ToLower(name)
	if strings.Contains(normalized, "/") {
		parts := strings.Split(normalized, "/")
		normalized = parts[len(parts)-1]
	}
	for _, sep := range []string{"-", ":", "."} {
		if index := strings.Index(normalized, sep); index > 0 {
			return normalized[:index]
		}
	}
	if category != "" {
		return category
	}
	return normalized
}

func inferCatalogModelModality(name string) string {
	normalized := strings.ToLower(name)
	switch {
	case strings.Contains(normalized, "embedding") || strings.Contains(normalized, "embed") || strings.Contains(normalized, "bge-"):
		return "embedding"
	case strings.Contains(normalized, "rerank"):
		return "rerank"
	case strings.Contains(normalized, "ocr"):
		return "ocr"
	case strings.Contains(normalized, "tts") || strings.Contains(normalized, "asr") || strings.Contains(normalized, "audio") || strings.Contains(normalized, "lyria"):
		return "audio"
	case strings.Contains(normalized, "veo") || strings.Contains(normalized, "sora") || strings.Contains(normalized, "i2v") || strings.Contains(normalized, "t2v") || strings.Contains(normalized, "seedance") || strings.Contains(normalized, "video"):
		return "video"
	case strings.Contains(normalized, "image") || strings.Contains(normalized, "imagen") || strings.Contains(normalized, "dall-e") || strings.Contains(normalized, "seedream") || strings.Contains(normalized, "cogview") || strings.Contains(normalized, "wanx") || strings.Contains(normalized, "gpt-image"):
		return "image"
	default:
		return "chat"
	}
}

func inferCatalogContextWindow(name string, modality string) int64 {
	if modality != "chat" {
		return 0
	}
	normalized := strings.ToLower(name)
	switch {
	case strings.Contains(normalized, "1m") || strings.Contains(normalized, "1048576"):
		return 1048576
	case strings.Contains(normalized, "256k"):
		return 256000
	case strings.Contains(normalized, "200k"):
		return 200000
	case strings.Contains(normalized, "128k"):
		return 128000
	case strings.Contains(normalized, "80k"):
		return 80000
	case strings.Contains(normalized, "32k"):
		return 32000
	case strings.Contains(normalized, "16k"):
		return 16000
	case strings.Contains(normalized, "8k"):
		return 8000
	case strings.Contains(normalized, "gpt-5") || strings.Contains(normalized, "gpt-4.1"):
		return 400000
	case strings.Contains(normalized, "gemini") || strings.Contains(normalized, "gemma"):
		return 1048576
	case strings.Contains(normalized, "claude"):
		return 200000
	default:
		return 128000
	}
}

func standardModelCapabilities(name string, modality string) []string {
	normalized := strings.ToLower(name)
	switch modality {
	case "embedding":
		return []string{"embedding"}
	case "rerank":
		return []string{"rerank"}
	case "ocr":
		return []string{"ocr", "vision"}
	case "image":
		if strings.Contains(normalized, "edit") {
			return []string{"image", "image_edit"}
		}
		return []string{"image"}
	case "video":
		return []string{"video"}
	case "audio":
		if strings.Contains(normalized, "asr") {
			return []string{"audio", "speech_to_text"}
		}
		if strings.Contains(normalized, "tts") {
			return []string{"audio", "text_to_speech"}
		}
		return []string{"audio"}
	default:
		capabilities := []string{"chat"}
		if strings.Contains(normalized, "vision") || strings.Contains(normalized, "vl") || strings.Contains(normalized, "multimodal") || strings.Contains(normalized, "image") || strings.Contains(normalized, "4v") || strings.Contains(normalized, "4.5v") || strings.Contains(normalized, "4.6v") {
			capabilities = append(capabilities, "vision")
		}
		if strings.Contains(normalized, "think") || strings.Contains(normalized, "reasoning") || strings.Contains(normalized, "reasoner") || strings.Contains(normalized, "r1") || strings.Contains(normalized, "o1") || strings.Contains(normalized, "o3") || strings.Contains(normalized, "z1") {
			capabilities = append(capabilities, "reasoning")
		}
		if strings.Contains(normalized, "coder") || strings.Contains(normalized, "codex") || strings.Contains(normalized, "code") {
			capabilities = append(capabilities, "code")
		}
		return capabilities
	}
}

func standardModelSupportedParameters(capabilities []string) []string {
	params := []string{}
	for _, capability := range capabilities {
		switch capability {
		case "chat":
			params = append(params, "temperature")
		case "reasoning":
			params = append(params, "reasoning")
		case "vision":
			params = append(params, "image_input")
		}
	}
	return params
}

func catalogInputPrice(name string, modality string) float64 {
	if modality != "chat" {
		return 0
	}
	normalized := strings.ToLower(name)
	switch {
	case strings.Contains(normalized, "gpt-5") || strings.Contains(normalized, "gpt-4") || strings.Contains(normalized, "claude-sonnet"):
		return 1
	case strings.Contains(normalized, "mini") || strings.Contains(normalized, "flash") || strings.Contains(normalized, "lite"):
		return 0.3
	default:
		return 0
	}
}

func catalogOutputPrice(name string, modality string) float64 {
	if modality != "chat" {
		return 0
	}
	input := catalogInputPrice(name, modality)
	if input == 0 {
		return 0
	}
	return input * 4
}
