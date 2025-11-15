import { Heading, Hr, Section, Text } from '@react-email/components';
import { Button } from './components/Button';
import { EmailLayout } from './components/EmailLayout';
import { RecipeCard } from './components/RecipeCard';

interface Recipe {
  title: string;
  description: string;
  imageUrl?: string;
  author: string;
  viewUrl: string;
  cookingTime?: string;
  difficulty?: string;
}

interface Tip {
  title: string;
  content: string;
}

interface NewsletterEmailProps {
  userName: string;
  featuredRecipes: Recipe[];
  tips?: Tip[];
  tenantName?: string;
  tenantLogo?: string;
  unsubscribeUrl: string;
}

export const NewsletterEmail = ({
  userName = 'there',
  featuredRecipes = [],
  tips = [],
  tenantName = 'Recipe Generator',
  tenantLogo,
  unsubscribeUrl,
}: NewsletterEmailProps) => {
  const baseUrl = process.env.FRONTEND_URL || 'https://recipegenerator.app';
  const date = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <EmailLayout
      preview={`Your ${tenantName} Newsletter - ${date}`}
      tenantName={tenantName}
      tenantLogo={tenantLogo}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={dateText}>{date}</Text>

      <Heading style={heading}>
        Hi {userName}, here's what's cooking! 👨‍🍳
      </Heading>

      <Text style={paragraph}>
        Welcome to your weekly recipe roundup! We've curated the best recipes
        and tips from our community just for you.
      </Text>

      <Hr style={hr} />

      {/* Featured Recipes Section */}
      {featuredRecipes.length > 0 && (
        <>
          <Heading as="h2" style={sectionHeading}>
            🌟 Featured Recipes
          </Heading>

          {featuredRecipes.map((recipe, index) => (
            <RecipeCard
              key={index}
              title={recipe.title}
              description={recipe.description}
              imageUrl={recipe.imageUrl}
              author={recipe.author}
              viewUrl={recipe.viewUrl}
              cookingTime={recipe.cookingTime}
              difficulty={recipe.difficulty}
            />
          ))}

          <Button href={`${baseUrl}/recipes`}>Browse All Recipes</Button>
        </>
      )}

      {/* Cooking Tips Section */}
      {tips && tips.length > 0 && (
        <>
          <Hr style={hr} />

          <Heading as="h2" style={sectionHeading}>
            💡 This Week's Tips
          </Heading>

          {tips.map((tip, index) => (
            <Section key={index} style={tipSection}>
              <Text style={tipTitle}>{tip.title}</Text>
              <Text style={tipContent}>{tip.content}</Text>
            </Section>
          ))}
        </>
      )}

      <Hr style={hr} />

      {/* Call to Action */}
      <Section style={ctaSection}>
        <Heading as="h3" style={ctaHeading}>
          Share Your Recipes!
        </Heading>
        <Text style={paragraph}>
          Have a recipe you'd love to share with the community? We'd love to
          feature it in our next newsletter.
        </Text>
        <Button href={`${baseUrl}/recipes/create`}>Create a Recipe</Button>
      </Section>

      <Text style={signature}>
        Happy cooking!
        <br />
        The {tenantName} Team
      </Text>
    </EmailLayout>
  );
};

// Styles
const dateText = {
  fontSize: '12px',
  color: '#8898aa',
  margin: '0 0 16px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const heading = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#1a1a1a',
  margin: '0 0 16px 0',
  lineHeight: '40px',
};

const sectionHeading = {
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
  marginBottom: '20px',
  padding: '16px',
  backgroundColor: '#f6f9fc',
  borderRadius: '8px',
};

const tipTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 8px 0',
};

const tipContent = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#666666',
  margin: '0',
};

const ctaSection = {
  textAlign: 'center' as const,
  padding: '24px',
  backgroundColor: '#f6f9fc',
  borderRadius: '8px',
};

const ctaHeading = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 12px 0',
};

const signature = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#525252',
  margin: '24px 0 0 0',
};

export default NewsletterEmail;
