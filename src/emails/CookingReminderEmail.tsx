import { Heading, Hr, Section, Text } from '@react-email/components';
import { Button } from './components/Button';
import { EmailLayout } from './components/EmailLayout';
import { RecipeCard } from './components/RecipeCard';

interface CookingReminderEmailProps {
  userName: string;
  recipe: {
    title: string;
    imageUrl?: string;
    viewUrl: string;
    cookingTime?: string;
  };
  prepTips?: string[];
  tenantName?: string;
  tenantLogo?: string;
  unsubscribeUrl: string;
}

export const CookingReminderEmail = ({
  userName = 'there',
  recipe,
  prepTips = [],
  tenantName = 'Recipe Generator',
  tenantLogo,
  unsubscribeUrl,
}: CookingReminderEmailProps) => {
  return (
    <EmailLayout
      preview={`Time to cook: ${recipe.title}`}
      tenantName={tenantName}
      tenantLogo={tenantLogo}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Heading style={heading}>Time to Cook! ⏰</Heading>

      <Text style={paragraph}>
        Hi {userName}, just a friendly reminder that you planned to make this
        recipe today:
      </Text>

      <RecipeCard
        title={recipe.title}
        imageUrl={recipe.imageUrl}
        viewUrl={recipe.viewUrl}
        cookingTime={recipe.cookingTime}
      />

      {prepTips && prepTips.length > 0 && (
        <>
          <Hr style={hr} />

          <Heading as="h2" style={subheading}>
            📝 Prep Tips
          </Heading>

          {prepTips.map((tip, index) => (
            <Section key={index} style={tipSection}>
              <Text style={tipText}>• {tip}</Text>
            </Section>
          ))}
        </>
      )}

      <Button href={recipe.viewUrl}>View Recipe</Button>

      <Hr style={hr} />

      <Text style={paragraph}>
        Have all your ingredients ready? Let's get cooking! Don't forget to rate
        the recipe after you try it.
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

const tipSection = {
  marginBottom: '12px',
};

const tipText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#666666',
  margin: '0',
};

const signature = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#525252',
  margin: '24px 0 0 0',
};

export default CookingReminderEmail;
