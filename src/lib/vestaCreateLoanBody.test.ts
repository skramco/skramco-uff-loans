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

  it('maps portal application sections onto the Vesta loan body', () => {
    const body = buildVestaCreateLoanHttpBody({
      loanPurpose: 'Purchase',
      loanAmount: 270000,
      borrowerFirstName: 'Cindy',
      borrowerLastName: 'Smith',
      borrowerEmail: 'fivesmiths2000@yahoo.com',
      borrowerPhone: '9185201586',
      urlaMapped: {
        personalInfo: {
          dateOfBirth: '01171974',
          citizenship: 'U.S. Citizen',
          maritalStatus: 'Married',
          currentAddress: '1806 E 10th St',
          currentCity: 'Okmulgee',
          currentState: 'OK',
          currentZip: '74447',
          housingStatus: 'Own',
          yearsAtAddress: 26,
        },
        property: {
          address: '5775 Frankfurt',
          city: 'Beggs',
          state: 'OK',
          zip: '74421',
          county: 'Okmulgee',
          propertyType: 'Single Family',
          occupancyType: 'Primary Residence',
          propertyValue: 275000,
        },
        employment: {
          position: 'HR Specialist',
          baseIncome: 4804,
          employerName: 'College of the Muscogee Nation',
          employerPhone: '9185492800',
          yearsEmployed: 5,
          totalMonthlyIncome: 4804,
          employmentStartDate: '01252021',
        },
        assets: {
          totalAssets: 6000,
          savingsAccounts: 2000,
          checkingAccounts: 4000,
        },
        liabilities: {
          carLoans: 1200,
          studentLoans: 300,
          creditCardDebt: 300,
          totalMonthlyDebt: 1800,
        },
      },
    });

    const borrower = (body.borrowers as Record<string, unknown>[])[0];
    expect(borrower.dateOfBirth).toBe('1974-01-17');
    expect(borrower.citizenshipType).toBe('USCitizen');
    expect(borrower.maritalStatus).toBe('Married');
    expect(borrower.intentToOccupy).toBe(true);
    expect(borrower.currentAddress).toEqual({
      line: '1806 E 10th St',
      city: 'Okmulgee',
      stateCode: 'OK',
      zipCode: '74447',
      occupancyType: 'Own',
    });
    expect(JSON.stringify(borrower)).not.toContain('yearsAtAddress');

    const property = body.subjectProperty as Record<string, unknown>;
    expect(property.propertyType).toBe('SingleFamily');
    expect(property.estimatedValueAmount).toBe(275000);
    expect(property.intendedUsageType).toBe('PrimaryResidence');
    expect(property.address).toEqual({
      line: '5775 Frankfurt',
      city: 'Beggs',
      stateCode: 'OK',
      zipCode: '74421',
      county: 'Okmulgee',
    });

    expect(body.incomes).toEqual([
      {
        incomeType: 'Employment',
        payType: 'Salaried',
        borrowerRef: 'primary',
        employer: {
          status: 'Current',
          employmentClassificationType: 'Primary',
          name: 'College of the Muscogee Nation',
          jobTitle: 'HR Specialist',
          phoneNumber: '9185492800',
          startDate: '2021-01-25',
          numberOfMonthsInThisLineOfWork: 60,
        },
        statedEmploymentBaseIncome: { amount: 4804, amountType: 'Monthly' },
      },
    ]);
    expect(body.assets).toEqual([
      {
        assetType: 'CheckingAccount',
        assetValue: 4000,
        borrowersRefs: ['primary'],
      },
      {
        assetType: 'SavingsAccount',
        assetValue: 2000,
        borrowersRefs: ['primary'],
      },
    ]);
    expect(body.liabilities).toEqual([
      {
        liabilityType: 'RevolvingCreditLine',
        monthlyPaymentAmount: 300,
        borrowersRefs: ['primary'],
      },
      {
        liabilityType: 'SecuredInstallment',
        monthlyPaymentAmount: 1200,
        borrowersRefs: ['primary'],
      },
      {
        liabilityType: 'UnsecuredInstallment',
        monthlyPaymentAmount: 300,
        borrowersRefs: ['primary'],
      },
    ]);
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
