import { IDataObject, IExecuteFunctions, IHttpRequestMethods, ILoadOptionsFunctions } from 'n8n-workflow';

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
			user: credentials.username as string,
			pass: credentials.password as string,
		},
		json: true,
		body,
		qs: query,
	});
}
