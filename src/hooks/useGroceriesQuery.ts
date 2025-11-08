import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthProvider';
import { getUserGroceries, updateUserGroceries } from '@/lib/user-preferences';
import { toast } from '@/hooks/use-toast';
import { useCallback } from 'react';

// Query keys for React Query
export const groceriesKeys = {
  all: ['groceries'] as const,
  user: (userId: string) => [...groceriesKeys.all, userId] as const,
};

// Custom hook for groceries data with React Query
export function useGroceriesQuery() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query for fetching groceries data
  const {
    data: groceriesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: groceriesKeys.user(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      const data = await getUserGroceries(user.id);
      return data || { groceries: {}, shopping_list: {} };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  // Mutation for updating groceries with optimistic updates
  const updateGroceriesMutation = useMutation({
    mutationFn: async ({
      groceries,
      shoppingList,
      silent = false,
    }: {
      groceries: Record<string, string[]>;
      shoppingList: Record<string, string>;
      silent?: boolean;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return {
        result: await updateUserGroceries(user.id, groceries, shoppingList),
        silent,
      };
    },
    onMutate: async ({ groceries, shoppingList }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: groceriesKeys.user(user?.id || ''),
      });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(
        groceriesKeys.user(user?.id || '')
      );

      // Optimistically update to the new value
      queryClient.setQueryData(groceriesKeys.user(user?.id || ''), {
        groceries,
        shopping_list: shoppingList,
      });

      // Return a context object with the snapshotted value
      return { previousData };
    },
    onError: (error, _variables, context) => {
      // Rollback to the previous value on error
      if (context?.previousData) {
        queryClient.setQueryData(
          groceriesKeys.user(user?.id || ''),
          context.previousData
        );
      }
      console.error('Error updating groceries:', error);
      toast({
        title: 'Error',
        description: 'Failed to save kitchen inventory',
        variant: 'destructive',
      });
    },
    onSuccess: (data) => {
      // Only show toast if not silent
      if (!data.silent) {
        toast({
          title: 'Success',
          description: 'Kitchen inventory saved successfully!',
        });
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we're in sync
      queryClient.invalidateQueries({
        queryKey: groceriesKeys.user(user?.id || ''),
      });
    },
  });

  // Toggle ingredient between available and unavailable (sync version)
  const toggleIngredient = useCallback(
    (category: string, ingredient: string) => {
      if (!groceriesData) return;

      const { groceries, shopping_list } = groceriesData;
      const categoryItems =
        (groceries as Record<string, string[]>)[category] || [];
      const isSelected = categoryItems.includes(ingredient);
      // Check if ingredient is in shopping list

      let newGroceries = { ...groceries } as Record<string, string[]>;
      let newShoppingList = { ...shopping_list } as Record<string, string>;

      if (isSelected) {
        // Available → Unavailable: Move from groceries to shopping_list
        newGroceries = {
          ...groceries,
          [category]: (groceries as Record<string, string[]>)[category].filter(
            (item) => item !== ingredient
          ),
        };
        newShoppingList = {
          ...shopping_list,
          [ingredient]: 'pending',
        };
      } else {
        // Unavailable → Available: Move from shopping_list to groceries
        const { [ingredient]: removed, ...rest } = shopping_list as Record<
          string,
          string
        >;
        console.log('Removed ingredient from shopping list:', removed);
        newShoppingList = rest;
        newGroceries = {
          ...groceries,
          [category]: [
            ...((groceries as Record<string, string[]>)[category] || []),
            ingredient,
          ],
        };
      }

      // Update the data (fire-and-forget)
      updateGroceriesMutation.mutate({
        groceries: newGroceries,
        shoppingList: newShoppingList,
      });
    },
    [groceriesData, updateGroceriesMutation]
  );

  // Async version of toggleIngredient that waits for mutation to complete
  const toggleIngredientAsync = useCallback(
    async (category: string, ingredient: string) => {
      if (!groceriesData) return;

      // Read fresh data from cache to avoid stale state
      const currentData = queryClient.getQueryData<{
        groceries: Record<string, string[]>;
        shopping_list: Record<string, string>;
      }>(groceriesKeys.user(user?.id || ''));

      if (!currentData) return;

      const { groceries, shopping_list } = currentData;
      const categoryItems = groceries[category] || [];
      const isSelected = categoryItems.includes(ingredient);

      let newGroceries = { ...groceries };
      let newShoppingList = { ...shopping_list };

      if (isSelected) {
        // Available → Unavailable: Move from groceries to shopping_list
        newGroceries = {
          ...groceries,
          [category]: groceries[category].filter((item) => item !== ingredient),
        };
        newShoppingList = {
          ...shopping_list,
          [ingredient]: 'pending',
        };
      } else {
        // Unavailable → Available: Move from shopping_list to groceries
        const { [ingredient]: removed, ...rest } = shopping_list;
        console.log('Removed ingredient from shopping list:', removed);
        newShoppingList = rest;
        newGroceries = {
          ...groceries,
          [category]: [...(groceries[category] || []), ingredient],
        };
      }

      // Wait for mutation to complete (silent mode - no toast)
      await updateGroceriesMutation.mutateAsync({
        groceries: newGroceries,
        shoppingList: newShoppingList,
        silent: true,
      });
    },
    [groceriesData, updateGroceriesMutation, queryClient, user?.id]
  );

  // Check if ingredient is available (in groceries)
  const hasIngredient = useCallback(
    (category: string, ingredient: string) => {
      if (!groceriesData) return false;
      const categoryItems =
        (groceriesData.groceries as Record<string, string[]>)[category] || [];
      return categoryItems.includes(ingredient);
    },
    [groceriesData]
  );

  // Get count of ingredients in a category
  const getCategoryCount = useCallback(
    (category: string) => {
      if (!groceriesData) return 0;
      if (category === 'all') {
        return Object.values(
          groceriesData.groceries as Record<string, string[]>
        ).reduce((total, items) => total + (items?.length || 0), 0);
      }
      return (
        (groceriesData.groceries as Record<string, string[]>)[category]
          ?.length || 0
      );
    },
    [groceriesData]
  );

  // Get total count of available ingredients
  const getTotalCount = useCallback(() => {
    if (!groceriesData) return 0;
    return Object.values(
      groceriesData.groceries as Record<string, string[]>
    ).reduce((total, items) => total + (items?.length || 0), 0);
  }, [groceriesData]);

  // Get shopping list count
  const getShoppingListCount = useCallback(() => {
    if (!groceriesData) return 0;
    return Object.keys(groceriesData.shopping_list as Record<string, string>)
      .length;
  }, [groceriesData]);

  return {
    // Data
    groceries: groceriesData?.groceries || {},
    shoppingList: groceriesData?.shopping_list || {},

    // Loading states
    loading: isLoading,
    error: error?.message,

    // Actions
    toggleIngredient,
    toggleIngredientAsync,
    refetch,

    // Utilities
    hasIngredient,
    getCategoryCount,
    getTotalCount,
    getShoppingListCount,

    // Debug info
    queryState: {
      isLoading,
      isError: !!error,
      isSuccess: !isLoading && !error,
      data: groceriesData,
    },
  };
}
