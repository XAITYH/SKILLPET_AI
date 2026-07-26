const https = require('https');
const http = require('http');

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const API_TOKEN = process.env.STRAPI_API_TOKEN || '1a34aebf136d40f1502063fb13d5ab0210488d18a7cc1b040a54fb9379666599fb0bf833870e0468b6d8bee0f54026c40a97a2e956a1a047250d52da26075c526711d04c85bf507124b21f2cce386e7ca1d377ec4b9a4236277b8c16ae4dfb4523a44e3db092139bd269e85aae5aa5937ec82fb1d54dec9a7cc5f2c3fb216efe';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, STRAPI_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method,
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Sample content blocks for "Introduction to Python" chapter
const sampleContentBlocks = [
  {
    type: 'theory',
    content: {
      title: 'What is Python?',
      body: `Python is a **high-level, interpreted programming language** known for its simplicity and readability.\n\n### Key Features:\n- Easy to learn and use\n- Extensive standard library\n- Cross-platform compatibility\n- Strong community support\n\nPython is used in web development, data science, automation, artificial intelligence, and more.`
    },
    difficulty: 'easy',
    hint: 'Think about what makes Python popular among beginners.',
    order: 1
  },
  {
    type: 'code',
    content: {
      title: 'Your First Python Program',
      explanation: `Let's write the classic **Hello World** program in Python. It's just one line!`,
      code: `print("Hello, World!")`,
      task: 'Write a program that prints "Hello, Python!" to the console.',
      expectedAnswer: 'print("Hello, Python!")'
    },
    difficulty: 'easy',
    hint: 'Use the print() function with your message.',
    order: 2
  },
  {
    type: 'fill-blank',
    content: {
      sentence: 'Python uses ___ for indentation instead of curly braces.',
      options: ['spaces', 'brackets', 'indentation'],
      correctIndex: 0
    },
    difficulty: 'easy',
    hint: 'Python emphasizes readability through consistent spacing.',
    order: 3
  },
  {
    type: 'multiple-choice',
    content: {
      question: 'Which of the following is NOT a valid Python variable name?',
      options: ['my_var', '_count', '2nd_value', 'total'],
      correctIndex: 2
    },
    difficulty: 'medium',
    hint: 'Variable names cannot start with a number.',
    order: 4
  },
  {
    type: 'true-false',
    content: {
      statement: 'Python is a statically typed language.',
      correct: false
    },
    difficulty: 'easy',
    hint: 'Think about whether you need to declare variable types.',
    order: 5
  },
  {
    type: 'yes-no',
    content: {
      question: 'Can Python be used for web development?',
      correct: true
    },
    difficulty: 'easy',
    hint: 'Popular frameworks like Django and Flask are built with Python.',
    order: 6
  },
  {
    type: 'matching',
    content: {
      question: 'Which Python keyword is used to define a function?',
      options: ['function', 'def', 'func', 'define'],
      correctIndex: 1
    },
    difficulty: 'easy',
    hint: 'It\'s a short abbreviation.',
    order: 7
  }
];

async function seedContentBlocks() {
  try {
    // Fetch chapters
    console.log('Fetching chapters...');
    const chaptersRes = await makeRequest('GET', '/api/chapters?populate=course&sort=order:asc&pagination[pageSize]=100');
    const chapters = chaptersRes.data || [];
    
    console.log(`Found ${chapters.length} chapters`);
    
    if (chapters.length === 0) {
      console.log('\n❌ No chapters found! Please run seed-chapters.js first.');
      return;
    }
    
    // Find the first chapter of Python Basics course
    const pythonChapter = chapters.find(ch => {
      const courseTitle = ch.course?.title || ch.course?.name || '';
      return courseTitle.toLowerCase().includes('python') && ch.order === 1;
    });
    
    let targetChapter;
    if (pythonChapter) {
      targetChapter = pythonChapter;
      console.log(`\nFound Python Basics chapter: ${targetChapter.title}`);
    } else {
      // Use the first chapter of the first course
      targetChapter = chapters[0];
      const courseTitle = targetChapter.course?.title || targetChapter.course?.name || 'Unknown';
      console.log(`\nPython Basics not found. Using first chapter: ${targetChapter.title} from ${courseTitle}`);
    }
    
    console.log(`Adding content blocks to: ${targetChapter.title}`);
    
    // Delete existing content blocks for this chapter
    const existingBlocks = await makeRequest('GET', `/api/chapter-content-blocks?filters[chapter][documentId][$eq]=${targetChapter.documentId}&pagination[pageSize]=100`);
    if (existingBlocks.data && existingBlocks.data.length > 0) {
      console.log(`Deleting ${existingBlocks.data.length} existing content blocks...`);
      for (const block of existingBlocks.data) {
        try {
          await makeRequest('DELETE', `/api/chapter-content-blocks/${block.documentId}`);
          console.log(`  ✓ Deleted block: ${block.type}`);
        } catch (err) {
          console.error(`  ✗ Failed to delete block:`, err.message);
        }
      }
    }
    
    // Create new content blocks
    for (const block of sampleContentBlocks) {
      try {
        const result = await makeRequest('POST', '/api/chapter-content-blocks', {
          data: {
            ...block,
            chapter: targetChapter.id,
          },
        });
        console.log(`  ✓ Created: ${block.type} - ${block.content.title || block.content.question || 'Block'}`);
      } catch (err) {
        console.error(`  ✗ Failed to create ${block.type}:`, err.message);
      }
    }
    
    console.log('\n✅ Content blocks seed completed!');
  } catch (error) {
    console.error('Seed failed:', error);
  }
}

seedContentBlocks();
