import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Tenant } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Save, Palette, Settings, Sparkles } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TenantAdminSettingsProps {
  tenant: Tenant;
}

export function TenantAdminSettings({ tenant }: TenantAdminSettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Branding state
  const [logoUrl, setLogoUrl] = useState(tenant.branding?.logo_url || '');
  const [primaryColor, setPrimaryColor] = useState(
    tenant.branding?.primary_color || '#000000'
  );
  const [secondaryColor, setSecondaryColor] = useState(
    tenant.branding?.secondary_color || '#666666'
  );
  const [faviconUrl, setFaviconUrl] = useState(
    tenant.branding?.favicon_url || ''
  );

  // Settings state
  const [specialty, setSpecialty] = useState(tenant.settings?.specialty || '');
  const [restrictedIngredients, setRestrictedIngredients] = useState(
    tenant.settings?.restricted_ingredients?.join(', ') || ''
  );
  const [instructionStyle, setInstructionStyle] = useState(
    tenant.settings?.instruction_style || ''
  );
  const [defaultUnits, setDefaultUnits] = useState<'metric' | 'imperial'>(
    tenant.settings?.default_units || 'imperial'
  );

  // AI Config state
  const [systemPromptOverride, setSystemPromptOverride] = useState(
    tenant.ai_config?.system_prompt_override || ''
  );

  const updateTenantMutation = useMutation({
    mutationFn: async (updates: Partial<Tenant>) => {
      const { data, error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', tenant.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', tenant.subdomain] });
      toast({
        title: 'Success',
        description: 'Tenant settings updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update settings: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleSaveBranding = () => {
    updateTenantMutation.mutate({
      branding: {
        logo_url: logoUrl || undefined,
        primary_color: primaryColor || undefined,
        secondary_color: secondaryColor || undefined,
        favicon_url: faviconUrl || undefined,
      },
    });
  };

  const handleSaveSettings = () => {
    updateTenantMutation.mutate({
      settings: {
        specialty: specialty || undefined,
        restricted_ingredients: restrictedIngredients
          ? restrictedIngredients.split(',').map((s) => s.trim())
          : undefined,
        instruction_style: instructionStyle || undefined,
        default_units: defaultUnits,
      },
    });
  };

  const handleSaveAI = () => {
    updateTenantMutation.mutate({
      ai_config: {
        system_prompt_override: systemPromptOverride || undefined,
        persona_overrides: tenant.ai_config?.persona_overrides,
      },
    });
  };

  return (
    <Tabs defaultValue="branding" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="branding">
          <Palette className="mr-2 h-4 w-4" />
          Branding
        </TabsTrigger>
        <TabsTrigger value="settings">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </TabsTrigger>
        <TabsTrigger value="ai">
          <Sparkles className="mr-2 h-4 w-4" />
          AI Configuration
        </TabsTrigger>
      </TabsList>

      <TabsContent value="branding">
        <Card>
          <CardHeader>
            <CardTitle>Branding & Appearance</CardTitle>
            <CardDescription>
              Customize your tenant's logo, colors, and visual identity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="logo-url">Logo URL</Label>
              <Input
                id="logo-url"
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
              />
              {logoUrl && (
                <div className="mt-2">
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="h-12 w-12 rounded object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="primary-color">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-20"
                />
                <Input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#000000"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="secondary-color">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary-color"
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="h-10 w-20"
                />
                <Input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#666666"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="favicon-url">Favicon URL</Label>
              <Input
                id="favicon-url"
                type="url"
                value={faviconUrl}
                onChange={(e) => setFaviconUrl(e.target.value)}
                placeholder="https://example.com/favicon.ico"
              />
            </div>

            <Button
              onClick={handleSaveBranding}
              disabled={updateTenantMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Branding
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="settings">
        <Card>
          <CardHeader>
            <CardTitle>Tenant Settings</CardTitle>
            <CardDescription>
              Configure specialty focus, dietary restrictions, and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="specialty">Specialty</Label>
              <Input
                id="specialty"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="e.g., Pediatric Nutrition, Sports Medicine"
              />
              <p className="mt-1 text-sm text-neutral-500">
                Your area of focus or expertise
              </p>
            </div>

            <div>
              <Label htmlFor="restricted-ingredients">
                Restricted Ingredients
              </Label>
              <Textarea
                id="restricted-ingredients"
                value={restrictedIngredients}
                onChange={(e) => setRestrictedIngredients(e.target.value)}
                placeholder="peanuts, shellfish, gluten"
                rows={3}
              />
              <p className="mt-1 text-sm text-neutral-500">
                Comma-separated list of ingredients to exclude from all recipes
              </p>
            </div>

            <div>
              <Label htmlFor="instruction-style">Instruction Style</Label>
              <Input
                id="instruction-style"
                value={instructionStyle}
                onChange={(e) => setInstructionStyle(e.target.value)}
                placeholder="e.g., detailed, concise, beginner-friendly"
              />
              <p className="mt-1 text-sm text-neutral-500">
                Preferred style for recipe instructions
              </p>
            </div>

            <div>
              <Label htmlFor="default-units">Default Units</Label>
              <select
                id="default-units"
                value={defaultUnits}
                onChange={(e) =>
                  setDefaultUnits(e.target.value as 'metric' | 'imperial')
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="imperial">Imperial (cups, oz, etc.)</option>
                <option value="metric">Metric (grams, ml, etc.)</option>
              </select>
            </div>

            <Button
              onClick={handleSaveSettings}
              disabled={updateTenantMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="ai">
        <Card>
          <CardHeader>
            <CardTitle>AI Configuration</CardTitle>
            <CardDescription>
              Customize how AI generates recipes for your tenant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="system-prompt-override">
                System Prompt Override
              </Label>
              <Textarea
                id="system-prompt-override"
                value={systemPromptOverride}
                onChange={(e) => setSystemPromptOverride(e.target.value)}
                placeholder="Add custom instructions for the AI to follow when generating recipes..."
                rows={10}
                className="font-mono text-sm"
              />
              <p className="mt-1 text-sm text-neutral-500">
                Custom system prompt that will be prepended to the default AI
                instructions. Use this to add tenant-specific guidelines, tone,
                or requirements.
              </p>
            </div>

            <Button
              onClick={handleSaveAI}
              disabled={updateTenantMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              Save AI Configuration
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
