import {
  INodeExecutionData,
  IExecuteFunctions,
  NodeOperationError
} from 'n8n-workflow';

export class ClaudeTaskSystem {
  description = {
    displayName: 'Claude Task System',
    name: 'ClaudeTaskSystem',
    group: ['transform'],
    version: 1,
    description: 'Integrate with Claude Task System API for session and task management',
    defaults: {
      name: 'Claude Task System',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'claudeTaskSystemApi',
        required: true
      }
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Health Check',
            value: 'health',
            description: 'Check API service status'
          },
          {
            name: 'Create Session',
            value: 'createSession',
            description: 'Create a new session and tmux window'
          },
          {
            name: 'List Sessions',
            value: 'listSessions',
            description: 'Get list of sessions with optional filters'
          },
          {
            name: 'Create Task',
            value: 'createTask',
            description: 'Create a new task in existing session'
          },
          {
            name: 'Get Session Status',
            value: 'getSessionStatus',
            description: 'Get session details and task list'
          },
          {
            name: 'Complete Session',
            value: 'completeSession',
            description: 'Gracefully complete and close session'
          },
          {
            name: 'Delete Session',
            value: 'deleteSession',
            description: 'Delete session and tmux window'
          }
        ],
        default: 'health'
      },
      // Create Session parameters
      {
        displayName: 'Session Type',
        name: 'type',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['createSession']
          }
        },
        required: true,
        default: 'github_issue',
        description: 'Type of session (e.g., github_issue, feature_development, simple_prompt)'
      },
      {
        displayName: 'GitHub Issue ID',
        name: 'githubIssueId',
        type: 'number',
        displayOptions: {
          show: {
            operation: ['createSession']
          }
        },
        required: false,
        description: 'GitHub Issue number'
      },
      {
        displayName: 'GitHub Issue Title',
        name: 'githubIssueTitle',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['createSession']
          }
        },
        required: false,
        description: 'GitHub Issue title'
      },
      {
        displayName: 'Working Directory',
        name: 'workingDirectory',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['createSession', 'createTask']
          }
        },
        required: false,
        default: '/home/flexy/workspace',
        description: 'Working directory path (default: current directory)'
      },
      {
        displayName: 'Initial Prompt',
        name: 'initialPrompt',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['createSession']
          }
        },
        required: false,
        typeOptions: {
          rows: 4
        },
        description: 'Initial task prompt for Claude Code'
      },
      {
        displayName: 'Auto Create Directory',
        name: 'autoCreateDirectory',
        type: 'boolean',
        displayOptions: {
          show: {
            operation: ['createSession']
          }
        },
        default: false,
        description: 'Automatically create working directory if it does not exist'
      },
      {
        displayName: 'Task Timeout (ms)',
        name: 'timeout',
        type: 'number',
        displayOptions: {
          show: {
            operation: ['createSession', 'createTask']
          }
        },
        default: 1800000,
        description: 'Task timeout in milliseconds (default: 1800000 = 30 minutes)'
      },
      // List Sessions parameters
      {
        displayName: 'Status Filter',
        name: 'statusFilter',
        type: 'options',
        displayOptions: {
          show: {
            operation: ['listSessions']
          }
        },
        options: [
          { name: 'All', value: '' },
          { name: 'Idle', value: 'idle' },
          { name: 'Active', value: 'active' },
          { name: 'Recovered', value: 'recovered' },
          { name: 'Completed', value: 'completed' },
          { name: 'Deleted', value: 'deleted' }
        ],
        default: '',
        description: 'Filter by session status'
      },
      {
        displayName: 'Type Filter',
        name: 'typeFilter',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['listSessions']
          }
        },
        required: false,
        placeholder: 'github_issue',
        description: 'Filter by session type (e.g., github_issue, manual)'
      },
      // Create Task parameters
      {
        displayName: 'Session ID',
        name: 'sessionId',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['createTask', 'getSessionStatus', 'completeSession', 'deleteSession']
          }
        },
        required: true,
        description: 'Session ID to operate on'
      },
      {
        displayName: 'Task Prompt',
        name: 'prompt',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['createTask']
          }
        },
        required: true,
        typeOptions: {
          rows: 4
        },
        description: 'Task prompt for Claude Code'
      },
      {
        displayName: 'Task Type',
        name: 'taskType',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['createTask']
          }
        },
        required: false,
        default: 'other',
        description: 'Type of task (e.g., feature_development, bug_fix)'
      }
    ]
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const operation = this.getNodeParameter('operation', 0) as string;

    // Get credentials
    const credentials = await this.getCredentials<any>('claudeTaskSystemApi');
    const apiKey = credentials?.apiKey as string;
    const baseUrl = (credentials?.baseUrl as string) || 'http://localhost:3000';

    // Make HTTP request helper
    const makeRequest = async (method: string, endpoint: string, body?: any, queryParams?: Record<string, string>) => {
      const url = new URL(endpoint, baseUrl);
      if (queryParams) {
        Object.entries(queryParams).forEach(([key, value]) => {
          if (value) url.searchParams.append(key, value);
        });
      }

      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        }
      };

      if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url.toString(), options);

      if (!response.ok) {
        const errorData: any = await response.json().catch(() => ({ message: response.statusText }));
        throw new NodeOperationError(this.getNode(), `API Error (${response.status}): ${errorData.error || errorData.message || response.statusText}`);
      }

      return response.json();
    };

    // Process each item
    for (let i = 0; i < items.length; i++) {
      let result: any;

      switch (operation) {
        case 'health': {
          result = await makeRequest('GET', '/health');
          break;
        }

        case 'createSession': {
          const type = this.getNodeParameter('type', i) as string;
          const githubIssueId = this.getNodeParameter('githubIssueId', i, undefined) as number | undefined;
          const githubIssueTitle = this.getNodeParameter('githubIssueTitle', i, undefined) as string | undefined;
          const workingDirectory = this.getNodeParameter('workingDirectory', i) as string;
          const initialPrompt = this.getNodeParameter('initialPrompt', i, undefined) as string | undefined;
          const autoCreateDirectory = this.getNodeParameter('autoCreateDirectory', i) as boolean;
          const timeout = this.getNodeParameter('timeout', i) as number;

          const payload: any = {
            apiKey,
            type,
            workingDirectory,
            autoCreateDirectory,
            timeout
          };

          if (githubIssueId !== undefined) payload.githubIssueId = githubIssueId;
          if (githubIssueTitle !== undefined) payload.githubIssueTitle = githubIssueTitle;
          if (initialPrompt !== undefined) payload.initialPrompt = initialPrompt;

          result = await makeRequest('POST', '/session', payload);
          break;
        }

        case 'listSessions': {
          const statusFilter = this.getNodeParameter('statusFilter', i) as string;
          const typeFilter = this.getNodeParameter('typeFilter', i, undefined) as string | undefined;

          const params: Record<string, string> = {};
          if (statusFilter) params.status = statusFilter;
          if (typeFilter) params.type = typeFilter;

          result = await makeRequest('GET', '/session/list', undefined, params);
          break;
        }

        case 'createTask': {
          const sessionId = this.getNodeParameter('sessionId', i) as string;
          const prompt = this.getNodeParameter('prompt', i) as string;
          const taskType = this.getNodeParameter('taskType', i) as string;
          const timeout = this.getNodeParameter('timeout', i) as number;

          const payload = {
            apiKey,
            prompt,
            type: taskType,
            timeout
          };

          result = await makeRequest('POST', `/session/${sessionId}/task`, payload);
          break;
        }

        case 'getSessionStatus': {
          const sessionId = this.getNodeParameter('sessionId', i) as string;
          result = await makeRequest('GET', `/session/${sessionId}/status`);
          break;
        }

        case 'completeSession': {
          const sessionId = this.getNodeParameter('sessionId', i) as string;
          result = await makeRequest('POST', `/session/${sessionId}/complete`);
          break;
        }

        case 'deleteSession': {
          const sessionId = this.getNodeParameter('sessionId', i) as string;
          result = await makeRequest('DELETE', `/session/${sessionId}`);
          break;
        }

        default:
          throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
      }

      returnData.push({
        json: result
      });
    }

    return [returnData];
  }
}
