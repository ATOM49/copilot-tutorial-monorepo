import { DayProgress } from "@/components/day-progress";
import { Day2CopilotDemoCard } from "@/components/day2-copilot-demo-card";

export default function Day2Page() {
  return (
    <div className="grid gap-4">
      <DayProgress day={2} />
      <Day2CopilotDemoCard />
    </div>
  );
}
