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
        const {
          commentData,
          totalComments,
          totalLines,
          totalNormalLines,
          totalNonBlankLines,
        } = CommentAnalyzer.analyze(document);

        // Calculate comment coverage as a percentage.
        const commentCoverage =
          (100 * getTotalCommentLines(commentData)) / totalNonBlankLines;

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
                generateReport(
                  commentData,
                  totalComments,
                  totalLines,
                  commentCoverage
                )
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

function getTotalCommentLines(commentData: {
  [line: number]: { range: string; type: string; comments: string[] };
}) {
  // Sum up the range values
  // If '-' is present in the range, split the range and sum the values
  // If '-' is not present, add 1 to the total
  let total = 0;
  for (const line in commentData) {
    const range = commentData[line].range;
    if (range.includes("-")) {
      const [start, end] = range.split("-");
      total += parseInt(end) - parseInt(start) + 1;
    } else {
      total++;
    }
  }
  return total;
}

// This function generates an HTML report from the comment data.
function generateReport(
  commentData: {
    [line: number]: { range: string; type: string; comments: string[] };
  },
  totalComments: number,
  totalLines: number,
  commentCoverage: number
): string {
  const avgCommentLength = getAvgCommentLength(commentData);
  const totalCommentLines = getTotalCommentLines(commentData);
  const totalSingleLineComments = Object.values(commentData).filter(
    (comment) => comment.type === "single-line"
  ).length;
  const totalMultiLineComments = Object.values(commentData).filter(
    (comment) => comment.type === "multi-line"
  ).length;

  // Initialize arrays for chart data
  const commentLengthLabels: string[] = [];
  const commentLengthData: number[] = new Array(totalLines).fill(0);

  // Populate commentLengthData and commentLengthLabels
  for (let i = 0; i < totalLines; i++) {
    commentLengthLabels.push(`Line ${i + 1}`);
    if (commentData[i]) {
      commentLengthData[i] =
        commentData[i].comments.reduce(
          (acc, comment) => acc + comment.length,
          0
        ) / commentData[i].comments.length;
    }
  }

  let report = `
  <html>
  <head>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
        color: #333;
      }
      h1, h2 {
        color: #444;
      }
      .container {
        width: 90%;
        margin: auto;
        padding: 20px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
      }
      th, td {
        border: 1px solid #ddd;
        padding: 10px;
        text-align: left;
      }
      th {
        background-color: #f2f2f2;
      }
      .charts {
        display: flex;
        justify-content: space-between;
        gap: 20px;
      }
      .chart {
        flex: 1;
        min-width: 0;
        height: 300px;
        margin-top: 20px;
        margin-bottom: 20px;
      }
      .metrics {
        background-color: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
      .note {
        font-size: 0.8em;
        color: #777;
      }
      .comment-details {
        margin-top: 80px;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Comment Analysis Report</h1>

      <div class="metrics">
        <h2>Comment Coverage Analysis</h2>
        <p><strong>Total Lines:</strong> ${totalLines}</p>
        <p><strong>Total Comments:</strong> ${totalComments} (Single Line: ${totalSingleLineComments}, Multi Line: ${totalMultiLineComments})</p>
        <p><strong>Total Comment Lines:</strong> ${totalCommentLines}</p>
        <p><strong>Total Normal Lines:</strong> ${
          totalLines - totalCommentLines
        }</p>
        <p><strong>Comment Coverage:</strong> ${commentCoverage.toFixed(2)}%</p>
        <p class="note">Comment coverage is the % of lines that are comments out of the total non-blank lines.</p>
        <p class="note">Note: Normal lines are lines that are not comments or empty, i.e., lines with code or text.</p>
      </div>

      <div class="charts">
        <div class="chart">
          <h2>Comment Types Distribution</h2>
          <canvas id="commentTypesChart"></canvas>
        </div>
        <div class="chart">
          <h2>Average Comment Length</h2>
          <canvas id="commentLengthChart"></canvas>
        </div>
      </div>

      <h2 class="comment-details">Comment Details</h2>
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

        // Chart for Comment Types Distribution
        new Chart(document.getElementById('commentTypesChart'), {
          type: 'pie',
          data: {
            labels: ['Single-line Comments', 'Multi-line Comments'],
            datasets: [{
              label: 'Comment Types',
              data: [${totalSingleLineComments}, ${totalMultiLineComments}],
              backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(153, 102, 255, 0.6)'],
              borderColor: ['rgba(255, 99, 132, 1)', 'rgba(153, 102, 255, 1)'],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true
          }
        });

        // Chart for Comment Length
        new Chart(document.getElementById('commentLengthChart'), {
          type: 'line',
          data: {
            labels: ${JSON.stringify(commentLengthLabels)},
            datasets: [{
              label: 'Average Comment Length',
              data: ${JSON.stringify(commentLengthData)},
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
    </div>
  </body>
  </html>`;

  return report;
}

// This function is called when the extension is deactivated.
export function deactivate() {}
