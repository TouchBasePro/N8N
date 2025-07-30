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
	sendWhatsAppMessage,
	getWhatsAppTemplateOptions,
	getTemplateLanguageOptions,
	getTemplateVariableOptions,
} from './operations/WhatsApp';

export class TouchBaseProWhatsApp implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'TouchBasePro WhatsApp',
		name: 'touchBaseProWhatsApp',
		icon: 'file:logo.svg',
		group: ['output'],
		version: 1,
		description: 'Interact with TouchBasePro WhatsApp API',
		subtitle: '={{$parameter["operation"] || "Select an Operation"}}',
		defaults: {
			name: 'TouchBasePro WhatsApp',
		},
		credentials: [
			{
				name: 'touchBaseProWhatsAppApi',
				required: true,
			},
		],
		inputs: ['main'] as (NodeConnectionType | INodeInputConfiguration)[],
		outputs: ['main'] as (NodeConnectionType | INodeOutputConfiguration)[],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				typeOptions: { searchable: true },
				options: [
					{
						name: 'Send Message',
						value: 'sendWhatsAppMessage',
						action: 'Send a whatsapp message',
					},
				],
				default: 'sendWhatsAppMessage',
			},
			// WhatsApp Message Properties
			{
				displayName: 'Phone Number',
				name: 'phoneNumber',
				type: 'string',
				placeholder: '+1234567890',
				default: '',
				required: true,
				description: 'The phone number to send the WhatsApp message to (with country code)',
				displayOptions: {
					show: {
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
								displayName: 'Variable Name',
								name: 'name',
								type: 'options',
								typeOptions: {
									loadOptionsMethod: 'getTemplateVariableOptions',
									loadOptionsDependsOn: ['templateName'],
								},
								default: '',
								description: 'The variable name as defined in the template',
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
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Mapping of operation to functions
		const operationFunctionMap: { [key: string]: Function } = {
			sendWhatsAppMessage: sendWhatsAppMessage,
		};

		for (let i = 0; i < items.length; i++) {
			const operation = this.getNodeParameter('operation', i) as string;

			const func = operationFunctionMap[operation];
			if (func) {
				const response = await func.call(this, i);
				returnData.push({ json: response });
			} else {
				throw new NodeOperationError(
					this.getNode(),
					`Operation "${operation}" not implemented`,
					{ itemIndex: i },
				);
			}
		}

		return [returnData];
	}

	methods = {
		loadOptions: {
			getWhatsAppTemplateOptions,
			getTemplateLanguageOptions,
			getTemplateVariableOptions,
		},
	};
} 