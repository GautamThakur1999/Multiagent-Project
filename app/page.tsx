"use client";

import { useRouter } from "next/navigation";
import { LandingHero } from "@/components/LandingHero";
import { HowItWorks } from "@/components/HowItWorks";
import { usePlan } from "@/components/PlanProvider";

export default function LandingPage() {
  const router = useRouter();
  const { request, setRequest } = usePlan();

  return (
    <main>
      <LandingHero
        initialValue={request}
        onSubmit={(value) => {
          setRequest(value);
          router.push("/confirm");
        }}
      />
      <HowItWorks />
    </main>
  );
}
