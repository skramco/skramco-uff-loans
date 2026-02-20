import { User, Mail, Phone, Shield } from 'lucide-react';
import { formatPhone } from './formatters';

interface LoanOfficerCardProps {
  loan: any;
}

export default function LoanOfficerCard({ loan }: LoanOfficerCardProps) {
  const originator = loan.loanOriginator;
  if (!originator) return null;

  const name = originator.fullName;
  const email = originator.email;
  const phone = originator.phoneNumber;
  const nmlsId = originator.nmlsId;
  const branch = originator.organizationBranchName;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-5">Your Loan Officer</h3>

      <div className="flex items-center gap-4 mb-5">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {name
            ? name
                .split(' ')
                .map((n: string) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()
            : 'LO'}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-lg">{name || 'Loan Officer'}</p>
          {nmlsId && (
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <Shield className="w-3 h-3" />
              NMLS# {nmlsId}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {email && (
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-3 text-sm text-gray-700 hover:text-red-600 transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-gray-100 group-hover:bg-red-50 flex items-center justify-center transition-colors">
              <Mail className="w-4 h-4 text-gray-500 group-hover:text-red-600" />
            </div>
            {email}
          </a>
        )}
        {phone && (
          <a
            href={`tel:${phone.replace(/\D/g, '')}`}
            className="flex items-center gap-3 text-sm text-gray-700 hover:text-red-600 transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-gray-100 group-hover:bg-red-50 flex items-center justify-center transition-colors">
              <Phone className="w-4 h-4 text-gray-500 group-hover:text-red-600" />
            </div>
            {phone.includes('(') ? phone : formatPhone(phone)}
          </a>
        )}
      </div>

      {branch && (
        <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">{branch}</p>
      )}
    </div>
  );
}
