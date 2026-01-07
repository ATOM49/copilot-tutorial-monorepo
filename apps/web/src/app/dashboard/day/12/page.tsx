import { DayProgress } from "@/components/day-progress";
import { DayCard } from "@/components/day-12";

export default function Day12Page() {
  return (
    <div className="grid gap-4">
      <DayProgress day={12} />
      <DayCard />
    </div>
  );
}
