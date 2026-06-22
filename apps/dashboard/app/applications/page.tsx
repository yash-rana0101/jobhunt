"use client";

import { useEffect, useState, useCallback, type DragEvent } from "react";
import { ApplicationCard, type ApplicationCardItem } from "../components/application-card";

const API_BASE = "http://localhost:4000";

const STAGES = [
  { key: "DISCOVERED", label: "Discovered", desc: "Found opportunities" },
  { key: "SHORTLISTED", label: "Shortlisted", desc: "High interest jobs" },
  { key: "READY_TO_APPLY", label: "Ready to Apply", desc: "Resume tailored" },
  { key: "APPLIED", label: "Applied", desc: "Submitted applications" },
  { key: "INTERVIEWING", label: "Interviewing", desc: "Active conversations" },
  { key: "OFFER", label: "Offers", desc: "Offer received" },
  { key: "REJECTED", label: "Rejected", desc: "Passed or withdrawn" },
] as const;

type PipelineData = Record<string, ApplicationCardItem[]>;

export default function ApplicationsPipelinePage() {
  const [pipeline, setPipeline] = useState<PipelineData>({
    DISCOVERED: [],
    SHORTLISTED: [],
    READY_TO_APPLY: [],
    APPLIED: [],
    INTERVIEWING: [],
    OFFER: [],
    REJECTED: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchPipeline = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/pipeline`);
      const resJson = (await res.json()) as { success: boolean; data: PipelineData };
      if (resJson.success) {
        setPipeline(resJson.data);
      }
    } catch (err) {
      console.error("Failed to fetch pipeline", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPipeline();
  }, [fetchPipeline]);

  const handleDragStart = (e: DragEvent, id: string) => {
    e.dataTransfer.setData("applicationId", id);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const getStatusFromStage = (stage: string) => {
    switch (stage) {
      case "DISCOVERED":
        return "DISCOVERED";
      case "SHORTLISTED":
        return "SHORTLISTED";
      case "READY_TO_APPLY":
        return "READY_TO_APPLY";
      case "APPLIED":
        return "APPLIED";
      case "INTERVIEWING":
        return "PHONE_SCREEN";
      case "OFFER":
        return "OFFER_RECEIVED";
      case "REJECTED":
        return "REJECTED";
      default:
        return "DISCOVERED";
    }
  };

  const handleDrop = async (e: DragEvent, targetStage: string) => {
    e.preventDefault();
    const applicationId = e.dataTransfer.getData("applicationId");
    if (!applicationId) return;

    // Optimistically update the UI stage
    let foundApp: ApplicationCardItem | undefined = undefined;
    const updatedPipeline = { ...pipeline };

    for (const stageKey of Object.keys(updatedPipeline)) {
      const list = updatedPipeline[stageKey];
      if (!list) continue;
      const idx = list.findIndex((item) => item.id === applicationId);
      if (idx !== -1) {
        const [removed] = list.splice(idx, 1);
        foundApp = removed;
        break;
      }
    }

    if (foundApp) {
      foundApp.status = getStatusFromStage(targetStage);
      const targetList = updatedPipeline[targetStage];
      if (targetList) {
        targetList.push(foundApp);
      }
      setPipeline(updatedPipeline);

      // Persist update in API database
      try {
        await fetch(`${API_BASE}/applications/${applicationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: foundApp.status,
            reason: `Dragged application card to ${targetStage.replace(/_/g, " ")} column`,
          }),
        });
        // Refetch to sync state & get new priority score
        void fetchPipeline();
      } catch (err) {
        console.error("Failed to update status on drop", err);
        void fetchPipeline();
      }
    }
  };

  const onDropColumn = (e: DragEvent, targetStage: string) => {
    void handleDrop(e, targetStage);
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col bg-slate-50/50 p-6">
      <div className="flex flex-col gap-2 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Application Pipeline</h1>
        <p className="text-sm text-slate-500">
          Manage your active job opportunities. Drag cards to update statuses.
        </p>
      </div>

      {loading && Object.values(pipeline).every((list) => list.length === 0) ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
        </div>
      ) : (
        <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const cards = pipeline[stage.key] || [];
            return (
              <div
                key={stage.key}
                onDragOver={handleDragOver}
                onDrop={(e) => onDropColumn(e, stage.key)}
                className="flex w-72 shrink-0 flex-col rounded-xl border border-slate-100 bg-slate-100/50 p-3 shadow-sm transition hover:bg-slate-100"
              >
                <div className="flex items-center justify-between px-1.5 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">{stage.label}</span>
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-3xs font-bold text-slate-600">
                      {cards.length}
                    </span>
                  </div>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto pt-1 pr-1 max-h-[calc(100vh-17rem)]">
                  {cards.map((app) => (
                    <ApplicationCard key={app.id} application={app} onDragStart={handleDragStart} />
                  ))}
                  {cards.length === 0 && (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-white/40 py-8 text-center text-xs text-slate-400">
                      Drag jobs here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
