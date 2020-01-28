const authorRegex = /^From:\s?([^<].*[^>])?\s+(<(.*)>)?/
const fileNameRegex = /^diff --git a\/(\S*)\s*b\/(\S*)/
const fileLinesRegex = /^@@ -([0-9]*),?\S* \+([0-9]*),?/
  const [, authorName,, authorEmail] = authorLine.match(authorRegex)