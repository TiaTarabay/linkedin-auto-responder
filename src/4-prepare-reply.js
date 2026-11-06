__FORMAT__

const evt = $('Check conversation').first().json;
const parsed = readAiOutput($input.first().json || {});
const { reply, usedFallback } = formatReply(parsed, { isFirstReply: evt.isFirstReply, firstName: evt.senderName });

return [{ json: {
  accountId: evt.accountId,
  chatId: evt.chatId,
  messageId: evt.messageId,
  senderName: evt.senderName,
  reply,
  needsTia: parsed.needs_tia === true || usedFallback,
  reason: String(parsed.reason || (usedFallback ? 'Safe fallback used' : '')),
  usedFallback,
} }];
