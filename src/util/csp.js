const shared = [
  // Restrict everything to the same origin by default.
  "default-src 'self';",
  // Allow connecting to WS servers and HTTP(S) servers.
  // We could be more restrictive and allow only RPC server URL.
  'connect-src http: https: ws: wss:;',
  // Allow framing any content from HTTP(S).
  // Again we could only allow embedding from RPC server URL.
  // (deprecated)
  "frame-src 'none';",
  // Allow framing and web workers from HTTP(S).
  "child-src 'self' http: https:;",
  // We allow data: blob: and HTTP(s) images.
  // We could get rid of wildcarding HTTP and only allow RPC server URL.
  // (http required for local dapps icons)
  "img-src 'self' 'unsafe-inline' file: data: blob: http: https:;",
  // Allow style from data: blob: and HTTPS.
  "style-src 'self' 'unsafe-inline' data: blob: https:;",
  // Allow fonts from data: and HTTPS.
  "font-src 'self' data: https:;",
  // Same restrictions as script-src with additional
  // blob: that is required for camera access (worker)
  "worker-src 'self' https: blob:;",
  // Disallow submitting forms from any dapps
  "form-action 'none';",
  // Never allow mixed content
  'block-all-mixed-content;'
];

// These are the CSP for the renderer process (aka the shell)
const rendererCsp = [
  ...shared,
  // Allow <webview> which are objects
  "object-src 'self';",
  // Allow scripts
  "script-src 'self';"
];

module.exports = {
  rendererCsp
};
