import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class ClaudeTaskSystemApi implements ICredentialType {
	name = 'claudeTaskSystemApi';
	displayName = 'Claude Task System API';
	documentationUrl = 'https://github.com/misterlex223/n8n-node-flexy-task-system';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Your Claude Task System API Key',
			required: true,
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			description: 'Base URL of the Claude Task System API (default: http://localhost:3000)',
			required: false,
			default: 'http://localhost:3000',
		},
	];
}
