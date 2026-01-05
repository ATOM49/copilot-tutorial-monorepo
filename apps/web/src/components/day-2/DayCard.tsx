"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function DayCard() {
  const [input, setInput] = useState(
    "Explain our pricing in one paragraph and give 3 next steps."
  );
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    try {
      setLoading(true);
      setErr(null);
      setData(null);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/copilot/demo`,
        {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ input }),
        }
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `HTTP ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`
        );
      }

      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to call /copilot/demo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Copilot Demo</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Prompt</div>
          <Input value={input} onChange={(e) => setInput(e.target.value)} />
        </div>

        <div className="flex gap-2">
          <Button onClick={run} disabled={loading || !input.trim()}>
            {loading ? "Running…" : "Run"}
          </Button>
        </div>

        {err ? <div className="text-sm text-destructive">{err}</div> : null}

        {data ? (
          <pre className="text-xs whitespace-pre-wrap break-words">
            {JSON.stringify(data, null, 2)}
          </pre>
        ) : null}
      </CardContent>
    </Card>
  );
}
