export function formatCurrency(value: number | undefined | null): string {
  if (value == null) return '--';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrencyExact(value: number | undefined | null): string {
  if (value == null) return '--';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number | undefined | null, decimals = 2): string {
  if (value == null) return '--';
  return `${value.toFixed(decimals)}%`;
}

export function formatDate(value: string | undefined | null): string {
  if (!value) return '--';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '--';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatPhone(value: string | undefined | null): string {
  if (!value) return '--';
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return value;
}

export function camelToTitle(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

export function formatLoanStage(stage: string): string {
  const map: Record<string, string> = {
    Origination: 'Origination',
    Processing: 'Processing',
    Underwriting: 'Underwriting',
    Docs: 'Docs',
    Funding: 'Funding',
    'Post Closing': 'Post Closing',
    Setup: 'Setup',
    Shipped: 'Shipped',
  };
  return map[stage] || stage;
}
