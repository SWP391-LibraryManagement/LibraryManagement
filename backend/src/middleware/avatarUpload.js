const errors = require('../utils/safeErrors');

const AVATAR_FIELD_NAME = 'avatar';
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const MAX_MULTIPART_BYTES = MAX_AVATAR_BYTES + 64 * 1024;

function parseContentDisposition(value = '') {
  return Object.fromEntries(
    value
      .split(';')
      .slice(1)
      .map((part) => part.trim().match(/^([^=]+)="?([^"]*)"?$/))
      .filter(Boolean)
      .map((match) => [match[1].toLowerCase(), match[2]])
  );
}

function splitMultipart(buffer, boundary) {
  const delimiter = Buffer.from(`--${boundary}`);
  const parts = [];
  let cursor = buffer.indexOf(delimiter);

  while (cursor !== -1) {
    const next = buffer.indexOf(delimiter, cursor + delimiter.length);

    if (next === -1) {
      break;
    }

    const part = buffer.subarray(cursor + delimiter.length, next);
    parts.push(part);
    cursor = next;
  }

  return parts;
}

function parseAvatarFile(buffer, boundary) {
  const parts = splitMultipart(buffer, boundary);

  for (const rawPart of parts) {
    let part = rawPart;

    if (part.subarray(0, 2).toString() === '\r\n') {
      part = part.subarray(2);
    }

    if (part.subarray(0, 2).toString() === '--') {
      continue;
    }

    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
    if (headerEnd === -1) {
      continue;
    }

    const headerText = part.subarray(0, headerEnd).toString('utf8');
    let body = part.subarray(headerEnd + 4);

    if (body.subarray(body.length - 2).toString() === '\r\n') {
      body = body.subarray(0, body.length - 2);
    }

    const headers = Object.fromEntries(
      headerText.split('\r\n').map((line) => {
        const separator = line.indexOf(':');
        return [line.slice(0, separator).toLowerCase(), line.slice(separator + 1).trim()];
      })
    );
    const disposition = parseContentDisposition(headers['content-disposition']);

    if (disposition.name !== AVATAR_FIELD_NAME || !disposition.filename) {
      continue;
    }

    return {
      buffer: body,
      originalName: disposition.filename,
      mimeType: headers['content-type'] || '',
      size: body.length,
    };
  }

  return null;
}

function avatarUpload(req, res, next) {
  const contentType = req.headers['content-type'] || '';
  const boundaryMatch = contentType.match(/multipart\/form-data;\s*boundary=(?:"([^"]+)"|([^;]+))/i);
  const boundary = boundaryMatch?.[1] || boundaryMatch?.[2];

  if (!boundary) {
    return next(errors.badRequest('INVALID_AVATAR_UPLOAD', 'Avatar upload must use multipart form-data.'));
  }

  const chunks = [];
  let totalBytes = 0;
  let tooLarge = false;

  req.on('data', (chunk) => {
    totalBytes += chunk.length;

    if (totalBytes > MAX_MULTIPART_BYTES) {
      tooLarge = true;
      return;
    }

    if (!tooLarge) {
      chunks.push(chunk);
    }
  });

  req.on('error', (error) => {
    return next(errors.badRequest('INVALID_AVATAR_UPLOAD', 'Avatar upload could not be read.'));
  });

  req.on('end', () => {
    if (tooLarge) {
      return next(errors.badRequest('AVATAR_FILE_TOO_LARGE', 'Avatar file must be at most 2 MB.'));
    }

    try {
      const avatarFile = parseAvatarFile(Buffer.concat(chunks), boundary);

      if (!avatarFile) {
        return next(errors.badRequest('AVATAR_FILE_REQUIRED', 'Avatar file is required.'));
      }

      req.avatarFile = avatarFile;
      return next();
    } catch (error) {
      return next(errors.badRequest('INVALID_AVATAR_UPLOAD', 'Avatar upload could not be parsed.'));
    }
  });
}

module.exports = {
  avatarUpload,
  MAX_AVATAR_BYTES,
};
