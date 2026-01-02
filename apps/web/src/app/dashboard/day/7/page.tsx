import { DayProgress } from "@/components/day-progress";
import { DayCard } from "@/components/day-7";

export default function Day7Page() {
  return (
    <div className="grid gap-4">
      <DayProgress day={7} />
      <DayCard />
    </div>
  );
}
