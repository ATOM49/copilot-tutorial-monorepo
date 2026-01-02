import { DayProgress } from "@/components/day-progress";
import { DayCard } from "@/components/day-8";

export default function Day8Page() {
  return (
    <div className="grid gap-4">
      <DayProgress day={8} />
      <DayCard />
    </div>
  );
}
