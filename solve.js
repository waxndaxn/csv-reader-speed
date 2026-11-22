export function run(input) {
  const text = String(input.text);
  const header = input.header === true;
  const errors = [];
  const rows = [];
  let columns = null;
  let width = -1;
  let pos = text.charCodeAt(0) === 0xfeff ? 1 : 0;
  let line = 1;
  let recordLine = 1;
  let recordRow = null;

  while (true) {
    while (pos < text.length) {
      const code = text.charCodeAt(pos);
      if (code === 10) {
        pos++;
        line++;
      } else if (code === 13 && text.charCodeAt(pos + 1) === 10) {
        pos += 2;
        line++;
      } else {
        break;
      }
    }
    if (pos >= text.length) break;

    recordLine = line;
    recordRow = header && columns === null ? null : rows.length;
    const fields = [];
    let ended = 'line';
    let quoted = false;

    do {
      quoted = text.charCodeAt(pos) === 34;
      let value;
      if (!quoted) {
        const comma = text.indexOf(',', pos);
        const lf = text.indexOf('\n', pos);
        const cr = text.indexOf('\r', pos);
        let end = text.length;
        let kind = 'end';
        if (comma >= 0 && comma < end) {
          end = comma;
          kind = 'comma';
        }
        if (lf >= 0 && lf < end) {
          end = lf;
          kind = 'line';
        }
        if (cr >= 0 && cr < end) {
          end = cr;
          kind = text.charCodeAt(cr + 1) === 10 ? 'line' : 'stray';
        }
        if (kind === 'stray') {
          value = text.slice(pos, end);
          pos = end;
          while (pos < text.length && text.charCodeAt(pos) === 13 && text.charCodeAt(pos + 1) !== 10) {
            errors.push({ code: 'stray_cr', line: recordLine, row: recordRow });
            pos++;
            if (pos < text.length && text.charCodeAt(pos) === 13) continue;
            const nextComma = text.indexOf(',', pos);
            const nextLf = text.indexOf('\n', pos);
            const nextCr = text.indexOf('\r', pos);
            let next = text.length;
            if (nextComma >= 0 && nextComma < next) next = nextComma;
            if (nextLf >= 0 && nextLf < next) next = nextLf;
            if (nextCr >= 0 && nextCr < next) next = nextCr;
            value += text.slice(pos, next);
            pos = next;
          }
          if (pos >= text.length) ended = 'end';
          else if (text.charCodeAt(pos) === 44) { pos++; ended = 'comma'; }
          else if (text.charCodeAt(pos) === 10) { pos++; line++; ended = 'line'; }
          else if (text.charCodeAt(pos) === 13 && text.charCodeAt(pos + 1) === 10) { pos += 2; line++; ended = 'line'; }
          else ended = 'end';
        } else {
          value = text.slice(pos, end);
          pos = end;
          if (kind === 'comma') { pos++; ended = 'comma'; }
          else if (kind === 'line') {
            if (text.charCodeAt(pos) === 13) pos += 2;
            else pos++;
            line++;
            ended = 'line';
          } else ended = 'end';
        }
      } else {
        const open = pos;
        const openLine = line;
        pos++;
        let start = pos;
        let parts = null;
        let closed = false;
        while (pos < text.length) {
          const quote = text.indexOf('"', pos);
          const cr = text.indexOf('\r', pos);
          const lf = text.indexOf('\n', pos);
          let next = quote;
          if (next < 0 || (cr >= 0 && cr < next)) next = cr;
          if (next < 0 || (lf >= 0 && lf < next)) next = lf;
          if (next < 0) {
            pos = text.length;
            break;
          }
          if (next > start) {
            if (parts) {
              parts.push(text.slice(start, next));
              start = next;
            }
            pos = next;
          }
          const code = text.charCodeAt(pos);
          if (code === 34) {
            if (text.charCodeAt(pos + 1) === 34) {
              if (!parts) parts = [text.slice(start, pos)];
              parts.push('"');
              pos += 2;
              start = pos;
            } else {
              if (parts) parts.push(text.slice(start, pos));
              else value = text.slice(start, pos);
              pos++;
              closed = true;
              break;
            }
          } else if (code === 13) {
            if (!parts) parts = [text.slice(start, pos)];
            parts.push('\n');
            line++;
            pos += text.charCodeAt(pos + 1) === 10 ? 2 : 1;
            start = pos;
          } else {
            if (!parts) parts = [text.slice(start, pos)];
            parts.push('\n');
            line++;
            pos++;
            start = pos;
          }
        }
        if (!closed) {
          pos = open + 1;
          line = openLine;
          errors.push({ code: 'unterminated_quote', line: recordLine, row: recordRow });
          const comma = text.indexOf(',', pos);
          const lf = text.indexOf('\n', pos);
          const cr = text.indexOf('\r', pos);
          let end = text.length;
          if (comma >= 0 && comma < end) end = comma;
          if (lf >= 0 && lf < end) end = lf;
          if (cr >= 0 && cr < end) end = cr;
          value = '"' + text.slice(pos, end);
          pos = end;
          while (pos < text.length && text.charCodeAt(pos) === 13 && text.charCodeAt(pos + 1) !== 10) {
            errors.push({ code: 'stray_cr', line: recordLine, row: recordRow });
            pos++;
            const c = text.indexOf(',', pos), n = text.indexOf('\n', pos), r = text.indexOf('\r', pos);
            let e = text.length;
            if (c >= 0 && c < e) e = c;
            if (n >= 0 && n < e) e = n;
            if (r >= 0 && r < e) e = r;
            value += text.slice(pos, e);
            pos = e;
          }
          if (pos >= text.length) ended = 'end';
          else if (text.charCodeAt(pos) === 44) { pos++; ended = 'comma'; }
          else if (text.charCodeAt(pos) === 10) { pos++; line++; ended = 'line'; }
          else if (text.charCodeAt(pos) === 13 && text.charCodeAt(pos + 1) === 10) { pos += 2; line++; ended = 'line'; }
          else ended = 'end';
        } else {
          value = parts ? parts.join('') : value;
          if (pos >= text.length) ended = 'end';
          else if (text.charCodeAt(pos) === 44) { pos++; ended = 'comma'; }
          else if (text.charCodeAt(pos) === 10) { pos++; line++; ended = 'line'; }
          else if (text.charCodeAt(pos) === 13 && text.charCodeAt(pos + 1) === 10) { pos += 2; line++; ended = 'line'; }
          else {
            let added = false;
            while (pos < text.length) {
              const comma = text.indexOf(',', pos), lf = text.indexOf('\n', pos), cr = text.indexOf('\r', pos);
              let end = text.length;
              if (comma >= 0 && comma < end) end = comma;
              if (lf >= 0 && lf < end) end = lf;
              if (cr >= 0 && cr < end) end = cr;
              if (end > pos) {
                value += text.slice(pos, end);
                added = true;
                pos = end;
              }
              if (pos >= text.length) { ended = 'end'; break; }
              const code = text.charCodeAt(pos);
              if (code === 13 && text.charCodeAt(pos + 1) !== 10) {
                errors.push({ code: 'stray_cr', line: recordLine, row: recordRow });
                pos++;
                if (pos < text.length && text.charCodeAt(pos) === 13) continue;
                continue;
              }
              if (code === 44) { pos++; ended = 'comma'; break; }
              if (code === 10) { pos++; line++; ended = 'line'; break; }
              pos += 2;
              line++;
              ended = 'line';
              break;
            }
            if (added) errors.push({ code: 'quote_junk', line: recordLine, row: recordRow });
          }
        }
      }
      fields.push(value);
    } while (ended === 'comma');

    if (fields.length === 1 && fields[0] === '' && !quoted) continue;
    if (width < 0) width = fields.length;
    if (header && columns === null) {
      columns = fields;
      continue;
    }
    if (fields.length < width) {
      errors.push({ code: 'short_row', line: recordLine, row: recordRow, fields: fields.length });
      while (fields.length < width) fields.push('');
    } else if (fields.length > width) {
      errors.push({ code: 'long_row', line: recordLine, row: recordRow, extra: fields.splice(width) });
    }
    rows.push(fields);
  }
  return { columns: header ? (columns ?? []) : null, rows, errors };
}
