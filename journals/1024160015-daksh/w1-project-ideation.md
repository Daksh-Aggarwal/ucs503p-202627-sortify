# W1 : Project Ideation and Problem Definition

## Objective

The main goal for the first week was to decide on a project idea that would be
practical to implement as a Software Engineering project while still having
enough scope for meaningful development and solved an actual problem.

## Work Done

I worked on the initial ideation of the project and explored the problem we
wanted to solve. We decided to focus on waste segregation, specifically the
difficulty people face when they are unsure about how a particular waste item
should be disposed of.

The initial idea was to build a system that could identify a waste item from
an image and then tell the user what category it belongs to and how it should
be disposed of. I also considered that simply identifying the object would not
be enough, since the useful part for the user is knowing what to actually do
with it.

Based on this, we decided to build Sortify as a mobile-first application that
combines image-based identification with disposal guidance.

I was primarily responsible for developing the initial project idea and
defining the overall direction of the system. The final idea and scope were
discussed with the team before being taken forward.

## Initial Scope

The core workflow we decided on was:

1. User captures or uploads an image of a waste item.
2. The system identifies the likely waste item.
3. The identified item is mapped to a waste category.
4. The application provides disposal instructions and relevant information.

We also identified possible extensions such as manual search, scan history,
feedback, location-aware guidance and a conversational assistant.

## Outcome

By the end of the week, we had a clear problem statement and a basic idea of
what the system would need to do. This gave us a starting point for deciding
the architecture and technologies in the following stage.

## What I Learned

The main thing I learned during this stage was that the project should not be
defined only around the ML model since it's a Software Engineering project. The actual goal is to build a complete
software system around the model, with the model being one component of the
overall workflow.