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
  const previewText = `Your ${guideName} audio guide is ready to explore!`;
  
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>🎧 AudioGuide Premium</Heading>
            <Text style={headerSubtitle}>Premium Experience</Text>
          </Section>

          <Section style={heroSection}>
            <Heading style={h2}>Your Audio Guide is Ready!</Heading>
            <Text style={heroText}>
              Thank you for your purchase! Your premium audio guide experience for <strong>{guideName}</strong> is now available.
            </Text>
          </Section>

          <Section style={guideCard}>
            <Heading style={h3}>{guideName}</Heading>
            <Text style={locationText}>📍 {guideLocation}</Text>
            <Text style={featuresText}>
              ✅ High-quality audio narration<br/>
              ✅ Offline access available<br/>
              ✅ Interactive maps and points of interest<br/>
              ✅ Available in: {languages.join(', ')}<br/>
              ✅ Lifetime access
            </Text>
          </Section>

          <Section style={accessSection}>
            <Heading style={h3}>Start Your Journey</Heading>
            <Text style={accessText}>
              Click the button below to access your audio guide:
            </Text>
            <Button href={accessUrl} style={accessButton}>
              🎧 Start Listening Now
            </Button>
            
            {qrCodeUrl && (
              <Section style={qrSection}>
                <Text style={qrText}>Or scan this QR code:</Text>
                <Img src={qrCodeUrl} alt="QR Code for Audio Guide Access" style={qrImage} />
              </Section>
            )}
          </Section>

          <Section style={featuresSection}>
            <Heading style={h3}>What's Included</Heading>
            <Text style={featuresList}>
              🎯 <strong>Expert Commentary:</strong> Professional narration by local experts<br/>
              🗺️ <strong>Interactive Maps:</strong> GPS-enabled points of interest<br/>
              📱 <strong>Mobile Optimized:</strong> Works on any device<br/>
              🔄 <strong>Offline Mode:</strong> Download for offline use<br/>
              ⭐ <strong>Premium Support:</strong> Get help when you need it
            </Text>
          </Section>

          <Section style={purchaseSection}>
            <Heading style={h3}>Purchase Details</Heading>
            <Text style={purchaseDetails}>
              <strong>Guide:</strong> {guideName}<br/>
              <strong>Amount:</strong> {currency.toUpperCase()} ${(purchaseAmount / 100).toFixed(2)}<br/>
              <strong>Date:</strong> {new Date(purchaseDate).toLocaleDateString()}<br/>
              <strong>Email:</strong> {customerEmail}
            </Text>
          </Section>

          <Hr style={separator} />

          <Section style={footer}>
            <Text style={footerText}>
              Need help? Contact us at <Link href={`mailto:${supportEmail}`} style={link}>{supportEmail}</Link>
            </Text>
            <Text style={footerText}>
              AudioGuide Premium - Explore the world with expert guidance
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

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
};

const header = {
  padding: '32px 24px',
  textAlign: 'center' as const,
  backgroundColor: '#1a1a1a',
  color: '#ffffff',
};

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 8px',
  textAlign: 'center' as const,
};

const headerSubtitle = {
  color: '#a0a0a0',
  fontSize: '14px',
  margin: '0',
  textAlign: 'center' as const,
};

const heroSection = {
  padding: '32px 24px',
  textAlign: 'center' as const,
};

const h2 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 16px',
  textAlign: 'center' as const,
};

const heroText = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
  textAlign: 'center' as const,
};

const guideCard = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #e1e8ed',
  borderRadius: '8px',
  margin: '24px 24px',
  padding: '24px',
};

const h3 = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 12px',
};

const locationText = {
  color: '#525f7f',
  fontSize: '14px',
  margin: '0 0 16px',
};

const featuresText = {
  color: '#525f7f',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
};

const accessSection = {
  padding: '24px',
  textAlign: 'center' as const,
};

const accessText = {
  color: '#525f7f',
  fontSize: '16px',
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const accessButton = {
  backgroundColor: '#4f46e5',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '16px 32px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  margin: '0 auto',
};

const qrSection = {
  marginTop: '32px',
  textAlign: 'center' as const,
};

const qrText = {
  color: '#525f7f',
  fontSize: '14px',
  margin: '0 0 16px',
};

const qrImage = {
  width: '200px',
  height: '200px',
  margin: '0 auto',
};

const featuresSection = {
  padding: '24px',
};

const featuresList = {
  color: '#525f7f',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
};

const purchaseSection = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #e1e8ed',
  borderRadius: '8px',
  margin: '24px',
  padding: '24px',
};

const purchaseDetails = {
  color: '#525f7f',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
};

const separator = {
  border: 'none',
  borderTop: '1px solid #e1e8ed',
  margin: '32px 24px',
};

const footer = {
  padding: '0 24px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '0 0 8px',
  textAlign: 'center' as const,
};

const link = {
  color: '#4f46e5',
  textDecoration: 'underline',
};

// Responsive styles for larger screens
const responsiveStyles = `
  @media only screen and (min-width: 600px) {
    .container {
      width: 600px !important;
    }
    .header {
      padding: 48px 48px !important;
    }
    .hero-section {
      padding: 48px 48px !important;
    }
    .access-section {
      padding: 32px 48px !important;
    }
    .features-section {
      padding: 32px 48px !important;
    }
    .guide-card {
      margin: 32px 48px !important;
      padding: 32px !important;
    }
    .purchase-section {
      margin: 32px 48px !important;
      padding: 32px !important;
    }
    .separator {
      margin: 48px 48px !important;
    }
    .footer {
      padding: 0 48px !important;
    }
  }
`;