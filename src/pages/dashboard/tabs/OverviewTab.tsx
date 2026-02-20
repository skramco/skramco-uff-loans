import LoanOverview from '../../../components/borrower/LoanOverview';
import LoanTimeline from '../../../components/borrower/LoanTimeline';
import MonthlyPayment from '../../../components/borrower/MonthlyPayment';
import RateDetails from '../../../components/borrower/RateDetails';
import LoanOfficerCard from '../../../components/borrower/LoanOfficerCard';

interface Props {
  loan: any;
}

export default function OverviewTab({ loan }: Props) {
  return (
    <div className="space-y-6">
      <LoanOverview loan={loan} />

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Loan Progress</h3>
        <LoanTimeline loan={loan} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <MonthlyPayment loan={loan} />
        <RateDetails loan={loan} />
        <LoanOfficerCard loan={loan} />
      </div>
    </div>
  );
}
