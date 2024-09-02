import * as vscode from "vscode";

// The CommentAnalyzer class provides methods to analyze comments in code documents.
export class CommentAnalyzer {
  static analyze(document: vscode.TextDocument): {
    commentData: {
      [line: number]: { range: string; type: string; comments: string[] };
    };
    totalComments: number;
    totalLines: number;
    totalNormalLines: number;
  } {
    const commentData: {
      [line: number]: { range: string; type: string; comments: string[] };
    } = {};
    const languageId = document.languageId;

    let insideMultiLineComment = false;
    let buffer = "";
    let startLine = 0;
    let totalComments = 0;
    let totalLines = 0;
    let totalNormalLines = 0;

    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i).text.trim();
      totalLines++;

      if (line === "") {
        continue;
      }

      let isCommentLine = false;
      let j = 0;

      while (j < line.length) {
        const char = line[j];

        if (languageId === "cpp" || languageId === "c") {
          if (!insideMultiLineComment && char === "/" && j + 1 < line.length) {
            const nextChar = line[j + 1];

            if (nextChar === "/") {
              buffer = "//";
              j += 2;
              while (j < line.length && line[j] !== "\n") {
                buffer += line[j];
                j++;
              }
              if (!commentData[i]) {
                commentData[i] = {
                  range: `${i + 1}`,
                  type: "single-line",
                  comments: [],
                };
              }
              commentData[i].comments.push(buffer);
              totalComments++;
              buffer = "";
              isCommentLine = true;
              break;
            }

            if (nextChar === "*") {
              insideMultiLineComment = true;
              buffer = "/*";
              startLine = i;
              j += 2;
              isCommentLine = true;
              continue;
            }
          }

          if (
            insideMultiLineComment &&
            char === "*" &&
            j + 1 < line.length &&
            line[j + 1] === "/"
          ) {
            insideMultiLineComment = false;
            buffer += "*/";
            if (!commentData[startLine]) {
              commentData[startLine] = {
                range: `${startLine + 1}-${i + 1}`,
                type: "multi-line",
                comments: [],
              };
            }
            commentData[startLine].comments.push(buffer);
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
          if (!insideMultiLineComment && char === "#") {
            buffer = "#";
            j++;
            while (j < line.length && line[j] !== "\n") {
              buffer += line[j];
              j++;
            }
            if (!commentData[i]) {
              commentData[i] = {
                range: `${i + 1}`,
                type: "single-line",
                comments: [],
              };
            }
            commentData[i].comments.push(buffer);
            totalComments++;
            buffer = "";
            isCommentLine = true;
            break;
          }

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

          if (
            insideMultiLineComment &&
            (line.includes("'''") || line.includes('"""'))
          ) {
            insideMultiLineComment = false;
            buffer += line.slice(j);
            if (!commentData[startLine]) {
              commentData[startLine] = {
                range: `${startLine + 1}-${i + 1}`,
                type: "multi-line",
                comments: [],
              };
            }
            commentData[startLine].comments.push(buffer);
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

      if (!isCommentLine && !insideMultiLineComment) {
        totalNormalLines++;
      }

      if (insideMultiLineComment) {
        buffer += "\n";
      }
    }

    return { commentData, totalComments, totalLines, totalNormalLines };
  }
}
