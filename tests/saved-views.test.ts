import { describe, it, expect, beforeEach } from "vitest";
import {
  BUILT_IN_VIEWS,
  EMPTY_PAYMENT_LIST_STATE,
  canonicalQuery,
  findActiveView,
  getViewStore,
  parsePaymentListState,
  savedViewsReducer,
  savedViewsStorageKey,
  serializePaymentListState,
  validateViewName,
  type SavedViewsState,
} from "@/lib/saved-views";

const empty: SavedViewsState = { views: [], defaultViewId: null };

describe("payment list URL state", () => {
  it("round-trips filters, search and sort exactly", () => {
    const state = {
      q: "alice@example.com",
      status: "failed" as const,
      asset: "USDC" as const,
      from: "2026-01-01",
      to: "2026-01-31",
      sort: "amount_desc" as const,
    };
    const query = serializePaymentListState(state);
    expect(parsePaymentListState(query)).toEqual(state);
  });

  it("omits defaults so the empty state is an empty query", () => {
    expect(serializePaymentListState(EMPTY_PAYMENT_LIST_STATE)).toBe("");
  });

  it("drops invalid values from hand-edited URLs", () => {
    const state = parsePaymentListState("status=COMPLETED&asset=DOGE&from=yesterday&sort=random");
    expect(state).toEqual(EMPTY_PAYMENT_LIST_STATE);
  });

  it("canonicalises key order and whitespace", () => {
    expect(canonicalQuery("sort=date_asc&status=pending&q=%20abc%20")).toBe(
      "q=abc&status=pending&sort=date_asc",
    );
  });
});

describe("saved views", () => {
  it("ships All, Pending, Failed and Refunded built-ins", () => {
    expect(BUILT_IN_VIEWS.map((v) => v.name)).toEqual(["All", "Pending", "Failed", "Refunded"]);
  });

  it("matches the active view regardless of parameter order", () => {
    const state = savedViewsReducer.add(empty, "Big USDC", "asset=USDC&sort=amount_desc");
    const views = [...BUILT_IN_VIEWS, ...state.views];
    expect(findActiveView(views, "sort=amount_desc&asset=USDC")?.name).toBe("Big USDC");
    expect(findActiveView(views, "")?.name).toBe("All");
    expect(findActiveView(views, "asset=XLM")).toBeNull();
  });

  it("validates names", () => {
    expect(validateViewName("   ", [])).toMatch(/enter a name/i);
    expect(validateViewName("pending", [])).toMatch(/already exists/i);
    expect(validateViewName("x".repeat(41), [])).toMatch(/40 characters/);
    const state = savedViewsReducer.add(empty, "Weekly", "");
    expect(validateViewName("WEEKLY", state.views)).toMatch(/already exists/i);
    expect(validateViewName("Weekly", state.views, state.views[0].id)).toBeNull();
  });

  it("renames, sets default and clears default on delete", () => {
    let state = savedViewsReducer.add(empty, "Mine", "status=failed");
    const id = state.views[0].id;
    state = savedViewsReducer.rename(state, id, "  Failures  ");
    expect(state.views[0].name).toBe("Failures");
    state = savedViewsReducer.setDefault(state, id);
    expect(state.defaultViewId).toBe(id);
    state = savedViewsReducer.remove(state, id);
    expect(state).toEqual(empty);
  });
});

describe("per-merchant persistence", () => {
  beforeEach(() => window.localStorage.clear());

  it("stores views under a merchant-specific key", () => {
    const storeA = getViewStore("merchant_a");
    storeA.set(savedViewsReducer.add(storeA.get(), "A view", "status=pending"));

    expect(window.localStorage.getItem(savedViewsStorageKey("merchant_a"))).toContain("A view");
    expect(window.localStorage.getItem(savedViewsStorageKey("merchant_b"))).toBeNull();
    expect(getViewStore("merchant_b").get().views).toEqual([]);
  });

  it("ignores corrupt or tampered storage", () => {
    window.localStorage.setItem(
      savedViewsStorageKey("merchant_c"),
      JSON.stringify({ views: [{ id: 1 }, { id: "v", name: "Ok", query: "status=bogus" }], defaultViewId: "missing" }),
    );
    const state = getViewStore("merchant_c").get();
    expect(state.views).toEqual([{ id: "v", name: "Ok", query: "" }]);
    expect(state.defaultViewId).toBeNull();
  });
});
