#PROJECT :

building a:

Local-first collaborative photo review system
that maps real filesystem directories into structured review workflows.

That means:

Physical files exist on disk
You index them into a relational model
You build collaboration state on top (votes, rename, conflicts)
You stream efficiently without copying full-resolution files
This is a hybrid system:
Filesystem = source of truth for image bytes

PostgreSQL = source of truth for metadata + collaboration state

Keep this separation clear.

2️⃣ Core Domain Model (Architecture Thinking)

We model reality.

Hierarchy
User
  └── Project
         └── Library
                └── Photo
                       ├── Votes
                       └── Rename Suggestions
Why not nested projects?

Because filesystem already gives structure.
You don’t need recursive abstraction yet.
Keep cognitive load low.

#CODE INSTRUCTIONS
- follow clean and simple codes
- keep Everything modular
- dont write complex codes, implement only readable code
- Always think of Performance
- look existing code and write in According style
- make sure Following Professional Guidelines and Security measures.
