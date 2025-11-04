import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useWelcomePopup,
  type WelcomeFlowContext,
} from '@/hooks/useWelcomePopup';
import { FirstTimeWelcome } from './FirstTimeWelcome';
import { WelcomeBackFlow } from './WelcomeBackFlow';
import { QuickNavigationFlow } from './QuickNavigationFlow';
import { ChatRecipeWelcome } from './ChatRecipeWelcome';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface WelcomeDialogProps {
  context?: WelcomeFlowContext;
  onChefSelected?: (chefId: string) => void;
}

export function WelcomeDialog({
  context = 'general',
  onChefSelected,
}: WelcomeDialogProps) {
  const {
    shouldShow,
    flowType,
    isLoading,
    dismissPopup,
    disablePopupPermanently,
  } = useWelcomePopup(context);

  // Don't render anything while loading or if shouldn't show
  if (isLoading || !shouldShow || !flowType) {
    return null;
  }

  // Determine if clicking outside should close the dialog
  // First-time users: NO (guide them to make a choice)
  // Returning/Quick nav: YES (they know their way around)
  const onInteractOutside = (e: Event) => {
    if (flowType === 'first-time') {
      e.preventDefault();
    }
  };

  // Determine if escape key should close the dialog
  // All flows: YES (accessibility)
  const onEscapeKeyDown = () => {
    dismissPopup();
  };

  return (
    <Dialog open={shouldShow} onOpenChange={(open) => !open && dismissPopup()}>
      <DialogContent
        className="max-w-md max-h-[90vh] overflow-y-auto !block"
        onInteractOutside={onInteractOutside}
        onEscapeKeyDown={onEscapeKeyDown}
      >
        {/* Accessible title for screen readers */}
        <VisuallyHidden>
          <DialogTitle>
            {flowType === 'first-time' && 'Welcome to Recipe Generator'}
            {flowType === 'welcome-back' && 'Welcome Back'}
            {flowType === 'quick-nav' && 'Quick Navigation'}
            {flowType === 'chat-recipe' && 'Choose Your Cooking Guide'}
          </DialogTitle>
          <DialogDescription>
            {flowType === 'first-time' &&
              'Choose how you would like to get started'}
            {flowType === 'welcome-back' &&
              'Quick access to your recipes and tools'}
            {flowType === 'quick-nav' && 'Navigate to your favorite sections'}
            {flowType === 'chat-recipe' &&
              'Select a chef personality to guide your recipe creation'}
          </DialogDescription>
        </VisuallyHidden>

        {/* Render appropriate flow component */}
        {flowType === 'first-time' && (
          <FirstTimeWelcome
            onClose={dismissPopup}
            onDisablePermanently={disablePopupPermanently}
          />
        )}
        {flowType === 'welcome-back' && (
          <WelcomeBackFlow
            onClose={dismissPopup}
            onDisablePermanently={disablePopupPermanently}
          />
        )}
        {flowType === 'quick-nav' && (
          <QuickNavigationFlow
            onClose={dismissPopup}
            onDisablePermanently={disablePopupPermanently}
          />
        )}
        {flowType === 'chat-recipe' && (
          <ChatRecipeWelcome
            onClose={dismissPopup}
            onSelectChef={onChefSelected || (() => {})}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
