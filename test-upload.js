
const fs = require('fs');
async function test() {
  const form = new FormData();
  form.append('name', 'Test User');
  form.append('email', 'test@example.com');
  form.append('phone', '0241111111');
  form.append('product', 'Test Product');
  form.append('filename', 'test-doc.txt');
  form.append('file', new Blob(['test content']), 'test-doc.txt');
  
  const res = await fetch('http://localhost:4000/api/print-jobs', {
    method: 'POST',
    body: form
  });
  console.log(await res.json());
}
test();

