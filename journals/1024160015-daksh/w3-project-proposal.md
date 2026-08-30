# W3 : Project Proposal and Initial System Design

## Objective

The main goal for this week was to convert the project idea and initial
technical decisions into a proper project proposal.

## Work Done

I worked on writing the project proposal and putting together the overall
description of the system.

The proposal covers the problem statement, proposed solution, system
architecture, core workflow, technology stack, evaluation criteria, project
scope, risks and expected deliverables.

I was responsible for writing the proposal and organizing the technical
details into a consistent structure. The proposal also defines the main
workflow of the application, starting from image capture/upload and ending
with disposal guidance.

I also worked on integrating the system design into the proposal. The team
members contributed the diagrams used in the document, including the context
diagram, use case diagram and data flow diagrams, which were then incorporated
into the proposal.

## System Design

The initial design separates the ML prediction from the disposal guidance
system. The ML model is responsible for recognizing the waste item, while the
backend and knowledge base handle the category, disposal method, safety
information and other relevant guidance.

The proposal also defines the main user workflow:

1. Capture or upload an image.
2. Validate the image.
3. Run the ML prediction.
4. Retrieve the relevant waste information.
5. Display the predicted item and disposal guidance.
6. Allow the user to save or correct the result.
7. Store the scan and feedback for future use.

## Additional Features

While defining the initial scope, we also included features such as manual
search, location-aware guidance, scan history, user feedback, an educational
section and a conversational assistant.

The chatbot is planned to use retrieval-augmented generation so that its
responses are grounded in the waste knowledge base instead of relying only
on an unrestricted language model.

## Outcome

The project proposal was completed with the initial system architecture,
technology choices, scope and evaluation approach defined.

This gives us a clear reference point for starting the actual implementation
of the project in the coming weeks.

## What I Learned

This week helped me understand the difference between having an idea and
turning that idea into an actual Software Engineering project. While writing
the proposal, I had to think about the complete system, including its
architecture, data flow, testing, scalability and possible failure cases,
rather than only the main feature.