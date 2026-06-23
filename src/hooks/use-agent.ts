"use client";

import { useCallback, useRef, useState } from "react";
import Papa from "papaparse";
import type { AgentEvent } from "@lib/agent-core";
import type { AgentStats, AgentStatus, CsvInfo } from "@/types/agent";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB, per the upload-state spec

type CsvRow = Record<string, string>;

function parseCsvText(text: string): { columns: string[]; rows: CsvRow[] } {
  const result = Papa.parse<CsvRow>(text, { header: true, skipEmptyLines: true });
  if (result.errors.length > 0) {
    throw new Error(result.errors[0].message);
  }
  return { columns: result.meta.fields ?? [], rows: result.data };
}

export function useAgent() {
  const [status, setStatus] = useState<AgentStatus>("idle");
  const [steps, setSteps] = useState<AgentEvent[]>([]);
  const [answer, setAnswer] = useState<string | null>(null);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [csvInfo, setCsvInfo] = useState<CsvInfo | null>(null);
  const [previewRows, setPreviewRows] = useState<CsvRow[]>([]);
  const [question, setQuestion] = useState<string | null>(null);

  // Kept out of React state — it's only ever read inside askQuestion, and
  // putting raw CSV text in state would re-render on every keystroke-sized
  // change for no benefit.
  const csvDataRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const applyCsv = useCallback((name: string, text: string) => {
    const { columns, rows } = parseCsvText(text);
    csvDataRef.current = text;
    setCsvInfo({ name, rows: rows.length, columns });
    setPreviewRows(rows.slice(0, 5));
    setStatus("ready");
  }, []);

  const uploadCsv = useCallback(
    async (file: File) => {
      if (file.size > MAX_FILE_SIZE) {
        throw new Error("File is too large — max size is 5MB.");
      }

      setStatus("uploading");
      try {
        const text = await file.text();
        applyCsv(file.name, text);
      } catch (err) {
        setStatus("idle");
        throw err instanceof Error ? err : new Error("Failed to parse CSV.");
      }
    },
    [applyCsv]
  );

  const loadSample = useCallback(async () => {
    setStatus("uploading");
    try {
      const response = await fetch("/api/sample");
      if (!response.ok) throw new Error("Failed to load sample data.");
      const text = await response.text();
      applyCsv("transactions.csv", text);
    } catch (err) {
      setStatus("idle");
      throw err instanceof Error ? err : new Error("Failed to load sample data.");
    }
  }, [applyCsv]);

  const askQuestion = useCallback((q: string) => {
    const csvData = csvDataRef.current;
    if (!csvData) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setQuestion(q);
    setSteps([]);
    setAnswer(null);
    setStats(null);
    setError(null);
    setStatus("running");

    let toolCalls = 0;
    const startedAt = Date.now();

    (async () => {
      try {
        const response = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csvData, question: q }),
          signal: controller.signal,
        });

        if (!response.body) throw new Error("No response stream from server.");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            const event: AgentEvent = JSON.parse(line);

            if (event.type === "tool_call") toolCalls += 1;

            if (event.type === "answer") {
              setAnswer(event.text);
              setSteps((prev) => [...prev, event]);
            } else if (event.type === "done") {
              setStats({
                turns: event.total_turns,
                toolCalls,
                durationMs: event.duration_ms,
              });
              setStatus("done");
            } else if (event.type === "error") {
              setError(event.message);
              setStatus("error");
            } else {
              setSteps((prev) => [...prev, event]);
            }
          }
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "The agent request failed.");
        setStats((prev) => prev ?? { turns: 0, toolCalls, durationMs: Date.now() - startedAt });
        setStatus("error");
      }
    })();
  }, []);

  const askAnother = useCallback(() => {
    abortRef.current?.abort();
    setSteps([]);
    setAnswer(null);
    setStats(null);
    setError(null);
    setQuestion(null);
    setStatus("ready");
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    csvDataRef.current = null;
    setCsvInfo(null);
    setPreviewRows([]);
    setSteps([]);
    setAnswer(null);
    setStats(null);
    setError(null);
    setQuestion(null);
    setStatus("idle");
  }, []);

  return {
    status,
    steps,
    answer,
    stats,
    error,
    question,
    csvInfo,
    previewRows,
    uploadCsv,
    loadSample,
    askQuestion,
    askAnother,
    reset,
  };
}
