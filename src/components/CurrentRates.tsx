import { useState, useEffect } from 'react';
import { TrendingDown, Loader, AlertCircle } from 'lucide-react';

interface RateData {
  rate: number;
  netPrice: number;
  creditOrPoints: number;
  lastUpdated: Date;
  loanAmount: number;
}

interface CurrentRatesProps {
  showConventional?: boolean;
  showFHA?: boolean;
  showVA?: boolean;
}

export default function CurrentRates({ showConventional = false, showFHA = false, showVA = false }: CurrentRatesProps) {
  const [conventionalRate, setConventionalRate] = useState<RateData | null>(null);
  const [fhaRate, setFhaRate] = useState<RateData | null>(null);
  const [vaRate, setVARate] = useState<RateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentRates();
  }, []);

  const fetchCurrentRates = async () => {
    try {
      setLoading(true);
      setError(null);

      const conventionalPayload = {
        options: {
          lockTerm: 30,
          productFamilies: ["Conventional"],
          channel: "Retail",
          includeRulesResults: false,
          branchCode: "West",
          productShortNames: ["CON30FFN"]
        },
        subjectProperty: {
          state: "CA",
          purchasePrice: 500000,
          appraisedValue: 500000,
          propertyType: "SingleFamilyResidence",
          occupancy: "OwnerOccupied"
        },
        borrower: {
          debtToIncomeRatio: 20,
          citizenship: "USCitizen",
          isSelfEmployed: false,
          isFirstTimeHomeBuyer: false,
          monthsReserves: 36
        },
        loan: {
          loanPurpose: "Purchase",
          baseLoanAmount: 375000,
          subordinateFinancingAmount: 0,
          representativeFico: 780,
          ltv: 75,
          cltv: 75,
          docType: "FullDoc",
          escrowType: "TaxesAndInsurance",
          downPaymentAmount: 125000,
          isSubordinateFinancing: false,
          compensationType: "BPC",
          compensationPoints: 1.000,
          submissionDate: new Date().toISOString()
        }
      };

      const fhaPayload = {
        options: {
          lockTerm: 30,
          productFamilies: ["FHA"],
          channel: "Retail",
          includeRulesResults: false,
          branchCode: "West",
          productShortNames: ["FHA30F"]
        },
        subjectProperty: {
          state: "CA",
          purchasePrice: 500000,
          appraisedValue: 500000,
          propertyType: "SingleFamilyResidence",
          occupancy: "OwnerOccupied"
        },
        borrower: {
          debtToIncomeRatio: 20,
          citizenship: "USCitizen",
          isSelfEmployed: false,
          isFirstTimeHomeBuyer: false,
          monthsReserves: 36
        },
        loan: {
          loanPurpose: "Purchase",
          baseLoanAmount: 482500,
          subordinateFinancingAmount: 0,
          representativeFico: 640,
          ltv: 96.5,
          cltv: 96.5,
          docType: "FullDoc",
          escrowType: "TaxesAndInsurance",
          downPaymentAmount: 17500,
          isSubordinateFinancing: false,
          compensationType: "BPC",
          compensationPoints: 1.000,
          submissionDate: new Date().toISOString()
        }
      };

      const vaPayload = {
        options: {
          lockTerm: 30,
          productFamilies: ["VA"],
          channel: "Retail",
          includeRulesResults: false,
          branchCode: "West",
          productShortNames: ["VA30F"]
        },
        subjectProperty: {
          state: "CA",
          purchasePrice: 500000,
          appraisedValue: 500000,
          propertyType: "SingleFamilyResidence",
          occupancy: "OwnerOccupied"
        },
        borrower: {
          debtToIncomeRatio: 20,
          citizenship: "USCitizen",
          isSelfEmployed: false,
          isFirstTimeHomeBuyer: false,
          monthsReserves: 36
        },
        loan: {
          loanPurpose: "Purchase",
          baseLoanAmount: 500000,
          subordinateFinancingAmount: 0,
          representativeFico: 680,
          ltv: 100,
          cltv: 100,
          docType: "FullDoc",
          escrowType: "TaxesAndInsurance",
          downPaymentAmount: 0,
          isSubordinateFinancing: false,
          compensationType: "BPC",
          compensationPoints: 1.000,
          submissionDate: new Date().toISOString()
        }
      };

      const [conventionalResponse, fhaResponse, vaResponse] = await Promise.all([
        fetch('https://pricing-engine-service.dev.ratesboard.com/product-pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(conventionalPayload)
        }),
        fetch('https://pricing-engine-service.dev.ratesboard.com/product-pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fhaPayload)
        }),
        fetch('https://pricing-engine-service.dev.ratesboard.com/product-pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(vaPayload)
        })
      ]);

      if (!conventionalResponse.ok || !fhaResponse.ok || !vaResponse.ok) {
        throw new Error('Failed to fetch rates');
      }

      const conventionalData = await conventionalResponse.json();
      const fhaData = await fhaResponse.json();
      const vaData = await vaResponse.json();

      const processRateData = (data: any, loanAmount: number) => {
        if (Array.isArray(data) && data.length > 0) {
          const productResult = data[0];

          if (productResult.basePrices?.priceGrid?.['30'] && productResult.adjustments) {
            const rates = productResult.basePrices.priceGrid['30'];
            const totalAdjustmentPoints = productResult.adjustments.reduce((sum: number, adj: any) => {
              return sum + (adj.points || 0);
            }, 0);

            const threshold = 0.150;
            let bestRate = null;

            for (const rateItem of rates) {
              const basePrice = rateItem.basePrice || 0;
              const netPrice = basePrice - totalAdjustmentPoints;
              const diff = Math.abs(netPrice - 100);

              if (diff <= threshold) {
                if (!bestRate || rateItem.rate < bestRate.rate) {
                  bestRate = {
                    rate: rateItem.rate,
                    netPrice: netPrice,
                    creditOrPoints: netPrice - 100
                  };
                }
              }
            }

            let closestRate = bestRate;

            if (closestRate) {
              return { ...closestRate, lastUpdated: new Date(), loanAmount };
            }
          }
        }
        return null;
      };

      const convRate = processRateData(conventionalData, 375000);
      const fRate = processRateData(fhaData, 482500);
      const vRate = processRateData(vaData, 500000);

      if (convRate) setConventionalRate(convRate);
      if (fRate) setFhaRate(fRate);
      if (vRate) setVARate(vRate);

      if (!convRate && !fRate && !vRate) {
        setError('No rates available at this time');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rates');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="flex flex-col items-center justify-center py-8">
          <Loader className="w-12 h-12 text-red-600 animate-spin mb-4" />
          <p className="text-gray-600">Loading current rates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchCurrentRates}
            className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!conventionalRate && !fhaRate && !vaRate) {
    return null;
  }

  const renderRateCard = (rateData: RateData, title: string, isFHA: boolean = false, isVA: boolean = false) => {
    const isCredit = rateData.creditOrPoints < 0;
    const pointsValue = Math.abs(rateData.creditOrPoints);

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateMonthlyPayment = (principal: number, annualRate: number, years: number) => {
    const monthlyRate = annualRate / 100 / 12;
    const numberOfPayments = years * 12;
    const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
                    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    return payment;
  };

  const calculateAPR = (principal: number, annualRate: number, originationFeePercent: number, otherClosingCosts: number, years: number) => {
    const monthlyPayment = calculateMonthlyPayment(principal, annualRate, years);
    const originationFee = principal * (originationFeePercent / 100);
    const totalClosingCosts = originationFee + otherClosingCosts;
    const amountFinanced = principal - totalClosingCosts;

    let apr = annualRate;
    let tolerance = 0.001;
    let maxIterations = 1000;

    for (let i = 0; i < maxIterations; i++) {
      const monthlyAPR = apr / 100 / 12;
      const numberOfPayments = years * 12;
      const presentValue = monthlyPayment * (1 - Math.pow(1 + monthlyAPR, -numberOfPayments)) / monthlyAPR;

      if (Math.abs(presentValue - amountFinanced) < tolerance) {
        break;
      }

      if (presentValue > amountFinanced) {
        apr += 0.0001;
      } else {
        apr -= 0.0001;
      }
    }

    return apr;
  };

    const monthlyPayment = calculateMonthlyPayment(rateData.loanAmount, rateData.rate, 30);
    const originationFee = rateData.loanAmount * 0.01;
    const otherClosingCosts = 7500;
    const totalClosingCosts = originationFee + otherClosingCosts;
    const apr = calculateAPR(rateData.loanAmount, rateData.rate, 1.0, otherClosingCosts, 30);

    const purchasePrice = "$500,000";
    const downPayment = isVA ? "0%" : (isFHA ? "3.5%" : "25%");
    const fico = isVA ? "680" : (isFHA ? "640" : "780");

    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <TrendingDown className="w-5 h-5" />
            <h4 className="text-lg font-bold">{title}</h4>
          </div>
          <div className="text-xs text-white/70">
            Updated {formatDateTime(rateData.lastUpdated)}
          </div>
        </div>

        <div className="text-center mb-4">
          <div className="text-4xl font-bold mb-1">{rateData.rate.toFixed(3)}%</div>
          <div className="text-sm text-white/80">30-Year Fixed Rate</div>
          <div className="text-xs text-white/70 mt-1">{apr.toFixed(3)}% APR</div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-sm text-white/90 mb-1 font-semibold">
              {isCredit ? 'Lender Credit' : 'Discount Points'}
            </div>
            <div className="text-2xl font-bold">
              {isCredit ? '-' : '+'}{pointsValue.toFixed(3)}%
            </div>
            <div className="text-xs text-white/70 mt-1">
              {isCredit
                ? 'Credit to use towards closing costs'
                : 'Points required at closing'}
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-sm text-white/90 mb-1 font-semibold">
              Monthly P&I
            </div>
            <div className="text-2xl font-bold">
              ${monthlyPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-white/70 mt-1">
              {isFHA ? 'MIP not included' : (isVA ? 'Funding fee not included' : 'Principal & Interest only')}
            </div>
          </div>
        </div>

        <div className="bg-white/10 rounded-lg p-3 mb-4">
          <p className="text-xs text-white/80 leading-relaxed">
            Based on: {purchasePrice} purchase, {downPayment} down, {fico} FICO, owner-occupied SFR in CA.
            Includes a 1.000% origination fee to be paid at closing as part of closing costs. Additional closing costs may apply including
            processing, appraisal, title, settlement, and other fees.
            {isFHA && ' MIP will be calculated and added to your monthly payment upon submission.'}
            {isVA && ' VA funding fee will be calculated and may be financed into the loan amount.'}
          </p>
        </div>

        <button
          onClick={fetchCurrentRates}
          className="w-full px-4 py-2 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 transition-all text-sm"
        >
          Refresh Rate
        </button>
      </div>
    );
  };

  return (
    <div>
      {showConventional && conventionalRate && renderRateCard(conventionalRate, 'Current Rate', false, false)}
      {showFHA && fhaRate && renderRateCard(fhaRate, 'Current Rate', true, false)}
      {showVA && vaRate && renderRateCard(vaRate, 'Current Rate', false, true)}
    </div>
  );
}
