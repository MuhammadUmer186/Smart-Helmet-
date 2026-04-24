import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

type AnyObj = Record<string, unknown>;

function clamp01To100(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n <= 1) return Math.round(Math.max(0, n) * 100); // tolerate 0..1 scores
  return Math.round(Math.min(100, Math.max(0, n)));
}

function getNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function normalizeInPlace(payload: AnyObj): void {
  // Expecting something like: { success, message, data: { ai_result, suggestion, theft_score, ... } }
  const data = payload.data;
  if (!data || typeof data !== "object") return;
  const d = data as AnyObj;

  const aiResult = d.ai_result;
  const suggestion = d.suggestion;

  // If this endpoint doesn't have the AI fields, do nothing.
  if (!aiResult && !suggestion) return;

  const aiScoreRaw =
    aiResult && typeof aiResult === "object" ? getNumber((aiResult as AnyObj).anomaly_score) : null;

  const suggActionItems =
    suggestion && typeof suggestion === "object"
      ? ((suggestion as AnyObj).action_items as unknown)
      : null;

  const suggScoreRaw =
    suggActionItems && typeof suggActionItems === "object"
      ? getNumber((suggActionItems as AnyObj).anomaly_score)
      : null;

  const theftScoreRaw = getNumber(d.theft_score);

  const aiScore = aiScoreRaw == null ? 0 : clamp01To100(aiScoreRaw);
  const suggScore = suggScoreRaw == null ? 0 : clamp01To100(suggScoreRaw);
  const theftScore = theftScoreRaw == null ? 0 : clamp01To100(theftScoreRaw);

  const finalScore = Math.max(aiScore, suggScore, theftScore);
  const finalStatus = finalScore >= env.ANOMALY_SCORE_THRESHOLD ? "anomaly" : "normal";

  d.final = {
    anomaly_score: finalScore,
    status: finalStatus,
    threshold: env.ANOMALY_SCORE_THRESHOLD,
    sources: { ai_result: aiScore, suggestion: suggScore, theft_score: theftScore },
  };

  // Make the payload consistent so the UI can't get "stuck" on suggestion.status.
  if (finalStatus === "normal") {
    if (aiResult && typeof aiResult === "object") {
      (aiResult as AnyObj).status = "normal";
      (aiResult as AnyObj).anomaly_score = 0;
      if (!(aiResult as AnyObj).reason) (aiResult as AnyObj).reason = "No anomalies detected";
      if (!(aiResult as AnyObj).rule_triggered) (aiResult as AnyObj).rule_triggered = false;
    }

    if (suggestion && typeof suggestion === "object") {
      (suggestion as AnyObj).status = "normal";
      if (suggActionItems && typeof suggActionItems === "object") {
        (suggActionItems as AnyObj).alert_level = "info";
        (suggActionItems as AnyObj).anomaly_score = 0;
      }
      // Keep suggestion text if you want, but it won't label the device as anomaly anymore.
    }
  }
}

export function normalizeAiAnomaly(_req: Request, res: Response, next: NextFunction): void {
  const originalJson = res.json.bind(res);

  res.json = (body: unknown) => {
    if (body && typeof body === "object") {
      try {
        normalizeInPlace(body as AnyObj);
      } catch {
        // Never break the response if normalization fails.
      }
    }
    return originalJson(body);
  };

  next();
}

