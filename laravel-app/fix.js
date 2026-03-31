const fs = require('fs');
let code = fs.readFileSync('resources/js/app.jsx', 'utf8');
code = code.replace(/window\.location\.href = [^;]+;/, 'window.location.href = window.location.pathname + "?v=" + Date.now();');
fs.writeFileSync('resources/js/app.jsx', code);
