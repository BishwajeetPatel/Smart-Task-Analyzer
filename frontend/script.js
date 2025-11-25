// State Management
let tasks = [];
let analyzedTasks = [];
let currentStrategy = 'smart_balance';

// DOM Elements
const taskForm = document.getElementById('taskForm');
const importJsonBtn = document.getElementById('importJsonBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const toggleFormBtn = document.getElementById('toggleFormBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const strategySelect = document.getElementById('strategySelect');

const formSection = document.getElementById('formSection');
const taskListSection = document.getElementById('taskListSection');
const topThreeSection = document.getElementById('topThreeSection');
const resultsSection = document.getElementById('resultsSection');
const emptyState = document.getElementById('emptyState');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    taskForm.addEventListener('submit', handleAddTask);
    importJsonBtn.addEventListener('click', handleImportJson);
    analyzeBtn.addEventListener('click', handleAnalyzeTasks);
    toggleFormBtn.addEventListener('click', handleToggleForm);
    clearAllBtn.addEventListener('click', handleClearAll);
    strategySelect.addEventListener('change', handleStrategyChange);
    
    // Importance slider
    const importanceSlider = document.getElementById('importance');
    const importanceValue = document.getElementById('importanceValue');
    importanceSlider.addEventListener('input', (e) => {
        importanceValue.textContent = e.target.value;
    });
}

// Add Single Task
function handleAddTask(e) {
    e.preventDefault();
    
    const title = document.getElementById('taskTitle').value;
    const dueDate = document.getElementById('dueDate').value;
    const estimatedHours = document.getElementById('estimatedHours').value;
    const importance = document.getElementById('importance').value;
    const dependencies = document.getElementById('dependencies').value;
    
    if (!title || !dueDate || !estimatedHours) {
        alert('Please fill in all required fields');
        return;
    }
    
    const newTask = {
        id: `task_${Date.now()}`,
        title: title.trim(),
        due_date: dueDate,
        estimated_hours: parseFloat(estimatedHours),
        importance: parseInt(importance),
        dependencies: dependencies 
            ? dependencies.split(',').map(d => d.trim()).filter(d => d) 
            : []
    };
    
    tasks.push(newTask);
    taskForm.reset();
    document.getElementById('importance').value = 5;
    document.getElementById('importanceValue').textContent = 5;
    
    updateUI();
}

// Import JSON Tasks
function handleImportJson() {
    const jsonInput = document.getElementById('jsonInput').value;
    
    if (!jsonInput.trim()) {
        alert('Please paste JSON data first');
        return;
    }
    
    try {
        const parsedTasks = JSON.parse(jsonInput);
        
        if (!Array.isArray(parsedTasks)) {
            alert('JSON must be an array of tasks');
            return;
        }
        
        const tasksWithIds = parsedTasks.map((task, index) => ({
            ...task,
            id: task.id || `task_${Date.now()}_${index}`,
            importance: Math.max(1, Math.min(10, task.importance || 5)),
            estimated_hours: Math.max(0.5, task.estimated_hours || 1),
            dependencies: task.dependencies || []
        }));
        
        tasks = tasks.concat(tasksWithIds);
        document.getElementById('jsonInput').value = '';
        alert(`Added ${tasksWithIds.length} tasks successfully`);
        
        updateUI();
    } catch (error) {
        alert('Invalid JSON format: ' + error.message);
    }
}

// Analyze Tasks
function handleAnalyzeTasks() {
    if (tasks.length === 0) {
        alert('Please add some tasks first');
        return;
    }
    
    analyzeBtn.textContent = 'Analyzing...';
    analyzeBtn.disabled = true;
    
    setTimeout(() => {
        const circularDeps = detectCircularDependencies(tasks);
        
        const scored = tasks.map(task => {
            const score = calculatePriorityScore(task, tasks, currentStrategy);
            return {
                ...task,
                priority_score: score.total,
                score_breakdown: score.breakdown,
                has_circular_dependency: circularDeps.has(task.id)
            };
        });
        
        analyzedTasks = scored.sort((a, b) => b.priority_score - a.priority_score);
        
        analyzeBtn.textContent = 'Re-Analyze';
        analyzeBtn.disabled = false;
        
        updateUI();
    }, 500);
}

// Toggle Form Visibility
function handleToggleForm() {
    const isVisible = formSection.style.display !== 'none';
    formSection.style.display = isVisible ? 'none' : 'block';
    toggleFormBtn.textContent = isVisible ? 'Show Form' : 'Hide Form';
}

// Clear All Tasks
function handleClearAll() {
    if (confirm('Are you sure you want to clear all tasks?')) {
        tasks = [];
        analyzedTasks = [];
        updateUI();
    }
}

// Handle Strategy Change
function handleStrategyChange(e) {
    currentStrategy = e.target.value;
    updateStrategyDescription();
    
    // If tasks are already analyzed, re-analyze with new strategy
    if (analyzedTasks.length > 0) {
        handleAnalyzeTasks();
    }
}

