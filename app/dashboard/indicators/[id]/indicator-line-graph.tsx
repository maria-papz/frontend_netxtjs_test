"use client";

import { ResponsiveLine } from "@nivo/line";
import { useState, useMemo, useRef } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconDownload } from "@tabler/icons-react";

/**
 * Simple period sorting function that sorts alphabetically
 * No format detection, just pure alphabetical sorting
 */
function sortPeriods(periods: string[]): string[] {
  return [...periods].sort();
}

/**
 * Helper function to select a subset of periods to display on the x-axis
 * to prevent overcrowding. This calculates which indexes should be shown
 * when there are too many periods to display clearly.
 *
 * @param totalPeriods - Total number of periods in the dataset
 * @param maxLabels - Maximum number of labels to display on the x-axis
 * @returns Array of indexes that should be displayed
 */
function getVisibleTickIndexes(totalPeriods: number, maxLabels: number = 8): number[] {
  if (totalPeriods <= maxLabels) {
    return Array.from({ length: totalPeriods }, (_, i) => i);
  }

  // Calculate step size to evenly distribute labels
  const step = Math.max(1, Math.floor(totalPeriods / (maxLabels - 1))); // -1 to ensure we always include the last index
  const indexes: number[] = [];

  for (let i = 0; i < totalPeriods; i += step) {
    indexes.push(i);
  }

  // Ensure we always include the last period if not already included
  if (indexes[indexes.length - 1] !== totalPeriods - 1) {
    indexes.push(totalPeriods - 1);
  }

  return indexes;
}

interface DataPoint {
  x: string;
  y: number | null;
}

interface IndicatorData {
  period?: string;
  value?: number | string;
  id?: string;
  [key: string]: unknown; // More specific than 'any'
}

interface IndicatorLineGraphProps {
  data: IndicatorData[];
  indicatorName: string;
  indicatorCode: string;
  color?: string;
  maxXAxisLabels?: number; // Maximum number of x-axis labels to display
}

