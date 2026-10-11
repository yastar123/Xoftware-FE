import React from "react";

export function renderWhatsappText(input) {
  const text = (input ?? "").toString();
  const lines = text.split("\n");

  return lines.map((line, i) => (
    <React.Fragment key={`wa-line-${i}`}>
      {parseInline(line)}
      {i < lines.length - 1 ? <br /> : null}
    </React.Fragment>
  ));
}

function parseInline(line) {
  // 1) parse formatting dulu (code -> bold -> italic -> strike)
  const tokens = tokenize(line, [
    { type: "code", re: /`([^`]+)`/g },
    { type: "bold", re: /\*([^*\n]+)\*/g },
    { type: "italic", re: /_([^_\n]+)_/g },
    { type: "strike", re: /~([^~\n]+)~/g },
  ]);

  // 2) render token -> React nodes, dan untuk token text, pecah lagi jadi link
  return tokens.flatMap((t, idx) => {
    const key = `${t.type}-${idx}`;

    if (t.type === "text") {
      return linkifyText(t.value, key);
    }

    if (t.type === "bold") return [<strong key={key}>{linkifyText(t.value, key)}</strong>];
    if (t.type === "italic") return [<em key={key}>{linkifyText(t.value, key)}</em>];
    if (t.type === "strike") return [<s key={key}>{linkifyText(t.value, key)}</s>];

    if (t.type === "code") {
      // code TIDAK di-linkify
      return [
        <code
          key={key}
          style={{
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            fontSize: "0.95em",
            padding: "0.12em 0.35em",
            borderRadius: 3,
            background: "rgba(0, 0, 0, 0.06)",
          }}
        >
          {t.value}
        </code>,
      ];
    }

    return [<React.Fragment key={key}>{t.value}</React.Fragment>];
  });
}

/**
 * Deteksi URL dan ubah jadi <a>
 * - support: http(s)://..., www....
 * - aman: target blank + rel
 */
function linkifyText(text, baseKey) {
  if (!text) return [<React.Fragment key={`${baseKey}-t0`}></React.Fragment>];

  // Regex URL sederhana (bisa kamu kencengin kalau perlu)
  const urlRe = /((https?:\/\/|www\.)[^\s<>()]+[^\s<>().,!?])/gi;

  const out = [];
  let last = 0;
  let m;
  let i = 0;

  while ((m = urlRe.exec(text)) !== null) {
    const start = m.index;
    const rawUrl = m[0];

    if (start > last) {
      out.push(
        <React.Fragment key={`${baseKey}-t${i++}`}>
          {text.slice(last, start)}
        </React.Fragment>
      );
    }

    const href = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;

    out.push(
      <a
        key={`${baseKey}-a${i++}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "#1976d2", textDecoration: "underline" }}
        onClick={(e) => e.stopPropagation()} // biar gak ke-trigger click card/dialog parent
      >
        {rawUrl}
      </a>
    );

    last = start + rawUrl.length;
  }

  if (last < text.length) {
    out.push(
      <React.Fragment key={`${baseKey}-t${i++}`}>
        {text.slice(last)}
      </React.Fragment>
    );
  }

  return out;
}

function tokenize(text, rules) {
  let out = [{ type: "text", value: text }];

  for (const rule of rules) {
    const next = [];

    for (const token of out) {
      if (token.type !== "text") {
        next.push(token);
        continue;
      }

      const s = token.value;
      let last = 0;
      let m;
      rule.re.lastIndex = 0;

      while ((m = rule.re.exec(s)) !== null) {
        const start = m.index;
        const end = start + m[0].length;

        if (start > last) next.push({ type: "text", value: s.slice(last, start) });
        next.push({ type: rule.type, value: m[1] });
        last = end;
      }

      if (last < s.length) next.push({ type: "text", value: s.slice(last) });
    }

    out = next;
  }

  return out;
}
