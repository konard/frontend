import { readFileSync, writeFileSync, existsSync } from 'fs';

const tsFile = '.houdini/plugins/houdini-svelte/runtime/session.ts';
const jsFile = '.houdini/plugins/houdini-svelte/runtime/session.js';

function patchFile(file, oldStr, newStr) {
    if (!existsSync(file)) {
        console.log(`[patch-houdini] ${file} not found, skipping`);
        return;
    }
    let src = readFileSync(file, 'utf-8');
    if (src.includes(newStr)) {
        console.log(`[patch-houdini] ${file} already patched`);
        return;
    }
    if (!src.includes(oldStr)) {
        console.warn(`[patch-houdini] WARNING: ${file} unexpected format, trying regex`);
        src = src.replace(
            /function extractSession\([^)]+\)[^{]*\{([^}]*?)return val\[sessionKeyName\]/s,
            (m, pre) => m.replace('return val[sessionKeyName]', 'if (!val) return undefined as any\n\treturn val[sessionKeyName]')
        );
    } else {
        src = src.replace(oldStr, newStr);
    }
    writeFileSync(file, src);
    console.log(`[patch-houdini] ${file} patched: added null guard to extractSession`);
}

// Patch session.ts (Vite loads this directly, main entry is index.ts)
patchFile(
    tsFile,
    '\treturn val[sessionKeyName]\n}',
    '\tif (!val) return undefined as any\n\treturn val[sessionKeyName]\n}'
);

// Patch session.js (fallback, in case Node.js resolves JS)
patchFile(
    jsFile,
    'function extractSession(val) {\n  return val[sessionKeyName];\n}',
    'function extractSession(val) {\n  if (!val) return undefined;\n  return val[sessionKeyName];\n}'
);
