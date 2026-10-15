const LANGUAGES = {
  shell: {
    commentStyle: "hash",
    control: ["if", "then", "else", "elif", "fi", "for", "while", "do", "done", "case", "esac", "until", "select", "shift", "return", "exit"],
    declare: ["function", "local", "export", "read", "source", "readonly", "declare"],
    literal: ["true", "false"]
  },
  python: {
    commentStyle: "hash",
    control: ["if", "elif", "else", "for", "while", "try", "except", "finally", "with", "raise", "yield", "break", "continue", "pass", "return", "and", "or", "not", "is", "in", "as"],
    declare: ["def", "class", "import", "from", "lambda", "global", "nonlocal", "async", "await", "self"],
    literal: ["None", "True", "False"]
  },
  javascript: {
    commentStyle: "slash",
    control: ["if", "else", "for", "while", "switch", "case", "break", "continue", "try", "catch", "finally", "throw", "return", "typeof", "instanceof"],
    declare: ["function", "const", "let", "var", "class", "import", "export", "from", "async", "await", "new", "this", "default"],
    literal: ["null", "undefined", "true", "false"]
  },
  conf: {
    commentStyle: "hash",
    control: [],
    declare: ["server", "location", "listen", "include", "upstream", "worker_processes", "user"],
    literal: ["true", "false", "yes", "no", "on", "off"]
  },
  generic: {
    commentStyle: "hash",
    control: ["if", "else", "for", "while", "return", "switch", "case", "break", "continue"],
    declare: ["function", "class", "import", "export", "def", "const", "let", "var"],
    literal: ["true", "false", "null"]
  }
};

function pickLanguage(filename = "") {
  const extension = (filename.split(".").pop() || "").toLowerCase();
  if (["sh", "bash", "zsh", "profile", "bashrc", "bash_profile"].includes(extension)) return LANGUAGES.shell;
  if (["py"].includes(extension)) return LANGUAGES.python;
  if (["js", "jsx", "ts", "tsx", "json"].includes(extension)) return LANGUAGES.javascript;
  if (["conf", "cfg", "ini", "yml", "yaml", "toml", "env"].includes(extension)) return LANGUAGES.conf;
  return LANGUAGES.generic;
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function classify(word, language) {
  if (language.control.includes(word)) return "text-accent font-medium";
  if (language.declare.includes(word)) return "text-signal-blue font-medium";
  if (language.literal.includes(word)) return "text-signal-rose font-medium";
  return null;
}

function isWordStart(char) {
  return /[A-Za-z_]/.test(char);
}

function isWordChar(char) {
  return /[A-Za-z0-9_]/.test(char);
}

function highlightLine(line, language) {
  let output = "";
  let index = 0;
  const length = line.length;

  while (index < length) {
    const char = line[index];

    if (char === '"' || char === "'" || char === "`") {
      let cursor = index + 1;
      while (cursor < length && line[cursor] !== char) cursor += 1;
      const end = cursor < length ? cursor + 1 : cursor;
      const raw = line.slice(index, end);
      output += `<span class="text-signal-amber">${escapeHtml(raw)}</span>`;
      index = end;
      continue;
    }

    if (language.commentStyle === "hash" && char === "#") {
      output += `<span class="text-base-500 italic">${escapeHtml(line.slice(index))}</span>`;
      break;
    }

    if (language.commentStyle === "slash" && char === "/" && line[index + 1] === "/") {
      output += `<span class="text-base-500 italic">${escapeHtml(line.slice(index))}</span>`;
      break;
    }

    if (isWordStart(char)) {
      let cursor = index + 1;
      while (cursor < length && isWordChar(line[cursor])) cursor += 1;
      const word = line.slice(index, cursor);
      const colorClass = classify(word, language);
      output += colorClass ? `<span class="${colorClass}">${escapeHtml(word)}</span>` : escapeHtml(word);
      index = cursor;
      continue;
    }

    if (/[0-9]/.test(char)) {
      let cursor = index + 1;
      while (cursor < length && /[0-9.]/.test(line[cursor])) cursor += 1;
      const word = line.slice(index, cursor);
      output += `<span class="text-signal-violet">${escapeHtml(word)}</span>`;
      index = cursor;
      continue;
    }

    output += escapeHtml(char);
    index += 1;
  }

  return output;
}

export function highlightCode(text, filename) {
  const language = pickLanguage(filename);
  return text
    .split("\n")
    .map((line) => highlightLine(line, language))
    .join("\n");
}
