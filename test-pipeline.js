const text = 'Figure 1. 1 Burning';
let t = text;
t = t.replace(/([^\.\?\!\:;])\n+/g, '$1 ');
t = t.replace(/\n+/g, ' ');
t = t.replace(/\s{2,}/g, ' ');
t = t.replace(/(^|\s)n(?=[A-Za-z])/g, '$1');
t = t.replace(/\b([B-Z])\s+([a-z]{2,})\b/g, '$1$2');
t = t.replace(/(\d+)\.\s+(\d+)/g, '$1.$2');
console.log('Result:', t);
