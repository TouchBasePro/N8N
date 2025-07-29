import {
	IDataObject,
	INodePropertyOptions,
	NodeOperationError,
} from 'n8n-workflow';
import { IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';
import { touchBaseRequest } from '../TouchBasePro.api';

/**
 * Helper to normalize fixedCollection output.
 */
function unwrap<T>(param: any, field: string): T[] {
	if (!param) return [];
	const v = param[field];
	if (Array.isArray(v)) return v as T[];
	if (typeof v === 'object') return [v as T];
	return [];
}

/**
 * Executes the “Send Smart Email” operation.
 */
export async function sendSmartEmail(
	this: IExecuteFunctions,
	index: number,
): Promise<IDataObject> {
	// 1) Parameters
	const smartEmailId = this.getNodeParameter('smartEmailId', index) as string;
	const to = unwrap<{ name: string; email: string }>(
		this.getNodeParameter('to', index, {}),
		'recipients',
	);
	if (!to.length) {
		throw new NodeOperationError(this.getNode(), 'At least one "To" required', {
			itemIndex: index,
		});
	}
	const cc = unwrap<{ name: string; email: string }>(
		this.getNodeParameter('cc', index, {}),
		'recipients',
	);
	const bcc = unwrap<{ name: string; email: string }>(
		this.getNodeParameter('bcc', index, {}),
		'recipients',
	);

	const rawAttachments = unwrap<{
		name: string;
		type: string;
		binaryPropertyName: string;
	}>(this.getNodeParameter('attachments', index, {}), 'attachments');

	const attachments = [];
	for (const att of rawAttachments) {
		if (att.binaryPropertyName) {
			const buffer = await this.helpers.getBinaryDataBuffer(index, att.binaryPropertyName);

			attachments.push({
				name: att.name,
				type: att.type,
				data: buffer.toString('base64'),
			});
		}
	}
	const mergeFields = unwrap<{ fieldName: string; fieldValue: string }>(
		this.getNodeParameter('mergeFields', index, {}),
		'field',
	);
	const allowTracking = this.getNodeParameter('allowTracking', index, false);
	const ignoreSuppressionList = this.getNodeParameter(
		'ignoreSuppressionList',
		index,
		false,
	);
	const addRecipientToList = this.getNodeParameter(
		'addRecipientToList',
		index,
		false,
	);

	// 2) Build request body
	const body: IDataObject = { to };
	if (cc.length) body.cc = cc;
	if (bcc.length) body.bcc = bcc;
	if (attachments.length) body.attachments = attachments;
	if (mergeFields.length) {
		// convert array → object
		body.fields = mergeFields.reduce((obj, mf) => {
			obj[mf.fieldName] = mf.fieldValue;
			return obj;
		}, {} as IDataObject);
	}
	if (allowTracking) body.allowTracking = true;
	if (ignoreSuppressionList) body.ignoreSuppressionList = true;
	if (addRecipientToList) body.addRecipientToList = true;

	// 3) Call TouchBasePro API
	return await touchBaseRequest.call(
		this,
		'POST',
		`/email/transactional/smartemails/${smartEmailId}/messages`,
		body,
	);
}

/**
 * For dynamic “Template” dropdown.
 */
export async function getSmartEmailOptions(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const options: INodePropertyOptions[] = [];
	let page = 1;
	const pageSize = 100;
	let totalPages = 1;

	do {
		const res = await this.helpers.request({
			method: 'GET',
			url: `https://api.touchbasepro.io/email/transactional/smartemails`,
			qs: { page, pageSize },
			json: true,
			auth: await this.getCredentials('touchBaseProApi'),
		});

		if (!Array.isArray(res.data)) break;
		totalPages = res.totalPages || 1;
		for (const e of res.data as any[]) {
			options.push({
				name: e.name,
				value: e.smartEmailId,
			});
		}
		page++;
	} while (page <= totalPages);

	return options;
}

/**
 * For dynamic “Merge Field” dropdown (depends on chosen template).
 */
export async function getMergeFieldOptions(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const emailId = this.getCurrentNodeParameter('smartEmailId') as string;
	if (!emailId) return [];

	const res = await this.helpers.request({
		method: 'GET',
		url: `https://api.touchbasepro.io/email/transactional/smartemails/${emailId}`,
		json: true,
		auth: await this.getCredentials('touchBaseProApi'),
	});

	const content = res.htmlContent as string;
	const ignoreSet = new Set(['if', 'endif', '!mso', 'mso', 'ie']);
	const regex = /\[([^\]]+?)\]/g;
	const fields = new Set<string>();
	let match: RegExpExecArray | null;

	while ((match = regex.exec(content))) {
		const raw = match[1].trim();
		if (raw.includes('=') || raw.includes('-')) continue;
		const token = raw.split(/\s+/)[0];
		const key = token.replace(/[^A-Za-z0-9_]/g, '');
		if (
			/^[A-Za-z][A-Za-z0-9_]*$/.test(key) &&
			!ignoreSet.has(key.toLowerCase())
		) {
			fields.add(key);
		}
	}

	return Array.from(fields).map((f) => ({
		name: f,
		value: f,
	}));
}
