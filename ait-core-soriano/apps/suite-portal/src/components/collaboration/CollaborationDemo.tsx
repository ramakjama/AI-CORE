'use client';

// ============================================================================
// CollaborationDemo Component - Demo Playground for Collaboration Features
// ============================================================================

import React, { useRef, useState } from 'react';
import { RemoteCursors, RemoteSelection, UserPresenceIndicator } from './index';
import { usePresence, useMouseTracking, useSelectionTracking } from '@/hooks/use-presence';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Users, MousePointer, Type } from 'lucide-react';

export const CollaborationDemo: React.FC = () => {
  const [enabled, setEnabled] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const currentUserId = 'demo-user-local';

  const {
    activeUsers,
    onlineUsers,
    updateCursor,
    updateSelection,
    addRemoteUser,
    processRemoteUpdate,
  } = usePresence({
    userId: currentUserId,
    documentId: 'demo-doc',
    userName: 'You',
    enabled,
  });

  const cursorPosition = useMouseTracking(containerRef, enabled);
  const selectionRange = useSelectionTracking(contentRef, enabled);

  // Update cursor
  React.useEffect(() => {
    if (cursorPosition) {
      updateCursor(cursorPosition);
    }
  }, [cursorPosition, updateCursor]);

  // Update selection
  React.useEffect(() => {
    updateSelection(selectionRange || undefined);
  }, [selectionRange, updateSelection]);

  // Simulate remote users
  const simulateRemoteUser = () => {
    const remoteUserId = `remote-${Date.now()}`;
    addRemoteUser(remoteUserId, {
      id: remoteUserId,
      name: `User ${Math.floor(Math.random() * 100)}`,
    });

    // Animate cursor
    let x = Math.random() * 500;
    let y = Math.random() * 400;

    const interval = setInterval(() => {
      x += (Math.random() - 0.5) * 50;
      y += (Math.random() - 0.5) * 50;
      x = Math.max(0, Math.min(500, x));
      y = Math.max(0, Math.min(400, y));

      processRemoteUpdate({
        type: 'cursor',
        userId: remoteUserId,
        data: { cursor: { x, y } },
        timestamp: Date.now(),
      });
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      processRemoteUpdate({
        type: 'leave',
        userId: remoteUserId,
        data: {},
        timestamp: Date.now(),
      });
    }, 10000);
  };

  return (
    <div className="container mx-auto p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Collaboration System Demo</h1>
        <p className="text-muted-foreground">
          Experience real-time cursors, selections, and presence indicators
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Controls</CardTitle>
            <CardDescription>Configure collaboration features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="presence-toggle">Enable Presence</Label>
              <Switch
                id="presence-toggle"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
            </div>

            <Separator />

            <Button onClick={simulateRemoteUser} className="w-full">
              <Users className="w-4 h-4 mr-2" />
              Add Remote User
            </Button>

            <Separator />

            <div className="space-y-2">
              <h3 className="font-medium text-sm">Active Users</h3>
              <div className="space-y-2">
                {activeUsers.map((user) => (
                  <div key={user.userId} className="flex items-center gap-2">
                    <UserPresenceIndicator user={user} size="sm" />
                    <span className="text-sm">{user.user?.name || 'Unknown'}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <MousePointer className="w-3 h-3" />
                <span>Move mouse to see cursor tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <Type className="w-3 h-3" />
                <span>Select text to see selection highlight</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Area */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Interactive Demo Area</CardTitle>
            <CardDescription>
              Move your mouse and select text to see collaboration features in action
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              ref={containerRef}
              className="relative border-2 border-dashed rounded-lg p-8 min-h-[500px] bg-muted/20"
            >
              <div ref={contentRef} className="prose dark:prose-invert max-w-none">
                <h2>Welcome to the Collaboration Demo</h2>
                <p>
                  This is a demonstration of the real-time collaboration system. Move your
                  mouse around this area to see cursor tracking in action. Select text to
                  see selection highlights.
                </p>
                <p>
                  Click the "Add Remote User" button to simulate other users joining the
                  session. You'll see their cursors moving around with their names attached.
                </p>
                <h3>Features Demonstrated</h3>
                <ul>
                  <li>
                    <strong>Remote Cursors:</strong> See where other users are pointing in
                    real-time with smooth animations
                  </li>
                  <li>
                    <strong>Selection Highlights:</strong> View what text other users have
                    selected with color-coded overlays
                  </li>
                  <li>
                    <strong>Presence Indicators:</strong> Check online/idle/offline status
                    with animated dots
                  </li>
                  <li>
                    <strong>Throttled Updates:</strong> Efficient broadcasting at 100ms
                    intervals for optimal performance
                  </li>
                  <li>
                    <strong>Idle Detection:</strong> Users automatically marked as idle after
                    10 seconds of inactivity
                  </li>
                </ul>
                <p>
                  Try selecting different parts of this text to see how selection tracking
                  works. The system automatically detects text selections and broadcasts them
                  to other users with your user color.
                </p>
              </div>

              {/* Collaboration Overlays */}
              {enabled && (
                <>
                  <RemoteSelection
                    activeUsers={activeUsers}
                    localUserId={currentUserId}
                  />
                  <RemoteCursors
                    activeUsers={activeUsers}
                    localUserId={currentUserId}
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
