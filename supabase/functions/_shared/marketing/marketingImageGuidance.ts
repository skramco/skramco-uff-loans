/** Guidance for canva_prompt (AI copy) and OpenAI hero image generation. */

export const CANVA_PROMPT_GUIDANCE = `
HERO IMAGE BRIEF (canva_prompt field) — this text is sent directly to OpenAI image generation:
- MUST visually illustrate the campaign's central metaphor, hook, joke, or story. Do NOT default to generic stock-office imagery.
- Be specific and cinematic: subject, setting, action, mood, and one memorable creative twist tied to the email content.
- Good examples: "Mortgage wizard in a tailored business suit conjuring organized loan files in a sunlit loft"; "Broker captain steering a ship through waves made of rate charts"; "Giant golden key unlocking a craftsman home at sunrise"; "Superhero broker rescuing a stuck loan file from a paperwork tornado — still corporate attire".
- Bad examples: "People in an office laughing", "Handshake in conference room", "Generic skyline" (unless the email is literally about those).
- Professional wholesale mortgage audience — clever, PG, broker-appropriate. No vulgarity, politics, grotesque humor, or meme-tier sloppiness.
- Funny tone: push absurd professional metaphors and visual jokes that make brokers smile.
- Always describe where a subtle hidden red #dc2626 accent object appears (pen, mug, tie, notebook corner, etc.).
`.trim();

export const MARKETING_IMAGE_STYLE_RULES = [
  "Versatile wide hero for email and LinkedIn — not a small social graphic.",
  "Render the creative brief faithfully. The image must reflect the campaign concept — literal or metaphorical.",
  "Generic conference-room stock photos, handshakes, and people laughing around a table are WRONG unless the brief explicitly calls for that.",
  "Creative editorial/cinematic visuals encouraged: whimsical metaphors, unexpected professional scenes (wizard in suit, chart-surfing broker, paperwork rescue) — imaginative but PG and broker-appropriate.",
  "Include one subtle hidden red #dc2626 accent item — discoverable on close look, not logo-like.",
  "Polished photorealism or cinematic illustration. No text overlays, readable words, rate numbers, logos, or borrower PII.",
  "Not offensive, political, grotesque, or unprofessional.",
].join(" ");
