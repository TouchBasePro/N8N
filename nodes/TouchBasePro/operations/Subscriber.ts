import { IDataObject, INodePropertyOptions, NodeOperationError, IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';
import { touchBaseRequest } from '../TouchBasePro.api';

export async function getCustomFields(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const listId = this.getCurrentNodeParameter('listId') as string;
	if (!listId) return [];

	const options: INodePropertyOptions[] = [];
	let page = 1;
	const pageSize = 1000;
	let totalPages = 1;

	do {
		const response = await touchBaseRequest.call(
			this,
			'GET',
			`/email/lists/${listId}/fields`,
			{},
			{ page, pageSize },
		);
		const fields = response.data;
		if (!Array.isArray(fields)) break;
		totalPages = response.totalPages || 1;
		for (const field of fields) {
			options.push({
				name: `${field.name}`,
				value: `${field.code}::${field.type}`,
			});
		}
		page++;
	} while (page <= totalPages);

	return options;
}

export async function getSubscriberOptions(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const listId = this.getCurrentNodeParameter('listId') as string;
	if (!listId) return [];
	const options: INodePropertyOptions[] = [];
	let page = 1;
	const pageSize = 100;
	let totalPages = 1;

	do {
		const response = await touchBaseRequest.call(
			this,
			'GET',
			`/email/lists/${listId}/subscribers`,
			{},
			{ page, pageSize },
		);
		if (!Array.isArray(response.data)) break;
		totalPages = response.totalPages || 1;

		for (const sub of response.data as any[]) {
			options.push({
				name: `${sub.name || 'N/A'} <${sub.email}>`,
				value: sub.email,
			});
		}
		page++;
	} while (page <= totalPages);

	return options;
}

export async function addOrUpdateSubscriber(
	this: IExecuteFunctions,
	index: number,
): Promise<IDataObject> {
	// 1) Read common parameters
	const listId = this.getNodeParameter('listId', index) as string;
	const operation = this.getNodeParameter('subOperation', index) as 'add' | 'update';

	// 2) Gather custom fields
	const cfCollection = this.getNodeParameter('customFields', index) as { field?: any[] };

	const customFieldsInput = cfCollection.field || [];

	const customFields = customFieldsInput.map(entry => {
	  const [code] = entry.fieldMeta.split('::');
	  return {
		name: code,
		value: entry.value, 
	  };
	});

	// 3) Build request body per operation
	let body: IDataObject = {};
	let endpoint: string;
	let method: 'POST' | 'PUT';

	if (operation === 'add') {
		body = {
			email: this.getNodeParameter('email', index) as string,
			name: this.getNodeParameter('name', index) as string,
			reSubscribe: this.getNodeParameter('reSubscribe', index) as boolean,
			allowTracking: this.getNodeParameter('consentToTrack', index) as boolean, // keep param name for n8n, but send as allowTracking
			status: this.getNodeParameter('status', index) as string,
			customFields,
		};
		endpoint = `/email/lists/${listId}/subscribers`;
		method = 'POST';
	} else {
		const currentEmail = this.getNodeParameter('currentEmail', index) as string;
		if (!currentEmail) {
			throw new NodeOperationError(
				this.getNode(),
				'Current subscriber email is required for update',
				{ itemIndex: index },
			);
		}
		body = {
			email: this.getNodeParameter('email', index) as string,
			name: this.getNodeParameter('name', index) as string,
			reSubscribe: this.getNodeParameter('reSubscribe', index) as boolean,
			allowTracking: this.getNodeParameter('consentToTrack', index) as boolean,
			customFields,
		};
		endpoint = `/email/lists/${listId}/subscribers/${encodeURIComponent(currentEmail)}`;
		method = 'PUT';
	}

	// 4) Execute API call
	return await touchBaseRequest.call(this, method, endpoint, body);
}
