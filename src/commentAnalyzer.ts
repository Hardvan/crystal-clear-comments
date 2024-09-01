import * as vscode from "vscode";

export class CommentAnalyzer {
  static analyze(document: vscode.TextDocument) {
    const commentData: { [line: number]: string[] } = {};

    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      if (
        line.text.trim().startsWith("//") ||
        line.text.trim().startsWith("/*")
      ) {
        if (!commentData[i]) {
          commentData[i] = [];
        }
        commentData[i].push(line.text.trim());
      }
    }

    return commentData;
  }
}
