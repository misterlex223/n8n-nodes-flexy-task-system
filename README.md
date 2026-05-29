# n8n-node-flexy-task-system

n8n community node for [Claude Task System](https://github.com/your-org/claude-task-system) API integration.

## Features

This node provides full integration with the Claude Task System API, enabling you to:

- **Health Check** - Monitor API service status
- **Create Session** - Create new sessions with tmux window management
- **List Sessions** - Query sessions with status and type filters
- **Create Task** - Submit tasks to existing sessions
- **Get Session Status** - Retrieve session details and task history
- **Complete Session** - Gracefully close sessions
- **Delete Session** - Remove sessions and associated resources

## Installation

### Via n8n Community Nodes

1. In n8n, go to **Settings > Community Nodes**
2. Click **Install**
3. Enter: `n8n-nodes-claude-task-system`
4. Click **Install**

### Via npm

```bash
npm install n8n-nodes-claude-task-system
```

## Credentials

This node requires Claude Task System API credentials:

- **API Key**: Your Claude Task System API key (required)
- **Base URL**: API base URL (default: `http://localhost:3000`)

## Operations

### 1. Health Check

Checks if the Claude Task System API is running.

**Parameters**: None

**Returns**:
```json
{
  "status": "healthy",
  "activeSessions": 5,
  "timestamp": "2026-05-29T10:30:00Z"
}
```

### 2. Create Session

Creates a new session with a dedicated tmux window for Claude Code execution.

**Parameters**:
- `type` (required): Session type (e.g., `github_issue`, `feature_development`)
- `githubIssueId` (optional): GitHub Issue number
- `githubIssueTitle` (optional): GitHub Issue title
- `workingDirectory` (optional): Working directory path
- `initialPrompt` (optional): Initial task prompt for Claude Code
- `autoCreateDirectory` (optional): Auto-create directory if missing
- `timeout` (optional): Task timeout in milliseconds (default: 1800000)

**Returns**:
```json
{
  "sessionId": "sess_a1b2c3d4",
  "tmuxSession": "task_sessions",
  "tmuxWindowName": "sess_a1b2c3d4",
  "claudeSessionId": "sess_a1b2c3d4",
  "status": "active",
  "taskId": "task_x1y2z3"
}
```

### 3. List Sessions

Retrieves a list of sessions with optional filtering.

**Parameters**:
- `statusFilter` (optional): Filter by status (`idle`, `active`, `recovered`, `completed`, `deleted`)
- `typeFilter` (optional): Filter by session type (e.g., `github_issue`, `manual`)

**Returns**:
```json
{
  "sessions": [...],
  "total": 2
}
```

### 4. Create Task

Creates a new task in an existing session.

**Parameters**:
- `sessionId` (required): Session ID
- `prompt` (required): Task prompt for Claude Code
- `taskType` (optional): Task type (default: `other`)
- `timeout` (optional): Task timeout in milliseconds

**Returns**:
```json
{
  "taskId": "task_x1y2z3",
  "sessionId": "sess_a1b2c3d4",
  "taskStatus": "running",
  "prompt": "Implement user registration API",
  "createdAt": "2026-05-29T10:35:00Z"
}
```

### 5. Get Session Status

Retrieves session details and task history.

**Parameters**:
- `sessionId` (required): Session ID

**Returns**:
```json
{
  "sessionId": "sess_a1b2c3d4",
  "status": "idle",
  "currentTask": null,
  "tasks": [...]
}
```

### 6. Complete Session

Gracefully closes a session (sends Ctrl-D to Claude Code).

**Parameters**:
- `sessionId` (required): Session ID

**Returns**:
```json
{
  "sessionId": "sess_a1b2c3d4",
  "status": "completed",
  "completedAt": "2026-05-29T10:40:00Z"
}
```

### 7. Delete Session

Force deletes a session and removes all associated data.

**Parameters**:
- `sessionId` (required): Session ID

**Returns**:
```json
{
  "sessionId": "sess_a1b2c3d4",
  "status": "deleted",
  "deletedAt": "2026-05-29T10:40:00Z"
}
```

## Session Lifecycle

Sessions progress through the following states:

```
idle → active → idle → active → ... → completed/deleted
```

- **idle**: Ready to execute new tasks
- **active**: Currently executing a task
- **recovered**: tmux window recovered after restart
- **completed**: Gracefully closed
- **deleted**: Force deleted

## Task Lifecycle

Tasks progress through these states:

```
pending → running → completed/failed/timeout
```

A session can only run one task at a time. Attempting to create a task while another is running will return a `session_busy` error.

## Example Workflows

### GitHub Issue Automation

```
1. GitHub Trigger Node (new issue)
   ↓
2. Create Session (with initialPrompt from issue title)
   ↓
3. Wait node (poll session status)
   ↓
4. Get Session Status (check task completion)
   ↓
5. Comment on GitHub Issue (post results)
```

### Batch Task Processing

```
1. Manual Trigger
   ↓
2. List Sessions (filter: status=idle)
   ↓
3. Loop over sessions
   ↓
4. Create Task (submit prompts)
   ↓
5. Wait for completion
   ↓
6. Complete Session
```

## Error Handling

The node returns descriptive errors for common scenarios:

- `invalid_api_key`: API key authentication failed
- `validation_error`: Missing or invalid parameters
- `not_found`: Session does not exist
- `session_busy`: Session already has a running task
- `internal_error`: Server-side error

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Dev mode with hot-reload
npm run dev

# Lint
npm run lint
npm run lint:fix
```

## Compatibility

- n8n: 1.0.0+
- Node.js: 22+

## License

MIT

## Links

- [Claude Task System API Documentation](https://github.com/your-org/claude-task-system)
- [n8n Community Nodes](https://community.n8n.io/)
