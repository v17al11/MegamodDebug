function startInspect() {
  // ----- Global configuration -----
  const useHardcodedTotal = true;
  const logHardcodedTotal = false;
  const hardcodedTotalMap = {
    ".data.br": 30978273,
    ".wasm.br": 56036135,
  };
  const progressStep = 10;

  // Global variable to store the first file start time
  window.firstFileStartTime = null;

  // Ensure that the page can be scrolled
  document.documentElement.style.overflowY = "auto";
  document.body.style.overflowY = "auto";

  // ----- ASCII Art Header (to be padded to full width) -----
  const headerDiv = document.createElement("div");
  headerDiv.style.cssText = `
    background: #000;
    color: #0f0;
    font-family: monospace;
    white-space: pre;
    text-align: center;
    padding: 0;
    border-bottom: 1px solid #0f0;
    margin-bottom: 10px;
    overflow: auto;
    width: 100%;
  `;
  // Original header lines
  const originalHeaderLines = [
    "==========================================",
    "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
    "▓                                        ▓",
    "▓           MEGAMOD DEBUG PAGE           ▓",
    "▓========================================▓",
    "▓                                        ▓",
    "▓           TECHNO CORE SYSTEM           ▓",
    "▓     CommUnity Token - [Placeholder]    ▓",
    "▓                                        ▓",
    "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
    "==========================================",
  ];

  // Utility: Check if a line is a border line (all characters are the same)
  function isBorderLine(line) {
    const trimmed = line.trim();
    if (trimmed.length === 0) return false;
    return trimmed.split("").every((ch) => ch === trimmed[0]);
  }

  // Utility: Pad a single line to the target length in characters
  function padLine(line, targetLength) {
    if (isBorderLine(line)) {
      return line[0].repeat(targetLength);
    } else {
      const firstChar = line[0];
      const lastChar = line[line.length - 1];
      if (firstChar === lastChar) {
        const inner = line.substring(1, line.length - 1).trim();
        if (/^=+$/.test(inner)) {
          return firstChar + "=".repeat(targetLength - 2) + lastChar;
        } else {
          const innerTarget = targetLength - 2;
          let paddedInner = inner;
          if (inner.length < innerTarget) {
            const totalSpaces = innerTarget - inner.length;
            const leftSpaces = Math.floor(totalSpaces / 2);
            const rightSpaces = totalSpaces - leftSpaces;
            paddedInner =
              " ".repeat(leftSpaces) + inner + " ".repeat(rightSpaces);
          }
          return firstChar + paddedInner + lastChar;
        }
      } else {
        if (line.length < targetLength) {
          const totalSpaces = targetLength - line.length;
          const leftSpaces = Math.floor(totalSpaces / 2);
          const rightSpaces = totalSpaces - leftSpaces;
          return " ".repeat(leftSpaces) + line + " ".repeat(rightSpaces);
        } else {
          return line;
        }
      }
    }
  }

  // Function to pad the entire header text to fill the header's width
  function padHeaderText() {
    const computedFont = window.getComputedStyle(headerDiv).font;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.font = computedFont;
    const charWidth = ctx.measureText("M").width;
    const targetLength = Math.floor(headerDiv.clientWidth / charWidth);
    const paddedLines = originalHeaderLines.map((line) =>
      padLine(line, targetLength)
    );
    headerDiv.innerText = paddedLines.join("\n");
  }

  document.body.insertBefore(headerDiv, document.body.firstChild);
  padHeaderText();
  setTimeout(padHeaderText, 100);
  setTimeout(padHeaderText, 500);
  setTimeout(padHeaderText, 1000);
  window.addEventListener("resize", padHeaderText);

  // ----- Container for Final Results and Ping Log (aligned at the bottom) -----
  const topInfoContainer = document.createElement("div");
  topInfoContainer.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    width: 100%;
    margin-bottom: 10px;
  `;

  // ----- Final Results Block -----
  const finalResultsDiv = document.createElement("div");
  finalResultsDiv.id = "final-results";
  finalResultsDiv.style.cssText = `
    background: #000;
    color: #0f0;
    font-family: monospace;
    padding: 10px 0 10px 10px;
    border-bottom: 1px solid #0f0;
    font-size: 18px;
    width: calc(100% - 220px);
    overflow: auto;
  `;
  finalResultsDiv.innerHTML = "<strong>Loading...</strong>";
  topInfoContainer.appendChild(finalResultsDiv);

  // ----- Ping Log Block (increased size) -----
  const pingLogDiv = document.createElement("div");
  pingLogDiv.style.cssText = `
    background: #000;
    color: #0f0;
    font-family: monospace;
    font-size: 12px;
    padding: 5px;
    border: 1px solid #0f0;
    width: 600px;
    height: 225px;
    overflow-y: auto;
    margin-left: 10px;
  `;
  topInfoContainer.appendChild(pingLogDiv);

  document.body.insertBefore(topInfoContainer, headerDiv.nextSibling);

  // Update final results block with global start/finish times and file numbering
  window.finalResultsData = {};
  function updateFinalResultsBlock() {
    if (
      window.testRequests.total === 0 ||
      window.testRequests.completed < window.testRequests.total
    ) {
      let startInfo = window.firstFileStartTime
        ? `Loading started at: ${new Date(
            window.firstFileStartTime
          ).toLocaleTimeString()}<br/>`
        : "";
      finalResultsDiv.innerHTML = `<strong>Loading...</strong><br/>${startInfo}`;
    } else {
      let globalFinishTime = new Date();
      let html = `<strong>DONE ✅</strong><br/>
<strong>Global Start:</strong> ${new Date(
        window.firstFileStartTime
      ).toLocaleTimeString()}<br/>
<strong>Global Finish:</strong> ${globalFinishTime.toLocaleTimeString()}<br/><br/>
<strong>File Results:</strong><br/>`;
      let index = 1;
      for (let key in window.finalResultsData) {
        html += `${index}. ${key}: ${window.finalResultsData[key]}<br/><br/>`;
        index++;
      }
      finalResultsDiv.innerHTML = html;
    }
  }

  // ----- Ping for google.com (using real fetch with timeout) -----
  function startPingLoop() {
    let seq = 0;
    // Display ping header using domain name only
    pingLogDiv.innerHTML = "";
    const headerLine = document.createElement("div");
    headerLine.textContent = `PING google.com: 56 data bytes`;
    pingLogDiv.appendChild(headerLine);

    // Function to perform a single ping using fetch with a 1-second timeout
    function pingOnce(seq) {
      const start = performance.now();
      return new Promise((resolve) => {
        let timeoutOccurred = false;
        const timer = setTimeout(() => {
          timeoutOccurred = true;
          resolve({ seq, timeout: true });
        }, 1000);
        fetch("https://www.gstatic.com/generate_204", {
          method: "HEAD",
          cache: "no-cache",
          mode: "no-cors",
        })
          .then(() => {
            if (!timeoutOccurred) {
              clearTimeout(timer);
              const elapsed = performance.now() - start;
              resolve({ seq, time: elapsed });
            }
          })
          .catch(() => {
            if (!timeoutOccurred) {
              clearTimeout(timer);
              resolve({ seq, timeout: true });
            }
          });
      });
    }

    setInterval(() => {
      pingOnce(seq).then((result) => {
        let line = "";
        if (result.timeout) {
          line = `Request timeout for icmp_seq ${result.seq}`;
        } else {
          line = `64 bytes from google.com: icmp_seq=${
            result.seq
          } ttl=115 time=${result.time.toFixed(3)} ms`;
        }
        const logEntry = document.createElement("div");
        logEntry.textContent = line;
        pingLogDiv.appendChild(logEntry);
        // Auto-scroll only if the user is near the bottom
        if (
          pingLogDiv.scrollHeight -
            pingLogDiv.scrollTop -
            pingLogDiv.clientHeight <
          20
        ) {
          pingLogDiv.scrollTop = pingLogDiv.scrollHeight;
        }
        seq++;
      });
    }, 1000);
  }
  startPingLoop();

  // ----- User Information Block -----
  const userInfoDiv = document.createElement("div");
  userInfoDiv.style.cssText = `
    background: #000;
    color: #0f0;
    font-family: monospace;
    white-space: pre-wrap;
    word-wrap: break-word;
    padding: 10px;
    border: 1px solid #0f0;
    margin-bottom: 10px;
  `;
  let userInfoText = `User Agent: ${navigator.userAgent}
Platform: ${navigator.platform}
CPU Cores: ${navigator.hardwareConcurrency}`;
  if (navigator.deviceMemory) {
    userInfoText += `\nDevice Memory: ${navigator.deviceMemory} GB or more`;
  } else {
    userInfoText += `\nDevice Memory: Not available`;
  }
  userInfoText += `\nScreen Resolution: ${window.screen.width} x ${window.screen.height}`;

  function getWebGLInfo() {
    const gl2 = document.createElement("canvas").getContext("webgl2");
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    const info = {};
    info.webgl2 = !!gl2;
    info.webgl = !!(gl || gl2);
    if (gl2) {
      const debugInfo = gl2.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        info.vendor = gl2.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        info.renderer = gl2.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
    } else if (gl) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        info.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        info.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
    }
    return info;
  }
  const webglInfo = getWebGLInfo();
  userInfoText += `\nWebGL1 Supported: ${webglInfo.webgl}`;
  userInfoText += `\nWebGL2 Supported: ${webglInfo.webgl2}`;
  if (webglInfo.vendor) {
    userInfoText += `\nGPU Vendor: ${webglInfo.vendor}`;
    userInfoText += `\nGPU Renderer: ${webglInfo.renderer}`;
  }
  userInfoText += `\nVPN IP Address: Not detected`;
  let deviceType = /Mobi|Android/i.test(navigator.userAgent)
    ? "Mobile"
    : "Desktop or laptop";
  userInfoText += `\nDevice Type / Model: ${deviceType}`;
  let osInfo = "Unknown OS";
  let ua = navigator.userAgent;
  if (ua.indexOf("Windows NT") !== -1) {
    osInfo = "Windows";
  } else if (ua.indexOf("Mac OS X") !== -1) {
    let match = ua.match(/Mac OS X (10[._]\d+([._]\d+)?)/);
    if (match) {
      osInfo = "macOS " + match[1].replace(/_/g, ".");
    } else {
      osInfo = "macOS";
    }
  } else if (ua.indexOf("Linux") !== -1) {
    osInfo = "Linux";
  } else if (ua.indexOf("Android") !== -1) {
    osInfo = "Android";
  } else if (ua.indexOf("like Mac OS X") !== -1) {
    osInfo = "iOS";
  }
  userInfoText += `\nOperating System: ${osInfo}`;
  if (navigator.connection) {
    userInfoText += `\nNetwork Type: ${
      navigator.connection.effectiveType || "N/A"
    }`;
    userInfoText += `\nDownlink: ${navigator.connection.downlink || "N/A"}`;
    userInfoText += `\nRTT: ${navigator.connection.rtt || "N/A"}`;
  }
  userInfoText += `\nLanguage: ${navigator.language}`;
  if (navigator.languages) {
    userInfoText += `\nLanguages: ${navigator.languages.join(", ")}`;
  }
  userInfoText += `\nTime Zone: ${
    Intl.DateTimeFormat().resolvedOptions().timeZone
  }`;
  userInfoDiv.innerText = userInfoText;
  document.body.insertBefore(userInfoDiv, topInfoContainer.nextSibling);

  fetch("https://ipinfo.io/json")
    .then((response) => response.json())
    .then((data) => {
      userInfoText += `\nIP: ${data.ip}\nCity: ${data.city}\nRegion: ${data.region}\nCountry: ${data.country}\nOrg: ${data.org}`;
      userInfoDiv.innerText = userInfoText;
    })
    .catch((err) => {
      userInfoText += `\nIP Info: Unavailable`;
      userInfoDiv.innerText = userInfoText;
    });

  // ----- Global Test Status Block -----
  const testStatusDiv = document.createElement("div");
  testStatusDiv.style.cssText = `
    background: #000;
    color: #0f0;
    font-family: monospace;
    font-size: 72px;
    padding: 10px;
    border: 1px solid #0f0;
    margin-bottom: 10px;
    text-align: center;
  `;
  testStatusDiv.innerText = "Status: Loading";
  document.body.insertBefore(testStatusDiv, userInfoDiv.nextSibling);

  let statusDots = 0;
  let statusAnimationInterval = setInterval(() => {
    if (
      window.testRequests.total > 0 &&
      window.testRequests.completed < window.testRequests.total
    ) {
      statusDots = (statusDots + 1) % 4;
      testStatusDiv.innerText = `Status: Loading${".".repeat(statusDots)} (${
        window.testRequests.completed
      }/${window.testRequests.total} completed)`;
    } else if (
      window.testRequests.total > 0 &&
      window.testRequests.completed >= window.testRequests.total
    ) {
      clearInterval(statusAnimationInterval);
      testStatusDiv.innerText = `Status: Done ✅ (${window.testRequests.completed}/${window.testRequests.total} completed)`;
    }
  }, 500);

  window.testRequests = { total: 0, completed: 0 };
  function updateTestStatus() {
    updateFinalResultsBlock();
  }

  // ----- Container for Network Logs -----
  const networkConsole = document.createElement("div");
  networkConsole.id = "network-console";
  networkConsole.style.cssText = `
    background: #000;
    color: #0f0;
    font-family: monospace;
    font-size: 12px;
    padding: 0;
    box-sizing: border-box;
    margin-top: 10px;
  `;
  document.body.appendChild(networkConsole);

  function getHardcodedTotal(url) {
    if (url.includes(".data.br")) return hardcodedTotalMap[".data.br"];
    if (url.includes(".wasm.br")) return hardcodedTotalMap[".wasm.br"];
    return null;
  }

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

  function logRequestInfo(container, label, value) {
    const labelDiv = document.createElement("div");
    labelDiv.textContent = label;
    labelDiv.style.cssText = "font-weight: bold; word-break: break-all;";
    const valueDiv = document.createElement("div");
    valueDiv.textContent = value;
    valueDiv.style.cssText = "word-break: break-all;";
    if (label === "Status") {
      container.statusElement = valueDiv;
    }
    container.appendChild(labelDiv);
    container.appendChild(valueDiv);
  }

  function logFinalResult(container, value) {
    const finalDiv = document.createElement("div");
    finalDiv.textContent = value;
    finalDiv.style.cssText = `
      grid-column: 1 / span 2;
      font-weight: bold;
      font-size: 14px;
      background-color: #010;
      padding: 5px;
      margin-top: 5px;
    `;
    container.appendChild(finalDiv);
  }

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

  // ----- Intercept fetch Requests -----
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
    if (
      !requestInfo.url ||
      (!requestInfo.url.includes(".data.br") &&
        !requestInfo.url.includes(".wasm.br"))
    ) {
      return originalFetch.apply(this, args);
    }
    window.testRequests.total++;
    updateTestStatus();
    const startTime = Date.now();
    if (!window.firstFileStartTime) {
      window.firstFileStartTime = startTime;
    }
    const container = createRequestLogContainer(
      `[Fetch] ${requestInfo.method} ${requestInfo.url}`
    );
    container._startTime = startTime;
    networkConsole.appendChild(container);
    logRequestInfo(container, "Status", "Starting");
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
      const headerTotal = response.headers.get("Content-Length");
      const eventTotal = headerTotal ? parseInt(headerTotal, 10) : 0;
      // Log Response Status and Headers first
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
      // Then log initial progress with "0.00 MB"
      if (eventTotal > 0) {
        let totalMB = (eventTotal / (1024 * 1024)).toFixed(2);
        logRequestInfo(
          container,
          "Progress",
          `0.00 MB / ${totalMB} MB (0%), speed: 0.00 MB/s`
        );
      }
      if (!response.body) {
        let elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        if (container.statusElement)
          container.statusElement.textContent = "Done";
        logFinalResult(
          container,
          `${new Date(
            startTime
          ).toLocaleTimeString()} - ${new Date().toLocaleTimeString()}, ${elapsed} s, (no body stream)`
        );
        window.testRequests.completed++;
        updateTestStatus();
        return response;
      }
      const reader = response.body.getReader();
      let loadedBytes = 0;
      let chunks = [];
      let lastLoggedPercent = 0;
      const speedSamples = [];
      function pump() {
        return reader.read().then(({ done, value }) => {
          if (done) return;
          loadedBytes += value.byteLength;
          let elapsed = (Date.now() - startTime) / 1000;
          let rawSpeed = loadedBytes / elapsed / (1024 * 1024);
          let currentSpeed;
          if (eventTotal > 0) {
            if (useHardcodedTotal && !logHardcodedTotal) {
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
                let percent = (loadedBytes / eventTotal) * 100;
                if (
                  percent - lastLoggedPercent >= progressStep ||
                  percent >= 100
                ) {
                  lastLoggedPercent =
                    Math.floor(percent / progressStep) * progressStep;
                  let loadedMB = (loadedBytes / (1024 * 1024)).toFixed(2);
                  let totalMB = (eventTotal / (1024 * 1024)).toFixed(2);
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
              let percent = (loadedBytes / eventTotal) * 100;
              if (
                percent - lastLoggedPercent >= progressStep ||
                percent >= 100
              ) {
                lastLoggedPercent =
                  Math.floor(percent / progressStep) * progressStep;
                let loadedMB = (loadedBytes / (1024 * 1024)).toFixed(2);
                let totalMB = (eventTotal / (1024 * 1024)).toFixed(2);
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
          speedSamples.push(currentSpeed);
          chunks.push(value);
          return pump();
        });
      }
      return pump().then(() => {
        let finishTime = Date.now();
        let elapsed = (finishTime - startTime) / 1000;
        let sumSpeed = speedSamples.reduce((acc, s) => acc + s, 0);
        let avgSpeed = speedSamples.length ? sumSpeed / speedSamples.length : 0;
        let finalLoaded;
        if (useHardcodedTotal && !logHardcodedTotal && eventTotal > 0) {
          const hardcodedTotal = getHardcodedTotal(requestInfo.url);
          finalLoaded = loadedBytes * (eventTotal / hardcodedTotal);
        } else {
          finalLoaded = loadedBytes;
        }
        let finalLoadedMB = (finalLoaded / (1024 * 1024)).toFixed(2);
        const finalResultText = `Started: ${new Date(
          startTime
        ).toLocaleTimeString()}, Finished: ${new Date(
          finishTime
        ).toLocaleTimeString()}, Duration: ${elapsed.toFixed(
          2
        )} s, ${finalLoadedMB} MB, avg speed: ${avgSpeed.toFixed(2)} MB/s`;
        if (container.statusElement)
          container.statusElement.textContent = "Done";
        let fileKey = "";
        if (
          requestInfo.url.includes(".data.br") ||
          requestInfo.url.includes(".wasm.br")
        ) {
          fileKey = requestInfo.url;
        }
        if (fileKey) {
          window.finalResultsData[fileKey] = finalResultText;
          updateFinalResultsBlock();
        }
        window.testRequests.completed++;
        updateTestStatus();
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

  // ----- Intercept XMLHttpRequest Requests -----
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
    window.testRequests.total++;
    updateTestStatus();
    const startTime = Date.now();
    if (!window.firstFileStartTime) {
      window.firstFileStartTime = startTime;
    }
    this._startTime = startTime;
    const container = createRequestLogContainer(
      `[XHR] ${this._method} ${this._url}`
    );
    networkConsole.appendChild(container);
    this._lastLoggedPercent = 0;
    this._speedSamples = [];
    logRequestInfo(container, "Status", "Starting");
    const queryParams = getQueryParams(this._url);
    if (queryParams) logRequestInfo(container, "Query Params", queryParams);
    logRequestInfo(
      container,
      "Start Time",
      new Date(startTime).toLocaleTimeString()
    );
    this.addEventListener("loadstart", function (e) {
      if (e.lengthComputable && e.total > 0) {
        let totalMB = (e.total / (1024 * 1024)).toFixed(2);
        logRequestInfo(
          container,
          "Progress",
          `0.00 MB / ${totalMB} MB (0%), speed: 0.00 MB/s`
        );
      }
    });
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
              logRequestInfo(
                container,
                "Progress",
                `${loadedMB} MB / ${totalMB} MB (${
                  this._lastLoggedPercent
                }%), speed: ${currentSpeed.toFixed(2)} MB/s`
              );
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
      let finishTime = Date.now();
      let elapsed = (finishTime - startTime) / 1000;
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
      let sumSpeed = this._speedSamples.reduce((acc, s) => acc + s, 0);
      let avgSpeed = (
        this._speedSamples.length ? sumSpeed / this._speedSamples.length : 0
      ).toFixed(2);
      const finalResultText = `Started: ${new Date(
        startTime
      ).toLocaleTimeString()}, Finished: ${new Date(
        finishTime
      ).toLocaleTimeString()}, Duration: ${elapsed.toFixed(
        2
      )} s, ${finalSizeMB} MB, avg speed: ${avgSpeed} MB/s`;
      if (container.statusElement) container.statusElement.textContent = "Done";
      let fileKey = "";
      if (this._url.includes(".data.br") || this._url.includes(".wasm.br")) {
        fileKey = this._url;
      }
      if (fileKey) {
        window.finalResultsData[fileKey] = finalResultText;
        updateFinalResultsBlock();
      }
      window.testRequests.completed++;
      updateTestStatus();
    });
    return originalXHRSend.apply(this, arguments);
  };

  const versionDiv = document.createElement("div");
  versionDiv.style.cssText = `
    background: #000;
    color: #0f0;
    font-family: monospace;
    text-align: center;
    padding: 5px;
    margin-top: 10px;
  `;
  versionDiv.textContent = "v0.0.5";
  document.body.appendChild(versionDiv);
}
