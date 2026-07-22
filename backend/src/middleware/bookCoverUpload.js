const errors = require('../utils/safeErrors');

const COVER_FIELD_NAME = 'cover';
const METADATA_FIELD_NAME = 'metadata';
const MAX_COVER_BYTES = 2 * 1024 * 1024;
const MAX_MULTIPART_BYTES = MAX_COVER_BYTES + 64 * 1024;

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
    if (next === -1) break;
    parts.push(buffer.subarray(cursor + delimiter.length, next));
    cursor = next;
  }

  return parts;
}

function parsePart(rawPart) {
  let part = rawPart;
  if (part.subarray(0, 2).toString() === '\r\n') part = part.subarray(2);
  if (part.subarray(0, 2).toString() === '--') return null;

  const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
  if (headerEnd === -1) return null;

  const headerText = part.subarray(0, headerEnd).toString('utf8');
  let body = part.subarray(headerEnd + 4);
  if (body.subarray(body.length - 2).toString() === '\r\n') body = body.subarray(0, body.length - 2);

  const headers = Object.fromEntries(
    headerText.split('\r\n').map((line) => {
      const separator = line.indexOf(':');
      return [line.slice(0, separator).toLowerCase(), line.slice(separator + 1).trim()];
    })
  );

  return {
    disposition: parseContentDisposition(headers['content-disposition']),
    mimeType: headers['content-type'] || '',
    body,
  };
}

function parseBookMultipart(buffer, boundary) {
  let metadata;
  let coverFile = null;

  for (const rawPart of splitMultipart(buffer, boundary)) {
    const part = parsePart(rawPart);
    if (!part?.disposition?.name) continue;

    if (part.disposition.name === METADATA_FIELD_NAME && !part.disposition.filename) {
      if (metadata !== undefined) throw new Error('Duplicate metadata field.');
      metadata = JSON.parse(part.body.toString('utf8'));
      continue;
    }

    if (part.disposition.name === COVER_FIELD_NAME && part.disposition.filename) {
      if (coverFile) throw new Error('Only one cover file is allowed.');
      coverFile = {
        buffer: part.body,
        originalName: part.disposition.filename,
        mimeType: part.mimeType,
        size: part.body.length,
      };
      continue;
    }

    throw new Error('Unsupported multipart field.');
  }

  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new Error('Book metadata is required.');
  }

  return { metadata, coverFile };
}

// @spec BR-FE05-019, FR-FE05-027
function bookCoverUpload(req, _res, next) {
  const contentType = req.headers['content-type'] || '';
  if (!/^multipart\/form-data\b/i.test(contentType)) {
    req.bookCoverFile = null;
    return next();
  }

  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  const boundary = boundaryMatch?.[1] || boundaryMatch?.[2]?.trim();
  if (!boundary) {
    return next(errors.badRequest('INVALID_BOOK_COVER_UPLOAD', 'Book cover upload must include a multipart boundary.'));
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
    chunks.push(chunk);
  });

  req.on('error', () => next(errors.badRequest('INVALID_BOOK_COVER_UPLOAD', 'Book cover upload could not be read.')));
  req.on('end', () => {
    if (tooLarge) {
      return next(errors.badRequest('BOOK_COVER_TOO_LARGE', 'Book cover image must be at most 2 MB.'));
    }

    try {
      const parsed = parseBookMultipart(Buffer.concat(chunks), boundary);
      req.body = parsed.metadata;
      req.bookCoverFile = parsed.coverFile;
      return next();
    } catch {
      return next(errors.badRequest('INVALID_BOOK_COVER_UPLOAD', 'Book cover upload could not be parsed.'));
    }
  });
}

module.exports = {
  bookCoverUpload,
  MAX_COVER_BYTES,
};
