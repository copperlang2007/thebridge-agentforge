#!/usr/bin/env tsx
import { extractAtomsFromConversation } from '../services/extractor.js';

const conversationId = process.argv[2];
if (!conversationId) {
  console.error('Usage: pnpm extract <conversationId>');
  process.exit(1);
}

extractAtomsFromConversation(conversationId)
  .then((t) => {
    console.log(JSON.stringify(t, null, 2));
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
