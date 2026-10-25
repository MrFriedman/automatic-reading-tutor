import axios, { AxiosError } from "axios";
import { isDemoMode } from "./demo/config";
import { handleDemoRequest } from "./demo/demoApi";

const httpClient = axios.create({
  withCredentials: true,
  baseURL: process.env.REACT_APP_API_URL || undefined,
});

if (isDemoMode()) {
  // Answer every call locally. The real XHR adapter stays in place when an API URL is set.
  httpClient.defaults.adapter = (config) => {
    try {
      const { status, data } = handleDemoRequest(config);
      const response = {
        data,
        status,
        statusText: status >= 200 && status < 300 ? "OK" : "Error",
        headers: {},
        config,
        request: {},
      };
      if (status < 200 || status >= 300) {
        return Promise.reject(
          new AxiosError(
            `Request failed with status code ${status}`,
            AxiosError.ERR_BAD_REQUEST,
            config,
            response.request,
            response
          )
        );
      }
      return Promise.resolve(response);
    } catch (err) {
      return Promise.reject(err);
    }
  };
}

export default httpClient;
