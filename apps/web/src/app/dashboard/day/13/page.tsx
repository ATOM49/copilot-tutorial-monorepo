import { DayProgress } from "@/components/day-progress";
import { DayCard } from "@/components/day-13";

export default function Day13Page() {
  return (
    <div className="grid gap-4">
      <DayProgress day={13} />
      <DayCard />
    </div>
  );
}
