"use client";

import { useState, useMemo } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGetAllIndicatorsQuery } from "@/redux/services/indicatorsApiSlice";
import { AlertCircle, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { isFrequencyCompatible, getFrequencyFilterExplanation } from "@/utils/frequency-utils";
import { Indicator as BaseIndicator } from "@/types/workflow";

// Extend the base Indicator type to include edit permission
interface Indicator extends BaseIndicator {
  edit?: boolean;
  delete?: boolean;
  is_favourite?: boolean;
  access_level?: string;
}

interface IndicatorSelectionProps {
  preSelectedIndicators?: number[];
  workflowFrequency?: string;
  onSelectionComplete: (selectedIndicators: number[], selectedIndicatorObjects: Indicator[]) => void;
  onCancel: () => void;
}

export default function WorkflowIndicatorSelection({
  preSelectedIndicators = [],
  workflowFrequency,
  onSelectionComplete,
  onCancel
}: IndicatorSelectionProps) {
  // Use getAllIndicators to get indicators with permissions data
  const { data: indicatorsResponse, isLoading } = useGetAllIndicatorsQuery(undefined, {
    selectFromResult: ({ data, isLoading }) => ({
      data: data as { indicators: Indicator[] },
      isLoading
    }),
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndicators, setSelectedIndicators] = useState<number[]>(preSelectedIndicators);
  const [filteredCount, setFilteredCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Form schema
  const formSchema = z.object({
    indicators: z.array(z.number()).min(1, "You must select at least one indicator")
  });

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      indicators: preSelectedIndicators
    }
  });

  // Get and memoize indicators from the response
  const indicators = useMemo(() => {
    if (!indicatorsResponse?.indicators) return [];
    setTotalCount(indicatorsResponse.indicators.length);
    return indicatorsResponse.indicators;
  }, [indicatorsResponse]);

  // Filter indicators based on search term, frequency, and edit permission - memoize this
  const filteredIndicators = useMemo(() => {
    let filtered = [...indicators];

    // Filter by search term
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        indicator =>
          indicator.name.toLowerCase().includes(lowerSearchTerm) ||
          (indicator.code && indicator.code.toLowerCase().includes(lowerSearchTerm))
      );
    }

    // Filter by frequency
    if (workflowFrequency) {
      filtered = filtered.filter(indicator =>
        isFrequencyCompatible(workflowFrequency, indicator.frequency)
      );
    }

    // Filter by edit permissions - only show indicators that the user has permission to edit
    filtered = filtered.filter((indicator: Indicator) =>
      indicator.edit === true
    );

    // Update filtered count
    setFilteredCount(filtered.length);

    return filtered;
  }, [indicators, searchTerm, workflowFrequency]);

  // Group indicators by category - memoize this too
  const indicatorGroups = useMemo(() => {
    const groups: Record<string, Indicator[]> = {};

    filteredIndicators.forEach(indicator => {
      const category = indicator.category || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(indicator);
    });

    return groups;
  }, [filteredIndicators]);

  // Handle indicator selection
  const toggleIndicator = (indicatorId: number) => {
    setSelectedIndicators(prev => {
      if (prev.includes(indicatorId)) {
        return prev.filter(id => id !== indicatorId);
      } else {
        return [...prev, indicatorId];
      }
    });
  };

  // Handle form submission - now also passing the full indicator objects
  const handleSubmit = () => {
    if (selectedIndicators.length === 0) {
      form.setError("indicators", {
        type: "manual",
        message: "You must select at least one indicator"
      });
      return;
    }

    // Get the full indicator objects for selected IDs
    const selectedIndicatorObjects = indicators.filter(
      (indicator: Indicator) => selectedIndicators.includes(indicator.id)
    ) || [];

    // Pass both the IDs and the full objects
    onSelectionComplete(selectedIndicators, selectedIndicatorObjects);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const frequencyFilterActive = !!workflowFrequency;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search indicators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Badge variant="outline" className="text-sm font-normal">
          {selectedIndicators.length} selected
        </Badge>
      </div>

      {frequencyFilterActive && (
        <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Frequency filter active</AlertTitle>
          <AlertDescription>
            {getFrequencyFilterExplanation(workflowFrequency)}.
            Showing {filteredCount} of {totalCount} indicators.
          </AlertDescription>
        </Alert>
      )}

      {/* Permission filter notice */}
      <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Permission filter active</AlertTitle>
        <AlertDescription>
          Only showing indicators that you have permission to edit. Edit permission is required to link indicators with workflows.
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form>
          <FormField
            control={form.control}
            name="indicators"
            render={() => (
              <FormItem className="space-y-4">
                <FormMessage className="text-center" />
                <ScrollArea className="h-[400px] pr-4">
                  {Object.entries(indicatorGroups).length === 0 ? (
                    <div className="text-center p-4 text-muted-foreground">
                      {frequencyFilterActive
                        ? `No indicators with ${workflowFrequency} frequency match your search criteria`
                        : "No indicators match your search criteria"}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(indicatorGroups).map(([category, categoryIndicators]) => (
                        <div key={category} className="space-y-2">
                          <h3 className="font-medium text-sm text-muted-foreground mb-2">
                            {category}
                          </h3>
                          <div className="space-y-2">
                            {categoryIndicators.map(indicator => (
                              <Card
                                key={indicator.id}
                                className={cn(
                                  "overflow-hidden transition-colors",
                                  selectedIndicators.includes(indicator.id)
                                    ? "border-primary bg-primary/5"
                                    : "hover:border-muted-foreground/30"
                                )}
                              >
                                <CardHeader className="p-4 pb-2 flex flex-row items-start space-y-0 gap-2">
                                  <FormControl>
                                    <Checkbox
                                      checked={selectedIndicators.includes(indicator.id)}
                                      onCheckedChange={() => toggleIndicator(indicator.id)}
                                      className="mt-1"
                                    />
                                  </FormControl>
                                  <div className="space-y-1">
                                    <CardTitle className="text-sm font-medium">{indicator.name}</CardTitle>
                                    <CardDescription className="text-xs">
                                      Code: {indicator.code}
                                    </CardDescription>
                                  </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 pl-9">
                                  <div className="flex flex-wrap gap-2">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Badge
                                            variant="outline"
                                            className={cn(
                                              "text-xs",
                                              frequencyFilterActive &&
                                              isFrequencyCompatible(workflowFrequency, indicator.frequency) &&
                                              "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                                            )}
                                          >
                                            {indicator.frequency}
                                          </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          Data frequency
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>

                                    {indicator.base_year && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Badge variant="outline" className="text-xs">
                                              Base {indicator.base_year}
                                            </Badge>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            Base year
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}

                                    {indicator.unit && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Badge variant="outline" className="text-xs">
                                              {indicator.unit}
                                            </Badge>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            Measurement unit
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </FormItem>
            )}
          />
        </form>
      </Form>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={selectedIndicators.length === 0}
        >
          Select {selectedIndicators.length} Indicator{selectedIndicators.length !== 1 ? 's' : ''}
        </Button>
      </div>
    </div>
  );
}
