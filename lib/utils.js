export function defaultPortFor(type) {
  return type === "mysql" ? 3306 : 5432;
}

export function formatDuration(ms) {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

export function safeJsonParse(text) {
  try {
    return { value: JSON.parse(text), error: null };
  } catch (error) {
    return { value: null, error: error.message };
  }
}

export function inferJsonStructure(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    return value.length > 0 ? [inferJsonStructure(value[0])] : [];
  }
  if (typeof value === "object") {
    const shape = {};
    Object.keys(value).forEach((key) => {
      shape[key] = inferJsonStructure(value[key]);
    });
    return shape;
  }
  return typeof value;
}
