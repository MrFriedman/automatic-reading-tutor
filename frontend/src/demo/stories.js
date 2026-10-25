/* Seeded passages copied from the Flask initial story catalogue. */
const STORIES = [
  {
    "id": 1,
    "title": "The Garden Adventure",
    "content": "Once, Lucy found a magical passport in the garden. She and a mermaid played together. They laughed until it was time to go home. The mermaid thanked Lucy before leaving.",
    "difficulty": "easy"
  },
  {
    "id": 2,
    "title": "Bruce and the Sauce",
    "content": "Bruce and his friend played outside. Bruce wondered if they could trust the sauce. His friend said it was always good. They kept playing happily, enjoying their day.",
    "difficulty": "easy"
  },
  {
    "id": 3,
    "title": "The Big Flower",
    "content": "Jack picked a big flower from the garden. Its petals fell off before he got home. With a friend's help, Jack planted new seeds. Soon, new flowers started to grow.",
    "difficulty": "easy"
  },
  {
    "id": 4,
    "title": "Lucy Sells Her Knee",
    "content": "Lucy went to the market to sell her knee. An old woman helped her find a buyer. Lucy was happy to get good advice. She thanked the woman and left.",
    "difficulty": "easy"
  },
  {
    "id": 5,
    "title": "The Careful Bug",
    "content": "John wanted to play with a bug. His mom put the bug in a case to keep it safe. John understood and smiled. They played some more before dinner.",
    "difficulty": "easy"
  },
  {
    "id": 6,
    "title": "Tim's Adventure by the Lake",
    "content": "Tim and his family walked by a lake. Tim wanted to explore, so they all went together. He found colorful rocks and plants. It was a special day for Tim.",
    "difficulty": "easy"
  },
  {
    "id": 7,
    "title": "The Mysterious Toy",
    "content": "Jill’s toy car moved on its own. It led her to a box. Inside was a surprise toy. Jill was excited and showed her parents.",
    "difficulty": "easy"
  },
  {
    "id": 8,
    "title": "The Farmer and the Duck",
    "content": "A farmer found his duck talking to other animals. The duck told them about a pond nearby. They all went to see the pond together. They found fish and bugs.",
    "difficulty": "easy"
  },
  {
    "id": 9,
    "title": "Amy and the Painter",
    "content": "Amy asked a painter to help with her room. He painted it beautifully. Amy was very happy with the new look. She thanked him and watched him leave.",
    "difficulty": "easy"
  },
  {
    "id": 10,
    "title": "Lola’s Purple Pastry",
    "content": "Lola found a purple pastry in the park. She took a bite and smiled. It was very sweet. She saved the rest to share with her mom.",
    "difficulty": "easy"
  },
  {
    "id": 11,
    "title": "The Brave Sailor",
    "content": "A sailor and his crew faced a storm. They worked hard to stay safe. After a long fight, they reached the harbor. Everyone was tired but happy.",
    "difficulty": "medium"
  },
  {
    "id": 12,
    "title": "The Magical Forest",
    "content": "In a magical forest, a group of friends found a talking tree. The tree shared wisdom about nature. The friends felt thankful. They promised to visit again.",
    "difficulty": "medium"
  },
  {
    "id": 13,
    "title": "The Lost Treasure",
    "content": "A group of explorers found a treasure map. They followed it for days. At last, they found the chest. It was full of gold and jewels.",
    "difficulty": "medium"
  },
  {
    "id": 14,
    "title": "The Flying Carpet",
    "content": "A boy found a flying carpet in his attic. He flew over the city. He saw amazing sights from above. Then, he safely returned home.",
    "difficulty": "medium"
  },
  {
    "id": 15,
    "title": "The Wise Old Owl",
    "content": "A curious child visited an old owl. The owl was very wise. The child listened carefully to its advice. The lessons stayed with the child for life.",
    "difficulty": "medium"
  },
  {
    "id": 16,
    "title": "The Enchanted Lake",
    "content": "A girl found an enchanted lake near her village. The lake granted wishes. She made a wish for her family. Her wish came true, bringing joy to all.",
    "difficulty": "medium"
  },
  {
    "id": 17,
    "title": "The King's Challenge",
    "content": "The king challenged his people with a riddle. Many tried to solve it. A clever villager finally succeeded. The king gave the villager a great prize.",
    "difficulty": "medium"
  },
  {
    "id": 18,
    "title": "The Hidden Door",
    "content": "Two children found a hidden door in their house. Behind it was a magical land. They made new friends and had many adventures.",
    "difficulty": "medium"
  },
  {
    "id": 19,
    "title": "The Forgotten Kingdom",
    "content": "An explorer found a forgotten kingdom. The people there were kind. Together, they restored the kingdom. The explorer stayed there for many years.",
    "difficulty": "medium"
  },
  {
    "id": 20,
    "title": "The Curious Robot",
    "content": "A robot wanted to learn about feelings. It met many people and asked them questions. In the end, the robot understood love and friendship.",
    "difficulty": "medium"
  },
  {
    "id": 21,
    "title": "The Philosopher’s Dilemma",
    "content": "A philosopher thought about life. He spent many nights thinking. In the end, he realized that people are the most important part of life. His heart was at peace.",
    "difficulty": "hard"
  },
  {
    "id": 22,
    "title": "The Warrior’s Sacrifice",
    "content": "A warrior fought to protect his village. He gave up everything to save his people. The villagers honored him for years. His story became a legend.",
    "difficulty": "hard"
  },
  {
    "id": 23,
    "title": "The Infinite Library",
    "content": "A scholar found a library with endless books. He read many books for years. In the end, he found that wisdom comes from inside. His mind was clear.",
    "difficulty": "hard"
  },
  {
    "id": 24,
    "title": "The Last Dragon",
    "content": "A knight found the last dragon. Instead of fighting it, they became friends. Together, they protected the land from danger. The people praised the knight.",
    "difficulty": "hard"
  },
  {
    "id": 25,
    "title": "The Time Traveler",
    "content": "A scientist built a time machine. He traveled through the past and future. Each time, he saw how small actions could change everything. He learned to act carefully.",
    "difficulty": "hard"
  },
  {
    "id": 26,
    "title": "The Painter’s Secret",
    "content": "A painter created beautiful art. People admired his work, but he had a secret. The colors he used were enchanted. Only the painter knew this.",
    "difficulty": "hard"
  },
  {
    "id": 27,
    "title": "The Starship Captain",
    "content": "In the future, a captain led her crew through space. They faced many dangers. With courage, they protected the galaxy. The captain earned her crew's trust.",
    "difficulty": "hard"
  },
  {
    "id": 28,
    "title": "The Desert Wanderer",
    "content": "A wanderer traveled across the desert. He faced many challenges along the way. In the end, he learned that the journey itself was the true reward.",
    "difficulty": "hard"
  },
  {
    "id": 29,
    "title": "The Philosopher’s Stone",
    "content": "An alchemist searched for the philosopher’s stone. He wanted immortality. In the end, he found that true immortality comes from what we leave behind.",
    "difficulty": "hard"
  },
  {
    "id": 30,
    "title": "The Final Frontier",
    "content": "An explorer traveled to the edge of space. There, he realized the true meaning of exploration. Understanding our place in the universe was his greatest discovery.",
    "difficulty": "hard"
  }
];

export default STORIES;
