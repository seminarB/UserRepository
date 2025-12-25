/**
 * PR Review Script: Add Comment Header
 */

const { execSync } = require('child_process');

module.exports = async ({ github, context, changedFiles }) => {
  const TEST_PY_PATH = '/tmp/test.py';
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

      // Pythonスクリプトを呼び出してファイルを解析
      const analysisResult = await analyzeFileWithPython(content, TEST_PY_PATH, WRAPPER_SCRIPT);

      if (analysisResult.error) {
        console.error(`Analysis error for ${file}:`, analysisResult.error);
        continue;
      }

      // 解析結果からコメント情報を取得
      const { line, comment } = analysisResult;

      if (!line || !comment) {
        console.log(`Skipping ${file}: no comment needed`);
        continue;
      }

      console.log(`Adding comment to ${file}:${line} - "${comment}"`);

      // レビューコメントの本文を作成
      const commentBody = createSuggestionComment(content, line, comment);

      // レビューコメントを投稿
      await postReviewComment(github, context, file, line, commentBody);

    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }
};

/**
 * レビューコメントの本文を生成
 */
function createCommentBody(headerComment) {
  return `このファイルの先頭に以下のコメントを追加することを提案します:

\`\`\`python
${headerComment}
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
