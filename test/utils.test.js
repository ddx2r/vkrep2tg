const test = require('node:test');
const assert = require('node:assert/strict');

const { escapeHtml } = require('../src/utils');

test('escapeHtml escapes all HTML-significant characters', () => {
  assert.equal(
    escapeHtml(`<script>alert("x") & 'y'</script>`),
    '&lt;script&gt;alert(&quot;x&quot;) &amp; &#039;y&#039;&lt;/script&gt;'
  );
});

test('escapeHtml stringifies non-string input', () => {
  assert.equal(escapeHtml(123), '123');
  assert.equal(escapeHtml(null), 'null');
});
