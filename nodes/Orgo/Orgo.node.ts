import {
	IExecuteFunctions,
	IExecuteSingleFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';

// Route validation helper
function validateRoute(url: string, method: string, requiredParams: string[] = []): void {
	// Check if URL has proper API version prefix
	if (!url.startsWith('/api/v1/')) {
		}
	
	// Check for required parameters in URL template
	for (const param of requiredParams) {
		if (!url.includes(`{{$parameter["${param}"]}}`)) {
			}
	}
	
	// Log route validation
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
											throw new NodeOperationError(this.getNode(), 'User ID is required but not provided');
										}
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

			// Event Attendance operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['eventAttend'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Register for an event',
						action: 'Register for event',
						routing: {
							request: {
								method: 'POST',
								url: '=/api/v1/event_attends',
							},
						},
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Cancel event registration',
						action: 'Cancel event registration',
						routing: {
							request: {
								method: 'DELETE',
								url: '=/api/v1/event_attends/{{$parameter["id"]}}',
							},
						},
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get an event attendance by ID',
						action: 'Get an event attendance',
						routing: {
							request: {
								method: 'GET',
								url: '=/api/v1/event_attends/{{$parameter["id"]}}',
							},
						},
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get multiple event attendances',
						action: 'Get many event attendances',
						routing: {
							request: {
								method: 'GET',
								url: '=/api/v1/event_attends?limit={{$parameter["limit"] || 25}}',
							},
						},
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update an event attendance',
						action: 'Update an event attendance',
						routing: {
							request: {
								method: 'PUT',
								url: '=/api/v1/event_attends/{{$parameter["id"]}}',
							},
						},
					},
				],
				default: 'get',
			},

			// Contract operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['contract'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get a contract by ID',
						action: 'Get a contract',
						routing: {
							request: {
								method: 'GET',
								url: '=/api/v1/contracts/{{$parameter["id"]}}',
							},
						},
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get multiple contracts',
						action: 'Get many contracts',
						routing: {
							request: {
								method: 'GET',
								url: '=/api/v1/contracts?limit={{$parameter["limit"] || 25}}',
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

			// Event Attendance fields
			{
				displayName: 'Event ID',
				name: 'eventId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['eventAttend'],
						operation: ['create', 'update'],
					},
				},
				default: '',
				description: 'The ID of the event to register for',
				required: true,
			},
			{
				displayName: 'User ID',
				name: 'userId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['eventAttend'],
						operation: ['create', 'update'],
					},
				},
				default: '',
				description: 'The ID of the user registering for the event',
				required: true,
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['eventAttend'],
						operation: ['create', 'update'],
					},
				},
				options: [
					{ name: 'Registered', value: 'registered' },
					{ name: 'Attended', value: 'attended' },
					{ name: 'No Show', value: 'no_show' },
					{ name: 'Cancelled', value: 'cancelled' },
				],
				default: 'registered',
				description: 'The attendance status',
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
					{ name: 'Contact Created', value: 'contact.created' },
					{ name: 'Contact Deleted', value: 'contact.deleted' },
					{ name: 'Contact Updated', value: 'contact.updated' },
					{ name: 'Contract Deleted', value: 'contract_user.deleted' },
					{ name: 'Contract Signed', value: 'contract_user.created' },
					{ name: 'Contract Updated', value: 'contract_user.updated' },
					{ name: 'Event Cancelled', value: 'event_attend.deleted' },
					{ name: 'Event Registration', value: 'event_attend.created' },
					{ name: 'Event Updated', value: 'event_attend.updated' },
					{ name: 'Payment Created', value: 'product_payment.created' },
					{ name: 'Payment Deleted', value: 'product_payment.deleted' },
					{ name: 'Payment Updated', value: 'product_payment.updated' },
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
		
		
		const items = this.getInputData();
		
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				let responseData;
				const baseURL = credentials.apiUrl as string;
				
				
				if (resource === 'user') {
					if (operation === 'get') {
						const id = this.getNodeParameter('id', itemIndex) as string;
						const url = `${baseURL}/api/v1/users/${id}`;
						
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
							},
						});
						
						responseData = response;
					} else if (operation === 'getAll') {
						const limit = this.getNodeParameter('limit', itemIndex, 25) as number;
						const url = `${baseURL}/api/v1/users?limit=${limit}`;
						
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
							},
						});
						
						responseData = response;
					} else if (operation === 'create') {
						const email = this.getNodeParameter('email', itemIndex) as string;
						const firstName = this.getNodeParameter('firstName', itemIndex) as string;
						const lastName = this.getNodeParameter('lastName', itemIndex) as string;
						
						const body = {
							email,
							firstName,
							lastName,
						};
						
						const url = `${baseURL}/api/v1/users`;
						
						const response = await this.helpers.httpRequest({
							method: 'POST',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
								'Content-Type': 'application/json',
							},
							body,
						});
						
						responseData = response;
					} else if (operation === 'update') {
						const id = this.getNodeParameter('id', itemIndex) as string;
						const email = this.getNodeParameter('email', itemIndex) as string;
						const firstName = this.getNodeParameter('firstName', itemIndex) as string;
						const lastName = this.getNodeParameter('lastName', itemIndex) as string;
						
						const body = {
							email,
							firstName,
							lastName,
						};
						
						const url = `${baseURL}/api/v1/users/${id}`;
						
						const response = await this.helpers.httpRequest({
							method: 'PUT',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
								'Content-Type': 'application/json',
							},
							body,
						});
						
						responseData = response;
					}
				} else if (resource === 'event') {
					if (operation === 'get') {
						const id = this.getNodeParameter('id', itemIndex) as string;
						const url = `${baseURL}/api/v1/events/${id}`;
						
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
							},
						});
						
						responseData = response;
					} else if (operation === 'getAll') {
						const limit = this.getNodeParameter('limit', itemIndex, 25) as number;
						const url = `${baseURL}/api/v1/events?limit=${limit}`;
						
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
							},
						});
						
						responseData = response;
					}
				} else if (resource === 'eventAttend') {
					if (operation === 'get') {
						const id = this.getNodeParameter('id', itemIndex) as string;
						const url = `${baseURL}/api/v1/event_attends/${id}`;
						
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
							},
						});
						
						responseData = response;
					} else if (operation === 'getAll') {
						const limit = this.getNodeParameter('limit', itemIndex, 25) as number;
						const url = `${baseURL}/api/v1/event_attends?limit=${limit}`;
						
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
							},
						});
						
						responseData = response;
					} else if (operation === 'create') {
						const eventId = this.getNodeParameter('eventId', itemIndex) as string;
						const userId = this.getNodeParameter('userId', itemIndex) as string;
						const status = this.getNodeParameter('status', itemIndex, 'registered') as string;
						
						const body = {
							eventId,
							userId,
							status,
						};
						
						const url = `${baseURL}/api/v1/event_attends`;
						
						const response = await this.helpers.httpRequest({
							method: 'POST',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
								'Content-Type': 'application/json',
							},
							body,
						});
						
						responseData = response;
					} else if (operation === 'update') {
						const id = this.getNodeParameter('id', itemIndex) as string;
						const eventId = this.getNodeParameter('eventId', itemIndex) as string;
						const userId = this.getNodeParameter('userId', itemIndex) as string;
						const status = this.getNodeParameter('status', itemIndex) as string;
						
						const body = {
							eventId,
							userId,
							status,
						};
						
						const url = `${baseURL}/api/v1/event_attends/${id}`;
						
						const response = await this.helpers.httpRequest({
							method: 'PUT',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
								'Content-Type': 'application/json',
							},
							body,
						});
						
						responseData = response;
					} else if (operation === 'delete') {
						const id = this.getNodeParameter('id', itemIndex) as string;
						const url = `${baseURL}/api/v1/event_attends/${id}`;
						
						const response = await this.helpers.httpRequest({
							method: 'DELETE',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
							},
						});
						
						responseData = response;
					}
				} else if (resource === 'contract') {
					if (operation === 'get') {
						const id = this.getNodeParameter('id', itemIndex) as string;
						const url = `${baseURL}/api/v1/contracts/${id}`;
						
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
							},
						});
						
						responseData = response;
					} else if (operation === 'getAll') {
						const limit = this.getNodeParameter('limit', itemIndex, 25) as number;
						const url = `${baseURL}/api/v1/contracts?limit=${limit}`;
						
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
							},
						});
						
						responseData = response;
					}
				} else if (resource === 'productPayment') {
					if (operation === 'get') {
						const id = this.getNodeParameter('id', itemIndex) as string;
						const url = `${baseURL}/api/v1/product_payments/${id}`;
						
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
							},
						});
						
						responseData = response;
					} else if (operation === 'getAll') {
						const limit = this.getNodeParameter('limit', itemIndex, 25) as number;
						const url = `${baseURL}/api/v1/product_payments?limit=${limit}`;
						
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
							},
						});
						
						responseData = response;
					}
				} else if (resource === 'webhook') {
					if (operation === 'get') {
						const id = this.getNodeParameter('id', itemIndex) as string;
						const url = `${baseURL}/api/v1/webhook_subscriptions/${id}`;
						
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
							},
						});
						
						responseData = response;
					} else if (operation === 'getAll') {
						const limit = this.getNodeParameter('limit', itemIndex, 25) as number;
						const url = `${baseURL}/api/v1/webhook_subscriptions?limit=${limit}`;
						
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
							},
						});
						
						responseData = response;
					} else if (operation === 'create') {
						const name = this.getNodeParameter('name', itemIndex) as string;
						const webhookUrl = this.getNodeParameter('url', itemIndex) as string;
						const eventTypes = this.getNodeParameter('eventTypes', itemIndex) as string[];
						const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as any;
						
						const body: any = {
							name,
							url: webhookUrl,
							eventTypes,
						};
						
						if (additionalFields.secret) body.secret = additionalFields.secret;
						if (additionalFields.maxRetries) body.maxRetries = additionalFields.maxRetries;
						if (additionalFields.timeoutSeconds) body.timeoutSeconds = additionalFields.timeoutSeconds;
						if (additionalFields.description) body.description = additionalFields.description;
						
						const url = `${baseURL}/api/v1/webhook_subscriptions`;
						
						const response = await this.helpers.httpRequest({
							method: 'POST',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
								'Content-Type': 'application/json',
							},
							body,
						});
						
						responseData = response;
					} else if (operation === 'update') {
						const id = this.getNodeParameter('id', itemIndex) as string;
						const name = this.getNodeParameter('name', itemIndex) as string;
						const webhookUrl = this.getNodeParameter('url', itemIndex) as string;
						const eventTypes = this.getNodeParameter('eventTypes', itemIndex) as string[];
						const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as any;
						
						const body: any = {
							name,
							url: webhookUrl,
							eventTypes,
						};
						
						if (additionalFields.secret) body.secret = additionalFields.secret;
						if (additionalFields.maxRetries) body.maxRetries = additionalFields.maxRetries;
						if (additionalFields.timeoutSeconds) body.timeoutSeconds = additionalFields.timeoutSeconds;
						if (additionalFields.description) body.description = additionalFields.description;
						
						const url = `${baseURL}/api/v1/webhook_subscriptions/${id}`;
						
						const response = await this.helpers.httpRequest({
							method: 'PUT',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
								'Content-Type': 'application/json',
							},
							body,
						});
						
						responseData = response;
					} else if (operation === 'delete') {
						const id = this.getNodeParameter('id', itemIndex) as string;
						const url = `${baseURL}/api/v1/webhook_subscriptions/${id}`;
						
						const response = await this.helpers.httpRequest({
							method: 'DELETE',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
							},
						});
						
						responseData = response;
					} else if (operation === 'test') {
						const id = this.getNodeParameter('id', itemIndex) as string;
						const url = `${baseURL}/api/v1/webhook_subscriptions/${id}/test`;
						console.log(`[Orgo Node] POST request to: ${url}`);
						
						const response = await this.helpers.httpRequest({
							method: 'POST',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
							},
						});
						
						responseData = response;
					}
				} else if (resource === 'custom') {
					const customUrl = this.getNodeParameter('url', itemIndex) as string;
					const url = `${baseURL}${customUrl}`;
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
				
				if (Array.isArray(responseData)) {
					returnData.push(...responseData.map(item => ({ json: item })));
				} else if (responseData) {
					returnData.push({ json: responseData });
				}
				
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message } });
					continue;
				}
				throw error;
			}
		}
		
		return [returnData];
	}
}
