// One-off ingestion script: copies the 30 drafted posts from the Downloads
// drop folder into content/blog/, renaming each to its slug (stripping the
// numeric day-prefix used only for ordering) and stamping a computed `date`
// field onto the frontmatter (day 1 = the day this was run, +1 day per post).
import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const SRC_DIR = path.join(process.env.HOME, "Downloads", "onlineviewing-blog-30-posts", "posts");
const DEST_DIR = path.join(process.cwd(), "content", "blog");

const START_DATE = new Date("2026-09-14T00:00:00Z");

await mkdir(DEST_DIR, { recursive: true });

const files = (await readdir(SRC_DIR)).filter((f) => f.endsWith(".md")).sort();

for (const file of files) {
  const raw = await readFile(path.join(SRC_DIR, file), "utf-8");
  const dayMatch = raw.match(/^day:\s*(\d+)\s*$/m);
  if (!dayMatch) throw new Error(`${file}: no "day" field found in frontmatter`);
  const day = parseInt(dayMatch[1], 10);

  const date = new Date(START_DATE);
  date.setUTCDate(date.getUTCDate() + (day - 1));
  const dateStr = date.toISOString().slice(0, 10);

  const slug = file.replace(/^\d+-/, "").replace(/\.md$/, "");

  // Insert `date` and `slug` right after `day:` in the frontmatter block.
  const withDate = raw.replace(
    /^day:\s*\d+\s*$/m,
    `day: ${day}\ndate: "${dateStr}"\nslug: "${slug}"`
  );

  await writeFile(path.join(DEST_DIR, `${slug}.md`), withDate, "utf-8");
  console.log(`${file} -> content/blog/${slug}.md (date=${dateStr})`);
}

console.log(`\nIngested ${files.length} posts into ${DEST_DIR}`);
