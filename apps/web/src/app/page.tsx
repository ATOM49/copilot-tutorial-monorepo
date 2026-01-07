import { cookies } from "next/headers";

export default async function Page() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`, {
    headers: cookieHeader ? { Cookie: cookieHeader } : {},
    cache: "no-store", // Disable caching for real-time data
  });
  const data = await res.json();

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
