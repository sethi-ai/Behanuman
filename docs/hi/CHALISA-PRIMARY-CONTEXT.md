# Hanuman Chalisa as the primary h.i source

Approved product direction: the existing Hanuman Chalisa is primary; separately attributed Ramcharitmanas passages supplement it through explicit thematic links. This does not assert that the Chalisa narrates each episode.

The source audit contains43 unique existing verse IDs: D0, D2, C1–C40, D41. Original Devanagari lines and transliteration are copied unchanged from existing JSON, with English meaning/explanation as separate fields. They have not been replaced by model-generated text. The current deck strips trailing punctuation for display; the audit retains the exact stored original lines.

Provenance gap: original JSON does not pin an external edition for each verse or a licensed author/source for the meanings. data.js says meanings came from behanuman.md, which does not by itself establish authorship/rights. Existing display in Chant/Learn is not proof of approval for new Claude context.

Implementation status (17 October 2026): hiContext selects one approved Chaupai7 primary record and one separately approved Ramcharitmanas supplement for this test app. Both editorial and rights gates apply to each transmitted source. Other Chalisa meanings remain outside model context pending provenance review. The full archive is not indexed or sent to the model. No eligible primary means no generated response.

The selected source records have recorded test-app approval; this does not approve all43verse meanings or broader publication. Signed-in Claude is enabled with explicit transmission notice and bounded shared allowance. See RELEASE-2026-10-17.md.
