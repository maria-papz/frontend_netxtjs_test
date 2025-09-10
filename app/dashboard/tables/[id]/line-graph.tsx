"use client";

import { ResponsiveLine } from "@nivo/line";
import { useState, useMemo, useRef } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IconDownload } from "@tabler/icons-react";

interface LineGraphProps {
  data: Record<string, string | number>[];
  indicatorsObject: Record<string, {
    code?: string;
    name?: string;
    [key: string]: unknown;
  }>;
}

// Helper functions and interfaces
interface DataPoint {
  x: string;
  y: number | null;
}

interface MetricLine {
  id: string;
  code: string;
  color: string;
  data: DataPoint[];
}

type ChartData = MetricLine[];

/**
 * Simple period sorting function that sorts alphabetically
 * No format detection, just pure alphabetical sorting
 */
function sortPeriods(periods: string[]): string[] {
  return [...periods].sort();
}

function randomColorGenerator() {
  const hue = Math.floor(Math.random() * 137.508);
  return `hsl(${hue},50%,75%)`;
}

function getIndicatorCode(
  indicatorName: string,
  indicatorsObject?: Record<string, {
    code?: string;
    name?: string;
    [key: string]: unknown;
  }>
): string {
  if (!indicatorsObject || !indicatorsObject[indicatorName]) {
    return "N/A";
  }
  return indicatorsObject[indicatorName].code || "N/A";
}

function getVisibleTickIndexes(totalPeriods: number, maxLabels: number = 8): number[] {
  if (totalPeriods <= maxLabels) {
    return Array.from({ length: totalPeriods }, (_, i) => i);
  }

  const step = Math.ceil(totalPeriods / maxLabels);
  const indexes: number[] = [];

  for (let i = 0; i < totalPeriods; i += step) {
    indexes.push(i);
  }

  if (indexes[indexes.length - 1] !== totalPeriods - 1) {
    indexes.push(totalPeriods - 1);
  }

  return indexes;
}

function filterByPeriod(
  data: ChartData,
  [startPeriod, endPeriod]: [string, string]
): ChartData {
  return data.map((line) => ({
    ...line,
    data: line.data.filter((point) =>
      point.x >= startPeriod && point.x <= endPeriod
    ),
  }));
}

function filterBySelectedIndicators(
  data: ChartData,
  selectedIndicators: Record<string, boolean>
): ChartData {
  return data.filter((line) => selectedIndicators[line.id]);
}

const dataParser = (
  data: Record<string, string | number>[],
  indicatorsObject?: Record<string, { code?: string; [key: string]: unknown }>
): ChartData => {
  if (!data || data.length === 0) {
    return [];
  }

  try {
    const parsedData: ChartData = [];
    const metricKeys = Object.keys(data[0] || {}).filter((key) => key !== "period");
    if (metricKeys.length === 0) return [];

    const allPeriods = sortPeriods(
      data.map(row => String(row.period)).filter(Boolean)
    );

    const periodMap = new Map();
    data.forEach(row => {
      if (row.period) {
        periodMap.set(row.period, row);
      }
    });

    metricKeys.forEach((metricKey) => {
      const indicatorCode = getIndicatorCode(metricKey, indicatorsObject);
      const metricLine: MetricLine = {
        id: metricKey,
        code: indicatorCode,
        color: randomColorGenerator(),
        data: [],
      };

      allPeriods.forEach(period => {
        const rowData = periodMap.get(period);
        const value = rowData && rowData[metricKey] !== undefined
          ? parseFloat(rowData[metricKey])
          : null;

        if (value !== null && !isNaN(value)) {
          metricLine.data.push({
            x: period,
            y: value,
          });
        }
      });

      // Simple alphabetical sort
      metricLine.data.sort((a, b) => a.x.localeCompare(b.x));

      if (metricLine.data.length > 0) {
        parsedData.push(metricLine);
      }
    });

    return parsedData;
  } catch (error) {
    console.error("Error parsing data for line graph:", error);
    return [];
  }
};

