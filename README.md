# Crystal Clear Comments

A VSCode extension designed to help developers gain insights into the quality and quantity of comments in their code. This extension analyzes comments in Python, C, and C++ files, providing metrics and visualizations to enhance code documentation practices.

## Features

- **Comment Coverage Analysis**: Calculates the percentage of lines that are comments out of the total non-blank lines.
- **Language Detection**: Automatically detects the programming language (Python, C, C++) and tailors the analysis accordingly.
- **Detailed Comment Breakdown**: Provides a breakdown of single-line and multi-line comments.
- **Comment Length Analysis**: Analyzes the length of comments and visualizes it over the range of lines in the file.
- **Interactive Report Generation**: Generates an HTML report with charts and tables summarizing the comment analysis.

## Usage (for Users)

1. Open a Python, C, or C++ file in VSCode.
2. Run the command `Analyze Comments` from the command palette (`Ctrl+Shift+P`).
3. The extension will analyze the comments in the current file and generate a report.

## Installation (for Dev/Contributors)

1. Clone this repository or download the latest release.
2. Open the project in VSCode.
3. Press `F5` to start debugging the extension.
4. The extension will launch in a new VSCode window where you can test its functionality.

## Example Report

The extension generates an HTML report with the following sections:

- **Comment Coverage Analysis**: Displays the percentage of comment lines, total comments, and total lines in the file.
- **Charts**:
  - _Comment Types Distribution_: A pie chart showing the distribution of single-line and multi-line comments.
  - _Comment Length_: A line chart showing the length of comments across the file's lines.
- **Comment Details**: A table listing each comment, its type (single-line or multi-line), and its location in the code.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork this repository.
2. Clone your forked repository to your local machine.
3. Create a new branch for your feature or bugfix.
4. Make your changes & commit them with descriptive messages.
5. Submit a pull request/merge request.

**Crystal Clear Comments** is designed to give developers clear insights into their code documentation, making it easier to maintain and understand codebases over time. Enjoy coding with crystal-clear clarity!
