import * as vscode from "vscode";

export class CommentAnalyzer {
  static analyze(document: vscode.TextDocument): { [line: number]: string[] } {
    const commentData: { [line: number]: string[] } = {};
    const languageId = document.languageId;
    console.log(`Detected language: ${languageId}`);

    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);

      if (this.isCommentLine(line.text, languageId)) {
        if (!commentData[i]) {
          commentData[i] = [];
        }
        commentData[i].push(line.text.trim());
      }
    }

    return commentData;
  }

  private static isCommentLine(text: string, languageId: string): boolean {
    const trimmedText = text.trim();

    // Notify about language id detection in vscode notification
    vscode.window.showInformationMessage("Detected language: " + languageId);

    switch (languageId) {
      case "cpp":
      case "c":
        return (
          trimmedText.startsWith("//") ||
          trimmedText.startsWith("/*") ||
          trimmedText.endsWith("*/")
        );
      case "python":
      case "py":
        // Check for single-line comments
        if (trimmedText.startsWith("#")) {
          return true;
        }
        // Multi-line docstrings (handled across multiple lines)
        // Adjust to check if the line contains any part of a docstring
        return trimmedText.includes("'''") || trimmedText.includes('"""');
      default:
        return false;
    }
  }
}
