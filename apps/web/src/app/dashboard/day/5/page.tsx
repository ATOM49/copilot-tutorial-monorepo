import { DayProgress } from "@/components/day-progress";
import { DayCard } from "@/components/day-5";

export default function Day5Page() {
  return (
    <div className="grid gap-4">
      <DayProgress day={5} />
      <DayCard />
    </div>
  );
}
