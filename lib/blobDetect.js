function matches(buffer, offset, bytes) {
  if (buffer.length < offset + bytes.length) return false;
  for (let i = 0; i < bytes.length; i += 1) {
    if (buffer[offset + i] !== bytes[i]) return false;
  }
  return true;
}

function readAscii(buffer, offset, length) {
  return buffer.subarray(offset, offset + length).toString("ascii");
}

export function detectMime(buffer) {
  if (!buffer || buffer.length < 4) return "application/octet-stream";

  if (matches(buffer, 0, [0x89, 0x50, 0x4e, 0x47])) return "image/png";
  if (matches(buffer, 0, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (matches(buffer, 0, [0x47, 0x49, 0x46, 0x38])) return "image/gif";
  if (matches(buffer, 0, [0x42, 0x4d])) return "image/bmp";
  if (readAscii(buffer, 0, 4) === "RIFF" && readAscii(buffer, 8, 4) === "WEBP") return "image/webp";
  if (readAscii(buffer, 0, 4) === "RIFF" && readAscii(buffer, 8, 4) === "WAVE") return "audio/wav";
  if (readAscii(buffer, 0, 4) === "%PDF") return "application/pdf";
  if (matches(buffer, 0, [0x1a, 0x45, 0xdf, 0xa3])) return "video/webm";
  if (readAscii(buffer, 0, 3) === "ID3") return "audio/mpeg";
  if (matches(buffer, 0, [0xff, 0xfb]) || matches(buffer, 0, [0xff, 0xf3]) || matches(buffer, 0, [0xff, 0xf2])) return "audio/mpeg";
  if (readAscii(buffer, 0, 4) === "OggS") return "audio/ogg";
  if (buffer.length > 12 && readAscii(buffer, 4, 4) === "ftyp") {
    const brand = readAscii(buffer, 8, 4);
    if (brand.startsWith("M4A")) return "audio/mp4";
    return "video/mp4";
  }
  if (matches(buffer, 0, [0x1f, 0x8b])) return "application/gzip";
  if (readAscii(buffer, 0, 2) === "PK") return "application/zip";

  const sample = buffer.subarray(0, Math.min(buffer.length, 512));
  let printable = 0;
  for (let i = 0; i < sample.length; i += 1) {
    const byte = sample[i];
    if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) printable += 1;
  }
  if (printable / sample.length > 0.9) return "text/plain";

  return "application/octet-stream";
}

export function isPreviewableBinaryColumnType(type) {
  if (!type) return false;
  const normalized = String(type).toLowerCase();
  return ["blob", "longblob", "mediumblob", "tinyblob", "binary", "varbinary", "bytea"].some((needle) =>
    normalized.includes(needle)
  );
}
