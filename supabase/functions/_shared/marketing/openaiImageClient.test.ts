import { applyMarketingImageStyleRules, buildImagePrompt } from "./openaiImageClient.ts";

Deno.test("buildImagePrompt prioritizes canva_prompt over generic office imagery", () => {
  const prompt = buildImagePrompt({
    title: "Loan Rescue Magic",
    email_subject: "Your pipeline needs a wizard",
    canva_prompt:
      "Mortgage wizard in a tailored business suit conjuring organized loan files in a modern loft, subtle red pen on desk",
    metadata: { email_tone: "funny", funny_word: "Mortgage-mentum" },
  });
  if (!prompt.includes("Mortgage wizard")) {
    throw new Error("Expected canva_prompt concept in image prompt");
  }
  if (prompt.includes("handshake") || prompt.includes("conference room")) {
    throw new Error("Should not inject generic office clichés");
  }
});

Deno.test("applyMarketingImageStyleRules rejects generic stock guidance", () => {
  const styled = applyMarketingImageStyleRules("A broker hero scene");
  if (!styled.includes("Generic conference-room stock photos")) {
    throw new Error("Expected anti-stock-photo rule");
  }
  if (!styled.includes("Creative editorial")) {
    throw new Error("Expected creative visual encouragement");
  }
});
