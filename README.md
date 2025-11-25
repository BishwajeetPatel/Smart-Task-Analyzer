Smart Task Analyzer

Smart Task Analyzer is an intelligent task-management system designed to help you prioritize work based on urgency, importance, effort, and dependencies. By combining weighted scoring with flexible strategies, it provides practical recommendations that adapt to different work styles and planning contexts.

🚀 Quick Start
Prerequisites

Python 3.8+

pip

Git

Installation

Clone the repository

git clone https://github.com/yourusername/task-analyzer.git
cd task-analyzer


Create a virtual environment

python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate


Install dependencies

pip install -r requirements.txt


Run backend migrations

cd backend
python manage.py makemigrations
python manage.py migrate


Start the development server

python manage.py runserver


API will run at http://localhost:8000.

Open the frontend

Open frontend/index.html directly, or

Run a quick static server:

python -m http.server 8080

📋 Project Structure
task-analyzer/
├── backend/
│   ├── manage.py
│   ├── task_analyzer/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── tasks/
│       ├── models.py
│       ├── serializers.py
│       ├── views.py
│       ├── scoring.py
│       ├── urls.py
│       └── tests.py
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── requirements.txt
└── README.md

🧮 Algorithm Explanation

The system uses a weighted scoring model to determine task priority, balancing four key inputs.

1. Urgency (35% – Smart Balance default)

Urgency is calculated by evaluating how close a task is to its due date, with overdue tasks receiving an exponential penalty:

Overdue → starts at 10 and rises by 0.5 per overdue day

Today → 9

Tomorrow → 7

2–3 days → 6

4–7 days → 4

8–14 days → 3

15+ days → 2

This ensures overdue tasks rise naturally without overwhelming everything else.

2. Importance (30%)

A direct 1–10 rating set by the user, used to ensure high-value tasks stay visible even when deadlines aren’t urgent.

3. Effort (15%)

Lower effort yields higher score:

effort_score = max(1, 10 - (hours / 2))


This highlights “quick win” tasks that encourage momentum.

4. Dependencies (20%)

Tasks that unblock others receive higher weight:

dependency_score = min(10, 5 + dependent_count * 2)


Capped at 10 to prevent runaway values.

Final Scoring Formula
priority_score = (
    urgency_score * 0.35 +
    importance_score * 0.30 +
    effort_score * 0.15 +
    dependency_score * 0.20
)


Scores typically fall between 2–10, mapped as:

7–10: High

4–7: Medium

1–4: Low

Supported Strategies

Smart Balance (default) — even mix of urgency, importance, effort, and dependencies

Fastest Wins — focuses on small, quick tasks

High Impact — importance-heavy for strategic work

Deadline Driven — urgency dominates for time-sensitive workflows

🔍 Edge Cases Handled

Circular dependencies detected using DFS and flagged

Missing due dates cause the task to be skipped

Missing hours → defaults to 1 hour

Missing importance → defaults to 5

Importance auto-clamped to 1–10

Negative hours corrected to minimum 0.5

Overdue tasks clearly marked

No dependencies → baseline dependency score of 5

Self-dependencies treated as circular

🎯 Design Decisions & Trade-offs

The system uses a normalized weighted model to keep scoring predictable and readable. Exponential penalties ensure overdue tasks receive appropriate urgency. Effort scoring favors small tasks to maintain momentum. Dependency scoring sits at 20% to influence but not dominate decisions. Multiple strategies exist because different workflows require different balancing, even though it adds a bit more complexity.

🧪 Testing

Run the full suite:

python manage.py test tasks

Coverage Includes

Overdue urgency behavior

Circular dependency detection

Missing data handling

Effort–score relationship

Importance validation

Dependency scoring

Strategy switching

Run a specific test:
python manage.py test tasks.tests.TaskPriorityScorerTests.test_overdue_task_priority

📡 API Documentation
POST /api/tasks/analyze/

Analyzes tasks and returns detailed scoring.

Request:

{
  "tasks": [
    {
      "id": "task_1",
      "title": "Fix login bug",
      "due_date": "2025-11-30",
      "estimated_hours": 3,
      "importance": 8,
      "dependencies": ["task_2"]
    }
  ],
  "strategy": "smart_balance"
}


Response:

{
  "success": true,
  "task_count": 1,
  "strategy": "smart_balance",
  "tasks": [
    {
      "id": "task_1",
      "priority_score": 7.85,
      "score_breakdown": {
        "urgency": 6.0,
        "importance": 8.0,
        "effort": 8.5,
        "dependencies": 5.0,
        "days_until_due": 5
      },
      "has_circular_dependency": false
    }
  ]
}

POST /api/tasks/suggest/

Returns the top 3 recommended tasks.

Example Response:

{
  "success": true,
  "message": "Here are the top 3 tasks you should work on today",
  "strategy": "smart_balance",
  "suggestions": [
    {
      "id": "task_1",
      "title": "Fix login bug",
      "priority_score": 8.95,
      "explanation": "Due in 2 days • High importance • Quick win"
    }
  ]
}

⏱️ Time Breakdown
Section	Estimated	Actual
Algorithm Design	90 min	75 min
Backend Implementation	45 min	60 min
Frontend Development	60 min	70 min
Testing & Documentation	30 min	45 min
Total	3h 45m	4h 10m

Extra time mainly went into edge-case work and UI polish.

🎁 Bonus Features
Implemented

Circular dependency detection with DFS

Smart date intelligence including overdue handling

Comprehensive unit test suite

Not Implemented

Eisenhower Matrix view

Learning/ML-based adaptive scoring

🚀 Future Improvements

Potential enhancements include user authentication, persistent storage, weekend-aware urgency, Eisenhower visualization, task templates, ML-based weight tuning, mobile app support, and team collaboration features.

🐛 Known Limitations

No database persistence

No user login

Strategy weights not customizable through UI

Basic dependency handling only

No recurring tasks

📝 License

This project was created as part of the Singularium internship evaluation.
