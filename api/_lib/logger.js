/**
 * Logger estruturado para API routes.
 * Output: JSON para stdout (capturado pela Vercel como logs estruturados).
 *
 * Cada log inclui: timestamp, level, requestId, endpoint, message + campos extras.
 */

let _requestId = null;
let _endpoint = null;

/** Define contexto do request atual (chamado pelo withLogger) */
function setContext(requestId, endpoint) {
  _requestId = requestId;
  _endpoint = endpoint;
}

function _log(level, message, extra = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    requestId: _requestId,
    endpoint: _endpoint,
    message,
    ...extra,
  };
  // Remove campos undefined/null para manter log limpo
  Object.keys(entry).forEach(k => {
    if (entry[k] === undefined || entry[k] === null) delete entry[k];
  });
  console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
    JSON.stringify(entry)
  );
}

const info  = (message, extra) => _log('info', message, extra);
const warn  = (message, extra) => _log('warn', message, extra);
const error = (message, extra) => _log('error', message, extra);

module.exports = { info, warn, error, setContext };
