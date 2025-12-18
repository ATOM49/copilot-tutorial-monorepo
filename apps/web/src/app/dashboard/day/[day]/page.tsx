import { DayProgress } from "@/components/day-progress";

export default async function DayPage({ params }: { params: { day: string } }) {
  const { day } = await params;
  const dayNumber = Number(day);
  return <DayProgress day={dayNumber} />;
}
