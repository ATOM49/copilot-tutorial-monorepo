"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Day1HealthCard() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setErr(null);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`, {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }

        const json = await res.json();
        setData(json);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to fetch /health");
      }
    };

    run();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Health</CardTitle>
      </CardHeader>
      <CardContent>
        {err ? (
          <div className="text-sm text-destructive">{err}</div>
        ) : !data ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          <pre className="text-xs whitespace-pre-wrap break-words">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}
