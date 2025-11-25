# Smart Task Analyzer

An intelligent task management system that prioritizes tasks based on multiple factors including urgency, importance, effort, and dependencies.

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/task-analyzer.git
cd task-analyzer
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Run migrations**
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

5. **Start the development server**
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000`

6. **Open the frontend**
- Simply open `frontend/index.html` in your browser
- Or use a local server: `python -m http.server 8080` from the frontend directory

## 📋 Project Structure

```
task-analyzer/
├── backend/
│   ├── manage.py
│   ├── task_analyzer/
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── tasks/
│       ├── __init__.py
│       ├── models.py          # Task model definition
│       ├── serializers.py     # DRF serializers
│       ├── views.py           # API endpoints
│       ├── scoring.py         # Priority scoring algorithm
│       ├── urls.py            # URL routing
│       └── tests.py           # Unit tests
├── frontend/
│   ├── index.html             # Main UI
│   ├── styles.css             # Styling
│   └── script.js              # Frontend logic
├── requirements.txt
└── README.md
```

## 🧮 Algorithm Explanation

### Overview
The Smart Task Analyzer uses a **multi-factor weighted scoring system** to intelligently prioritize tasks. The algorithm considers four primary factors:

### 1. **Urgency Component (35% weight in Smart Balance)**

The urgency score is calculated based on days until the due date, with special handling for overdue tasks:

- **Overdue tasks**: Score of 10+ with exponential increase (10 + days_overdue × 0.5)
  - Example: 5 days overdue = 12.5 urgency score
- **Due today**: 9.0
- **Due tomorrow**: 7.0
- **Due in 2-3 days**: 6.0
- **Due in 4-7 days**: 4.0
- **Due in 8-14 days**: 3.0
- **Due in 15+ days**: 2.0

**Rationale**: Overdue tasks receive exponentially increasing penalties to ensure they bubble to the top of the priority list. The exponential nature prevents tasks from becoming "permanently stuck" while still maintaining urgency for recent deadlines.

### 2. **Importance Component (30% weight)**

Direct mapping of user-provided importance rating (1-10 scale).

- Users manually assign importance based on business value, stakeholder priority, or strategic alignment
- Provides human judgment override for urgency-driven scoring
- Clamped to 1-10 range to prevent invalid inputs

**Rationale**: Not all urgent tasks are important. This component ensures high-value work isn't deprioritized just because it has a distant deadline.

### 3. **Effort Component (15% weight)**

Inverse relationship scoring that prioritizes "quick wins":

**Formula**: `max(1, 10 - (hours / 2))`

- 1 hour task = 9.5 score
- 3 hour task = 8.5 score
- 8 hour task = 6.0 score
- 20+ hour task = 1.0 score (minimum)

**Rationale**: Quick wins provide momentum and morale. When choosing between tasks of similar urgency and importance, completing the shorter task first often makes psychological and practical sense.

### 4. **Dependencies Component (20% weight)**

Scores tasks based on how many other tasks depend on them:

**Formula**: `min(10, 5 + (dependent_count × 2))`

- No dependents = 5.0 baseline
- 1 dependent = 7.0
- 2 dependents = 9.0
- 3+ dependents = 10.0 (capped)

**Rationale**: Tasks that block others create bottlenecks in workflow. Prioritizing these "unblocking" tasks maximizes team velocity and prevents cascading delays.

### Final Score Calculation

```python
priority_score = (
    urgency_score × 0.35 +
    importance_score × 0.30 +
    effort_score × 0.15 +
    dependency_score × 0.20
)
```

This produces a score typically ranging from 2-10, where:
- **7-10**: High Priority (Red)
- **4-7**: Medium Priority (Yellow)
- **1-4**: Low Priority (Green)

### Strategy Variations

The algorithm supports four different prioritization strategies by adjusting weights:

1. **Smart Balance** (Default)
   - Urgency: 35%, Importance: 30%, Effort: 15%, Dependencies: 20%
   - Best for balanced productivity

2. **Fastest Wins**
   - Effort: 70%, Urgency: 20%, Importance: 10%
   - Maximizes task completion count

3. **High Impact**
   - Importance: 70%, Urgency: 20%, Effort: 10%
   - Focuses on business value

4. **Deadline Driven**
   - Urgency: 70%, Importance: 20%, Effort: 10%
   - Prevents missed deadlines

## 🔍 Edge Cases Handled

### 1. **Circular Dependencies**
- Detected using depth-first search (DFS) algorithm
- Tasks in cycles are flagged with warnings
- Prevents infinite loops in dependency resolution

### 2. **Missing or Invalid Data**
- **Missing due_date**: Task skipped with error message
- **Missing estimated_hours**: Defaults to 1.0 hour
- **Missing importance**: Defaults to 5 (medium)
- **Invalid importance**: Clamped to 1-10 range
- **Negative hours**: Set to minimum 0.5 hours

### 3. **Past Due Dates**
- Exponential urgency penalty prevents them from being ignored
- Clearly marked as "OVERDUE" in UI
- Days overdue shown explicitly

### 4. **Zero or Empty Dependencies**
- Treated as independent tasks (no blocking relationships)
- Baseline dependency score of 5.0 applied

### 5. **Self-Dependencies**
- Automatically treated as circular dependency
- Flagged with warning

## 🎯 Design Decisions & Trade-offs

### 1. **Why Weighted Average Instead of Additive?**
**Decision**: Used weighted percentages that sum to 1.0

**Rationale**: 
- Keeps scores in predictable 1-10 range
- Makes strategy switching intuitive
- Prevents one factor from dominating arbitrarily

**Trade-off**: Less flexibility for extreme prioritization, but more interpretable results

### 2. **Why Exponential Penalty for Overdue Tasks?**
**Decision**: Overdue urgency = 10 + (days_overdue × 0.5)

**Rationale**:
- Linear penalties allow overdue tasks to be perpetually deprioritized
- Exponential ensures they rise to the top quickly
- Moderate coefficient (0.5) prevents score explosion

**Trade-off**: Very overdue tasks might overshadow genuinely important work, but this is usually desired behavior

### 3. **Why Inverse Effort Scoring?**
**Decision**: Shorter tasks get higher effort scores

**Rationale**:
- Aligns with "Getting Things Done" methodology
- Provides psychological wins
- Reduces task list length faster

**Trade-off**: Might deprioritize important long-term work if not balanced with importance weight

### 4. **Why 20% Weight for Dependencies?**
**Decision**: Dependencies get significant but not dominant weight

**Rationale**:
- Unblocking others is important for team productivity
- But not all blocking tasks are urgent or important
- 20% allows it to tip the scales between similar tasks

**Trade-off**: Tasks with many dependents might get prioritized even if they're not actually urgent

### 5. **Why Allow Multiple Strategies?**
**Decision**: Four configurable strategies instead of one-size-fits-all

**Rationale**:
- Different work contexts need different prioritization
- Sprint planning vs. daily work vs. crisis mode
- Users understand their context better than any algorithm

**Trade-off**: More complexity, but much more practical utility

## 🧪 Testing

Run the test suite:
```bash
python manage.py test tasks
```

### Test Coverage

The test suite includes:

1. **test_overdue_task_priority**: Verifies overdue tasks get urgency ≥ 10
2. **test_circular_dependency_detection**: Ensures cycles are detected correctly
3. **test_missing_data_handling**: Confirms graceful handling of incomplete data
4. **test_effort_inverse_relationship**: Validates lower effort = higher score
5. **test_importance_clamping**: Checks 1-10 range enforcement
6. **test_dependency_blocking_score**: Verifies blocking task scoring
7. **test_strategy_switching**: Ensures different strategies produce different scores

### Running Individual Tests
```bash
python manage.py test tasks.tests.TaskPriorityScorerTests.test_overdue_task_priority
```

## 📡 API Documentation

### POST /api/tasks/analyze/

Analyze and sort a list of tasks by priority.

**Request Body:**
```json
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
```

**Response:**
```json
{
  "success": true,
  "strategy": "smart_balance",
  "task_count": 1,
  "tasks": [
    {
      "id": "task_1",
      "title": "Fix login bug",
      "due_date": "2025-11-30",
      "estimated_hours": 3,
      "importance": 8,
      "dependencies": ["task_2"],
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
```

### POST /api/tasks/suggest/

Get top 3 task recommendations with explanations.

**Request Body:** Same as `/analyze/`

**Response:**
```json
{
  "success": true,
  "strategy": "smart_balance",
  "message": "Here are the top 3 tasks you should work on today",
  "suggestions": [
    {
      "id": "task_1",
      "title": "Fix login bug",
      "priority_score": 8.95,
      "explanation": "Due in 2 days • High importance • Quick win"
    }
  ]
}
```

## ⏱️ Time Breakdown

| Section | Estimated | Actual |
|---------|-----------|--------|
| Algorithm Design | 90 min | 75 min |
| Backend Implementation | 45 min | 60 min |
| Frontend Development | 60 min | 70 min |
| Testing & Documentation | 30 min | 45 min |
| **Total** | **3h 45min** | **4h 10min** |

### Time Allocation Notes:
- Spent extra time on comprehensive edge case handling
- Frontend took longer due to polishing UI/UX
- Documentation was more thorough than minimum required

## 🎁 Bonus Features Implemented

✅ **Circular Dependency Detection** (45 min)
- DFS-based cycle detection algorithm
- Visual flagging in UI
- Warnings in API responses

✅ **Date Intelligence** (included in core)
- Days until due calculated accurately
- Overdue handling with visual indicators
- Weekend-aware could be added in future

❌ **Eisenhower Matrix View** (Not implemented)
- Would require 2D visualization
- Estimated 45-60 min
- Skipped in favor of polish on core features

❌ **Learning System** (Not implemented)
- Complex machine learning requirement
- Estimated 1+ hour
- Beyond internship scope

✅ **Comprehensive Unit Tests** (45 min)
- 7 test cases covering major scenarios
- Edge case validation
- Strategy testing

## 🚀 Future Improvements

If I had more time, I would add:

1. **User Authentication & Persistence**
   - Save tasks to database
   - User-specific task lists
   - ~2-3 hours

2. **Advanced Date Intelligence**
   - Skip weekends/holidays in urgency calculation
   - Business hours consideration
   - ~1 hour

3. **Eisenhower Matrix Visualization**
   - 2D grid: Urgent vs Important
   - Drag-and-drop task repositioning
   - ~1.5 hours

4. **Task Templates**
   - Pre-defined common tasks
   - Import from external calendars
   - ~1 hour

5. **Machine Learning Adaptation**
   - Learn from user behavior
   - Adjust weights automatically
   - ~4-6 hours

6. **Mobile App**
   - React Native implementation
   - Push notifications for due tasks
   - ~1 week

7. **Team Features**
   - Shared task lists
   - Dependency visualization
   - Collaboration tools
   - ~1 week

## 🐛 Known Limitations

1. **No Data Persistence**: Tasks are lost on page refresh (by design for this assignment)
2. **No User Authentication**: Single-user system
3. **Static Strategies**: Weights can't be customized per-user in UI
4. **Basic Dependency Handling**: No sub-task or partial dependency support
5. **No Recurring Tasks**: Each task is one-time only

## 📝 License

This project was created as an internship assessment for Singularium.

## 👤 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

## 🙏 Acknowledgments

- Django REST Framework documentation
- React documentation
- Tailwind CSS for styling inspiration
- Singularium for the excellent assignment design#   S m a r t - T a s k - A n a l y z e r  
 