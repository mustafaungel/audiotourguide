import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Button,
  Hr,
  Column,
  Row,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface PremiumConfirmationEmailProps {
  guideName: string;
  guideLocation: string;
  customerName?: string;
  customerEmail: string;
  purchaseAmount: number;
  currency: string;
  purchaseDate: string;
  accessUrl: string;
  supportEmail: string;
  qrCodeUrl?: string;
  languages?: string[];
}

export const PremiumConfirmationEmail = ({
  guideName,
  guideLocation,
  customerName,
  customerEmail,
  purchaseAmount,
  currency,
  purchaseDate,
  accessUrl,
  supportEmail,
  languages = ['English']
}: PremiumConfirmationEmailProps) => {
  const previewText = `Your ${guideName} audio guide is ready to explore!`;
  const formattedPrice = `${currency === 'eur' ? '€' : '$'}${(purchaseAmount / 100).toFixed(2)}`;
  const formattedDate = new Date(purchaseDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Minimal Header */}
          <Section style={header}>
            <Row>
              <Column>
                <Heading style={headerTitle}>Audio Tour Guides</Heading>
              </Column>
              <Column align="right">
                <Text style={headerDate}>{formattedDate}</Text>
              </Column>
            </Row>
          </Section>

          {/* Hero Section */}
          <Section style={heroSection}>
            <Heading style={heroTitle}>Welcome to Your Audio Journey</Heading>
            <Text style={heroSubtext}>
              {customerName ? `${customerName}, thank you` : 'Thank you'} for your purchase. Your premium audio guide is ready.
            </Text>
          </Section>

          {/* Guide Info Card with Integrated Features */}
          <Section style={guideCard}>
            <Heading style={guideTitle}>{guideName}</Heading>
            <Text style={guideLocation}>{guideLocation}</Text>
            
            <div style={featuresList}>
              <Text style={featuresText}>
                Expert narration · Online access · Lifetime access
              </Text>
            </div>

            {/* CTA Button */}
            <div style={buttonContainer}>
              <Button style={primaryButton} href={accessUrl}>
                Access Your Guide
              </Button>
            </div>
          </Section>

          {/* Purchase Details */}
          <Section style={purchaseSection}>
            <Heading style={purchaseTitle}>Purchase Summary</Heading>
            <Row style={purchaseRow}>
              <Column>
                <Text style={purchaseLabel}>Guide</Text>
              </Column>
              <Column align="right">
                <Text style={purchaseValue}>{guideName}</Text>
              </Column>
            </Row>
            <Row style={purchaseRow}>
              <Column>
                <Text style={purchaseLabel}>Date</Text>
              </Column>
              <Column align="right">
                <Text style={purchaseValue}>{formattedDate}</Text>
              </Column>
            </Row>
            <Row style={purchaseRow}>
              <Column>
                <Text style={purchaseLabel}>Amount</Text>
              </Column>
              <Column align="right">
                <Text style={purchaseValueBold}>{formattedPrice}</Text>
              </Column>
            </Row>
          </Section>

          {/* Minimal Footer */}
          <Section style={footer}>
            <Hr style={divider} />
            <Text style={footerText}>
              Need help? Contact us at <Link href={`mailto:${supportEmail}`} style={link}>{supportEmail}</Link>
            </Text>
            <Text style={footerSubtext}>
              Thank you for choosing Audio Tour Guides
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Professional, minimal styles
const main = {
  backgroundColor: '#f9fafb',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
  lineHeight: '1.5',
  margin: '0',
  padding: '0',
};

const container = {
  margin: '0 auto',
  padding: '20px 16px',
  maxWidth: '560px',
  width: '100%',
};

const header = {
  paddingBottom: '16px',
  borderBottom: '1px solid #e5e7eb',
  marginBottom: '24px',
};

const headerTitle = {
  color: '#111827',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0',
  lineHeight: '1.2',
};

const headerDate = {
  color: '#6b7280',
  fontSize: '13px',
  margin: '0',
  lineHeight: '1.2',
};

const heroSection = {
  borderRadius: '8px',
  overflow: 'hidden',
  marginBottom: '20px',
  background: 'linear-gradient(135deg, #ea580c 0%, #fb923c 100%)',
  padding: '32px 20px',
  textAlign: 'center' as const,
};

const heroTitle = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '600',
  margin: '0 0 12px 0',
  textShadow: '0 1px 2px rgba(0,0,0,0.1)',
  lineHeight: '1.3',
};

const heroSubtext = {
  color: '#ffffff',
  fontSize: '15px',
  margin: '0',
  opacity: '0.95',
  lineHeight: '1.5',
};

const guideCard = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  padding: '24px 20px',
  marginBottom: '20px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  border: '1px solid #e5e7eb',
};

const guideTitle = {
  color: '#111827',
  fontSize: '22px',
  fontWeight: '600',
  margin: '0 0 8px 0',
  lineHeight: '1.3',
};

const guideLocation = {
  color: '#6b7280',
  fontSize: '15px',
  margin: '0 0 16px 0',
  lineHeight: '1.5',
};

const featuresList = {
  backgroundColor: '#f9fafb',
  borderRadius: '6px',
  padding: '12px 16px',
  marginBottom: '20px',
};

const featuresText = {
  color: '#4b5563',
  fontSize: '13px',
  margin: '0',
  lineHeight: '1.5',
  textAlign: 'center' as const,
};

const buttonContainer = {
  textAlign: 'center' as const,
};

const primaryButton = {
  backgroundColor: '#ea580c',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  border: 'none',
  cursor: 'pointer',
};

const purchaseSection = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '20px',
  border: '1px solid #e5e7eb',
};

const purchaseTitle = {
  color: '#111827',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 16px 0',
};

const purchaseRow = {
  marginBottom: '8px',
};

const purchaseLabel = {
  color: '#6b7280',
  fontSize: '13px',
  margin: '0',
};

const purchaseValue = {
  color: '#374151',
  fontSize: '13px',
  margin: '0',
};

const purchaseValueBold = {
  color: '#111827',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0',
};

const divider = {
  border: 'none',
  borderTop: '1px solid #e5e7eb',
  margin: '0 0 16px 0',
};

const footer = {
  paddingTop: '16px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '0 0 8px 0',
  textAlign: 'center' as const,
};

const footerSubtext = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '0',
  textAlign: 'center' as const,
};

const link = {
  color: '#ea580c',
  textDecoration: 'none',
};
