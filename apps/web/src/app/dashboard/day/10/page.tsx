import { DayProgress } from "@/components/day-progress";
import { DayCard } from "@/components/day-10";

export default function Day10Page() {
  return (
    <div className="grid gap-4">
      <DayProgress day={10} />
      <DayCard />
    </div>
  );
}
