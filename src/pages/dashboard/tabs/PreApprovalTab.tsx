import PreApprovalSection from '../../../components/borrower/PreApprovalSection';

interface Props {
  loan: any;
}

export default function PreApprovalTab({ loan }: Props) {
  return <PreApprovalSection loan={loan} />;
}
