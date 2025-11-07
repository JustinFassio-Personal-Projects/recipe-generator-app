import { useState } from 'react';
import { Share2, Check, Link2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthProvider';
import { recipeApi } from '@/lib/api';
import { trackShareClick } from '@/lib/analytics/share-tracking';
import { buildRecipeUrl } from '@/utils/meta-tags';
import type { Recipe, PublicRecipe } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ShareButtonProps {
  recipe: Recipe | PublicRecipe;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  className?: string;
  onShareSuccess?: () => void;
}

export function ShareButton({
  recipe,
  variant = 'outline',
  size = 'sm',
  showLabel = true,
  className = '',
  onShareSuccess,
}: ShareButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showPrivacyWarning, setShowPrivacyWarning] = useState(false);
  const [isTogglingPublic, setIsTogglingPublic] = useState(false);

  // Check if user owns this recipe
  const isOwner = user?.id === recipe.user_id;
  const isPublic = recipe.is_public;

  /**
   * Generate share URL with tracking parameters
   */
  const generateShareUrl = (): string => {
    return buildRecipeUrl(recipe.id, {
      shared: true,
      ref: user?.id,
    });
  };

  /**
   * Copy link to clipboard
   */
  const copyToClipboard = async (url: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  };

  /**
   * Generate enhanced share text with emojis and metadata
   */
  const generateShareText = (): string => {
    const parts = ['🍳 Check out this recipe:', recipe.title, ''];

    // Add recipe metadata
    const metadata = [];
    if (recipe.ingredients?.length) {
      metadata.push(`✨ ${recipe.ingredients.length} ingredients`);
    }
    if (recipe.cooking_time) {
      metadata.push(`⏱️ ${recipe.cooking_time} min`);
    }
    if (recipe.difficulty) {
      const difficultyEmoji =
        recipe.difficulty.toLowerCase() === 'easy'
          ? '👍'
          : recipe.difficulty.toLowerCase() === 'medium'
            ? '👨‍🍳'
            : '⭐';
      metadata.push(`${difficultyEmoji} ${recipe.difficulty} difficulty`);
    }

    if (metadata.length > 0) {
      parts.push(metadata.join(' | '));
      parts.push('');
    }

    // Add description if available (truncated)
    if (recipe.description) {
      const truncated =
        recipe.description.length > 100
          ? recipe.description.substring(0, 100) + '...'
          : recipe.description;
      parts.push(truncated);
      parts.push('');
    }

    parts.push('Created with Recipe Generator 🍽️');

    return parts.join('\n');
  };

  /**
   * Try native share API (mobile)
   */
  const tryNativeShare = async (url: string): Promise<boolean> => {
    if (!navigator.share) {
      return false;
    }

    try {
      await navigator.share({
        title: `🍳 ${recipe.title}`,
        text: generateShareText(),
        url,
      });

      trackShareClick({
        recipe_id: recipe.id,
        method: 'native_share',
        has_ref: !!user?.id,
      });

      return true;
    } catch (error) {
      // User cancelled or share failed
      if ((error as Error).name !== 'AbortError') {
        console.error('Native share failed:', error);
      }
      return false;
    }
  };

  /**
   * Handle share button click
   */
  const handleShare = async () => {
    // If recipe is private and user is owner, show warning
    if (!isPublic && isOwner) {
      setShowPrivacyWarning(true);
      return;
    }

    // Generate share URL
    const shareUrl = generateShareUrl();

    // Try native share first (mobile)
    const nativeShareSuccess = await tryNativeShare(shareUrl);
    if (nativeShareSuccess) {
      onShareSuccess?.();
      return;
    }

    // Fallback: Copy to clipboard
    const copySuccess = await copyToClipboard(shareUrl);
    if (copySuccess) {
      setCopied(true);
      toast({
        title: 'Link copied!',
        description: 'Share this recipe with your friends',
      });

      trackShareClick({
        recipe_id: recipe.id,
        method: 'clipboard',
        has_ref: !!user?.id,
      });

      onShareSuccess?.();

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast({
        title: 'Failed to copy',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  /**
   * Make recipe public and then share
   */
  const handleMakePublicAndShare = async () => {
    setIsTogglingPublic(true);
    try {
      await recipeApi.toggleRecipePublic(recipe.id, true);

      toast({
        title: 'Recipe is now public',
        description: 'Anyone with the link can view this recipe',
      });

      // Close the warning dialog
      setShowPrivacyWarning(false);

      // Now share the recipe
      const shareUrl = generateShareUrl();
      const nativeShareSuccess = await tryNativeShare(shareUrl);

      if (!nativeShareSuccess) {
        const copySuccess = await copyToClipboard(shareUrl);
        if (copySuccess) {
          setCopied(true);
          toast({
            title: 'Link copied!',
            description: 'Share this recipe with your friends',
          });

          trackShareClick({
            recipe_id: recipe.id,
            method: 'clipboard',
            has_ref: !!user?.id,
          });

          setTimeout(() => setCopied(false), 2000);
        }
      }

      onShareSuccess?.();
    } catch (error) {
      console.error('Failed to make recipe public:', error);
      toast({
        title: 'Error',
        description: 'Failed to make recipe public',
        variant: 'destructive',
      });
    } finally {
      setIsTogglingPublic(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleShare}
        className={className}
        disabled={copied}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            {showLabel && <span className="ml-2">Copied!</span>}
          </>
        ) : (
          <>
            {isPublic ? (
              <Share2 className="h-4 w-4" />
            ) : (
              <Link2 className="h-4 w-4" />
            )}
            {showLabel && (
              <span className="ml-2">{isPublic ? 'Share' : 'Share'}</span>
            )}
          </>
        )}
      </Button>

      {/* Privacy Warning Dialog */}
      <AlertDialog
        open={showPrivacyWarning}
        onOpenChange={setShowPrivacyWarning}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Private Recipe
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                This recipe is currently <strong>private</strong>. To share it,
                you need to make it public first.
              </p>
              <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 text-sm text-orange-800">
                <p className="font-medium mb-1">What this means:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Anyone with the link can view this recipe</li>
                  <li>It will appear on the Explore page for all users</li>
                  <li>Recipients won't need an account to view it</li>
                </ul>
              </div>
              <p className="text-sm">
                Would you like to make this recipe public and share it?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMakePublicAndShare}
              disabled={isTogglingPublic}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isTogglingPublic ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Making Public...
                </>
              ) : (
                'Make Public & Share'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
