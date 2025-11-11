import { Heading, Hr, Link, Section, Text } from '@react-email/components';
import { Button } from './components/Button';
import { EmailLayout } from './components/EmailLayout';

interface WelcomeEmailProps {
  userName: string;
  verificationLink?: string;
  tenantName?: string;
  tenantLogo?: string;
}

export const WelcomeEmail = ({
  userName = 'there',
  verificationLink,
  tenantName = 'Recipe Generator',
  tenantLogo,
}: WelcomeEmailProps) => {
  const baseUrl = process.env.FRONTEND_URL || 'https://recipegenerator.app';

  return (
    <EmailLayout
      preview={`Welcome to ${tenantName}! Start creating amazing recipes.`}
      tenantName={tenantName}
      tenantLogo={tenantLogo}
    >
      <Heading style={heading}>Welcome, {userName}! 🎉</Heading>

      <Text style={paragraph}>
        We're thrilled to have you join {tenantName}. Get ready to discover,
        create, and share incredible recipes with our community.
      </Text>

      {verificationLink && (
        <>
          <Text style={paragraph}>
            First, let's verify your email address to get you started:
          </Text>
          <Button href={verificationLink}>Verify Email Address</Button>
        </>
      )}

      <Hr style={hr} />

      <Heading as="h2" style={subheading}>
        What's Next?
      </Heading>

      <Section style={feature}>
        <Text style={featureTitle}>🍳 Create Your First Recipe</Text>
        <Text style={featureText}>
          Use our AI-powered chat to generate personalized recipes, or add your
          own family favorites.
        </Text>
      </Section>

      <Section style={feature}>
        <Text style={featureTitle}>🛒 Build Your Shopping List</Text>
        <Text style={featureText}>
          Add ingredients to your virtual kitchen and get smart recipe
          suggestions based on what you have.
        </Text>
      </Section>

      <Section style={feature}>
        <Text style={featureTitle}>📱 Explore Recipes</Text>
        <Text style={featureText}>
          Browse our collection of recipes, filter by dietary preferences, and
          save your favorites.
        </Text>
      </Section>

      <Button href={`${baseUrl}/recipes`}>Get Started</Button>

      <Hr style={hr} />

      <Text style={paragraph}>
        Need help? Check out our{' '}
        <Link href={`${baseUrl}/help`} style={link}>
          Help Center
        </Link>{' '}
        or reply to this email.
      </Text>

      <Text style={signature}>
        Happy cooking!
        <br />
        The {tenantName} Team
      </Text>
    </EmailLayout>
  );
};

// Styles
const heading = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#1a1a1a',
  margin: '0 0 16px 0',
  lineHeight: '40px',
};

const subheading = {
  fontSize: '24px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '24px 0 16px 0',
  lineHeight: '32px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#525252',
  margin: '16px 0',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
};

const feature = {
  marginBottom: '24px',
};

const featureTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 8px 0',
};

const featureText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#666666',
  margin: '0',
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

export default WelcomeEmail;
