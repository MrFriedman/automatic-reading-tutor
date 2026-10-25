import { render, screen } from "@testing-library/react";
import httpClient from "../httpClient";
import { resolveDemoMode, isDemoMode } from "./config";
import DemoBanner, { DEMO_BANNER_TEXT, DEMO_BANNER_URL } from "./DemoBanner";
import { clearScoredSentences } from "./scoring";
import { DEMO_ADMIN, DEMO_LEARNER, resetDemoState } from "./store";

beforeEach(() => {
  resetDemoState();
  clearScoredSentences();
});

test("demo mode is on unless an API URL or an explicit flag says otherwise", () => {
  expect(resolveDemoMode({})).toBe(true);
  expect(resolveDemoMode({ REACT_APP_API_URL: "" })).toBe(true);
  expect(resolveDemoMode({ REACT_APP_API_URL: "http://localhost:5000" })).toBe(false);
  expect(
    resolveDemoMode({
      REACT_APP_API_URL: "http://localhost:5000",
      REACT_APP_DEMO_MODE: "true",
    })
  ).toBe(true);
  expect(resolveDemoMode({ REACT_APP_DEMO_MODE: "false" })).toBe(false);
  expect(isDemoMode()).toBe(true);
});

test("banner links to the project site", () => {
  render(<DemoBanner />);
  const link = screen.getByRole("link", { name: DEMO_BANNER_TEXT });
  expect(link).toHaveAttribute("href", DEMO_BANNER_URL);
});

test("seeded sessions, library, scoring, and statistics stay in the browser", async () => {
  await expect(
    httpClient.post("/login", { email: "missing@demo.com", password: "nope" })
  ).rejects.toMatchObject({
    response: { status: 401, data: { error: "User does not exist" } },
  });

  const login = await httpClient.post("/login", {
    email: DEMO_LEARNER.email,
    password: DEMO_LEARNER.password,
  });
  expect(login.data.accountType).toBe("learner");

  const me = await httpClient.get("/learner/@me");
  expect(me.data.username).toBe(DEMO_LEARNER.username);

  const library = await httpClient.get("/story/library", { params: { difficulty: "easy" } });
  expect(library.data).toHaveLength(10);
  expect(library.data.find((story) => story.id === 1).read).toBe(true);
  expect(library.data.find((story) => story.id === 3).read).toBe(false);

  const sentence = "Once, Lucy found a magical passport in the garden";
  const form = new FormData();
  form.append("audio", new Blob(["demo"]), "audio.wav");
  form.append("currentSentence", sentence);
  const missed = await httpClient.post("/learner/check_mispronounciation", form);
  expect(missed.data.results[0].word).toBe("magical");
  expect(missed.data.results[0].audio_url).toMatch(/^data:audio\/wav/);
  expect(missed.data.results[0].syllable_string).toContain("-");

  const retry = new FormData();
  retry.append("audio", new Blob(["demo"]), "audio.wav");
  retry.append("currentSentence", "magical");
  const stillWrong = await httpClient.post("/learner/check_mispronounciation", retry);
  expect(stillWrong.data.results[0].word).toBe("magical");
  const passed = await httpClient.post("/learner/check_mispronounciation", retry);
  expect(passed.data.results).toBe("pass");

  const again = new FormData();
  again.append("audio", new Blob(["demo"]), "audio.wav");
  again.append("currentSentence", sentence);
  const secondPass = await httpClient.post("/learner/check_mispronounciation", again);
  expect(secondPass.data.results).toBe("pass");

  const later = new FormData();
  later.append("audio", new Blob(["demo"]), "audio.wav");
  later.append("currentSentence", "She and a mermaid played together");
  const laterPass = await httpClient.post("/learner/check_mispronounciation", later);
  expect(laterPass.data.results).toBe("pass");

  const uploaded = await httpClient.post("/statistic/upload_statistics", formData({
    errors_made: "1",
    pronounciation_score: "90",
    story_id: "1",
    wpm_averaged: "80",
  }));
  const duplicate = await httpClient.post("/statistic/upload_statistics", formData({
    errors_made: "1",
    pronounciation_score: "90",
    story_id: "1",
    wpm_averaged: "80",
  }));
  expect(duplicate.data.statistic_id).toBe(uploaded.data.statistic_id);

  const storyStat = await httpClient.get("/statistic/get_story_statistic", {
    params: { statistic_id: uploaded.data.statistic_id },
  });
  expect(storyStat.data.storyTitle).toBe("The Garden Adventure");
  expect(storyStat.data.pronounciationScore).toBe(90);

  await httpClient.post("/learner/add_read_story", formData({ storyID: "3" }));
  const reread = await httpClient.get("/story/library", { params: { difficulty: "easy" } });
  expect(reread.data.find((story) => story.id === 3).read).toBe(true);

  const recommendation = await httpClient.post("/learner/recommend_story", {
    difficultyLevel: "easy",
    pronounciationScore: 90,
  });
  expect(recommendation.data.recommended_story.difficulty).toBe("medium");

  const lifetime = await httpClient.get("learner/get_lifetime_statistics");
  expect(lifetime.data.username).toBe("DemoReader");
  expect(lifetime.data.total_stories_read).toBeGreaterThanOrEqual(3);

  await expect(
    httpClient.post("/register", {
      email: DEMO_LEARNER.email,
      username: "Someone",
      password: "demo1234",
    })
  ).rejects.toMatchObject({ response: { status: 409 } });

  await httpClient.post("/logout");
  await expect(httpClient.get("/learner/@me")).rejects.toMatchObject({
    response: { status: 401 },
  });
});

test("admin demo session can manage users, stories, and statistics", async () => {
  const login = await httpClient.post("/login", {
    email: DEMO_ADMIN.email,
    password: DEMO_ADMIN.password,
  });
  expect(login.data.accountType).toBe("admin");
  const me = await httpClient.get("/admin/@me");
  expect(me.data.email).toBe(DEMO_ADMIN.email);

  const overview = await httpClient.get("/admin/general_statistics");
  expect(overview.data.averagePronunciationScore).toBe(83.17);
  expect(overview.data.averageWPM).toBe(77.5);
  expect(overview.data.averageWordErrorRate).toBe(2.83);

  const learners = await httpClient.get("/admin/get_all_learners");
  const sam = learners.data.find((user) => user.username === "Sam");
  const edited = await httpClient.put(`/admin/edit_user/${sam.id}`, {
    username: "Samuel",
    email: "samuel@demo.com",
  });
  expect(edited.data.username).toBe("Samuel");

  await httpClient.delete(`/admin/delete_user/${sam.id}`);
  const afterDelete = await httpClient.get("/admin/statistics_get_all_learners");
  expect(afterDelete.data.find((user) => user.username === "Samuel")).toBeUndefined();

  const individual = await httpClient.get("/admin/learner_lifetime_statistics", {
    params: { learner_id: learners.data.find((user) => user.username === "Aisha").id },
  });
  expect(individual.data.total_stories_read).toBe(2);

  await httpClient.post("/admin/add_story", {
    title: "Expo Day",
    content: "The class presented a reading tutor. Visitors tried a story.",
    difficulty: "easy",
  });

  await httpClient.post("/logout");
  await httpClient.post("/login", {
    email: DEMO_LEARNER.email,
    password: DEMO_LEARNER.password,
  });
  const easy = await httpClient.get("/story/library", { params: { difficulty: "easy" } });
  expect(easy.data.some((story) => story.title === "Expo Day")).toBe(true);
});

function formData(fields) {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => data.append(key, value));
  return data;
}
