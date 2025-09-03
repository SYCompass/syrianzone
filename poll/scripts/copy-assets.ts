import { cpSync, mkdirSync } from "fs";
import { join } from "path";

const src = join(process.cwd(), "..", "tierlist", "images");
const dest = join(process.cwd(), "public", "tierlist", "images");

mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log("Copied tierlist images to public/");



