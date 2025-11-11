import { Button as ReactEmailButton } from '@react-email/components';

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export const Button = ({
  href,
  children,
  variant = 'primary',
}: ButtonProps) => {
  const styles =
    variant === 'primary' ? primaryButtonStyle : secondaryButtonStyle;

  return (
    <ReactEmailButton href={href} style={styles}>
      {children}
    </ReactEmailButton>
  );
};

const primaryButtonStyle = {
  backgroundColor: '#6b4423',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
  margin: '16px 0',
};

const secondaryButtonStyle = {
  backgroundColor: '#f6f9fc',
  border: '1px solid #6b4423',
  borderRadius: '8px',
  color: '#6b4423',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
  margin: '16px 0',
};

export default Button;
