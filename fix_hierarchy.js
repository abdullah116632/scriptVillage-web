const fs = require('fs');
let code = fs.readFileSync('app/page.js', 'utf8');

const regex = /<main>\n\s*<HeroOrb \/>\n\s*{\/\* Desktop:[^]*?\*\/}\n\s*<Hero \/>\n\s*<CoverSheet>/;
const newCode = `<main>
        {/* Desktop: hero + strip fill one screen. The hero scrolls away normally while
            the strip stays pinned at the bottom of the screen, and the next section
            slides up over it like a sheet. Phones scroll normally. */}
        <Hero />

        <CoverSheet>
          <HeroOrb />`;

if (regex.test(code)) {
    code = code.replace(regex, newCode);
    console.log("Hierarchy patched.");
} else {
    console.log("Hierarchy regex failed.");
}

fs.writeFileSync('app/page.js', code);
