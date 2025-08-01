import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class TouchBaseProApi implements ICredentialType {
	name = 'touchBaseProApi';
	displayName = 'TouchBasePro API';
	icon = 'file:envelop.svg' as const;
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
		{
			displayName: 'SMS Username',
			name: 'smsUsername',
			type: 'string',
			default: '',
			description: 'Username for SMS operations',
		},
		{
			displayName: 'SMS Password',
			name: 'smsPassword',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Password for SMS operations',
		},
	];
	documentationUrl = 'https://developer.touchbasepro.com/';
}