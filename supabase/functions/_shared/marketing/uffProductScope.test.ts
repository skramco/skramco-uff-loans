import { scanUnsupportedProducts } from "./uffProductScope.ts";

Deno.test("scanUnsupportedProducts flags construction loan mentions", () => {
  const hit = scanUnsupportedProducts("Consider our construction loan for builder clients.");
  if (hit.violations.length === 0) throw new Error("Expected construction loan violation");
  if (!hit.flags.some((f) => f.includes("construction loan"))) {
    throw new Error("Expected construction loan flag");
  }
});

Deno.test("scanUnsupportedProducts allows completed-home purchase copy", () => {
  const ok = scanUnsupportedProducts("Purchase a newly built completed home with Conventional financing.");
  if (ok.violations.length > 0) {
    throw new Error(`Unexpected violation: ${ok.violations.join(", ")}`);
  }
});
