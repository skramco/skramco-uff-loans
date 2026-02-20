import FinancialSummary from '../../../components/borrower/FinancialSummary';
import CashToClose from '../../../components/borrower/CashToClose';
import KeyDates from '../../../components/borrower/KeyDates';

interface Props {
  loan: any;
}

export default function FinancialsTab({ loan }: Props) {
  return (
    <div className="space-y-6">
      <FinancialSummary loan={loan} />

      <div className="grid lg:grid-cols-2 gap-6">
        <CashToClose loan={loan} />
        <KeyDates loan={loan} />
      </div>
    </div>
  );
}
