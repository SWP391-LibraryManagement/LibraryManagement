const errors = require('./safeErrors');

const sensitiveQueueIdentifiers = new Set([
  'ACCOUNT_VERIFICATION',
  'PASSWORD_RESET',
  'ACCOUNT_SETUP',
  'EMAIL_VERIFY',
]);
const sensitiveKeyFragments = [
  'token',
  'otp',
  'password',
  'verificationlink',
  'resetlink',
  'setuplink',
];

function sanitizeString(value) {
  return String(value ?? '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/[<>]/g, '');
}

function normalizePayloadKey(key) {
  return String(key || '')
    .toLowerCase()
    .replace(/[_\-\s]/g, '');
}

function isSensitivePayloadKey(key) {
  const normalizedKey = normalizePayloadKey(key);
  return sensitiveKeyFragments.some((fragment) => normalizedKey.includes(fragment));
}

function containsSensitivePayloadKey(payload) {
  if (Array.isArray(payload)) {
    return payload.some(containsSensitivePayloadKey);
  }

  if (!payload || typeof payload !== 'object') {
    return false;
  }

  return Object.entries(payload).some(
    ([key, value]) => isSensitivePayloadKey(key) || containsSensitivePayloadKey(value)
  );
}

function sanitizePayload(payload) {
  if (Array.isArray(payload)) {
    return payload.map(sanitizePayload);
  }

  if (!payload || typeof payload !== 'object') {
    return typeof payload === 'string' ? sanitizeString(payload) : payload;
  }

  const result = {};

  for (const [key, value] of Object.entries(payload)) {
    if (isSensitivePayloadKey(key)) {
      result[key] = '[REDACTED]';
      continue;
    }

    result[key] = sanitizePayload(value);
  }

  return result;
}

function normalizeSourceFeature(sourceFeature) {
  return String(sourceFeature || '').trim().toUpperCase();
}

function isValidRecipientEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));
}

function isSensitiveQueueNotification(notification) {
  return [notification?.type, notification?.templateKey].some((identifier) =>
    sensitiveQueueIdentifiers.has(String(identifier || '').toUpperCase())
  );
}

function extractVariables(templateText) {
  const variables = new Set();
  const pattern = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
  let match = pattern.exec(templateText || '');

  while (match) {
    variables.add(match[1]);
    match = pattern.exec(templateText || '');
  }

  return Array.from(variables);
}

function containsUnsafeTemplateDefinition(value) {
  const definition = String(value ?? '');
  return (
    /<\/?[a-z][^>]*>/i.test(definition)
    || /\bon[a-z]+\s*=/i.test(definition)
    || /\bjavascript\s*:/i.test(definition)
  );
}

// @spec BR-FE10-010, FR-FE10-005, FR-FE10-009
function validateStoredTemplateDefinition(template) {
  if (
    containsUnsafeTemplateDefinition(template?.subject)
    || containsUnsafeTemplateDefinition(template?.body)
  ) {
    throw errors.badRequest(
      'UNSAFE_TEMPLATE_DEFINITION',
      'Notification template definition is unsafe.'
    );
  }
}

function renderTemplate(templateText, templateData) {
  return sanitizeString(
    String(templateText || '').replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key) =>
      templateData[key] === undefined || templateData[key] === null ? '' : templateData[key]
    )
  );
}

module.exports = {
  containsSensitivePayloadKey,
  extractVariables,
  isSensitiveQueueNotification,
  isValidRecipientEmail,
  normalizePayloadKey,
  normalizeSourceFeature,
  renderTemplate,
  sanitizePayload,
  validateStoredTemplateDefinition,
};
