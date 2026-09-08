# W1: Project Ideation and Problem Exploration

## Objective

This week's goal was to find a real problem worth solving and scope it down to something we could actually finish in the course timeline.I worked on picking a project idea, writing a clear problem statement, our focus was to solve a genuine problem with the engineering aspect of it in mind, without focusing too much on the research part.

## Work Done

I with my team brainstromed ideas for the project, exploring what problem we want to solve. We settled on waste management specifically the everyday difficulty people face in figuring out who and where an item shall be disposed of ?

I helped in defining the core goal: reduce the uncertainty a person feels right at the moment they have to decide how to dispose of something, rather than trying to address waste management as a whole, which involves infrastructure and policy well outside the scope of our project.

I contributed to breaking this problem down into more specific reasons it is hard for users not knowing an item's waste category, disposal information being scattered across different sources, incorrect segregation caused by that uncertainty, guidance that identifies an item but stops short of saying what to do with it, and disposal rules that vary by location. This helped us move from a general sense that "waste disposal is confusing" to a problem statement we could actually design around.

I was also involved in exploring what a mobile assistant for this problem could look like one that identifies a waste item from a photo and pairs that with real disposal instructions, rather than functioning as a plain image classifier with no practical follow-through for the user.

Alongside this, I worked with the team on an early time-to-value principle: the core loop of capturing or uploading an image, identifying the item, and showing disposal guidance needed to work end-to-end before anything else. Features like history, feedback, and an admin panel were deliberately left for later, with the system planned to be modular enough that adding them would not require rebuilding the core.

## Initial Scope

The core workflow we decided on was:

1. User captures or uploads an image of a waste item.
2. The system identifies the likely waste item.
3. The identified item is mapped to a waste category.
4. The application provides disposal instructions and relevant information.

We also identified possible extensions such as manual search, scan history,
feedback, location-aware guidance and a conversational assistant.

## Outcome

By the end of the week we had a clear, validated problem statement and a well defined goal. With keeping this project strictly for engineering aspect without going into its research part we formed the base for the problem statement and proposed solution sections of the formal proposal.

## My Learnings

A problem statement needs specific, concrete examples, not just a general feeling that something is inconvenient. Naming exact items like a medicine strip or a battery forced us to be precise about what we were actually solving.

Narrowing the scope early made a big difference. It was tempting to describe this as "solving waste management," but reducing it to "helping one user decide how to dispose of one item" made every later decision much simple



# W2: ML Model Architecture Planning and Technology Selection

## Objective

This week's my main decision was whether to build our own image classification model from scratch or use a pretrained model and adapt it to waste classification. Alongside this, I looked into candidate datasets we could actually train or fine-tune on, since the right dataset would also affect which approach made sense.

## Work Done

I looked into the tradeoffs between training a model from scratch versus using a pretrained architecture with transfer learning or fine tuning. Training from scratch would need a much larger labeled dataset and far more compute and time than we realistically have for this project, and there was no strong reason to think a custom architecture would outperform an established, pretrained one for this kind of image classification task. Based on this, I leaned toward using a pretrained model and adapting it to our specific categories rather than starting from zero.

To make that decision concrete, I explored two candidate datasets:

The first dataset organizes waste into four broad categories — Hazardous, Non-Recyclable, Organic, and Recyclable with subcategories under each (for example, batteries and medical waste under Hazardous; plastic wrappers and styrofoam under Non-Recyclable; food waste and green waste under Organic; and paper, glass, and plastic bottles under Recyclable).
The second dataset is more specialized and focused on medical and hazardous waste specifically, with categories like gloves, masks, syringes, syringe needles, gauze, and medical packaging, totaling around 9k labeled images.

Comparing the two made it clear that they are not directly compatible the first gives broad category coverage but is shallow on hazardous/medical items specifically, while the second is much deeper on medical waste but does not cover the other categories at all. I noted that using both would mean mapping their labels onto our own category system rather than using either one's taxonomy directly.

## Initial Scope

For now, the plan is to treat the four-category dataset as the primary source for the initial model, since it covers the general categories Sortify needs to support. The medical waste specific dataset is being kept aside as a possible way to strengthen the hazardous category later, since medical waste is currently underrepresented in the first dataset. Finalizing exactly how the two would be merged, and whether both are even necessary for the initial version, is left open for next week.

## Outcome

We decided to move forward with a pretrained model adapted through transfer learning or fine tuning, rather than training an architecture from scratch. We want to keep the model development process realistic in scope and focus more effort on training, evaluation, and integrating the model with the backend rather than on architecture design. We also identified two usable dataset candidates and the category-mapping problem that will need to be resolved before training begins.

## My Learnings
The choice between pretrained and from-scratch isn't really about which is better in the abstract it comes down to how much labeled data and compute you actually have, and for a project on this timeline, a pretrained model is the only realistic option.
Public datasets rarely match your exact category system out of the box. Finding a dataset isn't the end of the work mapping its labels onto your own categories is its own task, and with a bit of experience with YOLO i know doing it early avoids surprises during training.
Combining datasets with different granularity (a broad general dataset and a narrow specialized one) is a real design decision, not just a data collection detail. I think it would affect how balanced the final training set will be across categories.



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