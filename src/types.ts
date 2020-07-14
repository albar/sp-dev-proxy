export interface IMessagePayload {
  id: string;
  type: string;
}

export interface IRequestPayload extends IMessagePayload {
  request: {
    url?: string;
    options?: RequestInit
  };
}

export interface IResponsePayload extends IMessagePayload {
  response: {
    init?: ResponseInit,
    body?: BodyInit
  };
}

export const ProxyReadyName = 'SP_PROXY_READY';
export const RequestTypeName = 'SP_PROXY_REQUEST';
export const ResponseTypeName = 'SP_PROXY_RESPONSE';
