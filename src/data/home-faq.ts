import { site } from "@/config/site";

/** One question and its answer, used on the page and in the FAQ schema. */
export type FaqItem = { question: string; answer: string };

/**
 * Questions a first-time visitor actually asks, answered from what this site
 * states elsewhere. The same entries feed the visible block and the FAQ schema,
 * never publish an answer in one and not the other.
 */
export const HOME_FAQ: readonly FaqItem[] = [
  {
    question: "Is DLX Properties a licensed Dubai brokerage?",
    answer: `Yes. ${site.name} is a Dubai real-estate brokerage based in ${site.address.street}, ${site.address.locality}, registered with RERA under ORN ${site.reraOrn}.`,
  },
  {
    question: "What does DLX actually do for a client?",
    answer:
      "Nine practices run by one team, in three groups: moving a property, holding one, and arriving in the country. One consultant stays with you from the first conversation to the last, with no hand-offs between desks.",
  },
  {
    question: "Do I need to be in Dubai to buy?",
    answer:
      "No. Much of our client base buys from abroad, and we are set up to represent buyers remotely, viewings, due diligence and negotiation handled on your behalf. Where a step legally requires you in person or through a power of attorney, we will tell you before you commit to anything.",
  },
  {
    question: "Where do the figures on this site come from?",
    answer:
      "Dubai Land Department open data, the registry every sale and every tenancy contract in Dubai is recorded in. Every figure states the period it covers and the export it was built from. DLX Properties is independent of the Dubai Land Department and is not endorsed by it.",
  },
] as const;

