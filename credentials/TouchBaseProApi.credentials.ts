import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class TouchBaseProApi implements ICredentialType {
	name = 'touchBaseProApi';
	displayName = 'TouchBasePro API';
	properties: INodeProperties[] = [
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: { password: true },
			default: '',
		},
	];
	documentationUrl = 'https://developer.touchbasepro.com/';
}
