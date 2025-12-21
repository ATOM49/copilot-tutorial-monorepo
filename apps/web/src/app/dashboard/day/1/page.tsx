import { DayProgress } from "@/components/day-progress";
import { DayCard } from "@/components/day-1";

export default function Day1Page() {
  return (
    <div className="grid gap-4">
      <DayProgress day={1} />
      <DayCard />
    </div>
  );
}
