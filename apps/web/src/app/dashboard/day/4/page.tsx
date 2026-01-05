import { DayProgress } from "@/components/day-progress";
import { DayCard } from "@/components/day-4";

export default function Day4Page() {
  return (
    <div className="grid gap-4">
      <DayProgress day={4} />
      <DayCard />
    </div>
  );
}
