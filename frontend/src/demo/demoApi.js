import { clearScoredSentences, scoreSentence } from "./scoring";
import { currentUser, newId, updateDb } from "./store";

export function requestPath(config) {
  const raw = String((config && config.url) || "");
  let path = raw.split("?")[0];
  if (/^https?:\/\//i.test(path)) {
    try {
      path = new URL(path).pathname;
    } catch (err) {
      /* keep the raw path */
    }
  }
  if (!path.startsWith("/")) path = `/${path}`;
  path = path.replace(/\/{2,}/g, "/");
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path;
}

function readBody(data) {
  if (!data) return {};
  if (typeof FormData !== "undefined" && data instanceof FormData) {
    const body = {};
    data.forEach((value, key) => {
      body[key] = value;
    });
    return body;
  }
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch (err) {
      return {};
    }
  }
  if (typeof data === "object") return data;
  return {};
}

function sameId(left, right) {
  return String(left) === String(right);
}

function round2(value) {
  return Math.round(Number(value) * 100) / 100;
}

function average(records, key) {
  if (!records.length) return 0;
  const total = records.reduce((sum, record) => sum + Number(record[key]), 0);
  return round2(total / records.length);
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || "");
  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function storyRecord(stat, db) {
  const story = db.stories.find((item) => sameId(item.id, stat.storyID));
  return {
    storyTitle: story ? story.title : "Unknown story",
    storyDifficulty: story ? story.difficulty : "",
    wordErrorRate: stat.wordErrorRate,
    wordsPerMinute: stat.wordsPerMinute,
    pronunciationScore: stat.pronounciationScore,
    dateTime: formatDateTime(stat.recordedDate),
  };
}

function summarize(stats, db, extra) {
  if (!stats.length) {
    return {
      message: "No statistics exist",
      total_stories_read: 0,
      average_word_error_rate: 0,
      average_pronounciation_score: 0,
      average_words_per_minute: 0,
      all_statistic_records: [],
      ...extra,
    };
  }
  const storyIds = new Set(stats.map((stat) => String(stat.storyID)));
  return {
    total_stories_read: storyIds.size,
    average_word_error_rate: average(stats, "wordErrorRate"),
    average_words_per_minute: average(stats, "wordsPerMinute"),
    average_pronounciation_score: average(stats, "pronounciationScore"),
    all_statistic_records: stats.map((stat) => storyRecord(stat, db)),
    ...extra,
  };
}

function login(db, body) {
  const email = body.email || "";
  const password = body.password || "";
  const user = db.users.find((item) => item.email === email);
  if (!user) return { status: 401, data: { error: "User does not exist" } };
  if (user.password !== password) return { status: 401, data: { error: "Unauthorized" } };
  db.sessionUserId = user.id;
  return {
    status: 200,
    data: { id: user.id, email: user.email, accountType: user.accountType },
  };
}

function register(db, body) {
  const email = (body.email || "").trim();
  const username = (body.username || "").trim();
  const password = body.password || "";
  if (db.users.some((user) => user.email === email)) {
    return { status: 409, data: { error: "User email already exists" } };
  }
  if (db.users.some((user) => user.accountType === "learner" && user.username === username)) {
    return { status: 409, data: { error: "Username already exists" } };
  }
  const user = {
    id: newId(),
    email,
    username,
    password,
    accountType: "learner",
    readStoryIds: [],
  };
  db.users.push(user);
  db.sessionUserId = user.id;
  return {
    status: 200,
    data: { id: user.id, email: user.email, username: user.username, password: user.password },
  };
}

function logout(db) {
  db.sessionUserId = null;
  clearScoredSentences();
  return { status: 200, data: "200" };
}

function learnerMe(db) {
  const user = currentUser(db);
  if (!user || user.accountType !== "learner") {
    return { status: 401, data: { error: "Unauthorized" } };
  }
  return {
    status: 200,
    data: { id: user.id, email: user.email, username: user.username },
  };
}

function adminMe(db) {
  const user = currentUser(db);
  if (!user || user.accountType !== "admin") {
    return { status: 401, data: { error: "Unauthorized" } };
  }
  return { status: 200, data: { id: user.id, email: user.email } };
}

function library(db, difficulty) {
  const user = currentUser(db);
  if (!user) return { status: 401, data: { error: "Unauthorized" } };
  if (user.accountType !== "learner") {
    return { status: 404, data: { error: "Learner not found" } };
  }
  const readIds = user.readStoryIds || [];
  const stories = db.stories
    .filter((story) => story.difficulty === difficulty)
    .map((story) => ({
      id: story.id,
      title: story.title,
      content: story.content,
      difficulty: story.difficulty,
      read: readIds.some((id) => sameId(id, story.id)),
    }));
  return { status: 200, data: stories };
}

