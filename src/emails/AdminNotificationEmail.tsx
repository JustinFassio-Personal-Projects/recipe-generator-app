import { Heading, Hr, Section, Text } from '@react-email/components';
import { Button } from './components/Button';
import { EmailLayout } from './components/EmailLayout';

interface AdminNotificationEmailProps {
  alertType:
    | 'error'
    | 'warning'
    | 'info'
    | 'new_user'
    | 'new_recipe'
    | 'payment_issue'
    | 'security';
  message: string;
  details?: Record<string, unknown>;
  actionUrl?: string;
  tenantName?: string;
  tenantLogo?: string;
}

export const AdminNotificationEmail = ({
  alertType,
  message,
  details,
  actionUrl,
  tenantName = 'Recipe Generator',
  tenantLogo,
}: AdminNotificationEmailProps) => {
  const { title, emoji, severity } = getAlertContent(alertType);

  return (
    <EmailLayout
      preview={`${tenantName} Admin: ${title}`}
      tenantName={tenantName}
      tenantLogo={tenantLogo}
    >
      <Section style={alertBanner(severity)}>
        <Text style={alertTitle}>
          {emoji} {title}
        </Text>
      </Section>

      <Heading style={heading}>Admin Notification</Heading>

      <Text style={paragraph}>{message}</Text>

      {/* Details Section */}
      {details && Object.keys(details).length > 0 && (
        <>
          <Heading as="h2" style={subheading}>
            Details
          </Heading>

          <Section style={detailsBox}>
            {Object.entries(details).map(([key, value]) => (
              <Text key={key} style={detailRow}>
                <strong>{formatKey(key)}:</strong> {formatValue(value)}
              </Text>
            ))}
          </Section>

          {/* Raw JSON for debugging */}
          <Section style={codeSection}>
            <Text style={code}>{JSON.stringify(details, null, 2)}</Text>
          </Section>
        </>
      )}

      {actionUrl && (
        <>
          <Hr style={hr} />
          <Button href={actionUrl}>Take Action</Button>
        </>
      )}

      <Hr style={hr} />

      <Text style={footerText}>
        This is an automated notification sent to system administrators. If you
        believe this is an error, please check your notification settings.
      </Text>

      <Text style={timestamp}>
        Sent: {new Date().toLocaleString('en-US', { timeZone: 'UTC' })} UTC
      </Text>
    </EmailLayout>
  );
};

function getAlertContent(alertType: string) {
  switch (alertType) {
    case 'error':
      return { title: 'System Error', emoji: '🚨', severity: 'error' };
    case 'warning':
      return { title: 'Warning', emoji: '⚠️', severity: 'warning' };
    case 'info':
      return { title: 'Information', emoji: 'ℹ️', severity: 'info' };
    case 'new_user':
      return { title: 'New User Signup', emoji: '👤', severity: 'info' };
    case 'new_recipe':
      return { title: 'New Recipe Created', emoji: '🍳', severity: 'info' };
    case 'payment_issue':
      return { title: 'Payment Issue', emoji: '💳', severity: 'warning' };
    case 'security':
      return {
        title: 'Security Alert',
        emoji: '🔒',
        severity: 'error',
      };
    default:
      return { title: 'Notification', emoji: '📬', severity: 'info' };
  }
}

function formatKey(key: string): string {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatValue(value: unknown): string {
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  return String(value);
}

// Styles
const alertBanner = (severity: string) => ({
  backgroundColor:
    severity === 'error'
      ? '#fee'
      : severity === 'warning'
        ? '#fff4e6'
        : '#e6f4ff',
  border: `2px solid ${
    severity === 'error'
      ? '#dc2626'
      : severity === 'warning'
        ? '#f59e0b'
        : '#3b82f6'
  }`,
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '24px',
});

const alertTitle = {
  fontSize: '18px',
  fontWeight: '600',
  margin: '0',
  color: '#1a1a1a',
};

const heading = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#1a1a1a',
  margin: '0 0 16px 0',
  lineHeight: '36px',
};

const subheading = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '24px 0 12px 0',
  lineHeight: '28px',
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
  padding: '16px',
  margin: '16px 0',
};

const detailRow = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#525252',
  margin: '8px 0',
};

const codeSection = {
  margin: '16px 0',
};

const code = {
  backgroundColor: '#1a1a1a',
  color: '#f6f9fc',
  fontFamily: 'monospace',
  fontSize: '12px',
  padding: '16px',
  borderRadius: '4px',
  overflowX: 'auto' as const,
  display: 'block',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
};

const footerText = {
  fontSize: '12px',
  lineHeight: '16px',
  color: '#8898aa',
  margin: '16px 0',
};

const timestamp = {
  fontSize: '11px',
  color: '#8898aa',
  fontFamily: 'monospace',
  margin: '8px 0 0 0',
};

export default AdminNotificationEmail;
