const reply = $('Prepare reply').first().json;
const res = $input.first().json || {};
const store = $getWorkflowStaticData('global');
const hash = (value) => {
  const text = String(value || '').trim().replace(/\s+/g, ' ');
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (Math.imul(31, h) + text.charCodeAt(i)) | 0;
  return String(h);
};
store.sent = (store.sent || []).slice(-300);
store.sent.push({
  chatId: reply.chatId,
  messageId: res.id || res.message_id || null,
  hash: hash(reply.reply),
  at: Date.now(),
});
return [{ json: {
  status: 'sent',
  to: reply.senderName,
  reply: reply.reply,
  needsTia: reply.needsTia,
  reason: reply.reason,
  usedFallback: reply.usedFallback,
} }];
