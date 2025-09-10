"use client";

import React from "react";
import { IndicatorInfoCard } from "../indicator-info-card";
import { IndicatorWorkflowCard } from "../indicator-workflow-card";
import { BasisInfoCard } from "../basis-info-card";
import { ColumnDef } from "@tanstack/react-table";
import { IndicatorDataMetadata, WorkflowInfo, BasisMetadataRow } from "@/types/dashboard";

interface IndicatorInfoViewProps {
  indicatorInfo: IndicatorDataMetadata;
  associatedWorkflows?: WorkflowInfo[];
  workflowsLoading?: boolean;
  basisTable?: {
    columns: ColumnDef<BasisMetadataRow, unknown>[];
    data: BasisMetadataRow[];
  };
  refetch: () => void;
}

export function IndicatorInfoView({
  indicatorInfo,
  associatedWorkflows,
  workflowsLoading = false,
  basisTable,
  refetch
}: IndicatorInfoViewProps) {
  return (
    <div className="space-y-6">
      <IndicatorInfoCard
        indicatorInfo={indicatorInfo}
        refetch={refetch}
        CardProps={{
          className: "w-full shadow-md border border-gray-100 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
        }}
      />

      {/* Add the workflow card if there are associated workflows */}
      {!workflowsLoading && associatedWorkflows && associatedWorkflows.length > 0 && (
        <IndicatorWorkflowCard
          workflows={associatedWorkflows}
          CardProps={{
            className: "w-full shadow-md border border-gray-100 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          }}
        />
      )}

      {/* Show basis info for custom indicators */}
      {indicatorInfo.is_custom && basisTable && (
        <div className="border-t border-gray-200 pt-6">
          <BasisInfoCard columns={basisTable.columns} data={basisTable.data} />
        </div>
      )}
    </div>
  );
}
