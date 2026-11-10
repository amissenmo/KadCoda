package database

import (
	"fmt"
	"log"

	"gorm.io/gorm"

	"kadcoda-backend/internal/models"
)

// AutoMigrate ensures the PostgreSQL pgcrypto extension is enabled for gen_random_uuid()
// and migrates all KadCoda relational schemas in topological dependency order.
func AutoMigrate(db *gorm.DB) error {
	if db == nil {
		return fmt.Errorf("cannot run AutoMigrate on a nil gorm.DB instance")
	}

	if err := db.Exec(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`).Error; err != nil {
		log.Printf("Warning: could not ensure pgcrypto extension: %v", err)
	}

	err := db.AutoMigrate(
		&models.User{},
		&models.Category{},
		&models.Course{},
		&models.Chapter{},
		&models.Episode{},
		&models.Enrollment{},
		&models.Discount{},
		&models.Order{},
		&models.Ticket{},
		&models.TicketMessage{},
		&models.Article{},
		&models.Certificate{},
	)
	if err != nil {
		return fmt.Errorf("gorm automigrate failed: %w", err)
	}

	return nil
}
