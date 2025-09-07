import {
	IHookFunctions,
	IWebhookFunctions,
	IDataObject,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';


export class OrgoTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Orgo Trigger',
		name: 'orgoTrigger',
		icon: 'file:orgo.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Starts the workflow when Orgo events occur (webhooks)',
		defaults: {
			name: 'Orgo Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'orgoApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				options: [
					{
						name: 'Contact Created',
						value: 'contact.created',
						description: 'Triggered when a contact is created',
					},
					{
						name: 'Contact Deleted',
						value: 'contact.deleted',
						description: 'Triggered when a contact is deleted',
					},
					{
						name: 'Contact Updated',
						value: 'contact.updated',
						description: 'Triggered when contact information is updated',
					},
					{
						name: 'Contract Deleted',
						value: 'contract_user.deleted',
						description: 'Triggered when a contract is removed or cancelled',
					},
					{
						name: 'Contract Signed',
						value: 'contract_user.created',
						description: 'Triggered when a user signs a contract',
					},
					{
						name: 'Contract Updated',
						value: 'contract_user.updated',
						description: 'Triggered when contract status or details change',
					},
					{
						name: 'Event Attendance Updated',
						value: 'event_attend.updated',
						description: 'Triggered when event attendance status changes',
					},
					{
						name: 'Event Registration',
						value: 'event_attend.created',
						description: 'Triggered when someone registers for an event',
					},
					{
						name: 'Event Registration Cancelled',
						value: 'event_attend.deleted',
						description: 'Triggered when event registration is cancelled',
					},
					{
						name: 'Payment Created',
						value: 'product_payment.created',
						description: 'Triggered when a new payment is processed',
					},
					{
						name: 'Payment Deleted',
						value: 'product_payment.deleted',
						description: 'Triggered when a payment record is deleted',
					},
					{
						name: 'Payment Updated',
						value: 'product_payment.updated',
						description: 'Triggered when payment status changes',
					},
					{
						name: 'Role Assigned',
						value: 'user_role.created',
						description: 'Triggered when a role is assigned to a user',
					},
					{
						name: 'Role Removed',
						value: 'user_role.deleted',
						description: 'Triggered when a role is removed from a user',
					},
					{
						name: 'Role Updated',
						value: 'user_role.updated',
						description: 'Triggered when role permissions or details change',
					},
					{
						name: 'User Created',
						value: 'user.created',
						description: 'Triggered when a new user registers or is created',
					},
					{
						name: 'User Deleted',
						value: 'user.deleted',
						description: 'Triggered when a user account is deleted',
					},
					{
						name: 'User Updated',
						value: 'user.updated',
						description: 'Triggered when user information is updated',
					},
				],
				default: [],
				required: true,
				description: 'Select the events that should trigger this webhook',
			},
			{
				displayName: 'Verify Signature',
				name: 'verifySignature',
				type: 'boolean',
				default: true,
				description: 'Whether to verify webhook signatures for security (recommended)',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Max Retries',
						name: 'maxRetries',
						type: 'number',
						default: 3,
						description: 'Maximum number of retry attempts for failed webhook deliveries',
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
						description: 'Timeout for webhook HTTP requests',
						typeOptions: {
							minValue: 1,
							maxValue: 300,
						},
					},
				],
			},
		],
	};

	// The function below is responsible for deregistering the webhook
	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (webhookData.webhookId === undefined) {
					return false;
				}
				
				const credentials = await this.getCredentials('orgoApi');
				const options = {
					method: 'GET' as const,
					url: `${credentials.apiUrl}/webhook_subscriptions/${webhookData.webhookId}`,
					headers: {
						'Api-Token': credentials.apiToken as string,
					},
				};

				try {
					await this.helpers.httpRequest(options);
					return true;
				} catch (error) {
					return false;
				}
			},
			
			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const events = this.getNodeParameter('events') as string[];
				const options = this.getNodeParameter('options', {}) as IDataObject;
				const credentials = await this.getCredentials('orgoApi');

				const body = {
					name: `n8n Workflow: ${this.getWorkflow().name}`,
					url: webhookUrl,
					eventTypes: events,
					secret: credentials.webhookSecret || null,
					isActive: true,
					maxRetries: options.maxRetries || 3,
					timeoutSeconds: options.timeoutSeconds || 30,
					description: `Created by n8n workflow "${this.getWorkflow().name}" (${this.getWorkflow().id})`,
				};

				const requestOptions = {
					method: 'POST' as const,
					url: `${credentials.apiUrl}/webhook_subscriptions`,
					body,
					headers: {
						'Api-Token': credentials.apiToken as string,
						'Content-Type': 'application/json',
					},
				};

				try {
					const responseData = await this.helpers.httpRequest(requestOptions);
					
					if (responseData.id === undefined) {
						return false;
					}

					const webhookData = this.getWorkflowStaticData('node');
					webhookData.webhookId = responseData.id;
					
					return true;
				} catch (error) {
					throw new NodeOperationError(this.getNode(), `Failed to create Orgo webhook: ${error.message}`);
				}
			},
			
			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				
				if (webhookData.webhookId !== undefined) {
					const credentials = await this.getCredentials('orgoApi');
					const options = {
						method: 'DELETE' as const,
						url: `${credentials.apiUrl}/webhook_subscriptions/${webhookData.webhookId}`,
						headers: {
							'Api-Token': credentials.apiToken as string,
						},
					};

					try {
						await this.helpers.httpRequest(options);
					} catch (error) {
						return false;
					}

					// Remove from the static workflow data
					delete webhookData.webhookId;
				}
				
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData();
		const headers = this.getHeaderData();
		const verifySignature = this.getNodeParameter('verifySignature', true) as boolean;

		// Verify webhook signature if enabled and secret is provided
		if (verifySignature) {
			const credentials = await this.getCredentials('orgoApi');
			
			if (credentials.webhookSecret) {
				const signature = headers['x-webhook-signature'] as string;
				
				if (!signature) {
					throw new NodeOperationError(this.getNode(), 'Webhook signature missing');
				}

				const isValid = verifyWebhookSignature(
					JSON.stringify(body),
					signature,
					credentials.webhookSecret as string
				);

				if (!isValid) {
					throw new NodeOperationError(this.getNode(), 'Invalid webhook signature');
				}
			}
		}

		// Process the standardized Orgo webhook payload
		const webhookPayload = body as IDataObject;
		
		// Validate that this is an Orgo webhook with the expected structure
		if (!webhookPayload.id || !webhookPayload.event || !webhookPayload.object) {
			throw new NodeOperationError(this.getNode(), 'Invalid Orgo webhook payload structure');
		}

		// Return the webhook data in a format that's easy to use in n8n workflows
		return {
			workflowData: [
				[
					{
						json: {
							// Orgo standardized webhook fields
							id: webhookPayload.id,
							event: webhookPayload.event,
							api_version: webhookPayload.api_version,
							created: webhookPayload.created,
							tenant_id: webhookPayload.tenant_id,
							request: webhookPayload.request,
							
							// Main entity data (what most workflows will use)
							object: webhookPayload.object,
							
							// Change tracking for update events
							previous_attributes: webhookPayload.previous_attributes || null,
							
							// Helper fields for workflow logic
							is_update: webhookPayload.is_update || false,
							entity_type: webhookPayload.entity_type, // e.g., 'user', 'contract_user', 'product_payment', 'event_attend'
							operation: webhookPayload.operation, // e.g., 'created', 'updated', 'deleted'
							
							// Original webhook payload for advanced use cases
							_raw: webhookPayload,
						},
					},
				],
			],
		};
	}

}

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
	try {
		if (!signature || !secret || signature.length === 0) {
			return false;
		}
		
		const combinedString = payload + '|' + secret;
		let hash = 0;
		for (let i = 0; i < combinedString.length; i++) {
			const char = combinedString.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash;
		}
		
		const expectedSignature = Math.abs(hash).toString(16);
		return signature === expectedSignature;
	} catch (error) {
		return false;
	}
}