/**
 * PR Review Script: Add Comment Header
 *
 * このスクリプトは、PRで変更されたPythonファイルの先頭に
 * `# this is a comment` を追加することを提案するレビューコメントを投稿します。
 */

module.exports = async ({ github, context, changedFiles }) => {
  const HEADER_COMMENT = '# this is a comment';

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
      const firstLine = content.split('\n')[0] || '';

      // 既にコメントが存在する場合はスキップ
      if (firstLine.trim() === HEADER_COMMENT) {
        console.log(`Skipping ${file}: comment already exists`);
        continue;
      }

      // レビューコメントの本文を作成（1行目の内容を含める）
      const commentBody = createCommentBody(HEADER_COMMENT, firstLine);

      // レビューコメントを投稿
      await postReviewComment(github, context, file, commentBody);

    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }
};

/**
 * レビューコメントの本文を生成
 * @param {string} headerComment - 追加するコメント
 * @param {string} firstLine - ファイルの1行目の内容
 */
function createCommentBody(headerComment, firstLine) {
  return `このファイルの先頭に以下のコメントを追加することを提案します:

\`\`\`suggestion
${headerComment}
${firstLine}
\`\`\``;
}

/**
 * レビューコメントを投稿
 */
async function postReviewComment(github, context, file, commentBody) {
  try {
    await github.rest.pulls.createReviewComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: context.payload.pull_request.number,
      body: commentBody,
      commit_id: context.payload.pull_request.head.sha,
      path: file,
      line: 1,
      side: 'RIGHT'
    });
    console.log(`✓ Review comment posted for ${file}`);
  } catch (error) {
    // 差分がない行にはコメントできないため、代わりに通常のコメントとして投稿
    if (error.status === 422) {
      await postIssueComment(github, context, file, commentBody);
    } else {
      throw error;
    }
  }
}

/**
 * PR全体のコメントとして投稿（差分がない場合のフォールバック）
 */
async function postIssueComment(github, context, file, commentBody) {
  await github.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.payload.pull_request.number,
    body: `**${file}**\n\n${commentBody}`
  });
  console.log(`✓ Posted as issue comment for ${file}`);
}
