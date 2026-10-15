function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function downloadImageAsPdf(jpegDataUrl, width, height, fileName) {
  const base64 = jpegDataUrl.split(",")[1];
  const imageBytes = base64ToUint8Array(base64);

  const chunks = [];
  const offsets = [];
  let cursor = 0;

  function push(text) {
    const bytes = typeof text === "string" ? new TextEncoder().encode(text) : text;
    chunks.push(bytes);
    cursor += bytes.length;
  }

  function addObject(text) {
    offsets.push(cursor);
    push(text);
  }

  push("%PDF-1.4\n");

  addObject(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);
  addObject(`2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`);
  addObject(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  );
  addObject(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`
  );
  push(imageBytes);
  push(`\nendstream\nendobj\n`);
  const content = `q ${width} 0 0 ${height} 0 0 cm /Im0 Do Q`;
  addObject(`5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`);

  const xrefStart = cursor;
  let xref = `xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((offset) => {
    xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  push(xref);
  push(`trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);

  const blob = new Blob(chunks, { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
