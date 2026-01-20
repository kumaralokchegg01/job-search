import axios, { AxiosInstance, AxiosError } from 'axios';
import Debug from 'debug';

const log = Debug('jobintel:http-client');

interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
}

/**
 * HTTP Client with retry logic and error handling
 */
export class HTTPClient {
  private client: AxiosInstance;
  private maxRetries: number = 3;
  private retryDelay: number = 2000; // 2 seconds
  private backoffMultiplier: number = 2;

  constructor(baseURL?: string, retryConfig?: RetryConfig) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'JobIntel/1.0',
      },
    });

    if (retryConfig) {
      this.maxRetries = retryConfig.maxRetries || this.maxRetries;
      this.retryDelay = retryConfig.retryDelay || this.retryDelay;
      this.backoffMultiplier = retryConfig.backoffMultiplier || this.backoffMultiplier;
    }
  }

  /**
   * GET request with retry
   */
  async get<T>(
    url: string,
    config?: any,
    attempt: number = 0
  ): Promise<T> {
    try {
      const response = await this.client.get<T>(url, config);
      return response.data;
    } catch (err) {
      return this.handleError<T>(err as AxiosError, url, 'GET', attempt);
    }
  }

  /**
   * POST request with retry
   */
  async post<T>(
    url: string,
    data?: any,
    config?: any,
    attempt: number = 0
  ): Promise<T> {
    try {
      const response = await this.client.post<T>(url, data, config);
      return response.data;
    } catch (err) {
      return this.handleError<T>(err as AxiosError, url, 'POST', attempt);
    }
  }

  /**
   * PUT request with retry
   */
  async put<T>(
    url: string,
    data?: any,
    config?: any,
    attempt: number = 0
  ): Promise<T> {
    try {
      const response = await this.client.put<T>(url, data, config);
      return response.data;
    } catch (err) {
      return this.handleError<T>(err as AxiosError, url, 'PUT', attempt);
    }
  }

  /**
   * DELETE request with retry
   */
  async delete<T>(
    url: string,
    config?: any,
    attempt: number = 0
  ): Promise<T> {
    try {
      const response = await this.client.delete<T>(url, config);
      return response.data;
    } catch (err) {
      return this.handleError<T>(err as AxiosError, url, 'DELETE', attempt);
    }
  }

  /**
   * Handle errors with retry logic
   */
  private async handleError<T>(
    error: AxiosError,
    url: string,
    method: string,
    attempt: number
  ): Promise<T> {
    const isRetryable =
      error.response?.status === 429 || // Rate limited
      error.response?.status === 503 || // Service unavailable
      error.response?.status === 504 || // Gateway timeout
      error.code === 'ECONNABORTED' || // Timeout
      error.code === 'ECONNRESET'; // Connection reset

    if (isRetryable && attempt < this.maxRetries) {
      const delay = this.retryDelay * Math.pow(this.backoffMultiplier, attempt);
      log(`Retry attempt ${attempt + 1}/${this.maxRetries} for ${method} ${url} after ${delay}ms`);

      await new Promise((resolve) => setTimeout(resolve, delay));

      return this[method.toLowerCase() as keyof HTTPClient](url, undefined, undefined, attempt + 1) as Promise<T>;
    }

    log(`Request failed: ${method} ${url} - ${error.message}`);
    throw error;
  }

  /**
   * Set authorization header
   */
  setAuthToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Set API key header
   */
  setApiKey(apiKey: string, headerName: string = 'X-API-Key'): void {
    this.client.defaults.headers.common[headerName] = apiKey;
  }

  /**
   * Add custom header
   */
  setHeader(name: string, value: string): void {
    this.client.defaults.headers.common[name] = value;
  }

  /**
   * Get axios instance for advanced usage
   */
  getClient(): AxiosInstance {
    return this.client;
  }
}

export default HTTPClient;
