import * as vscode from "vscode";

// The CommentAnalyzer class provides methods to analyze comments in code documents.
export class CommentAnalyzer {
  // Analyze comments in the given document and return a mapping of line numbers to comments.
  static analyze(document: vscode.TextDocument): { [line: number]: string[] } {
    const commentData: { [line: number]: string[] } = {};
    const languageId = document.languageId;

    // Iterate through each line of the document.
    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);

      // Check if the line contains a comment based on the language ID.
      if (this.isCommentLine(line.text, languageId)) {
        // Initialize the entry for the line if it does not exist.
        if (!commentData[i]) {
          commentData[i] = [];
        }
        // Add the comment to the corresponding line number.
        commentData[i].push(line.text.trim());
      }
    }

    return commentData;
  }

  // Determine if a line of text is a comment based on the language ID.
  private static isCommentLine(text: string, languageId: string): boolean {
    const trimmedText = text.trim();

    // Notify about detected language ID for debugging purposes.
    vscode.window.showInformationMessage(`Detected language ID: ${languageId}`);

    // Check if the line is a comment based on the language ID.
    switch (languageId) {
      case "cpp":
      case "c":
        // C++ and C comments: single-line (//) and multi-line (/* ... */).
        return (
          trimmedText.startsWith("//") ||
          trimmedText.startsWith("/*") ||
          trimmedText.endsWith("*/")
        );
      case "python":
      case "py":
        // Python comments: single-line (#) and multi-line docstrings (''' ... ''' or """ ... """).
        // Check for single-line comments.
        if (trimmedText.startsWith("#")) {
          return true;
        }
        // Check for multi-line docstrings.
        return trimmedText.includes("'''") || trimmedText.includes('"""');
      default:
        // Return false if the language is not supported.
        return false;
    }
  }
}
