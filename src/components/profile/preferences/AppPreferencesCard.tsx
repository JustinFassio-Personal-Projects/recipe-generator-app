import { useState } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell } from 'lucide-react';

export function AppPreferencesCard() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(
    profile?.show_welcome_popup ?? true
  );

  const handleSavePreferences = async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          show_welcome_popup: showWelcomePopup,
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();

      toast({
        title: 'Preferences Saved',
        description: 'Your app preferences have been updated.',
      });
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to save preferences. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="card-title">App Preferences</h2>
        </div>
        <p className="text-base-content/60 text-sm">
          Customize how the app works for you
        </p>

        <div className="divider"></div>

        <div className="space-y-4">
          {/* Welcome Popup Toggle */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Label htmlFor="welcome-popup" className="text-base font-medium">
                Show welcome popup
              </Label>
              <p className="text-base-content/60 mt-1 text-sm">
                Display helpful navigation options when you open the app
              </p>
            </div>
            <Switch
              id="welcome-popup"
              checked={showWelcomePopup}
              onCheckedChange={setShowWelcomePopup}
              disabled={loading}
            />
          </div>

          {/* Visit Count Info (Read-only) */}
          <div className="rounded-lg bg-base-200 p-4">
            <p className="text-sm text-base-content/80">
              <span className="font-medium">Total visits:</span>{' '}
              {profile?.visit_count || 0}
            </p>
            {profile?.last_visit_at && (
              <p className="text-sm text-base-content/60 mt-1">
                Last visit:{' '}
                {new Date(profile.last_visit_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="card-actions mt-4 justify-end">
          <Button
            onClick={handleSavePreferences}
            disabled={
              loading || showWelcomePopup === profile?.show_welcome_popup
            }
            className="btn-primary"
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
