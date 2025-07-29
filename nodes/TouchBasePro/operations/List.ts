import { INodePropertyOptions, ILoadOptionsFunctions, IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { touchBaseRequest } from '../TouchBasePro.api';

/**
 * Load all lists for the “List” dropdown
 */
export async function getListOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const options: INodePropertyOptions[] = [];
	let page = 1;
	const pageSize = 100;
	let totalPages = 1;

	do {
		const response = await touchBaseRequest.call(
			this,
			'GET',
			`/email/lists`,
			{},
			{ page, pageSize },
		);
		if (!Array.isArray(response.data)) break;
		totalPages = response.totalPages || 1;

		for (const list of response.data as any[]) {
			options.push({
				name: list.name,
				value: list.listId, // adjust field name if API returns `id` instead
			});
		}
		page++;
	} while (page <= totalPages);

	return options;
}

/**
 * Create a new list with welcome email and custom fields
 */
export async function createList(
  this: IExecuteFunctions,
  index: number,
): Promise<IDataObject> {
  const name = this.getNodeParameter('listName', index) as string;
  const customFieldsCollection = this.getNodeParameter('customFields', index) as { field?: any[] };
  const customFieldsInput = customFieldsCollection.field || [];

  // Map UI field types to API types
  const typeMap: Record<string, string> = {
    text: 'Text',
    number: 'Number',
    date: 'Date',
    select: 'MultiSelectOne',
    multiSelect: 'MultiSelectMany',
  };

  const fields = customFieldsInput.map((entry: any) => {
    const field: any = {
      "Name": entry.fieldName,
      "Type": typeMap[entry.fieldType],
      "IsRequired": entry.required,
      "IsVisible": entry.visible,
      "IsUniqueIdField": entry.uniqueId,
    };
    if (entry.fieldType === 'select' || entry.fieldType === 'multiSelect') {
      field.options = (entry.options || '').split(',').map((o: string) => o.trim()).filter(Boolean);
    }
    return field;
  });

  // Enforce unique identifier rules
  let uniqueIdCount = 0;
  let hasTextUniqueId = false;
  fields.forEach((field: any) => {
    if (field.IsUniqueIdField) {
      uniqueIdCount++;
      if (field.Type !== 'Text') {
        throw new Error('Only text fields can be unique identifiers.');
      }
      hasTextUniqueId = true;
    }
  });
  if (uniqueIdCount > 1) {
    throw new Error('Only one field can be a unique identifier.');
  }
  if (!hasTextUniqueId) {
    const emailFieldIndex = fields.findIndex(
      (f: any) => f.Name && typeof f.Name === 'string' && f.Name.trim().toLowerCase() === 'email'
    );
    if (emailFieldIndex !== -1) {
      fields[emailFieldIndex].IsUniqueIdField = true;
    }
  }

  const body: IDataObject = {
    name,
    CustomFields: fields,
  };

  return await touchBaseRequest.call(this, 'POST', '/email/lists', body);
}
