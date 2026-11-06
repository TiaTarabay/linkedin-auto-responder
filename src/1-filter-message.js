// CONFIG: edit these values when you connect LinkedIn.
const CONFIG = {
  BOT_ENABLED: true,
  ALLOWED_ACCOUNT_IDS: ['acc_01m6r29ejtecs8vwp9vpxxnsr7'],
};

const body = $input.first().json.body || {};
const msg = body.payload || {};
const isMock = body.account_provider === 'mock';
const store = $getWorkflowStaticData('global');
store.seen = store.seen || {};

if (!CONFIG.BOT_ENABLED) return [];
if (body.type !== 'message.new') return [];
if (!CONFIG.ALLOWED_ACCOUNT_IDS.includes(body.account_id)) return [];
if (!msg.id || !msg.chat_id) return [];
if (store.seen[msg.id]) return [];

// Mock events contain random flags, so these checks only apply to real messages.
if (!isMock && (msg.is_sender === true || msg.is_event === true || msg.is_deleted === true)) return [];

store.seen[msg.id] = Date.now();
const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
for (const [id, at] of Object.entries(store.seen)) if (at < cutoff) delete store.seen[id];

const sender = msg.sender || {};
return [{ json: {
  accountId: body.account_id,
  chatId: msg.chat_id,
  messageId: msg.id,
  text: msg.text || '',
  hasAttachments: Array.isArray(msg.attachments) && msg.attachments.length > 0,
  timestamp: msg.timestamp || new Date().toISOString(),
  senderId: msg.sender_id || sender.id || '',
  senderName: String(sender.first_name || sender.display_name || '').trim().split(/\s+/)[0] || '',
  senderPublicId: sender.public_identifier || '',
  isMock,
} }];
