"use client";

import { useEffect, useState } from "react";

export default function HealthClient() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const run = async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`, {
        credentials: "include", // <-- sends cookies
      });
      setData(await res.json());
    };
    run();
  }, []);

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
