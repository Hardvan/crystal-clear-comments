import * as vscode from "vscode";

// The CommentAnalyzer class provides methods to analyze comments in code documents.
export class CommentAnalyzer {
  static analyze(document: vscode.TextDocument): {
    commentData: {
      [line: number]: { range: string; type: string; comments: string[] };
    };
    totalComments: number; // Total no. of comments in the document
    totalLines: number; // Total no. of lines in the document
    totalNormalLines: number; // Total no. of lines that are not comments or empty, i.e., code lines
    totalNonBlankLines: number; // Total no. of lines that are not empty (code lines + comments)
    languageDetected: string; // Language detected in the document(Eg: C, C++, Python, etc.)
    inputFileContents: string; // Original contents of the input file
    inputFileExtension: string; // Extension of the input file (Eg: .c, .cpp, .py, etc.)
  } {
    // commentData is a dictionary that stores the comments in the document
    const commentData: {
      [line: number]: { range: string; type: string; comments: string[] };
    } = {};

    // Get the languageId of the document
    const languageId = document.languageId;

    // Language detected in the document (C, C++, Python, etc.)
    let languageDetected = getLanguageDetected(languageId);

    let insideMultiLineComment = false;
    let buffer = "";
    let startLine = 0;
    let totalComments = 0;
    let totalLines = 0; // Total lines in the document
    let totalNonBlankLines = 0; // Lines that are not empty
    let totalNormalLines = 0; // Lines that are not comments or empty

    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i).text.trim();
      totalLines++;

      if (line === "") {
        continue;
      }

      totalNonBlankLines++;

      let isCommentLine = false;
      let j = 0;

      while (j < line.length) {
        const char = line[j];

        // Check for comments in C, C++, Java, JavaScript
        if (
          languageId === "c" ||
          languageId === "cpp" ||
          languageId === "java" ||
          languageId === "javascript"
        ) {
          // '/' detected
          if (!insideMultiLineComment && char === "/" && j + 1 < line.length) {
            const nextChar = line[j + 1];

            // '//' detected, single line comment starts
            if (nextChar === "/") {
              buffer = "//";
              j += 2;
              while (j < line.length && line[j] !== "\n") {
                buffer += line[j];
                j++;
              }
              // If no commentData for the line, create a new entry
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

            // '/*' detected, multi-line comment starts
            if (nextChar === "*") {
              insideMultiLineComment = true;
              buffer = "/*";
              startLine = i;
              j += 2;
              isCommentLine = true;
              continue;
            }
          }

          // '*/' detected, multi-line comment ends
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

          // Add the character to the buffer if inside a multi-line comment
          if (insideMultiLineComment) {
            buffer += char;
          }

          j++;
        }

        // Check for comments in Python
        else if (languageId === "python" || languageId === "py") {
          // '#' detected
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

          // ''' or """ detected, multi-line comment starts
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
          // ''' or """ detected, multi-line comment ends
          if (
            insideMultiLineComment &&
            (line.includes("'''") || line.includes('"""'))
          ) {
            insideMultiLineComment = false;
            buffer += line.slice(j);
            // If no commentData for the line, create a new entry
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

          // Add the character to the buffer if inside a multi-line comment
          if (insideMultiLineComment) {
            buffer += char;
          }

          j++;
        }
      }

      // If the line is not a comment line, increment totalNormalLines
      if (!isCommentLine && !insideMultiLineComment) {
        totalNormalLines++;
      }

      // If inside a multi-line comment, add a newline character to the buffer
      if (insideMultiLineComment) {
        buffer += "\n";
      }
    }

    // Original contents of the input file
    let inputFileContents = document.getText();

    // Extension of the input file (Eg: .c, .cpp, .py, etc.)
    let inputFileExtension = getInputFileExtension(languageId);

    return {
      commentData,
      totalComments,
      totalLines,
      totalNormalLines,
      totalNonBlankLines,
      languageDetected,
      inputFileContents,
      inputFileExtension,
    };
  }
}

// Helper function to get the language detected in the document
function getLanguageDetected(languageId: string) {
  switch (languageId) {
    case "c":
      return "C";
    case "cpp":
      return "C++";
    case "python":
    case "py":
      return "Python";
    case "javascript":
    case "js":
      return "JavaScript";
    case "java":
      return "Java";
    default:
      return "Unknown Language";
  }
}

// Helper function to get the extension of the input file
function getInputFileExtension(languageId: string) {
  switch (languageId) {
    case "c":
      return ".c";
    case "cpp":
      return ".cpp";
    case "python":
    case "py":
      return ".py";
    case "javascript":
      return ".js";
    case "java":
      return ".java";
    default:
      return ".txt";
  }
}

// Function to get the word cloud data from the comment data
export function getWordCloudData(commentData: {
  [line: number]: { range: string; type: string; comments: string[] };
}) {
  const wordCounts: { [word: string]: number } = {};
  for (const line in commentData) {
    for (const comment of commentData[line].comments) {
      const words = comment.split(/\s+/);
      for (const word of words) {
        const cleanedWord = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
        if (cleanedWord) {
          wordCounts[cleanedWord] = (wordCounts[cleanedWord] || 0) + 1;
        }
      }
    }
  }
  return wordCounts;
}
