import { DayProgress } from "@/components/day-progress";
import { DayCard } from "@/components/day-6";

export default function Day6Page() {
  return (
    <div className="grid gap-4">
      <DayProgress day={6} />
      <DayCard />
    </div>
  );
}
