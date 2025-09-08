import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Copy, Check, Share2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ShareLinkProps {
  guideId: string;
  guideTitle: string;
  accessCode?: string;
  trigger?: React.ReactNode;
}

export const ShareLink: React.FC<ShareLinkProps> = ({
  guideId,
  guideTitle,
  accessCode,
  trigger
}) => {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Construct the share URL with access code if available
  const shareUrl = `${window.location.origin}/guide/${guideId}${accessCode ? `?access_code=${accessCode}` : ''}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Link copied!",
        description: "Share link has been copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: "Copy failed",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: guideTitle,
          text: `Check out this audio guide: ${guideTitle}`,
          url: shareUrl,
        });
        toast({
          title: "Shared successfully",
          description: "Guide link has been shared",
        });
      } catch (error) {
        console.error('Native share failed:', error);
        // Fallback to copy
        handleCopy();
      }
    } else {
      // Fallback to copy
      handleCopy();
    }
  };

  const DefaultTrigger = () => (
    <Button variant="outline" size="sm">
      <Share2 className="h-4 w-4 mr-2" />
      Share
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <DefaultTrigger />}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Audio Guide</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">{guideTitle}</h4>
            <p className="text-sm text-muted-foreground">
              Share this audio guide with others
              {accessCode && " using your personal access link"}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Input
              value={shareUrl}
              readOnly
              className="flex-1"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button
              type="button"
              size="sm"
              onClick={handleCopy}
              className="px-3"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleNativeShare}
              className="flex-1"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Link
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>

          {accessCode && (
            <Card className="p-3 bg-muted/50">
              <div className="text-sm">
                <strong>Access Code:</strong>
                <code className="ml-2 px-2 py-1 bg-background rounded text-primary">
                  {accessCode}
                </code>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                This link includes your personal access code for immediate access
              </p>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};