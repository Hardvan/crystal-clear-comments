import * as vscode from "vscode";
import { CommentAnalyzer } from "./commentAnalyzer";

// This function is called when the extension is activated.
export function activate(context: vscode.ExtensionContext) {
  // Register the command "extension.analyzeComments" with VSCode.
  let disposable = vscode.commands.registerCommand(
    "extension.analyzeComments",
    () => {
      // Get the active text editor.
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        // Get the document from the editor.
        const document = editor.document;

        // Analyze comments in the document using the CommentAnalyzer class.
        const commentData = CommentAnalyzer.analyze(document);

        // Check if there are any workspace folders open.
        if (vscode.workspace.workspaceFolders) {
          // Get the path of the first workspace folder.
          const workspaceFolder =
            vscode.workspace.workspaceFolders[0].uri.fsPath;

          // Define the path for the report file.
          const reportFile = vscode.Uri.file(
            `${workspaceFolder}/comment-report.md`
          );

          // Write the analysis report to the report file.
          vscode.workspace.fs
            .writeFile(reportFile, Buffer.from(generateReport(commentData)))
            .then(
              () => {
                // Show a success message when the report is successfully written.
                vscode.window.showInformationMessage(
                  "Comment analysis complete! Report generated at comment-report.md"
                );
              },
              (err) => {
                // Show an error message if writing the report fails.
                vscode.window.showErrorMessage(
                  `Failed to write report: ${err.message}`
                );
              }
            );
        } else {
          // Show an error message if no workspace folder is open.
          vscode.window.showErrorMessage("No workspace folder is open.");
        }
      }
    }
  );

  // Add the command to the list of disposables so it can be cleaned up when the extension is deactivated.
  context.subscriptions.push(disposable);
}

// This function generates a markdown report from the comment data.
function generateReport(commentData: { [line: number]: string[] }): string {
  let report = "# Comment Analysis Report\n\n";
  report += "| Line # | Comment |\n";
  report += "|--------|---------|\n";

  // Iterate over the comment data and add it to the report.
  for (const [lineNumber, comments] of Object.entries(commentData)) {
    comments.forEach((comment) => {
      report += `| ${parseInt(lineNumber) + 1} | ${comment} |\n`;
    });
  }

  return report;
}
