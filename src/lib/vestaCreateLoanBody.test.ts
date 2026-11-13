import { describe, expect, it } from 'vitest';
import { buildVestaCreateLoanHttpBody } from './vestaCreateLoanBody';
import {
  isServiceRoleRequest,
  serviceFunctionHeaders,
} from '../../supabase/functions/_shared/serviceFunctionAuth';

describe('buildVestaCreateLoanHttpBody', () => {
  it('sends Mortgage plus phoneNumbers, not the retired borrower fields', () => {
    const body = buildVestaCreateLoanHttpBody({
      loanPurpose: 'Purchase',
      loanType: 'Conventional',
      loanAmount: 355000,
      borrowerFirstName: 'Test',
      borrowerLastName: 'Homeowner',
      borrowerEmail: 'borrower@example.com',
      borrowerPhone: '3145550100',
      urlaMapped: {
        property: {
          address: '1 Main St',
          city: 'St Louis',
          state: 'MO',
          zip: '63101',
          propertyType: 'Single Family',
        },
      },
    });

    expect(body.loanType).toBe('Mortgage');
    expect(body.loanPurpose).toBe('Purchase');
    expect(body.loanProduct).toEqual({ mortgageType: 'Conventional' });
    expect(body.refinanceCashOutDeterminationType).toBeUndefined();
    const borrower = (body.borrowers as Record<string, unknown>[])[0];
    expect(borrower.phoneNumber).toBeUndefined();
    expect(borrower.phoneNumbers).toEqual([
      { type: 'Mobile', number: '3145550100' },
    ]);
    const property = body.subjectProperty as {
      address: Record<string, unknown>;
    };
    expect(property.address.state).toBeUndefined();
    expect(property.address.stateCode).toBe('MO');
  });

  it('maps cash-out refinance onto Refinance plus CashOut', () => {
    const body = buildVestaCreateLoanHttpBody({
      loanPurpose: 'Cash-Out Refinance',
      loanType: 'Conventional',
      urlaMapped: { property: { state: 'Missouri' } },
    });

    expect(body.loanPurpose).toBe('Refinance');
    expect(body.refinanceCashOutDeterminationType).toBe('CashOut');
    const property = body.subjectProperty as {
      address: Record<string, unknown>;
    };
    expect(property.address.state).toBe('Missouri');
    expect(property.address.stateCode).toBeUndefined();
  });
});

describe('service function auth', () => {
  it('sends the service key only on apikey', () => {
    expect(serviceFunctionHeaders('sb_secret_example')).toEqual({
      apikey: 'sb_secret_example',
      'Content-Type': 'application/json',
    });
  });

  it('accepts the service key on apikey or as a matching bearer', () => {
    const secret = 'sb_secret_example';
    const onApiKey = new Request('https://example.test', {
      headers: { apikey: secret },
    });
    const onBearer = new Request('https://example.test', {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const publishable = new Request('https://example.test', {
      headers: {
        apikey: 'sb_publishable_example',
        Authorization: `Bearer ${secret}`,
      },
    });

    expect(isServiceRoleRequest(onApiKey, secret)).toBe(true);
    expect(isServiceRoleRequest(onBearer, secret)).toBe(true);
    expect(isServiceRoleRequest(publishable, secret)).toBe(true);
    expect(isServiceRoleRequest(onApiKey, '')).toBe(false);
    expect(
      isServiceRoleRequest(
        new Request('https://example.test', {
          headers: { apikey: 'sb_publishable_example' },
        }),
        secret
      )
    ).toBe(false);
  });
});
