import { readFile } from "node:fs/promises";
import { processAvatar } from "./avatar_pipeline.ts";

const filename = process.argv[2] ?? "learner-avatar.png";
const file = `data:image/png;base64,${(await readFile(filename)).toString("base64")}`;
const result = await processAvatar({ file, filename, aspect: "1:1" });
console.log(JSON.stringify({ avatar: result.image, learnerDeadlineCard: "avatar-ready" }));
