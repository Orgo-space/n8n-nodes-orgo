import {
	IExecuteFunctions,
	IExecuteSingleFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';

// Route validation helper
function validateRoute(url: string, method: string, requiredParams: string[] = []): void {
	// Check if URL has proper API version prefix
	if (!url.startsWith('/api/v1/')) {
		console.warn(`[Orgo Node] Route integrity warning: URL "${url}" does not start with /api/v1/`);
	}
	
	// Check for required parameters in URL template
	for (const param of requiredParams) {
		if (!url.includes(`{{$parameter["${param}"]}}`)) {
			console.error(`[Orgo Node] Route integrity error: Missing required parameter "${param}" in URL "${url}"`);
		}
	}
	
	// Log route validation
	console.log(`[Orgo Node] Route validated: ${method} ${url}`);
}

export class Orgo implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Orgo',
		name: 'orgo',
		icon: 'file:orgo.svg',
		group: ['input'],
		version: 1.1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Orgo API - Multi-tenant SaaS platform for organizations',
		defaults: {
			name: 'Orgo',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'orgoApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: '={{$credentials.apiUrl}}',
			headers: {
				'Api-Token': '={{$credentials.apiToken}}',
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Contract',
						value: 'contract',
						description: 'Operations with contracts and signatures',
					},
					{
						name: 'Event',
						value: 'event',
						description: 'Operations with events',
					},
					{
						name: 'Event Attendance',
						value: 'eventAttend',
						description: 'Operations with event attendance/registration',
					},
					{
						name: 'Payment',
						value: 'productPayment',
						description: 'Operations with payments and fees',
					},
					{
						name: 'User',
						value: 'user',
						description: 'Operations with users (members)',
					},
					{
						name: 'Webhook',
						value: 'webhook',
						description: 'Manage webhook subscriptions',
					},
				],
				default: 'user',
			},

			// User operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['user'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get a user by ID',
						action: 'Get a user',
						routing: {
							request: {
								method: 'GET',
								url: '=/api/v1/users/{{$parameter["id"]}}',
							},
							send: {
								preSend: [
									async function(this: IExecuteSingleFunctions, requestOptions: any) {
										validateRoute('/api/v1/users/{{$parameter["id"]}}', 'GET', ['id']);
										const id = this.getNodeParameter('id') as string;
										if (!id || id.trim() === '') {
											throw new Error('[Orgo Node] User ID is required but not provided');
										}
										const credentials = await this.getCredentials('orgoApi');
										console.log(`[Orgo Node] Getting user with ID: ${id}`);
										console.log(`[Orgo Node] Making GET request to: /api/v1/users/${id}`);
										console.log(`[Orgo Node] Base URL: ${credentials?.apiUrl}`);
										return requestOptions;
									},
								],
							},
						},
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get multiple users',
						action: 'Get many users',
						routing: {
							request: {
								method: 'GET',
								url: '=/api/v1/users?limit={{$parameter["limit"] || 25}}',
							},
							send: {
								preSend: [
									async function(this: IExecuteSingleFunctions, requestOptions: any) {
										validateRoute('/api/v1/users', 'GET', []);
										const limit = this.getNodeParameter('limit', 25) as number;
										console.log(`[Orgo Node] Getting users with limit: ${limit}`);
										console.log(`[Orgo Node] Making GET request to: /api/v1/users?limit=${limit}`);
										return requestOptions;
									},
								],
							},
						},
					},
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new user',
						action: 'Create a user',
						routing: {
							request: {
								method: 'POST',
								url: '/users',
								body: {
									email: '={{$parameter["email"]}}',
									firstName: '={{$parameter["firstName"]}}',
									lastName: '={{$parameter["lastName"]}}',
								},
							},
						},
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a user',
						action: 'Update a user',
						routing: {
							request: {
								method: 'PATCH',
								url: '=/api/v1/users/{{$parameter["id"]}}',
								body: '={{Object.fromEntries(Object.entries({email: $parameter["email"], firstName: $parameter["firstName"], lastName: $parameter["lastName"]}).filter(([key, value]) => value !== ""))}}',
							},
						},
					},
				],
				default: 'get',
			},

			// Event operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['event'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get an event by ID',
						action: 'Get an event',
						routing: {
							request: {
								method: 'GET',
								url: '=/api/v1/events/{{$parameter["id"]}}',
							},
						},
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get multiple events',
						action: 'Get many events',
						routing: {
							request: {
								method: 'GET',
								url: '=/api/v1/events?limit={{$parameter["limit"] || 25}}',
							},
						},
					},
				],
				default: 'get',
			},

			// Payment operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['productPayment'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get a payment by ID',
						action: 'Get a payment',
						routing: {
							request: {
								method: 'GET',
								url: '=/api/v1/product_payments/{{$parameter["id"]}}',
							},
						},
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get multiple payments',
						action: 'Get many payments',
						routing: {
							request: {
								method: 'GET',
								url: '=/api/v1/product_payments?limit={{$parameter["limit"] || 25}}',
							},
						},
					},
				],
				default: 'get',
			},

			// Webhook operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['webhook'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a webhook subscription',
						action: 'Create a webhook subscription',
						routing: {
							request: {
								method: 'POST',
								url: '/webhook_subscriptions',
								body: {
									name: '={{$parameter["name"]}}',
									url: '={{$parameter["url"]}}',
									eventTypes: '={{$parameter["eventTypes"]}}',
									secret: '={{$parameter["additionalFields"]["secret"] || null}}',
									maxRetries: '={{$parameter["additionalFields"]["maxRetries"] || 3}}',
									timeoutSeconds: '={{$parameter["additionalFields"]["timeoutSeconds"] || 30}}',
									description: '={{$parameter["additionalFields"]["description"] || ""}}',
									isActive: true,
								},
							},
						},
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a webhook subscription',
						action: 'Delete a webhook subscription',
						routing: {
							request: {
								method: 'DELETE',
								url: '=/api/v1/webhook_subscriptions/{{$parameter["id"]}}',
							},
						},
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a webhook subscription by ID',
						action: 'Get a webhook subscription',
						routing: {
							request: {
								method: 'GET',
								url: '=/api/v1/webhook_subscriptions/{{$parameter["id"]}}',
							},
						},
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many webhook subscriptions',
						action: 'Get many webhook subscriptions',
						routing: {
							request: {
								method: 'GET',
								url: '=/api/v1/webhook_subscriptions?limit={{$parameter["limit"] || 25}}',
							},
						},
					},
					{
						name: 'Test',
						value: 'test',
						description: 'Test a webhook subscription',
						action: 'Test a webhook subscription',
						routing: {
							request: {
								method: 'POST',
								url: '=/api/v1/webhook_subscriptions/{{$parameter["id"]}}/test',
							},
						},
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a webhook subscription',
						action: 'Update a webhook subscription',
						routing: {
							request: {
								method: 'PATCH',
								url: '=/api/v1/webhook_subscriptions/{{$parameter["id"]}}',
								body: '={{Object.fromEntries(Object.entries({name: $parameter["name"], url: $parameter["url"], eventTypes: $parameter["eventTypes"], secret: $parameter["additionalFields"]["secret"], maxRetries: $parameter["additionalFields"]["maxRetries"], timeoutSeconds: $parameter["additionalFields"]["timeoutSeconds"], description: $parameter["additionalFields"]["description"]}).filter(([key, value]) => value !== "" && value !== undefined && value !== null))}}',
							},
						},
					},
				],
				default: 'getAll',
			},

			// Common ID parameter
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['get', 'update', 'delete', 'test'],
					},
				},
				default: '',
				description: 'The ID of the resource',
			},

			// User fields
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'user@example.com',
				displayOptions: {
					show: {
						resource: ['user'],
						operation: ['create', 'update'],
					},
				},
				default: '',
				description: 'The email address of the user',
			},
			{
				displayName: 'First Name',
				name: 'firstName',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['user'],
						operation: ['create', 'update'],
					},
				},
				default: '',
				description: 'The first name of the user',
			},
			{
				displayName: 'Last Name',
				name: 'lastName',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['user'],
						operation: ['create', 'update'],
					},
				},
				default: '',
				description: 'The last name of the user',
			},

			// Webhook fields
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['webhook'],
						operation: ['create', 'update'],
					},
				},
				default: '',
				description: 'The name of the webhook subscription',
				required: true,
			},
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['webhook'],
						operation: ['create', 'update'],
					},
				},
				default: '',
				description: 'The URL to send webhook notifications to',
				required: true,
			},
			{
				displayName: 'Event Types',
				name: 'eventTypes',
				type: 'multiOptions',
				displayOptions: {
					show: {
						resource: ['webhook'],
						operation: ['create', 'update'],
					},
				},
				options: [
					{ name: 'Contract Deleted', value: 'contract_user.deleted' },
					{ name: 'Contract Signed', value: 'contract_user.created' },
					{ name: 'Contract Updated', value: 'contract_user.updated' },
					{ name: 'Event Cancelled', value: 'event_attend.deleted' },
					{ name: 'Event Registration', value: 'event_attend.created' },
					{ name: 'Event Updated', value: 'event_attend.updated' },
					{ name: 'Payment Created', value: 'product_payment.created' },
					{ name: 'Payment Deleted', value: 'product_payment.deleted' },
					{ name: 'Payment Updated', value: 'product_payment.updated' },
					{ name: 'Profile Created', value: 'profile_external.created' },
					{ name: 'Profile Deleted', value: 'profile_external.deleted' },
					{ name: 'Profile Updated', value: 'profile_external.updated' },
					{ name: 'Role Assigned', value: 'user_role.created' },
					{ name: 'Role Removed', value: 'user_role.deleted' },
					{ name: 'Role Updated', value: 'user_role.updated' },
					{ name: 'User Created', value: 'user.created' },
					{ name: 'User Deleted', value: 'user.deleted' },
					{ name: 'User Updated', value: 'user.updated' },
				],
				default: [],
				description: 'The event types to subscribe to',
				required: true,
			},

			// Additional options
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['webhook'],
						operation: ['create', 'update'],
					},
				},
				options: [
					{
						displayName: 'Secret',
						name: 'secret',
						type: 'string',
						typeOptions: {
							password: true,
						},
						default: '',
						description: 'Secret for webhook signature verification',
					},
					{
						displayName: 'Max Retries',
						name: 'maxRetries',
						type: 'number',
						default: 3,
						description: 'Maximum number of retry attempts',
						typeOptions: {
							minValue: 0,
							maxValue: 10,
						},
					},
					{
						displayName: 'Timeout (Seconds)',
						name: 'timeoutSeconds',
						type: 'number',
						default: 30,
						description: 'Request timeout in seconds',
						typeOptions: {
							minValue: 1,
							maxValue: 300,
						},
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Description of the webhook subscription',
					},
				],
			},

			// Limit parameter for getAll operations
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['getAll'],
					},
				},
				typeOptions: {
					minValue: 1,
				},
				default: 50,
				description: 'Max number of results to return',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		const credentials = await this.getCredentials('orgoApi');
		
		console.log(`[Orgo Node] Executing ${operation} on ${resource}`);
		console.log(`[Orgo Node] Credentials Base URL: ${credentials?.apiUrl}`);
		
		const items = this.getInputData();
		
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				let responseData;
				const baseURL = credentials.apiUrl as string;
				
				// Log request details
				console.log(`[Orgo Node] Processing item ${itemIndex + 1}/${items.length}`);
				
				if (resource === 'user') {
					if (operation === 'get') {
						const id = this.getNodeParameter('id', itemIndex) as string;
						const url = `${baseURL}/api/v1/users/${id}`;
						console.log(`[Orgo Node] GET request to: ${url}`);
						
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
							},
						});
						
						console.log(`[Orgo Node] Response received:`, response);
						responseData = response;
					} else if (operation === 'getAll') {
						const limit = this.getNodeParameter('limit', itemIndex, 25) as number;
						const url = `${baseURL}/api/v1/users?limit=${limit}`;
						console.log(`[Orgo Node] GET request to: ${url}`);
						
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
							},
						});
						
						console.log(`[Orgo Node] Response received:`, response);
						responseData = response;
					}
				}
				
				// Add similar blocks for other resources (event, productPayment, webhook)
				
				if (Array.isArray(responseData)) {
					returnData.push(...responseData.map(item => ({ json: item })));
				} else if (responseData) {
					returnData.push({ json: responseData });
				}
				
			} catch (error) {
				console.error(`[Orgo Node] Error processing item ${itemIndex}:`, error);
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message } });
					continue;
				}
				throw error;
			}
		}
		
		console.log(`[Orgo Node] Execution complete. Returned ${returnData.length} items`);
		return [returnData];
	}
}
