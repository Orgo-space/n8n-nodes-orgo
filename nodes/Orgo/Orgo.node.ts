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
		usableAsTool: true,
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
						name: 'Contact',
						value: 'contact',
						description: 'Manage external contacts and relationships',
					},
					{
						name: 'Contract User',
						value: 'contract',
						description: 'Operations with user contracts and signatures',
					},
					{
						name: 'Event',
						value: 'event',
						description: 'Operations with events',
					},
					{
						name: 'Event Registration',
						value: 'eventAttend',
						description: 'Manage event registrations and attendance',
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
								url: '=/users/{{$parameter["id"]}}',
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
						value: 'getMany',
						description: 'Get multiple users',
						action: 'Get many users',
						routing: {
							request: {
								method: 'GET',
								url: '=/users?limit={{$parameter["limit"] || 25}}',
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
				],
				default: 'get',
			},

			// Contact operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['contact'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new contact',
						action: 'Create contact',
						routing: {
							request: {
								method: 'POST',
								url: '=/contacts',
							},
						},
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a contact',
						action: 'Delete contact',
						routing: {
							request: {
								method: 'DELETE',
								url: '=/contacts/{{$parameter["id"]}}',
							},
						},
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a contact by ID',
						action: 'Get contact',
						routing: {
							request: {
								method: 'GET',
								url: '=/contacts/{{$parameter["id"]}}',
							},
						},
					},
					{
						name: 'Get Many',
						value: 'getMany',
						description: 'Get multiple contacts',
						action: 'Get many contacts',
						routing: {
							request: {
								method: 'GET',
								url: '=/contacts?limit={{$parameter["limit"] || 25}}',
							},
						},
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a contact',
						action: 'Update contact',
						routing: {
							request: {
								method: 'PATCH',
								url: '=/contacts/{{$parameter["id"]}}',
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
						description: 'Get an event by UUID',
						action: 'Get an event',
						routing: {
							request: {
								method: 'GET',
								url: '=/events/{{$parameter["uuid"]}}',
							},
						},
					},
					{
						name: 'Get Many',
						value: 'getMany',
						description: 'Get multiple events',
						action: 'Get many events',
						routing: {
							request: {
								method: 'GET',
								url: '=/events?limit={{$parameter["limit"] || 25}}',
							},
						},
					},
				],
				default: 'get',
			},

			// Event Registration operations
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
								url: '=/event_attends',
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
								url: '=/event_attends/{{$parameter["id"]}}',
							},
						},
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get an event registration by ID',
						action: 'Get event registration',
						routing: {
							request: {
								method: 'GET',
								url: '=/event_attends/{{$parameter["id"]}}',
							},
						},
					},
					{
						name: 'Get Many',
						value: 'getMany',
						description: 'Get event registrations for a specific event',
						action: 'Get many event registrations',
						routing: {
							request: {
								method: 'GET',
								url: '=/event_attends?event={{$parameter["eventId"]}}&page={{$parameter["page"] || 1}}&order[id]=desc',
							},
						},
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update event registration/attendance status',
						action: 'Update event registration',
						routing: {
							request: {
								method: 'PATCH',
								url: '=/event_attends/{{$parameter["id"]}}',
							},
						},
					},
				],
				default: 'get',
			},

			// Contract User operations
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
						description: 'Get a contract user by ID',
						action: 'Get a contract user',
						routing: {
							request: {
								method: 'GET',
								url: '=/contract_users/{{$parameter["id"]}}',
							},
						},
					},
					{
						name: 'Get Many',
						value: 'getMany',
						description: 'Get multiple contract users',
						action: 'Get many contract users',
						routing: {
							request: {
								method: 'GET',
								url: '=/contract_users?limit={{$parameter["limit"] || 25}}',
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
								url: '=/product_payments/{{$parameter["id"]}}',
							},
						},
					},
					{
						name: 'Get Many',
						value: 'getMany',
						description: 'Get multiple payments',
						action: 'Get many payments',
						routing: {
							request: {
								method: 'GET',
								url: '=/product_payments?limit={{$parameter["limit"] || 25}}',
							},
						},
					},
				],
				default: 'get',
			},

			// Common ID parameter
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['user', 'eventAttend', 'contract', 'productPayment', 'webhook', 'contact'],
						operation: ['get', 'update', 'delete', 'test'],
					},
				},
				default: '',
				description: 'The ID of the resource',
			},
			
			// UUID parameter for events
			{
				displayName: 'UUID',
				name: 'uuid',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['event'],
						operation: ['get'],
					},
				},
				default: '',
				description: 'The UUID of the event',
			},

			// User required fields for create
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'user@example.com',
				displayOptions: {
					show: {
						resource: ['user'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'The email address of the user',
				required: true,
			},
			
			// User additional fields for create
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						resource: ['user'],
						operation: ['create'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'First Name',
						name: 'firstName',
						type: 'string',
						default: '',
						description: 'The first name of the user',
					},
					{
						displayName: 'Last Name',
						name: 'lastName',
						type: 'string',
						default: '',
						description: 'The last name of the user',
					},
				],
			},

			// Contact required fields
			{
				displayName: 'First Name',
				name: 'firstName',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['contact'],
						operation: ['create', 'update'],
					},
				},
				default: '',
				description: 'First name of the contact',
				required: true,
			},
			{
				displayName: 'Last Name',
				name: 'lastName',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['contact'],
						operation: ['create', 'update'],
					},
				},
				default: '',
				description: 'Last name of the contact',
				required: true,
			},
			
			// Contact additional fields
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						resource: ['contact'],
						operation: ['create', 'update'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Email',
						name: 'email',
						type: 'string',
						placeholder: 'contact@example.com',
						default: '',
						description: 'Email address of the contact',
					},
					{
						displayName: 'Notes',
						name: 'notes',
						type: 'string',
						typeOptions: {
							rows: 4,
						},
						default: '',
						description: 'Additional notes about the contact',
					},
				],
			},

			// Event Registration required fields
			{
				displayName: 'Event UUID',
				name: 'eventUuid',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['eventAttend'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'The UUID of the event to register for',
				required: true,
			},
			{
				displayName: 'User ID',
				name: 'userId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['eventAttend'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'The ID of the user registering for the event',
				required: true,
			},
			
			// Event Registration additional fields
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						resource: ['eventAttend'],
						operation: ['create'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Status',
						name: 'status',
						type: 'options',
						options: [
							{ name: 'Registered', value: 1 },
							{ name: 'Attended', value: 3 },
							{ name: 'Not Attending', value: 0 },
							{ name: 'Invited', value: 2 },
						],
						default: 1,
						description: 'The attendance status',
					},
				],
			},
			
			// Event ID for getMany operation
			{
				displayName: 'Event ID',
				name: 'eventId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['eventAttend'],
						operation: ['getMany'],
					},
				},
				default: '',
				description: 'The ID of the event to get registrations for',
				required: true,
			},
			
			// Status for update operation
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['eventAttend'],
						operation: ['update'],
					},
				},
				options: [
					{ name: 'Registered', value: 1 },
					{ name: 'Attended', value: 3 },
					{ name: 'Not Attending', value: 0 },
					{ name: 'Invited', value: 2 },
				],
				default: 1,
				description: 'The attendance status',
			},

			// Output options for getMany operations
			{
				displayName: 'Output',
				name: 'output',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['getMany'],
					},
				},
				options: [
					{
						name: 'Simplified',
						value: 'simplified',
						description: 'Returns simplified data with key fields only',
					},
					{
						name: 'Raw',
						value: 'raw',
						description: 'Returns all available data',
					},
				],
				default: 'simplified',
			},
			
			// Limit parameter for getMany operations
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['getMany'],
					},
					hide: {
						resource: ['eventAttend'],
					},
				},
				typeOptions: {
					minValue: 1,
				},
				default: 50,
				description: 'Max number of results to return',
			},
			
			// Page parameter for event attends getAll
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['eventAttend'],
						operation: ['getMany'],
					},
				},
				typeOptions: {
					minValue: 1,
				},
				default: 1,
				description: 'Page number (100 results per page)',
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
						const url = `${baseURL}/users/${id}`;
						
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
							},
						});
						
						responseData = response;
					} else if (operation === 'getMany') {
						const limit = this.getNodeParameter('limit', itemIndex, 25) as number;
						const output = this.getNodeParameter('output', itemIndex, 'simplified') as string;
						const url = `${baseURL}/users?limit=${limit}`;
						
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
							},
						});
						
						if (output === 'simplified' && Array.isArray(response)) {
							responseData = response.map((user: any) => ({
								id: user.id,
								email: user.email,
								firstName: user.firstName,
								lastName: user.lastName,
								status: user.status,
								createdAt: user.createdAt,
							}));
						} else {
							responseData = response;
						}
					} else if (operation === 'create') {
						const email = this.getNodeParameter('email', itemIndex) as string;
						const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as any;
						
						const body: any = {
							email,
						};
						
						if (additionalFields.firstName) body.firstName = additionalFields.firstName;
						if (additionalFields.lastName) body.lastName = additionalFields.lastName;
						
						const url = `${baseURL}/member-register-by-admin`;
						
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
						
						const url = `${baseURL}/users/${id}`;
						
						const response = await this.helpers.httpRequest({
							method: 'PATCH',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
								'Content-Type': 'application/merge-patch+json',
							},
							body,
						});
						
						responseData = response;
					}
				} else if (resource === 'contact') {
					if (operation === 'get') {
						const id = this.getNodeParameter('id', itemIndex) as string;
						const url = `${baseURL}/contacts/${id}`;
						
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
							},
						});
						
						responseData = response;
					} else if (operation === 'getMany') {
						const limit = this.getNodeParameter('limit', itemIndex, 25) as number;
						const output = this.getNodeParameter('output', itemIndex, 'simplified') as string;
						const url = `${baseURL}/contacts?limit=${limit}`;
						
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
							},
						});
						
						if (output === 'simplified' && Array.isArray(response)) {
							responseData = response.map((contact: any) => ({
								id: contact.id,
								name: contact.name,
								email: contact.email,
								createdAt: contact.createdAt,
							}));
						} else {
							responseData = response;
						}
					} else if (operation === 'create') {
						const firstName = this.getNodeParameter('firstName', itemIndex) as string;
						const lastName = this.getNodeParameter('lastName', itemIndex) as string;
						const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as any;
						const name = firstName + ' ' + lastName;
						
						const body: any = {
							name,
						};
						
						if (additionalFields.email) body.email = additionalFields.email;
						if (additionalFields.notes) body.notes = additionalFields.notes;
						
						const url = `${baseURL}/contacts`;
						
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
					} else if (operation === 'delete') {
						const id = this.getNodeParameter('id', itemIndex) as string;
						const url = `${baseURL}/contacts/${id}`;
						
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
				} else if (resource === 'event') {
					if (operation === 'get') {
						const uuid = this.getNodeParameter('uuid', itemIndex) as string;
						const url = `${baseURL}/events/${uuid}`;
						
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
							},
						});
						
						responseData = response;
					} else if (operation === 'getMany') {
						const limit = this.getNodeParameter('limit', itemIndex, 25) as number;
						const output = this.getNodeParameter('output', itemIndex, 'simplified') as string;
						const url = `${baseURL}/events?limit=${limit}`;
						
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
							},
						});
						
						if (output === 'simplified' && Array.isArray(response)) {
							responseData = response.map((event: any) => ({
								id: event.id,
								uuid: event.uuid,
								title: event.title,
								startDate: event.startDate,
								endDate: event.endDate,
								location: event.location,
								status: event.status,
							}));
						} else {
							responseData = response;
						}
					}
				} else if (resource === 'eventAttend') {
					if (operation === 'get') {
						const id = this.getNodeParameter('id', itemIndex) as string;
						const url = `${baseURL}/event_attends/${id}`;
						
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
							},
						});
						
						responseData = response;
					} else if (operation === 'getMany') {
						const page = this.getNodeParameter('page', itemIndex, 1) as number;
						const eventId = this.getNodeParameter('eventId', itemIndex) as string;
						const output = this.getNodeParameter('output', itemIndex, 'simplified') as string;
						const url = `${baseURL}/event_attends?event=${eventId}&page=${page}&order[id]=desc`;
						
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
							},
						});
						
						if (output === 'simplified' && Array.isArray(response)) {
							responseData = response.map((attend: any) => ({
								id: attend.id,
								userId: attend.user?.id || attend.user,
								userName: attend.user?.name || attend.user?.firstName + ' ' + attend.user?.lastName,
								eventId: attend.event?.id || attend.event,
								status: attend.status,
								createdAt: attend.createdAt,
							}));
						} else {
							responseData = response;
						}
					} else if (operation === 'create') {
						const eventUuid = this.getNodeParameter('eventUuid', itemIndex) as string;
						const userId = this.getNodeParameter('userId', itemIndex) as string;
						const additionalFields = this.getNodeParameter('additionalFields', itemIndex, {}) as any;
						const status = additionalFields.status || 1;
						
						const body: any = {
							event: `/api/v1/events/${eventUuid}`,
							user: `/api/v1/users/${userId}`,
							status,
						};
						
						if (status === 2) {
							body.isInvited = true;
						}
						
						const url = `${baseURL}/event_attends`;
						
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
						const status = this.getNodeParameter('status', itemIndex) as number;
						
						const body: any = {
							status,
						};
						
						if (status === 2) {
							body.isInvited = true;
						}
						
						const url = `${baseURL}/event_attends/${id}`;
						
						const response = await this.helpers.httpRequest({
							method: 'PATCH',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
								'Content-Type': 'application/merge-patch+json',
							},
							body,
						});
						
						responseData = response;
					} else if (operation === 'delete') {
						const id = this.getNodeParameter('id', itemIndex) as string;
						const url = `${baseURL}/event_attends/${id}`;
						
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
						const url = `${baseURL}/contract_users/${id}`;
						
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
							},
						});
						
						responseData = response;
					} else if (operation === 'getMany') {
						const limit = this.getNodeParameter('limit', itemIndex, 25) as number;
						const output = this.getNodeParameter('output', itemIndex, 'simplified') as string;
						const url = `${baseURL}/contract_users?limit=${limit}`;
						
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
							},
						});
						
						if (output === 'simplified' && Array.isArray(response)) {
							responseData = response.map((contract: any) => ({
								id: contract.id,
								userId: contract.user?.id || contract.user,
								contractId: contract.contract?.id || contract.contract,
								status: contract.status,
								signedAt: contract.signedAt,
								createdAt: contract.createdAt,
							}));
						} else {
							responseData = response;
						}
					}
				} else if (resource === 'productPayment') {
					if (operation === 'get') {
						const id = this.getNodeParameter('id', itemIndex) as string;
						const url = `${baseURL}/product_payments/${id}`;
						
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
							},
						});
						
						responseData = response;
					} else if (operation === 'getMany') {
						const limit = this.getNodeParameter('limit', itemIndex, 25) as number;
						const output = this.getNodeParameter('output', itemIndex, 'simplified') as string;
						const url = `${baseURL}/product_payments?limit=${limit}`;
						
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url,
							headers: {
								'Api-Token': credentials.apiToken as string,
								'Accept': 'application/json',
							},
						});
						
						if (output === 'simplified' && Array.isArray(response)) {
							responseData = response.map((payment: any) => ({
								id: payment.id,
								amount: payment.amount,
								currency: payment.currency,
								status: payment.status,
								paidAt: payment.paidAt,
								userId: payment.user?.id || payment.user,
								createdAt: payment.createdAt,
							}));
						} else {
							responseData = response;
						}
					}
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
