import * as vscode from "vscode";

// The CommentAnalyzer class provides methods to analyze comments in code documents.
export class CommentAnalyzer {
  // Analyze comments in the given document and return a mapping of line numbers to comments,
  // along with the total number of comments and the total number of normal (non-blank, non-comment) lines.
  static analyze(document: vscode.TextDocument): {
    commentData: { [line: number]: string[] };
    totalComments: number;
    totalLines: number;
    totalNormalLines: number;
  } {
    const commentData: { [line: number]: string[] } = {};
    const languageId = document.languageId;

    let insideMultiLineComment = false;
    let buffer = "";
    let startLine = 0;
    let totalComments = 0;
    let totalLines = 0;
    let totalNormalLines = 0;

    // Iterate through each line of the document.
    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i).text.trim();
      totalLines++;

      if (line === "") {
        continue; // Skip blank lines
      }

      let isCommentLine = false;
      let j = 0;

      while (j < line.length) {
        const char = line[j];

        // Handle C/C++ single-line comments.
        if (languageId === "cpp" || languageId === "c") {
          // '/' detected
          if (!insideMultiLineComment && char === "/" && j + 1 < line.length) {
            const nextChar = line[j + 1];

            // Single-line comment detected "//"
            if (nextChar === "/") {
              buffer = "//";
              j += 2;
              while (j < line.length && line[j] !== "\n") {
                buffer += line[j];
                j++;
              }
              if (!commentData[i]) {
                commentData[i] = [];
              }
              commentData[i].push(buffer);
              totalComments++;
              buffer = "";
              isCommentLine = true;
              break;
            }

            // Multi-line comment detected "/*"
            if (nextChar === "*") {
              insideMultiLineComment = true;
              buffer = "/*";
              startLine = i;
              j += 2;
              isCommentLine = true;
              continue;
            }
          }

          // End of multi-line comment detected "*/"
          if (
            insideMultiLineComment &&
            char === "*" &&
            j + 1 < line.length &&
            line[j + 1] === "/"
          ) {
            insideMultiLineComment = false;
            buffer += "*/";
            if (!commentData[startLine]) {
              commentData[startLine] = [];
            }
            commentData[startLine].push(buffer);
            totalComments++;
            buffer = "";
            isCommentLine = true;
            j += 2;
            continue;
          }

          if (insideMultiLineComment) {
            buffer += char;
          }

          j++;
        } else if (languageId === "python" || languageId === "py") {
          // Handle Python single-line comments.
          // '#' detected
          if (!insideMultiLineComment && char === "#") {
            buffer = "#";
            j++;
            while (j < line.length && line[j] !== "\n") {
              buffer += line[j];
              j++;
            }
            if (!commentData[i]) {
              commentData[i] = [];
            }
            commentData[i].push(buffer);
            totalComments++;
            buffer = "";
            isCommentLine = true;
            break;
          }

          // Handle Python multi-line comments (triple quotes).
          // "'''" or '"""' detected
          if (
            !insideMultiLineComment &&
            (line.startsWith("'''") || line.startsWith('"""'))
          ) {
            insideMultiLineComment = true;
            buffer = line[j] + line[j + 1] + line[j + 2];
            startLine = i;
            j += 3;
            isCommentLine = true;
            continue;
          }

          // End of multi-line comment detected "'''" or '"""'
          if (
            insideMultiLineComment &&
            (line.includes("'''") || line.includes('"""'))
          ) {
            insideMultiLineComment = false;
            buffer += line.slice(j);
            if (!commentData[startLine]) {
              commentData[startLine] = [];
            }
            commentData[startLine].push(buffer);
            totalComments++;
            buffer = "";
            isCommentLine = true;
            break;
          }

          if (insideMultiLineComment) {
            buffer += char;
          }

          j++;
        }
      }

      // If the line is not a comment, count it as a normal line.
      if (!isCommentLine && !insideMultiLineComment) {
        totalNormalLines++;
      }

      // Handle a multi-line comment that spans multiple lines.
      if (insideMultiLineComment) {
        buffer += "\n";
      }
    }

    return { commentData, totalComments, totalLines, totalNormalLines };
  }
}
