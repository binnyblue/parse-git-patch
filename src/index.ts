const hashRegex = /^From (\S*)/
const authorRegex = /^From:\s?([^<].*[^>])?\s+(<(.*)>)?/
const fileNameRegex = /^diff --git "?a\/(.*)"?\s*"?b\/(.*)"?/
const fileLinesRegex = /^@@ -([0-9]*),?\S* \+([0-9]*),?/
const similarityIndexRegex = /^similarity index /
const addedFileModeRegex = /^new file mode /
const deletedFileModeRegex = /^deleted file mode /

export type ParsedPatchModifiedLineType = {
  added: boolean
  lineNumber: number
  line: string
}

export type ParsedPatchFileDataType = {
  added: boolean
  deleted: boolean
  beforeName: string
  afterName: string
  modifiedLines: ParsedPatchModifiedLineType[]
}

export type ParsedPatchType = {
  hash: string
  authorName: string
  authorEmail: string
  date: string
  message: string
  files: ParsedPatchFileDataType[]
}

function parseGitPatch(patch: string) {
  if (typeof patch !== 'string') {
    throw new Error('Expected first argument (patch) to be a string')
  }

  const lines = patch.split('\n')

  const hashLine = lines.shift()

  if (!hashLine) return null

  const match1 = hashLine.match(hashRegex)

  if (!match1) return null

  const [, hash] = match1
  const authorLine = lines.shift()

  if (!authorLine) return null

  const match2 = authorLine.match(authorRegex)

  if (!match2) return null

  const [, authorName,, authorEmail] = match2

  const dateLine = lines.shift()

  if (!dateLine) return null

  const [, date] = dateLine.split('Date: ')

  const messageLine = lines.shift()

  if (!messageLine) return null

  const [, message] = messageLine.split('Subject: ')

  const parsedPatch: ParsedPatchType = {
    hash,
    authorName,
    authorEmail,
    date,
    message,
    files: [],
  }

  splitIntoParts(lines, 'diff --git').forEach(diff => {
    const fileNameLine = diff.shift()

    if (!fileNameLine) return

    const match3 = fileNameLine.match(fileNameRegex)

    if (!match3) return

    const [, a, b] = match3
    const metaLine = diff.shift()

    if (!metaLine) return

    const fileData: ParsedPatchFileDataType = {
      added: false,
      deleted: false,
      beforeName: a.trim(),
      afterName: b.trim(),
      modifiedLines: [],
    }

    parsedPatch.files.push(fileData)

    if (addedFileModeRegex.test(metaLine)) {
      fileData.added = true
    }
    if (deletedFileModeRegex.test(metaLine)) {
      fileData.deleted = true
    }
    if (similarityIndexRegex.test(metaLine)) {
      return
    }

    splitIntoParts(diff, '@@ ').forEach(lines => {
      const fileLinesLine = lines.shift()

      if (!fileLinesLine) return

      const match4 = fileLinesLine.match(fileLinesRegex)

      if (!match4) return

      const [, a, b] = match4

      let nA = parseInt(a)
      let nB = parseInt(b)

      lines.forEach(line => {
        nA++
        nB++

        if (line.startsWith('-- ')) {
          return
        }
        if (line.startsWith('+')) {
          nA--

          fileData.modifiedLines.push({
            added: true,
            lineNumber: nB,
            line: line.substr(1),
          })
        }
        else if (line.startsWith('-')) {
          nB--

          fileData.modifiedLines.push({
            added: false,
            lineNumber: nA,
            line: line.substr(1),
          })
        }
      })
    })
  })

  return parsedPatch
}

function splitIntoParts(lines: string[], separator: string) {
  const parts = []
  let currentPart: string[] | undefined

  lines.forEach(line => {
    if (line.startsWith(separator)) {
      if (currentPart) {
        parts.push(currentPart)
      }

      currentPart = [line]
    }
    else if (currentPart) {
      currentPart.push(line)
    }
  })

  if (currentPart) {
    parts.push(currentPart)
  }

  return parts
}

export default parseGitPatch
