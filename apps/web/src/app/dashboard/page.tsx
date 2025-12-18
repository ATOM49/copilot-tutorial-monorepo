import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STUDY_DAYS } from "@/lib/study-plan";

export default function DashboardPage() {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Study Plan Overview</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Use the sidebar to navigate day-by-day. Progress is saved locally in
          your browser.
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STUDY_DAYS.map((d) => (
          <Card key={d.day}>
            <CardHeader>
              <CardTitle className="text-base">
                <Link className="underline" href={`/dashboard/day/${d.day}`}>
                  Day {d.day}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {d.title}
              <div className="mt-2 text-xs text-muted-foreground">
                {d.deliverable}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
