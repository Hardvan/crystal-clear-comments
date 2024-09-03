import * as vscode from "vscode";
import { CommentAnalyzer, getWordCloudData } from "./commentAnalyzer";

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
          languageDetected,
          inputFileContents,
          inputFileExtension,
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
                  commentCoverage,
                  languageDetected,
                  inputFileContents,
                  inputFileExtension
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
  commentCoverage: number,
  languageDetected: string,
  inputFileContents: string,
  inputFileExtension: string
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
    commentLengthLabels.push(`${i + 1}`);
    if (commentData[i]) {
      commentLengthData[i] =
        commentData[i].comments.reduce(
          (acc, comment) => acc + comment.length,
          0
        ) / commentData[i].comments.length;
    }
  }

  const wordCloudData = getWordCloudData(commentData);

  // Convert word cloud data to a format usable by the frontend
  const wordCloudArray = Object.entries(wordCloudData).map(([word, count]) => ({
    text: word,
    weight: count,
  }));

  // Map file extensions to Prism.js language classes
  const languageClassMap: { [key: string]: string } = {
    c: "language-c",
    cpp: "language-cpp",
    py: "language-python",
    js: "language-javascript",
    java: "language-java",
  };

  const languageClass = languageClassMap[inputFileExtension] || "language-text";

  let report = `
  <html>
  <head>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/jquery"></script>
    <script src="https://cdn.jsdelivr.net/npm/jqcloud2"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jqcloud2/dist/jqcloud.min.css">
    <!-- Prism.js for syntax highlighting -->
    <link href="https://cdn.jsdelivr.net/npm/prismjs@1.28.0/themes/prism.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/prismjs@1.28.0/prism.min.js"></script>
    <!-- Google Fonts Poppins & Roboto -->
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
    <title>Comment Analysis Report</title>
    <style>
      body {
        font-family: 'Poppins', sans-serif;
        margin: 0;
        padding: 0;
        background-color: #1e1e1e;
        color: #e0e0e0;
      }
      h1, h2 {
        color: #e0e0e0;
      }
      .line-chart {
        text-align: center;
        margin-top: 20px;
      }
      .title {
        text-align: center;
        margin-top: 20px;
      }
      ::-webkit-scrollbar {
        display: none;
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
        border: 1px solid #444;
        padding: 10px;
        text-align: left;
      }
      th {
        background-color: #333;
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
      .chart2 {
        flex: 1;
        min-width: 0;
        width: 80%;
        margin: 20px auto;
      }
      .metrics {
        background-color: #2c2c2c;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
      }
      .metrics-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .metrics-info {
        flex: 1;
        margin-left: 100px;
        font-size: 20px;
      }
      .metrics-chart {
        margin-right: 200px;
        text-align: center;
        height: 300px;
      }
      .info-icon {
        display: inline-block;
        margin-left: 5px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background-color: #555;
        color: #fff;
        text-align: center;
        line-height: 16px;
        font-size: 12px;
        cursor: pointer;
        position: relative;
      }
      .info-icon:hover .tooltip {
        visibility: visible;
        opacity: 1;
      }
      .tooltip {
        visibility: hidden;
        width: 200px;
        background-color: #333;
        color: #fff;
        text-align: left;
        border-radius: 6px;
        padding: 10px;
        position: absolute;
        z-index: 1;
        bottom: 125%; /* Position above the icon */
        left: 50%;
        margin-left: -100px;
        opacity: 0;
        transition: opacity 0.3s;
      }
      .tooltip::after {
        content: "";
        position: absolute;
        top: 100%; /* At the bottom of the tooltip */
        left: 50%;
        margin-left: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: #333 transparent transparent transparent;
      }
      .comment-details {
        margin-top: 80px;
        text-align: center;
      }
      .word-cloud {
        margin-top: 100px;
        text-align: center;
      }
      .word-cloud strong {
        font-size: 24px;
        text-align: center;
      }
      .code-snippet {
        background-color: #2c2c2c;
        color: #e0e0e0;
        padding: 20px;
        border-radius: 8px;
        overflow-x: auto;
        margin-top: 40px;
      }
      pre {
        margin: 0;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1 class="title">Comment Analysis Report</h1>

      <div class="metrics">
        <div class="metrics-wrapper">
          <div class="metrics-info">
            <p>
              <strong>Language Detected:</strong> ${languageDetected}
              <span class="info-icon">i
                <span class="tooltip">Currently supported languages: C, C++, Python, Javascript, Java</span>
            </p>
            <p><strong>Total Lines:</strong> ${totalLines}</p>
            <p><strong>Total Comments:</strong> ${totalComments} (Single Line: ${totalSingleLineComments}, Multi Line: ${totalMultiLineComments})</p>
            <p><strong>Total Comment Lines:</strong> ${totalCommentLines}</p>
            <p>
              <strong>Total Normal Lines:</strong> ${
                totalLines - totalCommentLines
              }
              <span class="info-icon">i
                <span class="tooltip">Normal lines are lines that are not comments or empty, i.e., lines with code or text.</span>
              </span>
            </p>
            <p>
              <strong>Comment Coverage:</strong> ${commentCoverage.toFixed(2)}%
              <span class="info-icon">i
                <span class="tooltip">Comment coverage is the % of lines that are comments out of the total non-blank lines.</span>
              </span>
            </p>
          </div>
          <div class="metrics-chart">
            <canvas id="commentTypesChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Comment Length Chart -->
      <div class="chart2">
        <h2 class="line-chart">Comment Length Line Chart</h2>
        <canvas id="commentLengthChart"></canvas>
      </div>

      <!-- Word Cloud -->
      <div class="word-cloud">
        <p>
          <strong>Word Cloud</strong>
          <span class="info-icon">i
            <span class="tooltip">A word cloud is a visual representation of the most common words. The size of the word indicates its frequency.</span>
          </span>
        </p>
        <div id="wordCloud" class="chart"></div>
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

      <!-- Code Snippet -->
      <div class="code-snippet">
        <h2>Code Snippet from Input File</h2>
        <pre><code class="${languageClass}">${inputFileContents}</code></pre>
      </div>

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
            responsive: true,
            plugins: {
              legend: {
                labels: {
                  color: '#e0e0e0'
                }
              }
            }
          }
        });

        // Chart for Comment Length
        new Chart(document.getElementById('commentLengthChart'), {
          type: 'line',
          data: {
            labels: ${JSON.stringify(commentLengthLabels)},
            datasets: [{
              label: 'Comment Length',
              data: ${JSON.stringify(commentLengthData)},
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1
            }]
          },
          options: {
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Line #',
                  color: '#ffffff'
                },
                ticks: {
                  color: '#ffffff'
                },
                grid: {
                  display: false // Hide the x-axis grid lines
                }
              },
              y: {
                title: {
                  display: true,
                  text: 'No. of Characters',
                  color: '#ffffff'
                },
                ticks: {
                  color: '#ffffff'
                },
                beginAtZero: true,
                grid: {
                  display: false // Hide the y-axis grid lines
                }
              }
            }
          }
        });

        // Word Cloud
        $('#wordCloud').jQCloud(${JSON.stringify(wordCloudArray)}, {
          autoResize: true,
          colors: ["#ff6384", "#36a2eb", "#cc65fe", "#ffce56"],
          fontSize: { from: 0.05, to: 0.02 }
        });
      </script>
    </div>

    <!-- Footer -->
    <footer style="text-align: center; margin-top: 20px; font-size: 0.8em;">
      <p>&copy; ${new Date().getFullYear()} Crystal Clear Comments - Hardvan</p>
    </footer>
  </body>
  </html>`;

  return report;
}

// This function is called when the extension is deactivated.
export function deactivate() {}
