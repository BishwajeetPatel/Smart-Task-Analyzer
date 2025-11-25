from django.test import TestCase
from datetime import date, timedelta
from .scoring import TaskPriorityScorer


class TaskPriorityScorerTests(TestCase):
    """Test suite for TaskPriorityScorer."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.scorer = TaskPriorityScorer(strategy='smart_balance')
        self.today = date.today()
    
    def test_overdue_task_priority(self):
        """Test that overdue tasks receive high urgency scores."""
        overdue_date = self.today - timedelta(days=5)
        score = self.scorer.calculate_urgency_score(overdue_date)
        self.assertGreaterEqual(score, 10.0)
    
    def test_circular_dependency_detection(self):
        """Test circular dependency detection."""
        tasks = [
            {'id': 'task_1', 'dependencies': ['task_2']},
            {'id': 'task_2', 'dependencies': ['task_3']},
            {'id': 'task_3', 'dependencies': ['task_1']}
        ]
        circular = self.scorer.detect_circular_dependencies(tasks)
        self.assertEqual(len(circular), 3)
    
    def test_missing_data_handling(self):
        """Test handling of tasks with missing data."""
        task = {
            'id': 'task_1',
            'title': 'Test Task',
            'due_date': self.today + timedelta(days=7),
        }
        score_data = self.scorer.calculate_priority_score(task, [task])
        self.assertIsInstance(score_data['total'], float)
        self.assertGreater(score_data['total'], 0)
    
    def test_effort_inverse_relationship(self):
        """Test that lower effort tasks score higher."""
        low_effort = self.scorer.calculate_effort_score(1.0)
        high_effort = self.scorer.calculate_effort_score(10.0)
        self.assertGreater(low_effort, high_effort)