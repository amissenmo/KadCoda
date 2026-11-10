package database

import (
	"context"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

// RedisConfig holds configuration parameters for the Redis client.
type RedisConfig struct {
	Addr         string
	Username     string
	Password     string
	DB           int
	PoolSize     int
	MinIdleConns int
	DialTimeout  time.Duration
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
}

// LoadRedisConfigFromEnv populates RedisConfig from environment variables.
func LoadRedisConfigFromEnv() RedisConfig {
	dbIndex, err := strconv.Atoi(getEnv("REDIS_DB", "0"))
	if err != nil {
		dbIndex = 0
	}

	poolSize, err := strconv.Atoi(getEnv("REDIS_POOL_SIZE", "20"))
	if err != nil {
		poolSize = 20
	}

	minIdle, err := strconv.Atoi(getEnv("REDIS_MIN_IDLE_CONNS", "5"))
	if err != nil {
		minIdle = 5
	}

	host := getEnv("REDIS_HOST", "localhost")
	port := getEnv("REDIS_PORT", "6379")
	addr := getEnv("REDIS_ADDR", fmt.Sprintf("%s:%s", host, port))

	return RedisConfig{
		Addr:         addr,
		Username:     os.Getenv("REDIS_USERNAME"),
		Password:     os.Getenv("REDIS_PASSWORD"),
		DB:           dbIndex,
		PoolSize:     poolSize,
		MinIdleConns: minIdle,
		DialTimeout:  5 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
	}
}

// ConnectRedis initializes a go-redis v9 client and verifies connectivity via PING.
func ConnectRedis(ctx context.Context, cfg RedisConfig) (*redis.Client, error) {
	var opts *redis.Options

	if redisURL := os.Getenv("REDIS_URL"); redisURL != "" {
		parsedOpts, err := redis.ParseURL(redisURL)
		if err != nil {
			return nil, fmt.Errorf("failed to parse REDIS_URL: %w", err)
		}
		opts = parsedOpts
	} else {
		opts = &redis.Options{
			Addr:         cfg.Addr,
			Username:     cfg.Username,
			Password:     cfg.Password,
			DB:           cfg.DB,
			PoolSize:     cfg.PoolSize,
			MinIdleConns: cfg.MinIdleConns,
			DialTimeout:  cfg.DialTimeout,
			ReadTimeout:  cfg.ReadTimeout,
			WriteTimeout: cfg.WriteTimeout,
		}
	}

	client := redis.NewClient(opts)

	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	if err := client.Ping(pingCtx).Err(); err != nil {
		_ = client.Close()
		return nil, fmt.Errorf("failed to ping redis server: %w", err)
	}

	return client, nil
}

// CloseRedis gracefully closes the Redis client connection pool.
func CloseRedis(client *redis.Client) error {
	if client == nil {
		return nil
	}
	return client.Close()
}
