package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// PostgresConfig holds the configuration parameters for PostgreSQL.
type PostgresConfig struct {
	Host            string
	Port            string
	User            string
	Password        string
	DBName          string
	SSLMode         string
	TimeZone        string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
	ConnMaxIdleTime time.Duration
}

// LoadPostgresConfigFromEnv populates PostgresConfig from environment variables with sensible defaults.
func LoadPostgresConfigFromEnv() PostgresConfig {
	maxOpen, err := strconv.Atoi(getEnv("DB_MAX_OPEN_CONNS", "100"))
	if err != nil || maxOpen <= 0 {
		maxOpen = 100
	}

	maxIdle, err := strconv.Atoi(getEnv("DB_MAX_IDLE_CONNS", "10"))
	if err != nil || maxIdle <= 0 {
		maxIdle = 10
	}

	return PostgresConfig{
		Host:            getEnv("DB_HOST", "localhost"),
		Port:            getEnv("DB_PORT", "5432"),
		User:            getEnv("DB_USER", "postgres"),
		Password:        getEnv("DB_PASSWORD", ""),
		DBName:          getEnv("DB_NAME", "kadcoda"),
		SSLMode:         getEnv("DB_SSLMODE", "disable"),
		TimeZone:        getEnv("DB_TIMEZONE", "Asia/Tehran"),
		MaxOpenConns:    maxOpen,
		MaxIdleConns:    maxIdle,
		ConnMaxLifetime: time.Hour,
		ConnMaxIdleTime: 10 * time.Minute,
	}
}

// DSN constructs the PostgreSQL Data Source Name.
func (c PostgresConfig) DSN() string {
	if dbURL := os.Getenv("DATABASE_URL"); dbURL != "" {
		return dbURL
	}
	return fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=%s",
		c.Host, c.User, c.Password, c.DBName, c.Port, c.SSLMode, c.TimeZone,
	)
}

// ConnectPostgres initializes a GORM PostgreSQL connection with connection pooling and health verification.
func ConnectPostgres(ctx context.Context, cfg PostgresConfig) (*gorm.DB, error) {
	logLevel := logger.Warn
	if getEnv("APP_ENV", "development") == "development" {
		logLevel = logger.Info
	}

	gormLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             200 * time.Millisecond,
			LogLevel:                  logLevel,
			IgnoreRecordNotFoundError: true,
			Colorful:                  false,
		},
	)

	db, err := gorm.Open(postgres.Open(cfg.DSN()), &gorm.Config{
		Logger:      gormLogger,
		PrepareStmt: true,
		NowFunc: func() time.Time {
			return time.Now().UTC()
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to open gorm postgres connection: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve underlying sql.DB: %w", err)
	}

	// Configure connection pooling to prevent DB connection spikes under heavy load
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	if cfg.MaxIdleConns > 0 {
		sqlDB.SetMaxIdleConns(cfg.MaxIdleConns)
	}
	if cfg.MaxOpenConns > 0 {
		sqlDB.SetMaxOpenConns(cfg.MaxOpenConns)
	}
	if cfg.ConnMaxLifetime > 0 {
		sqlDB.SetConnMaxLifetime(cfg.ConnMaxLifetime)
	}
	if cfg.ConnMaxIdleTime > 0 {
		sqlDB.SetConnMaxIdleTime(cfg.ConnMaxIdleTime)
	}

	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	if err := sqlDB.PingContext(pingCtx); err != nil {
		return nil, fmt.Errorf("failed to ping postgres database: %w", err)
	}

	return db, nil
}

// ClosePostgres gracefully closes the underlying SQL connection pool.
func ClosePostgres(db *gorm.DB) error {
	if db == nil {
		return nil
	}
	sqlDB, err := db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

func getEnv(key, fallback string) string {
	if val, exists := os.LookupEnv(key); exists && val != "" {
		return val
	}
	return fallback
}
