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
  qrCodeUrl,
  languages = ['English']
}: PremiumConfirmationEmailProps) => {
  const previewText = `Your ${guideName} audio guide is ready! Start your immersive journey now.`;
  const formattedPrice = (purchaseAmount / 100).toFixed(2);
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
          {/* Header */}
          <Section style={header}>
            <Row>
              <Column>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: 'linear-gradient(135deg, #059669, #047857)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}>
                    <div style={{ 
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      width: '12px',
                      height: '12px',
                      background: 'linear-gradient(135deg, #fb923c, #ea580c)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div style={{
                        width: '4px',
                        height: '4px',
                        backgroundColor: 'white',
                        borderRadius: '50%'
                      }}></div>
                    </div>
                  </div>
                  <Heading style={headerTitle}>Audio Tour Guides</Heading>
                </div>
              </Column>
              <Column align="right">
                <Text style={headerSubtext}>Premium Experience</Text>
              </Column>
            </Row>
          </Section>

          {/* Hero Section */}
          <Section style={heroSection}>
            <div style={heroOverlay}>
              <Heading style={heroTitle}>🎉 Purchase Confirmed!</Heading>
              <Text style={heroSubtext}>
                Thank you {customerName || 'valued customer'}! Your premium audio guide is ready.
              </Text>
            </div>
          </Section>

          {/* Guide Info Card */}
          <Section style={guideCard}>
            <Row>
              <Column style={guideInfo}>
                <Heading style={guideTitle}>{guideName}</Heading>
                <Text style={guideLocation}>📍 {guideLocation}</Text>
                <Text style={guideDurationText}>🎧 Premium audio experience</Text>
                <Text style={guideDurationText}>🌐 Available in: {languages.join(', ')}</Text>
              </Column>
            </Row>
          </Section>

          {/* Access Section */}
          <Section style={accessSection}>
            <Heading style={accessTitle}>🎧 Start Listening Now</Heading>
            <Text style={accessText}>
              Your personalized audio experience is ready. Click below to begin your immersive adventure.
            </Text>
            
            <div style={buttonContainer}>
              <Button style={primaryButton} href={accessUrl}>
                🎵 Start Listening Now
              </Button>
            </div>

            {qrCodeUrl && (
              <div style={qrCodeSection}>
                <Text style={qrCodeLabel}>📱 Scan for Instant Access:</Text>
                <Img
                  src={qrCodeUrl}
                  alt="QR Code for quick access to your audio guide"
                  style={qrCodeImage}
                />
                <Text style={qrCodeHint}>
                  Scan with your phone's camera for instant access to your guide
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
                <Text style={purchaseValue}>{guideName}</Text>
              </Column>
            </Row>
            <Row style={purchaseRow}>
              <Column>
                <Text style={purchaseLabel}>Date:</Text>
              </Column>
              <Column align="right">
                <Text style={purchaseValue}>{formattedDate}</Text>
              </Column>
            </Row>
            <Row style={purchaseRow}>
              <Column>
                <Text style={purchaseLabel}>Amount:</Text>
              </Column>
              <Column align="right">
                <Text style={purchaseValueBold}>{formattedPrice} {currency}</Text>
              </Column>
            </Row>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={divider} />
            <Text style={footerText}>
              Thank you for choosing Audio Tour Guides!
            </Text>
            <Text style={footerSubtext}>
              Need help? Contact us at {supportEmail}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Responsive, mobile-first styles using website color palette
const main = {
  backgroundColor: '#fef7f3', // Light warm background from website
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
  lineHeight: '1.6',
  margin: '0',
  padding: '0',
};

const container = {
  margin: '0 auto',
  padding: '16px',
  maxWidth: '600px',
  width: '100%',
  '@media (min-width: 600px)': {
    padding: '20px',
  },
};

const header = {
  padding: '16px 0 20px 0',
  borderBottom: '2px solid hsl(22, 88%, 52%)', // Primary color from website
  marginBottom: '20px',
};

const headerTitle = {
  color: 'hsl(22, 88%, 52%)', // Primary brand color
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  '@media (min-width: 600px)': {
    fontSize: '28px',
  },
};

const headerSubtext = {
  color: 'hsl(25, 20%, 42%)', // Muted foreground from website
  fontSize: '12px',
  fontWeight: '500',
  margin: '0',
  '@media (min-width: 600px)': {
    fontSize: '14px',
  },
};

const heroSection = {
  borderRadius: '12px',
  overflow: 'hidden',
  marginBottom: '20px',
  background: 'linear-gradient(135deg, hsl(22, 88%, 52%), hsl(18, 85%, 62%))', // Tourism gradient
  padding: '24px 16px',
  textAlign: 'center' as const,
  '@media (min-width: 600px)': {
    padding: '32px 24px',
    marginBottom: '24px',
  },
};

const heroOverlay = {
  textAlign: 'center' as const,
};

const heroTitle = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
  '@media (min-width: 600px)': {
    fontSize: '32px',
  },
};

const heroSubtext = {
  color: '#ffffff',
  fontSize: '16px',
  margin: '0',
  opacity: '0.95',
  '@media (min-width: 600px)': {
    fontSize: '18px',
  },
};

const guideCard = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '16px',
  marginBottom: '20px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  border: '1px solid hsl(25, 15%, 88%)', // Border from website
  '@media (min-width: 600px)': {
    padding: '24px',
    marginBottom: '24px',
  },
};

const guideInfo = {
  width: '100%',
};

const guideTitle = {
  color: 'hsl(25, 30%, 12%)', // Foreground from website
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
  lineHeight: '1.3',
  '@media (min-width: 600px)': {
    fontSize: '24px',
  },
};

const guideLocation = {
  color: 'hsl(25, 20%, 42%)', // Muted foreground
  fontSize: '14px',
  margin: '0 0 8px 0',
  '@media (min-width: 600px)': {
    fontSize: '16px',
  },
};

const guideDurationText = {
  color: 'hsl(25, 20%, 42%)',
  fontSize: '14px',
  margin: '0',
  '@media (min-width: 600px)': {
    fontSize: '16px',
  },
};

const accessSection = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '20px 16px',
  marginBottom: '20px',
  textAlign: 'center' as const,
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  border: '1px solid hsl(25, 15%, 88%)',
  '@media (min-width: 600px)': {
    padding: '32px 24px',
    marginBottom: '24px',
  },
};

