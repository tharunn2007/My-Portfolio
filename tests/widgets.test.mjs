import test from "node:test";
import assert from "node:assert/strict";
import { normalizeLeetCodeData, LEETCODE_PROFILE } from "../src/lib/leetcode.js";
import { createRainStream } from "../src/lib/matrix-rain.js";
import useWidgetsStore from "../src/store/widgets.js";

function profileFixture() {
  return {
    data: {
      allQuestionsCount: [
        { difficulty: "All", count: 100 },
        { difficulty: "Easy", count: 30 },
        { difficulty: "Medium", count: 50 },
        { difficulty: "Hard", count: 20 },
      ],
      matchedUser: {
        profile: { ranking: 1234 },
        submitStats: {
          acSubmissionNum: [
            { difficulty: "All", count: 10 },
            { difficulty: "Easy", count: 6 },
            { difficulty: "Medium", count: 3 },
            { difficulty: "Hard", count: 1 },
          ],
        },
      },
      activeDailyCodingChallengeQuestion: {
        date: "2026-10-21",
        link: "/problems/two-sum/",
        question: { questionFrontendId: "1", title: "Two Sum", difficulty: "Easy" },
      },
    },
  };
}

test("LeetCode maps accepted counts, totals and daily challenge separately", () => {
  const stats = normalizeLeetCodeData(profileFixture());
  assert.equal(stats.profile, LEETCODE_PROFILE);
  assert.equal(stats.solved.find((item) => item.difficulty === "All").solved, 10);
  assert.equal(stats.solved.find((item) => item.difficulty === "Hard").total, 20);
  assert.equal(stats.daily.url, "https://leetcode.com/problems/two-sum/");
  assert.equal(stats.ranking, 1234);
});

test("LeetCode displays genuine zero counts instead of treating them as unavailable", () => {
  const fixture = profileFixture();
  fixture.data.matchedUser.submitStats.acSubmissionNum.forEach((item) => {
    item.count = 0;
  });
  assert.ok(normalizeLeetCodeData(fixture).solved.every((item) => item.solved === 0));
});

test("missing or incomplete LeetCode profiles are rejected rather than fabricated", () => {
  assert.throws(() => normalizeLeetCodeData({ data: { matchedUser: null } }));
  const fixture = profileFixture();
  fixture.data.matchedUser.submitStats.acSubmissionNum.pop();
  assert.throws(() => normalizeLeetCodeData(fixture));
});

test("daily problem failure leaves valid profile statistics available", () => {
  const fixture = profileFixture();
  delete fixture.data.activeDailyCodingChallengeQuestion;
  const stats = normalizeLeetCodeData(fixture);
  assert.equal(stats.daily, null);
  assert.equal(stats.solved[0].solved, 10);
});

test("external daily links cannot redirect visitors away from LeetCode", () => {
  const fixture = profileFixture();
  fixture.data.activeDailyCodingChallengeQuestion.link = "https://example.com/phishing";
  assert.equal(normalizeLeetCodeData(fixture).daily, null);
});

test("widgets start with both coding profiles and reorder without duplicates", () => {
  const before = useWidgetsStore.getState().widgets;
  try {
    assert.ok(before.includes("github-heatmap"));
    assert.ok(before.includes("leetcode"));
    useWidgetsStore.getState().moveWidget("leetcode", 0);
    assert.equal(useWidgetsStore.getState().widgets[0], "leetcode");
    assert.equal(new Set(useWidgetsStore.getState().widgets).size, before.length);
    useWidgetsStore.getState().moveWidget("missing-widget", 0);
    assert.equal(useWidgetsStore.getState().widgets.length, before.length);
  } finally {
    useWidgetsStore.setState({ widgets: before });
  }
});

test("widget removal and re-addition do not lose the other profile", () => {
  const before = useWidgetsStore.getState().widgets;
  try {
    useWidgetsStore.getState().toggleWidget("leetcode");
    assert.ok(!useWidgetsStore.getState().widgets.includes("leetcode"));
    assert.ok(useWidgetsStore.getState().widgets.includes("github-heatmap"));
    useWidgetsStore.getState().toggleWidget("leetcode");
    assert.equal(useWidgetsStore.getState().widgets.length, before.length);
  } finally {
    useWidgetsStore.setState({ widgets: before });
  }
});

test("rain streams randomize size, speed, trail length and pulse independently", () => {
  let seed = 11;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const streams = Array.from({ length: 64 }, (_, index) =>
    createRainStream(index * 24, 800, random),
  );
  assert.ok(new Set(streams.map((stream) => stream.size)).size > 8);
  assert.ok(new Set(streams.map((stream) => stream.speed)).size > 32);
  assert.ok(new Set(streams.map((stream) => stream.length)).size > 8);
  assert.ok(streams.every((stream) => stream.size >= 10 && stream.size <= 22));
  assert.ok(streams.every((stream) => stream.period >= 5500 && stream.period <= 10500));
  assert.ok(streams.every((stream) => stream.glyphs.length >= stream.length));
});
