# n8n-nodes-touchbasepro

This is an n8n community node. It lets you use TouchBasePro in your n8n workflows.

TouchBasePro is an email marketing, transactional email, and WhatsApp messaging platform for sending, managing, and tracking communications at scale.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)  
[Version history](#version-history)  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

```
npm install n8n-nodes-touchbasepro
```

## Operations

This package includes one combined node that supports both Email and WhatsApp operations:

## TouchBasePro (Combined Email & WhatsApp Operations)
Supports the following resources and operations:

### Email
- **Send Transactional Smart Email**: Send a transactional email using a Smart Email template, with support for recipients, CC, BCC, attachments, merge fields, and tracking options.
- **Create List**: Create a new email list with custom fields and welcome email options.
- **Add/Update Subscriber**: Add a new subscriber or update an existing one in a list, including custom fields.
- **Add Email(s) to Suppression List**: Add one or more emails to the suppression list for a client.

### WhatsApp
- **Send Message**: Send a WhatsApp message with support for both text messages and template-based messages with variables.

### SMS
- **Get Balance**: Retrieve your account balance from MyMobileAPI.
- **Send Bulk Messages**: Send multiple SMS messages to different phone numbers.
- **Generate Authentication Token**: Generate an authentication token based on basic authorization.

## Credentials

This node requires TouchBasePro API credentials:

### TouchBasePro API
- **Email API Key**: Your TouchBasePro API key for email operations.
- **WhatsApp API Key**: Your TouchBasePro API key for WhatsApp operations.
- **SMS Username**: Your MyMobileAPI username for SMS operations.
- **SMS Password**: Your MyMobileAPI password for SMS operations.

All API keys and credentials are configured in a single credential type for easy management.

## Compatibility

- Requires n8n v1.0.0 or higher.
- Requires Node.js >= 20.15.
- Tested with the latest n8n and TouchBasePro API versions.

## Usage

### TouchBasePro (Combined Operations)
- Add the TouchBasePro node to your workflow and select the desired resource (Email, WhatsApp, or SMS).
- Configure `TouchBasePro API` credentials with your Email API Key, WhatsApp API Key, SMS Username, and SMS Password.
- Configure the required fields and map data as needed.
- For sending emails, ensure you have a Smart Email template set up in TouchBasePro.
- For list and subscriber management, ensure you have the correct list IDs and custom fields configured.
- For sending WhatsApp messages, ensure you have the correct phone number format (with country code) and template setup if using template-based messages.
- For SMS operations, ensure you have valid MyMobileAPI credentials and phone numbers in the correct format.

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [TouchBasePro documentation](https://www.touchbasepro.io/)

## Version history

- 0.2.0: Simplified to two resources (Email and WhatsApp) with single credential type and combined operations.
- 0.1.0: Initial release with support for transactional emails, WhatsApp messaging, list management, subscribers, and suppression lists. Includes separate nodes for email and WhatsApp operations.

---

MIT License. See [LICENSE.md](./LICENSE.md) for details.
