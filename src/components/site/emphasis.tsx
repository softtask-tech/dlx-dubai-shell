import { Fragment, type ReactNode } from "react";

/**
 * One italic word inside a headline.
 *
 * The house headlines lean on a single emphasised word to carry the turn in
 * the sentence: "Ask first. *Then* decide." and "We'll tell you if it's a good
 * *idea*." The emphasis is part of the writing, so it belongs with the string
 * rather than being hard-coded into a component, which is what lets a
 * translator move it, or leave it out where the language does not want it.
 *
 * Asterisks are the marker, borrowed from Markdown because every translator
 * already knows what they mean. A string with no asterisks renders as plain
 * text, so this is safe to wrap around any copy, translated or not.
 *
 * Deliberately not a Markdown parser. It handles one inline emphasis and
 * nothing else: no links, no HTML, no `dangerouslySetInnerHTML`, so a
 * translated string can never inject markup.
 */
export function Emphasise({ text }: { text: string }): ReactNode {
  /* Split on the asterisk pairs, keeping the captured inner text. Odd indices
   * are the emphasised runs, which is what makes this a single pass. */
  const parts = text.split(/\*([^*]+)\*/g);

  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <em key={index} className="text-gold italic">
            {part}
          </em>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}
