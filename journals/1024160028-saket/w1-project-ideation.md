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