// Adds the greeting and sign-off, so the format is exactly right every time.
const TEMPLATES = {
  en: {
    greeting: (name) => `Hi${name ? ' ' + name : ''}, thanks for reaching out!`,
    signOff: 'This reply was written by my AI assistant. I read every conversation personally.',
    spam: "Thanks for your message, I'll leave it here.",
    fallback: "Thanks for your message! I'll get back to you personally soon.",
  },
  fr: {
    greeting: (name) => `Bonjour${name ? ' ' + name : ''}, merci pour votre message !`,
    signOff: 'Cette réponse a été rédigée par mon assistant IA. Je lis personnellement chaque conversation.',
    spam: 'Merci pour votre message, je vais en rester là.',
    fallback: 'Merci pour votre message ! Je vous répondrai personnellement très bientôt.',
  },
  ar: {
    greeting: (name) => `مرحبًا${name ? ' ' + name : ''}، شكرًا لتواصلك!`,
    signOff: 'كُتب هذا الرد بواسطة مساعدي الذكي. أقرأ كل محادثة بنفسي.',
    spam: 'شكرًا على رسالتك، سأكتفي بهذا.',
    fallback: 'شكرًا على رسالتك! سأرد عليك شخصيًا قريبًا.',
  },
};

function readAiOutput(res) {
  const rawText = res.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('')
    || res.choices?.[0]?.message?.content
    || '';
  try {
    const match = rawText.match(/\{[\s\S]*\}/);
    return JSON.parse(match ? match[0] : rawText);
  } catch (error) {
    return {};
  }
}

function formatReply(parsed, { isFirstReply, firstName }) {
  const lang = String(parsed.language || 'en').toLowerCase().slice(0, 2);
  const t = TEMPLATES[lang] || TEMPLATES.en;
  const isSpam = parsed.spam === true;

  let body = String(parsed.reply || '').replace(/\s*[\u2014\u2013]\s*/g, ', ');
  // Remove any sign-off the AI wrote itself.
  body = body.split('\n').filter((line) => !(
    /(AI assistant|assistant IA|مساعدي)/i.test(line) && /(written|rédigée|écrite|كُتب|كتب|read every|lis |أقرأ)/i.test(line)
  )).join('\n');
  // Remove any greeting or thanks the AI wrote itself.
  body = body.replace(/^\s*(?:hi|hello|hey|dear|bonjour|salut|مرحب\S*|أهل\S*|اهل\S*)(?=[\s,،!])[^.!?؟\n]*[.!?؟]\s*/i, '');
  body = body.replace(/^\s*(?:thanks|thank you|merci|شكر\S*)[^.!?؟\n]*(?:reaching out|contact|message|تواصل)[^.!?؟\n]*[.!?؟]\s*/i, '');
  body = body.replace(/\n{3,}/g, '\n\n').trim();

  const unsafe = /system prompt|knowledge file|needs_tia|my instructions|\b[\w.+-]+@[\w-]+\.[\w.-]+\b|\+?\d[\d\s().-]{7,}\d/i.test(body);
  let usedFallback = false;
  if (unsafe || !body) {
    body = isSpam ? t.spam : t.fallback;
    usedFallback = !isSpam;
  }
  if (body.length > 1000) body = body.slice(0, 1000).replace(/\s+\S*$/, '') + '...';

  let reply = isFirstReply && !isSpam ? `${t.greeting(firstName)} ${body}` : body;
  if (isFirstReply) reply += `\n\n${t.signOff}`;
  return { reply, usedFallback };
}
