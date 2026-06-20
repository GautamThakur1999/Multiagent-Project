"use client";

import { useRouter } from "next/navigation";
import { LandingHero } from "@/components/LandingHero";
import { HowItWorks } from "@/components/HowItWorks";
import { usePlan } from "@/components/PlanProvider";

export default function LandingPage() {
  const router = useRouter();
  const { setRequest } = usePlan();

  return (
    <main>
      <LandingHero
        onSubmit={(request) => {
          setRequest(request);
          router.push("/confirm");
        }}
      />
      <HowItWorks />
    </main>
  );
}