// Update Strategy Description
function updateStrategyDescription() {
    const descriptions = {
        smart_balance: 'Balanced approach considering all factors equally',
        fastest_wins: 'Prioritizes quick tasks for maximum completion rate',
        high_impact: 'Focuses on business value and importance',
        deadline_driven: 'Emphasizes urgent deadlines and time pressure'
    };
    
    document.getElementById('strategyDescription').textContent = descriptions[currentStrategy];
    document.getElementById('currentStrategy').textContent = 
        currentStrategy.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Calculate Priority Score
function calculatePriorityScore(task, allTasks, strategyType) {
    const weights = {
        fastest_wins: { effort: 0.70, urgency: 0.20, importance: 0.10, dependencies: 0.00 },
        high_impact: { importance: 0.70, urgency: 0.20, effort: 0.10, dependencies: 0.00 },
        deadline_driven: { urgency: 0.70, importance: 0.20, effort: 0.10, dependencies: 0.00 },
        smart_balance: { urgency: 0.35, importance: 0.30, effort: 0.15, dependencies: 0.20 }
    };
    
    const w = weights[strategyType];
    
    // Urgency Score
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0);
    const daysUntilDue = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
    
    let urgencyScore;
    if (daysUntilDue < 0) {
        urgencyScore = Math.min(10, 10 + Math.abs(daysUntilDue) * 0.5);
    } else if (daysUntilDue === 0) {
        urgencyScore = 9;
    } else if (daysUntilDue === 1) {
        urgencyScore = 7;
    } else if (daysUntilDue <= 3) {
        urgencyScore = 6;
    } else if (daysUntilDue <= 7) {
        urgencyScore = 4;
    } else if (daysUntilDue <= 14) {
        urgencyScore = 3;
    } else {
        urgencyScore = 2;
    }
    
    // Importance Score
    const importanceScore = Math.max(1, Math.min(10, task.importance));
    
    // Effort Score (inverse)
    const hours = Math.max(0.5, task.estimated_hours);
    const effortScore = Math.max(1, 10 - (hours / 2));
    
    // Dependency Score
    const dependentCount = allTasks.filter(t => 
        t.dependencies && t.dependencies.includes(task.id)
    ).length;
    const dependencyScore = Math.min(10, 5 + dependentCount * 2);
    
    // Calculate weighted score
    const totalScore = (
        urgencyScore * w.urgency +
        importanceScore * w.importance +
        effortScore * w.effort +
        dependencyScore * w.dependencies
    );
    
    return {
        total: parseFloat(totalScore.toFixed(2)),
        breakdown: {
            urgency: parseFloat(urgencyScore.toFixed(2)),
            importance: importanceScore,
            effort: parseFloat(effortScore.toFixed(2)),
            dependencies: parseFloat(dependencyScore.toFixed(2)),
            daysUntilDue
        }
    };
}

// Detect Circular Dependencies
function detectCircularDependencies(tasks) {
    const visited = new Set();
    const recursionStack = new Set();
    const circular = new Set();
    
    const hasCycle = (taskId) => {
        if (recursionStack.has(taskId)) {
            circular.add(taskId);
            return true;
        }
        if (visited.has(taskId)) return false;
        
        visited.add(taskId);
        recursionStack.add(taskId);
        
        const task = tasks.find(t => t.id === taskId);
        if (task && task.dependencies) {
            for (const depId of task.dependencies) {
                if (hasCycle(depId)) {
                    circular.add(taskId);
                }
            }
        }
        
        recursionStack.delete(taskId);
        return false;
    };
    
    tasks.forEach(task => {
        if (!visited.has(task.id)) {
            hasCycle(task.id);
        }
    });
    
    return circular;
}

// Get Priority Level
function getPriorityLevel(score) {
    if (score >= 7) return { level: 'High', class: 'high' };
    if (score >= 4) return { level: 'Medium', class: 'medium' };
    return { level: 'Low', class: 'low' };
}

// Generate Explanation
function generateExplanation(task) {
    const breakdown = task.score_breakdown;
    const reasons = [];
    
    if (breakdown.daysUntilDue < 0) {
        reasons.push(`Overdue by ${Math.abs(breakdown.daysUntilDue)} days`);
    } else if (breakdown.daysUntilDue === 0) {
        reasons.push('Due today');
    } else if (breakdown.daysUntilDue <= 3) {
        reasons.push(`Due in ${breakdown.daysUntilDue} days`);
    }
    
    if (task.importance >= 8) {
        reasons.push('High importance');
    }
    
    if (task.estimated_hours <= 2) {
        reasons.push('Quick win');
    }
    
    const dependents = tasks.filter(t => 
        t.dependencies && t.dependencies.includes(task.id)
    ).length;
    if (dependents > 0) {
        reasons.push(`Blocks ${dependents} task${dependents > 1 ? 's' : ''}`);
    }
    
    if (task.has_circular_dependency) {
        reasons.push('⚠️ Circular dependency detected');
    }
    
    return reasons.length > 0 ? reasons.join(' • ') : 'Standard priority';
}

// Delete Task
function deleteTask(taskId) {
    tasks = tasks.filter(t => t.id !== taskId);
    analyzedTasks = analyzedTasks.filter(t => t.id !== taskId);
    updateUI();
}