export function LineGraph({ data, indicatorsObject }: LineGraphProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const chartRef = useRef<HTMLDivElement>(null);

  // Parse data
  const parsedData = useMemo(() => dataParser(data, indicatorsObject), [data, indicatorsObject]);

  // Get all unique periods
  const allPeriods = useMemo(() => {
    const periods = new Set<string>();
    parsedData.forEach(line => {
      line.data.forEach(point => {
        periods.add(point.x);
      });
    });
    return sortPeriods(Array.from(periods));
  }, [parsedData]);

  // State for selected indicators
  const [selectedIndicators, setSelectedIndicators] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    parsedData.forEach(line => {
      initial[line.id] = false;
    });
    return initial;
  });

  // State for period range
  const [periodRange, setPeriodRange] = useState<[string, string]>(() => {
    if (allPeriods.length === 0) return ["", ""];
    return [allPeriods[0], allPeriods[allPeriods.length - 1]];
  });

  // Format chart data
  const formattedChartData = useMemo(() => {
    if (periodRange[0] === "" || periodRange[1] === "") return [];

    let filtered = filterByPeriod(parsedData, periodRange);
    filtered = filterBySelectedIndicators(filtered, selectedIndicators);

    return filtered.map(line => ({
      id: line.code,
      fullName: line.id,
      color: line.color,
      data: [...line.data].sort((a, b) => a.x.localeCompare(b.x))
    }));
  }, [parsedData, periodRange, selectedIndicators]);

  // Get visible periods for x-axis
  const visiblePeriods = useMemo(() => {
    if (!formattedChartData.length || !formattedChartData[0].data.length) return [];

    const allXValues = formattedChartData[0].data.map(d => d.x);
    const visibleIndexes = getVisibleTickIndexes(allXValues.length);
    return visibleIndexes.map(idx => allXValues[idx]);
  }, [formattedChartData]);

  // Event handlers
  const handleToggleIndicator = (indicatorId: string) => {
    setSelectedIndicators(prev => ({
      ...prev,
      [indicatorId]: !prev[indicatorId]
    }));
  };

  const handleStartPeriodChange = (value: string) => {
    setPeriodRange(prev => [value, prev[1]]);
  };

  const handleEndPeriodChange = (value: string) => {
    setPeriodRange(prev => [prev[0], value]);
  };

  const selectAllIndicators = () => {
    const updated: Record<string, boolean> = {};
    parsedData.forEach(line => {
      updated[line.id] = true;
    });
    setSelectedIndicators(updated);
  };

  const deselectAllIndicators = () => {
    const updated: Record<string, boolean> = {};
    parsedData.forEach(line => {
      updated[line.id] = false;
    });
    setSelectedIndicators(updated);
  };

  const handleExportChart = () => {
    if (!chartRef.current) return;

    // Get the SVG element from the chart
    const svgElement = chartRef.current.querySelector("svg");
    if (!svgElement) {
      console.error("SVG element not found");
      return;
    }

    // Clone the SVG to avoid modifying the original
    const clonedSvg = svgElement.cloneNode(true) as SVGElement;

    // Set background color based on theme
    clonedSvg.setAttribute("style", `background-color: ${isDark ? "#1f1f1f" : "#ffffff"}`);

    // Get original dimensions
    const originalWidth = svgElement.clientWidth;
    const originalHeight = svgElement.clientHeight;

    // Set dimensions with higher resolution for better quality
    const scaleFactor = 2;
    const width = originalWidth * scaleFactor;
    const height = originalHeight * scaleFactor;

    clonedSvg.setAttribute('width', `${width}px`);
    clonedSvg.setAttribute('height', `${height}px`);
    clonedSvg.setAttribute('viewBox', `0 0 ${originalWidth} ${originalHeight}`);

    // Convert SVG to a data URL
    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const DOMURL = window.URL || window.webkitURL || window;
    const svgUrl = DOMURL.createObjectURL(svgBlob);

    // Create an image and canvas to convert SVG to PNG
    const img = new Image();
    img.onload = () => {
      // Create a canvas with higher resolution
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      // Get context and configure for high quality
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set high quality rendering options
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Draw background
      ctx.fillStyle = isDark ? "#1f1f1f" : "#ffffff";
      ctx.fillRect(0, 0, width, height);

      // Draw the image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert canvas to data URL with maximum quality
      const dataUrl = canvas.toDataURL("image/png", 1.0);

      // Create a link element to download
      const downloadLink = document.createElement("a");
      downloadLink.href = dataUrl;
      downloadLink.download = `chart-export-${new Date().toISOString().split("T")[0]}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // Clean up
      DOMURL.revokeObjectURL(svgUrl);
    };

    // Set the source of the image
    img.src = svgUrl;
  };

  // Chart theme
  const chartTheme = {
    axis: {
      domain: {
        line: {
          stroke: isDark ? "#525252" : "#e5e5e5",
        },
      },
      legend: {
        text: {
          fill: isDark ? "#e5e5e5" : "#333333",
        },
      },
      ticks: {
        line: {
          stroke: isDark ? "#525252" : "#e5e5e5",
          strokeWidth: 1,
        },
        text: {
          fill: isDark ? "#a3a3a3" : "#666666",
        },
      },
    },
    grid: {
      line: {
        stroke: isDark ? "#373737" : "#f5f5f5",
      },
    },
    tooltip: {
      container: {
        background: isDark ? "#1f2937" : "#ffffff",
        color: isDark ? "#e5e5e5" : "#333333",
        fontSize: "12px",
        borderRadius: "4px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        padding: "8px 12px",
      },
    },
    crosshair: {
      line: {
        stroke: isDark ? "#6b7280" : "#9ca3af",
        strokeWidth: 1,
        strokeOpacity: 0.5,
      },
    },
  };

  // Legend config
  const renderTooltipLegend = () => ({
    anchor: "bottom-right" as const,
    direction: "column" as const,
    justify: false,
    translateX: 100,
    translateY: 0,
    itemsSpacing: 0,
    itemDirection: "left-to-right" as const,
    itemWidth: 80,
    itemHeight: 20,
    itemOpacity: 0.75,
    symbolSize: 12,
    symbolShape: "circle" as const,
    symbolBorderColor: isDark ? "rgba(255, 255, 255, .3)" : "rgba(0, 0, 0, .3)",
    effects: [
      {
        on: "hover" as const,
        style: {
          itemBackground: isDark ? "rgba(255, 255, 255, .05)" : "rgba(0, 0, 0, .03)",
          itemOpacity: 1,
        },
      },
    ],
    itemTextColor: isDark ? "#e5e5e5" : "#333333",
  });

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p>No data available to display</p>
      </div>
    );
  }

  const noIndicatorsSelected = formattedChartData.length === 0;

  // Render the component
  return (
    <div className="flex flex-col space-y-4">
      {/* Period selection UI */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="start-period" className="mb-2 block">Start Period</Label>
          <Select value={periodRange[0]} onValueChange={handleStartPeriodChange}>
            <SelectTrigger id="start-period">
              <SelectValue placeholder="Select start period" />
            </SelectTrigger>
            <SelectContent>
              {allPeriods.map((period) => (
                <SelectItem key={`start-${period}`} value={period}>
                  {period}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Label htmlFor="end-period" className="mb-2 block">End Period</Label>
          <Select value={periodRange[1]} onValueChange={handleEndPeriodChange}>
            <SelectTrigger id="end-period">
              <SelectValue placeholder="Select end period" />
            </SelectTrigger>
            <SelectContent>
              {allPeriods.map((period) => (
                <SelectItem key={`end-${period}`} value={period}>
                  {period}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button
            variant="outline"
            size="icon"
            onClick={handleExportChart}
            disabled={formattedChartData.length === 0}
            title="Export Chart as PNG"
          >
            <IconDownload className="h-4 w-4" />
            <span className="sr-only">Download Chart</span>
          </Button>
        </div>
      </div>

      {/* Indicator selection UI */}
      <div className="border p-4 rounded-md">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Select Indicators</h3>
          <div className="space-x-2">
            <Button size="sm" variant="outline" onClick={selectAllIndicators}>Select All</Button>
            <Button size="sm" variant="outline" onClick={deselectAllIndicators}>Deselect All</Button>
          </div>
        </div>

        {noIndicatorsSelected && (
          <div className="text-amber-600 p-2 mb-2 text-center bg-amber-50 rounded-md">
            Please select at least one indicator to display on the graph
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
          {parsedData.map((line) => (
            <div key={line.id} className="flex items-center space-x-2">
              <Checkbox
                id={`indicator-${line.id}`}
                checked={selectedIndicators[line.id]}
                onCheckedChange={() => handleToggleIndicator(line.id)}
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label
                      htmlFor={`indicator-${line.id}`}
                      className="text-sm truncate"
                    >
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: line.color }}
                        />
                        <span className="font-mono font-medium">{line.code}</span>
                      </div>
                    </Label>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md">
                    <p>{line.id}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ))}
        </div>
      </div>

      {/* Graph visualization */}
      <div className="h-[500px]" ref={chartRef}>
        {formattedChartData.length > 0 ? (
          <ResponsiveLine
            data={formattedChartData}
            margin={{ top: 50, right: 110, bottom: 70, left: 60 }}
            xScale={{ type: "point" }}
            yScale={{
              type: "linear",
              min: "auto",
              max: "auto",
              stacked: false,
              reverse: false,
            }}
            yFormat=" >-.2f"
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 45,
              tickValues: visiblePeriods,
              legend: "Period",
              legendOffset: 50,
              legendPosition: "middle",
              truncateTickAt: 0,
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: "value",
              legendOffset: -40,
              legendPosition: "middle",
              truncateTickAt: 0,
            }}
            enableGridX={false}
            pointSize={8}
            pointColor={{ theme: "background" }}
            pointBorderWidth={2}
            pointBorderColor={{ from: "serieColor" }}
            useMesh={true}
            enableCrosshair={true}
            crosshairType="x"
            legends={[renderTooltipLegend()]}
            theme={chartTheme}
            colors={{ datum: 'color' }}
            curve="monotoneX"
            lineWidth={2.5}
            tooltip={({ point }) => {
              return (
                <div
                  style={{
                    background: isDark ? '#1f2937' : '#ffffff',
                    color: isDark ? '#e5e5e5' : '#333333',
                    padding: '9px 12px',
                    border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                    <span
                      style={{
                        display: 'block',
                        width: '12px',
                        height: '12px',
                        background: point.serieColor,
                        marginRight: '8px',
                        borderRadius: '50%',
                      }}
                    />
                    <strong>{point.serieId}</strong>
                  </div>
                  <div>
                    <span>Period: <strong>{String(point.data.x)}</strong></span>
                  </div>
                  <div>
                    <span>Value: <strong>{String(point.data.y)}</strong></span>
                  </div>
                </div>
              )
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center flex-col gap-4 border border-dashed rounded-md">
            <p className="text-muted-foreground">No indicators selected to display</p>
            <Button onClick={selectAllIndicators} variant="outline">
              Select All Indicators
            </Button>
          </div>
        )}
      </div>

      {/* Legend */}
      {formattedChartData.length > 0 && (
        <div className="border p-3 rounded-md">
          <h3 className="font-medium mb-2">Indicator Codes Legend</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {parsedData
              .filter(line => selectedIndicators[line.id])
              .map((line) => (
                <div key={`legend-${line.id}`} className="flex items-start text-sm gap-2">
                  <div
                    className="w-3 h-3 mt-1 rounded-full"
                    style={{ backgroundColor: line.color }}
                  />
                  <div>
                    <span className="font-mono font-medium">{line.code}:</span>
                    <span className={`ml-1 text-xs break-all`}>
                      {line.id}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Add a dedicated export button at the bottom for better visibility */}
      {formattedChartData.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={handleExportChart}
            className="flex items-center gap-2"
          >
            <IconDownload className="h-4 w-4" />
            Export Chart as PNG
          </Button>
        </div>
      )}
    </div>
  );
}
