# Notifications System - Visual Guide

This guide shows what the notification system looks like and how users interact with it.

## 1. Bell Icon in Topbar

**Location**: Top-right corner of the topbar, next to dark mode toggle

**Appearance**:
```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard                           [Search...] 🔔(3) 🌙 👤 │
└─────────────────────────────────────────────────────────────┘
                                                   ↑
                                            Bell with badge
```

**States**:
- **No notifications**: Bell icon only, no badge
- **Unread notifications**: Bell icon with red badge showing count
- **New notification**: Badge pulses for 2 seconds

**Badge Display**:
- `1-99`: Shows exact number (e.g., "3")
- `100+`: Shows "99+"

## 2. Toast Notifications (Bottom-Right)

**Location**: Fixed position, bottom-right corner of screen

**Layout**:
```
                                    ┌─────────────────────────┐
                                    │ ✓ Task Completed     [X]│
                                    │ Your export finished.   │
                                    │ [View Tasks →]         │
                                    │ ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░   │
                                    └─────────────────────────┘

                                    ┌─────────────────────────┐
                                    │ ⚠ Storage Warning    [X]│
                                    │ You're at 95% capacity. │
                                    │ [Manage Storage →]     │
                                    │ ▓▓▓▓▓▓▓▓░░░░░░░░░░░░   │
                                    └─────────────────────────┘

                                    ┌─────────────────────────┐
                                    │ ℹ New Feature        [X]│
                                    │ Check out AI analytics. │
                                    │ [Explore →]            │
                                    │ ▓▓▓▓░░░░░░░░░░░░░░░░   │
                                    └─────────────────────────┘
```

**Features**:
- Maximum 3 visible at once
- Auto-dismiss after 5 seconds
- Progress bar shows time remaining
- Click anywhere to navigate (if action URL)
- Click [X] to close immediately
- Stacked vertically (newest on top)

**Notification Types**:

### Success (Green)
```
┌─────────────────────────────────┐
│ ✓ Task Completed             [X]│  ← Green checkmark icon
│ Your export has finished.       │  ← Message
│ [View Tasks →]                  │  ← Action button (optional)
│ ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░       │  ← Progress bar (green)
└─────────────────────────────────┘
   ↑ Light green background
```

### Error (Red)
```
┌─────────────────────────────────┐
│ ⊗ Upload Failed              [X]│  ← Red X icon
│ Failed to upload file.          │  ← Message
│ [Retry →]                       │  ← Action button
│ ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░       │  ← Progress bar (red)
└─────────────────────────────────┘
   ↑ Light red background
```

### Warning (Yellow)
```
┌─────────────────────────────────┐
│ ⚠ Storage Almost Full        [X]│  ← Yellow warning icon
│ You're using 95% of storage.    │  ← Message
│ [Manage Storage →]              │  ← Action button
│ ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░       │  ← Progress bar (yellow)
└─────────────────────────────────┘
   ↑ Light yellow background
```

### Info (Blue)
```
┌─────────────────────────────────┐
│ ℹ New Feature Available      [X]│  ← Blue info icon
│ Check out AI analytics.         │  ← Message
│ [Explore Now →]                 │  ← Action button
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░       │  ← Progress bar (blue)
└─────────────────────────────────┘
   ↑ Light blue background
```

## 3. Notification Center Dropdown

**Opens When**: User clicks bell icon

**Size**: 420px wide, 400px tall

