import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useRecipe, usePublicRecipe } from '@/hooks/use-recipes';
import { useState, useEffect, useCallback } from 'react';
import { RecipeView } from '@/components/recipes/recipe-view';
import { VersionSelector } from '@/components/recipes/version-selector';
import { RecipeAnalyticsDashboard } from '@/components/recipes/recipe-analytics-dashboard';
import { createDaisyUICardClasses } from '@/lib/card-migration';
import { createDaisyUISkeletonClasses } from '@/lib/skeleton-migration';
import { ChefHat, GitBranch, ArrowLeft } from 'lucide-react';
import { RecipeDiagnostic } from '@/components/debug/RecipeDiagnostic';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthProvider';
import { recipeApi } from '@/lib/api';
import { ratingApi } from '@/lib/api/features/rating-api';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { RecipeViewInstructionsModal } from '@/components/welcome/RecipeViewInstructionsModal';
import { ProgressiveImage } from '@/components/shared/ProgressiveImage';
import { getSafeImageUrl } from '@/lib/image-cache-utils';
import { FALLBACK_IMAGE_PATH } from '@/lib/constants';
import type { Recipe, RecipeVersion } from '@/lib/types';

export function ViewRecipePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // Extract version parameter from URL
  const searchParams = new URLSearchParams(location.search);
  const requestedVersion = searchParams.get('version')
    ? parseInt(searchParams.get('version')!)
    : null;

  // Debug route parameters
  console.log('🔍 [ViewRecipePage] Route debug:', {
    id,
    requestedVersion,
    fullUrl: window.location.href,
    pathname: location.pathname,
    search: location.search,
  });

  // Debug logging
  console.log('🔍 [ViewRecipePage] Component initialized:', {
    recipeId: id,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    isProduction: import.meta.env.PROD,
    hasUser: !!user,
    authLoading,
  });

  // Query strategy: Try user query first (if authenticated), then fall back to public query
  // - Authenticated users: Try user query first, then public query as fallback
  // - Unauthenticated users: Use public query only
  const shouldFetchUser = !!user && !authLoading;
  const shouldFetchPublic = true; // Always enable public query as fallback

  const {
    data: userRecipe,
    isLoading: userLoading,
    error: userError,
  } = useRecipe(shouldFetchUser ? id! : '');

  const {
    data: publicRecipe,
    isLoading: publicLoading,
    error: publicError,
  } = usePublicRecipe(id!, { enabled: shouldFetchPublic });

  console.log('🚀 [ViewRecipePage] Query optimization strategy:', {
    shouldFetchUser,
    shouldFetchPublic,
    hasUser: !!user,
    authLoading,
    userError: userError?.message,
    publicError: publicError?.message,
    strategy: shouldFetchUser
      ? 'user-first-public-fallback'
      : 'public-query-only',
  });

  // Use whichever one succeeds (base recipe from database)
  const baseRecipe = userRecipe || publicRecipe;

  // Local state for version content when viewing specific versions
  const [versionContent, setVersionContent] = useState<RecipeVersion | null>(
    null
  );

  // All state hooks must be declared before any conditional returns
  const [userComment, setUserComment] = useState<{
    rating?: number;
    comment?: string;
  } | null>(null);

  // Version navigation state
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<RecipeVersion[]>([]);
  const [currentVersionNumber, setCurrentVersionNumber] = useState<number>(1);
  const [isOwner, setIsOwner] = useState(false);

  // Track updated recipe data for immediate UI updates
  const [updatedRecipeData, setUpdatedRecipeData] = useState<Recipe | null>(
    null
  );

  // Check if user has seen recipe view instructions
  const [showInstructions, setShowInstructions] = useState(false);

  // Clear updated recipe data when baseRecipe changes (different recipe)
  useEffect(() => {
    setUpdatedRecipeData(null);
  }, [baseRecipe?.id]);

  // Show instructions modal on first visit
  useEffect(() => {
    const hasHiddenInstructions =
      localStorage.getItem('hideRecipeViewInstructionsModal') === 'true';
    if (!hasHiddenInstructions && baseRecipe) {
      setShowInstructions(true);
    }
  }, [baseRecipe]);

  // Determine which content to display
  const recipe = baseRecipe;
  const displayContent = versionContent
    ? {
        ...baseRecipe!,
        title: versionContent.title,
        ingredients: versionContent.ingredients,
        instructions: versionContent.instructions,
        notes: updatedRecipeData?.notes ?? versionContent.notes ?? null, // Use updated notes if available
        setup: versionContent.setup,
        categories: versionContent.categories,
        cooking_time: versionContent.cooking_time,
        difficulty: versionContent.difficulty,
        creator_rating: versionContent.creator_rating,
        // Use version image_url if available, otherwise fall back to main recipe image_url
        image_url: versionContent.image_url || baseRecipe!.image_url,
        // Preserve timestamps for image expiration checking
        // If version has its own image, use version's created_at for both timestamps
        // If version uses base recipe image, use base recipe's timestamps
        updated_at: versionContent.image_url
          ? versionContent.created_at
          : baseRecipe!.updated_at,
        created_at: versionContent.image_url
          ? versionContent.created_at
          : baseRecipe!.created_at,
      }
    : {
        ...baseRecipe!,
        // Use updated data if available, otherwise use base recipe data
        notes: updatedRecipeData?.notes ?? baseRecipe?.notes ?? null,
        setup: baseRecipe?.setup || [],
      };
  // isLoading is true only if at least one query is loading and no data has been found yet
  const isLoading = (userLoading || publicLoading) && !recipe;
  // error if both queries have failed or neither query has returned data
  const error =
    !userLoading && !publicLoading && !recipe
      ? userError || publicError || new Error('Recipe not found')
      : null;

  // Helper functions must be declared before useEffect hooks that call them
  const loadVersionData = useCallback(
    async (currentRecipe: Recipe) => {
      try {
        console.log(
          `🔍 [loadVersionData] Loading versions for recipe: ${currentRecipe.id}`
        );

        // Load versions using new clean API (no more parent traversal!)
        const versionsData = await recipeApi.getRecipeVersions(
          currentRecipe.id
        );

        console.log(
          `📊 [loadVersionData] Received ${versionsData?.length || 0} versions:`,
          versionsData
        );

        setVersions(versionsData);

        // 🎯 FIXED: Load latest version by default, specific version when requested
        if (versionsData && versionsData.length > 0) {
          if (requestedVersion !== null) {
            // Specific version requested
            const requestedVersionData = versionsData.find(
              (v) => v.version_number === requestedVersion
            );
            if (requestedVersionData) {
              console.log(`🔄 Loading requested version: ${requestedVersion}`);
              setVersionContent(requestedVersionData);
            } else {
              console.warn(
                `⚠️ Requested version ${requestedVersion} not found, falling back to latest`
              );
              const latestVersion = versionsData[0]; // First is latest (descending order)
              setVersionContent(latestVersion);
            }
          } else {
            // No version parameter - load latest version by default
            const latestVersion = versionsData[0]; // Versions are ordered newest first (descending)
            console.log(
              `🔄 No version specified - loading latest version: ${latestVersion.version_number}`
            );
            setVersionContent(latestVersion);
          }
        } else {
          // No versions exist - show original recipe content
          console.log('📖 No versions exist - showing original recipe content');
          setVersionContent(null);
        }

        // Aggregate stats temporarily disabled until rebuilt for new schema
        // const aggregateData = await recipeApi.getAggregateStats(currentRecipe.id);
        // setAggregateStats(aggregateData);

        // Track view for current version (temporarily disabled until API is implemented)
        if (publicRecipe) {
          const versionToTrack =
            requestedVersion || versionsData?.[0]?.version_number || 1;
          console.log(
            `📊 Would track view for version ${versionToTrack} of recipe ${currentRecipe.id}`
          );
          // await recipeApi.trackVersionView(currentRecipe.id, versionToTrack);
        }
      } catch (error) {
        console.error('Failed to load version data:', error);
      }
    },
    [requestedVersion, publicRecipe]
  );

  const checkOwnership = useCallback(
    async (currentRecipe: Recipe) => {
      if (user) {
        // Simple ownership check using new clean API
        const owns = await recipeApi.checkRecipeOwnership(currentRecipe.id);
        setIsOwner(owns);
      }
    },
    [user]
  );

  const loadSpecificVersion = useCallback(
    async (recipeId: string, versionNumber: number) => {
      try {
        console.log(
          `🔄 Loading version ${versionNumber} for recipe ${recipeId}`
        );

        // Get the specific version from the versions table
        const { data: version, error } = await supabase
          .from('recipe_content_versions')
          .select('*')
          .eq('recipe_id', recipeId)
          .eq('version_number', versionNumber)
          .single();

        if (error) {
          console.error('Failed to load version:', error);
          throw error;
        }

        // Set the version content for display
        setVersionContent(version);

        console.log(`✅ Loaded version ${versionNumber} content:`, {
          title: version.title,
          setupItems: version.setup?.length || 0,
          hasContent: !!version,
        });
      } catch (error) {
        console.error('Failed to load specific version:', error);
        toast({
          title: 'Error',
          description: `Failed to load version ${versionNumber}`,
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  // All useEffect hooks must be declared before any conditional returns
  // Load version data when recipe is loaded AND user is authenticated
  useEffect(() => {
    if (recipe && user && !authLoading) {
      console.log(
        '🔄 [ViewRecipePage] Loading version data with authenticated user'
      );
      loadVersionData(recipe);
      checkOwnership(recipe);
    } else {
      console.log(
        '⏳ [ViewRecipePage] Waiting for authentication before loading versions',
        {
          hasRecipe: !!recipe,
          hasUser: !!user,
          authLoading,
        }
      );
    }
  }, [recipe, user, authLoading, loadVersionData, checkOwnership]);

  // Handle version loading separately to avoid dependency loops
  useEffect(() => {
    if (recipe && versions.length > 0) {
      // Determine which version to show
      let versionToShow: number;

      if (requestedVersion) {
        // Specific version requested via URL
        versionToShow = requestedVersion;
      } else {
        // No version specified - show the LATEST version (highest version number)
        const latestVersion = Math.max(
          ...versions.map((v) => v.version_number)
        );
        versionToShow = latestVersion;
      }

      setCurrentVersionNumber(versionToShow);

      // Load the specific version content for ANY version number
      loadSpecificVersion(recipe.id, versionToShow);
    } else if (recipe) {
      // No versions exist - show base recipe as version 1
      setCurrentVersionNumber(1);
      setVersionContent(null);
    }
  }, [recipe, versions, requestedVersion, loadSpecificVersion]);

  // Load user's comment for the current recipe/version
  const loadUserComment = useCallback(async () => {
    if (!user || !id) return;

    try {
      const currentVersion =
        versionContent?.version_number || requestedVersion || 1;
      const userRating = await ratingApi.getUserVersionRating(
        id,
        currentVersion
      );

      if (userRating) {
        setUserComment({
          rating: userRating.rating,
          comment: userRating.comment || undefined,
        });
      } else {
        setUserComment(null);
      }
    } catch (error) {
      console.error('Failed to load user comment:', error);
      setUserComment(null);
    }
  }, [user, id, versionContent?.version_number, requestedVersion]);

  // Load user's comment when recipe is loaded and user is authenticated
  useEffect(() => {
    if (recipe && user && !authLoading) {
      loadUserComment();
    }
  }, [recipe, user, authLoading, loadUserComment]);

  // Refresh the Your Comment card when a comment is updated elsewhere
  useEffect(() => {
    const handler = () => loadUserComment();
    window.addEventListener('user-comment-updated', handler as EventListener);
    return () =>
      window.removeEventListener(
        'user-comment-updated',
        handler as EventListener
      );
  }, [loadUserComment]);

  // Calculate next version number for version creation (for ALL owned recipes)
  useEffect(() => {
    if (recipe && isOwner) {
      const fetchNextVersion = async () => {
        try {
          const originalId = recipe.id;
          // Get next version number (for future use if needed)
          await recipeApi.getNextVersionNumber(originalId);
        } catch (error) {
          console.error('Failed to get next version number:', error);
          // setNextVersionNumber(2); // fallback - removed unused variable
        }
      };
      fetchNextVersion();
    }
  }, [recipe, isOwner]);

  // CRITICAL: Handle invalid route parameter AFTER all hooks are declared
  // This prevents React Hooks violation
  const isValidUUID = (str: string): boolean => {
    // NOTE: Relaxed UUID validation to accept both spec-compliant UUIDs and seeded/test IDs.
    // We intentionally drop version/variant constraints to support legacy/test routes.
    const relaxedUuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return relaxedUuidRegex.test(str);
  };

  if (id === undefined || id === 'undefined' || !id || !isValidUUID(id)) {
    console.error('❌ Recipe ID is invalid in route:', {
      id,
      isValid: id ? isValidUUID(id) : false,
    });
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50 p-4">
        <div className="mx-auto max-w-2xl pt-20">
          <div className="border border-gray-200 p-8 text-center rounded-lg">
            <h2 className="mb-2 text-xl font-semibold">Invalid Recipe URL</h2>
            <p className="mb-4 text-gray-600">
              The recipe URL is malformed or contains an invalid recipe ID.
            </p>
            <Button onClick={() => navigate('/')}>Back to Home</Button>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced debugging
  console.log('📊 [ViewRecipePage] State summary:', {
    recipeId: id,
    userRecipe: userRecipe ? 'Found' : 'Not found',
    publicRecipe: publicRecipe ? 'Found' : 'Not found',
    finalRecipe: recipe ? 'Found' : 'Not found',
    userLoading,
    publicLoading,
    isLoading,
    userError: userError?.message,
    publicError: publicError?.message,
    finalError: error?.message,
    shouldFetchUser,
    hasUser: !!user,
    authLoading,
  });

  // Image debugging
  console.log('🖼️ Image debug:', {
    hasRecipe: !!recipe,
    hasImageUrl: !!recipe?.image_url,
    imageUrl: recipe?.image_url,
    updatedAt: recipe?.updated_at,
    createdAt: recipe?.created_at,
    isViewingVersion: !!versionContent,
    versionImageUrl: versionContent?.image_url,
    displayContentImageUrl: displayContent?.image_url,
    displayContentUpdatedAt: displayContent?.updated_at,
    displayContentCreatedAt: displayContent?.created_at,
  });

  // Handle edit comment: scroll to comments and open the edit form
  const handleEditComment = () => {
    const section = document.getElementById('comments-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // Signal the comments component to open its form
    window.dispatchEvent(new CustomEvent('open-comment-form'));
  };

  // Handle version selection
  const handleVersionSelect = (version: RecipeVersion) => {
    console.log('🔄 [handleVersionSelect] Version selected:', {
      versionNumber: version.version_number,
      versionName: version.version_name,
      recipeId: version.recipe_id,
      baseRecipeId: baseRecipe?.id,
      currentUrl: window.location.href,
    });

    // Set the current version number
    setCurrentVersionNumber(version.version_number);

    // Use the recipe_id from the version (most reliable source)
    const targetRecipeId = version.recipe_id;

    if (targetRecipeId) {
      console.log(
        `🌐 Navigating to: /recipe/${targetRecipeId}?version=${version.version_number}`
      );

      // Update the URL to reflect the version being viewed
      navigate(`/recipe/${targetRecipeId}?version=${version.version_number}`, {
        replace: true,
      });

      // Set the version content directly (no async loading needed)
      setVersionContent(version);

      console.log(`✅ Switched to version ${version.version_number}`);
    } else {
      console.error('❌ No recipe ID available for navigation');
    }
  };

  // Handle version rating (temporarily disabled until API is implemented)
  const handleVersionRating = async (
    recipeId: string,
    versionNumber: number,
    rating: number,
    comment?: string
  ) => {
    try {
      console.log(
        `⭐ Would rate version ${versionNumber} of recipe ${recipeId} with ${rating} stars`
      );
      if (comment) console.log(`💬 Comment: ${comment}`);

      // await recipeApi.rateVersion(recipeId, versionNumber, rating, comment);
      toast({
        title: 'Rating submitted',
        description: 'Thank you for rating this version!',
      });

      // Reload version data to update stats
      if (recipe) {
        await loadVersionData(recipe);
      }
    } catch (error) {
      console.error('Error rating version:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit rating',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className={createDaisyUISkeletonClasses('h-10 w-48')} />
            <div className={createDaisyUICardClasses('bordered')}>
              <div className="card-body p-6">
                <div
                  className={createDaisyUISkeletonClasses('mb-4 h-64 w-full')}
                />
                <div
                  className={createDaisyUISkeletonClasses('mb-2 h-8 w-3/4')}
                />
                <div className={createDaisyUISkeletonClasses('h-4 w-1/2')} />
              </div>
            </div>
            <div className={createDaisyUICardClasses('bordered')}>
              <div className="card-body space-y-4 p-6">
                <div className={createDaisyUISkeletonClasses('h-6 w-32')} />
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className={createDaisyUISkeletonClasses('h-4 w-full')}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    console.error('❌ [ViewRecipePage] Error state reached:', {
      recipeId: id,
      error: error?.message,
      userError: userError?.message,
      publicError: publicError?.message,
      hasRecipe: !!recipe,
      stack: error?.stack,
    });

    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50 p-4">
        <div className="mx-auto max-w-2xl pt-20">
          <div
            className={`${createDaisyUICardClasses('bordered')} p-8 text-center`}
          >
            <div className="card-body">
              <ChefHat className="mx-auto mb-4 h-12 w-12 text-red-400" />
              <h2 className="mb-2 text-xl font-semibold">Recipe not found</h2>
              <p className="mb-4 text-gray-600">
                The recipe you're looking for doesn't exist or has been deleted.
              </p>

              {/* Debug info for production troubleshooting */}
              {import.meta.env.PROD && (
                <div className="mb-4 rounded-lg bg-gray-100 p-3 text-left text-sm">
                  <p className="font-medium text-gray-800">Debug Info:</p>
                  <p className="text-gray-600">Recipe ID: {id}</p>
                  <p className="text-gray-600">
                    Error: {error?.message || 'No error message'}
                  </p>
                  <p className="text-gray-600">
                    User Error: {userError?.message || 'None'}
                  </p>
                  <p className="text-gray-600">
                    Public Error: {publicError?.message || 'None'}
                  </p>
                  <p className="text-gray-600">
                    Has Recipe: {recipe ? 'Yes' : 'No'}
                  </p>
                </div>
              )}

              {/* Recipe Diagnostic Tool */}
              <div className="mb-4">
                <RecipeDiagnostic recipeId={id} />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button onClick={() => navigate('/')} variant="outline">
                  Back to Home
                </Button>
                <Button onClick={() => navigate('/explore')} variant="outline">
                  Browse Public Recipes
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                >
                  Retry
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Determine where we came from for better navigation
  const cameFromExplore =
    location.state?.from === 'explore' ||
    document.referrer.includes('/explore');

  // Determine if this should show Save or Edit button
  // Show Save if:
  // 1. We found a public recipe (regardless of who owns it), AND
  // 2. We came from the explore page
  // Show Edit if:
  // 1. We found a user recipe (private recipe), OR
  // 2. We didn't come from explore page
  const shouldShowSave = !!publicRecipe && cameFromExplore;
  const shouldShowEdit = !shouldShowSave;

  const handleEdit = () => {
    if (!recipe) return;

    // If this is a shared (public) recipe and the current user is the owner,
    // warn that edits will update the publicly shared version
    const isSharedPublic = !!recipe.is_public;
    if (isOwner && isSharedPublic) {
      const proceed = window.confirm(
        'Shared recipe, editing will update the public version. Would you like to continue?'
      );
      if (!proceed) return;
    }

    navigate('/add', { state: { recipe } });
  };

  const handleSave = async () => {
    if (!recipe) return;

    try {
      await recipeApi.savePublicRecipe(recipe.id);
      toast({
        title: 'Success',
        description: 'Recipe saved to your collection!',
      });

      // Navigate to user's recipes page to show the saved recipe
      navigate('/recipes', { state: { refresh: Date.now() } });
    } catch (error) {
      console.error('Error saving recipe:', error);
      toast({
        title: 'Error',
        description: 'Failed to save recipe',
        variant: 'destructive',
      });
    }
  };

  const handleBack = () => {
    // If we came from explore page, go back there, otherwise go to recipes
    if (cameFromExplore) {
      navigate('/explore');
    } else {
      navigate('/recipes');
    }
  };

  const handleNotesUpdated = (updatedRecipe: Recipe) => {
    console.log('🔄 Notes updated, updating local state:', updatedRecipe);
    // Update local state to immediately reflect changes
    setUpdatedRecipeData(updatedRecipe);
  };

  const handleViewVersion = () => {
    setShowVersions(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50">
      {/* Recipe View Instructions Modal */}
      <RecipeViewInstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
      />

      <div className="mx-auto max-w-full sm:max-w-7xl px-4 py-8 sm:px-6 lg:px-8 overflow-x-hidden">
        {/* Navigation Header - Show for owned recipes OR when versions exist */}
        {(isOwner || versions.length > 0) && (
          <div className="mb-6">
            {/* Mobile-optimized header layout */}
            <div className="space-y-3 sm:space-y-0">
              {/* Top row: Back button and View Version (mobile: stacked, desktop: side by side) */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="text-gray-600 hover:text-gray-900 w-full sm:w-auto"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>

                {/* View Version button - only show on desktop or when there are versions */}
                {versions.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewVersion}
                    className="hidden sm:flex items-center text-xs w-full sm:w-auto"
                  >
                    <GitBranch className="h-3 w-3 mr-1" />
                    View Version
                  </Button>
                )}
              </div>

              {/* Bottom row: Status pills (mobile: full width, desktop: compact) */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {versions.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    <GitBranch className="h-3 w-3 mr-1" />
                    {versions.length} version
                    {versions.length !== 1 ? 's' : ''}
                  </Badge>
                )}

                {/* Owner-facing share status pill */}
                {isOwner && (
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      recipe?.is_public || !!publicRecipe
                        ? 'bg-green-100 text-green-800 border-green-300'
                        : 'bg-gray-100 text-gray-700 border-gray-300'
                    }`}
                    title={
                      recipe?.is_public || !!publicRecipe
                        ? 'This recipe is currently shared publicly'
                        : 'This recipe is not currently shared'
                    }
                  >
                    {recipe?.is_public || !!publicRecipe
                      ? 'Shared'
                      : 'Not shared'}
                  </Badge>
                )}

                {/* Mobile View Version button - show on mobile when there are versions */}
                {versions.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewVersion}
                    className="sm:hidden text-xs w-full"
                  >
                    <GitBranch className="h-3 w-3 mr-1" />
                    View Version
                  </Button>
                )}
              </div>
            </div>

            {/* Versions Toggle Button */}
            {versions.length > 0 && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVersions(!showVersions)}
                  className="w-full sm:w-auto text-sm"
                >
                  <GitBranch className="h-4 w-4 mr-2" />
                  {showVersions ? 'Hide' : 'View'} Versions ({versions.length})
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Current Version Info */}
        {(isOwner || versions.length > 0) && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      versionContent?.version_number === 0 ||
                      (versionContent &&
                        versions.length > 0 &&
                        versionContent.version_number ===
                          Math.max(...versions.map((v) => v.version_number)))
                        ? 'default'
                        : 'secondary'
                    }
                    className={
                      versionContent?.version_number === 0
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : versionContent &&
                            versions.length > 0 &&
                            versionContent.version_number ===
                              Math.max(...versions.map((v) => v.version_number))
                          ? 'bg-green-100 text-green-800 border-green-300'
                          : ''
                    }
                  >
                    {versionContent?.version_number === 0
                      ? 'Original'
                      : `v${versionContent?.version_number || currentVersionNumber}`}
                    {versionContent &&
                      versions.length > 0 &&
                      versionContent.version_number ===
                        Math.max(...versions.map((v) => v.version_number)) &&
                      versionContent.version_number > 0 &&
                      ' (Latest)'}
                  </Badge>
                  {versionContent?.version_name && (
                    <span className="text-sm font-medium text-gray-700 break-words">
                      {versionContent.version_name}
                    </span>
                  )}
                  {recipe && !versionContent?.version_name && (
                    <span className="text-sm font-medium text-gray-900 break-words">
                      {recipe.title}
                    </span>
                  )}
                </div>
                {versionContent?.changelog && (
                  <div className="text-sm text-gray-600 mt-1 break-words">
                    <strong>
                      {versionContent.version_number === 0
                        ? 'Description:'
                        : 'Changes:'}
                    </strong>{' '}
                    {versionContent.changelog}
                  </div>
                )}
                {versionContent && (
                  <div className="text-xs text-gray-500 mt-1">
                    {versionContent.version_number === 0
                      ? 'Original recipe'
                      : `Created ${new Date(versionContent.created_at).toLocaleDateString()}`}
                  </div>
                )}
                {recipe?.creator_rating && (
                  <div className="flex items-center space-x-1 mt-1">
                    <span className="text-xs text-gray-500">
                      Creator rating:
                    </span>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-xs ${
                            star <= recipe.creator_rating!
                              ? 'text-orange-400'
                              : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      ({recipe.creator_rating}/5)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recipe Image - Only shown on view-recipe-page */}
        {displayContent?.image_url && (
          <div className="mb-6">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
              <ProgressiveImage
                src={
                  getSafeImageUrl(
                    displayContent.image_url,
                    displayContent.updated_at,
                    displayContent.created_at,
                    FALLBACK_IMAGE_PATH
                  ) || FALLBACK_IMAGE_PATH
                }
                alt={displayContent.title}
                className="h-full w-full object-cover"
                loading="eager"
                placeholder={FALLBACK_IMAGE_PATH}
              />
            </div>
          </div>
        )}

        {displayContent && (
          <RecipeView
            recipe={displayContent}
            onEdit={shouldShowEdit ? handleEdit : undefined}
            onSave={shouldShowSave ? handleSave : undefined}
            onBack={!versions.length ? handleBack : undefined} // Hide back button if we have version nav
            userComment={userComment}
            onEditComment={handleEditComment}
            onNotesUpdated={handleNotesUpdated}
          />
        )}

        {/* Clean Separated Analytics Dashboard - Replaces problematic DualRatingDisplay */}
        {recipe && (
          <RecipeAnalyticsDashboard
            recipeId={id!}
            currentVersion={
              versionContent?.version_number || requestedVersion || undefined
            }
            onVersionChange={(versionNumber) => {
              console.log(
                `🔄 [ViewRecipePage] Version change requested: ${versionNumber}`
              );
              navigate(`/recipe/${id}?version=${versionNumber}`);
            }}
            className="mt-8"
          />
        )}

        {/* Version Selection Modal */}
        {showVersions && versions.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Recipe Versions</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowVersions(false)}
                  >
                    ✕
                  </Button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                  <VersionSelector
                    recipeId={recipe?.id || ''}
                    currentVersionNumber={currentVersionNumber}
                    onVersionSelect={handleVersionSelect}
                    onRateVersion={handleVersionRating}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
