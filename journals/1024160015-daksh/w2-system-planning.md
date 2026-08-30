# W2 : System Planning and Technology Selection

## Objective

After finalizing the basic project idea, the next step was to decide how the
system would be structured and which technologies would be suitable for
implementing it.

## Work Done

I worked on planning the overall architecture of the project and deciding the
technology stack that we would use.

The application is planned as a mobile-first system, with the frontend,
backend, database and ML component being kept as separate parts of the system.
This was important because we wanted the ML model to handle identification
while the rest of the application would be responsible for retrieving and
presenting the actual disposal guidance.

The main technologies selected were:

- React Native for the mobile application.
- FastAPI for the backend and REST APIs.
- PostgreSQL/SQLite for storing application and waste-related data.
- PyTorch for the ML component.
- An LLM API with retrieval-augmented generation for the chatbot.
- Token-based authentication with role-based authorization.
- Automated testing and CI/CD for development and deployment.

The proposed backend would handle authentication, image upload and inference,
waste information retrieval, scan history, feedback and administrative
operations.

## System Planning

I also worked on deciding the major components that would be required in the
system. These included:

- Mobile application
- Backend API
- ML prediction service
- Waste knowledge base
- User data and scan history
- Feedback system
- Administrative functionality
- Conversational assistant

The idea was to keep these components modular so that additional features
could be added later without having to redesign the entire system.

## Outcome

By the end of the week, we had a much clearer idea of how the project would be
implemented rather than just what the application would do. The technology
stack and major system components were decided and could be used as the basis
for the project proposal.

## What I Learned

I learned that choosing the technology stack is not just about picking
technologies that are individually suitable. The technologies also need to
fit together and support the overall architecture of the application.