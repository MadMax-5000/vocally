import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';
import { locales, type Locale } from './config';

export default getRequestConfig(async ({requestLocale}) => {
  let locale = await requestLocale;
  
  if (!locale || !locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }

  const messages = (await import(`../messages/${locale}.json`)).default;
  const operations = (await import(`../messages/dashboard/operations-${locale}.json`)).default;
  const deploy = (await import(`../messages/dashboard/deploy-${locale}.json`)).default;
  const deployChannels = (await import(`../messages/dashboard/deploy-channels-${locale}.json`)).default;
  const deployMessaging = (await import(`../messages/dashboard/deploy-messaging-${locale}.json`)).default;
  const deploySites = (await import(`../messages/dashboard/deploy-sites-${locale}.json`)).default;
  const agents = (await import(`../messages/dashboard/agents-${locale}.json`)).default;
  const actions = (await import(`../messages/dashboard/actions-${locale}.json`)).default;
  const fallbackActions =
    locale === "en"
      ? actions
      : (await import("../messages/dashboard/actions-en.json")).default;

  return {
    locale,
    messages: {
      ...messages,
      dashboard: {
        ...messages.dashboard,
        ...operations.dashboard,
        ...deploy.dashboard,
        ...agents.dashboard,
        ...fallbackActions.dashboard,
        ...actions.dashboard,
        actions: {
          ...fallbackActions.dashboard.actions,
          ...actions.dashboard.actions,
          sheet: {
            ...fallbackActions.dashboard.actions?.sheet,
            ...actions.dashboard.actions?.sheet,
            bookAppointment: {
              ...fallbackActions.dashboard.actions?.sheet?.bookAppointment,
              ...actions.dashboard.actions?.sheet?.bookAppointment,
            },
            collectLeads: {
              ...fallbackActions.dashboard.actions?.sheet?.collectLeads,
              ...actions.dashboard.actions?.sheet?.collectLeads,
            },
            customButton: {
              ...fallbackActions.dashboard.actions?.sheet?.customButton,
              ...actions.dashboard.actions?.sheet?.customButton,
            },
            customForm: {
              ...fallbackActions.dashboard.actions?.sheet?.customForm,
              ...actions.dashboard.actions?.sheet?.customForm,
            },
            escalations: {
              ...fallbackActions.dashboard.actions?.sheet?.escalations,
              ...actions.dashboard.actions?.sheet?.escalations,
            },
            suggestedMessages: {
              ...fallbackActions.dashboard.actions?.sheet?.suggestedMessages,
              ...actions.dashboard.actions?.sheet?.suggestedMessages,
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
    },
  };
});
