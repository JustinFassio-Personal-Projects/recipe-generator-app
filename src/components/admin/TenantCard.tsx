import { Edit, Globe, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Tenant } from '@/lib/types';

interface TenantCardProps {
  tenant: Tenant;
  onEdit: () => void;
}

export function TenantCard({ tenant, onEdit }: TenantCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          {tenant.branding.logo_url ? (
            <img
              src={tenant.branding.logo_url}
              alt={tenant.name}
              className="h-12 w-12 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
              <Globe className="h-6 w-6 text-gray-400" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{tenant.name}</h3>
            <p className="text-sm text-gray-500">{tenant.subdomain}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {tenant.is_active ? (
            <Check className="h-5 w-5 text-green-500" />
          ) : (
            <X className="h-5 w-5 text-red-500" />
          )}
        </div>
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Subscription:</span>
          <span className="font-medium capitalize">
            {tenant.subscription_tier}
          </span>
        </div>
        {tenant.settings.restricted_ingredients &&
          tenant.settings.restricted_ingredients.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Restrictions:</span>
              <span className="font-medium">
                {tenant.settings.restricted_ingredients.length} items
              </span>
            </div>
          )}
      </div>

      <div className="flex gap-2">
        <Button onClick={onEdit} className="flex-1" variant="outline">
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button
          onClick={() =>
            window.open(`http://${tenant.subdomain}.localhost:5174`, '_blank')
          }
          className="flex-1"
          variant="secondary"
        >
          <Globe className="mr-2 h-4 w-4" />
          Visit
        </Button>
      </div>
    </div>
  );
}
