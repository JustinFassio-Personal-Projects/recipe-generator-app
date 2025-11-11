import { Heading, Hr, Text } from '@react-email/components';
import { Button } from './components/Button';
import { EmailLayout } from './components/EmailLayout';
import { RecipeCard } from './components/RecipeCard';

interface RecipeNotificationEmailProps {
  userName: string;
  recipe: {
    title: string;
    description: string;
    imageUrl?: string;
    author: string;
    viewUrl: string;
    cookingTime?: string;
    difficulty?: string;
  };
  tenantName?: string;
  tenantLogo?: string;
  unsubscribeUrl: string;
}

export const RecipeNotificationEmail = ({
  userName = 'there',
  recipe,
  tenantName = 'Recipe Generator',
  tenantLogo,
  unsubscribeUrl,
}: RecipeNotificationEmailProps) => {
  return (
    <EmailLayout
      preview={`New recipe: ${recipe.title}`}
      tenantName={tenantName}
      tenantLogo={tenantLogo}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Heading style={heading}>New Recipe Alert! 🍽️</Heading>

      <Text style={paragraph}>
        Hi {userName}, a new recipe has been added that we think you'll love!
      </Text>

      <RecipeCard
        title={recipe.title}
        description={recipe.description}
        imageUrl={recipe.imageUrl}
        author={recipe.author}
        viewUrl={recipe.viewUrl}
        cookingTime={recipe.cookingTime}
        difficulty={recipe.difficulty}
      />

      <Button href={recipe.viewUrl}>View Full Recipe</Button>

      <Hr style={hr} />

      <Text style={paragraph}>
        Why not give it a try this week? We'd love to hear what you think!
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

const signature = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#525252',
  margin: '24px 0 0 0',
};

export default RecipeNotificationEmail;
