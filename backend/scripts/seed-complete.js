/**
 * Complete Seed Script - All Courses with Content Blocks
 * 
 * Run: node scripts/seed-complete.js
 * Prerequisites: Strapi running on localhost:1337, courses and chapters exist
 */

const https = require('https');
const http = require('http');

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const API_TOKEN = process.env.STRAPI_API_TOKEN || '1a34aebf136d40f1502063fb13d5ab0210488d18a7cc1b040a54fb9379666599fb0bf833870e0468b6d8bee0f54026c40a97a2e956a1a047250d52da26075c526711d04c85bf507124b21f2cce386e7ca1d377ec4b9a4236277b8c16ae4dfb4523a44e3db092139bd269e85aae5aa5937ec82fb1d54dec9a7cc5f2c3fb216efe';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, STRAPI_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: { 'Authorization': `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
    };
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          res.statusCode >= 400 ? reject(new Error(`HTTP ${res.statusCode}`)) : resolve(parsed);
        } catch (e) { resolve(body); }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Generic content generator for any course/chapter
function generateContent(courseTitle, chapterTitle, chapterNum) {
  const safeTitle = courseTitle || 'this topic';
  const safeChapter = chapterTitle || 'this chapter';
  
  return [
    {
      type: 'theory',
      content: {
        title: `Welcome to ${safeChapter}`,
        body: `This chapter covers **${safeChapter}** in the context of **${safeTitle}**.\n\n### What You'll Learn:\n- Core concepts and principles\n- Practical applications\n- Best practices and tips\n\nLet's begin your learning journey!`
      },
      difficulty: 'easy',
      hint: 'Every journey starts with a single step.',
      order: 1
    },
    {
      type: 'multiple-choice',
      content: {
        question: `What is a key concept in ${safeChapter}?`,
        options: [
          'Theoretical knowledge only',
          'Practical application',
          'Both theory and practice',
          'None of the above'
        ],
        correctIndex: 2
      },
      difficulty: 'easy',
      hint: 'Think about comprehensive learning.',
      order: 2
    },
    {
      type: 'true-false',
      content: {
        statement: `${safeTitle} is an important field in technology.`,
        correct: true
      },
      difficulty: 'easy',
      hint: 'Consider the impact of this field.',
      order: 3
    },
    {
      type: 'fill-blank',
      content: {
        sentence: `___ is essential for mastering ${safeTitle}.`,
        options: ['Practice', 'Memorization', 'Avoidance', 'Speed'],
        correctIndex: 0
      },
      difficulty: 'easy',
      hint: 'Learning by doing.',
      order: 4
    },
    {
      type: 'yes-no',
      content: {
        question: `Is hands-on experience important for learning ${safeTitle}?`,
        correct: true
      },
      difficulty: 'easy',
      hint: 'Practice makes perfect.',
      order: 5
    },
    {
      type: 'matching',
      content: {
        question: 'Match each learning aspect with its importance:',
        options: [
          'Theory - Understanding concepts',
          'Practice - Building skills',
          'Feedback - Improving performance',
          'Consistency - Long-term retention'
        ],
        correctIndex: 0
      },
      difficulty: 'easy',
      hint: 'Theory provides the foundation.',
      order: 6
    },
    {
      type: 'code',
      content: {
        title: 'Your First Code Example',
        explanation: `Let's write some code related to ${safeTitle}.`,
        code: `# Example code\nprint("Hello, ${safeTitle}!")\n\n# Variables\nx = 42\ny = "learning"\nprint(f"Value: {x}, Topic: {y}")`,
        task: 'What does this code output?',
        expectedAnswer: 'Hello, ${safeTitle}!'
      },
      difficulty: 'easy',
      hint: 'Run the code mentally.',
      order: 7
    }
  ];
}

async function seedAllCourses() {
  try {
    console.log('Fetching courses and chapters...\n');
    
    // Fetch all chapters with course populated
    const chaptersRes = await makeRequest('GET', '/api/chapters?populate[course]=true&sort=order:asc&pagination[pageSize]=100');
    const chapters = chaptersRes.data || [];
    
    console.log(`Found ${chapters.length} chapters\n`);
    
    if (chapters.length === 0) {
      console.log('No chapters found! Please run seed-chapters.js first.');
      return;
    }
    
    // Group chapters by course
    const chaptersByCourse = {};
    for (const ch of chapters) {
      const courseTitle = ch.course?.title || ch.course?.name || 'Unknown';
      const courseSlug = ch.course?.slug || ch.course?.documentId || 'unknown';
      if (!chaptersByCourse[courseTitle]) {
        chaptersByCourse[courseTitle] = { slug: courseSlug, chapters: [] };
      }
      chaptersByCourse[courseTitle].chapters.push(ch);
    }
    
    console.log('Courses with chapters:');
    for (const [title, data] of Object.entries(chaptersByCourse)) {
      console.log(`  - ${title}: ${data.chapters.length} chapters`);
    }
    console.log('');
    
    let totalBlocksCreated = 0;
    
    // Process each course
    for (const [courseTitle, courseData] of Object.entries(chaptersByCourse)) {
      console.log(`${'='.repeat(60)}`);
      console.log(`Processing: ${courseTitle}`);
      console.log(`${'='.repeat(60)}`);
      
      for (const chapter of courseData.chapters) {
        console.log(`\n  Chapter ${chapter.order}: ${chapter.title}`);
        
        // Delete existing content blocks for this chapter
        try {
          const existingBlocks = await makeRequest('GET', `/api/chapter-content-blocks?filters[chapter][documentId][$eq]=${chapter.documentId}&pagination[pageSize]=100`);
          if (existingBlocks.data && existingBlocks.data.length > 0) {
            console.log(`    Deleting ${existingBlocks.data.length} existing blocks...`);
            for (const block of existingBlocks.data) {
              try {
                await makeRequest('DELETE', `/api/chapter-content-blocks/${block.documentId}`);
              } catch (err) {
                // Ignore delete errors
              }
            }
          }
        } catch (err) {
          // Ignore fetch errors
        }
        
        // Generate content for this chapter
        const contentBlocks = generateContent(courseTitle, chapter.title, chapter.order);
        
        // Create content blocks
        for (const block of contentBlocks) {
          try {
            await makeRequest('POST', '/api/chapter-content-blocks', {
              data: {
                ...block,
                chapter: chapter.id,
              },
            });
            totalBlocksCreated++;
            console.log(`    ✓ ${block.type}`);
          } catch (err) {
            console.log(`    ✗ Failed to create ${block.type}: ${err.message}`);
          }
        }
      }
      
      console.log('');
    }
    
    console.log(`${'='.repeat(60)}`);
    console.log('SEED COMPLETED SUCCESSFULLY!');
    console.log(`${'='.repeat(60)}`);
    console.log(`\nTotal content blocks created: ${totalBlocksCreated}`);
    console.log('\nNext steps:');
    console.log('1. Go to http://localhost:3000/courses');
    console.log('2. Select a course');
    console.log('3. Click on a chapter');
    console.log('4. Start learning!');
    
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seedAllCourses();
