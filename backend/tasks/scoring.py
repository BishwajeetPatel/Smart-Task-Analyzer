from datetime import date
from typing import List, Dict, Set


class TaskPriorityScorer:
    """
    Intelligent task priority scoring system.
    
    This class implements a multi-factor algorithm that considers:
    - Urgency: How soon the task is due
    - Importance: User-provided rating (1-10)
    - Effort: Estimated hours (inverse relationship)
    - Dependencies: How many tasks depend on this one
    """
    
    # Strategy weight configurations
    STRATEGIES = {
        'smart_balance': {
            'urgency': 0.35,
            'importance': 0.30,
            'effort': 0.15,
            'dependencies': 0.20
        },
        'fastest_wins': {
            'urgency': 0.20,
            'importance': 0.10,
            'effort': 0.70,
            'dependencies': 0.00
        },
        'high_impact': {
            'urgency': 0.20,
            'importance': 0.70,
            'effort': 0.10,
            'dependencies': 0.00
        },
        'deadline_driven': {
            'urgency': 0.70,
            'importance': 0.20,
            'effort': 0.10,
            'dependencies': 0.00
        }
    }
    
    def __init__(self, strategy: str = 'smart_balance'):
        """Initialize scorer with a specific strategy."""
        self.strategy = strategy
        self.weights = self.STRATEGIES.get(strategy, self.STRATEGIES['smart_balance'])
    
    def calculate_urgency_score(self, due_date: date) -> float:
        """
        Calculate urgency score based on days until due.
        
        Scoring logic:
        - Overdue: 10+ (exponential increase)
        - Due today: 9
        - Due tomorrow: 7
        - Due in 2-3 days: 6
        - Due in 4-7 days: 4
        - Due in 8-14 days: 3
        - Due in 15+ days: 2
        """
        today = date.today()
        days_until_due = (due_date - today).days
        
        if days_until_due < 0:
            # Overdue - exponential penalty
            return min(10.0, 10.0 + abs(days_until_due) * 0.5)
        elif days_until_due == 0:
            return 9.0
        elif days_until_due == 1:
            return 7.0
        elif days_until_due <= 3:
            return 6.0
        elif days_until_due <= 7:
            return 4.0
        elif days_until_due <= 14:
            return 3.0
        else:
            return 2.0
    
    def calculate_importance_score(self, importance: int) -> float:
        """
        Direct mapping of user importance (1-10).
        Clamps value to valid range.
        """
        return float(max(1, min(10, importance)))
    
    def calculate_effort_score(self, estimated_hours: float) -> float:
        """
        Calculate effort score (inverse relationship).
        Lower effort tasks get higher scores (quick wins).
        
        Formula: max(1, 10 - (hours / 2))
        """
        hours = max(0.5, estimated_hours)
        return max(1.0, 10.0 - (hours / 2.0))
    
    def calculate_dependency_score(
        self, 
        task_id: str, 
        all_tasks: List[Dict]
    ) -> float:
        """
        Calculate dependency score based on how many tasks depend on this one.
        Tasks that block others should be prioritized.
        
        Base score: 5
        Each dependent task adds: +2 points
        Max score: 10
        """
        dependent_count = sum(
            1 for task in all_tasks
            if task_id in task.get('dependencies', [])
        )
        return min(10.0, 5.0 + dependent_count * 2.0)
    
    def calculate_priority_score(
        self, 
        task: Dict, 
        all_tasks: List[Dict]
    ) -> Dict:
        """
        Calculate comprehensive priority score for a task.
        
        Returns:
            Dict with total score and breakdown of components
        """
        # Handle missing or invalid data with defaults
        due_date = task.get('due_date')
        if isinstance(due_date, str):
            due_date = date.fromisoformat(due_date)
        
        estimated_hours = task.get('estimated_hours', 1.0)
        importance = task.get('importance', 5)
        task_id = task.get('id', '')
        
        # Calculate individual components
        urgency = self.calculate_urgency_score(due_date)
        importance_score = self.calculate_importance_score(importance)
        effort = self.calculate_effort_score(estimated_hours)
        dependencies = self.calculate_dependency_score(task_id, all_tasks)
        
        # Calculate weighted total
        total_score = (
            urgency * self.weights['urgency'] +
            importance_score * self.weights['importance'] +
            effort * self.weights['effort'] +
            dependencies * self.weights['dependencies']
        )
        
        return {
            'total': round(total_score, 2),
            'breakdown': {
                'urgency': round(urgency, 2),
                'importance': round(importance_score, 2),
                'effort': round(effort, 2),
                'dependencies': round(dependencies, 2),
                'days_until_due': (due_date - date.today()).days
            }
        }
    
    def detect_circular_dependencies(self, tasks: List[Dict]) -> Set[str]:
        """
        Detect circular dependencies using depth-first search.
        
        Returns:
            Set of task IDs that are part of circular dependencies
        """
        visited = set()
        recursion_stack = set()
        circular = set()
        
        # Create task lookup
        task_map = {task.get('id'): task for task in tasks}
        
        def has_cycle(task_id: str) -> bool:
            """DFS helper to detect cycles."""
            if task_id in recursion_stack:
                circular.add(task_id)
                return True
            
            if task_id in visited:
                return False
            
            visited.add(task_id)
            recursion_stack.add(task_id)
            
            task = task_map.get(task_id)
            if task:
                dependencies = task.get('dependencies', [])
                for dep_id in dependencies:
                    if has_cycle(dep_id):
                        circular.add(task_id)
            
            recursion_stack.remove(task_id)
            return False
        
        # Check all tasks
        for task in tasks:
            task_id = task.get('id')
            if task_id and task_id not in visited:
                has_cycle(task_id)
        
        return circular
    
    def score_and_sort_tasks(self, tasks: List[Dict]) -> List[Dict]:
        """
        Score all tasks and sort by priority.
        
        Returns:
            Sorted list of tasks with priority scores and metadata
        """
        # Detect circular dependencies
        circular_deps = self.detect_circular_dependencies(tasks)
        
        # Score each task
        scored_tasks = []
        for task in tasks:
            score_data = self.calculate_priority_score(task, tasks)
            task_copy = task.copy()
            task_copy['priority_score'] = score_data['total']
            task_copy['score_breakdown'] = score_data['breakdown']
            task_copy['has_circular_dependency'] = task.get('id') in circular_deps
            scored_tasks.append(task_copy)
        
        # Sort by priority score (descending)
        scored_tasks.sort(key=lambda x: x['priority_score'], reverse=True)
        
        return scored_tasks