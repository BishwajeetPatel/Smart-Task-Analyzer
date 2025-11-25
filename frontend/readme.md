# Smart Task Analyzer - Frontend Setup

A standalone frontend application for intelligent task prioritization without requiring a backend server.

## 📁 Project Structure

```
frontend/
├── index.html      # Main HTML structure
├── styles.css      # All styling and responsive design
└── script.js       # Application logic and algorithms
```

## 🚀 Quick Start

### Option 1: Direct File Opening (Simplest)

1. **Download all three files** to a folder called `frontend/`:
   - `index.html`
   - `styles.css`
   - `script.js`

2. **Open `index.html`** in your web browser:
   - Double-click the file, or
   - Right-click → Open with → Your browser

3. **Start using the app!** No server required.

### Option 2: Using a Local Server (Recommended)

Using a local server prevents potential CORS issues and provides a better development experience.

#### Using Python (Built-in)

```bash
# Navigate to the frontend directory
cd frontend/

# Python 3
python -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080
```

Then open: `http://localhost:8080`

#### Using Node.js (http-server)

```bash
# Install http-server globally (one-time)
npm install -g http-server

# Navigate to frontend directory
cd frontend/

# Start server
http-server -p 8080
```

Then open: `http://localhost:8080`

#### Using VS Code Live Server

1. Install the "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"

## 🎯 Features

### Core Functionality
- ✅ Add tasks individually with detailed information
- ✅ Bulk import tasks via JSON
- ✅ Four prioritization strategies:
  - **Smart Balance**: Balanced approach (default)
  - **Fastest Wins**: Quick tasks first
  - **High Impact**: Important tasks first
  - **Deadline Driven**: Urgent tasks first
- ✅ Intelligent scoring algorithm
- ✅ Circular dependency detection
- ✅ Top 3 task recommendations
- ✅ Detailed score breakdowns

### User Experience
- 🎨 Modern, responsive design
- 📱 Mobile-friendly interface
- 🎯 Real-time priority calculations
- 🗑️ Delete individual tasks or clear all
- 👁️ Toggle form visibility
- 📊 Visual priority indicators (High/Medium/Low)

## 📝 How to Use

### Adding a Single Task

1. Fill in the task form:
   - **Task Title**: Brief description (e.g., "Fix login bug")
   - **Due Date**: Select from calendar
   - **Estimated Hours**: Time to complete (minimum 0.5)
   - **Importance**: Slide from 1-10
   - **Dependencies**: Optional, comma-separated task IDs

2. Click **"Add Task"**

### Bulk Import via JSON

1. Click the **"Bulk JSON Input"** tab
2. Paste a JSON array of tasks:

```json
[
  {
    "title": "Fix login bug",
    "due_date": "2025-11-30",
    "estimated_hours": 3,
    "importance": 8,
    "dependencies": []
  },
  {
    "title": "Write documentation",
    "due_date": "2025-12-05",
    "estimated_hours": 5,
    "importance": 6,
    "dependencies": ["task_1732567890123"]
  }
]
```

3. Click **"Import Tasks"**

### Analyzing Tasks

1. Add at least one task
2. Select a **prioritization strategy** from the dropdown
3. Click **"Analyze Tasks"**
4. View your top 3 priorities and full sorted list

### Understanding the Results

**Priority Score**: 1-10 scale where higher = more urgent
- **High (7-10)**: Red - Do these first
- **Medium (4-7)**: Yellow - Do these soon  
- **Low (1-4)**: Green - Do these later

**Score Breakdown**:
- **Urgency**: Based on due date (overdue tasks score highest)
- **Importance**: Your manual rating (1-10)
- **Effort**: Inverse score (quick tasks score higher)
- **Dependencies**: Tasks blocking others score higher

## 🔧 Customization

### Changing Strategy Weights

Edit the `weights` object in `script.js`:

```javascript
const weights = {
    smart_balance: { 
        urgency: 0.35, 
        importance: 0.30, 
        effort: 0.15, 
        dependencies: 0.20 
    },
    // Add your custom strategy here
    my_strategy: {
        urgency: 0.50,
        importance: 0.30,
        effort: 0.10,
        dependencies: 0.10
    }
};
```

Then add it to the dropdown in `index.html`:

```html
<option value="my_strategy">My Custom Strategy</option>
```

### Changing Colors

Edit `styles.css`:

```css
/* Primary color (buttons, accents) */
.btn-primary {
    background: #4f46e5; /* Change this hex code */
}

/* Priority colors */
.priority-badge.high {
    background: #dc2626; /* Red for high priority */
}
```

## 🧪 Testing Example Data

Use this sample JSON to test the app:

```json
[
  {
    "title": "Fix critical security bug",
    "due_date": "2025-11-26",
    "estimated_hours": 2,
    "importance": 10,
    "dependencies": []
  },
  {
    "title": "Write user documentation",
    "due_date": "2025-12-10",
    "estimated_hours": 8,
    "importance": 6,
    "dependencies": []
  },
  {
    "title": "Deploy to production",
    "due_date": "2025-11-28",
    "estimated_hours": 1,
    "importance": 9,
    "dependencies": ["task_1732567890123"]
  },
  {
    "title": "Team meeting prep",
    "due_date": "2025-11-27",
    "estimated_hours": 0.5,
    "importance": 5,
    "dependencies": []
  },
  {
    "title": "Code review",
    "due_date": "2025-12-01",
    "estimated_hours": 3,
    "importance": 7,
    "dependencies": []
  }
]
```

## 🐛 Troubleshooting

### Icons not showing?
- Check your internet connection (icons load from CDN)
- Or download Lucide icons locally and update the script tag

### JSON import fails?
- Ensure valid JSON syntax (use a JSON validator)
- Check for trailing commas
- Verify all required fields are present

### Tasks not sorting correctly?
- Click "Re-Analyze" after changing strategy
- Check for circular dependencies (they'll be flagged)

### Styling looks broken?
- Ensure `styles.css` is in the same folder as `index.html`
- Check browser console for errors (F12)

## 🌐 Browser Compatibility

- ✅ Chrome/Edge (v90+)
- ✅ Firefox (v88+)
- ✅ Safari (v14+)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 📦 No Dependencies Required

This is a **pure vanilla JavaScript** application:
- No Node.js needed
- No npm packages
- No build process
- No backend server required

Only external dependency:
- Lucide Icons (loaded via CDN for the icons)

## 🎓 Learning Resources

### Understanding the Algorithm

The priority score uses a weighted formula:

```
Priority = (Urgency × 0.35) + (Importance × 0.30) + 
           (Effort × 0.15) + (Dependencies × 0.20)
```

Where each component is scored 1-10:
- **Urgency**: Higher for overdue/near-due tasks
- **Importance**: Direct user input
- **Effort**: Inverse (shorter tasks score higher)
- **Dependencies**: Higher if other tasks depend on this

## 📄 License

This project is free to use for educational and personal purposes.

## 🤝 Contributing

This is a standalone project, but feel free to:
- Fork and modify for your needs
- Report issues
- Suggest improvements

## 📧 Support

For questions or issues:
1. Check the troubleshooting section above
2. Review the code comments in `script.js`
3. Test with the example JSON data

---

**Ready to get organized?** Just open `index.html` and start adding tasks! 🚀