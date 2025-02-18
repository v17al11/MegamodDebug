function startInspect() {
  // --- Configuration variables ---
  // If true, normalization is applied using the hardcoded expected size.
  const useHardcodedTotal = true;
  // If false, then progress displays the actual event.total (in MB) and loaded as-is.
  // If true with useHardcodedTotal, then loaded amounts (and speed) are normalized.
  const logHardcodedTotal = false;
  // Hardcoded expected totals (in bytes) for each file type.
  const hardcodedTotalMap = {
    ".data.br": 30978273,
    ".wasm.br": 56036135,
  };

  // Progress logging step (in percent)
  const progressStep = 10;

  // --- Utility functions ---
  // Returns the hardcoded total for the file based on its URL.
  function getHardcodedTotal(url) {
    if (url.includes(".data.br")) return hardcodedTotalMap[".data.br"];
    if (url.includes(".wasm.br")) return hardcodedTotalMap[".wasm.br"];
    return null;
  }

  // Create a full-screen network console container
  const networkConsole = document.createElement("div");
  networkConsole.id = "network-console";
  networkConsole.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    overflow-y: auto;
    background: rgba(0, 0, 0, 0.8);
    color: #0f0;
    font-family: monospace;
    font-size: 12px;
    padding: 10px;
    box-sizing: border-box;
    z-index: 9999;
  `;
  document.body.appendChild(networkConsole);

  // Helper: Create a container for each request log with two columns.
  function createRequestLogContainer(title) {
    const container = document.createElement("div");
    container.className = "request-log";
    container.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5px;
      margin-bottom: 10px;
      border: 1px solid #0f0;
      padding: 5px;
      box-sizing: border-box;
      width: 100%;
    `;
    const header = document.createElement("div");
    header.textContent = title;
    header.style.cssText = `
      grid-column: 1 / span 2;
      font-weight: bold;
      margin-bottom: 5px;
      word-break: break-all;
    `;
    container.appendChild(header);
    return container;
  }

  // Helper: Log a row of information (label and value) into the container.
  function logRequestInfo(container, label, value) {
    const labelDiv = document.createElement("div");
    labelDiv.textContent = label;
    labelDiv.style.cssText = "font-weight: bold; word-break: break-all;";
    const valueDiv = document.createElement("div");
    valueDiv.textContent = value;
    valueDiv.style.cssText = "word-break: break-all;";
    container.appendChild(labelDiv);
    container.appendChild(valueDiv);
  }

  // Helper: Parse query parameters from a URL and return a JSON string (if any).
  function getQueryParams(url) {
    try {
      const urlObj = new URL(url);
      const params = {};
      for (let [key, value] of urlObj.searchParams.entries()) {
        params[key] = value;
      }
      return Object.keys(params).length ? JSON.stringify(params) : null;
    } catch (e) {
      return null;
    }
  }

  // --- Intercept fetch requests ---
  const originalFetch = window.fetch;
  window.fetch = function (...args) {
    let requestInfo = {};
    if (typeof args[0] === "string") {
      requestInfo.url = args[0];
      requestInfo.method = "GET";
    } else if (args[0] instanceof Request) {
      requestInfo.url = args[0].url;
      requestInfo.method = args[0].method;
      requestInfo.headers = args[0].headers;
    }
    // Only intercept URLs that contain .data.br or .wasm.br.
    if (
      !requestInfo.url ||
      (!requestInfo.url.includes(".data.br") &&
        !requestInfo.url.includes(".wasm.br"))
    ) {
      return originalFetch.apply(this, args);
    }

    const startTime = Date.now();
    const container = createRequestLogContainer(
      `[Fetch] ${requestInfo.method} ${requestInfo.url}`
    );
    networkConsole.appendChild(container);
    logRequestInfo(container, "Status", "Starting");

    // Log extra request info.
    if (
      requestInfo.headers &&
      typeof requestInfo.headers.forEach === "function"
    ) {
      const headerObj = {};
      requestInfo.headers.forEach((value, key) => {
        headerObj[key] = value;
      });
      logRequestInfo(container, "Request Headers", JSON.stringify(headerObj));
    }
    const queryParams = getQueryParams(requestInfo.url);
    if (queryParams) logRequestInfo(container, "Query Params", queryParams);
    logRequestInfo(
      container,
      "Start Time",
      new Date(startTime).toLocaleTimeString()
    );

    return originalFetch.apply(this, args).then((response) => {
      // Get event total from the Content-Length header.
      const headerTotal = response.headers.get("Content-Length");
      const eventTotal = headerTotal ? parseInt(headerTotal, 10) : 0;
      const effectiveTotal = eventTotal; // effectiveTotal is the raw event total.

      logRequestInfo(
        container,
        "Response Status",
        `${response.status} ${response.statusText}`
      );
      logRequestInfo(
        container,
        "Response Headers",
        JSON.stringify([...response.headers])
      );

      if (!response.body) {
        let elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        logRequestInfo(container, "Completed", `${elapsed} s (no body stream)`);
        return response;
      }

      const reader = response.body.getReader();
      let loadedBytes = 0;
      let chunks = [];
      let lastLoggedPercent = 0;
      const speedSamples = []; // Store instantaneous speeds (in MB/s)

      function pump() {
        return reader.read().then(({ done, value }) => {
          if (done) return;
          loadedBytes += value.byteLength;
          let elapsed = (Date.now() - startTime) / 1000;
          // Compute raw instantaneous speed (in MB/s)
          let rawSpeed = loadedBytes / elapsed / (1024 * 1024);
          let currentSpeed;
          if (eventTotal > 0) {
            if (useHardcodedTotal && !logHardcodedTotal) {
              // Normalize loaded bytes using factor = (eventTotal / hardcodedTotal).
              const hardcodedTotal = getHardcodedTotal(requestInfo.url);
              if (hardcodedTotal) {
                let normalizedLoaded =
                  loadedBytes * (eventTotal / hardcodedTotal);
                currentSpeed = normalizedLoaded / elapsed / (1024 * 1024);
                let percent = (normalizedLoaded / eventTotal) * 100;
                if (
                  percent - lastLoggedPercent >= progressStep ||
                  percent >= 100
                ) {
                  lastLoggedPercent =
                    Math.floor(percent / progressStep) * progressStep;
                  let loadedMB = (normalizedLoaded / (1024 * 1024)).toFixed(2);
                  let totalMB = (eventTotal / (1024 * 1024)).toFixed(2);
                  logRequestInfo(
                    container,
                    "Progress",
                    `${loadedMB} MB / ${totalMB} MB (${lastLoggedPercent}%), speed: ${currentSpeed.toFixed(
                      2
                    )} MB/s`
                  );
                }
              } else {
                currentSpeed = rawSpeed;
                let percent = (loadedBytes / effectiveTotal) * 100;
                if (
                  percent - lastLoggedPercent >= progressStep ||
                  percent >= 100
                ) {
                  lastLoggedPercent =
                    Math.floor(percent / progressStep) * progressStep;
                  let loadedMB = (loadedBytes / (1024 * 1024)).toFixed(2);
                  let totalMB = (effectiveTotal / (1024 * 1024)).toFixed(2);
                  logRequestInfo(
                    container,
                    "Progress",
                    `${loadedMB} MB / ${totalMB} MB (${lastLoggedPercent}%), speed: ${currentSpeed.toFixed(
                      2
                    )} MB/s`
                  );
                }
              }
            } else {
              // No normalization: use raw loadedBytes.
              currentSpeed = rawSpeed;
              let percent = (loadedBytes / effectiveTotal) * 100;
              if (
                percent - lastLoggedPercent >= progressStep ||
                percent >= 100
              ) {
                lastLoggedPercent =
                  Math.floor(percent / progressStep) * progressStep;
                let loadedMB = (loadedBytes / (1024 * 1024)).toFixed(2);
                let totalMB = (effectiveTotal / (1024 * 1024)).toFixed(2);
                logRequestInfo(
                  container,
                  "Progress",
                  `${loadedMB} MB / ${totalMB} MB (${lastLoggedPercent}%), speed: ${currentSpeed.toFixed(
                    2
                  )} MB/s`
                );
              }
            }
          } else {
            currentSpeed = rawSpeed;
            let loadedMB = (loadedBytes / (1024 * 1024)).toFixed(2);
            logRequestInfo(
              container,
              "Progress",
              `${loadedMB} MB loaded, speed: ${currentSpeed.toFixed(2)} MB/s`
            );
          }
          // Record the instantaneous speed sample.
          speedSamples.push(currentSpeed);
          chunks.push(value);
          return pump();
        });
      }

      return pump().then(() => {
        let elapsed = (Date.now() - startTime) / 1000;
        // Compute average speed from the samples.
        let sumSpeed = speedSamples.reduce((acc, s) => acc + s, 0);
        let avgSpeed = sumSpeed / speedSamples.length || 0;
        let finalLoaded;
        if (useHardcodedTotal && !logHardcodedTotal && eventTotal > 0) {
          const hardcodedTotal = getHardcodedTotal(requestInfo.url);
          finalLoaded = loadedBytes * (eventTotal / hardcodedTotal);
        } else {
          finalLoaded = loadedBytes;
        }
        let finalLoadedMB = (finalLoaded / (1024 * 1024)).toFixed(2);
        let totalMB = (eventTotal / (1024 * 1024)).toFixed(2);
        logRequestInfo(
          container,
          "Completed",
          `${elapsed.toFixed(
            2
          )} s, total: ${totalMB} MB, downloaded: ${finalLoadedMB} MB, avg speed: ${avgSpeed.toFixed(
            2
          )} MB/s`
        );
        const blob = new Blob(chunks);
        const newResponse = new Response(blob, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
        return newResponse;
      });
    });
  };

  // --- Intercept XMLHttpRequest requests ---
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (
    method,
    url,
    async,
    user,
    password
  ) {
    this._url = url;
    this._method = method;
    return originalXHROpen.apply(this, arguments);
  };

  const originalXHRSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (body) {
    if (
      !this._url ||
      (!this._url.includes(".data.br") && !this._url.includes(".wasm.br"))
    ) {
      return originalXHRSend.apply(this, arguments);
    }
    const startTime = Date.now();
    const container = createRequestLogContainer(
      `[XHR] ${this._method} ${this._url}`
    );
    networkConsole.appendChild(container);
    this._logContainer = container;
    this._lastLoggedPercent = 0;
    // Initialize speed samples array for this XHR.
    this._speedSamples = [];
    logRequestInfo(container, "Status", "Starting");
    const queryParams = getQueryParams(this._url);
    if (queryParams) logRequestInfo(container, "Query Params", queryParams);
    logRequestInfo(
      container,
      "Start Time",
      new Date(startTime).toLocaleTimeString()
    );

    this.addEventListener("progress", function (event) {
      let eventTotal = event.total;
      if (event.lengthComputable && eventTotal > 0) {
        let elapsed = (Date.now() - startTime) / 1000;
        let rawSpeed = event.loaded / elapsed / (1024 * 1024);
        let currentSpeed;
        if (useHardcodedTotal && !logHardcodedTotal) {
          const hardcodedTotal = getHardcodedTotal(this._url);
          if (hardcodedTotal) {
            let normalizedLoaded = event.loaded * (eventTotal / hardcodedTotal);
            currentSpeed = normalizedLoaded / elapsed / (1024 * 1024);
            let percent = (normalizedLoaded / eventTotal) * 100;
            if (
              percent - this._lastLoggedPercent >= progressStep ||
              percent >= 100
            ) {
              this._lastLoggedPercent =
                Math.floor(percent / progressStep) * progressStep;
              let loadedMB = (normalizedLoaded / (1024 * 1024)).toFixed(2);
              let totalMB = (eventTotal / (1024 * 1024)).toFixed(2);
              let normalizedSpeed = currentSpeed.toFixed(2);
              logRequestInfo(
                container,
                "Progress",
                `${loadedMB} MB / ${totalMB} MB (${this._lastLoggedPercent}%), speed: ${normalizedSpeed} MB/s`
              );
            }
          }
        } else {
          currentSpeed = rawSpeed;
          let percent = (event.loaded / eventTotal) * 100;
          if (
            percent - this._lastLoggedPercent >= progressStep ||
            percent >= 100
          ) {
            this._lastLoggedPercent =
              Math.floor(percent / progressStep) * progressStep;
            let loadedMB = (event.loaded / (1024 * 1024)).toFixed(2);
            let totalMB = (eventTotal / (1024 * 1024)).toFixed(2);
            logRequestInfo(
              container,
              "Progress",
              `${loadedMB} MB / ${totalMB} MB (${
                this._lastLoggedPercent
              }%), speed: ${currentSpeed.toFixed(2)} MB/s`
            );
          }
        }
        // Record the instantaneous speed sample.
        this._speedSamples.push(currentSpeed);
      } else {
        let loadedMB = (event.loaded / (1024 * 1024)).toFixed(2);
        logRequestInfo(
          container,
          "Progress",
          `${loadedMB} MB loaded (total size unknown)`
        );
      }
    });

    this.addEventListener("load", function () {
      let elapsed = (Date.now() - startTime) / 1000;
      const headers = this.getAllResponseHeaders();
      let size = this.response
        ? this.response.byteLength ||
          (typeof this.response === "string" && this.response.length) ||
          "unknown"
        : "unknown";
      let finalSizeMB;
      if (size !== "unknown") {
        if (useHardcodedTotal && !logHardcodedTotal && this.response) {
          const hardcodedTotal = getHardcodedTotal(this._url);
          finalSizeMB = (
            (size * (event.total / hardcodedTotal)) /
            (1024 * 1024)
          ).toFixed(2);
        } else {
          finalSizeMB = (size / (1024 * 1024)).toFixed(2);
        }
      } else {
        finalSizeMB = size;
      }
      // Compute average speed from recorded samples.
      let sumSpeed = this._speedSamples.reduce((acc, s) => acc + s, 0);
      let avgSpeed = (
        this._speedSamples.length ? sumSpeed / this._speedSamples.length : 0
      ).toFixed(2);
      logRequestInfo(
        container,
        "Completed",
        `${elapsed.toFixed(
          2
        )} s, size: ${finalSizeMB} MB, avg speed: ${avgSpeed} MB/s, headers: ${headers}`
      );
    });

    return originalXHRSend.apply(this, arguments);
  };
}
