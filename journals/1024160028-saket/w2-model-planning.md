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