const accessTitle = {
  color: 'hsl(25, 30%, 12%)',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
  '@media (min-width: 600px)': {
    fontSize: '24px',
    margin: '0 0 16px 0',
  },
};

const accessText = {
  color: 'hsl(25, 20%, 42%)',
  fontSize: '14px',
  margin: '0 0 20px 0',
  lineHeight: '1.6',
  '@media (min-width: 600px)': {
    fontSize: '16px',
    margin: '0 0 24px 0',
  },
};

const buttonContainer = {
  margin: '20px 0',
  '@media (min-width: 600px)': {
    margin: '24px 0',
  },
};

const primaryButton = {
  backgroundColor: 'hsl(22, 88%, 52%)', // Primary color from website
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 24px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  border: 'none',
  cursor: 'pointer',
  '@media (min-width: 600px)': {
    fontSize: '18px',
    padding: '16px 32px',
  },
};

const accessCodeSection = {
  marginTop: '20px',
  textAlign: 'center' as const,
  '@media (min-width: 600px)': {
    marginTop: '24px',
  },
};

const accessCodeLabel = {
  color: 'hsl(25, 25%, 15%)',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 8px 0',
  '@media (min-width: 600px)': {
    fontSize: '16px',
  },
};

const accessCodeBox = {
  backgroundColor: 'hsl(25, 20%, 94%)', // Secondary from website
  border: '2px dashed hsl(25, 15%, 88%)',
  borderRadius: '8px',
  padding: '12px',
  margin: '8px 0 12px 0',
  '@media (min-width: 600px)': {
    padding: '16px',
  },
};

