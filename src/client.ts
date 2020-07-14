import { IFetchOptions, IHttpClientImpl } from "@pnp/common";
import { IResponsePayload, IRequestPayload } from "./types";

export interface IProxyClientOptions {
  proxyPageUrl: string;
}

declare type ProxyCallback = (response: Response) => void;

export class ProxyClient implements IHttpClientImpl {
  private mounting: Promise<void>;
  private proxy: Window | null = null;
  private listeners: { [key: string]: ProxyCallback } = {};

  constructor(options: IProxyClientOptions) {
    this.mounting = new Promise<void>((resolve, reject) => {
      if (!document) reject("ProxyClient can only be in the browser");

      const frame = document.createElement("iframe");
      frame.src = options.proxyPageUrl;
      frame.style.display = "none";

      const onProxyReady = (event: MessageEvent) => {
        if (event.data === "SP_PROXY_READY") {
          window.removeEventListener("message", onProxyReady);
          this.proxy = frame.contentWindow;
          resolve();
        }
      };

      window.addEventListener("message", onProxyReady);
      window.addEventListener(
        "message",
        (event: MessageEvent) => {
          if (!event.data) return;

          const data: IResponsePayload = event.data;

          if (
            data.type !== "SP_PROXY_RESPONSE" ||
            !data.id ||
            !data.response ||
            !Object.prototype.hasOwnProperty.call(this.listeners, data.id)
          )
            return;

          const listener = this.listeners[data.id];
          delete this.listeners[data.id];

          // eslint-disable-next-line prefer-const
          let { body, init } = data.response;

          if (init?.status === 204) {
            init.status = 200;
          }

          listener(new Response(body, init));
        },
        false
      );

      document.body.appendChild(frame);
    });
  }

  async fetch(url: string, options: IFetchOptions): Promise<Response> {
    await this.mounting;
    return new Promise<Response>((resolve) => {
      const id = this.generateUniqeId();
      this.listeners[id] = resolve;

      const headers: { [key: string]: string } = {};
      if (options.headers && typeof options.headers.entries === "function") {
        // eslint-disable-next-line no-restricted-syntax
        for (const [key, value] of options.headers.entries()) {
          let val = value;
          if (val instanceof Array) {
            val = val.join(";");
          }
          headers[key] = val;
        }
      }

      const request: IRequestPayload = {
        id,
        type: "SP_PROXY_REQUEST",
        request: {
          url,
          options: {
            ...options,
            headers,
          },
        },
      };

      this.proxy?.postMessage(request, "*");
    });
  }

  generateUniqeId(): string {
    const id = Math.random().toString(36).substring(2);
    if (!this.listeners[id]) return id;
    return this.generateUniqeId();
  }
}
