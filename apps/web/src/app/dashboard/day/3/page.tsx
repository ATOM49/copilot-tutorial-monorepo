import { DayProgress } from "@/components/day-progress";
import { DayCard } from "@/components/day-3";

export default function Day3Page() {
  return (
    <div className="grid gap-4">
      <DayProgress day={3} />
      <DayCard />
    </div>
  );
}
