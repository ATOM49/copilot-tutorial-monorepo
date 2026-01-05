import { DayProgress } from "@/components/day-progress";
import { DayCard } from "@/components/day-9";

export default function Day9Page() {
  return (
    <div className="grid gap-4">
      <DayProgress day={9} />
      <DayCard />
    </div>
  );
}
