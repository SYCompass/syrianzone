import { cpSync, mkdirSync } from "fs";
import { join } from "path";

const src = join(process.cwd(), "..", "tierlist", "images");
// With basePath "/tierlist", requests to "/tierlist/images/*" map to files in public/images/*
const dest = join(process.cwd(), "public", "images");

mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log("Copied tierlist images to public/");



