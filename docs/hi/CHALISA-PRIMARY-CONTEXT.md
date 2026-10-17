# Hanuman Chalisa as the primary h.i source

Approved product direction: the existing Hanuman Chalisa is primary; separately attributed Ramcharitmanas passages supplement it through explicit thematic links. This does not assert that the Chalisa narrates each episode.

The source audit contains43 unique existing verse IDs: D0, D2, C1–C40, D41. Original Devanagari lines and transliteration are copied unchanged from existing JSON, with English meaning/explanation as separate fields. They have not been replaced by model-generated text. The current deck strips trailing punctuation for display; the audit retains the exact stored original lines.

Provenance gap: original JSON does not pin an external edition for each verse or a licensed author/source for the meanings. data.js says meanings came from behanuman.md, which does not by itself establish authorship/rights. Existing display in Chant/Learn is not proof of approval for new Claude context.

Implementation status: complete structured source audit saved, primary-source direction recorded, but primary Chalisa retrieval is NOT yet integrated into hi.reflect. The full Ramcharitmanas archive is not indexed or sent to the model. A future resolver must return at most one approved Chalisa passage and one separately approved supplementary story, preserving work/ID/exact text/meaning/provenance and tagging the cross-link thematic. Require editorial+rights gates for each transmitted component, then show generated modern reflection separately. When no eligible primary source exists, return no reviewed passage; do not use a model's memory to invent scripture.

No source is self-approved in this audit. Live Claude remains disabled. Read alongside RAMCHARITMANAS-REVIEW.md and CONTENT-REVIEW.md.
