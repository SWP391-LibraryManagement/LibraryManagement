const fs = require('fs');
const path = require('path');
const YAML = require('yamljs');

const migrationPath = path.join(
  __dirname,
  '..',
  '..',
  'database',
  'migrations',
  '2026-07-19-fe10-otp-templates.sql'
);
const openApiPath = path.join(__dirname, '..', 'src', 'docs', 'openapi.yaml');

// @spec BR-FE10-010 FR-FE10-001 FR-FE10-002 FR-FE10-009 AC-FE10-001 AC-FE10-002
test('FE10 OTP template migration is idempotent and removes the superseded link contract', () => {
  expect(fs.existsSync(migrationPath)).toBe(true);
  const source = fs.readFileSync(migrationPath, 'utf8');

  expect(source).toMatch(/SET\s+XACT_ABORT\s+ON/i);
  expect(source).toMatch(/BEGIN\s+TRANSACTION/i);
  expect(source).toMatch(/COMMIT\s+TRANSACTION/i);
  expect(source).toMatch(/WHERE\s+TemplateCode\s*=\s*'ACCOUNT_VERIFICATION'/i);
  expect(source).toMatch(/WHERE\s+TemplateCode\s*=\s*'PASSWORD_RESET'/i);
  expect(source).toMatch(/\{\{otp\}\}/);
  expect(source).toMatch(/\{\{expiresInMinutes\}\}/);
  expect(source).not.toMatch(/verificationLink|resetLink/i);
});

// @spec BR-FE10-005 BR-FE10-010 BR-FE10-011 FR-FE10-005 FR-FE10-009 AC-FE10-006
test('OpenAPI separates staff HTTP requests from the internal FE02 OTP contract', () => {
  const document = YAML.load(openApiPath);
  const operation = document.paths['/api/notifications/requests'].post;
  const httpSchema = operation.requestBody.content['application/json'].schema;
  const sensitiveSchema = document.components.schemas.SensitiveOtpNotificationRequest;

  expect(httpSchema.properties.type.enum).toEqual([
    'RESERVATION_AVAILABLE',
    'DUE_DATE_REMINDER',
    'OVERDUE_NOTICE',
    'FINE_NOTICE',
    'GENERAL_SYSTEM',
  ]);
  expect(httpSchema.properties.sourceFeature).toBeUndefined();
  expect(operation.description).toContain('Sensitive authentication notifications');

  expect(sensitiveSchema).toEqual(
    expect.objectContaining({
      type: 'object',
      additionalProperties: false,
      required: expect.arrayContaining([
        'type',
        'channel',
        'recipientEmail',
        'templateKey',
        'templateData',
        'sourceEntityType',
        'sourceEntityId',
        'idempotencyKey',
      ]),
    })
  );
  expect(sensitiveSchema.properties.templateData.required).toEqual([
    'otp',
    'expiresInMinutes',
  ]);
  expect(sensitiveSchema.properties.templateData.properties.otp).toEqual(
    expect.objectContaining({ type: 'string', pattern: '^\\d{6}$' })
  );
});
