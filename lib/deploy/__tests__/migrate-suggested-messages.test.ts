import { describe, expect, it } from "vitest";

import {
  collectLegacyStaticStarters,
  migrateLegacySuggestedMessagesConfig,
} from "@/lib/deploy/migrate-suggested-messages";

describe("migrate-suggested-messages", () => {
  it("collects widget-only legacy starters", () => {
    const starters = collectLegacyStaticStarters({
      widget: { suggestedMessages: ["Pricing", "Demo"] },
    });
    expect(starters).toEqual(["Pricing", "Demo"]);
  });

  it("merges widget and help lists with dedupe", () => {
    const starters = collectLegacyStaticStarters({
      widget: { suggestedMessages: ["Pricing", "FAQ"] },
      helpPage: { suggestedMessages: ["FAQ", "Contact"] },
    });
    expect(starters).toEqual(["Pricing", "FAQ", "Contact"]);
  });

  it("migrates legacy starters into actions when action starters empty", () => {
    const { config, migrated } = migrateLegacySuggestedMessagesConfig({
      widget: {
        suggestedMessages: ["Hello"],
        keepShowingSuggested: true,
      },
    });

    expect(migrated).toBe(true);
    expect(config.actions?.suggestedMessages?.staticStarters).toEqual(["Hello"]);
    expect(config.actions?.suggestedMessages?.keepShowingAfterFirst).toBe(true);
  });

  it("no-ops when action already has starters", () => {
    const { migrated } = migrateLegacySuggestedMessagesConfig({
      widget: { suggestedMessages: ["Legacy"] },
      actions: {
        suggestedMessages: {
          staticStarters: ["From action"],
        },
      },
    });

    expect(migrated).toBe(false);
  });
});