function addReadStory(db, body) {
  const user = currentUser(db);
  if (!user || user.accountType !== "learner") {
    return { status: 401, data: { error: "Unauthorized" } };
  }
  const story = db.stories.find((item) => sameId(item.id, body.storyID));
  if (!story) return { status: 404, data: { error: "Story not found" } };
  user.readStoryIds = user.readStoryIds || [];
  if (user.readStoryIds.some((id) => sameId(id, story.id))) {
    return { status: 200, data: { message: "Story already marked as read" } };
  }
  user.readStoryIds.push(story.id);
  return { status: 200, data: { message: "Story added to user's read stories successfully" } };
}

function recommendedDifficulty(level, score) {
  if (level === "easy" && score < 75) return "easy";
  if (level === "easy" && score >= 75) return "medium";
  if (level === "medium" && score < 50) return "easy";
  if (level === "medium" && score < 75) return "medium";
  if (level === "medium" && score >= 75) return "hard";
  if (level === "hard" && score < 75) return "medium";
  if (level === "hard" && score >= 75) return "hard";
  return "";
}

function recommendStory(db, body) {
  const difficulty = recommendedDifficulty(body.difficultyLevel, Number(body.pronounciationScore));
  const stories = db.stories.filter((story) => story.difficulty === difficulty);
  if (!stories.length) return { status: 200, data: { recommended_story: "none" } };
  const story = stories[Math.floor(Math.random() * stories.length)];
  return {
    status: 200,
    data: {
      recommended_story: {
        id: story.id,
        title: story.title,
        content: story.content,
        difficulty: story.difficulty,
      },
    },
  };
}

function lifetime(db) {
  const user = currentUser(db);
  if (!user || user.accountType !== "learner") {
    return { status: 401, data: { error: "Unauthorized" } };
  }
  const stats = db.statistics.filter((stat) => sameId(stat.learnerID, user.id));
  return {
    status: 200,
    data: summarize(stats, db, { username: user.username }),
  };
}

function checkPronunciation(body) {
  if (!body.audio) return { status: 400, data: { error: "No audio file provided" } };
  return { status: 200, data: scoreSentence(body.currentSentence || "") };
}

function uploadStatistics(db, body) {
  const errorsMade = body.errors_made;
  const pronounciationScore = body.pronounciation_score;
  const storyId = body.story_id;
  if (errorsMade === undefined || errorsMade === "" || pronounciationScore === undefined || pronounciationScore === "" || !storyId) {
    return { status: 400, data: { error: "Missing data" } };
  }
  const user = currentUser(db);
  if (!user) return { status: 401, data: { error: "Unauthorized" } };

  const wordsPerMinute = Number(body.wpm_averaged);
  const recent = [...db.statistics].reverse().find((stat) => {
    const age = Date.now() - new Date(stat.recordedDate).getTime();
    return (
      sameId(stat.learnerID, user.id) &&
      sameId(stat.storyID, storyId) &&
      Number(stat.wordErrorRate) === Number(errorsMade) &&
      Number(stat.pronounciationScore) === Number(pronounciationScore) &&
      age >= 0 &&
      age < 4000
    );
  });
  if (recent) {
    return {
      status: 201,
      data: { message: "Statistic added successfully", statistic_id: recent.id },
    };
  }

  const id = db.statistics.reduce((max, stat) => Math.max(max, Number(stat.id)), 0) + 1;
  db.statistics.push({
    id,
    learnerID: user.id,
    storyID: Number(storyId),
    wordErrorRate: Number(errorsMade),
    wordsPerMinute: Number.isFinite(wordsPerMinute) ? wordsPerMinute : 0,
    pronounciationScore: Number(pronounciationScore),
    recordedDate: new Date().toISOString(),
  });
  return {
    status: 201,
    data: { message: "Statistic added successfully", statistic_id: id },
  };
}

function getStoryStatistic(db, statisticId) {
  const stat = db.statistics.find((item) => sameId(item.id, statisticId));
  if (!stat) return { status: 401, data: { error: "No Statistics" } };
  const story = db.stories.find((item) => sameId(item.id, stat.storyID));
  return {
    status: 200,
    data: {
      storyID: stat.storyID,
      storyTitle: story ? story.title : "Unknown story",
      storyDifficulty: story ? story.difficulty : "",
      wordErrorRate: stat.wordErrorRate,
      wordsPerMinute: stat.wordsPerMinute,
      pronounciationScore: stat.pronounciationScore,
      date: formatDateTime(stat.recordedDate),
    },
  };
}

function allLearners(db) {
  return {
    status: 200,
    data: db.users
      .filter((user) => user.accountType === "learner")
      .map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        password: user.password,
      })),
  };
}

