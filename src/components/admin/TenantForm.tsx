import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import type { Tenant } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface TenantFormProps {
  tenant: Tenant | null;
  onClose: () => void;
}

export function TenantForm({ tenant, onClose }: TenantFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subdomain: '',
    name: '',
    logo_url: '',
    primary_color: '',
    restricted_ingredients: '',
    system_prompt_override: '',
    subscription_tier: 'starter' as 'starter' | 'pro' | 'enterprise',
    is_active: true,
  });

  useEffect(() => {
    if (tenant) {
      setFormData({
        subdomain: tenant.subdomain,
        name: tenant.name,
        logo_url: tenant.branding.logo_url || '',
        primary_color: tenant.branding.primary_color || '',
        restricted_ingredients:
          tenant.settings.restricted_ingredients?.join(', ') || '',
        system_prompt_override: tenant.ai_config.system_prompt_override || '',
        subscription_tier: tenant.subscription_tier,
        is_active: tenant.is_active,
      });
    }
  }, [tenant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tenantData = {
        subdomain: formData.subdomain.toLowerCase().trim(),
        name: formData.name.trim(),
        branding: {
          logo_url: formData.logo_url.trim() || undefined,
          primary_color: formData.primary_color.trim() || undefined,
        },
        settings: {
          restricted_ingredients: formData.restricted_ingredients
            .split(',')
            .map((i) => i.trim())
            .filter((i) => i.length > 0),
        },
        ai_config: {
          system_prompt_override:
            formData.system_prompt_override.trim() || undefined,
        },
        subscription_tier: formData.subscription_tier,
        is_active: formData.is_active,
      };

      if (tenant) {
        // Update existing tenant
        const { error } = await supabase
          .from('tenants')
          .update(tenantData)
          .eq('id', tenant.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Tenant updated successfully',
        });
      } else {
        // Create new tenant
        const { error } = await supabase.from('tenants').insert(tenantData);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Tenant created successfully',
        });
      }

      onClose();
    } catch (error) {
      console.error('Error saving tenant:', error);
      toast({
        title: 'Error',
        description: 'Failed to save tenant',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {tenant ? 'Edit Tenant' : 'Create Tenant'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="subdomain">Subdomain *</Label>
              <Input
                id="subdomain"
                value={formData.subdomain}
                onChange={(e) =>
                  setFormData({ ...formData, subdomain: e.target.value })
                }
                placeholder="drsmith"
                required
                disabled={!!tenant}
              />
              <p className="mt-1 text-sm text-gray-500">
                {formData.subdomain}.recipegenerator.app
              </p>
            </div>

            <div>
              <Label htmlFor="name">Tenant Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Dr. Smith's Clinic"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input
                id="logo_url"
                value={formData.logo_url}
                onChange={(e) =>
                  setFormData({ ...formData, logo_url: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="primary_color">Primary Color</Label>
              <Input
                id="primary_color"
                type="color"
                value={formData.primary_color}
                onChange={(e) =>
                  setFormData({ ...formData, primary_color: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="restricted_ingredients">
              Restricted Ingredients (comma-separated)
            </Label>
            <Input
              id="restricted_ingredients"
              value={formData.restricted_ingredients}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  restricted_ingredients: e.target.value,
                })
              }
              placeholder="peanuts, shellfish, dairy"
            />
          </div>

          <div>
            <Label htmlFor="system_prompt_override">
              AI System Prompt Override
            </Label>
            <Textarea
              id="system_prompt_override"
              value={formData.system_prompt_override}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  system_prompt_override: e.target.value,
                })
              }
              placeholder="Custom instructions for AI..."
              rows={4}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="subscription_tier">Subscription Tier</Label>
              <select
                id="subscription_tier"
                value={formData.subscription_tier}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    subscription_tier: e.target.value as
                      | 'starter'
                      | 'pro'
                      | 'enterprise',
                  })
                }
                className="w-full rounded-md border border-gray-300 p-2"
              >
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <Label htmlFor="is_active">Status</Label>
              <select
                id="is_active"
                value={formData.is_active ? 'active' : 'inactive'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    is_active: e.target.value === 'active',
                  })
                }
                className="w-full rounded-md border border-gray-300 p-2"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading
                ? 'Saving...'
                : tenant
                  ? 'Update Tenant'
                  : 'Create Tenant'}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
