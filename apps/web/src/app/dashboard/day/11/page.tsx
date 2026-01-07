import { DayProgress } from "@/components/day-progress";
import { DayCard } from "@/components/day-11";

export default function Day11Page() {
  return (
    <div className="grid gap-4">
      <DayProgress day={11} />
      <DayCard />
    </div>
  );
}
