# n8n-nodes-orgo

This is an n8n community node that provides integration with Orgo, a multi-tenant SaaS platform for organizations with emphasis on scouting and membership management.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Resources](#resources)  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

1. Go to **Settings > Community Nodes** in your n8n instance
2. Select **Install** and enter `n8n-nodes-orgo`
3. Click **Install**

Alternatively, you can install it via npm in your n8n installation:

```bash
npm install n8n-nodes-orgo
```

## Operations

This package provides two nodes:

### Orgo Node
The main node for interacting with the Orgo API.

**Resources:**
- **User**: Create, read, update user accounts and member information
- **Event**: Manage events, registrations, and attendance
- **Payment**: Access payment records and fee information
- **Contract**: Handle digital contracts and signatures
- **Webhook**: Manage webhook subscriptions

### Orgo Trigger Node
A trigger node that responds to Orgo webhooks for real-time automation.

**Supported Events:**
- User events (created, updated, deleted)
- Payment events (created, updated, deleted)
- Event attendance (created, updated, deleted)
- Contract events (created, updated, deleted)  
- User role events (created, updated, deleted)
- External profile events (created, updated, deleted)

## Credentials

You need to create Orgo API credentials in n8n:

1. **API Base URL**: Your Orgo instance URL (e.g., `https://app.orgo.space/api/v1`)
2. **API Token**: Your API token from Orgo account settings
3. **Webhook Secret** (optional): For webhook signature verification
4. **Tenant ID** (optional): Your organization ID (auto-detected if not provided)

### Getting Your API Token

1. Log into your Orgo account
2. Go to **Settings > API Access** 
3. Generate or copy your API token
4. Copy the token and paste it into your n8n credentials

## Webhook Setup

The Orgo Trigger node automatically manages webhook subscriptions:

1. **Automatic Registration**: When you activate a workflow with an Orgo Trigger, it automatically creates a webhook subscription in Orgo
2. **Event Filtering**: Select only the events you want to trigger your workflow
3. **Signature Verification**: Enable webhook signature verification for security
4. **Automatic Cleanup**: When you deactivate the workflow, the webhook is automatically removed

### Webhook Payload Structure

Orgo webhooks use a standardized payload format:

```json
{
  "id": "wh_evt_123456789abcd",
  "event": "user.created",
  "api_version": "2024-01",
  "created": 1705320600,
  "data": {
    "object": {
      "id": 123,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "previous_attributes": {
      "email": {
        "old": "old@example.com",
        "new": "user@example.com"
      }
    }
  },
  "tenant_id": 1,
  "request": {
    "id": "req_987654321efgh",
    "idempotency_key": null
  }
}
```

In your n8n workflow, you can access:
- `{{$json.object}}` - The main entity data
- `{{$json.event}}` - The event type (e.g., "user.created")  
- `{{$json.previous_attributes}}` - Changes for update events
- `{{$json.is_update}}` - Boolean indicating if this is an update event
- `{{$json.tenant_id}}` - The organization ID

## Example Workflows

### User Registration Automation
```json
{
  "name": "Orgo New User Welcome",
  "nodes": [
    {
      "name": "Orgo Trigger",
      "type": "n8n-nodes-orgo.orgoTrigger",
      "parameters": {
        "events": ["user.created"],
        "verifySignature": true
      }
    },
    {
      "name": "Send Welcome Email",
      "type": "n8n-nodes-base.emailSend",
      "parameters": {
        "toEmail": "={{$json.object.email}}",
        "subject": "Welcome to our organization!",
        "text": "Hello {{$json.object.firstName}}, welcome to our platform!"
      }
    },
    {
      "name": "Add to CRM",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://your-crm.com/api/contacts",
        "bodyParametersJson": {
          "email": "={{$json.object.email}}",
          "firstName": "={{$json.object.firstName}}",
          "lastName": "={{$json.object.lastName}}",
          "source": "orgo_webhook"
        }
      }
    }
  ]
}
```

### Payment Processing
```json
{
  "name": "Orgo Payment Handler",
  "nodes": [
    {
      "name": "Orgo Trigger",
      "type": "n8n-nodes-orgo.orgoTrigger", 
      "parameters": {
        "events": ["product_payment.created", "product_payment.updated"]
      }
    },
    {
      "name": "Check Payment Status",
      "type": "n8n-nodes-base.switch",
      "parameters": {
        "dataPropertyName": "object.status",
        "values": [
          {"value": "success"},
          {"value": "failed"}
        ]
      }
    }
  ]
}
```

## Multi-Tenant Support

Orgo is a multi-tenant platform. The nodes automatically handle tenant isolation:

- All API requests are scoped to your organization
- Webhook events include the `tenant_id` for proper filtering
- User permissions are respected based on your account role

## Error Handling

The nodes include comprehensive error handling:

- **API Errors**: Detailed error messages from the Orgo API
- **Webhook Validation**: Signature verification prevents unauthorized requests  
- **Rate Limiting**: Automatic retry with exponential backoff
- **Connection Issues**: Graceful handling of network problems

## Compatibility

This node has been tested with:
- n8n version 1.0.0 and above
- Node.js 18.x and above
- Orgo API version 2024-01

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Orgo Platform](https://app.orgo.space)

## License

[MIT](https://github.com/your-username/n8n-nodes-orgo/blob/master/LICENSE.md)