import { Column, Img, Link, Row, Section, Text } from '@react-email/components';

interface RecipeCardProps {
  title: string;
  description?: string;
  imageUrl?: string;
  author?: string;
  viewUrl: string;
  cookingTime?: string;
  difficulty?: string;
}

export const RecipeCard = ({
  title,
  description,
  imageUrl,
  author,
  viewUrl,
  cookingTime,
  difficulty,
}: RecipeCardProps) => {
  return (
    <Section style={card}>
      {imageUrl && (
        <Link href={viewUrl}>
          <Img src={imageUrl} alt={title} width="100%" style={image} />
        </Link>
      )}
      <Section style={cardContent}>
        <Link href={viewUrl} style={titleLink}>
          <Text style={recipeTitle}>{title}</Text>
        </Link>

        {description && <Text style={recipeDescription}>{description}</Text>}

        {(cookingTime || difficulty) && (
          <Row style={metadata}>
            {cookingTime && (
              <Column>
                <Text style={metadataText}>⏱️ {cookingTime}</Text>
              </Column>
            )}
            {difficulty && (
              <Column>
                <Text style={metadataText}>📊 {difficulty}</Text>
              </Column>
            )}
          </Row>
        )}

        {author && <Text style={authorText}>By {author}</Text>}
      </Section>
    </Section>
  );
};

const card = {
  border: '1px solid #e6ebf1',
  borderRadius: '8px',
  overflow: 'hidden',
  marginBottom: '24px',
};

const image = {
  width: '100%',
  height: 'auto',
  display: 'block',
};

const cardContent = {
  padding: '16px',
};

const titleLink = {
  textDecoration: 'none',
};

const recipeTitle = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 8px 0',
  lineHeight: '28px',
};

const recipeDescription = {
  fontSize: '14px',
  color: '#666666',
  margin: '8px 0',
  lineHeight: '20px',
};

const metadata = {
  marginTop: '12px',
};

const metadataText = {
  fontSize: '13px',
  color: '#8898aa',
  margin: '4px 0',
};

const authorText = {
  fontSize: '13px',
  color: '#8898aa',
  fontStyle: 'italic',
  marginTop: '8px',
};

export default RecipeCard;
