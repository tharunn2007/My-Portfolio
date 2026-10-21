export const LEETCODE_USERNAME = "tharunnd";
export const LEETCODE_PROFILE = `https://leetcode.com/u/${LEETCODE_USERNAME}/`;

const count = (value) => (Number.isFinite(value) && value >= 0 ? Math.floor(value) : null);

export function normalizeLeetCodeData(payload) {
  const data = payload?.data;
  if (!data?.matchedUser) throw new Error("LeetCode profile unavailable");
  const submissions = data.matchedUser.submitStats?.acSubmissionNum;
  const totals = data.allQuestionsCount;
  if (!Array.isArray(submissions) || !Array.isArray(totals))
    throw new Error("Invalid LeetCode statistics");
  const solved = ["All", "Easy", "Medium", "Hard"].map((difficulty) => ({
    difficulty,
    solved: count(submissions.find((item) => item.difficulty === difficulty)?.count),
    total: count(totals.find((item) => item.difficulty === difficulty)?.count),
  }));
  if (solved.some((item) => item.solved === null || item.total === null))
    throw new Error("Incomplete LeetCode statistics");
  const challenge = data.activeDailyCodingChallengeQuestion;
  const question = challenge?.question;
  // Never turn an upstream string into an arbitrary external URL.
  const daily =
    question?.title && /^\/problems\/[a-z0-9-]+\/?$/.test(challenge?.link || "")
      ? {
          title: question.title,
          number: question.questionFrontendId,
          difficulty: question.difficulty,
          url: `https://leetcode.com${challenge.link}`,
          date: challenge.date,
        }
      : null;
  return {
    username: LEETCODE_USERNAME,
    profile: LEETCODE_PROFILE,
    ranking: count(data.matchedUser.profile?.ranking),
    solved,
    daily,
    updatedAt: new Date().toISOString(),
  };
}
