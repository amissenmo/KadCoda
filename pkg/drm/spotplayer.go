package drm

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"os"
	"strings"

	"github.com/google/uuid"
)

var (
	ErrSpotPlayerLicenseFailed = errors.New("failed to generate SpotPlayer DRM license")
)

// LicenseResult represents the response returned by SpotPlayer license generation API.
type LicenseResult struct {
	SpotplayerID string `json:"spotplayer_id"`
	LicenseKey   string `json:"license_key"`
	DownloadURL  string `json:"download_url,omitempty"`
}

// LicenseProvider defines the contract for video DRM license provisioning.
type LicenseProvider interface {
	GenerateLicense(ctx context.Context, courseID uuid.UUID, studentMobile, studentName string) (*LicenseResult, error)
}

// SpotPlayerClient implements the LicenseProvider interface with a simulated SpotPlayer adapter.
type SpotPlayerClient struct {
	apiKey string
}

// NewSpotPlayerClient initializes a new SpotPlayer DRM adapter.
func NewSpotPlayerClient() *SpotPlayerClient {
	apiKey := os.Getenv("SPOTPLAYER_API_KEY")
	if apiKey == "" {
		apiKey = "spotplayer-dev-api-key"
	}
	return &SpotPlayerClient{
		apiKey: apiKey,
	}
}

// GenerateLicense provisions a unique SpotPlayer DRM license key (e.g. SP-xxxx-xxxx) for a student and course.
func (s *SpotPlayerClient) GenerateLicense(ctx context.Context, courseID uuid.UUID, studentMobile, studentName string) (*LicenseResult, error) {
	if courseID == uuid.Nil || strings.TrimSpace(studentMobile) == "" {
		return nil, fmt.Errorf("%w: courseID and studentMobile are required", ErrSpotPlayerLicenseFailed)
	}

	tokenBytes := make([]byte, 8)
	if _, err := rand.Read(tokenBytes); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrSpotPlayerLicenseFailed, err)
	}

	hexStr := strings.ToUpper(hex.EncodeToString(tokenBytes))
	licenseKey := fmt.Sprintf("SP-%s-%s-%s", hexStr[0:4], hexStr[4:8], hexStr[8:16])
	spotplayerID := fmt.Sprintf("sp_%s", strings.ToLower(hexStr[0:12]))

	return &LicenseResult{
		SpotplayerID: spotplayerID,
		LicenseKey:   licenseKey,
		DownloadURL:  fmt.Sprintf("https://dl.spotplayer.ir/kadcoda/%s.spot", spotplayerID),
	}, nil
}
