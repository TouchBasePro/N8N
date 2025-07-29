import { INodePropertyOptions, ILoadOptionsFunctions, IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { touchBaseRequest } from '../TouchBasePro.api';

// Load all lists for dropdown
export async function getSuppressionListOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
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
        value: list.listId,
      });
    }
    page++;
  } while (page <= totalPages);
  return options;
}

// Load all emails for a given list
export async function getSuppressionEmailsOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const listId = this.getCurrentNodeParameter('suppressionListId') as string;
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

// Add emails to suppression list
export async function addToSuppressionList(
  this: IExecuteFunctions,
  index: number,
): Promise<IDataObject> {
  // Get emails from fixedCollection
  const emailsCollection = this.getNodeParameter('suppressionEmails', index) as { emails: Array<{ email: string }> };
  const emails = (emailsCollection.emails || []).map(e => e.email.trim()).filter(Boolean);
  if (!emails || emails.length === 0) {
    throw new Error('Please provide at least one email to suppress.');
  }
  const body = { "Suppress": emails };
  return await touchBaseRequest.call(this, 'POST', '/email/client/suppressionlist', body);
}
