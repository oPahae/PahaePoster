import { useRef } from "react";
import { highlightCode } from "../../lib/codeHighlight";

export default function CodeEditor({ value, onChange, filename }) {
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);
  const gutterRef = useRef(null);

  const lines = value.split("\n");

  function syncScroll() {
    const textarea = textareaRef.current;
    if (highlightRef.current) {
      highlightRef.current.scrollTop = textarea.scrollTop;
      highlightRef.current.scrollLeft = textarea.scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = textarea.scrollTop;
    }
  }

  function handleKeyDown(event) {
    const textarea = textareaRef.current;
    const { selectionStart, selectionEnd } = textarea;

    if (event.key === "Tab") {
      event.preventDefault();
      if (event.shiftKey) {
        const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
        if (value.slice(lineStart, lineStart + 2) === "  ") {
          const nextValue = value.slice(0, lineStart) + value.slice(lineStart + 2);
          onChange(nextValue);
          requestAnimationFrame(() => textarea.setSelectionRange(selectionStart - 2, selectionEnd - 2));
        }
        return;
      }
      const nextValue = value.slice(0, selectionStart) + "  " + value.slice(selectionEnd);
      onChange(nextValue);
      requestAnimationFrame(() => textarea.setSelectionRange(selectionStart + 2, selectionStart + 2));
      return;
    }

    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "k") {
      event.preventDefault();
      const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
      let lineEnd = value.indexOf("\n", selectionStart);
      lineEnd = lineEnd === -1 ? value.length : lineEnd + 1;
      const nextValue = value.slice(0, lineStart) + value.slice(lineEnd);
      onChange(nextValue);
      requestAnimationFrame(() => textarea.setSelectionRange(lineStart, lineStart));
    }
  }

  return (
    <div className="flex h-full">
      <div
        ref={gutterRef}
        className="select-none overflow-hidden bg-base-950 px-3 py-3 text-right font-mono text-xs leading-6 text-base-600"
      >
        {lines.map((_, index) => (
          <div key={index}>{index + 1}</div>
        ))}
      </div>
      <div className="relative flex-1">
        <pre
          ref={highlightRef}
          className="pointer-events-none absolute inset-0 overflow-auto whitespace-pre px-3 py-3 font-mono text-xs leading-6 text-base-100"
          dangerouslySetInnerHTML={{ __html: highlightCode(value, filename) + "\n" }}
        />
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={syncScroll}
          spellCheck={false}
          wrap="off"
          className="absolute inset-0 h-full w-full resize-none overflow-auto whitespace-pre bg-transparent px-3 py-3 font-mono text-xs leading-6 text-transparent caret-base-100 outline-none"
        />
      </div>
    </div>
  );
}
