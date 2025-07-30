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

This package includes two nodes:

## TouchBasePro (Email Operations)
Supports the following resources and operations:

### Transactional Email
- **Send Transactional Smart Email**: Send a transactional email using a Smart Email template, with support for recipients, CC, BCC, attachments, merge fields, and tracking options.

### List
- **Create List**: Create a new email list with custom fields and welcome email options.

### Subscriber
- **Add or Update Subscriber**: Add a new subscriber or update an existing one in a list, including custom fields.

### Suppression
- **Add Email(s) to Suppression List**: Add one or more emails to the suppression list for a client.

## TouchBasePro WhatsApp
Supports the following operations:

### WhatsApp
- **Send Message**: Send a WhatsApp message with support for both text messages and template-based messages with variables.

## Credentials

This node requires different TouchBasePro API credentials based on the resource you're using:

### Email Operations (Transactional Email, List, Subscriber, Suppression)
- **Credential Type**: `TouchBasePro API`
- **Username**: Your TouchBasePro account username for email operations.
- **Password**: Your TouchBasePro account password for email operations.

### WhatsApp Operations
- **Credential Type**: `TouchBasePro WhatsApp API`
- **API Key**: Your TouchBasePro api key for WhatsApp operations.


Set up your credentials in n8n by creating the appropriate credential type based on the operations you plan to use.

## Compatibility

- Requires n8n v1.0.0 or higher.
- Requires Node.js >= 20.15.
- Tested with the latest n8n and TouchBasePro API versions.

## Usage

### TouchBasePro (Email Operations)
- Add the TouchBasePro node to your workflow and select the desired resource and operation.
- Configure `TouchBasePro API` credentials for all email operations.
- Configure the required fields and map data as needed.
- For sending emails, ensure you have a Smart Email template set up in TouchBasePro.
- For list and subscriber management, ensure you have the correct list IDs and custom fields configured.

### TouchBasePro WhatsApp
- Add the TouchBasePro WhatsApp node to your workflow and select the desired operation.
- Configure `TouchBasePro WhatsApp API` credentials for WhatsApp operations.
- Configure the required fields and map data as needed.
- For sending WhatsApp messages, ensure you have the correct phone number format (with country code) and template setup if using template-based messages.

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [TouchBasePro documentation](https://www.touchbasepro.io/)

## Version history

- 0.1.0: Initial release with support for transactional emails, WhatsApp messaging, list management, subscribers, and suppression lists. Includes separate nodes for email and WhatsApp operations.

---

MIT License. See [LICENSE.md](./LICENSE.md) for details.
