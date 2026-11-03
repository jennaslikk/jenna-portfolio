<script>
 let { value = '', label, placeholder = 'Add text', limit = 2000, multiline = true, onchange = () => {} } = $props();
 let element = $state();

 function readText() {
  // Uppercase headings are a visual style, not a change to the entered wording.
  const transform = element.style.textTransform;
  element.style.textTransform = 'none';
  const text = element.innerText;
  element.style.textTransform = transform;
  return text;
 }

 // Update incoming text only when it differs, so typing keeps the cursor in place.
 $effect(() => {
  if (element && readText() !== value) element.innerText = value;
 });

 function update() {
  const entered = readText();
  let text = entered.replace(/\r\n/g, '\n');
  if (!multiline) text = text.replace(/\n/g, ' ');
  if (text.length > limit) text = text.slice(0, limit);
  if (text !== entered) element.innerText = text;
  onchange(text);
 }

 function paste(event) {
  // Insert plain text only; pasted formatting and markup never become project content.
  event.preventDefault();
  const selection = window.getSelection();
  if (!selection?.rangeCount) return;
  const range = selection.getRangeAt(0);
  if (!element.contains(range.commonAncestorContainer)) return;
  range.deleteContents();
  const text = document.createTextNode(event.clipboardData.getData('text/plain'));
  range.insertNode(text);
  range.setStartAfter(text);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  update();
 }
</script>

<span bind:this={element} class="inline-text" contenteditable="plaintext-only" role="textbox" tabindex="0" aria-label={label} aria-multiline={multiline} data-placeholder={placeholder} oninput={update} onpaste={paste} onkeydown={event => {
 if (event.key === 'Enter' && !multiline) { event.preventDefault(); element.blur(); }
}}></span>

<style>
 .inline-text{white-space:pre-wrap;overflow-wrap:normal;word-break:normal;hyphens:none;cursor:text;}
 .inline-text:empty::before{content:attr(data-placeholder);opacity:0.5;}
 .inline-text:hover,.inline-text:focus-visible{outline-width:1px;outline-style:dashed;outline-color:#75436e;outline-offset:4px;}
</style>
