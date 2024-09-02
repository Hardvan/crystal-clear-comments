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
            `${workspaceFolder}/comment-report.html`
          );

          // Write the analysis report to the report file.
          vscode.workspace.fs
            .writeFile(reportFile, Buffer.from(generateReport(commentData)))
            .then(
              () => {
                // Show a success message when the report is successfully written.
                vscode.window.showInformationMessage(
                  "Comment analysis complete! Report generated at comment-report.html"
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

// This function generates an HTML report from the comment data.
function generateReport(commentData: { [line: number]: string[] }): string {
  const totalLines = Object.keys(commentData).length;
  const totalComments = Object.values(commentData).flat().length;
  const commentCoverage =
    totalLines > 0 ? (totalComments / totalLines) * 100 : 0;
  const avgCommentLength =
    totalComments > 0
      ? Object.values(commentData)
          .flat()
          .reduce((sum, comment) => sum + comment.length, 0) / totalComments
      : 0;

  let report = `
  <html>
  <head>
    <style>
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        border: 1px solid black;
        padding: 8px;
        text-align: left;
      }
      h2 {
        border-bottom: 1px solid #ccc;
        padding-bottom: 5px;
      }
      .metrics {
        margin-bottom: 20px;
      }
      .chart {
        width: 100%;
        height: 200px;
        border: 1px solid #ccc;
      }
    </style>
  </head>
  <body>
    <h1>Comment Analysis Report</h1>

    <div class="metrics">
      <h2>Comment Coverage Analysis</h2>
      <p><strong>Total Lines:</strong> ${totalLines}</p>
      <p><strong>Total Comments:</strong> ${totalComments}</p>
      <p><strong>Comment Coverage:</strong> ${commentCoverage.toFixed(2)}%</p>
      <!-- Placeholder for comment distribution visualization -->
      <div class="chart">
        <p><em>Comment distribution visualization will be added here.</em></p>
      </div>
    </div>

    <div class="metrics">
      <h2>Comment Quality Assessment</h2>
      <p><strong>Average Comment Length:</strong> ${avgCommentLength.toFixed(
        2
      )} characters</p>
      <!-- Placeholder for comment quality metrics -->
      <p><em>Additional comment quality metrics will be added here.</em></p>
    </div>

    <div class="metrics">
      <h2>Comment Density Visualization</h2>
      <!-- Placeholder for comment density heat map or chart -->
      <div class="chart">
        <p><em>Comment density heat map will be added here.</em></p>
      </div>
    </div>

    <h2>Comments by Line</h2>
    <table>
      <tr>
        <th>Line #</th>
        <th>Comment</th>
      </tr>`;

  // Iterate over the comment data and add it to the report.
  for (const [lineNumber, comments] of Object.entries(commentData)) {
    comments.forEach((comment) => {
      // Add each line and comment to the table.
      report += `
      <tr>
        <td>${parseInt(lineNumber) + 1}</td>
        <td>${escapeHtml(comment)}</td>
      </tr>`;
    });
  }

  report += `
    </table>
  </body>
  </html>`;

  return report;
}

// Helper function to escape HTML special characters
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
