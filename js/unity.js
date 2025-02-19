var mainScriptLoaded = false;
var myGameInstance = null;
var canvas;

function onMainScriptLoaded(config) {
  // sendEvent(Unity_WebGL_Hello_world);
  mainScriptLoaded = true;
  startCreateUnityInstance(config);
}

function onBuildLoaded(unityInstance) {
  console.log("build ready");
  window.unityInstance = unityInstance;
  myGameInstance = unityInstance;
}

function startLoadingBuild() {
  canvas = document.querySelector("#unity-canvas");
  var config = getConfig();
  const script = document.createElement("script");
  const loaderUrl =
    "https://d2c9flql2ljv41.cloudfront.net/megamod-vitaly.loader.js?v=" +
    Math.floor(Date.now() / 1000);

  script.src = loaderUrl;
  script.onload = () => {
    onMainScriptLoaded(config);
  };
  script.onerror = function () {
    // let errorProperty = { url: this.src };
    // sendEvent(Main_Script_Loading_Failed, errorProperty);
    alert("Script load failed: " + this.src);
  };
  document.body.appendChild(script);
}

function startCreateUnityInstance(config) {
  console.log("startCreateUnityInstance");
  createUnityInstance(canvas, config, (progress) => {
    // trackProgress(progress);
  })
    .then((unityInstance) => {
      onBuildLoaded(unityInstance);
    })
    .catch((message) => {
      console.error("startCreateUnityInstance error: " + message);
      let errorProperty = {
        Error: message,
      };
      // sendEvent(GameProgressEnum.Game_Error_Initialization, errorProperty);
      // alert("startCreateUnityInstance error: " + message);
    });
}

function checkDataFileCompression(dataFileMobileUrl) {
  if (!dataFileMobileUrl.startsWith("DATA_FILE_")) {
    var c = document.createElement("canvas");
    var gl = c.getContext("webgl");
    var gl2 = c.getContext("webgl2");
    if (
      (gl && gl.getExtension("WEBGL_compressed_texture_astc")) ||
      (gl2 && gl2.getExtension("WEBGL_compressed_texture_astc"))
    ) {
      return true;
    }
  }

  return false;
}

function unityShowBanner(msg, type) {
  function updateBannerVisibility() {
    warningBanner.style.display = warningBanner.children.length
      ? "block"
      : "none";
  }

  var div = document.createElement("div");
  div.innerHTML = msg;
  warningBanner.appendChild(div);
  if (type == "error") div.style = "background: red; padding: 10px;";
  else {
    if (type == "warning") div.style = "background: yellow; padding: 10px;";
    setTimeout(function () {
      warningBanner.removeChild(div);
      updateBannerVisibility();
    }, 5000);
  }
  updateBannerVisibility();
}

function getConfig() {
  // choose the data file based on whether there's support for the ASTC texture compression format
  var dataFilePcUrl =
    "https://d2c9flql2ljv41.cloudfront.net/megamod-vitaly_1739472537000.data.br?v=" +
    Math.floor(Date.now() / 1000);
  var dataFileMobileUrl =
    "https://d2c9flql2ljv41.cloudfront.net/megamod-vitaly_1739472537000_mobile.data.br?v=" +
    Math.floor(Date.now() / 1000);
  var dataFileUrl = dataFilePcUrl;

  if (checkDataFileCompression(dataFileMobileUrl)) {
    dataFileUrl = dataFileMobileUrl;
  }

  const buildUrl = "Build";
  return {
    dataUrl: dataFileUrl,
    frameworkUrl:
      "https://d2c9flql2ljv41.cloudfront.net/megamod-vitaly.framework.js.br?v=" +
      Math.floor(Date.now() / 1000),
    streamingAssetsUrl:
      "https://d2c9flql2ljv41.cloudfront.net/megamod-vitaly-assets",
    companyName: "DefaultCompany",
    productName: "MegaMod",
    productVersion: "1.781a",
    codeUrl:
      "https://d2c9flql2ljv41.cloudfront.net/megamod-vitaly_1739472537000.wasm.br?v=" +
      Math.floor(Date.now() / 1000),
    showBanner: unityShowBanner,
    cacheControl: function (url) {
      // Caching enabled for .data and .bundle files.
      // Revalidate if file is up to date before loading from cache
      //if (url.match(/\.data/) || url.match(/\.bundle/) || url.match(/\.wasm/)) {
      if (url.match(/\.bundle/)) {
        return "no-store";
        // return "must-revalidate";
        //return "immutable";
      }

      // // Caching enabled for .mp4 and .custom files
      // // Load file from cache without revalidation.
      if (url.match(/\.data/) || url.match(/\.wasm/)) {
        return "no-store";
        // return "immutable";
      }
      // // Caching enabled for .mp4 and .custom files
      // // Load file from cache without revalidation.
      // if (url.match(/\.mp4/) || url.match(/\.custom/)) {
      //     return "immutable";
      // }

      // Disable explicit caching for all other files.
      // Note: the default browser cache may cache them anyway.
      return "no-store";
    },
  };
}
