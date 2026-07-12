import fs from "fs";
import path from "path";

const root = path.resolve(".");
const locales = ["en", "fr", "ar"];

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (/\.(tsx|ts)$/.test(ent.name)) acc.push(p);
  }
  return acc;
}

function loadMerged(locale) {
  const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
  const messages = read(`messages/${locale}.json`);
  const shell = read(`messages/dashboard/shell-${locale}.json`);
  const operations = read(`messages/dashboard/operations-${locale}.json`);
  const deploy = read(`messages/dashboard/deploy-${locale}.json`);
  const deployChannels = read(`messages/dashboard/deploy-channels-${locale}.json`);
  const deployMessaging = read(`messages/dashboard/deploy-messaging-${locale}.json`);
  const deploySites = read(`messages/dashboard/deploy-sites-${locale}.json`);
  const agents = read(`messages/dashboard/agents-${locale}.json`);
  const actions = read(`messages/dashboard/actions-${locale}.json`);
  const fallbackActions =
    locale === "en" ? actions : read("messages/dashboard/actions-en.json");

  return {
    ...messages,
    dashboard: {
      ...messages.dashboard,
      ...shell.dashboard,
      ...operations.dashboard,
      ...deploy.dashboard,
      ...agents.dashboard,
      ...fallbackActions.dashboard,
      ...actions.dashboard,
      actions: {
        ...fallbackActions.dashboard?.actions,
        ...actions.dashboard?.actions,
        sheet: {
          ...fallbackActions.dashboard?.actions?.sheet,
          ...actions.dashboard?.actions?.sheet,
          bookAppointment: {
            ...fallbackActions.dashboard?.actions?.sheet?.bookAppointment,
            ...actions.dashboard?.actions?.sheet?.bookAppointment,
          },
          collectLeads: {
            ...fallbackActions.dashboard?.actions?.sheet?.collectLeads,
            ...actions.dashboard?.actions?.sheet?.collectLeads,
          },
          customButton: {
            ...fallbackActions.dashboard?.actions?.sheet?.customButton,
            ...actions.dashboard?.actions?.sheet?.customButton,
          },
          customForm: {
            ...fallbackActions.dashboard?.actions?.sheet?.customForm,
            ...actions.dashboard?.actions?.sheet?.customForm,
          },
          escalations: {
            ...fallbackActions.dashboard?.actions?.sheet?.escalations,
            ...actions.dashboard?.actions?.sheet?.escalations,
          },
          suggestedMessages: {
            ...fallbackActions.dashboard?.actions?.sheet?.suggestedMessages,
            ...actions.dashboard?.actions?.sheet?.suggestedMessages,
          },
        },
      },
      agents: {
        ...messages.dashboard?.agents,
        ...operations.dashboard?.agents,
        ...deploy.dashboard?.agents,
        ...agents.dashboard?.agents,
      },
      agentDetail: {
        ...messages.dashboard?.agentDetail,
        ...operations.dashboard?.agentDetail,
        ...deploy.dashboard?.agentDetail,
        ...agents.dashboard?.agentDetail,
      },
      analytics: {
        ...messages.dashboard?.analytics,
        ...operations.dashboard?.analytics,
        ...deploy.dashboard?.analytics,
        ...agents.dashboard?.analytics,
      },
      deploy: {
        ...messages.dashboard?.deploy,
        ...operations.dashboard?.deploy,
        ...deploy.dashboard?.deploy,
        ...deployChannels.dashboard?.deploy,
        ...deployMessaging.dashboard?.deploy,
        ...deploySites.dashboard?.deploy,
      },
    },
  };
}

function get(obj, keyPath) {
  return keyPath.split(".").reduce((o, k) => (o && typeof o === "object" ? o[k] : undefined), obj);
}

function collectTranslationBindings(src) {
  const bindings = [];
  const fnRe = /(?:export\s+)?function\s+\w+[^{]*\{/g;
  const starts = [0];
  let fm;
  while ((fm = fnRe.exec(src))) starts.push(fm.index);
  starts.push(src.length);

  for (let i = 0; i < starts.length - 1; i++) {
    const chunk = src.slice(starts[i], starts[i + 1]);
    const local = new Map();
    const bindingRe =
      /const\s+(\w+)\s*=\s*useTranslations\(\s*["'](dashboard(?:\.[^"']+)?)["']\s*\)/g;
    let m;
    while ((m = bindingRe.exec(chunk))) {
      local.set(m[1], m[2]);
    }
    if (local.size) bindings.push({ chunk, vars: local });
  }
  return bindings;
}

function collectKeysForVar(src, varName) {
  const keys = new Set();
  const callRes = [
    new RegExp(`\\b${varName}\\(\\s*["']([^"']+)["']`, "g"),
    new RegExp(`\\b${varName}\\.rich\\(\\s*["']([^"']+)["']`, "g"),
  ];
  for (const re of callRes) {
    let m;
    while ((m = re.exec(src))) {
      const key = m[1];
      if (!key.includes("${") && !key.includes("`")) keys.add(key);
    }
  }
  return keys;
}

const files = walk(path.join(root, "components/dashboard")).concat(
  walk(path.join(root, "app/[locale]/dashboard")),
);

const missing = new Set();
for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  const scopes = collectTranslationBindings(src);
  if (!scopes.length) continue;

  for (const { chunk, vars } of scopes) {
    for (const [varName, namespace] of vars) {
      const rel = namespace.replace(/^dashboard\.?/, "");
      for (const key of collectKeysForVar(chunk, varName)) {
        const full = rel ? `${rel}.${key}` : key;
        for (const locale of locales) {
          const tree = loadMerged(locale).dashboard ?? {};
          const val = get(tree, full);
          if (val === undefined) missing.add(`${locale}:${namespace}.${key}`);
        }
      }
    }
  }
}

console.log("Missing keys:", missing.size);
[...missing].sort().forEach((x) => console.log(x));
