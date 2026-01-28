'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Share2,
  Copy,
  Mail,
  Link as LinkIcon,
  Check,
  Users,
  Eye,
  Edit,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShareDialogProps {
  documentId: string;
  documentTitle: string;
}

export function ShareDialog({ documentId, documentTitle }: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [sharedUsers, setSharedUsers] = useState<
    Array<{ email: string; permission: 'view' | 'edit' }>
  >([]);

  const shareUrl = `${window.location.origin}/documents/${documentId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShareByEmail = () => {
    if (!email) return;

    // Add user to shared list
    setSharedUsers([...sharedUsers, { email, permission }]);
    setEmail('');

    // In a real implementation, this would call the API
    console.log('Sharing with:', email, 'permission:', permission);
  };

  const handleRemoveUser = (emailToRemove: string) => {
    setSharedUsers(sharedUsers.filter((user) => user.email !== emailToRemove));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-1" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share "{documentTitle}"</DialogTitle>
          <DialogDescription>
            Share this document with others via link or email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Copy Link Section */}
          <div>
            <label className="text-sm font-medium mb-2 block">Share Link</label>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                className={cn(copied && 'bg-green-50 dark:bg-green-900/20')}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Invite by Email Section */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Invite by Email
            </label>
            <div className="flex gap-2 mb-3">
              <Input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleShareByEmail();
                }}
                className="flex-1"
              />
              <div className="flex gap-1">
                <Button
                  variant={permission === 'view' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPermission('view')}
                  title="View only"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant={permission === 'edit' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPermission('edit')}
                  title="Can edit"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
              <Button onClick={handleShareByEmail} disabled={!email}>
                <Mail className="w-4 h-4" />
              </Button>
            </div>

            {/* Permission Legend */}
            <div className="flex gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>View only</span>
              </div>
              <div className="flex items-center gap-1">
                <Edit className="w-3 h-3" />
                <span>Can edit</span>
              </div>
            </div>
          </div>

          {/* Shared Users List */}
          {sharedUsers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-muted-foreground" />
                <label className="text-sm font-medium">
                  Shared with ({sharedUsers.length})
                </label>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {sharedUsers.map((user, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-md border"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {user.email[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.permission === 'view' ? 'View only' : 'Can edit'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveUser(user.email)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Link Sharing Options */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-start gap-2">
              <LinkIcon className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Anyone with the link</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Anyone who has this link can view this document
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
