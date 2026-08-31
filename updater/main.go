package main

import (
	"crypto/subtle"
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"os/exec"
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
