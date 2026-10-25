import STORIES from "./stories";

export const DEMO_LEARNER = {
  email: "learner@demo.com",
  password: "demo1234",
  username: "DemoReader",
};

export const DEMO_ADMIN = {
  email: "admin@gmail.com",
  password: "admin",
};

export const STORAGE_KEY = "art-demo-db-v1";

const LEARNER_ID = "a11ce0000000000000000000000demo1";
const SAM_ID = "a11ce0000000000000000000000demo2";
const AISHA_ID = "a11ce0000000000000000000000demo3";
const ADMIN_ID = "ad3100000000000000000000000demo1";

let cache = null;

function createSeed() {
  return {
    sessionUserId: null,
    users: [
      {
        id: LEARNER_ID,
        email: DEMO_LEARNER.email,
        username: DEMO_LEARNER.username,
        password: DEMO_LEARNER.password,
        accountType: "learner",
        readStoryIds: [1, 2, 11],
      },
      {
        id: SAM_ID,
        email: "sam@demo.com",
        username: "Sam",
        password: "demo1234",
        accountType: "learner",
        readStoryIds: [3],
      },
      {
        id: AISHA_ID,
        email: "aisha@demo.com",
        username: "Aisha",
        password: "demo1234",
        accountType: "learner",
        readStoryIds: [12, 21],
      },
      {
        id: ADMIN_ID,
        email: DEMO_ADMIN.email,
        username: "Admin",
        password: DEMO_ADMIN.password,
        accountType: "admin",
        readStoryIds: [],
      },
    ],
    stories: STORIES.map((story) => ({ ...story })),
    statistics: [
      stat(1, LEARNER_ID, 1, 2, 78, 86, "2024-09-12T10:15:00"),
      stat(2, LEARNER_ID, 2, 1, 82, 92, "2024-09-18T14:40:00"),
      stat(3, LEARNER_ID, 11, 4, 70, 74, "2024-10-02T09:05:00"),
      stat(4, SAM_ID, 3, 5, 60, 68, "2024-09-20T11:00:00"),
      stat(5, AISHA_ID, 12, 2, 85, 91, "2024-09-28T16:20:00"),
      stat(6, AISHA_ID, 21, 3, 90, 88, "2024-10-08T13:45:00"),
    ],
  };
}

function stat(id, learnerID, storyID, wordErrorRate, wordsPerMinute, pronounciationScore, recordedDate) {
  return {
    id,
    learnerID,
    storyID,
    wordErrorRate,
    wordsPerMinute,
    pronounciationScore,
    recordedDate,
  };
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch (err) {
    /* Private mode can block storage; the in-memory session still works. */
  }
}

export function loadDb() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      cache = JSON.parse(raw);
      return cache;
    }
  } catch (err) {
    cache = null;
  }
  cache = createSeed();
  persist();
  return cache;
}

export function updateDb(mutator) {
  const db = loadDb();
  const result = mutator(db);
  persist();
  return result;
}

export function resetDemoState() {
  cache = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    /* ignore */
  }
}

export function currentUser(db) {
  return db.users.find((user) => user.id === db.sessionUserId) || null;
}

export function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `id${Math.random().toString(16).slice(2)}000000000000000000000000`.slice(0, 32);
}
