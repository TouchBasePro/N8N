import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class TouchBaseProApi implements ICredentialType {
	name = 'touchBaseProApi';
	displayName = 'TouchBasePro API';
	icon = 'file:logo.svg' as const;
	properties: INodeProperties[] = [
		{
			displayName: 'Email API Key',
			name: 'emailApiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'API key for TouchBasePro Email operations',
		},
		{
			displayName: 'WhatsApp API Key',
			name: 'whatsappApiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'API key for TouchBasePro WhatsApp operations',
		},
	];
	documentationUrl = 'https://developer.touchbasepro.com/';
}