// Update UI
function updateUI() {
    const taskCount = tasks.length;
    
    // Update counters
    document.getElementById('totalTaskCount').textContent = taskCount;
    document.getElementById('taskCount').textContent = taskCount;
    
    // Show/hide sections
    emptyState.style.display = taskCount === 0 ? 'block' : 'none';
    clearAllBtn.style.display = taskCount > 0 ? 'inline-flex' : 'none';
    analyzeBtn.disabled = taskCount === 0;
    
    // Task list section (before analysis)
    if (taskCount > 0 && analyzedTasks.length === 0) {
        taskListSection.style.display = 'block';
        renderTaskList();
    } else {
        taskListSection.style.display = 'none';
    }
    
    // Analyzed sections
    if (analyzedTasks.length > 0) {
        document.getElementById('analyzedStatus').style.display = 'inline';
        topThreeSection.style.display = 'block';
        resultsSection.style.display = 'block';
        renderTopThree();
        renderResults();
    } else {
        document.getElementById('analyzedStatus').style.display = 'none';
        topThreeSection.style.display = 'none';
        resultsSection.style.display = 'none';
    }
    
    // Reinitialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Render Task List (Before Analysis)
function renderTaskList() {
    const container = document.getElementById('taskList');
    container.innerHTML = tasks.map((task, index) => `
        <div class="task-preview-item">
            <div class="task-preview-content">
                <span class="task-preview-index">#${index + 1}</span>
                <span class="task-preview-title">${task.title}</span>
                <span class="task-preview-meta">
                    ${task.due_date} • ${task.estimated_hours}h • Importance: ${task.importance}/10
                </span>
            </div>
            <button class="task-preview-delete" onclick="deleteTask('${task.id}')">
                <i data-lucide="trash-2"></i>
            </button>
        </div>
    `).join('');
}

// Render Top Three
function renderTopThree() {
    const topThree = analyzedTasks.slice(0, 3);
    const medals = ['🥇', '🥈', '🥉'];
    
    const container = document.getElementById('topThreeContainer');
    container.innerHTML = topThree.map((task, index) => `
        <div class="top-task-card">
            <div class="top-task-header">
                <span class="top-task-medal">${medals[index]}</span>
                <span class="top-task-score">Score: ${task.priority_score}</span>
            </div>
            <h3 class="top-task-title">${task.title}</h3>
            <p class="top-task-explanation">${generateExplanation(task)}</p>
            <div class="top-task-meta">
                <span>Due: ${task.due_date}</span>
                <span>${task.estimated_hours}h</span>
            </div>
        </div>
    `).join('');
}

// Render Results
function renderResults() {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = analyzedTasks.map((task, index) => {
        const priority = getPriorityLevel(task.priority_score);
        const breakdown = task.score_breakdown;
        
        let dueDateInfo = task.due_date;
        if (breakdown.daysUntilDue < 0) {
            dueDateInfo += `<span class="overdue-text">(${Math.abs(breakdown.daysUntilDue)} days overdue)</span>`;
        } else if (breakdown.daysUntilDue === 0) {
            dueDateInfo += `<span class="due-today-text">(Due today!)</span>`;
        }
        
        return `
            <div class="result-item priority-${priority.class}">
                <div class="result-header">
                    <div class="result-content">
                        <div class="result-title-row">
                            <span class="result-index">#${index + 1}</span>
                            <h3 class="result-title">${task.title}</h3>
                            <span class="priority-badge ${priority.class}">${priority.level}</span>
                            ${task.has_circular_dependency ? '<span class="circular-dep-badge">⚠️ Circular Dep</span>' : ''}
                        </div>
                        <div class="result-meta">
                            <span class="result-meta-item">
                                <i data-lucide="calendar"></i>
                                ${dueDateInfo}
                            </span>
                            <span class="result-meta-item">
                                <i data-lucide="clock"></i>
                                ${task.estimated_hours}h
                            </span>
                            <span class="result-meta-item">
                                <i data-lucide="alert-circle"></i>
                                Importance: ${task.importance}/10
                            </span>
                        </div>
                        <p class="result-explanation">${generateExplanation(task)}</p>
                    </div>
                    <div class="result-score">
                        <div class="result-score-value">${task.priority_score}</div>
                        <div class="result-score-label">Priority Score</div>
                        <button class="result-delete" onclick="deleteTask('${task.id}')" title="Delete task">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>
                <div class="score-breakdown">
                    <div class="breakdown-grid">
                        <div class="breakdown-item">
                            <span class="breakdown-label">Urgency:</span>
                            <span class="breakdown-value urgency">${breakdown.urgency}</span>
                        </div>
                        <div class="breakdown-item">
                            <span class="breakdown-label">Importance:</span>
                            <span class="breakdown-value importance">${breakdown.importance}</span>
                        </div>
                        <div class="breakdown-item">
                            <span class="breakdown-label">Effort:</span>
                            <span class="breakdown-value effort">${breakdown.effort}</span>
                        </div>
                        <div class="breakdown-item">
                            <span class="breakdown-label">Dependencies:</span>
                            <span class="breakdown-value dependencies">${breakdown.dependencies}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}