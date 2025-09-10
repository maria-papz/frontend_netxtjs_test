"use client";

import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAddIndicatorToFavouritesMutation, useRemoveIndicatorFromFavouritesMutation } from "@/redux/services/indicatorsApiSlice";
import { useAddTableToFavouritesMutation, useRemoveTableFromFavouritesMutation } from "@/redux/services/tablesApiSlice";
import { useToast } from "@/hooks/use-toast";
import { Row } from "@tanstack/react-table";

interface RowData {
  id: string;
  is_favourite?: boolean;
  name?: string;
  code?: string;
  description?: string;
  [key: string]: string | number | boolean | undefined | null; // Index signature with proper types
}

interface FavouriteButtonProps {
  id: string;
  type: 'indicator' | 'table';
  isFavourite?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onToggle?: (isFavourite: boolean) => void; // Optional callback for parent components
  row?: Row<RowData>; // Use React Table's Row type
}

export function FavouriteButton({
  id,
  type,
  isFavourite = false,
  size = 'md',
  className = '',
  onToggle,
  row
}: FavouriteButtonProps) {
  const [favourite, setFavourite] = useState(isFavourite);
  const { toast } = useToast();

  // Sync state with props when they change
  useEffect(() => {
    setFavourite(isFavourite);
  }, [isFavourite]);

  // Indicator mutations
  const [addIndicatorToFavourites, { isLoading: isAddingIndicator }] = useAddIndicatorToFavouritesMutation();
  const [removeIndicatorFromFavourites, { isLoading: isRemovingIndicator }] = useRemoveIndicatorFromFavouritesMutation();

  // Table mutations
  const [addTableToFavourites, { isLoading: isAddingTable }] = useAddTableToFavouritesMutation();
  const [removeTableFromFavourites, { isLoading: isRemovingTable }] = useRemoveTableFromFavouritesMutation();

  const isLoading = isAddingIndicator || isRemovingIndicator || isAddingTable || isRemovingTable;

  const handleToggleFavourite = async (e: React.MouseEvent) => {
    // Prevent click from bubbling up to parent elements (like table row)
    e.stopPropagation();
    e.preventDefault();

    try {
      const newFavStatus = !favourite;

      // Optimistically update UI
      setFavourite(newFavStatus);

      if (row && row.original) {
        row.original.is_favourite = newFavStatus;
      }

      // Make API call
      if (newFavStatus) {
        if (type === 'indicator') {
          await addIndicatorToFavourites(id).unwrap();
        } else {
          await addTableToFavourites(id).unwrap();
        }
        toast({
          title: `Added to favourites`,
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} has been added to your favourites.`,
        });
      } else {
        if (type === 'indicator') {
          await removeIndicatorFromFavourites(id).unwrap();
        } else {
          await removeTableFromFavourites(id).unwrap();
        }
        toast({
          title: `Removed from favourites`,
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} has been removed from your favourites.`,
        });
      }

      // Notify parent component if callback provided
      if (onToggle) {
        onToggle(newFavStatus);
      }

      // Dispatch custom event to trigger tab content refresh
      const refreshEvent = new CustomEvent('favourite-toggled', {
        detail: { id, type, isFavourite: newFavStatus }
      });
      window.dispatchEvent(refreshEvent);

    } catch (error) {
      // Revert UI on error
      setFavourite(!favourite);
      if (row && row.original) {
        row.original.is_favourite = favourite; // Use the original state
      }

      console.error('Error toggling favourite status:', error);
      toast({
        title: 'Error',
        description: `Failed to update favourite status. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`${sizeClasses[size]} ${className} hover:bg-secondary`}
            onClick={handleToggleFavourite}
            disabled={isLoading}
          >
            <Star
              className={`${favourite ? 'fill-tertiary text-tertiary' : 'text-gray-400'} transition-colors`}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {favourite ? `Remove from favourites` : `Add to favourites`}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
