# W3: Initial System Design Planning with Dataflow Diagrams

## Objective

This week's focus was on translating the system design into formal dataflow diagrams, so that how data actually moves through Sortify between the user, the processes, and the stored data is documented clearly rather than just described in prose.

## Work Done

With the help of Draw.IO app, I built the Level-1 Data Flow Diagram for the system, breaking the single Sortify process from the context diagram into its five main functional processes: the Classification Model, the Map Guide (location-aware guidance), User Data (history and feedback), the Chatbot, and Management (admin control). This diagram also introduces the two data stores the rest of the system depends on D1 Knowledge Base and D2 User Data and shows how the User and Administrator interact with the processes through queries, answers, and management operations.

From there, I decomposed the more complex processes into their own supporting diagrams to show what happens inside them:

The ML Classification Process flow shows the path from the user's image through preprocessing and validation, into prediction (which reads from the D0 model weights store), and finally a confidence check. A low-confidence result loops back to the user for a retry, while a high-confidence result moves forward — this is where the "model is not treated as infallible" principle from the proposal actually gets represented structurally.
The User Data and Feedback Flow shows how the three user-facing operations saving a scan, logging feedback, and querying past scans all read from or write to the D2 User Data store.
The Administrative Management Flow shows the admin side equivalent: managing the catalog (writing to D1) and reviewing feedback and analytics (reading from D2).
The Location-Aware Disposal Guidance Flow shows how a waste lookup against D1 is passed through a location filter before producing the final disposal guidance shown to the user.
The Conversational Assistant Flow shows the chatbot understanding a query, then retrieving and generating a response using both D1 (for grounded knowledge) and D2 (for user/conversation context), with the response looped back to the user.

While drawing these, I kept checking that every flow entering or leaving a process matched what the higher-level diagram had already shown for that process, so the diagrams stay consistent with each other rather than contradicting the context and Level-1 views.

## Initial Scope

For this pass, the goal was to cover the processes that already had enough design detail to decompose meaningfully — classification, guidance mapping, user data, chatbot, and admin management. Diagrams for the mobile app screens and backend API structure were left out of scope for this week, since those depend on decisions (like exact endpoint design) that hadn't been finalized yet.

## Outcome

By the end of the week, the system had a complete, consistent set of dataflow diagrams: one Level-1 diagram showing the overall process breakdown, and five supporting diagrams detailing the internal logic of the classification, guidance, user data, admin, and chatbot processes. These were checked against each other for consistency and are ready to be included in the design section of the proposal.

## My Learnings
Keeping diagrams balanced across levels is harder in practice than it looks it's easy to add a flow while drawing a detailed sub-process and forget to check whether it should already have existed at the higher level.
Separating a process into its own diagram forces you to notice missing detail. Drawing the classification flow, for instance, made the low-confidence retry loop concrete in a way that describing it in a sentence hadn't.
Data stores are a useful test of whether the design actually holds together every store needs at least one process writing to it and one reading from it, and checking that helped catch where a flow was one-directional when it should not have been.