const accessCodeText = {
  color: 'hsl(25, 30%, 12%)',
  fontSize: '18px',
  fontWeight: 'bold',
  fontFamily: 'Monaco, Consolas, "Courier New", monospace',
  margin: '0',
  letterSpacing: '2px',
  '@media (min-width: 600px)': {
    fontSize: '24px',
  },
};

const accessCodeHint = {
  color: 'hsl(25, 20%, 42%)',
  fontSize: '12px',
  margin: '0',
  fontStyle: 'italic',
  '@media (min-width: 600px)': {
    fontSize: '14px',
  },
};

const qrCodeSection = {
  marginTop: '20px',
  textAlign: 'center' as const,
  padding: '16px',
  backgroundColor: 'hsl(25, 20%, 94%)',
  borderRadius: '8px',
  '@media (min-width: 600px)': {
    marginTop: '24px',
  },
};

const qrCodeLabel = {
  color: 'hsl(25, 25%, 15%)',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 12px 0',
  '@media (min-width: 600px)': {
    fontSize: '16px',
  },
};

const qrCodeImage = {
  width: '120px',
  height: '120px',
  margin: '0 auto',
  '@media (min-width: 600px)': {
    width: '150px',
    height: '150px',
  },
};

const featuresSection = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '16px',
  marginBottom: '20px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  border: '1px solid hsl(25, 15%, 88%)',
  '@media (min-width: 600px)': {
    padding: '24px',
    marginBottom: '24px',
  },
};

const featuresTitle = {
  color: 'hsl(25, 30%, 12%)',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
  textAlign: 'center' as const,
  '@media (min-width: 600px)': {
    fontSize: '20px',
    margin: '0 0 16px 0',
  },
};

const featureColumn = {
  width: '50%',
  padding: '0 4px',
  '@media (min-width: 600px)': {
    padding: '0 8px',
  },
};

const featureItem = {
  textAlign: 'center' as const,
  marginBottom: '12px',
  '@media (min-width: 600px)': {
    marginBottom: '16px',
  },
};

const featureIcon = {
  fontSize: '20px',
  margin: '0 0 6px 0',
  '@media (min-width: 600px)': {
    fontSize: '24px',
    margin: '0 0 8px 0',
  },
};

const featureText = {
  color: 'hsl(25, 20%, 42%)',
  fontSize: '12px',
  fontWeight: '500',
  margin: '0',
  lineHeight: '1.4',
  '@media (min-width: 600px)': {
    fontSize: '14px',
  },
};

const purchaseSection = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '16px',
  marginBottom: '20px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  border: '1px solid hsl(25, 15%, 88%)',
  '@media (min-width: 600px)': {
    padding: '24px',
    marginBottom: '24px',
  },
};

const purchaseTitle = {
  color: 'hsl(25, 30%, 12%)',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
  '@media (min-width: 600px)': {
    fontSize: '18px',
    margin: '0 0 16px 0',
  },
};

const purchaseRow = {
  marginBottom: '6px',
  '@media (min-width: 600px)': {
    marginBottom: '8px',
  },
};

const purchaseLabel = {
  color: 'hsl(25, 20%, 42%)',
  fontSize: '12px',
  margin: '0',
  '@media (min-width: 600px)': {
    fontSize: '14px',
  },
};

const purchaseValue = {
  color: 'hsl(25, 25%, 15%)',
  fontSize: '12px',
  margin: '0',
  '@media (min-width: 600px)': {
    fontSize: '14px',
  },
};

const purchaseValueBold = {
  color: 'hsl(25, 30%, 12%)',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0',
  '@media (min-width: 600px)': {
    fontSize: '16px',
  },
};

const qrCodeSection = {
  marginTop: '20px',
  textAlign: 'center' as const,
  padding: '16px',
  backgroundColor: 'hsl(25, 20%, 96%)',
  borderRadius: '8px',
  border: '1px solid hsl(25, 15%, 88%)',
  '@media (min-width: 600px)': {
    marginTop: '24px',
    padding: '20px',
  },
};

