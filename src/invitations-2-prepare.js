const MAX_PER_RUN = 10;
const { accountId, acceptSentAfter } = $('Config').first().json;
const cutoff = acceptSentAfter ? new Date(acceptSentAfter).getTime() : 0;
const inputs = $input.all().map((item) => item.json);
const first = inputs[0] || {};
const list = Array.isArray(first.items) ? first.items
  : Array.isArray(first.data) ? first.data
  : Array.isArray(first.requests) ? first.requests
  : first.id ? inputs
  : [];

// Skip requests sent before the bot went live. Requests without a date are accepted.
const isNew = (request) => {
  const sentAt = new Date(request.created_at || 0).getTime();
  return !cutoff || !sentAt || sentAt >= cutoff;
};

return list.filter(isNew).slice(0, MAX_PER_RUN).map((request) => ({ json: {
  accountId,
  requestId: request.id || request.request_id || request.invitation_id,
  name: request.user?.display_name || request.user?.first_name || '',
  sentAt: request.created_at || '',
} })).filter((item) => item.json.requestId);
