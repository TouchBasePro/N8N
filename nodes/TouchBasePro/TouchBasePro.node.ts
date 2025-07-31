import {
	INodeExecutionData,
	INodeInputConfiguration,
	INodeOutputConfiguration,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
	IExecuteFunctions,
} from 'n8n-workflow';
import {
	sendSmartEmail,
	getSmartEmailOptions,
	getMergeFieldOptions,
} from './operations/TransactionalEmail';
import { createList } from './operations/List';
import {
	addOrUpdateSubscriber,
	getCustomFields,
	getSubscriberOptions,
} from './operations/Subscriber';
import { getListOptions } from './operations/List';
import {
	addToSuppressionList,
	getSuppressionListOptions,
	getSuppressionEmailsOptions,
} from './operations/Suppression';
import {
	sendWhatsAppMessage,
	getWhatsAppTemplateOptions,
	getTemplateLanguageOptions,
	getTemplateVariableOptions,
} from './operations/WhatsApp';
import {
	getBalance,
	sendBulkMessages,
	generateAuthToken,
} from './operations/SMS';

export class TouchBasePro implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'TouchBasePro',
		name: 'touchBasePro',
		icon: 'file:logo.svg',
		group: ['output'],
		version: 1,
		description: 'Interact with TouchBasePro API for Email and WhatsApp operations',
		subtitle: '={{$parameter["operation"] || "Select an Operation"}}',
		defaults: {
			name: 'TouchBasePro',
		},
		credentials: [
			{
				name: 'touchBaseProApi',
				required: true,
			},
		],
		inputs: ['main'] as (NodeConnectionType | INodeInputConfiguration)[],
		outputs: ['main'] as (NodeConnectionType | INodeOutputConfiguration)[],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				typeOptions: { searchable: true },
				options: [
					{ name: 'Email', value: 'email' },
					{ name: 'WhatsApp', value: 'whatsapp' },
					{ name: 'SMS', value: 'sms' },
				],
				default: 'email',
			},
			// Operation for Email Actions
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				typeOptions: { searchable: true },
				displayOptions: {
					show: { resource: ['email'] },
				},
				options: [
					{
						name: 'Send Transactional Smart Email',
						value: 'sendSmartEmail',
						action: 'Send transactional smart email',
					},
					{
						name: 'Create List',
						value: 'createList',
						action: 'Create list',
					},
					{
						name: 'Add/Update Subscriber',
						value: 'addOrUpdateSubscriber',
						action: 'Add update subscriber',
					},
					{
						name: 'Add Email(s) to Suppression List',
						value: 'addToSuppressionList',
						action: 'Add email s to suppression list',
					},
				],
				default: 'sendSmartEmail',
			},
			// Operation for WhatsApp Actions
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				typeOptions: { searchable: true },
				displayOptions: {
					show: { resource: ['whatsapp'] },
				},
				options: [
					{
						name: 'Send Message',
						value: 'sendWhatsAppMessage',
						action: 'Send a whatsapp message',
					},
				],
				default: 'sendWhatsAppMessage',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				typeOptions: { searchable: true },
				displayOptions: {
					show: { resource: ['sms'] },
				},
				options: [
					{
						name: 'Get Balance',
						value: 'getBalance',
						action: 'Get account balance',
					},
					{
						name: 'Send Bulk Messages',
						value: 'sendBulkMessages',
						action: 'Send multiple SMS messages',
					},
					{
						name: 'Generate Authentication Token',
						value: 'generateAuthToken',
						action: 'Generate authentication token',
					},
				],
				default: 'getBalance',
			},
			// Email Operations Fields
			// Smart Email Template dropdown
			{
				displayName: 'Smart Email Template Name or ID',
				name: 'smartEmailId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getSmartEmailOptions',
					searchable: true,
				},
				displayOptions: {
					show: {
						resource: ['email'],
						operation: ['sendSmartEmail'],
					},
				},
				default: '',
				required: true,
				description:
					'Choose from your TouchBasePro smart transactional email templates. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			// Recipients
			{
				displayName: 'To',
				name: 'to',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				displayOptions: {
					show: {
						resource: ['email'],
						operation: ['sendSmartEmail'],
					},
				},
				default: {},
				options: [
					{
						name: 'recipients',
						displayName: 'Recipients',
						values: [
							{ displayName: 'Name', name: 'name', type: 'string', default: '' },
							{
								displayName: 'Email',
								name: 'email',
								type: 'string',
								placeholder: 'name@email.com',
								default: '',
							},
						],
					},
				],
			},
			// CC recipients
			{
				displayName: 'CC',
				name: 'cc',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				displayOptions: {
					show: {
						resource: ['email'],
						operation: ['sendSmartEmail'],
					},
				},
				default: {},
				options: [
					{
						name: 'recipients',
						displayName: 'CC Recipients',
						values: [
							{ displayName: 'Name', name: 'name', type: 'string', default: '' },
							{
								displayName: 'Email',
								name: 'email',
								type: 'string',
								placeholder: 'name@email.com',
								default: '',
							},
						],
					},
				],
			},
			// BCC recipients
			{
				displayName: 'BCC',
				name: 'bcc',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				displayOptions: {
					show: {
						resource: ['email'],
						operation: ['sendSmartEmail'],
					},
				},
				default: {},
				options: [
					{
						name: 'recipients',
						displayName: 'BCC Recipients',
						values: [
							{ displayName: 'Name', name: 'name', type: 'string', default: '' },
							{
								displayName: 'Email',
								name: 'email',
								type: 'string',
								placeholder: 'name@email.com',
								default: '',
							},
						],
					},
				],
			},
			// Attachments (not implemented)
			{
				displayName: 'Attachments',
				name: 'attachments',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				displayOptions: {
					show: {
						resource: ['email'],
						operation: ['sendSmartEmail'],
					},
				},
				default: {},
				options: [
					{
						name: 'attachments',
						displayName: 'Attachments',
						values: [
							{ displayName: 'Name', name: 'name', type: 'string', default: '' },
							{ displayName: 'Type', name: 'type', type: 'string', default: '' },
							{
								displayName: 'Input Binary Field',
								name: 'binaryPropertyName',
								type: 'string',
								default: '',
							},
						],
					},
				],
			},
			// Merge Fields
			{
				displayName: 'Merge Fields',
				name: 'mergeFields',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				displayOptions: {
					show: {
						resource: ['email'],
						operation: ['sendSmartEmail'],
					},
				},
				default: {},
				options: [
					{
						name: 'field',
						displayName: 'Field',
						values: [
							{
								displayName: 'Field Name or ID',
								name: 'fieldName',
								type: 'options',
								description:
									'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
								typeOptions: {
									loadOptionsMethod: 'getMergeFieldOptions',
									loadOptionsDependsOn: ['smartEmailId'],
								},
								default: '',
							},
							{
								displayName: 'Value',
								name: 'fieldValue',
								type: 'string',
								default: '',
							},
						],
					},
				],
			},
			// Flags (not implemented)
			{
				displayName: 'Allow Tracking',
				name: 'allowTracking',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['email'],
						operation: ['sendSmartEmail'],
					},
				},
				default: true,
			},
			{
				displayName: 'Ignore Suppression List',
				name: 'ignoreSuppressionList',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['email'],
						operation: ['sendSmartEmail'],
					},
				},
				default: true,
			},
			{
				displayName: 'Add Recipient To List',
				name: 'addRecipientToList',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['email'],
						operation: ['sendSmartEmail'],
					},
				},
				default: true,
			},
			// List creation fields
			{
				displayName: 'List Name',
				name: 'listName',
				type: 'string',
				required: true,
				displayOptions: {
					show: { resource: ['email'], operation: ['createList'] },
				},
				default: '',
			},
			{
				displayName: 'Custom Fields',
				name: 'customFields',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				displayOptions: {
					show: { resource: ['email'], operation: ['createList'] },
				},
				default: {},
				options: [
					{
						displayName: 'Field',
						name: 'field',
						values: [
							{
								displayName: 'Field Name',
								name: 'fieldName',
								type: 'string',
								required: true,
								default: '',
							},
							{
								displayName: 'Field Type',
								name: 'fieldType',
								type: 'options',
								required: true,
								default: 'text',
								options: [
									{
										name: 'Date',
										value: 'date',
									},
									{
										name: 'Number',
										value: 'number',
									},
									{
										name: 'Select Many',
										value: 'multiSelect',
									},
									{
										name: 'Select One',
										value: 'select',
									},
									{
										name: 'Text',
										value: 'text',
									},
								],
							},
							{
								displayName: 'Options',
								name: 'options',
								type: 'string',
								default: '',
								description: 'Comma-separated options (for Select One/Many)',
							},
							{
								displayName: 'Required',
								name: 'required',
								type: 'boolean',
								default: false,
							},
							{
								displayName: 'Unique Identifier',
								name: 'uniqueId',
								type: 'boolean',
								default: false,
							},
							{
								displayName: 'Visible',
								name: 'visible',
								type: 'boolean',
								default: true,
							},
						],
					},
				],
			},
			// Subscriber fields
			{
				displayName: 'List Name or ID',
				name: 'listId',
				type: 'options',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				typeOptions: {
					loadOptionsMethod: 'getListOptions',
					searchable: true,
					refreshOnChange: true,
				},
				default: '',
				required: true,
				displayOptions: {
					show: { resource: ['email'], operation: ['addOrUpdateSubscriber'] },
				},
			},
			{
				displayName: 'Action',
				name: 'subOperation',
				type: 'options',
				options: [
					{ name: 'Add', value: 'add' },
					{ name: 'Update', value: 'update' },
				],
				default: 'add',
				displayOptions: {
					show: { resource: ['email'], operation: ['addOrUpdateSubscriber'] },
				},
			},
			// Then fields for add vs. update:
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['email'],
						operation: ['addOrUpdateSubscriber'],
						subOperation: ['add'],
					},
				},
			},
			{
				displayName: 'Current Email Name or ID',
				name: 'currentEmail',
				type: 'options',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				typeOptions: {
					loadOptionsMethod: 'getSubscriberOptions',
					loadOptionsDependsOn: ['listId'],
					searchable: true,
				},
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['email'],
						operation: ['addOrUpdateSubscriber'],
						subOperation: ['update'],
					},
				},
			},
			{
				displayName: 'New Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				displayOptions: {
					show: {
						resource: ['email'],
						operation: ['addOrUpdateSubscriber'],
						subOperation: ['update'],
					},
				},
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['email'],
						operation: ['addOrUpdateSubscriber'],
					},
				},
			},
			{
				displayName: 'Re‑subscribe',
				name: 'reSubscribe',
				type: 'boolean',
				default: true,
				displayOptions: {
					show: {
						resource: ['email'],
						operation: ['addOrUpdateSubscriber'],
					},
				},
			},
			{
				displayName: 'Consent To Track',
				name: 'consentToTrack',
				type: 'boolean',
				default: true,
				displayOptions: {
					show: {
						resource: ['email'],
						operation: ['addOrUpdateSubscriber'],
					},
				},
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Active', value: 'Active' },
					{ name: 'Bounced', value: 'Bounced' },
					{ name: 'Deleted', value: 'Deleted' },
					{ name: 'Unconfirmed', value: 'Unconfirmed' },
					{ name: 'Unsubscribed', value: 'Unsubscribed' },
				],
				default: 'Active',
				displayOptions: {
					show: {
						resource: ['email'],
						operation: ['addOrUpdateSubscriber'],
					},
				},
			},
			{
				displayName: 'Custom Fields',
				name: 'customFields',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				displayOptions: {
					show: {
						resource: ['email'],
						operation: ['addOrUpdateSubscriber'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Field',
						name: 'field',
						values: [
							{
								displayName: 'Field Name or ID',
								name: 'fieldMeta',
								type: 'options',
								description:
									'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
								typeOptions: {
									loadOptionsMethod: 'getCustomFields',
									loadOptionsDependsOn: ['listId'],
								},
								default: '',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description:
									"Enter the value for the selected field (format must match the field's type)",
							},
						],
					},
				],
			},
			// Suppression fields
			{
				displayName: 'Emails to Suppress',
				name: 'suppressionEmails',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				default: { emails: [{ email: '' }] },
				required: true,
				description: 'Add one or more email addresses to suppress',
				displayOptions: {
					show: { resource: ['email'], operation: ['addToSuppressionList'] },
				},
				options: [
					{
						name: 'emails',
						displayName: 'Emails',
						values: [
							{
								displayName: 'Email',
								name: 'email',
								type: 'string',
								placeholder: 'name@email.com',
								default: '',
							},
						],
					},
				],
			},
			// WhatsApp Message Properties
			{
				displayName: 'Country Code',
				name: 'countryCode',
				type: 'string',
				placeholder: '+1',
				default: '',
				required: true,
				description: 'The country code for the phone number (e.g., +91 for India)',
				displayOptions: {
					show: {
						resource: ['whatsapp'],
						operation: ['sendWhatsAppMessage'],
					},
				},
			},
			{
				displayName: 'Phone Number',
				name: 'phoneNumber',
				type: 'string',
				placeholder: '9999999999',
				default: '',
				required: true,
				description: 'The phone number without country code',
				displayOptions: {
					show: {
						resource: ['whatsapp'],
						operation: ['sendWhatsAppMessage'],
					},
				},
			},
			{
				displayName: 'Message Type',
				name: 'messageType',
				type: 'options',
				options: [
					{ name: 'Text Message', value: 'text' },
					{ name: 'Template Message', value: 'template' },
				],
				default: 'template',
				displayOptions: {
					show: {
						resource: ['whatsapp'],
						operation: ['sendWhatsAppMessage'],
					},
				},
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				required: true,
				description: 'The message content to send',
				displayOptions: {
					show: {
						resource: ['whatsapp'],
						operation: ['sendWhatsAppMessage'],
						messageType: ['text'],
					},
				},
			},
			{
				displayName: 'Template Name or ID',
				name: 'templateName',
				type: 'options',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				typeOptions: {
					loadOptionsMethod: 'getWhatsAppTemplateOptions',
					searchable: true,
				},
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['whatsapp'],
						operation: ['sendWhatsAppMessage'],
						messageType: ['template'],
					},
				},
			},
			{
				displayName: 'Template Language Name or ID',
				name: 'templateLanguage',
				type: 'options',
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				typeOptions: {
					loadOptionsMethod: 'getTemplateLanguageOptions',
				},
				default: '',
				displayOptions: {
					show: {
						resource: ['whatsapp'],
						operation: ['sendWhatsAppMessage'],
						messageType: ['template'],
					},
				},
			},
			{
				displayName: 'Template Variables',
				name: 'variables',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				displayOptions: {
					show: {
						resource: ['whatsapp'],
						operation: ['sendWhatsAppMessage'],
						messageType: ['template'],
					},
				},
				default: {},
				options: [
					{
						name: 'variable',
						displayName: 'Variable',
						values: [
							{
								displayName: 'Variable Name or ID',
								name: 'name',
								type: 'options',
								typeOptions: {
									loadOptionsMethod: 'getTemplateVariableOptions',
									loadOptionsDependsOn: ['templateName'],
								},
								default: '',
								description: 'The variable name as defined in the template. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'The value to replace the variable with',
							},
						],
					},
				],
			},
			// SMS Message Properties
			{
				displayName: 'Messages',
				name: 'messages',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				displayOptions: {
					show: {
						resource: ['sms'],
						operation: ['sendBulkMessages'],
					},
				},
				default: {},
				options: [
					{
						name: 'message',
						displayName: 'Message',
						values: [
							{
								displayName: 'Phone Number',
								name: 'phoneNumber',
								type: 'string',
								placeholder: '+1234567890',
								default: '',
								required: true,
								description: 'The phone number to send the SMS to',
							},
							{
								displayName: 'Message',
								name: 'message',
								type: 'string',
								typeOptions: {
									rows: 4,
								},
								default: '',
								required: true,
								description: 'The SMS message content',
							},
							{
								displayName: 'Sender ID',
								name: 'senderId',
								type: 'string',
								default: '',
								description: 'Optional sender ID for the SMS',
							},
						],
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Mapping of category and operation to functions
		const operationFunctionMap: { [key: string]: { [key: string]: Function } } = {
			email: {
				sendSmartEmail: sendSmartEmail,
				createList: createList,
				addOrUpdateSubscriber: addOrUpdateSubscriber,
				addToSuppressionList: addToSuppressionList,
			},
			whatsapp: {
				sendWhatsAppMessage: sendWhatsAppMessage,
			},
			sms: {
				getBalance: getBalance,
				sendBulkMessages: sendBulkMessages,
				generateAuthToken: generateAuthToken,
			},
		};

		for (let i = 0; i < items.length; i++) {
			const resource = this.getNodeParameter('resource', i) as string;
			const operation = this.getNodeParameter('operation', i) as string;

			const func = operationFunctionMap[resource]?.[operation];
			if (func) {
				const response = await func.call(this, i);
				returnData.push({ json: response });
			} else {
				throw new NodeOperationError(
					this.getNode(),
					`Operation "${operation}" not implemented for resource "${resource}"`,
					{ itemIndex: i },
				);
			}
		}

		return [returnData];
	}

	methods = {
		loadOptions: {
			getSmartEmailOptions,
			getMergeFieldOptions,
			getListOptions,
			getCustomFields,
			getSubscriberOptions,
			getSuppressionListOptions,
			getSuppressionEmailsOptions,
			getWhatsAppTemplateOptions,
			getTemplateLanguageOptions,
			getTemplateVariableOptions,
		},
	};
}
