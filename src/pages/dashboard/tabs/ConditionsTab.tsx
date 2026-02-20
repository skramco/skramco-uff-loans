import LoanConditions from '../../../components/borrower/LoanConditions';

interface Props {
  loan: any;
}

export default function ConditionsTab({ loan }: Props) {
  return <LoanConditions loan={loan} />;
}
