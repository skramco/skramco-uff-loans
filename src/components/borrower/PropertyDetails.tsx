import { MapPin, Home, Building2, Calendar, Layers } from 'lucide-react';
import { formatCurrency } from './formatters';

interface PropertyDetailsProps {
  loan: any;
}

export default function PropertyDetails({ loan }: PropertyDetailsProps) {
  const property = loan.subjectProperty;
  if (!property) return null;

  const address = property.address;
  const fullAddress = address
    ? [address.line || address.fullStreetAddress, address.city, address.stateCode, address.zipCode]
        .filter(Boolean)
        .join(', ')
    : null;

  const propertyTypeLabels: Record<string, string> = {
    SingleFamily: 'Single Family',
    Condominium: 'Condominium',
    Townhouse: 'Townhouse',
    MultiFamily: 'Multi-Family',
    ManufacturedHousing: 'Manufactured Housing',
    Cooperative: 'Cooperative',
  };

  const usageLabels: Record<string, string> = {
    PrimaryResidence: 'Primary Residence',
    SecondHome: 'Second Home',
    InvestmentProperty: 'Investment Property',
  };

  const propertyType = propertyTypeLabels[property.propertyType] || property.propertyType;
  const usageType = usageLabels[property.intendedUsageType] || property.intendedUsageType;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Property Details</h3>
      <p className="text-sm text-gray-500 mb-6">Subject property information</p>

      {fullAddress && (
        <div className="bg-slate-50 rounded-xl p-4 mb-6 flex items-start gap-3">
          <MapPin className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-900">{address.line || address.fullStreetAddress}</p>
            <p className="text-sm text-gray-600">
              {[address.city, address.stateCode, address.zipCode].filter(Boolean).join(', ')}
            </p>
            {address.county && (
              <p className="text-xs text-gray-500 mt-1">{address.county}</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {property.actualValueAmount && (
          <InfoCard
            icon={<Home className="w-4 h-4" />}
            label="Appraised Value"
            value={formatCurrency(property.actualValueAmount)}
          />
        )}
        {propertyType && (
          <InfoCard
            icon={<Building2 className="w-4 h-4" />}
            label="Property Type"
            value={propertyType}
          />
        )}
        {usageType && (
          <InfoCard
            icon={<Home className="w-4 h-4" />}
            label="Occupancy"
            value={usageType}
          />
        )}
        {property.yearBuilt && (
          <InfoCard
            icon={<Calendar className="w-4 h-4" />}
            label="Year Built"
            value={property.yearBuilt.toString()}
          />
        )}
        {property.numberOfUnits && (
          <InfoCard
            icon={<Layers className="w-4 h-4" />}
            label="Units"
            value={property.numberOfUnits.toString()}
          />
        )}
        {property.estateType && (
          <InfoCard
            icon={<Building2 className="w-4 h-4" />}
            label="Estate Type"
            value={property.estateType.replace(/([A-Z])/g, ' $1').trim()}
          />
        )}
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1 text-gray-500">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}