**Layout**:
```
┌──────────────────────────────────────────────┐
│ 🔔 Notifications           [✓✓] [🗑️]         │ ← Header
├──────────────────────────────────────────────┤
│ TODAY                                        │ ← Date group
├──────────────────────────────────────────────┤
│ ✓ Task Completed                          ●  │ ← Unread dot
│ Your export has finished.                    │
│ 2 minutes ago                                │
├──────────────────────────────────────────────┤
│ ⚠ Storage Warning                            │
│ You're using 95% of storage.                 │
│ 15 minutes ago                               │
├──────────────────────────────────────────────┤
│ YESTERDAY                                    │ ← Date group
├──────────────────────────────────────────────┤
│ ℹ New Feature                                │
│ Check out AI analytics.                      │
│ Yesterday at 3:45 PM                         │
├──────────────────────────────────────────────┤
│ ⊗ Upload Failed                              │
│ Failed to upload file.                       │
│ Yesterday at 10:30 AM                        │
├──────────────────────────────────────────────┤
│ THIS WEEK                                    │ ← Date group
├──────────────────────────────────────────────┤
│ ✓ Backup Completed                           │
│ Your data has been backed up.                │
│ 3 days ago                                   │
├──────────────────────────────────────────────┤
│                    ▼▼▼                       │ ← Scrollbar
└──────────────────────────────────────────────┘
```

**Header Buttons**:
- `[✓✓]` - Mark all as read (check-check icon)
- `[🗑️]` - Clear all notifications (trash icon)

**Date Groups**:
- **Today**: Notifications from last 24 hours
- **Yesterday**: Notifications from 24-48 hours ago
- **This Week**: Notifications from 2-7 days ago
- **Older**: Notifications older than 7 days

**Empty State**:
```
┌──────────────────────────────────────────────┐
│ 🔔 Notifications           [✓✓] [🗑️]         │
├──────────────────────────────────────────────┤
│                                              │
│                                              │
│              🔔                              │
│        No notifications                      │
│      You're all caught up!                   │
│                                              │
│                                              │
└──────────────────────────────────────────────┘
```

**Notification Item States**:

Unread:
```
│ ✓ Task Completed                          ●  │ ← Blue dot
│ Your export has finished.                    │
│ 2 minutes ago                                │
  ↑ Light blue background highlight
```

Read:
```
│ ⚠ Storage Warning                            │ ← No dot
│ You're using 95% of storage.                 │
│ 15 minutes ago                               │
  ↑ Normal background (white/dark)
```

## 4. Badge Animations

### Pulse Animation (New Notification)
```
Frame 1:  🔔(3)    ← Normal
Frame 2:  🔔(3)    ← Slightly larger, brighter
Frame 3:  🔔(3)    ← Larger, bright
Frame 4:  🔔(3)    ← Back to larger
Frame 5:  🔔(3)    ← Back to normal

Duration: 1.5 seconds
Repeats: 2 times
```

### Count Update Animation
```
Before: 🔔(3)
After:  🔔(4)  ← Scales from 0 to 1 (bounce effect)

Duration: 300ms
Easing: Spring
```

## 5. Notification Demo Component (Testing)

**Location**: Bottom-left corner when added to page

**Layout**:
```
┌─────────────────────────────────────┐
│ 🔔 Notification Demo                 │
│ WebSocket: [Connected]               │
│                                      │
│ [✓ Success Notification       ]     │
│ [⊗ Error Notification        ]     │
│ [⚠ Warning Notification      ]     │
│ [ℹ Info Notification         ]     │
│ [  Random Notification       ]     │
│                                      │
│ Click to trigger test notification   │
└─────────────────────────────────────┘
```

**Button Colors**:
- Success: Green background
- Error: Red background
- Warning: Yellow background
- Info: Blue background
- Random: Purple background

## 6. Dark Mode

### Toast in Dark Mode
```
┌─────────────────────────────────┐
│ ✓ Task Completed             [X]│  ← Light green icon
│ Your export has finished.       │  ← White text
│ [View Tasks →]                  │  ← Light green button
│ ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░       │  ← Light green progress
└─────────────────────────────────┘
   ↑ Dark green/gray background
```

### Notification Center in Dark Mode
```
┌──────────────────────────────────────────────┐
│ 🔔 Notifications           [✓✓] [🗑️]         │ ← Dark gray bg
├──────────────────────────────────────────────┤
│ TODAY                                        │ ← Darker gray
├──────────────────────────────────────────────┤
│ ✓ Task Completed                          ●  │ ← White text
│ Your export has finished.                    │ ← Gray text
│ 2 minutes ago                                │ ← Lighter gray
└──────────────────────────────────────────────┘
   ↑ Dark background throughout
```

