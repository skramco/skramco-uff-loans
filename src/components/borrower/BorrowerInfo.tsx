import { User, Mail, Phone, MapPin, Briefcase, Calendar } from 'lucide-react';
import { formatDate, formatPhone } from './formatters';

interface BorrowerInfoProps {
  loan: any;
}

export default function BorrowerInfo({ loan }: BorrowerInfoProps) {
  const borrowers: any[] = loan.borrowers || [];
  if (borrowers.length === 0) return null;

  const primary = borrowers[0];
  const phoneNumbers: any[] = primary.phoneNumbers || [];

  const citizenshipLabels: Record<string, string> = {
    USCitizen: 'U.S. Citizen',
    PermanentResidentAlien: 'Permanent Resident',
    NonPermanentResidentAlien: 'Non-Permanent Resident',
  };

  const maritalLabels: Record<string, string> = {
    Married: 'Married',
    Separated: 'Separated',
    Unmarried: 'Unmarried',
  };

  const employer = loan.incomes?.find((i: any) => i.incomeType === 'Employment')?.employer;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-5">Borrower Information</h3>

      <div className="flex items-center gap-4 mb-5">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {primary.firstName?.[0]?.toUpperCase() || ''}
          {primary.lastName?.[0]?.toUpperCase() || ''}
        </div>
        <div>
          <p className="font-semibold text-gray-900">
            {primary.fullName || [primary.firstName, primary.middleName, primary.lastName, primary.suffixName].filter(Boolean).join(' ')}
          </p>
          {primary.dateOfBirth && (
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3" />
              DOB: {formatDate(primary.dateOfBirth)}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {primary.emailAddress && (
          <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={primary.emailAddress} />
        )}

        {phoneNumbers.map((pn: any, idx: number) => (
          <InfoRow
            key={idx}
            icon={<Phone className="w-4 h-4" />}
            label={pn.type || 'Phone'}
            value={formatPhone(pn.number)}
          />
        ))}

        {primary.citizenshipType && (
          <InfoRow
            icon={<User className="w-4 h-4" />}
            label="Citizenship"
            value={citizenshipLabels[primary.citizenshipType] || primary.citizenshipType}
          />
        )}

        {primary.maritalStatus && (
          <InfoRow
            icon={<User className="w-4 h-4" />}
            label="Marital Status"
            value={maritalLabels[primary.maritalStatus] || primary.maritalStatus}
          />
        )}

        {primary.currentAddress && (
          <InfoRow
            icon={<MapPin className="w-4 h-4" />}
            label="Current Address"
            value={
              [
                primary.currentAddress.line || primary.currentAddress.fullStreetAddress,
                primary.currentAddress.city,
                primary.currentAddress.stateCode,
                primary.currentAddress.zipCode,
              ]
                .filter(Boolean)
                .join(', ')
            }
          />
        )}

        {primary.currentAddress?.occupancyType && (
          <InfoRow
            icon={<MapPin className="w-4 h-4" />}
            label="Housing"
            value={
              primary.currentAddress.occupancyType === 'Rent'
                ? `Renting ($${primary.currentAddress.monthlyRentAmount?.toLocaleString() || '--'}/mo)`
                : primary.currentAddress.occupancyType
            }
          />
        )}

        {employer && (
          <>
            <div className="pt-2 mt-2 border-t border-gray-100">
              <InfoRow
                icon={<Briefcase className="w-4 h-4" />}
                label="Employer"
                value={employer.name || '--'}
              />
            </div>
            {employer.jobTitle && (
              <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Title" value={employer.jobTitle} />
            )}
            {employer.startDate && (
              <InfoRow
                icon={<Calendar className="w-4 h-4" />}
                label="Since"
                value={formatDate(employer.startDate)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-500 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900 break-words">{value}</p>
      </div>
    </div>
  );
}
