#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";
import fg from "fast-glob";

async function main() {
  const [, , rawTitle, category] = process.argv;
  if (!rawTitle || !category) {
    console.error('Usage: create-post.mjs "제목" <category>');
    process.exit(1);
  }

  const BLOG_CAT = ["tech", "review", "document", "article"];
  const STUDY_CAT = ["tech", "cs", "ps", "project"];

  if (!BLOG_CAT.includes(category) && !STUDY_CAT.includes(category)) {
    console.error("Unknown category.");
    process.exit(1);
  }

  /* ── 1) 섹션별 루트 디렉터리 결정 ─────────────── */
  const contentroot = "content";
  const sectionRoot = "content/";

  /* ── 2) 섹션 안에서 ‘글로벌’ 넘버링 ─────────────── */
  //   예) content/blog/*/*/index.md  또는  content/study/*/*/index.md
  const globPattern = path.join(contentroot, "*/*/*/index.md");
  const allPosts = await fg(globPattern.replace(/\\/g, "/")); // Windows 경로 보정
  const nextNumber = allPosts.length + 1;

  /* ── 3) 날짜와 새 폴더 경로 ───────────────────── */
  const today = new Date().toISOString().slice(0, 10);
  const newDir = path.join(sectionRoot, category, String(nextNumber));
  await fs.mkdir(newDir, { recursive: true });

  /* ── 4) 아키타입 템플릿 읽기 & 치환 ───────────── */
  let tpl = await fs.readFile(
    path.resolve("archetypes", category, "index.md"),
    "utf-8",
  );
  tpl = tpl
    .replace(/{{\s*\.Date\s*}}/g, today)
    .replace(/{{\s*\.number\s*}}/g, String(nextNumber))
    .replace(/{{\s*\.title\s*}}/g, rawTitle)
    .replace(/^date:.*$/m, `date: "${today}"`);

  /* ── 5) index.md 생성 ────────────────────────── */
  const outPath = path.join(newDir, "index.md");
  await fs.writeFile(outPath, tpl, "utf-8");
  console.log(`✔ Created post: ${path.relative(process.cwd(), outPath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
