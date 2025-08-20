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
				value: `${field.name}::${field.type}`,
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

	const customFields = customFieldsInput
		.map(entry => {
		  const [name] = entry.fieldMeta.split('::');
		  // Convert comma-separated values to pipe-separated values for API compatibility
		  let processedValue = entry.value;
		  if (typeof processedValue === 'string' && processedValue.includes(',')) {
		    processedValue = processedValue.split(',').map(v => v.trim()).filter(Boolean).join('|');
		  }
		  return {
			name: name,
			value: processedValue, 
		  };
		})
		.filter(field => {
		  // Filter out fields with empty values based on their type
		  const value = field.value;
		  
		  // Handle undefined/null values
		  if (value === undefined || value === null) return false;
		  
		  // Handle string values
		  if (typeof value === 'string') {
		    return value.trim() !== '';
		  }
		  
		  // Handle number values (including 0, which is valid)
		  if (typeof value === 'number') {
		    return true; // All numbers are considered valid, including 0
		  }
		  
		  // Handle boolean values
		  if (typeof value === 'boolean') {
		    return true; // Both true and false are considered valid
		  }
		  
		  // Handle array values
		  if (Array.isArray(value)) {
		    return value.length > 0;
		  }
		  
		  // Handle object values (non-null objects are considered valid)
		  if (typeof value === 'object') {
		    return Object.keys(value).length > 0;
		  }
		  
		  // For any other type, consider it valid
		  return true;
		});

	// 3) Build request body per operation
	let body: IDataObject = {};
	let endpoint: string;
	let method: 'POST' | 'PUT';

	if (operation === 'add') {
		body = {
			email: this.getNodeParameter('email', index) as string,
			// name field removed as per client requirements
			reSubscribe: this.getNodeParameter('reSubscribe', index) as boolean,
			allowTracking: this.getNodeParameter('consentToTrack', index) as boolean, // keep param name for n8n, but send as allowTracking
			status: this.getNodeParameter('status', index) as string,
		};
		
		// Only include customFields if there are fields with values
		if (customFields.length > 0) {
			body.customFields = customFields;
		}
		
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
		
		// For updates, only include fields that have values (optional fields)
		// Note: name and email fields removed as per client requirements
		body = {
			reSubscribe: this.getNodeParameter('reSubscribe', index) as boolean,
			allowTracking: this.getNodeParameter('consentToTrack', index) as boolean,
		};
		
		// Only include customFields if there are fields with values
		if (customFields.length > 0) {
			body.customFields = customFields;
		}
		
		endpoint = `/email/lists/${listId}/subscribers/${encodeURIComponent(currentEmail)}`;
		method = 'PUT';
	}

	// 4) Execute API call
	return await touchBaseRequest.call(this, method, endpoint, body);
}
