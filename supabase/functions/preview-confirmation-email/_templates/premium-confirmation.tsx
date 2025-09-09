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
  Hr,
  Img,
  Row,
  Column,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface PremiumConfirmationEmailProps {
  guideName: string;
  guideLocation: string;
  customerName: string;
  customerEmail: string;
  accessCode: string;
  purchaseAmount: number;
  currency: string;
  purchaseDate: string;
  guideUrl: string;
  accessUrl: string;
  supportEmail: string;
  qrCodeUrl?: string;
}

export const PremiumConfirmationEmail = ({
  guideName,
  guideLocation,
  customerName,
  customerEmail,
  accessCode,
  purchaseAmount,
  currency,
  purchaseDate,
  guideUrl,
  accessUrl,
  supportEmail,
  qrCodeUrl,
}: PremiumConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Your Premium Audio Guide is Ready - {guideName}</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header */}
        <Section style={header}>
          <Heading style={h1}>🎧 AudioGuides Premium</Heading>
        </Section>

        {/* Hero Section */}
        <Section style={heroSection}>
          <Heading style={h2}>Your Audio Guide is Ready!</Heading>
          <Text style={heroText}>
            Thank you for your purchase, {customerName}! Your premium audio guide experience awaits.
          </Text>
        </Section>

        {/* Guide Card */}
        <Section style={guideCard}>
          <Heading style={guideTitle}>{guideName}</Heading>
          <Text style={guideLocation}>📍 {guideLocation}</Text>
          
          {/* Access Section */}
          <Section style={accessSection}>
            <Heading style={accessTitle}>🔑 Your Access Information</Heading>
            <Text style={accessCode}>Access Code: <strong>{accessCode}</strong></Text>
            <Link href={accessUrl} style={accessButton}>
              🎵 Start Listening Now
            </Link>
          </Section>

          {/* QR Code */}
          {qrCodeUrl && (
            <Section style={qrSection}>
              <Text style={qrText}>Quick Access QR Code:</Text>
              <Img src={qrCodeUrl} alt="QR Code for Audio Guide" style={qrImage} />
            </Section>
          )}
        </Section>

        {/* Features */}
        <Section style={featuresSection}>
          <Heading style={featuresTitle}>✨ What's Included</Heading>
          <Row>
            <Column>
              <Text style={featureItem}>🎧 High-quality audio narration</Text>
              <Text style={featureItem}>📱 Mobile-friendly experience</Text>
              <Text style={featureItem}>🎯 Professional storytelling</Text>
            </Column>
            <Column>
              <Text style={featureItem}>⏰ Lifetime access</Text>
              <Text style={featureItem}>🏛️ Cultural insights</Text>
              <Text style={featureItem}>📍 Location-specific content</Text>
            </Column>
          </Row>
        </Section>

        {/* Purchase Summary */}
        <Section style={purchaseSection}>
          <Heading style={purchaseTitle}>💰 Purchase Summary</Heading>
          <Text style={purchaseDetail}>Guide: {guideName}</Text>
          <Text style={purchaseDetail}>Amount: {currency} {(purchaseAmount / 100).toFixed(2)}</Text>
          <Text style={purchaseDetail}>Date: {new Date(purchaseDate).toLocaleDateString()}</Text>
          <Text style={purchaseDetail}>Access Code: {accessCode}</Text>
        </Section>

        {/* Pro Tips */}
        <Section style={tipsSection}>
          <Heading style={tipsTitle}>💡 Pro Tips</Heading>
          <Text style={tipItem}>• Use headphones for the best experience</Text>
          <Text style={tipItem}>• Follow the suggested route for optimal flow</Text>
          <Text style={tipItem}>• Take your time - this is your personal tour</Text>
          <Text style={tipItem}>• Save your place with the pause feature</Text>
        </Section>

        {/* Footer */}
        <Hr style={hr} />
        <Section style={footer}>
          <Text style={footerText}>
            Questions? Contact us at{' '}
            <Link href={`mailto:${supportEmail}`} style={footerLink}>
              {supportEmail}
            </Link>
          </Text>
          <Text style={footerText}>
            Thank you for choosing AudioGuides Premium for your cultural journey.
          </Text>
          <Text style={footerCopyright}>
            © 2024 AudioGuides Premium. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '20px 40px',
  textAlign: 'center' as const,
  backgroundColor: '#8b5cf6',
};

const h1 = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
};

const heroSection = {
  padding: '40px 40px 20px',
  textAlign: 'center' as const,
};

const h2 = {
  color: '#1f2937',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 16px',
};

const heroText = {
  color: '#6b7280',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
};

const guideCard = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  margin: '20px 40px',
  padding: '32px',
};

const guideTitle = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 8px',
};

const guideLocation = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0 0 24px',
};

const accessSection = {
  backgroundColor: '#ffffff',
  border: '2px solid #8b5cf6',
  borderRadius: '8px',
  padding: '20px',
  textAlign: 'center' as const,
  margin: '20px 0',
};

const accessTitle = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px',
};

const accessCode = {
  backgroundColor: '#f3f4f6',
  border: '1px dashed #8b5cf6',
  borderRadius: '6px',
  color: '#1f2937',
  fontSize: '16px',
  fontFamily: 'Monaco, Menlo, Consolas, "Courier New", monospace',
  margin: '12px 0',
  padding: '12px',
};

const accessButton = {
  backgroundColor: '#8b5cf6',
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '14px 28px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  margin: '16px 0',
};

const qrSection = {
  textAlign: 'center' as const,
  margin: '20px 0',
};

const qrText = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0 0 12px',
};

const qrImage = {
  width: '120px',
  height: '120px',
  margin: '0 auto',
};

const featuresSection = {
  padding: '20px 40px',
};

const featuresTitle = {
  color: '#1f2937',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 16px',
  textAlign: 'center' as const,
};

const featureItem = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
};

const purchaseSection = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  margin: '20px 40px',
  padding: '20px',
};

const purchaseTitle = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px',
};

const purchaseDetail = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '4px 0',
};

const tipsSection = {
  padding: '20px 40px',
};

const tipsTitle = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px',
  textAlign: 'center' as const,
};

const tipItem = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
};

const socialSection = {
  padding: '20px 40px',
  textAlign: 'center' as const,
};

const socialTitle = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px',
};

const socialText = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0 0 16px',
};

const shareButton = {
  backgroundColor: '#10b981',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: 'bold',
  padding: '10px 20px',
  textDecoration: 'none',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
};

const footer = {
  padding: '0 40px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '8px 0',
};

const footerLink = {
  color: '#8b5cf6',
  textDecoration: 'none',
};

const footerCopyright = {
  color: '#9ca3af',
  fontSize: '11px',
  margin: '16px 0 0',
};