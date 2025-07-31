import { IDataObject, IExecuteFunctions, IHttpRequestMethods, IHttpRequestOptions, ILoadOptionsFunctions } from 'n8n-workflow';

export async function touchBaseRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	query: IDataObject = {},
): Promise<any> {
	const credentials = await this.getCredentials('touchBaseProApi');
	return this.helpers.request({
		method,
		url: `https://api.touchbasepro.io${endpoint}`,
		auth: {
			user: credentials.emailApiKey as string,
			pass: 'test1234',
		},
		json: true,
		body,
		qs: query,
	});
}

export async function touchBaseWhatsAppRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	query: IDataObject = {},
): Promise<any> {
	const credentials = await this.getCredentials('touchBaseProApi');
	return this.helpers.request({
		method,
		url: `https://api.whatsappbiz.com/v1/public${endpoint}`,
		headers: {
			'Authorization': `Basic ${credentials.whatsappApiKey as string}`,
		},
		json: true,
		body,
		qs: query,
	});
}

export async function interaktWhatsAppRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	query: IDataObject = {},
): Promise<any> {
	const credentials = await this.getCredentials('touchBaseProApi');
	const requestOptions: IHttpRequestOptions = {
		method,
		url: `https://api.interakt.ai/v1/public${endpoint}`,
		headers: {
			'Authorization': `Basic ${credentials.whatsappApiKey as string}`,
			'Content-Type': 'application/json',
		},
		json: true,
		qs: query,
	};

	if (method !== 'GET' && method !== 'HEAD') {
		requestOptions.body = body;
	}
	
	return this.helpers.request(requestOptions);
}

export async function touchBaseSmsRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	query: IDataObject = {},
): Promise<any> {
	const credentials = await this.getCredentials('touchBaseProApi');
	return this.helpers.request({
		method,
		url: `https://rest.mymobileapi.com${endpoint}`,
		auth: {
			username: credentials.smsUsername as string,
			password: credentials.smsPassword as string,
		},
		json: true,
		body,
		qs: query,
	});
}
