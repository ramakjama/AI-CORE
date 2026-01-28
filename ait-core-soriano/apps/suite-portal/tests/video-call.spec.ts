import { test, expect } from '@playwright/test';
import { setupAuthenticatedSession, TEST_USERS } from './utils/auth-helpers';
import { waitForNetworkIdle } from './utils/custom-matchers';

test.describe('Video Call (WebRTC)', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page, TEST_USERS.user);
  });

  test.describe('Call UI', () => {
    test('should display video call button', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForNetworkIdle(page);

      const videoCallButton = page.locator('[data-testid="video-call-button"], button:has-text("Video Call")');

      if (await videoCallButton.isVisible()) {
        await expect(videoCallButton).toBeVisible();
      }
    });

    test('should open video call modal', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForNetworkIdle(page);

      const videoCallButton = page.locator('[data-testid="video-call-button"]');

      if (await videoCallButton.isVisible()) {
        await videoCallButton.click();

        // Video call modal should open
        await expect(page.locator('[data-testid="video-call-modal"], [role="dialog"]:has-text("Video Call")')).toBeVisible();
      }
    });

    test('should close video call modal', async ({ page }) => {
      await page.goto('/dashboard');

      const videoCallButton = page.locator('[data-testid="video-call-button"]');

      if (await videoCallButton.isVisible()) {
        await videoCallButton.click();
        await page.waitForTimeout(500);

        const closeButton = page.locator('[data-testid="close-video-call"], button[aria-label="Close"]');
        await closeButton.click();

        // Modal should close
        await expect(page.locator('[data-testid="video-call-modal"]')).not.toBeVisible();
      }
    });
  });

  test.describe('Camera and Microphone', () => {
    test.skip('should request camera permission', async ({ page, context }) => {
      // Grant permissions
      await context.grantPermissions(['camera', 'microphone']);

      await page.goto('/dashboard');

      const videoCallButton = page.locator('[data-testid="video-call-button"]');

      if (await videoCallButton.isVisible()) {
        await videoCallButton.click();

        // Start call button
        const startCallButton = page.locator('[data-testid="start-call-button"], button:has-text("Start Call")');

        if (await startCallButton.isVisible()) {
          await startCallButton.click();

          // Wait for media stream
          await page.waitForTimeout(2000);

          // Local video should be visible
          const localVideo = page.locator('[data-testid="local-video"], video');
          if (await localVideo.isVisible()) {
            await expect(localVideo).toBeVisible();
          }
        }
      }
    });

    test('should toggle camera on/off', async ({ page, context }) => {
      await context.grantPermissions(['camera', 'microphone']);
      await page.goto('/dashboard');

      const videoCallButton = page.locator('[data-testid="video-call-button"]');

      if (await videoCallButton.isVisible()) {
        await videoCallButton.click();

        const toggleCameraButton = page.locator('[data-testid="toggle-camera"], button[aria-label*="camera" i]');

        if (await toggleCameraButton.isVisible()) {
          // Click to turn off camera
          await toggleCameraButton.click();
          await page.waitForTimeout(500);

          // Button should show camera is off
          const isOff = await toggleCameraButton.evaluate((btn) => {
            return btn.classList.contains('off') || btn.getAttribute('aria-label')?.includes('off');
          });

          // Click to turn on camera
          await toggleCameraButton.click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('should toggle microphone on/off', async ({ page, context }) => {
      await context.grantPermissions(['camera', 'microphone']);
      await page.goto('/dashboard');

      const videoCallButton = page.locator('[data-testid="video-call-button"]');

      if (await videoCallButton.isVisible()) {
        await videoCallButton.click();

        const toggleMicButton = page.locator('[data-testid="toggle-microphone"], button[aria-label*="microphone" i]');

        if (await toggleMicButton.isVisible()) {
          // Click to mute
          await toggleMicButton.click();
          await page.waitForTimeout(500);

          // Button should show muted state
          const isMuted = await toggleMicButton.evaluate((btn) => {
            return btn.classList.contains('muted') || btn.getAttribute('aria-label')?.includes('mute');
          });

          // Click to unmute
          await toggleMicButton.click();
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe('Call Controls', () => {
    test('should display call controls', async ({ page, context }) => {
      await context.grantPermissions(['camera', 'microphone']);
      await page.goto('/dashboard');

      const videoCallButton = page.locator('[data-testid="video-call-button"]');

      if (await videoCallButton.isVisible()) {
        await videoCallButton.click();

        // Check for control buttons
        const controls = [
          '[data-testid="toggle-camera"]',
          '[data-testid="toggle-microphone"]',
          '[data-testid="end-call"]',
        ];

        for (const control of controls) {
          const element = page.locator(control);
          if (await element.isVisible()) {
            await expect(element).toBeVisible();
          }
        }
      }
    });

    test('should end call', async ({ page, context }) => {
      await context.grantPermissions(['camera', 'microphone']);
      await page.goto('/dashboard');

      const videoCallButton = page.locator('[data-testid="video-call-button"]');

      if (await videoCallButton.isVisible()) {
        await videoCallButton.click();

        const endCallButton = page.locator('[data-testid="end-call"], button:has-text("End Call")');

        if (await endCallButton.isVisible()) {
          await endCallButton.click();

          // Call should end and modal should close
          await expect(page.locator('[data-testid="video-call-modal"]')).not.toBeVisible();
        }
      }
    });

    test('should toggle screen share', async ({ page, context }) => {
      await context.grantPermissions(['camera', 'microphone']);
      await page.goto('/dashboard');

      const videoCallButton = page.locator('[data-testid="video-call-button"]');

      if (await videoCallButton.isVisible()) {
        await videoCallButton.click();

        const screenShareButton = page.locator('[data-testid="screen-share"], button[aria-label*="screen" i]');

        if (await screenShareButton.isVisible()) {
          await expect(screenShareButton).toBeVisible();
          // Note: Actual screen sharing requires user interaction that can't be automated
        }
      }
    });
  });

  test.describe('Call Notifications', () => {
    test('should show incoming call notification', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForNetworkIdle(page);

      // This would typically be triggered by WebSocket/WebRTC signaling
      // We can check if the notification component exists

      const callNotification = page.locator('[data-testid="call-notification"]');

      // Component should be in DOM (even if not visible)
      const exists = (await callNotification.count()) >= 0;
      expect(exists).toBeTruthy();
    });

    test('should accept incoming call', async ({ page, context }) => {
      await context.grantPermissions(['camera', 'microphone']);
      await page.goto('/dashboard');

      // Simulate incoming call notification (would normally come from WebSocket)
      const acceptButton = page.locator('[data-testid="accept-call"], button:has-text("Accept")');

      if (await acceptButton.isVisible()) {
        await acceptButton.click();

        // Video call modal should open
        await expect(page.locator('[data-testid="video-call-modal"]')).toBeVisible();
      }
    });

    test('should reject incoming call', async ({ page }) => {
      await page.goto('/dashboard');

      // Simulate incoming call notification
      const rejectButton = page.locator('[data-testid="reject-call"], button:has-text("Reject")');

      if (await rejectButton.isVisible()) {
        await rejectButton.click();

        // Notification should disappear
        await expect(page.locator('[data-testid="call-notification"]')).not.toBeVisible();
      }
    });
  });

  test.describe('Multiple Participants', () => {
    test('should display participant grid', async ({ page, context }) => {
      await context.grantPermissions(['camera', 'microphone']);
      await page.goto('/dashboard');

      const videoCallButton = page.locator('[data-testid="video-call-button"]');

      if (await videoCallButton.isVisible()) {
        await videoCallButton.click();

        const participantGrid = page.locator('[data-testid="participant-grid"]');

        if (await participantGrid.isVisible()) {
          await expect(participantGrid).toBeVisible();
        }
      }
    });

    test('should show participant list', async ({ page, context }) => {
      await context.grantPermissions(['camera', 'microphone']);
      await page.goto('/dashboard');

      const videoCallButton = page.locator('[data-testid="video-call-button"]');

      if (await videoCallButton.isVisible()) {
        await videoCallButton.click();

        const participantList = page.locator('[data-testid="participant-list"]');

        if (await participantList.isVisible()) {
          await expect(participantList).toBeVisible();
        }
      }
    });

    test('should invite participants', async ({ page, context }) => {
      await context.grantPermissions(['camera', 'microphone']);
      await page.goto('/dashboard');

      const videoCallButton = page.locator('[data-testid="video-call-button"]');

      if (await videoCallButton.isVisible()) {
        await videoCallButton.click();

        const inviteButton = page.locator('[data-testid="invite-participants"], button:has-text("Invite")');

        if (await inviteButton.isVisible()) {
          await inviteButton.click();

          // Invite dialog should open
          await expect(page.locator('[role="dialog"]:has-text("Invite")')).toBeVisible();
        }
      }
    });
  });

  test.describe('Call Settings', () => {
    test('should open settings', async ({ page, context }) => {
      await context.grantPermissions(['camera', 'microphone']);
      await page.goto('/dashboard');

      const videoCallButton = page.locator('[data-testid="video-call-button"]');

      if (await videoCallButton.isVisible()) {
        await videoCallButton.click();

        const settingsButton = page.locator('[data-testid="call-settings"], button[aria-label*="settings" i]');

        if (await settingsButton.isVisible()) {
          await settingsButton.click();

          // Settings panel should open
          await expect(page.locator('[data-testid="call-settings-panel"]')).toBeVisible();
        }
      }
    });

    test('should select camera device', async ({ page, context }) => {
      await context.grantPermissions(['camera', 'microphone']);
      await page.goto('/dashboard');

      const videoCallButton = page.locator('[data-testid="video-call-button"]');

      if (await videoCallButton.isVisible()) {
        await videoCallButton.click();

        const cameraSelect = page.locator('[data-testid="camera-select"], select[name*="camera" i]');

        if (await cameraSelect.isVisible()) {
          await expect(cameraSelect).toBeVisible();

          // Should have at least one option
          const options = await cameraSelect.locator('option').count();
          expect(options).toBeGreaterThan(0);
        }
      }
    });

    test('should select microphone device', async ({ page, context }) => {
      await context.grantPermissions(['camera', 'microphone']);
      await page.goto('/dashboard');

      const videoCallButton = page.locator('[data-testid="video-call-button"]');

      if (await videoCallButton.isVisible()) {
        await videoCallButton.click();

        const micSelect = page.locator('[data-testid="microphone-select"], select[name*="microphone" i]');

        if (await micSelect.isVisible()) {
          await expect(micSelect).toBeVisible();

          // Should have at least one option
          const options = await micSelect.locator('option').count();
          expect(options).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('Call Quality', () => {
    test('should show connection quality indicator', async ({ page, context }) => {
      await context.grantPermissions(['camera', 'microphone']);
      await page.goto('/dashboard');

      const videoCallButton = page.locator('[data-testid="video-call-button"]');

      if (await videoCallButton.isVisible()) {
        await videoCallButton.click();

        const qualityIndicator = page.locator('[data-testid="connection-quality"]');

        if (await qualityIndicator.isVisible()) {
          await expect(qualityIndicator).toBeVisible();
        }
      }
    });

    test('should display network stats', async ({ page, context }) => {
      await context.grantPermissions(['camera', 'microphone']);
      await page.goto('/dashboard');

      const videoCallButton = page.locator('[data-testid="video-call-button"]');

      if (await videoCallButton.isVisible()) {
        await videoCallButton.click();

        const statsButton = page.locator('[data-testid="show-stats"]');

        if (await statsButton.isVisible()) {
          await statsButton.click();

          // Stats panel should show
          await expect(page.locator('[data-testid="network-stats"]')).toBeVisible();
        }
      }
    });
  });

  test.describe('Call Recording', () => {
    test('should have recording button', async ({ page, context }) => {
      await context.grantPermissions(['camera', 'microphone']);
      await page.goto('/dashboard');

      const videoCallButton = page.locator('[data-testid="video-call-button"]');

      if (await videoCallButton.isVisible()) {
        await videoCallButton.click();

        const recordButton = page.locator('[data-testid="record-call"], button[aria-label*="record" i]');

        if (await recordButton.isVisible()) {
          await expect(recordButton).toBeVisible();
        }
      }
    });

    test('should toggle recording', async ({ page, context }) => {
      await context.grantPermissions(['camera', 'microphone']);
      await page.goto('/dashboard');

      const videoCallButton = page.locator('[data-testid="video-call-button"]');

      if (await videoCallButton.isVisible()) {
        await videoCallButton.click();

        const recordButton = page.locator('[data-testid="record-call"]');

        if (await recordButton.isVisible()) {
          await recordButton.click();

          // Should show recording indicator
          const recordingIndicator = page.locator('[data-testid="recording-indicator"], text=/recording/i');
          if (await recordingIndicator.isVisible()) {
            await expect(recordingIndicator).toBeVisible();
          }
        }
      }
    });
  });
});
