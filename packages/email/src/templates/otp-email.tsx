import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { messages, type Locale } from '@wad/i18n';

export interface OtpEmailProps {
  code: string;
  locale: Locale;
  minutes: number;
}

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));

export function otpEmailSubject({ code, locale }: Pick<OtpEmailProps, 'code' | 'locale'>): string {
  return fill(messages[locale].email.otp.subject, { code });
}

export function OtpEmail({ code, locale, minutes }: OtpEmailProps) {
  const t = messages[locale].email.otp;
  return (
    <Html lang={locale}>
      <Head />
      <Preview>{fill(t.preview, { code })}</Preview>
      <Body
        style={{ backgroundColor: '#f6f5f3', fontFamily: 'Inter, Helvetica, Arial, sans-serif' }}
      >
        <Container
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            margin: '40px auto',
            padding: 32,
            maxWidth: 440,
          }}
        >
          <Heading style={{ fontSize: 20, fontWeight: 600, color: '#1c1b1a', margin: 0 }}>
            {t.heading}
          </Heading>
          <Text style={{ fontSize: 14, color: '#5f5d5a' }}>{fill(t.body, { minutes })}</Text>
          <Section
            style={{
              backgroundColor: '#f6f5f3',
              borderRadius: 12,
              padding: 16,
              textAlign: 'center',
            }}
          >
            <Text
              data-testid="otp-code"
              style={{
                fontSize: 32,
                letterSpacing: 8,
                fontWeight: 600,
                color: '#1c1b1a',
                margin: 0,
              }}
            >
              {code}
            </Text>
          </Section>
          <Text style={{ fontSize: 12, color: '#8a8784' }}>{t.ignore}</Text>
        </Container>
      </Body>
    </Html>
  );
}
