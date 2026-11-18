import { createHmac, timingSafeEqual } from 'crypto';
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
					// Contact Events
					{
						name: '[Contact] Created',
						value: 'contact.created',
						description: 'Triggered when a contact is created',
					},
					{
						name: '[Contact] Deleted',
						value: 'contact.deleted',
						description: 'Triggered when a contact is deleted',
					},
					{
						name: '[Contact] Updated',
						value: 'contact.updated',
						description: 'Triggered when contact information is updated',
					},
					// Event Registration Events
					{
						name: '[Event] Registration Created',
						value: 'event_attend.created',
						description: 'Triggered when someone registers for an event',
					},
					{
						name: '[Event] Registration Updated',
						value: 'event_attend.updated',
						description: 'Triggered when event attendance status changes',
					},
					// Role Events
					{
						name: '[Role] Assigned',
						value: 'user_role.created',
						description: 'Triggered when a role is assigned to a user',
					},
					{
						name: '[Role] Removed',
						value: 'user_role.deleted',
						description: 'Triggered when a role is removed from a user',
					},
					// User & Identity Events
					{
						name: '[User] Created',
						value: 'user.created',
						description: 'Triggered when a new user registers or is created',
					},
					{
						name: '[User] Updated',
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
				description:
					'Whether to verify the HMAC-SHA256 webhook signature (recommended). Requires a Webhook Secret in the credential; without one, Orgo sends no signature and any request to this URL is accepted.',
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
				// Never delete the webhook - just return true
				// This keeps the webhook active in Orgo even when workflow is deactivated
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
				const req = this.getRequestObject();
				if (!req.rawBody && typeof req.readRawBody === 'function') {
					await req.readRawBody();
				}

				const isValid = verifyWebhookSignature(
					req.rawBody,
					headers['x-webhook-signature'] as string | undefined,
					credentials.webhookSecret as string,
				);

				if (!isValid) {
					// Answer 401 instead of throwing: a forged request must not start the
					// workflow, and a 4xx is logged as a failed delivery in Orgo.
					const res = this.getResponseObject();
					res.status(401).json({ error: 'Invalid or missing webhook signature' });
					return { noWebhookResponse: true };
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

// Maximum age of a signed delivery, in seconds. Orgo re-signs every retry with a
// fresh timestamp, so this only rejects replays of captured requests.
const SIGNATURE_TOLERANCE_SECONDS = 300;

/**
 * Verifies Orgo's `X-Webhook-Signature: t=<unix seconds>,v1=<hex>` header, where v1 is
 * HMAC-SHA256(secret, "<t>.<raw body>"). The raw body must be used as received: Orgo
 * signs PHP's json_encode output, which re-serialising the parsed body does not reproduce.
 */
function verifyWebhookSignature(
	rawBody: Buffer | undefined,
	header: string | undefined,
	secret: string,
): boolean {
	if (!rawBody || !header || !secret) {
		return false;
	}

	let timestamp: string | undefined;
	const candidates: string[] = [];
	for (const part of header.split(',')) {
		const idx = part.indexOf('=');
		if (idx === -1) continue;
		const key = part.slice(0, idx).trim();
		const value = part.slice(idx + 1).trim();
		if (key === 't') timestamp = value;
		else if (key === 'v1') candidates.push(value);
	}

	if (!timestamp || !/^\d+$/.test(timestamp) || candidates.length === 0) {
		return false;
	}

	const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
	if (age > SIGNATURE_TOLERANCE_SECONDS) {
		return false;
	}

	const expected = createHmac('sha256', secret)
		.update(`${timestamp}.`)
		.update(rawBody)
		.digest();

	return candidates.some((candidate) => {
		if (!/^[0-9a-f]{64}$/.test(candidate)) return false;
		return timingSafeEqual(expected, Buffer.from(candidate, 'hex'));
	});
}