const fs = require('fs');
const content = fs.readFileSync('c:/Users/bingi/medo-veda/frontend/src/pages/AnalysisReport.jsx', 'utf8');

function checkJSX(code) {
  let stack = [];
  const tagRegex = /<(\/?[a-zA-Z0-9\.]+)(?:\s+[^>]*?)?(\/?)>/g;
  let match;
  
  while ((match = tagRegex.exec(code)) !== null) {
    const tagName = match[1];
    const isClosing = tagName.startsWith('/');
    const isSelfClosing = match[2] === '/';
    
    if (isSelfClosing) continue;
    
    if (isClosing) {
      const actualTag = tagName.substring(1);
      if (stack.length === 0) {
        console.log(`Error: Extra closing tag </${actualTag}> at index ${match.index}`);
        return false;
      }
      const lastTag = stack.pop();
      if (lastTag !== actualTag) {
        console.log(`Error: Mismatched tag. Expected </${lastTag}> but found </${actualTag}> at index ${match.index}`);
        return false;
      }
    } else {
      stack.push(tagName);
    }
  }
  
  if (stack.length > 0) {
    console.log(`Error: Unclosed tags: ${stack.join(', ')}`);
    return false;
  }
  
  console.log('JSX tags are balanced!');
  return true;
}

checkJSX(content);
