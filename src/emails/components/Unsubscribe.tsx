import { Link, Text } from '@react-email/components';

interface UnsubscribeProps {
  unsubscribeUrl: string;
  userName?: string;
}

export const Unsubscribe = ({ unsubscribeUrl, userName }: UnsubscribeProps) => {
  return (
    <Text style={unsubscribeText}>
      {userName && `Hi ${userName}, `}
      If you no longer wish to receive these emails, you can{' '}
      <Link href={unsubscribeUrl} style={unsubscribeLink}>
        unsubscribe here
      </Link>
      .
    </Text>
  );
};

const unsubscribeText = {
  fontSize: '12px',
  color: '#8898aa',
  lineHeight: '16px',
  margin: '16px 0',
  textAlign: 'center' as const,
};

const unsubscribeLink = {
  color: '#6772e5',
  textDecoration: 'underline',
};

export default Unsubscribe;
