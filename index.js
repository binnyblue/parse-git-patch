const fileNameRegex = /^diff --git "?a\/(.*)"?\s*"?\sb\/(.*)"?/
    files: [],
      modifiedLines: [],
        nA++
        nB++
        if (line.startsWith('+')) {
          nA--
          nB--