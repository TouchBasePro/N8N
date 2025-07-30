import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class TouchBaseProWhatsAppApi implements ICredentialType {
	name = 'touchBaseProWhatsAppApi';
	displayName = 'TouchBasePro WhatsApp API';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			default: '',
		},
	];
	documentationUrl = 'https://whatsapp.touchbasepro.com/';
} 