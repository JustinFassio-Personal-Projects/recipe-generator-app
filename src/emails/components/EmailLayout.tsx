import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
  tenantName?: string;
  tenantLogo?: string;
  unsubscribeUrl?: string;
}

export const EmailLayout = ({
  preview,
  children,
  tenantName = 'Recipe Generator',
  tenantLogo,
  unsubscribeUrl,
}: EmailLayoutProps) => {
  const baseUrl = process.env.FRONTEND_URL || 'https://recipegenerator.app';

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            {tenantLogo ? (
              <Img
                src={tenantLogo}
                width="150"
                height="50"
                alt={tenantName}
                style={logo}
              />
            ) : (
              <Heading style={logoText}>{tenantName}</Heading>
            )}
          </Section>

          {/* Main Content */}
          <Section style={content}>{children}</Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} {tenantName}. All rights reserved.
            </Text>
            <Text style={footerText}>
              <Link href={`${baseUrl}/about`} style={footerLink}>
                About Us
              </Link>
              {' · '}
              <Link href={`${baseUrl}/privacy`} style={footerLink}>
                Privacy Policy
              </Link>
              {' · '}
              <Link href={`${baseUrl}/terms`} style={footerLink}>
                Terms
              </Link>
            </Text>
            {unsubscribeUrl && (
              <Text style={footerText}>
                <Link href={unsubscribeUrl} style={unsubscribeLink}>
                  Unsubscribe from these emails
                </Link>
              </Text>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '24px',
  textAlign: 'center' as const,
  borderBottom: '1px solid #e6ebf1',
};

const logo = {
  margin: '0 auto',
};

const logoText = {
  color: '#6b4423',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  textAlign: 'center' as const,
};

const content = {
  padding: '24px',
};

const footer = {
  padding: '24px',
  borderTop: '1px solid #e6ebf1',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '8px 0',
};

const footerLink = {
  color: '#6772e5',
  textDecoration: 'none',
};

const unsubscribeLink = {
  color: '#8898aa',
  textDecoration: 'underline',
};

export default EmailLayout;
