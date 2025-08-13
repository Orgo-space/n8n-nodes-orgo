import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class OrgoApi implements ICredentialType {
	name = 'orgoApi';
	displayName = 'Orgo API';
	documentationUrl = 'https://docs.orgo.space/api-reference';
	properties: INodeProperties[] = [
		{
			displayName: 'API Base URL',
			name: 'apiUrl',
			type: 'string',
			default: 'https://app.orgo.space/api/v1',
			required: true,
			description: 'The base URL of your Orgo instance API',
		},
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			default: '',
			typeOptions: {
				password: true,
			},
			required: true,
			description: 'API token for authenticating with the Orgo API. Get this from your Orgo account settings.',
		},
		{
			displayName: 'Webhook Secret',
			name: 'webhookSecret',
			type: 'string',
			default: '',
			typeOptions: {
				password: true,
			},
			required: false,
			description: 'Secret key for webhook signature verification (recommended for security)',
		},
		{
			displayName: 'Tenant ID',
			name: 'tenantId',
			type: 'number',
			default: 0,
			required: false,
			description: 'Your organization/tenant ID in Orgo (will be detected automatically if not provided)',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'Api-Token': '={{$credentials.apiToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.apiUrl}}',
			url: '/me',
			method: 'GET',
		},
	};
}