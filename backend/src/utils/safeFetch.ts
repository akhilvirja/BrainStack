import dns from "dns/promises";
import net from "net";

// Helper to determine if an IP address is within private, loopback, or cloud-metadata ranges
export const isPrivateIp = (ip: string): boolean => {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    const [b0, b1] = parts;

    // Loopback 127.0.0.0/8
    if (b0 === 127) return true;
    // Current network 0.0.0.0/8
    if (b0 === 0) return true;
    // Private Network 10.0.0.0/8
    if (b0 === 10) return true;
    // Private Network 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
    if (b0 === 172 && b1 !== undefined && b1 >= 16 && b1 <= 31) return true;
    // Private Network 192.168.0.0/16
    if (b0 === 192 && b1 === 168) return true;
    // Link-local & Cloud Metadata (AWS/GCP/Azure 169.254.169.254)
    if (b0 === 169 && b1 === 254) return true;
    // Broadcast 255.255.255.255
    if (ip === "255.255.255.255") return true;

    return false;
  }

  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    // IPv6 Loopback ::1
    if (normalized === "::1" || normalized === "0000:0000:0000:0000:0000:0000:0000:0001") return true;
    // IPv6 Unique Local Address fc00::/7 (fc00... or fd00...)
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
    // IPv6 Link-local fe80::/10
    if (normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) return true;

    return false;
  }

  return true; // Unknown IP format treated as unsafe
};

export interface SafeFetchOptions {
  timeoutMs?: number;
  maxSizeBytes?: number;
  headers?: Record<string, string>;
}

export interface SafeFetchResponse {
  status: number;
  statusText: string;
  contentType: string;
  text: string;
  json: <T = any>() => T;
}

const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const safeFetch = async (
  rawUrl: string,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResponse> => {
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const maxSizeBytes = options.maxSizeBytes || DEFAULT_MAX_SIZE_BYTES;

  // 1. URL syntax and protocol verification
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
  } catch {
    throw new Error(`Invalid URL: ${rawUrl}`);
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error(`Forbidden protocol: ${parsedUrl.protocol}. Only http: and https: are supported.`);
  }

  const hostname = parsedUrl.hostname;
  if (!hostname || hostname.toLowerCase() === "localhost") {
    throw new Error("Access to localhost is forbidden.");
  }

  // 2. DNS Resolution & SSRF Protection
  try {
    const lookups = await dns.lookup(hostname, { all: true });
    for (const record of lookups) {
      if (isPrivateIp(record.address)) {
        throw new Error(
          `SSRF Protection: Access to private or local network IP (${record.address}) is forbidden.`
        );
      }
    }
  } catch (err: any) {
    if (err.message?.includes("SSRF Protection")) {
      throw err;
    }
    // DNS resolution failure (domain doesn't exist or unreachable)
    throw new Error(`Unable to resolve host ${hostname}: ${err.message}`);
  }

  // 3. Execute fetch with timeout and size caps
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 BrainStack/1.0",
        Accept: "text/html,application/xhtml+xml,application/json,text/plain;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Remote server responded with HTTP status ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "";

    // 4. Stream response and enforce max byte size
    const body = response.body;
    if (!body) {
      return {
        status: response.status,
        statusText: response.statusText,
        contentType,
        text: "",
        json: <T = any>(): T => ({} as T),
      };
    }

    const reader = body.getReader();
    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value) {
        receivedBytes += value.length;
        if (receivedBytes > maxSizeBytes) {
          controller.abort();
          throw new Error(`Response exceeds maximum permitted size of ${maxSizeBytes / 1024 / 1024} MB.`);
        }
        chunks.push(value);
      }
    }

    const totalBuffer = new Uint8Array(receivedBytes);
    let offset = 0;
    for (const chunk of chunks) {
      totalBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    const textContent = new TextDecoder("utf-8").decode(totalBuffer);

    return {
      status: response.status,
      statusText: response.statusText,
      contentType,
      text: textContent,
      json: <T = any>(): T => JSON.parse(textContent),
    };
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs / 1000} seconds.`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
};
