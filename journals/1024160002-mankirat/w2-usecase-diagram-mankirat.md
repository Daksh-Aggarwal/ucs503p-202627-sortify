# W2: Initial System Design Planning with Use Case Diagram

## Objective

This week, my main focus was to create the use case diagram for Sortify. The goal was to show the system from the point of view of the people using it, mainly the User and the Administrator.

## Work Done

I started by identifying the main actions each actor can perform in the system. For the User, these included scanning waste, manually searching for an item, saving scans, viewing scan history, giving feedback, using the chatbot, viewing statistics, selecting location, and reading educational information. I also included login and registration because both users and administrators need access to the system.

For the Administrator, I focused on the management side of the system. These use cases included managing waste items, managing disposal guidelines, reviewing feedback, and viewing analytics. Keeping the admin actions separate from the user actions made the diagram easier to understand.

The most important part of this work was showing the relationships between use cases properly. For example, Scan Waste includes Identify Waste because scanning leads to identification. Identify Waste includes View Disposal Guidance because the user needs guidance after the item is identified. Manual Search also leads to View Disposal Guidance.

I used an extend relationship for the low-confidence prediction case. This is because it only happens in some situations, not every time the system identifies an item. That made extend the correct choice instead of include.

## Initial Scope

For this version, I only included the use cases that were already clear enough to define properly. I did not go too deep into smaller details because those can be refined later in the design process.

## Outcome

By the end of the week, the use case diagram gave a clear view of what the User and Administrator can do in Sortify. It also showed how some actions are connected through shared functions like identification and disposal guidance.

## What I Learned

- I learned that include and extend have different meanings, and using the wrong one can change the meaning of the diagram.
- I also learned that separating actors clearly makes the whole system easier to read and understand.
- This task helped me see that a use case diagram should focus on user goals, not just a list of features.
