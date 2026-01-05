import { DayProgress } from "@/components/day-progress";
import { DayCard } from "@/components/day-2";

export default function Day2Page() {
  return (
    <div className="grid gap-4">
      <DayProgress day={2} />
      <DayCard />
    </div>
  );
}
