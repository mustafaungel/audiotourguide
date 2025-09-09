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
  Button,
  Hr,
  Column,
  Row,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface PremiumConfirmationEmailProps {
  guideTitle: string;
  guideLocation: string;
  guideImageUrl?: string;
  guideDuration: number;
  guideUrl: string;
  accessCode?: string;
  customerName?: string;
  purchaseDate: string;
  price: string;
  currency: string;
}

export const PremiumConfirmationEmail = ({
  guideTitle,
  guideLocation,
  guideImageUrl,
  guideDuration,
  guideUrl,
  accessCode,
  customerName,
  purchaseDate,
  price,
  currency
}: PremiumConfirmationEmailProps) => {
  const previewText = `Your ${guideTitle} audio guide is ready! Start your immersive journey now.`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Row>
              <Column>
                <Heading style={headerTitle}>AudioGuide</Heading>
              </Column>
              <Column align="right">
                <Text style={headerSubtext}>Premium Experience</Text>
              </Column>
            </Row>
          </Section>

          {/* Hero Section */}
          <Section style={heroSection}>
            {guideImageUrl && (
              <Img
                src={guideImageUrl}
                alt={guideTitle}
                style={heroImage}
              />
            )}
            <div style={heroOverlay}>
              <Heading style={heroTitle}>🎉 Purchase Confirmed!</Heading>
              <Text style={heroSubtext}>
                Thank you {customerName ? customerName : 'valued customer'}! Your premium audio guide is ready.
              </Text>
            </div>
          </Section>

          {/* Guide Info Card */}
          <Section style={guideCard}>
            <Row>
              <Column style={guideInfo}>
                <Heading style={guideTitle}>{guideTitle}</Heading>
                <Text style={guideLocation}>📍 {guideLocation}</Text>
                <Text style={guideDurationText}>⏱️ {Math.floor(guideDuration / 60)} minutes of premium content</Text>
              </Column>
            </Row>
          </Section>

          {/* Access Section */}
          <Section style={accessSection}>
            <Heading style={accessTitle}>🎧 Start Your Journey</Heading>
            <Text style={accessText}>
              Your personalized audio experience is ready. Click below to begin your immersive adventure.
            </Text>
            
            <div style={buttonContainer}>
              <Button style={primaryButton} href={guideUrl}>
                🎵 Listen Now
              </Button>
            </div>

            {accessCode && (
              <div style={accessCodeSection}>
                <Text style={accessCodeLabel}>Your Access Code:</Text>
                <div style={accessCodeBox}>
                  <Text style={accessCodeText}>{accessCode}</Text>
                </div>
                <Text style={accessCodeHint}>
                  💡 Save this code for offline access or sharing with travel companions
                </Text>
              </div>
            )}
          </Section>

          {/* Features Section */}
          <Section style={featuresSection}>
            <Heading style={featuresTitle}>✨ What's Included</Heading>
            <Row>
              <Column style={featureColumn}>
                <div style={featureItem}>
                  <Text style={featureIcon}>🎙️</Text>
                  <Text style={featureText}>Expert narration</Text>
                </div>
              </Column>
              <Column style={featureColumn}>
                <div style={featureItem}>
                  <Text style={featureIcon}>📱</Text>
                  <Text style={featureText}>Mobile optimized</Text>
                </div>
              </Column>
            </Row>
            <Row>
              <Column style={featureColumn}>
                <div style={featureItem}>
                  <Text style={featureIcon}>🌐</Text>
                  <Text style={featureText}>Offline access</Text>
                </div>
              </Column>
              <Column style={featureColumn}>
                <div style={featureItem}>
                  <Text style={featureIcon}>🎯</Text>
                  <Text style={featureText}>Interactive chapters</Text>
                </div>
              </Column>
            </Row>
          </Section>

          {/* Purchase Details */}
          <Section style={purchaseSection}>
            <Hr style={divider} />
            <Heading style={purchaseTitle}>Purchase Details</Heading>
            <Row style={purchaseRow}>
              <Column>
                <Text style={purchaseLabel}>Guide:</Text>
              </Column>
              <Column align="right">
                <Text style={purchaseValue}>{guideTitle}</Text>
              </Column>
            </Row>
            <Row style={purchaseRow}>
              <Column>
                <Text style={purchaseLabel}>Date:</Text>
              </Column>
              <Column align="right">
                <Text style={purchaseValue}>{purchaseDate}</Text>
              </Column>
            </Row>
            <Row style={purchaseRow}>
              <Column>
                <Text style={purchaseLabel}>Amount:</Text>
              </Column>
              <Column align="right">
                <Text style={purchaseValueBold}>{price} {currency}</Text>
              </Column>
            </Row>
          </Section>

          {/* Tips Section */}
          <Section style={tipsSection}>
            <Heading style={tipsTitle}>💡 Pro Tips</Heading>
            <ul style={tipsList}>
              <li style={tipsItem}>
                <Text style={tipsText}>Download for offline listening before your trip</Text>
              </li>
              <li style={tipsItem}>
                <Text style={tipsText}>Use headphones for the best immersive experience</Text>
              </li>
              <li style={tipsItem}>
                <Text style={tipsText}>Each chapter can be played independently</Text>
              </li>
              <li style={tipsItem}>
                <Text style={tipsText}>Share your access code with travel companions</Text>
              </li>
            </ul>
          </Section>

          {/* Social Section */}
          <Section style={socialSection}>
            <Text style={socialText}>
              Love your experience? Share it with fellow travelers!
            </Text>
            <div style={socialButtons}>
              <Link style={socialButton} href={`https://twitter.com/intent/tweet?text=Just got an amazing audio guide for ${guideTitle}! 🎧✨&url=${guideUrl}`}>
                🐦 Twitter
              </Link>
              <Link style={socialButton} href={`https://www.facebook.com/sharer/sharer.php?u=${guideUrl}`}>
                📘 Facebook
              </Link>
            </div>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={divider} />
            <Text style={footerText}>
              Thank you for choosing AudioGuide for your travel adventures!
            </Text>
            <Text style={footerSubtext}>
              Need help? Contact us at support@audioguide.app
            </Text>
            <Text style={footerCopyright}>
              © 2024 AudioGuide. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#f8fafc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px',
  maxWidth: '600px',
};

