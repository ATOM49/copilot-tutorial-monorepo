"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DayCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Day 10 - RAG Ingestion</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Implementing document chunking and vector store ingestion.</p>
      </CardContent>
    </Card>
  );
}
