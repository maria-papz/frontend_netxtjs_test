"use client";

import { useState } from "react";
import { useIndicatorData } from "./hooks/use-indicator-data";
import { NavigationHeader } from "./components/navigation-header";
import { IndicatorInfoView } from "./components/indicator-info-view";
import { IndicatorDataTable } from "./components/indicator-data-table";
import PermissionsDialog from "./permissions-dialog";

export default function IndicatorPage({ params }: { params: { id: string } }) {
  const [currentPage, setCurrentPage] = useState<number>(0);

  const {
    information,
    name,
    description,
    fileName,
    showGrid,
    gridData,
    gridDataCustom,
    tableData,
    codes,
    equation,
    basisIds,
    basisSelected,
    basisTable,
    associatedWorkflows,
    workflowsLoading,
    dataHistory,
    indicatorHistory,
    formulaHistory,
    isHistoryLoading,
    historyError,
    toggleGrid,
    refetch
  } = useIndicatorData(params.id);

  const handleNext = () => {
    setCurrentPage((prevPage) => (prevPage + 1) % 2);
  };

  const handlePrevious = () => {
    setCurrentPage((prevPage) => (prevPage - 1 + 2) % 2);
  };

  return (
    <main className="container m-4 mx-auto py-10 p-2 md:p-10 rounded-2xl border text-pretty shadow-xl border-neutral-200 dark:border-neutral-700 bg-white dark:bg-zinc-950 flex flex-col">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header section with title and actions */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{name}</h1>
            {(information.edit || information.can_edit) && <PermissionsDialog indicatorId={params.id} />}
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">{description}</p>
        </div>

        {/* Main content card */}
        <div className="rounded-xl bg-white dark:bg-black shadow-xl overflow-hidden border border-zinc-100 dark:border-zinc-800">
          {/* Navigation header */}
          <NavigationHeader
            currentPage={currentPage}
            onNext={handleNext}
            onPrevious={handlePrevious}
            dataHistory={dataHistory}
            indicatorHistory={indicatorHistory}
            formulaHistory={formulaHistory}
            isHistoryLoading={isHistoryLoading}
            historyError={historyError}
            refetch={refetch}
          />

          {/* Content area */}
          <div className="p-6">
            {currentPage === 0 ? (
              <IndicatorInfoView
                indicatorInfo={information}
                associatedWorkflows={associatedWorkflows}
                workflowsLoading={workflowsLoading}
                basisTable={information.is_custom ? basisTable : undefined}
                refetch={refetch}
              />
            ) : (
              <IndicatorDataTable
                isCustom={information.is_custom}
                showGrid={showGrid}
                handleToggleGrid={toggleGrid}
                tableData={tableData}
                gridData={gridData}
                gridDataCustom={gridDataCustom}
                indicatorInfo={information}
                fileName={fileName}
                codes={codes}
                equation={equation}
                basisIds={basisIds}
                basisSelected={basisSelected}
                id={params.id}
                refetch={refetch}
                canEdit={information.edit || information.can_edit}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
