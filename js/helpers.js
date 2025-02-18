function getSystemInfo() {
  var gl;
  var renderer;

  try {
    gl =
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl") ||
      canvas.getContext("webgl2");

    if (gl) {
      var unmaskedInfo = getUnmaskedInfo(gl);
      renderer = unmaskedInfo.renderer;
    }
  } catch (e) {
    console.log(e);
  }

  var systemInfo = {
    minRam: navigator.deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
    renderer: renderer,
  };

  return JSON.stringify(systemInfo);
}

function getUnmaskedInfo(gl) {
  var unMaskedInfo = {
    renderer: "",
    vendor: "",
  };

  var dbgRenderInfo = gl.getExtension("WEBGL_debug_renderer_info");
  if (dbgRenderInfo != null) {
    unMaskedInfo.renderer = gl.getParameter(
      dbgRenderInfo.UNMASKED_RENDERER_WEBGL
    );
    unMaskedInfo.vendor = gl.getParameter(dbgRenderInfo.UNMASKED_VENDOR_WEBGL);
  }

  return unMaskedInfo;
}
