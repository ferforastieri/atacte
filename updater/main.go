package main

import (
	"crypto/subtle"
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

type updater struct {
	mu      sync.Mutex
	running bool
	token   string
}

func main() {
	u := &updater{token: strings.TrimSpace(os.Getenv("UPDATER_TOKEN"))}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", u.health)
	mux.HandleFunc("POST /v1/update", u.update)
	mux.HandleFunc("POST /v1/config", u.config)
	server := &http.Server{
		Addr:              ":8080",
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       30 * time.Second,
	}
	slog.Info("atacte updater started")
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		slog.Error("http server", "error", err)
		os.Exit(1)
	}
}

func (u *updater) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (u *updater) update(w http.ResponseWriter, r *http.Request) {
	if !u.authorized(r) {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}
	u.mu.Lock()
	if u.running {
		u.mu.Unlock()
		writeJSON(w, http.StatusConflict, map[string]string{"error": "update already running"})
		return
	}
	u.running = true
	u.mu.Unlock()
	writeJSON(w, http.StatusAccepted, map[string]string{"status": "started"})
	go u.run()
}

var configurableKeys = map[string]bool{
	"COOKIE_SECURE": true, "COOKIE_SAME_SITE": true, "COOKIE_DOMAIN": true,
	"CORS_ORIGIN": true, "TRUST_PROXY": true,
	"RATE_LIMIT_WINDOW_MS": true, "RATE_LIMIT_MAX_REQUESTS": true,
	"AUTH_RATE_LIMIT_MAX": true, "AUTH_RATE_LIMIT_WINDOW_MS": true,
	"MUTATION_RATE_LIMIT_MAX": true, "MUTATION_RATE_LIMIT_WINDOW_MS": true,
	"SMTP_HOST": true, "SMTP_PORT": true, "SMTP_USER": true, "SMTP_PASS": true,
	"EMAIL_FROM": true, "EMAIL_FROM_NAME": true, "PASSWORD_RESET_URL": true,
	"FRONT_PORT": true, "BACKEND_PORT": true, "POSTGRES_PORT": true,
}

func (u *updater) config(w http.ResponseWriter, r *http.Request) {
	if !u.authorized(r) {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}
	var payload struct {
		Values map[string]string `json:"values"`
	}
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 32<<10))
	if err := decoder.Decode(&payload); err != nil || len(payload.Values) == 0 || len(payload.Values) > 24 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid configuration"})
		return
	}
	for key, value := range payload.Values {
		if !configurableKeys[key] || strings.ContainsAny(value, "\r\n") || len(value) > 512 {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "unsupported configuration key or value"})
			return
		}
	}
	projectDir := env("ATACTE_INSTALL_DIR", "/workspace")
	if err := writeEnv(filepath.Join(projectDir, ".env"), payload.Values); err != nil {
		slog.Error("configuration write failed", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "configuration could not be saved"})
		return
	}
	writeJSON(w, http.StatusAccepted, map[string]string{"status": "saved"})
	go u.restart(projectDir)
}

func writeEnv(path string, values map[string]string) error {
	content, err := os.ReadFile(path)
	if err != nil && !os.IsNotExist(err) {
		return err
	}
	lines := strings.Split(string(content), "\n")
	seen := make(map[string]bool)
	for i, line := range lines {
		trimmed := strings.TrimSpace(line)
		idx := strings.IndexByte(trimmed, '=')
		if idx <= 0 {
			continue
		}
		key := strings.TrimSpace(trimmed[:idx])
		if value, ok := values[key]; ok {
			lines[i] = key + "=" + value
			seen[key] = true
		}
	}
	for key, value := range values {
		if !seen[key] {
			lines = append(lines, key+"="+value)
		}
	}
	newContent := strings.TrimRight(strings.Join(lines, "\n"), "\n") + "\n"
	dir := filepath.Dir(path)
	tmp, err := os.CreateTemp(dir, ".env.update-*")
	if err != nil {
		return err
	}
	tmpName := tmp.Name()
	defer os.Remove(tmpName)
	if err := tmp.Chmod(0o600); err != nil {
		_ = tmp.Close()
		return err
	}
	if _, err := tmp.WriteString(newContent); err != nil {
		_ = tmp.Close()
		return err
	}
	if err := tmp.Close(); err != nil {
		return err
	}
	return os.Rename(tmpName, path)
}

func (u *updater) restart(projectDir string) {
	compose := []string{"compose", "--project-directory", projectDir, "-f", filepath.Join(projectDir, "docker-compose.yml")}
	args := append(compose, "up", "-d", "--no-build", "--remove-orphans", "backend", "front")
	if out, err := exec.Command("docker", args...).CombinedOutput(); err != nil {
		slog.Error("configuration restart failed", "error", err, "output", string(out))
	}
}

func (u *updater) authorized(r *http.Request) bool {
	if u.token == "" {
		return false
	}
	provided := strings.TrimSpace(strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer "))
	if provided == "" || len(provided) != len(u.token) {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(provided), []byte(u.token)) == 1
}

func (u *updater) run() {
	defer func() {
		u.mu.Lock()
		u.running = false
		u.mu.Unlock()
	}()
	projectDir := env("ATACTE_INSTALL_DIR", "/workspace")
	compose := []string{"compose", "--project-directory", projectDir, "-f", projectDir + "/docker-compose.yml"}
	commands := [][]string{
		{"pull", "backend", "front"},
		// Run versioned Prisma migrations from the freshly pulled backend image
		// before replacing the running API container.
		{"run", "--rm", "backend", "./node_modules/.bin/prisma", "migrate", "deploy", "--schema=src/infrastructure/prisma/schema.prisma"},
		{"up", "-d", "--no-build", "--remove-orphans", "backend", "front"},
	}
	for _, args := range commands {
		out, err := exec.Command("docker", append(compose, args...)...).CombinedOutput()
		if err != nil {
			slog.Error("update failed", "error", err, "output", string(out))
			return
		}
	}
	slog.Info("update completed")
}

func env(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
