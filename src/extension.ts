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
        const { commentData, totalComments, totalNormalLines } =
          CommentAnalyzer.analyze(document);

        // Calculate comment coverage as a percentage.
        const commentCoverage =
          totalNormalLines > 0 ? (totalComments / totalNormalLines) * 100 : 0;

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
            .writeFile(
              reportFile,
              Buffer.from(
                generateReport(commentData, totalComments, commentCoverage)
              )
            )
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

function getAvgCommentLength(commentData: {
  [line: number]: { range: string; type: string; comments: string[] };
}) {
  let totalLength = 0;
  let totalComments = 0;

  for (const line in commentData) {
    const { comments } = commentData[line];
    for (const comment of comments) {
      totalLength += comment.length;
      totalComments++;
    }
  }

  return totalComments > 0 ? totalLength / totalComments : 0;
}

// This function generates an HTML report from the comment data.
function generateReport(
  commentData: {
    [line: number]: { range: string; type: string; comments: string[] };
  },
  totalComments: number,
  commentCoverage: number
): string {
  const avgCommentLength = getAvgCommentLength(commentData);

  let report = `
  <html>
  <head>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
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
      <p><strong>Total Comments:</strong> ${totalComments}</p>
      <p><strong>Comment Coverage:</strong> ${commentCoverage.toFixed(
        2
      )}% of normal lines</p>
      <canvas id="commentDistributionChart"></canvas>
    </div>

    <div class="metrics">
      <h2>Comment Density Visualization</h2>
      <p><strong>Average Comment Length:</strong> ${avgCommentLength.toFixed(
        2
      )} characters</p>
      <canvas id="commentLengthChart"></canvas>
    </div>

    <h2>Comment Details</h2>
    <table>
      <thead>
        <tr>
          <th>Line Range</th>
          <th>Comment Type</th>
          <th>Comments</th>
        </tr>
      </thead>
      <tbody>`;

  for (const line in commentData) {
    const { range, type, comments } = commentData[line];
    report += `<tr><td>${range}</td><td>${type}</td><td>${comments.join(
      "<br>"
    )}</td></tr>`;
  }

  report += `
      </tbody>
    </table>

    <script>
      const commentData = ${JSON.stringify(commentData)};

      const commentDistributionLabels = Object.keys(commentData).map(
        line => 'Line ' + (parseInt(line) + 1)
      );
      const commentDistributionData = Object.values(commentData).map(
        comments => comments.comments.length
      );

      new Chart(document.getElementById('commentDistributionChart'), {
        type: 'bar',
        data: {
          labels: commentDistributionLabels,
          datasets: [{
            label: 'Number of Comments',
            data: commentDistributionData,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });

      const commentLengthLabels = Object.keys(commentData).map(
        line => 'Line ' + (parseInt(line) + 1)
      );
      const commentLengthData = Object.values(commentData).map(
        comments => comments.comments.reduce((acc, comment) => acc + comment.length, 0) / comments.comments.length
      );

      new Chart(document.getElementById('commentLengthChart'), {
        type: 'line',
        data: {
          labels: commentLengthLabels,
          datasets: [{
            label: 'Average Comment Length',
            data: commentLengthData,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    </script>
  </body>
  </html>`;

  return report;
}

// This function is called when the extension is deactivated.
export function deactivate() {}
