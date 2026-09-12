import { buildClientSchema, printSchema } from "graphql";
import { readFileSync, writeFileSync } from "fs";

const introspection = JSON.parse(readFileSync(".houdini/graphql/schema.json", "utf-8"));
const schema = buildClientSchema(introspection.data);
const sdl = printSchema(schema);
writeFileSync(".houdini/graphql/schema.graphql", sdl);
console.log("schema.graphql updated");

