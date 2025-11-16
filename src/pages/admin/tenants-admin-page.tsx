import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle } from 'lucide-react';
import type { Tenant } from '@/lib/types';
import { TenantForm } from '@/components/admin/TenantForm';
import { TenantCard } from '@/components/admin/TenantCard';
import { useAuth } from '@/contexts/AuthProvider';
import { DEFAULT_TENANT_ID } from '@/lib/constants';
import { useTenant } from '@/contexts/TenantContext';
import { TenantAdminSettings } from '@/components/admin/TenantAdminSettings';

export function TenantsAdminPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { tenant: currentTenant } = useTenant();

  // Check if user is super admin (admin in main tenant)
  const isSuperAdmin =
    profile?.is_admin === true && profile?.tenant_id === DEFAULT_TENANT_ID;
  const isTenantAdmin = profile?.is_admin === true && !isSuperAdmin;

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['admin-tenants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Tenant[];
    },
    // Only fetch if user is super admin
    enabled: isSuperAdmin,
  });

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingTenant(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingTenant(null);
    queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
  };

  // Render different views for super admin vs tenant admin
  if (isTenantAdmin && currentTenant) {
    // Tenant Admin View - only manage their own tenant
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Tenant Settings</h1>
          <p className="mt-2 text-neutral-600">
            Manage your tenant configuration, branding, and AI settings
          </p>
        </div>
        <TenantAdminSettings tenant={currentTenant} />
      </div>
    );
  }

  if (isSuperAdmin) {
    // Super Admin View - manage all tenants
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 p-4 text-blue-800">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">Super Admin Mode</span>
          <span className="text-sm">- You can view and manage all tenants</span>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Tenant Management</h1>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Tenant
          </Button>
        </div>

        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tenants.map((tenant) => (
              <TenantCard
                key={tenant.id}
                tenant={tenant}
                onEdit={() => handleEdit(tenant)}
              />
            ))}
          </div>
        )}

        {showForm && (
          <TenantForm tenant={editingTenant} onClose={handleFormClose} />
        )}
      </div>
    );
  }

  // Fallback - should not reach here if AdminRoute is working
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="rounded-lg bg-red-50 p-4 text-red-800">
        <p>Access denied. Admin privileges required.</p>
      </div>
    </div>
  );
}
