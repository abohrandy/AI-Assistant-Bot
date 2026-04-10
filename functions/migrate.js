const fs = require('fs');
let content = fs.readFileSync('src/index.ts', 'utf8');

content = content.replace('import * as functions from "firebase-functions";', 'import { onCall, HttpsError } from "firebase-functions/v2/https";');

content = content.replace(/export const classifyMessage = functions\.runWith\(\{[\s\S]*?\}\)\.https\.onCall\(async \(data, context\) => \{/g, `export const classifyMessage = onCall({ invoker: "public" }, async (request) => {
  const data = request.data;`);

content = content.replace(/export const filterKnowledge = functions\.runWith\(\{[\s\S]*?\}\)\.https\.onCall\(async \(data, context\) => \{/g, `export const filterKnowledge = onCall({
  invoker: "public",
  timeoutSeconds: 60,
  memory: "512MiB"
}, async (request) => {
  const data = request.data;`);

content = content.replace(/export const generateReply = functions\.runWith\(\{[\s\S]*?\}\)\.https\.onCall\(async \(data, context\) => \{/g, `export const generateReply = onCall({ invoker: "public" }, async (request) => {
  const data = request.data;`);

content = content.replace(/export const reviewReply = functions\.runWith\(\{[\s\S]*?\}\)\.https\.onCall\(async \(data, context\) => \{/g, `export const reviewReply = onCall({ invoker: "public" }, async (request) => {
  const data = request.data;`);

content = content.replace(/export const matchFAQ = functions\.runWith\(\{[\s\S]*?\}\)\.https\.onCall\(async \(data, context\) => \{/g, `export const matchFAQ = onCall({ invoker: "public" }, async (request) => {
  const data = request.data;`);

content = content.replace(/new functions\.https\.HttpsError/g, 'new HttpsError');

fs.writeFileSync('src/index.ts', content);
console.log("Migration complete.");
