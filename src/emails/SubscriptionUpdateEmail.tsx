import { Heading, Hr, Link, Section, Text } from '@react-email/components';
import { Button } from './components/Button';
import { EmailLayout } from './components/EmailLayout';

interface SubscriptionUpdateEmailProps {
  userName: string;
  updateType:
    | 'subscription_created'
    | 'subscription_updated'
    | 'subscription_cancelled'
    | 'payment_succeeded'
    | 'payment_failed'
    | 'trial_ending';
  subscriptionDetails: {
    plan?: string;
    amount?: string;
    currency?: string;
    interval?: string;
    nextBillingDate?: string;
    trialEndsAt?: string;
  };
  manageUrl: string;
  tenantName?: string;
  tenantLogo?: string;
}

export const SubscriptionUpdateEmail = ({
  userName = 'there',
  updateType,
  subscriptionDetails,
  manageUrl,
  tenantName = 'Recipe Generator',
  tenantLogo,
}: SubscriptionUpdateEmailProps) => {
  const { title, message, emoji } = getUpdateContent(updateType);

  return (
    <EmailLayout
      preview={`${tenantName} - ${title}`}
      tenantName={tenantName}
      tenantLogo={tenantLogo}
    >
      <Heading style={heading}>
        {emoji} {title}
      </Heading>

      <Text style={paragraph}>Hi {userName},</Text>

      <Text style={paragraph}>{message}</Text>

      {/* Subscription Details */}
      <Section style={detailsBox}>
        {subscriptionDetails.plan && (
          <Text style={detailRow}>
            <strong>Plan:</strong> {subscriptionDetails.plan}
          </Text>
        )}
        {subscriptionDetails.amount && subscriptionDetails.currency && (
          <Text style={detailRow}>
            <strong>Amount:</strong> {subscriptionDetails.currency}
            {subscriptionDetails.amount}
            {subscriptionDetails.interval &&
              ` per ${subscriptionDetails.interval}`}
          </Text>
        )}
        {subscriptionDetails.nextBillingDate && (
          <Text style={detailRow}>
            <strong>Next Billing Date:</strong>{' '}
            {subscriptionDetails.nextBillingDate}
          </Text>
        )}
        {subscriptionDetails.trialEndsAt && (
          <Text style={detailRow}>
            <strong>Trial Ends:</strong> {subscriptionDetails.trialEndsAt}
          </Text>
        )}
      </Section>

      <Button href={manageUrl}>Manage Subscription</Button>

      <Hr style={hr} />

      <Text style={helpText}>
        Questions about your subscription? Check our{' '}
        <Link
          href={`${process.env.FRONTEND_URL || 'https://recipegenerator.app'}/help/billing`}
          style={link}
        >
          Billing FAQ
        </Link>{' '}
        or reply to this email for support.
      </Text>

      <Text style={signature}>
        Thank you for being a valued member!
        <br />
        The {tenantName} Team
      </Text>
    </EmailLayout>
  );
};

function getUpdateContent(updateType: string) {
  switch (updateType) {
    case 'subscription_created':
      return {
        title: 'Welcome to Premium!',
        message:
          "Your subscription has been activated. You now have access to all premium features. Let's make the most of your membership!",
        emoji: '🎉',
      };
    case 'subscription_updated':
      return {
        title: 'Subscription Updated',
        message:
          'Your subscription has been successfully updated. The changes will take effect immediately.',
        emoji: '✅',
      };
    case 'subscription_cancelled':
      return {
        title: 'Subscription Cancelled',
        message:
          "We're sorry to see you go. Your subscription has been cancelled and you'll have access to premium features until the end of your billing period.",
        emoji: '👋',
      };
    case 'payment_succeeded':
      return {
        title: 'Payment Received',
        message:
          'Thank you! Your payment has been processed successfully. Your subscription continues uninterrupted.',
        emoji: '✅',
      };
    case 'payment_failed':
      return {
        title: 'Payment Failed',
        message:
          'We were unable to process your payment. Please update your payment method to continue enjoying premium features.',
        emoji: '⚠️',
      };
    case 'trial_ending':
      return {
        title: 'Trial Ending Soon',
        message:
          "Your free trial is ending soon. To continue enjoying premium features, you'll need to subscribe. We hope you've enjoyed your trial!",
        emoji: '⏰',
      };
    default:
      return {
        title: 'Subscription Update',
        message: 'There has been an update to your subscription.',
        emoji: '📬',
      };
  }
}

// Styles
const heading = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#1a1a1a',
  margin: '0 0 16px 0',
  lineHeight: '40px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#525252',
  margin: '16px 0',
};

const detailsBox = {
  backgroundColor: '#f6f9fc',
  border: '1px solid #e6ebf1',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const detailRow = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#525252',
  margin: '8px 0',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
};

const helpText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#666666',
  margin: '16px 0',
};

const link = {
  color: '#6772e5',
  textDecoration: 'underline',
};

const signature = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#525252',
  margin: '24px 0 0 0',
};

export default SubscriptionUpdateEmail;