const header = {
  padding: '20px 0',
  borderBottom: '2px solid #e2e8f0',
  marginBottom: '20px',
};

const headerTitle = {
  color: '#1e293b',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
};

const headerSubtext = {
  color: '#64748b',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
};

const heroSection = {
  position: 'relative' as const,
  borderRadius: '16px',
  overflow: 'hidden',
  marginBottom: '24px',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
};

const heroImage = {
  width: '100%',
  height: '200px',
  objectFit: 'cover' as const,
};

const heroOverlay = {
  padding: '32px 24px',
  textAlign: 'center' as const,
  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)',
};

const heroTitle = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const heroSubtext = {
  color: '#ffffff',
  fontSize: '18px',
  margin: '0',
  opacity: '0.95',
};

const guideCard = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  border: '1px solid #e2e8f0',
};

const guideInfo = {
  width: '100%',
};

const guideTitle = {
  color: '#1e293b',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const guideLocation = {
  color: '#64748b',
  fontSize: '16px',
  margin: '0 0 8px 0',
};

const guideDurationText = {
  color: '#64748b',
  fontSize: '16px',
  margin: '0',
};

const accessSection = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '32px 24px',
  marginBottom: '24px',
  textAlign: 'center' as const,
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  border: '1px solid #e2e8f0',
};

const accessTitle = {
  color: '#1e293b',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};

const accessText = {
  color: '#64748b',
  fontSize: '16px',
  margin: '0 0 24px 0',
  lineHeight: '1.6',
};

const buttonContainer = {
  margin: '24px 0',
};

const primaryButton = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
};

const accessCodeSection = {
  marginTop: '24px',
  textAlign: 'center' as const,
};

const accessCodeLabel = {
  color: '#374151',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const accessCodeBox = {
  backgroundColor: '#f3f4f6',
  border: '2px dashed #d1d5db',
  borderRadius: '8px',
  padding: '16px',
  margin: '8px 0 12px 0',
};

const accessCodeText = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  fontFamily: 'monospace',
  margin: '0',
  letterSpacing: '2px',
};

const accessCodeHint = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
  fontStyle: 'italic',
};

const featuresSection = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  border: '1px solid #e2e8f0',
};

const featuresTitle = {
  color: '#1e293b',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
  textAlign: 'center' as const,
};

const featureColumn = {
  width: '50%',
  padding: '0 8px',
};

const featureItem = {
  textAlign: 'center' as const,
  marginBottom: '16px',
};

const featureIcon = {
  fontSize: '24px',
  margin: '0 0 8px 0',
};

const featureText = {
  color: '#64748b',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
};

const purchaseSection = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  border: '1px solid #e2e8f0',
};

const purchaseTitle = {
  color: '#1e293b',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};

const purchaseRow = {
  marginBottom: '8px',
};

const purchaseLabel = {
  color: '#64748b',
  fontSize: '14px',
  margin: '0',
};

const purchaseValue = {
  color: '#374151',
  fontSize: '14px',
  margin: '0',
};

const purchaseValueBold = {
  color: '#1e293b',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0',
};

const tipsSection = {
  backgroundColor: '#f8fafc',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px',
  border: '1px solid #e2e8f0',
};

const tipsTitle = {
  color: '#1e293b',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};

const tipsList = {
  margin: '0',
  paddingLeft: '0',
  listStyle: 'none',
};

const tipsItem = {
  marginBottom: '12px',
  paddingLeft: '24px',
  position: 'relative' as const,
};

const tipsText = {
  color: '#4b5563',
  fontSize: '14px',
  margin: '0',
  lineHeight: '1.5',
};

const socialSection = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px',
  textAlign: 'center' as const,
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  border: '1px solid #e2e8f0',
};

const socialText = {
  color: '#374151',
  fontSize: '16px',
  margin: '0 0 16px 0',
};

const socialButtons = {
  display: 'flex',
  justifyContent: 'center',
  gap: '12px',
};

const socialButton = {
  backgroundColor: '#f3f4f6',
  color: '#374151',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: '500',
  padding: '8px 16px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
};

const footer = {
  textAlign: 'center' as const,
  marginTop: '32px',
};

const divider = {
  borderColor: '#e2e8f0',
  margin: '24px 0',
};

const footerText = {
  color: '#374151',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0 0 8px 0',
};

const footerSubtext = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0 0 16px 0',
};

const footerCopyright = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '0',
};

export default PremiumConfirmationEmail;