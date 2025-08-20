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
		icon: 'file:envelop.svg',
		group: ['output'],
		version: 1,
		description: 'Interact with TouchBasePro API for Email, WhatsApp, and SMS operations',
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
						action: 'Add emails to suppression list',
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
				displayName: 'Current Email',
				name: 'currentEmail',
				type: 'string',
				description:
					'Enter the email address of the subscriber you want to update',
				placeholder: 'subscriber@example.com',
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
			// New Email field removed from update operation as per client requirements
			// {
			// 	displayName: 'New Email (Optional)',
			// 	name: 'email',
			// 	type: 'string',
			// 	placeholder: 'name@email.com',
			// 	default: '',
			// 	description: 'Leave empty to keep the current email address unchanged',
			// 	displayOptions: {
			// 		show: {
			// 			resource: ['email'],
			// 			operation: ['addOrUpdateSubscriber'],
			// 			subOperation: ['update'],
			// 		},
			// 	},
			// },
			// Name field removed as per client requirements
			// {
			// 	displayName: 'Name',
			// 	name: 'name',
			// 	type: 'string',
			// 	default: '',
			// 	required: true,
			// 	description: 'Required for new subscribers',
			// 	displayOptions: {
			// 		show: {
			// 			resource: ['email'],
			// 			operation: ['addOrUpdateSubscriber'],
			// 			subOperation: ['add'],
			// 		},
			// 	},
			// },
			// {
			// 	displayName: 'Name (Optional)',
			// 	name: 'name',
			// 	type: 'string',
			// 	default: '',
			// 	description: 'Leave empty to keep the current name unchanged',
			// 	displayOptions: {
			// 		show: {
			// 			resource: ['email'],
			// 			operation: ['addOrUpdateSubscriber'],
			// 			subOperation: ['update'],
			// 		},
			// 	},
			// },
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
				displayName: 'Message Category',
				name: 'messageCategory',
				type: 'options',
				options: [
					{ name: 'Simple Messages', value: 'simple' },
					{ name: 'Template Messages', value: 'template' },
				],
				default: 'simple',
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
					{ name: 'Audio Message', value: 'audio' },
					{ name: 'Button Message', value: 'button' },
					{ name: 'Document Message', value: 'document' },
					{ name: 'Image Message', value: 'image' },
					{ name: 'List Message', value: 'list' },
					{ name: 'Text Message', value: 'text' },
					{ name: 'Video Message', value: 'video' },
				],
				default: 'text',
				displayOptions: {
					show: {
						resource: ['whatsapp'],
						operation: ['sendWhatsAppMessage'],
						messageCategory: ['simple'],
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
						messageCategory: ['simple'],
						messageType: ['text', 'audio', 'image', 'document', 'video'],
					},
				},
			},
			// Media fields for audio, image, document, and video messages
			{
				displayName: 'Media URL',
				name: 'mediaUrl',
				type: 'string',
				default: '',
				required: true,
				description: 'URL of the media file to send',
				displayOptions: {
					show: {
						resource: ['whatsapp'],
						operation: ['sendWhatsAppMessage'],
						messageCategory: ['simple'],
						messageType: ['audio', 'image', 'document', 'video'],
					},
				},
			},
			{
				displayName: 'File Name',
				name: 'fileName',
				type: 'string',
				default: '',
				description: 'Name of the file (required for audio and video)',
				displayOptions: {
					show: {
						resource: ['whatsapp'],
						operation: ['sendWhatsAppMessage'],
						messageCategory: ['simple'],
						messageType: ['audio', 'video'],
					},
				},
			},
			// Button message fields
			{
				displayName: 'Button Message',
				name: 'buttonMessage',
				type: 'fixedCollection',
				typeOptions: { multipleValues: false },
				default: {},
				displayOptions: {
					show: {
						resource: ['whatsapp'],
						operation: ['sendWhatsAppMessage'],
						messageCategory: ['simple'],
						messageType: ['button'],
					},
				},
				options: [
					{
						name: 'buttonConfig',
						displayName: 'Button Configuration',
						values: [
							{
								displayName: 'Message Text',
								name: 'messageText',
								type: 'string',
								default: 'Hello, please give your feedback.',
								description: 'The main message text to display above the buttons',
							},
							{
								displayName: 'Buttons',
								name: 'buttons',
								type: 'fixedCollection',
								typeOptions: { multipleValues: true },
								default: {},
								options: [
									{
										name: 'button',
										displayName: 'Button',
										values: [
											{
												displayName: 'Button ID',
												name: 'buttonId',
												type: 'string',
												default: '',
												description: 'Unique identifier for the button',
											},
											{
												displayName: 'Button Title',
												name: 'buttonTitle',
												type: 'string',
												default: '',
												description: 'Text to display on the button',
											},
										],
									},
								],
							},
						],
					},
				],
			},
			// List message fields
			{
				displayName: 'List Message',
				name: 'listMessage',
				type: 'fixedCollection',
				typeOptions: { multipleValues: false },
				default: {},
				displayOptions: {
					show: {
						resource: ['whatsapp'],
						operation: ['sendWhatsAppMessage'],
						messageCategory: ['simple'],
						messageType: ['list'],
					},
				},
				options: [
					{
						name: 'listConfig',
						displayName: 'List Configuration',
						values: [
							{
								displayName: 'Message Text',
								name: 'messageText',
								type: 'string',
								default: 'Check out our top product collections below!',
								description: 'The main message text to display above the list',
							},
							{
								displayName: 'Button Text',
								name: 'buttonText',
								type: 'string',
								default: 'View Collections',
								description: 'Text to display on the main button',
							},
							{
								displayName: 'Sections',
								name: 'sections',
								type: 'fixedCollection',
								typeOptions: { multipleValues: true },
								default: {},
								options: [
									{
										name: 'section',
										displayName: 'Section',
										values: [
											{
												displayName: 'Section Title',
												name: 'sectionTitle',
												type: 'string',
												default: '',
												description: 'Title of the section',
											},
											{
												displayName: 'Rows',
												name: 'rows',
												type: 'fixedCollection',
												typeOptions: { multipleValues: true },
												default: {},
												options: [
													{
														name: 'row',
														displayName: 'Row',
														values: [
															{
																displayName: 'Row ID',
																name: 'rowId',
																type: 'string',
																default: '',
																description: 'Unique identifier for the row',
															},
															{
																displayName: 'Row Title',
																name: 'rowTitle',
																type: 'string',
																default: '',
																description: 'Title of the row',
															},
															{
																displayName: 'Row Description',
																name: 'rowDescription',
																type: 'string',
																default: '',
																description: 'Description of the row',
															},
														],
													},
												],
											},
										],
									},
								],
							},
						],
					},
				],
			},
			{
				displayName: 'Template Type',
				name: 'templateType',
				type: 'options',
				options: [
					{ name: 'Authentication Template', value: 'authentication' },
					{ name: 'Basic Template (No Header)', value: 'basic' },
					{ name: 'Document Header Template', value: 'documentHeader' },
					{ name: 'Dynamic CTA Template', value: 'dynamicCTA' },
					{ name: 'Image Header Template', value: 'imageHeader' },
					{ name: 'Order Details Carousel', value: 'orderCarousel' },
					{ name: 'Order Details Single Image', value: 'orderSingleImage' },
					{ name: 'Order Status Template', value: 'orderStatus' },
					{ name: 'Text Header Template', value: 'textHeader' },
				],
				default: 'basic',
				displayOptions: {
					show: {
						resource: ['whatsapp'],
						operation: ['sendWhatsAppMessage'],
						messageCategory: ['template'],
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
						messageCategory: ['template'],
					},
				},
			},
			// Header values for templates that support headers
			{
				displayName: 'Header Values',
				name: 'headerValues',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				default: {},
				displayOptions: {
					show: {
						resource: ['whatsapp'],
						operation: ['sendWhatsAppMessage'],
						messageCategory: ['template'],
						templateType: ['textHeader', 'documentHeader', 'imageHeader', 'orderSingleImage'],
					},
				},
				options: [
					{
						name: 'headerValue',
						displayName: 'Header Value',
						values: [
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Header variable value (text, media URL, etc.)',
							},
						],
					},
				],
			},
			// File name for document header templates
			{
				displayName: 'File Name',
				name: 'templateFileName',
				type: 'string',
				default: '',
				description: 'File name for document header templates',
				displayOptions: {
					show: {
						resource: ['whatsapp'],
						operation: ['sendWhatsAppMessage'],
						messageCategory: ['template'],
						templateType: ['documentHeader'],
					},
				},
			},
			// Button values for authentication and dynamic CTA templates
			{
				displayName: 'Button Values',
				name: 'buttonValues',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				default: {},
				displayOptions: {
					show: {
						resource: ['whatsapp'],
						operation: ['sendWhatsAppMessage'],
						messageCategory: ['template'],
						templateType: ['authentication', 'dynamicCTA'],
					},
				},
				options: [
					{
						name: 'buttonValue',
						displayName: 'Button Value',
						values: [
							{
								displayName: 'Button Index',
								name: 'buttonIndex',
								type: 'string',
								default: '0',
								description: 'Button index (0, 1, 2, etc.)',
							},
							{
								displayName: 'Button Values',
								name: 'values',
								type: 'fixedCollection',
								typeOptions: { multipleValues: true },
								default: {},
								options: [
									{
										name: 'value',
										displayName: 'Value',
										values: [
											{
												displayName: 'Value',
												name: 'value',
												type: 'string',
												default: '',
												description: 'Button variable value',
											},
										],
									},
								],
							},
						],
					},
				],
			},
			// Carousel cards for order carousel templates
			{
				displayName: 'Carousel Cards',
				name: 'carouselCards',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				default: {},
				displayOptions: {
					show: {
						resource: ['whatsapp'],
						operation: ['sendWhatsAppMessage'],
						messageCategory: ['template'],
						templateType: ['orderCarousel'],
					},
				},
				options: [
					{
						name: 'card',
						displayName: 'Carousel Card',
						values: [
							{
								displayName: 'Header Values',
								name: 'cardHeaderValues',
								type: 'fixedCollection',
								typeOptions: { multipleValues: true },
								default: {},
								options: [
									{
										name: 'headerValue',
										displayName: 'Header Value',
										values: [
											{
												displayName: 'Value',
												name: 'value',
												type: 'string',
												default: '',
												description: 'Card header value (usually media URL)',
											},
										],
									},
								],
							},
							{
								displayName: 'Body Values',
								name: 'cardBodyValues',
								type: 'fixedCollection',
								typeOptions: { multipleValues: true },
								default: {},
								options: [
									{
										name: 'bodyValue',
										displayName: 'Body Value',
										values: [
											{
												displayName: 'Value',
												name: 'value',
												type: 'string',
												default: '',
												description: 'Card body value',
											},
										],
									},
								],
							},
							{
								displayName: 'Button Values',
								name: 'cardButtonValues',
								type: 'fixedCollection',
								typeOptions: { multipleValues: true },
								default: {},
								options: [
									{
										name: 'buttonValue',
										displayName: 'Button Value',
										values: [
											{
												displayName: 'Button Index',
												name: 'buttonIndex',
												type: 'string',
												default: '0',
											},
											{
												displayName: 'Button Values',
												name: 'values',
												type: 'fixedCollection',
												typeOptions: { multipleValues: true },
												default: {},
												options: [
													{
														name: 'value',
														displayName: 'Value',
														values: [
															{
																displayName: 'Value',
																name: 'value',
																type: 'string',
																default: '',
																description: 'Button variable value',
															},
														],
													},
												],
											},
										],
									},
								],
							},
						],
					},
				],
			},
			// Order details for order-related templates
			{
				displayName: 'Order Details',
				name: 'orderDetails',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				default: {},
				displayOptions: {
					show: {
						resource: ['whatsapp'],
						operation: ['sendWhatsAppMessage'],
						messageCategory: ['template'],
						templateType: ['orderCarousel', 'orderSingleImage'],
					},
				},
				options: [
					{
						name: 'order',
						displayName: 'Order',
						values: [
							{
								displayName: 'Reference ID',
								name: 'referenceId',
								type: 'string',
								default: '',
								required: true,
								description: 'Unique reference ID for the order',
							},
							{
								displayName: 'Order Items',
								name: 'orderItems',
								type: 'fixedCollection',
								typeOptions: { multipleValues: true },
								default: {},
								options: [
									{
										name: 'item',
										displayName: 'Order Item',
										values: [
											{
												displayName: 'Item Name',
												name: 'itemName',
												type: 'string',
												default: '',
												required: true,
											},
											{
												displayName: 'Quantity',
												name: 'quantity',
												type: 'number',
												default: 1,
												required: true,
											},
											{
												displayName: 'Amount',
												name: 'amount',
												type: 'number',
												default: 0,
												required: true,
											},
											{
												displayName: 'Country of Origin',
												name: 'countryOfOrigin',
												type: 'string',
												default: '',
												required: true,
											},
										],
									},
								],
							},
							{
								displayName: 'Shipping Address',
								name: 'shippingAddress',
								type: 'fixedCollection',
								typeOptions: { multipleValues: false },
								default: {},
								options: [
									{
										name: 'address',
										displayName: 'Address',
										values: [
											{
												displayName: 'Name',
												name: 'name',
												type: 'string',
												default: '',
												required: true,
											},
											{
												displayName: 'Phone Number',
												name: 'phoneNumber',
												type: 'string',
												default: '',
												required: true,
											},
											{
												displayName: 'Address',
												name: 'address',
												type: 'string',
												default: '',
												required: true,
											},
											{
												displayName: 'City',
												name: 'city',
												type: 'string',
												default: '',
												required: true,
											},
											{
												displayName: 'State',
												name: 'state',
												type: 'string',
												default: '',
												required: true,
											},
											{
												displayName: 'PIN Code',
												name: 'pinCode',
												type: 'string',
												default: '',
												required: true,
											},
											{
												displayName: 'House Number',
												name: 'houseNumber',
												type: 'string',
												default: '',
											},
											{
												displayName: 'Tower Number',
												name: 'towerNumber',
												type: 'string',
												default: '',
											},
											{
												displayName: 'Building Name',
												name: 'buildingName',
												type: 'string',
												default: '',
											},
											{
												displayName: 'Landmark/Area',
												name: 'landmarkArea',
												type: 'string',
												default: '',
											},
											{
												displayName: 'Country',
												name: 'country',
												type: 'string',
												default: 'IN',
											},
										],
									},
								],
							},
							{
								displayName: 'Order Summary',
								name: 'orderSummary',
								type: 'fixedCollection',
								typeOptions: { multipleValues: false },
								default: {},
								options: [
									{
										name: 'summary',
										displayName: 'Summary',
										values: [
											{
												displayName: 'Currency',
												name: 'currency',
												type: 'string',
												default: 'INR',
											},
											{
												displayName: 'Discount',
												name: 'discount',
												type: 'number',
												default: 0,
											},
											{
												displayName: 'Payment Expiry',
												name: 'paymentExpiry',
												type: 'fixedCollection',
												typeOptions: { multipleValues: false },
												default: {},
												options: [
													{
														name: 'expiry',
														displayName: 'Expiry',
														values: [
															{
																displayName: 'Value',
																name: 'value',
																type: 'number',
																default: 15,
																required: true,
															},
															{
																displayName: 'Unit',
																name: 'unit',
																type: 'options',
																options: [
																	{ name: 'Minutes', value: 'minutes' },
																	{ name: 'Hours', value: 'hours' },
																	{ name: 'Days', value: 'days' },
																],
																default: 'minutes',
																required: true,
															},
															{
																displayName: 'Expiration Message',
																name: 'expirationMessage',
																type: 'string',
																default: '',
															},
														],
													},
												],
											},
											{
												displayName: 'Shipping',
												name: 'shipping',
												type: 'number',
												default: 0,
											},
											{
												displayName: 'Subtotal',
												name: 'subtotal',
												type: 'number',
												default: 0,
												required: true,
											},
											{
												displayName: 'Tax',
												name: 'tax',
												type: 'number',
												default: 0,
											},
											{
												displayName: 'Total Amount',
												name: 'totalAmount',
												type: 'number',
												default: 0,
												required: true,
											},
										],
									},
								],
							},
						],
					},
				],
			},
			// Order status for order status templates
			{
				displayName: 'Order Status',
				name: 'orderStatus',
				type: 'fixedCollection',
				typeOptions: { multipleValues: false },
				default: {},
				displayOptions: {
					show: {
						resource: ['whatsapp'],
						operation: ['sendWhatsAppMessage'],
						messageCategory: ['template'],
						templateType: ['orderStatus'],
					},
				},
				options: [
					{
						name: 'status',
						displayName: 'Status',
						values: [
							{
								displayName: 'Reference ID',
								name: 'referenceId',
								type: 'string',
								default: '',
								required: true,
								description: 'Reference ID for the order',
							},
							{
								displayName: 'Order Status',
								name: 'status',
								type: 'options',
								options: [
									{ name: 'Cancelled', value: 'canceled' },
									{ name: 'Confirmed', value: 'confirmed' },
									{ name: 'Delivered', value: 'delivered' },
									{ name: 'Failed', value: 'failed' },
									{ name: 'Processing', value: 'processing' },
									{ name: 'Shipped', value: 'shipped' },
								],
								default: 'confirmed',
								required: true,
							},
							{
								displayName: 'Status Description',
								name: 'description',
								type: 'string',
								default: '',
							},
						],
					},
				],
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
						messageCategory: ['template'],
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
						messageCategory: ['template'],
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
				getSuppressionListOptions,
				getSuppressionEmailsOptions,
				getWhatsAppTemplateOptions,
				getTemplateLanguageOptions,
				getTemplateVariableOptions,
			},
		};
}
