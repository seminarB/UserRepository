/**
 * PR Review Script: Add Comment Header
 */

const { execSync } = require('child_process');

module.exports = async ({ github, context, changedFiles }) => {
  const TEST_PY_PATH = '/tmp/SeminarB/integration.py';
  const WRAPPER_SCRIPT = '.github/scripts/call_python_analyzer.py';

  for (const file of changedFiles) {
    if (!file) continue;

    console.log(`Processing file: ${file}`);

    try {
      // ファイルの内容を取得
      const { data: fileContent } = await github.rest.repos.getContent({
        owner: context.repo.owner,
        repo: context.repo.repo,
        path: file,
        ref: context.payload.pull_request.head.sha
      });

      const content = Buffer.from(fileContent.content, 'base64').toString('utf-8');

      console.log(`File content length: ${content.length} characters`);
      console.log(`Test script path: ${TEST_PY_PATH}`);
      console.log(`Wrapper script path: ${WRAPPER_SCRIPT}`);

      // Pythonスクリプトを呼び出してファイルを解析
      console.log(`Calling Python analyzer with TEST_PY_PATH: ${TEST_PY_PATH}`);
      const analysisResult = await analyzeFileWithPython(content, TEST_PY_PATH, WRAPPER_SCRIPT);

      console.log(`Analysis result:`, JSON.stringify(analysisResult, null, 2));

      if (analysisResult.error) {
        console.error(`Analysis error for ${file}:`, analysisResult.error);
        continue;
      }

      // 解析結果を配列として処理（単一のオブジェクトの場合は配列に変換）
      const comments = Array.isArray(analysisResult) ? analysisResult : [analysisResult];

      // コメントが空の場合はスキップ
      if (comments.length === 0) {
        console.log(`Skipping ${file}: no comments needed`);
        continue;
      }

      console.log(`Found ${comments.length} comment(s) for ${file}`);

      // 各コメントを処理
      for (const item of comments) {
        const { line, comment } = item;

        if (!line || !comment) {
          console.log(`Skipping invalid comment entry: line=${line}, comment=${comment}`);
          continue;
        }

        // コメントを適切にフォーマット
        let formattedComment = comment.trim();

        // 前後の """ を削除
        if (formattedComment.startsWith('"""')) {
          formattedComment = formattedComment.substring(3);
        }
        if (formattedComment.endsWith('"""')) {
          formattedComment = formattedComment.substring(0, formattedComment.length - 3);
        }

        // 各行の先頭に # を追加
        const lines = formattedComment.split('\n');
        const pythonComment = lines
          .map(line => {
            const trimmedLine = line.trim();
            if (trimmedLine === '') return '#';
            return trimmedLine.startsWith('#') ? trimmedLine : `# ${trimmedLine}`;
          })
          .join('\n');

        console.log(`Adding comment to ${file}:${line}`);

        // レビューコメントの本文を作成
        const commentBody = createSuggestionComment(content, line, pythonComment);

        // レビューコメントを投稿
        await postReviewComment(github, context, file, line, commentBody);
      }

    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }
};

/**
 * Pythonスクリプトを使ってファイルを解析
 */
function analyzeFileWithPython(fileContent, testPyPath, wrapperScript) {
  try {
    console.log(`Executing: python3 ${wrapperScript} ${testPyPath}`);
    const result = execSync(`python3 ${wrapperScript} ${testPyPath}`, {
      input: fileContent,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024, // 10MB
      stdio: ['pipe', 'pipe', 'pipe'] // stdin, stdout, stderr
    });

    console.log(`Python stdout: ${result}`);
    return JSON.parse(result);
  } catch (error) {
    // デバッグ情報を含めてエラーを返す
    console.error('Python execution failed:');
    console.error('  stdout:', error.stdout);
    console.error('  stderr:', error.stderr);
    console.error('  message:', error.message);
    const errorMessage = error.stderr || error.stdout || error.message;
    return { error: errorMessage };
  }
}

/**
 * Suggestion形式のレビューコメントを生成
 * @param {string} fileContent - ファイル全体の内容
 * @param {number} line - コメントを追加する行番号（1始まり）
 * @param {string} comment - 追加するコメント
 */
function createSuggestionComment(fileContent, line, comment) {
  const lines = fileContent.split('\n');
  const targetLine = lines[line - 1] || ''; // 0始まりに変換

  // suggestion形式：コメントと既存の行を含める
  return `以下のコメントを${line}行目に追加することを提案します:

\`\`\`suggestion
${comment}
${targetLine}
\`\`\``;
}

/**
 * レビューコメントを投稿
 * @param {number} line - コメントを付ける行番号
 */
async function postReviewComment(github, context, file, line, commentBody) {
  try {
    console.log(`Attempting to post review comment for ${file}:${line}`);
    console.log(`  owner: ${context.repo.owner}`);
    console.log(`  repo: ${context.repo.repo}`);
    console.log(`  pull_number: ${context.payload.pull_request.number}`);
    console.log(`  commit_id: ${context.payload.pull_request.head.sha}`);

    await github.rest.pulls.createReviewComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: context.payload.pull_request.number,
      body: commentBody,
      commit_id: context.payload.pull_request.head.sha,
      path: file,
      line: line,
      side: 'RIGHT'
    });
    console.log(`✓ Review comment posted for ${file}:${line}`);
  } catch (error) {
    console.error(`Error posting review comment for ${file}:${line}`);
    console.error(`  Error status: ${error.status}`);
    console.error(`  Error message: ${error.message}`);
    console.error(`  Error response data:`, JSON.stringify(error.response?.data, null, 2));

    // 差分がない行にはコメントできないため、代わりに通常のコメントとして投稿
    if (error.status === 422) {
      console.log(`Line ${line} is not in diff, posting as issue comment instead`);
      await postIssueComment(github, context, file, line, commentBody);
    } else {
      console.error(`Unhandled error type, attempting to post as issue comment`);
      await postIssueComment(github, context, file, line, commentBody);
    }
  }
}

/**
 * PR全体のコメントとして投稿（差分がない場合のフォールバック）
 */
async function postIssueComment(github, context, file, line, commentBody) {
  try {
    console.log(`Posting as issue comment for ${file}:${line}`);
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.payload.pull_request.number,
      body: `**${file}:${line}**\n\n${commentBody}`
    });
    console.log(`✓ Posted as issue comment for ${file}:${line}`);
  } catch (error) {
    console.error(`Failed to post issue comment for ${file}:${line}`);
    console.error(`  Error status: ${error.status}`);
    console.error(`  Error message: ${error.message}`);
    console.error(`  Error response data:`, JSON.stringify(error.response?.data, null, 2));
    throw error;
  }
}
