const fs = require('fs');
let code = fs.readFileSync('components/sections/Services.js', 'utf8');

const regex = /className=\{\`group relative z-30 flex flex-col overflow-hidden transition-all duration-\[380ms\] \\\[transition-timing-function:cubic-bezier\\\(0\.16,1,0\.3,1\\\)\\\] hover:border-brand-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600 \$\{\n\s*site\.showInfinity \n\s*\? "border-2 border-transparent bg-white\\\/\[0\.04\] p-6 xl:p-8 text-center hover:shadow-\[0_22px_50px_rgba\\\(57,105,159,0\.20\\\)\] aspect-square w-\[min\\\(280px,100%\\\)\] shrink-0 lg:w-\[var\\\(--service-size\\\)\\\] rounded-full items-center justify-center" \n\s*: "border border-white\\\/10 bg-slate-900\\\/50 backdrop-blur-2xl p-6 sm:p-8 hover:shadow-\[0_22px_50px_rgba\\\(57,105,159,0\.20\\\)\] aspect-square w-\[min\\\(320px,100%\\\)\] mx-auto rounded-full items-center justify-center text-center"\n\s*\}\`\}/;

const backupRegex = /className=\{\`group relative z-30 flex flex-col overflow-hidden transition-all duration-\[380ms\][^]*?text-center"\n\s*\}\`\}/;

const replacement = `className={\`group relative z-30 flex flex-col transition-all duration-[380ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:border-brand-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600 \${
        site.showInfinity 
          ? "border-2 border-transparent bg-white/[0.04] p-6 xl:p-8 text-center hover:shadow-[0_22px_50px_rgba(57,105,159,0.20)] aspect-square w-[min(280px,100%)] shrink-0 lg:w-[var(--service-size)] rounded-full items-center justify-center overflow-hidden" 
          : "border border-white/10 p-6 sm:p-8 hover:shadow-[0_22px_50px_rgba(57,105,159,0.20)] aspect-square w-[min(320px,100%)] mx-auto rounded-full items-center justify-center text-center"
      }\`}
    >
      {!site.showInfinity && (
        <div 
          className="pointer-events-none absolute inset-0 z-0 rounded-full" 
          style={{ 
            backgroundColor: 'rgba(15, 23, 42, 0.4)', 
            backdropFilter: 'blur(32px)', 
            WebkitBackdropFilter: 'blur(32px)' 
          }} 
        />
      )}`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    console.log("Patched with regex");
} else if (backupRegex.test(code)) {
    code = code.replace(backupRegex, replacement);
    console.log("Patched with backupRegex");
} else {
    console.log("Regex failed");
}

fs.writeFileSync('components/sections/Services.js', code);
