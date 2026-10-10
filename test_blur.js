const fs = require('fs');
let code = fs.readFileSync('components/sections/Services.js', 'utf8');

const regex = /style=\{\{\n\s*transform: tilt\.isHovered\n\s*\? `perspective\(1000px\) rotateX\(\$\{tilt\.rotateX\}deg\) rotateY\(\$\{tilt\.rotateY\}deg\) translateY\(-8px\)`\n\s*: "perspective\(1000px\) rotateX\(0deg\) rotateY\(0deg\) translateY\(0px\)",/g;

const newStyle = `style={{
        transform: tilt.isHovered
          ? \`perspective(1000px) rotateX(\${tilt.rotateX}deg) rotateY(\${tilt.rotateY}deg) translateY(-8px)\`
          : "translateY(0px)",`;

code = code.replace(regex, newStyle);
fs.writeFileSync('components/sections/Services.js', code);
console.log("Patched");
