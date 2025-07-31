import {
	IDataObject,
	NodeOperationError,
} from 'n8n-workflow';
import { IExecuteFunctions } from 'n8n-workflow';
import { touchBaseSmsRequest } from '../TouchBasePro.api';

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
 * Executes the "Get Balance" operation.
 */
export async function getBalance(
	this: IExecuteFunctions,
	index: number,
): Promise<IDataObject> {
	// Call MyMobileAPI Balance endpoint
	return await touchBaseSmsRequest.call(
		this,
		'GET',
		'/v3/Balance',
	);
}

/**
 * Executes the "Send Bulk Messages" operation.
 */
export async function sendBulkMessages(
	this: IExecuteFunctions,
	index: number,
): Promise<IDataObject> {
	// 1) Parameters
	const messages = unwrap<{ 
		phoneNumber: string; 
		message: string; 
		senderId?: string;
	}>(this.getNodeParameter('messages', index, {}), 'message');

	if (!messages.length) {
		throw new NodeOperationError(this.getNode(), 'At least one message is required', {
			itemIndex: index,
		});
	}

	// 2) Build request body
	const body: IDataObject = {
		messages: messages.map(msg => ({
			destination: msg.phoneNumber,
			content: msg.message,
			customerId: msg.senderId,
		})),
	};

	// 3) Call MyMobileAPI BulkMessages endpoint
	return await touchBaseSmsRequest.call(
		this,
		'POST',
		'/v3/BulkMessages',
		body,
	);
}

/**
 * Executes the "Generate Authentication Token" operation.
 */
export async function generateAuthToken(
	this: IExecuteFunctions,
	index: number,
): Promise<IDataObject> {
	// Call MyMobileAPI Authentication endpoint
	return await touchBaseSmsRequest.call(
		this,
		'POST',
		'/Authentication',
	);
} 