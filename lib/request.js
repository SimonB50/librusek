import { fetch } from "@tauri-apps/plugin-http";
import * as Utils from "./utils";

const Cache = {
  /**
   * Get cached librus data
   * @param {string} url URL of remote resource
   * @param {Array} selectors Array of selectors
   * @returns {Object} Cached data
   */
  get(url, selectors) {
    const cache = sessionStorage.getItem("requestCache");
    let cacheObj = JSON.parse(cache) || [];
    const urlObj = new URL(url);
    let cacheEntry = cacheObj.find(
      (entry) => entry.host === urlObj.host && entry.key === urlObj.pathname
    );
    if (!cacheEntry) return null;
    // Apply selectors filter without mutating the original data
    const filteredData = selectors
      ? cacheEntry.data.filter((entry) => selectors.some((s) => s == entry.Id))
      : cacheEntry.data;
    return {
      ...cacheEntry,
      data: filteredData,
    };
  },
  /**
   * Set cached librus data
   * @param {string} url URL of remote resource
   * @param {Object} data Data to cache
   */
  set(url, data) {
    const cache = sessionStorage.getItem("requestCache");
    let cacheObj = JSON.parse(cache) || [];
    const urlObj = new URL(url);
    const existingEntry = Cache.get(url);
    if (!existingEntry || !Array.isArray(data)) {
      const cacheEntry = {
        host: urlObj.host,
        key: urlObj.pathname,
        data: data,
        cacheTime: Date.now(),
      };
      cacheObj = cacheObj.filter(
        (entry) => entry.host !== urlObj.host || entry.key !== urlObj.pathname
      );
      cacheObj.push(cacheEntry);
      sessionStorage.setItem("requestCache", JSON.stringify(cacheObj));
      return;
    }
    if (Array.isArray(data)) {
      if (Array.isArray(existingEntry.data)) {
        data.forEach((newData) => {
          const existingData = existingEntry.data.find(
            (entry) => entry.Id == newData.Id
          );
          if (!existingData) {
            existingEntry.data.push(newData);
          } else {
            Object.assign(existingData, newData);
          }
        });
      } else {
        existingEntry.data = data;
      }
    } else {
      existingEntry.data = data;
    }
    existingEntry.cacheTime = Date.now();
    const index = cacheObj.findIndex(
      (entry) => entry.host === urlObj.host && entry.key === urlObj.pathname
    );
    if (index !== -1) {
      cacheObj[index] = existingEntry;
    } else {
      cacheObj.push(existingEntry);
    }
    sessionStorage.setItem("requestCache", JSON.stringify(cacheObj));
  },
};

const Request = {
  /**
   * Request a remote resource
   * @param {string} url URL to request
   * @param {Object} options Request options
   */
  async get(url, options = {}) {
    if (options.cache && options.cache.period) {
      options.cache.period *= 1000;
    }

    if (options.selectors && Array.isArray(options.selectors)) {
      options.selectors = Utils.deduplicate(options.selectors);
    }

    const urlObj = new URL(url);
    if (options.query) {
      Object.keys(options.query).forEach((key) => {
        urlObj.searchParams.append(key, options.query[key]);
      });
    }

    if (options.selectors instanceof Array && options.selectors[0] != "") {
      if (options.selectors.length === 1) options.selectors.push(0);
      const selectorPath = options.selectors.join(",");
      urlObj.pathname = `${urlObj.pathname}/${selectorPath}`;
    }

    const cacheUrl = urlObj.toString();
    const cacheOptions = options.cache;

    if (cacheOptions && cacheOptions.enabled) {
      const cachedData = Cache.get(url, options.selectors);
      if (cachedData) {
        const isCacheValid =
          !cacheOptions.period ||
          Date.now() - cachedData.cacheTime < cacheOptions.period;
        const hasAllSelectors =
          !options.selectors ||
          options.selectors.length === 0 ||
          options.selectors.every((selector) =>
            cachedData.data.some((entry) => entry.Id == selector)
          );
        if (isCacheValid && hasAllSelectors) {
          console.debug(`GET-CACHE | ${url}`);
          return cachedData.data;
        }
      }
    }

    console.debug(`GET | ${url}`);
    const response = await fetch(urlObj, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) {
      console.error(
        `Request to ${urlObj.pathname} failed with status ${response.status}`
      );
      if (response.status === 401) window.location.href = "/auth";
      return null;
    }
    const plain_data = await response.json();

    let data =
      plain_data instanceof Object && !options.customFormat
        ? plain_data[Object.keys(plain_data)[0]]
        : plain_data;

    if (options.selectors && Array.isArray(options.selectors)) {
      data = data.filter((entry) =>
        options.selectors.some((x) => x == entry.Id)
      );
    }

    if (cacheOptions && cacheOptions.enabled) {
      Cache.set(url, data);
    }

    return data;
  },
};

export default Request;