## 7. Responsive Design

### Desktop (1920x1080)
- Toast: 380px wide, bottom-right with 24px margin
- Center: 420px wide dropdown
- Bell: Standard size in topbar

### Tablet (768x1024)
- Toast: 380px wide (or 90% of screen width)
- Center: 420px wide (or 90% of screen width)
- Bell: Standard size

### Mobile (375x667)
- Toast: 90% screen width, 12px margin
- Center: Full width dropdown
- Bell: Slightly larger touch target

## 8. Interaction Flows

### Receiving a Notification
```
1. WebSocket event received
   ↓
2. Badge count increases: 🔔(3) → 🔔(4)
   ↓
3. Badge pulses (2 seconds)
   ↓
4. Toast appears bottom-right
   ↓
5. Progress bar animates (5 seconds)
   ↓
6. Toast disappears
   ↓
7. Notification stays in center as "unread"
```

### Reading a Notification
```
1. User clicks bell icon
   ↓
2. Notification center opens
   ↓
3. User sees unread notification (blue dot)
   ↓
4. User clicks notification
   ↓
5. Notification marked as read (dot disappears)
   ↓
6. Badge count decreases: 🔔(4) → 🔔(3)
   ↓
7. User navigates to action URL
   ↓
8. Notification center closes
```

### Marking All as Read
```
1. User opens notification center
   ↓
2. User clicks [✓✓] button
   ↓
3. All blue dots disappear
   ↓
4. Badge disappears: 🔔(8) → 🔔 (no badge)
   ↓
5. All notifications now have normal background
```

### Clearing All
```
1. User opens notification center
   ↓
2. User clicks [🗑️] button
   ↓
3. All notifications disappear
   ↓
4. Empty state appears
   ↓
5. Badge disappears
```

## 9. Color Scheme

### Light Mode
| Type    | Background        | Border           | Icon/Text        |
|---------|-------------------|------------------|------------------|
| Success | Green-50          | Green-200        | Green-600        |
| Error   | Red-50            | Red-200          | Red-600          |
| Warning | Yellow-50         | Yellow-200       | Yellow-600       |
| Info    | Blue-50           | Blue-200         | Blue-600         |

### Dark Mode
| Type    | Background        | Border           | Icon/Text        |
|---------|-------------------|------------------|------------------|
| Success | Green-900/20      | Green-800        | Green-400        |
| Error   | Red-900/20        | Red-800          | Red-400          |
| Warning | Yellow-900/20     | Yellow-800       | Yellow-400       |
| Info    | Blue-900/20       | Blue-800         | Blue-400         |

## 10. Timing & Duration

| Action                    | Duration    | Details                    |
|---------------------------|-------------|----------------------------|
| Toast entrance            | 300ms       | Slide in from right        |
| Toast exit                | 300ms       | Slide out to right         |
| Toast auto-dismiss        | 5 seconds   | Starts immediately         |
| Progress bar animation    | 5 seconds   | Linear animation           |
| Badge pulse               | 1.5 seconds | Repeats 2 times            |
| Center open/close         | 200ms       | Fade + scale               |
| Mark as read animation    | 150ms       | Fade background change     |
| Count update              | 300ms       | Spring animation           |

## 11. Accessibility Features

- **ARIA Labels**: All buttons have descriptive labels
- **Keyboard Navigation**: Tab through all interactive elements
- **Screen Reader**: Announces new notifications
- **Focus Management**: Proper focus when opening/closing
- **Color Contrast**: WCAG AA compliant
- **Focus Indicators**: Visible on all interactive elements

## 12. Sound

When enabled, plays a subtle notification sound:
- **Format**: MP3
- **Duration**: ~500ms
- **Volume**: 30% (subtle, not intrusive)
- **Location**: `/public/sounds/notification.mp3`

---

This visual guide shows the complete user experience of the notification system. All components are designed to be intuitive, accessible, and visually appealing in both light and dark modes.