export const IndicatorLineGraph: React.FC<IndicatorLineGraphProps> = ({
  data,
  indicatorName,
  indicatorCode,
  color = "#CF9031",
  maxXAxisLabels = 8
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const chartRef = useRef<HTMLDivElement | null>(null);

  console.log("Graph data:", data);  // Parse data for the line chart
  const parsedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    console.log("Processing data:", data);

    // For custom indicators, ensure we're handling the data correctly
    const points: DataPoint[] = data
      .filter(item => {
        // Only include items with both period and value, and where value can be converted to a number
        return item.period &&
               item.value !== undefined &&
               item.value !== null &&
               !isNaN(Number(item.value));
      })
      .map(item => ({
        x: item.period || "",  // Ensure x is never undefined
        y: Number(item.value)
      }));

    // Simple alphabetical sort of points by their x value (period)
    const sortedPoints = [...points].sort((a, b) => a.x.localeCompare(b.x));

    return [{
      id: indicatorCode,
      fullName: indicatorName,
      color: color,
      data: sortedPoints
    }];
  }, [data, indicatorCode, indicatorName, color]);

  // Get all periods with simple alphabetical sorting
  const allPeriods = useMemo(() => {
    if (parsedData.length === 0 || parsedData[0].data.length === 0) return [];
    return sortPeriods(parsedData[0].data.map(point => point.x));
  }, [parsedData]);

  // Initial period range (all data)
  const [periodRange, setPeriodRange] = useState<[string, string]>(() => {
    if (allPeriods.length === 0) return ["", ""];
    return [allPeriods[0], allPeriods[allPeriods.length - 1]];
  });

  // Filtered data based on period range
  const filteredData = useMemo(() => {
    if (!parsedData.length || periodRange[0] === "" || periodRange[1] === "") return [];

    // Simple filter based on string comparison
    return [{
      ...parsedData[0],
      data: parsedData[0].data.filter(point =>
        point.x >= periodRange[0] && point.x <= periodRange[1]
      )
    }];
  }, [parsedData, periodRange]);

  // Calculate which period labels should be visible on the x-axis
  // This limits the number of labels shown to prevent overcrowding
  const visiblePeriods = useMemo(() => {
    if (filteredData.length === 0 || filteredData[0].data.length === 0) return [];

    const allXValues = filteredData[0].data.map(d => d.x);
    const visibleIndexes = getVisibleTickIndexes(allXValues.length, maxXAxisLabels);
    return visibleIndexes.map(idx => allXValues[idx]);
  }, [filteredData, maxXAxisLabels]);

  // Add theme-specific chart configuration
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
    crosshair: {
      line: {
        stroke: isDark ? "#a3a3a3" : "#666666",
      },
    },
    tooltip: {
      container: {
        background: isDark ? "#1f1f1f" : "#ffffff",
        color: isDark ? "#e5e5e5" : "#333333",
        boxShadow: "0 3px 10px rgba(0, 0, 0, 0.2)",
        borderRadius: "4px",
        padding: "8px 12px",
      },
    },
    legends: {
      text: {
        fill: isDark ? "#e5e5e5" : "#333333",
      },
    },
    annotations: {
      text: {
        fill: isDark ? "#e5e5e5" : "#333333",
      },
      link: {
        stroke: isDark ? "#e5e5e5" : "#333333",
      },
      outline: {
        stroke: isDark ? "#e5e5e5" : "#333333",
      },
      symbol: {
        fill: isDark ? "#e5e5e5" : "#333333",
      },
    },
  };

  // Handle period selection
  const handleStartPeriodChange = (value: string) => {
    setPeriodRange(prev => [value, prev[1]]);
  };

  const handleEndPeriodChange = (value: string) => {
    setPeriodRange(prev => [prev[0], value]);
  };

  // Function to handle chart export/download with high quality
  const handleExportChart = () => {
    if (!chartRef.current) return;

    // Get the SVG element from the chart container
    const svgElement = chartRef.current.querySelector("svg");
    if (!svgElement) {
      console.error("SVG element not found");
      return;
    }

    // Clone the SVG to avoid modifying the original
    const clonedSvg = svgElement.cloneNode(true) as SVGElement;

    // Set background color to match the theme
    clonedSvg.setAttribute("style", `background-color: ${isDark ? "#1f1f1f" : "#ffffff"}`);

    // Get original dimensions
    const originalWidth = svgElement.clientWidth;
    const originalHeight = svgElement.clientHeight;

    // Set dimensions with scale factor for higher quality (3x for even better quality)
    const scaleFactor = 3;
    const width = originalWidth * scaleFactor;
    const height = originalHeight * scaleFactor;

    // Set viewBox to ensure proper scaling of the SVG content
    clonedSvg.setAttribute('width', `${width}`);
    clonedSvg.setAttribute('height', `${height}`);
    clonedSvg.setAttribute('viewBox', `0 0 ${originalWidth} ${originalHeight}`);

    // Convert SVG to a data URL
    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const DOMURL = window.URL || window.webkitURL || window;
    const svgUrl = DOMURL.createObjectURL(svgBlob);

    // Create an image and canvas to convert SVG to PNG
    const img = new Image();
    img.onload = () => {
      // Create a canvas with the higher resolution dimensions
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      // Get context and configure for high quality rendering
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      // Set high quality rendering options
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Draw background
      ctx.fillStyle = isDark ? "#1f1f1f" : "#ffffff";
      ctx.fillRect(0, 0, width, height);

      // Draw the image at higher resolution
      ctx.drawImage(img, 0, 0, width, height);

      // Convert canvas to data URL with maximum quality
      const dataUrl = canvas.toDataURL("image/png", 1.0);

      // Create a link element to download with indicator name in filename
      const downloadLink = document.createElement("a");
      downloadLink.href = dataUrl;
      const fileName = `${indicatorCode}-${new Date().toISOString().split("T")[0]}.png`;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // Clean up
      DOMURL.revokeObjectURL(svgUrl);
    };

    // Set the source of the image
    img.src = svgUrl;
  };

  // If no data is available
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p>No data available for this indicator</p>
      </div>
    );
  }

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

      </div>

      {/* Graph visualization with dark mode support */}
      <div className="h-[500px]" ref={chartRef}>
        {filteredData.length > 0 && filteredData[0].data.length > 0 ? (
          <ResponsiveLine
            data={filteredData}
            margin={{ top: 50, right: 50, bottom: 70, left: 60 }}
            xScale={{
              type: "point"
              // The data is already pre-sorted so the x-axis will respect our order
            }}
            yScale={{
              type: "linear",
              min: "auto",
              max: "auto",
              stacked: false,
              reverse: false,
            }}
            curve="monotoneX"
            yFormat=" >-.2f"
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 45,
              legend: "Periods",
              legendOffset: 55,
              legendPosition: "middle",
              format: (value) => {
                // Only show a subset of periods on the x-axis
                return visiblePeriods.includes(value) ? String(value) : '';
              },
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
            colors={[color]}
            pointSize={8}
            pointColor={{ theme: "background" }}
            pointBorderWidth={2}
            pointBorderColor={{ from: "serieColor" }}
            enableGridX={false}
            useMesh={true}
            enableCrosshair={true}
            crosshairType="x"
            theme={chartTheme}
            tooltip={({ point }) => (
              <div className={`${isDark ? 'bg-zinc-800 text-zinc-100' : 'bg-white text-zinc-900'} p-3 shadow-md border rounded-md border-border`}>
                <div className="text-sm font-medium border-b pb-1.5 mb-2 border-border/50">
                                    Period: <span className="font-semibold">{String(point.data.x)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: point.serieColor }}
                  />
                  <div className="flex items-center">
                    <span className="font-medium">{indicatorCode}:</span>
                    <span className="ml-2 font-semibold">{String(point.data.yFormatted || point.data.y)}</span>
                  </div>
                </div>
              </div>
            )}
            enableArea={true}
            areaOpacity={0.1}
            animate={true}
            motionConfig="gentle"
            enablePoints={true}
            isInteractive={true}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">No data available for the selected period range</p>
          </div>
        )}
      </div>

      {/* Simple indicator info with dark mode support */}
      <div className="flex justify-between items-center">
        <p className={isDark ? "text-zinc-300" : "text-gray-700"}>
          {indicatorName} ({indicatorCode})
        </p>

        {/* Add an export button at the bottom */}
        {filteredData.length > 0 && filteredData[0].data.length > 0 && (
          <Button
            variant="outline"
            onClick={handleExportChart}
            className="flex items-center gap-2"
          >
            <IconDownload className="h-4 w-4" />
            Export Chart as PNG
          </Button>
        )}
      </div>
    </div>
  );
};
