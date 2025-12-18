import { DayProgress } from "@/components/day-progress";
import { Day1HealthCard } from "@/components/day1-health-card";

export default function Day1Page() {
  return (
    <div className="grid gap-4">
      <DayProgress day={1} />
      <Day1HealthCard />
    </div>
  );
}
