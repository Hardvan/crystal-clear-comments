import * as vscode from "vscode";

// The CommentAnalyzer class provides methods to analyze comments in code documents.
export class CommentAnalyzer {
  // Analyze comments in the given document and return a mapping of line numbers to comments.
  static analyze(document: vscode.TextDocument): { [line: number]: string[] } {
    const commentData: { [line: number]: string[] } = {};
    const languageId = document.languageId;

    if (languageId !== "cpp" && languageId !== "c") {
      return commentData;
    }

    let insideMultiLineComment = false;
    let buffer = "";
    let startLine = 0;

    // Iterate through each line of the document.
    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i).text;
      let j = 0;

      while (j < line.length) {
        const char = line[j];

        if (!insideMultiLineComment && char === "/" && j + 1 < line.length) {
          const nextChar = line[j + 1];

          // Detect start of single-line comment.
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
            buffer = "";
            break;
          }

          // Detect start of multi-line comment.
          if (nextChar === "*") {
            insideMultiLineComment = true;
            buffer = "/*";
            startLine = i;
            j += 2;
            continue;
          }
        }

        // Detect end of multi-line comment.
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
          buffer = "";
          j += 2;
          continue;
        }

        // Add characters to buffer if inside a multi-line comment.
        if (insideMultiLineComment) {
          buffer += char;
        }

        j++;
      }

      // Handle a multi-line comment that spans multiple lines.
      if (insideMultiLineComment) {
        buffer += "\n";
      }
    }

    return commentData;
  }
}
