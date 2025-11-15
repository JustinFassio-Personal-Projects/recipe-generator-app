import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function NewsletterAdminPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateCampaign = async () => {
    if (!title || !message) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's tenant
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      // Create campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('newsletter_campaigns')
        .insert({
          title,
          content: { message },
          tenant_id: profile?.tenant_id,
          created_by: user.id,
          status: 'draft',
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Get eligible users for newsletter
      const { data: eligibleUsers, error: usersError } = await supabase.rpc(
        'get_users_for_email_type',
        {
          email_type_param: 'newsletter',
          tenant_id_param: profile?.tenant_id || null,
        }
      );

      if (usersError) throw usersError;

      const recipientCount = eligibleUsers?.length || 0;

      // Queue emails
      const queueItems = (eligibleUsers || []).map(
        (user: { user_id: string; email: string }) => ({
          type: 'newsletter',
          recipient_user_id: user.user_id,
          tenant_id: profile?.tenant_id,
          subject: title,
          template_data: { message },
          status: 'pending',
          scheduled_for: new Date().toISOString(),
        })
      );

      if (queueItems.length > 0) {
        const { error: queueError } = await supabase
          .from('email_queue')
          .insert(queueItems);

        if (queueError) throw queueError;
      }

      // Update campaign with recipient count
      await supabase
        .from('newsletter_campaigns')
        .update({
          recipients_count: recipientCount,
          status: 'scheduled',
        })
        .eq('id', campaign.id);

      toast({
        title: 'Success',
        description: `Newsletter queued for ${recipientCount} recipients`,
        variant: 'success',
      });

      // Reset form
      setTitle('');
      setMessage('');

      // Trigger newsletter sending via Edge Function
      const { error: sendError } = await supabase.functions.invoke(
        'send-newsletter',
        {
          body: { campaignId: campaign.id, batchSize: 50 },
        }
      );

      if (sendError) {
        console.error('Error sending newsletter:', sendError);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to create newsletter campaign',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Newsletter Campaign
          </CardTitle>
          <CardDescription>
            Create and send a newsletter to all subscribed users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Campaign Title / Subject</Label>
            <Input
              id="title"
              placeholder="e.g., Weekly Recipe Roundup"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter your newsletter message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={10}
            />
            <p className="text-xs text-muted-foreground">
              This is a simplified newsletter interface. For more advanced
              features like featured recipes and custom sections, use the
              database directly or extend this interface.
            </p>
          </div>

          <Button
            onClick={handleCreateCampaign}
            disabled={loading || !title || !message}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Create & Send Campaign
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
