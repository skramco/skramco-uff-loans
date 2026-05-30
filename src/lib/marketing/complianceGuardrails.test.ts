import { describe, it, expect } from 'vitest';
import {
  evaluateCompliance,
  stripPIIFromText,
  canSendCampaign,
  buildIdempotencyKey,
} from './complianceGuardrails';

describe('evaluateCompliance', () => {
  it('flags forbidden phrases', () => {
    const result = evaluateCompliance({
      email_subject: 'Get guaranteed approval today',
    });
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.riskScore).toBeGreaterThan(0.2);
  });

  it('flags FHA references', () => {
    const result = evaluateCompliance({
      email_html: 'Our FHA streamline program helps brokers.',
    });
    expect(result.flags.some((f) => f.includes('fha'))).toBe(true);
  });

  it('raises score for consumer-facing content', () => {
    const result = evaluateCompliance({
      email_text: 'Hello brokers',
      consumer_facing: true,
    });
    expect(result.flags).toContain('consumer_facing');
  });

  it('raises score for Vesta insights', () => {
    const result = evaluateCompliance({
      email_text: 'Pipeline update',
      uses_vesta_insights: true,
    });
    expect(result.flags).toContain('vesta_insights');
  });
});

describe('stripPIIFromText', () => {
  it('redacts email addresses', () => {
    expect(stripPIIFromText('Contact john@example.com')).toContain('[REDACTED_EMAIL]');
  });

  it('redacts phone numbers', () => {
    expect(stripPIIFromText('Call 555-123-4567')).toContain('[REDACTED_PHONE]');
  });

  it('redacts SSN patterns', () => {
    expect(stripPIIFromText('SSN 123-45-6789')).toContain('[REDACTED_SSN]');
  });

  it('redacts loan numbers', () => {
    expect(stripPIIFromText('Loan #12345678')).toContain('[REDACTED_LOAN]');
  });
});

describe('canSendCampaign', () => {
  it('allows approved campaigns', () => {
    expect(canSendCampaign('approved', true, 'daily_rate_update', []).allowed).toBe(true);
  });

  it('blocks unapproved campaigns', () => {
    const result = canSendCampaign('pending_approval', true, 'daily_rate_update', []);
    expect(result.allowed).toBe(false);
  });

  it('allows trusted auto-send types when approval not required', () => {
    const result = canSendCampaign('draft', false, 'operational_tip', ['operational_tip']);
    expect(result.allowed).toBe(true);
  });
});

describe('buildIdempotencyKey', () => {
  it('builds stable daily keys', () => {
    const key = buildIdempotencyKey('daily_rate_update', new Date('2026-05-29T12:00:00Z'));
    expect(key).toBe('daily_rate_update:2026-05-29');
  });
});