function statisticLearners(db) {
  return {
    status: 200,
    data: db.users
      .filter((user) => user.accountType === "learner")
      .map((user) => ({ id: user.id, username: user.username })),
  };
}

function generalStatistics(db) {
  if (!db.statistics.length) {
    return { status: 404, data: { message: "No statistics available." } };
  }
  return {
    status: 200,
    data: {
      averagePronunciationScore: average(db.statistics, "pronounciationScore"),
      averageWPM: average(db.statistics, "wordsPerMinute"),
      averageWordErrorRate: average(db.statistics, "wordErrorRate"),
    },
  };
}

function adminLifetime(db, learnerId) {
  if (!learnerId) return { status: 401, data: { error: "Unauthorized" } };
  const stats = db.statistics.filter((stat) => sameId(stat.learnerID, learnerId));
  return { status: 200, data: summarize(stats, db, {}) };
}

function addStory(db, body) {
  const title = body.title;
  const content = body.content;
  const difficulty = body.difficulty;
  if (!title || !content || !difficulty) {
    return { status: 400, data: { error: "Missing data" } };
  }
  const id = db.stories.reduce((max, story) => Math.max(max, Number(story.id)), 0) + 1;
  db.stories.push({ id, title, content, difficulty });
  return { status: 201, data: { message: "Story added successfully" } };
}

function editUser(db, userId, body) {
  const user = db.users.find((item) => sameId(item.id, userId) && item.accountType === "learner");
  if (!user) return { status: 404, data: { error: "User not found" } };
  const username = body.username;
  const email = body.email;
  if (db.users.some((item) => item.email === email && !sameId(item.id, userId))) {
    return { status: 409, data: { error: "Email already exists" } };
  }
  if (
    db.users.some(
      (item) => item.accountType === "learner" && item.username === username && !sameId(item.id, userId)
    )
  ) {
    return { status: 409, data: { error: "Username already exists" } };
  }
  user.username = username;
  user.email = email;
  return { status: 200, data: { id: user.id, username: user.username, email: user.email } };
}

function deleteUser(db, userId) {
  const index = db.users.findIndex((item) => sameId(item.id, userId) && item.accountType === "learner");
  if (index === -1) return { status: 404, data: { error: "User not found" } };
  const [removed] = db.users.splice(index, 1);
  db.statistics = db.statistics.filter((stat) => !sameId(stat.learnerID, removed.id));
  return { status: 200, data: { message: "User deleted successfully" } };
}

function route(db, method, path, body, params) {
  if (method === "post" && path === "/login") return login(db, body);
  if (method === "post" && path === "/register") return register(db, body);
  if (method === "post" && path === "/logout") return logout(db);
  if (method === "get" && path === "/learner/@me") return learnerMe(db);
  if (method === "get" && path === "/learner/get_lifetime_statistics") return lifetime(db);
  if (method === "post" && path === "/learner/add_read_story") return addReadStory(db, body);
  if (method === "post" && path === "/learner/recommend_story") return recommendStory(db, body);
  if (method === "post" && path === "/learner/check_mispronounciation") return checkPronunciation(body);
  if (method === "get" && path === "/story/library") return library(db, params.difficulty);
  if (method === "post" && path === "/statistic/upload_statistics") return uploadStatistics(db, body);
  if (method === "get" && path === "/statistic/get_story_statistic") {
    return getStoryStatistic(db, params.statistic_id);
  }
  if (method === "get" && path === "/admin/@me") return adminMe(db);
  if (method === "get" && path === "/admin/get_all_learners") return allLearners(db);
  if (method === "get" && path === "/admin/statistics_get_all_learners") return statisticLearners(db);
  if (method === "get" && path === "/admin/general_statistics") return generalStatistics(db);
  if (method === "get" && path === "/admin/learner_lifetime_statistics") {
    return adminLifetime(db, params.learner_id);
  }
  if (method === "post" && path === "/admin/add_story") return addStory(db, body);

  const edit = path.match(/^\/admin\/edit_user\/([^/]+)$/);
  if (method === "put" && edit) return editUser(db, decodeURIComponent(edit[1]), body);
  const remove = path.match(/^\/admin\/delete_user\/([^/]+)$/);
  if (method === "delete" && remove) return deleteUser(db, decodeURIComponent(remove[1]));

  return { status: 404, data: { error: `No demo handler for ${method.toUpperCase()} ${path}` } };
}

export function handleDemoRequest(config) {
  const method = String((config && config.method) || "get").toLowerCase();
  const path = requestPath(config || {});
  const body = readBody(config && config.data);
  const params = (config && config.params) || {};
  return updateDb((db) => route(db, method, path, body, params));
}