const qrCodeLabel = {
  color: 'hsl(25, 25%, 15%)',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 12px 0',
  '@media (min-width: 600px)': {
    fontSize: '18px',
  },
};

const qrCodeImage = {
  width: '140px',
  height: '140px',
  margin: '8px 0',
  border: '2px solid hsl(25, 15%, 88%)',
  borderRadius: '8px',
  '@media (min-width: 600px)': {
    width: '160px',
    height: '160px',
  },
};

const qrCodeHint = {
  color: 'hsl(25, 20%, 42%)',
  fontSize: '12px',
  margin: '8px 0 0 0',
  lineHeight: '1.4',
  '@media (min-width: 600px)': {
    fontSize: '14px',
  },
};

const divider = {
  borderColor: 'hsl(25, 15%, 88%)',
  margin: '16px 0',
  '@media (min-width: 600px)': {
    margin: '20px 0',
  },
};

const tipsSection = {
  backgroundColor: 'hsl(25, 20%, 96%)', // Light background from website
  borderRadius: '12px',
  padding: '16px',
  marginBottom: '20px',
  border: '1px solid hsl(25, 15%, 88%)',
  '@media (min-width: 600px)': {
    padding: '24px',
    marginBottom: '24px',
  },
};

const tipsTitle = {
  color: 'hsl(25, 30%, 12%)',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
  '@media (min-width: 600px)': {
    fontSize: '18px',
    margin: '0 0 16px 0',
  },
};

const tipsList = {
  margin: '0',
  padding: '0 0 0 16px',
  listStyle: 'none',
};

const tipsItem = {
  marginBottom: '8px',
  position: 'relative' as const,
  paddingLeft: '0',
  '@media (min-width: 600px)': {
    marginBottom: '10px',
  },
};

const tipsText = {
  color: 'hsl(25, 20%, 42%)',
  fontSize: '12px',
  margin: '0',
  lineHeight: '1.5',
  '@media (min-width: 600px)': {
    fontSize: '14px',
  },
};

const socialSection = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '16px',
  marginBottom: '20px',
  textAlign: 'center' as const,
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  border: '1px solid hsl(25, 15%, 88%)',
  '@media (min-width: 600px)': {
    padding: '24px',
    marginBottom: '24px',
  },
};

const socialText = {
  color: 'hsl(25, 20%, 42%)',
  fontSize: '12px',
  margin: '0 0 12px 0',
  '@media (min-width: 600px)': {
    fontSize: '14px',
    margin: '0 0 16px 0',
  },
};

const socialButtons = {
  display: 'flex',
  gap: '8px',
  justifyContent: 'center',
  flexWrap: 'wrap' as const,
  '@media (min-width: 600px)': {
    gap: '12px',
  },
};

const socialButton = {
  backgroundColor: 'hsl(205, 88%, 48%)', // Accent color from website
  color: '#ffffff',
  textDecoration: 'none',
  padding: '8px 12px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: '500',
  display: 'inline-block',
  '@media (min-width: 600px)': {
    padding: '10px 16px',
    fontSize: '14px',
  },
};

const footer = {
  padding: '16px 0',
  textAlign: 'center' as const,
  '@media (min-width: 600px)': {
    padding: '20px 0',
  },
};

const footerText = {
  color: 'hsl(25, 20%, 42%)',
  fontSize: '12px',
  margin: '0 0 8px 0',
  '@media (min-width: 600px)': {
    fontSize: '14px',
    margin: '0 0 10px 0',
  },
};

const footerSubtext = {
  color: 'hsl(25, 20%, 42%)',
  fontSize: '11px',
  margin: '0 0 8px 0',
  '@media (min-width: 600px)': {
    fontSize: '12px',
    margin: '0 0 10px 0',
  },
};

const footerCopyright = {
  color: 'hsl(25, 20%, 42%)',
  fontSize: '10px',
  margin: '0',
  '@media (min-width: 600px)': {
    fontSize: '11px',
  },
};