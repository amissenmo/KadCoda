package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"

	"kadcoda-backend/internal/database"
	_ "kadcoda-backend/internal/models"
	"kadcoda-backend/internal/server"
)

func main() {
	ctx := context.Background()

	if os.Getenv("APP_ENV") == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	pgConfig := database.LoadPostgresConfigFromEnv()
	db, err := database.ConnectPostgres(ctx, pgConfig)
	if err != nil {
		log.Fatalf("Failed to initialize PostgreSQL connection: %v", err)
	}
	defer func() {
		if err := database.ClosePostgres(db); err != nil {
			log.Printf("Error closing PostgreSQL connection: %v", err)
		}
	}()
	log.Println("PostgreSQL connection established successfully")

	if err := database.AutoMigrate(db); err != nil {
		log.Fatalf("Failed to run database migrations: %v", err)
	}
	log.Println("Database schema migration completed successfully")

	redisConfig := database.LoadRedisConfigFromEnv()
	redisClient, err := database.ConnectRedis(ctx, redisConfig)
	if err != nil {
		log.Fatalf("Failed to initialize Redis connection: %v", err)
	}
	defer func() {
		if err := database.CloseRedis(redisClient); err != nil {
			log.Printf("Error closing Redis connection: %v", err)
		}
	}()
	log.Println("Redis connection established successfully")

	router := server.NewRouter(server.Dependencies{
		DB:    db,
		Redis: redisClient,
	})

	host := getEnv("SERVER_HOST", "0.0.0.0")
	port := getEnv("SERVER_PORT", "8080")
	addr := fmt.Sprintf("%s:%s", host, port)

	httpServer := &http.Server{
		Addr:              addr,
		Handler:           router,
		ReadTimeout:       15 * time.Second,
		ReadHeaderTimeout: 5 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	serverErrors := make(chan error, 1)
	go func() {
		log.Printf("KadCoda API server listening on %s", addr)
		if err := httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serverErrors <- err
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	select {
	case err := <-serverErrors:
		log.Fatalf("HTTP server failed to start: %v", err)
	case sig := <-quit:
		log.Printf("Received signal %v, initiating graceful shutdown...", sig)
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		log.Printf("Forced server shutdown due to timeout or error: %v", err)
	}

	log.Println("KadCoda API server stopped gracefully")
}

func getEnv(key, fallback string) string {
	if val, exists := os.LookupEnv(key); exists && val != "" {
		return val
	}
	return fallback
}
