import {
  IRequestPayload,
  IResponsePayload,
  RequestTypeName,
  ResponseTypeName,
  ProxyReadyName,
} from "./types";

import "regenerator-runtime/runtime";

const app = window.parent;

window.addEventListener(
  "message",
  async (event) => {
    if (!event.data) return;

    let data: IRequestPayload = event.data;

    if (
      data.type !== RequestTypeName ||
      !data.id ||
      !data.request ||
      !data.request.url
    ) {
      return;
    }

    const response = await fetch(data.request.url, data.request.options);
    const headers: { [key: string]: string } = {};
    for (const [key, value] of response.headers.entries()) {
      headers[key] = value;
    }

    const message: IResponsePayload = {
      id: data.id,
      type: ResponseTypeName,
      response: {
        init: {
          status: response.status,
          statusText: response.statusText,
          headers,
        },
      },
    };

    try {
      message.response.body = await response.text();
    } catch (e) {
    } finally {
      app.postMessage(message, "*");
    }
  },
  false
);

app.postMessage(ProxyReadyName, "*");
