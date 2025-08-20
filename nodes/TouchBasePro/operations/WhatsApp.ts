import {
	IDataObject,
	INodePropertyOptions,
	LoggerProxy,
	NodeOperationError,
} from 'n8n-workflow';
import { IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';
import { interaktWhatsAppRequest } from '../TouchBasePro.api';

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
	const messageCategory = this.getNodeParameter('messageCategory', index) as string;
	
	// Get messageType only for simple messages, templateType for template messages
	let messageType: string | undefined;
	let templateType: string | undefined;
	
	if (messageCategory === 'simple') {
		messageType = this.getNodeParameter('messageType', index) as string;
	} else if (messageCategory === 'template') {
		templateType = this.getNodeParameter('templateType', index) as string;
	}
	
	const message = this.getNodeParameter('message', index, '') as string;
	const mediaUrl = this.getNodeParameter('mediaUrl', index, '') as string;
	const fileName = this.getNodeParameter('fileName', index, '') as string;
	const buttonMessage = this.getNodeParameter('buttonMessage', index, {}) as any;
	const listMessage = this.getNodeParameter('listMessage', index, {}) as any;
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

	// Handle different message categories and types
	if (messageCategory === 'simple') {
		// Simple message types
		switch (messageType) {
			case 'text':
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
				break;

			case 'audio':
				if (!message || !mediaUrl) {
					throw new NodeOperationError(this.getNode(), 'Message and Media URL are required for audio messages', {
						itemIndex: index,
					});
				}
				body.countryCode = countryCode;
				body.phoneNumber = phoneNumber;
				body.callbackData = 'n8n_whatsapp_message';
				body.type = 'Audio';
				body.data = {
					message: message,
					mediaUrl: mediaUrl,
					fileName: fileName || 'Audio',
				};
				break;

			case 'image':
				if (!message || !mediaUrl) {
					throw new NodeOperationError(this.getNode(), 'Message and Media URL are required for image messages', {
						itemIndex: index,
					});
				}
				body.countryCode = countryCode;
				body.phoneNumber = phoneNumber;
				body.callbackData = 'n8n_whatsapp_message';
				body.type = 'Image';
				body.data = {
					message: message,
					mediaUrl: mediaUrl,
				};
				break;

			case 'document':
				if (!message || !mediaUrl) {
					throw new NodeOperationError(this.getNode(), 'Message and Media URL are required for document messages', {
						itemIndex: index,
					});
				}
				body.countryCode = countryCode;
				body.phoneNumber = phoneNumber;
				body.callbackData = 'n8n_whatsapp_message';
				body.type = 'Document';
				body.data = {
					message: message,
					mediaUrl: mediaUrl,
				};
				break;

			case 'video':
				if (!message || !mediaUrl) {
					throw new NodeOperationError(this.getNode(), 'Message and Media URL are required for video messages', {
						itemIndex: index,
					});
				}
				body.countryCode = countryCode;
				body.phoneNumber = phoneNumber;
				body.callbackData = 'n8n_whatsapp_message';
				body.type = 'Video';
				body.data = {
					message: message,
					mediaUrl: mediaUrl,
					fileName: fileName || 'Video',
				};
				break;

			case 'button':
				if (!buttonMessage || !buttonMessage.buttonConfig) {
					throw new NodeOperationError(this.getNode(), 'Button configuration is required for button messages', {
						itemIndex: index,
					});
				}
				const buttonConfig = buttonMessage.buttonConfig;
				const buttons = unwrap<{ buttonId: string; buttonTitle: string }>(
					buttonConfig.buttons,
					'button',
				);
				
				if (buttons.length === 0) {
					throw new NodeOperationError(this.getNode(), 'At least one button is required for button messages', {
						itemIndex: index,
					});
				}

				body.countryCode = countryCode;
				body.phoneNumber = phoneNumber;
				body.callbackData = 'n8n_whatsapp_message';
				body.type = 'InteractiveButton';
				body.data = {
					message: {
						type: 'button',
						body: {
							text: buttonConfig.messageText || 'Please select an option',
						},
						action: {
							buttons: buttons.map((btn, index) => ({
								type: 'reply',
								reply: {
									id: btn.buttonId || `id${index + 1}`,
									title: btn.buttonTitle || `Button ${index + 1}`,
								},
							})),
						},
					},
				};
				break;

			case 'list':
				if (!listMessage || !listMessage.listConfig) {
					throw new NodeOperationError(this.getNode(), 'List configuration is required for list messages', {
						itemIndex: index,
					});
				}
				const listConfig = listMessage.listConfig;
				const sections = unwrap<{ sectionTitle: string; rows: any[] }>(
					listConfig.sections,
					'section',
				);
				
				if (sections.length === 0) {
					throw new NodeOperationError(this.getNode(), 'At least one section is required for list messages', {
						itemIndex: index,
					});
				}

				body.countryCode = countryCode;
				body.phoneNumber = phoneNumber;
				body.callbackData = 'n8n_whatsapp_message';
				body.type = 'InteractiveList';
				body.data = {
					message: {
						type: 'list',
						body: {
							text: listConfig.messageText || 'Please select an option',
						},
						action: {
							button: listConfig.buttonText || 'View Options',
							sections: sections.map(section => ({
								title: section.sectionTitle || 'Section',
								rows: unwrap<{ rowId: string; rowTitle: string; rowDescription: string }>(
									section.rows,
									'row',
								).map(row => ({
									id: row.rowId || 'unique_id',
									title: row.rowTitle || 'Row Title',
									description: row.rowDescription || 'Row Description',
								})),
							})),
						},
					},
				};
				break;

			default:
				throw new NodeOperationError(this.getNode(), `Unsupported message type: ${messageType}`, {
					itemIndex: index,
				});
		}
	} else if (messageCategory === 'template') {
		// Template message types
		if (!templateName) {
			throw new NodeOperationError(this.getNode(), 'Template name is required for template messages', {
				itemIndex: index,
			});
		}
		
		if (!templateType) {
			throw new NodeOperationError(this.getNode(), 'Template type is required for template messages', {
				itemIndex: index,
			});
		}
		
		// Base template structure
		body.countryCode = countryCode;
		body.phoneNumber = phoneNumber;
		body.callbackData = 'n8n_whatsapp_message';
		body.type = 'Template';
		
		// Create template object with proper typing
		const template: IDataObject = {
			name: templateName,
			languageCode: templateLanguage,
			bodyValues: variables.map(v => v.value),
		};
		
		// Handle different template types
		switch (templateType) {
			case 'basic':
				// Basic template - no additional fields needed
				break;
				
			case 'textHeader':
			case 'imageHeader':
				// Text and Image header templates
				const headerValues = unwrap<{ value: string }>(
					this.getNodeParameter('headerValues', index, {}),
					'headerValue',
				);
				if (headerValues.length > 0) {
					template.headerValues = headerValues.map(h => h.value);
				}
				break;
				
			case 'documentHeader':
				// Document header template
				const docHeaderValues = unwrap<{ value: string }>(
					this.getNodeParameter('headerValues', index, {}),
					'headerValue',
				);
				const templateFileName = this.getNodeParameter('templateFileName', index, '') as string;
				
				if (docHeaderValues.length > 0) {
					template.headerValues = docHeaderValues.map(h => h.value);
				}
				if (templateFileName) {
					template.fileName = templateFileName;
				}
				break;
				
			case 'authentication':
			case 'dynamicCTA':
				// Authentication and Dynamic CTA templates
				const buttonValues = unwrap<{ buttonIndex: string; values: any[] }>(
					this.getNodeParameter('buttonValues', index, {}),
					'buttonValue',
				);
				
				if (buttonValues.length > 0) {
					template.buttonValues = {};
					buttonValues.forEach(btn => {
						const values = unwrap<{ value: string }>(btn.values, 'value');
						(template.buttonValues as IDataObject)[btn.buttonIndex] = values.map(v => v.value);
					});
				}
				break;
				
			case 'orderCarousel':
				// Order Details Carousel template
				const carouselCards = unwrap<any>(
					this.getNodeParameter('carouselCards', index, {}),
					'card',
				);
				const orderDetails = unwrap<any>(
					this.getNodeParameter('orderDetails', index, {}),
					'order',
				);
				
				if (carouselCards.length > 0) {
					template.carouselCards = carouselCards.map(card => {
						const cardData: any = {};
						
						// Header values
						const cardHeaderValues = unwrap<{ value: string }>(card.cardHeaderValues, 'headerValue');
						if (cardHeaderValues.length > 0) {
							cardData.headerValues = cardHeaderValues.map(h => h.value);
						}
						
						// Body values
						const cardBodyValues = unwrap<{ value: string }>(card.cardBodyValues, 'bodyValue');
						if (cardBodyValues.length > 0) {
							cardData.bodyValues = cardBodyValues.map(h => h.value);
						}
						
						// Button values
						const cardButtonValues = unwrap<{ buttonIndex: string; values: any[] }>(card.cardButtonValues, 'buttonValue');
						if (cardButtonValues.length > 0) {
							cardData.buttonValues = {};
							cardButtonValues.forEach(btn => {
								const values = unwrap<{ value: string }>(btn.values, 'value');
								cardData.buttonValues[btn.buttonIndex] = values.map(v => v.value);
							});
						}
						
						return cardData;
					});
				}
				
				if (orderDetails.length > 0) {
					body.order_details = orderDetails.map(order => {
						const orderData: any = {
							reference_id: order.referenceId,
							order_items: unwrap<any>(order.orderItems, 'item').map(item => ({
								name: item.itemName,
								quantity: item.quantity,
								amount: item.amount,
								country_of_origin: item.countryOfOrigin,
							})),
						};
						
						// Shipping address
						if (order.shippingAddress && order.shippingAddress.address) {
							const addr = order.shippingAddress.address;
							orderData.shipping_addresses = [{
								name: addr.name,
								phone_number: addr.phoneNumber,
								address: addr.address,
								city: addr.city,
								state: addr.state,
								in_pin_code: addr.pinCode,
								house_number: addr.houseNumber || '',
								tower_number: addr.towerNumber || '',
								building_name: addr.buildingName || '',
								landmark_area: addr.landmarkArea || '',
								country: addr.country,
							}];
						}
						
						// Order summary
						if (order.orderSummary && order.orderSummary.summary) {
							const summary = order.orderSummary.summary;
							orderData.subtotal = summary.subtotal;
							orderData.discount = summary.discount || 0;
							orderData.tax = summary.tax || 0;
							orderData.shipping = summary.shipping || 0;
							orderData.total_amount = summary.totalAmount;
							orderData.currency = summary.currency || 'INR';
							
							if (summary.paymentExpiry && summary.paymentExpiry.expiry) {
								const expiry = summary.paymentExpiry.expiry;
								orderData.payment_option_expires_in = {
									value: expiry.value,
									unit: expiry.unit,
									expiration_message: expiry.expirationMessage || '',
								};
							}
						}
						
						return orderData;
					});
				}
				break;
				
			case 'orderStatus':
				// Order Status template
				const orderStatus = this.getNodeParameter('orderStatus', index, {}) as any;
				if (orderStatus.status) {
					template.order_status = {
						reference_id: orderStatus.status.referenceId,
						order: {
							status: orderStatus.status.status,
							description: orderStatus.status.description || '',
						},
					};
				}
				break;
				
			case 'orderSingleImage':
				// Order Details Single Image template
				const singleImageHeaderValues = unwrap<{ value: string }>(
					this.getNodeParameter('headerValues', index, {}),
					'headerValue',
				);
				const singleImageOrderDetails = unwrap<any>(
					this.getNodeParameter('orderDetails', index, {}),
					'order',
				);
				
				if (singleImageHeaderValues.length > 0) {
					template.headerValues = singleImageHeaderValues.map(h => h.value);
				}
				
				if (singleImageOrderDetails.length > 0) {
					body.order_details = singleImageOrderDetails.map(order => {
						const orderData: any = {
							reference_id: order.referenceId,
							order_items: unwrap<any>(order.orderItems, 'item').map(item => ({
								name: item.itemName,
								quantity: item.quantity,
								amount: item.amount,
								country_of_origin: item.countryOfOrigin,
							})),
						};
						
						// Shipping address
						if (order.shippingAddress && order.shippingAddress.address) {
							const addr = order.shippingAddress.address;
							orderData.shipping_addresses = [{
								name: addr.name,
								phone_number: addr.phoneNumber,
								address: addr.address,
								city: addr.city,
								state: addr.state,
								in_pin_code: addr.pinCode,
								house_number: addr.houseNumber || '',
								tower_number: addr.towerNumber || '',
								building_name: addr.buildingName || '',
								landmark_area: addr.landmarkArea || '',
								country: addr.country,
							}];
						}
						
						// Order summary
						if (order.orderSummary && order.orderSummary.summary) {
							const summary = order.orderSummary.summary;
							orderData.subtotal = summary.subtotal;
							orderData.discount = summary.discount || 0;
							orderData.shipping = summary.shipping || 0;
							orderData.tax = summary.tax || 0;
							orderData.total_amount = summary.totalAmount;
							orderData.currency = summary.currency || 'INR';
							
							if (summary.paymentExpiry && summary.paymentExpiry.expiry) {
								const expiry = summary.paymentExpiry.expiry;
								orderData.payment_option_expires_in = {
									value: expiry.value,
									unit: expiry.unit,
									expiration_message: expiry.expirationMessage || '',
								};
							}
						}
						
						return orderData;
					});
				}
				break;
				
			default:
				throw new NodeOperationError(this.getNode(), `Unsupported template type: ${templateType}`, {
					itemIndex: index,
				});
		}
		
		// Assign the template to the body
		body.template = template;
	} else {
		throw new NodeOperationError(this.getNode(), `Unsupported message category: ${messageCategory}`, {
			itemIndex: index,
		});
	}

	// 4) Call Interakt.ai API for all message types
	return await interaktWhatsAppRequest.call(
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