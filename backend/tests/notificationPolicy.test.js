describe('notificationPolicy', () => {
  test('redacts nested secrets while sanitizing safe string values', () => {
    const { containsSensitivePayloadKey, sanitizePayload } = require('../src/utils/notificationPolicy');
    const payload = {
      title: '<b>Ready</b>',
      nested: {
        reset_link: 'https://example.test/reset?token=secret',
        details: [{ oneTimePassword: '123456' }, { barcode: '<COPY-01>' }],
      },
    };

    expect(containsSensitivePayloadKey(payload)).toBe(true);
    expect(sanitizePayload(payload)).toEqual({
      title: 'bReady/b',
      nested: {
        reset_link: '[REDACTED]',
        details: [{ oneTimePassword: '[REDACTED]' }, { barcode: 'COPY-01' }],
      },
    });
  });

  test('rejects unsafe stored template definitions with the existing public error', () => {
    const { validateStoredTemplateDefinition } = require('../src/utils/notificationPolicy');

    let caughtError;
    try {
      validateStoredTemplateDefinition({
        subject: 'Reservation ready',
        body: '<img src=x onerror=alert(1)>',
      });
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toMatchObject({
      statusCode: 400,
      code: 'UNSAFE_TEMPLATE_DEFINITION',
      message: 'Notification template definition is unsafe.',
    });
  });

  test('renders known variables, removes missing values, and strips markup delimiters', () => {
    const { extractVariables, renderTemplate } = require('../src/utils/notificationPolicy');
    const template = 'Hello {{ memberName }}, copy {{barcode}} is at {{location}}.';

    expect(extractVariables(template)).toEqual(['memberName', 'barcode', 'location']);
    expect(
      renderTemplate(template, {
        memberName: '<Demo Member>',
        barcode: 'COPY-01',
      })
    ).toBe('Hello Demo Member, copy COPY-01 is at .');
  });
});
