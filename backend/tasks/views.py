from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .scoring import TaskPriorityScorer
from .serializers import TaskAnalyzeSerializer


@api_view(['POST'])
def analyze_tasks(request):
    """
    Analyze and sort tasks by priority.
    
    POST /api/tasks/analyze/
    
    Request body:
    {
        "tasks": [
            {
                "id": "task_1",
                "title": "Fix login bug",
                "due_date": "2025-11-30",
                "estimated_hours": 3,
                "importance": 8,
                "dependencies": []
            }
        ],
        "strategy": "smart_balance"
    }
    
    Returns sorted tasks with priority scores.
    """
    serializer = TaskAnalyzeSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(
            {'error': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    tasks = serializer.validated_data['tasks']
    strategy = serializer.validated_data.get('strategy', 'smart_balance')
    
    try:
        # Initialize scorer with strategy
        scorer = TaskPriorityScorer(strategy=strategy)
        
        # Score and sort tasks
        sorted_tasks = scorer.score_and_sort_tasks(tasks)
        
        return Response({
            'success': True,
            'strategy': strategy,
            'task_count': len(sorted_tasks),
            'tasks': sorted_tasks
        })
    
    except Exception as e:
        return Response(
            {'error': f'Error analyzing tasks: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def suggest_tasks(request):
    """
    Get top 3 task suggestions with explanations.
    
    POST /api/tasks/suggest/
    
    Request body: Same as analyze_tasks
    
    Returns top 3 tasks with explanations.
    """
    serializer = TaskAnalyzeSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(
            {'error': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    tasks = serializer.validated_data['tasks']
    strategy = serializer.validated_data.get('strategy', 'smart_balance')
    
    try:
        scorer = TaskPriorityScorer(strategy=strategy)
        sorted_tasks = scorer.score_and_sort_tasks(tasks)
        
        # Get top 3
        top_tasks = sorted_tasks[:3]
        
        # Generate explanations
        for task in top_tasks:
            reasons = []
            breakdown = task['score_breakdown']
            
            # Urgency explanation
            days = breakdown['days_until_due']
            if days < 0:
                reasons.append(f"Overdue by {abs(days)} days")
            elif days == 0:
                reasons.append("Due today")
            elif days <= 3:
                reasons.append(f"Due in {days} days")
            
            # Importance explanation
            if task['importance'] >= 8:
                reasons.append("High importance")
            
            # Effort explanation
            if task['estimated_hours'] <= 2:
                reasons.append("Quick win")
            
            # Dependencies explanation
            dependent_count = sum(
                1 for t in tasks
                if task['id'] in t.get('dependencies', [])
            )
            if dependent_count > 0:
                reasons.append(f"Blocks {dependent_count} task(s)")
            
            # Circular dependency warning
            if task.get('has_circular_dependency'):
                reasons.append("⚠️ Circular dependency")
            
            task['explanation'] = ' • '.join(reasons) if reasons else 'Standard priority'
        
        return Response({
            'success': True,
            'strategy': strategy,
            'suggestions': top_tasks,
            'message': 'Top 3 recommended tasks'
        })
    
    except Exception as e:
        return Response(
            {'error': f'Error generating suggestions: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )