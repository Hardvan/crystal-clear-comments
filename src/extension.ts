import * as vscode from "vscode";
import { CommentAnalyzer } from "./commentAnalyzer";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "extension.analyzeComments",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const document = editor.document;
        const commentData = CommentAnalyzer.analyze(document);

        if (vscode.workspace.workspaceFolders) {
          const workspaceFolder =
            vscode.workspace.workspaceFolders[0].uri.fsPath;
          const reportFile = vscode.Uri.file(
            `${workspaceFolder}/comment-report.md`
          );
          vscode.workspace.fs
            .writeFile(reportFile, Buffer.from(generateReport(commentData)))
            .then(
              () => {
                vscode.window.showInformationMessage(
                  "Comment analysis complete! Report generated."
                );
              },
              (err) => {
                vscode.window.showErrorMessage(
                  `Failed to write report: ${err.message}`
                );
              }
            );
        } else {
          vscode.window.showErrorMessage("No workspace folder is open.");
        }
      }
    }
  );

  context.subscriptions.push(disposable);
}

function generateReport(commentData: { [line: number]: string[] }): string {
  let report = "# Comment Analysis Report\n\n";
  report += "| Line # | Comment |\n";
  report += "|--------|---------|\n";

  for (const [lineNumber, comments] of Object.entries(commentData)) {
    comments.forEach((comment) => {
      report += `| ${parseInt(lineNumber) + 1} | ${comment} |\n`;
    });
  }

  return report;
}
