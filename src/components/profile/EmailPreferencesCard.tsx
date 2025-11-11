import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Save } from 'lucide-react';
import {
  getEmailPreferences,
  updateEmailPreferences,
  unsubscribeAll,
  type EmailPreferences,
} from '@/lib/api/email-api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function EmailPreferencesCard() {
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unsubscribing, setUnsubscribing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const { data, error } = await getEmailPreferences();

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to load email preferences.',
          variant: 'destructive',
        });
        return;
      }

      setPreferences(data);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof EmailPreferences, value: boolean) => {
    if (!preferences) return;

    setPreferences({
      ...preferences,
      [key]: value,
    });
  };

  const handleSave = async () => {
    if (!preferences) return;

    setSaving(true);
    try {
      const { error } = await updateEmailPreferences({
        welcome_emails: preferences.welcome_emails,
        newsletters: preferences.newsletters,
        recipe_notifications: preferences.recipe_notifications,
        cooking_reminders: preferences.cooking_reminders,
        subscription_updates: preferences.subscription_updates,
        admin_notifications: preferences.admin_notifications,
      });

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to update email preferences.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Email preferences updated successfully.',
        variant: 'success',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUnsubscribeAll = async () => {
    setUnsubscribing(true);
    try {
      const { error } = await unsubscribeAll();

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to unsubscribe from all emails.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description:
          'Unsubscribed from all marketing emails. You will still receive important account updates.',
        variant: 'success',
      });

      // Reload preferences
      await loadPreferences();
    } finally {
      setUnsubscribing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Preferences
          </CardTitle>
          <CardDescription>Manage your email notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Preferences
          </CardTitle>
          <CardDescription>Manage your email notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to load email preferences. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Preferences
        </CardTitle>
        <CardDescription>
          Choose which emails you'd like to receive from us
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Transactional Emails */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-1">Transactional Emails</h3>
            <p className="text-xs text-muted-foreground">
              Important updates about your account and subscriptions
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="welcome_emails" className="flex flex-col gap-1">
              <span className="font-medium">Welcome Emails</span>
              <span className="text-xs font-normal text-muted-foreground">
                Onboarding emails when you first sign up
              </span>
            </Label>
            <Switch
              id="welcome_emails"
              checked={preferences.welcome_emails}
              onCheckedChange={(checked) =>
                handleToggle('welcome_emails', checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label
              htmlFor="subscription_updates"
              className="flex flex-col gap-1"
            >
              <span className="font-medium">Subscription Updates</span>
              <span className="text-xs font-normal text-muted-foreground">
                Billing and subscription changes
              </span>
            </Label>
            <Switch
              id="subscription_updates"
              checked={preferences.subscription_updates}
              onCheckedChange={(checked) =>
                handleToggle('subscription_updates', checked)
              }
            />
          </div>
        </div>

        <div className="border-t border-gray-200 my-4" />

        {/* Marketing Emails */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-1">Marketing Emails</h3>
            <p className="text-xs text-muted-foreground">
              Newsletters, tips, and new content notifications
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="newsletters" className="flex flex-col gap-1">
              <span className="font-medium">Weekly Newsletter</span>
              <span className="text-xs font-normal text-muted-foreground">
                Recipe highlights, cooking tips, and community updates
              </span>
            </Label>
            <Switch
              id="newsletters"
              checked={preferences.newsletters}
              onCheckedChange={(checked) =>
                handleToggle('newsletters', checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label
              htmlFor="recipe_notifications"
              className="flex flex-col gap-1"
            >
              <span className="font-medium">New Recipe Alerts</span>
              <span className="text-xs font-normal text-muted-foreground">
                Get notified when new recipes are published
              </span>
            </Label>
            <Switch
              id="recipe_notifications"
              checked={preferences.recipe_notifications}
              onCheckedChange={(checked) =>
                handleToggle('recipe_notifications', checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="cooking_reminders" className="flex flex-col gap-1">
              <span className="font-medium">Cooking Reminders</span>
              <span className="text-xs font-normal text-muted-foreground">
                Reminders for recipes you've planned to make
              </span>
            </Label>
            <Switch
              id="cooking_reminders"
              checked={preferences.cooking_reminders}
              onCheckedChange={(checked) =>
                handleToggle('cooking_reminders', checked)
              }
            />
          </div>
        </div>

        <div className="border-t border-gray-200 my-4" />

        {/* Admin Notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="admin_notifications"
              className="flex flex-col gap-1"
            >
              <span className="font-medium">Admin Notifications</span>
              <span className="text-xs font-normal text-muted-foreground">
                System alerts and admin announcements (admins only)
              </span>
            </Label>
            <Switch
              id="admin_notifications"
              checked={preferences.admin_notifications}
              onCheckedChange={(checked) =>
                handleToggle('admin_notifications', checked)
              }
            />
          </div>
        </div>

        <div className="border-t border-gray-200 my-4" />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </>
            )}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={unsubscribing}>
                Unsubscribe from All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Unsubscribe from all emails?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will unsubscribe you from all marketing emails
                  (newsletters, recipe alerts, and reminders). You will still
                  receive important transactional emails about your account and
                  subscription.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleUnsubscribeAll}>
                  {unsubscribing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Unsubscribing...
                    </>
                  ) : (
                    'Unsubscribe'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
