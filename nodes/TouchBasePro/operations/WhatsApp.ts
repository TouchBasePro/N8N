import {
	IDataObject,
	INodePropertyOptions,
	LoggerProxy,
	NodeOperationError,
} from 'n8n-workflow';
import { IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';
import { touchBaseWhatsAppRequest, interaktWhatsAppRequest } from '../TouchBasePro.api';

/**
 * Helper to normalize fixedCollection output.
 */
function unwrap<T>(param: any, field: string): T[] {
	if (!param) return [];
	const v = param[field];
	if (Array.isArray(v)) return v as T[];
	if (typeof v === 'object') return [v as T];
	return [];
}

/**
 * Helper to create full phone number from country code and phone number
 */
function createFullPhoneNumber(countryCode: string, phoneNumber: string): string {
	// Clean the inputs
	const cleanCountryCode = countryCode.replace(/[^\d+]/g, '');
	const cleanPhoneNumber = phoneNumber.replace(/[^\d]/g, '');
	
	// Create full phone number (country code without + + phone number)
	return cleanCountryCode.replace(/^\+/, '') + cleanPhoneNumber;
}

/**
 * Executes the "Send WhatsApp Message" operation.
 */
export async function sendWhatsAppMessage(
	this: IExecuteFunctions,
	index: number,
): Promise<IDataObject> {
	// 1) Parameters
	const countryCode = this.getNodeParameter('countryCode', index) as string;
	const phoneNumber = this.getNodeParameter('phoneNumber', index) as string;
	const messageType = this.getNodeParameter('messageType', index) as string;
	const message = this.getNodeParameter('message', index, '') as string;
	const templateName = this.getNodeParameter('templateName', index, '') as string;
	const templateLanguage = this.getNodeParameter('templateLanguage', index, 'en') as string;
	
	// Optional parameters
	const variables = unwrap<{ name: string; value: string }>(
		this.getNodeParameter('variables', index, {}),
		'variable',
	);

	// 2) Create full phone number
	const fullPhoneNumber = createFullPhoneNumber(countryCode, phoneNumber);

	// 3) Build request body
	const body: IDataObject = {};

	// Handle different message types
	if (messageType === 'text') {
		if (!message) {
			throw new NodeOperationError(this.getNode(), 'Message is required for text messages', {
				itemIndex: index,
			});
		}
		body.fullPhoneNumber = fullPhoneNumber;
		body.type = 'Text';
		body.data = {
			message: message,
		};
	} else if (messageType === 'template') {
		if (!templateName) {
			throw new NodeOperationError(this.getNode(), 'Template name is required for template messages', {
				itemIndex: index,
			});
		}
		
		body.fullPhoneNumber = fullPhoneNumber;
		body.callbackData = 'n8n_whatsapp_message';
		body.type = 'Template';
		body.template = {
			name: templateName,
			languageCode: templateLanguage,
			bodyValues: variables.map(v => v.value),
		};
	}

	// 4) Call TouchBasePro API
	return await touchBaseWhatsAppRequest.call(
		this,
		'POST',
		'/message/',
		body,
	);
}

/**
 * For dynamic "WhatsApp Template" dropdown using Interakt.ai API.
 */
export async function getWhatsAppTemplateOptions(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const options: INodePropertyOptions[] = [];

	try {
		const res = await interaktWhatsAppRequest.call(
			this,
			'GET',
			'/track/organization/templates',
			{
				offset: 0,
				autosubmitted_for: 'all',
				approval_status: 'APPROVED',
				language: 'all',
			},
		);

		if (res && res.results && res.results.templates && Array.isArray(res.results.templates)) {
			for (const template of res.results.templates as any[]) {
				options.push({
					name: template.display_name || template.name || 'Unnamed Template',
					value: template.name || template.id || 'unknown',
				});
			}
		} else if (res && Array.isArray(res.data)) {
			for (const template of res.data as any[]) {
				options.push({
					name: template.display_name || template.name || 'Unnamed Template',
					value: template.name || template.id || 'unknown',
				});
			}
		} else if (res && Array.isArray(res)) {
			for (const template of res as any[]) {
				options.push({
					name: template.display_name || template.name || 'Unnamed Template',
					value: template.name || template.id || 'unknown',
				});
			}
		} else if (res && res.templates && Array.isArray(res.templates)) {
			for (const template of res.templates as any[]) {
				options.push({
					name: template.display_name || template.name || 'Unnamed Template',
					value: template.name || template.id || 'unknown',
				});
			}
		}
	} catch (error) {
		LoggerProxy.error(error);
	}

	return options;
}

/**
 * For dynamic "Template Variables" dropdown (depends on chosen template).
 */
export async function getTemplateVariableOptions(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const templateName = this.getCurrentNodeParameter('templateName') as string;
	if (!templateName) return [];

	try {
		const res = await interaktWhatsAppRequest.call(
			this,
			'GET',
			'/track/organization/templates',
			undefined,
			{
				offset: 0,
				autosubmitted_for: 'all',
				approval_status: 'APPROVED',
				language: 'all',
			},
		);

		if (res && res.results && res.results.templates && Array.isArray(res.results.templates)) {
			const selectedTemplate = res.results.templates.find((template: any) => 
				template.name === templateName || 
				template.id === templateName
			);

			if (selectedTemplate && selectedTemplate.variable_present === 'Yes') {
				const body = selectedTemplate.body || '';
				const variableMatches = body.match(/\{\{(\d+)\}\}/g);

				if (variableMatches) {
					return variableMatches.map((match: string, index: number) => {
						const varNumber = match.replace(/\{\{(\d+)\}\}/, '$1');
						return {
							name: `Variable ${varNumber}`,
							value: varNumber,
						};
					});
				}
			}
		} else if (res && Array.isArray(res.data)) {
			const selectedTemplate = res.data.find((template: any) => 
				template.name === templateName || 
				template.id === templateName
			);

			if (selectedTemplate && selectedTemplate.variables) {
				return selectedTemplate.variables.map((variable: any) => ({
					name: variable.name || variable.key || 'Unknown Variable',
					value: variable.name || variable.key || 'unknown',
				}));
			}
		}
	} catch (error) {
		LoggerProxy.error(error);
	}

	return [];
}

/**
 * For dynamic "Template Language" dropdown.
 */
export async function getTemplateLanguageOptions(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	return [
		{ name: 'English', value: 'en' },
		{ name: 'Spanish', value: 'es' },
		{ name: 'French', value: 'fr' },
		{ name: 'German', value: 'de' },
		{ name: 'Italian', value: 'it' },
		{ name: 'Portuguese', value: 'pt' },
		{ name: 'Hindi', value: 'hi' },
		{ name: 'Arabic', value: 'ar' },
		{ name: 'Chinese (Simplified)', value: 'zh' },
		{ name: 'Japanese', value: 'ja' },
		{ name: 'Korean', value: 'ko' },
	];
} 