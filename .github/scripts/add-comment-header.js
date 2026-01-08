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
      const analysisResult = await analyzeFileWithPython(content, TEST_PY_PATH, WRAPPER_SCRIPT);

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

        // コメントをPython形式に変換（既に # で始まっている場合はそのまま使用）
        const pythonComment = comment.trim().startsWith('#') ? comment : `# ${comment}`;

        console.log(`Adding comment to ${file}:${line} - "${pythonComment}"`);

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
    const result = execSync(`python3 ${wrapperScript} ${testPyPath}`, {
      input: fileContent,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024, // 10MB
      stdio: ['pipe', 'pipe', 'pipe'] // stdin, stdout, stderr
    });

    return JSON.parse(result);
  } catch (error) {
    // デバッグ情報を含めてエラーを返す
    const errorMessage = error.stderr || error.stdout || error.message;
    console.error('Python execution error:', errorMessage);
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
    // 差分がない行にはコメントできないため、代わりに通常のコメントとして投稿
    if (error.status === 422) {
      await postIssueComment(github, context, file, line, commentBody);
    } else {
      throw error;
    }
  }
}

/**
 * PR全体のコメントとして投稿（差分がない場合のフォールバック）
 */
async function postIssueComment(github, context, file, line, commentBody) {
  await github.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.payload.pull_request.number,
    body: `**${file}:${line}**\n\n${commentBody}`
  });
  console.log(`✓ Posted as issue comment for ${file}:${line}`);
}
