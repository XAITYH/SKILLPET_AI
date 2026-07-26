/**
 * Strapi Seed Script for Machine Learning Foundations Course
 * 
 * This script creates:
 * - 1 Course: "Machine Learning Foundations"
 * - 4 Chapters: Introduction, Core Concepts, Model Building, Real-World Applications
 * - Content blocks for each chapter (theory, multiple-choice, true-false, etc.)
 * 
 * Usage:
 *   cd <strapi-project-root>
 *   node scripts/seed-ml-course.js
 * 
 * Prerequisites:
 *   - Strapi instance running on localhost:1337
 *   - API token with write permissions (or use admin token)
 */

const https = require('https');
const http = require('http');

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const API_TOKEN = process.env.STRAPI_API_TOKEN || 'YOUR_API_TOKEN_HERE';

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
          const parsed = JSON.parse(body);
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
          } else {
            resolve(parsed);
          }
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

async function seed() {
  console.log('🌱 Starting seed for Machine Learning Foundations course...\n');

  // Step 1: Create the Course
  console.log('📚 Creating course: Machine Learning Foundations');
  const course = await makeRequest('POST', '/api/courses', {
    data: {
      title: 'Machine Learning Foundations',
      name: 'Machine Learning Foundations',
      slug: 'machine-learning-foundations',
      description: 'A comprehensive introduction to machine learning concepts, algorithms, and practical applications.',
      difficulty: 'Beginner',
      duration: 120,
      level: 'Beginner',
    }
  });
  console.log(`   ✅ Course created with ID: ${course.data?.id}\n`);

  const courseId = course.data?.id;

  // Step 2: Create Chapters
  console.log('📖 Creating chapters...');
  
  const chapters = [
    {
      title: 'Introduction to Machine Learning',
      description: 'Learn what machine learning is and why it matters.',
      emoji: '🤖',
      order: 1,
    },
    {
      title: 'Core Concepts',
      description: 'Understand supervised, unsupervised, and reinforcement learning.',
      emoji: '🧠',
      order: 2,
    },
    {
      title: 'Building Your First Model',
      description: 'Hands-on guide to creating machine learning models.',
      emoji: '🔧',
      order: 3,
    },
    {
      title: 'Real-World Applications',
      description: 'Explore how ML is used in various industries.',
      emoji: '🌍',
      order: 4,
    },
  ];

  const createdChapters = [];
  
  for (const chapter of chapters) {
    const result = await makeRequest('POST', '/api/chapters', {
      data: {
        ...chapter,
        course: courseId,
      }
    });
    console.log(`   ✅ Chapter ${chapter.order}: ${chapter.title} (ID: ${result.data?.id})`);
    createdChapters.push(result.data);
  }
  console.log('');

  // Step 3: Create Content Blocks for each chapter
  console.log('📝 Creating content blocks...\n');

  // Chapter 1: Introduction to Machine Learning
  const chapter1Blocks = [
    {
      type: 'theory',
      content: {
        title: 'What is Machine Learning?',
        body: `**Machine Learning (ML)** is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed.\n\n### Key Concepts:\n- **Data**: The foundation of all ML algorithms\n- **Patterns**: ML finds patterns in data\n- **Prediction**: Using patterns to make predictions\n- **Improvement**: Models get better with more data\n\nMachine learning is transforming industries from healthcare to finance, making it one of the most valuable skills in tech today.`
      },
      difficulty: 'easy',
      hint: 'ML is about learning from data.',
      order: 1,
    },
    {
      type: 'multiple-choice',
      content: {
        question: 'What is the primary goal of machine learning?',
        options: [
          'To replace human workers',
          'To enable systems to learn from data',
          'To create websites',
          'To store information'
        ],
        correctIndex: 1,
      },
      difficulty: 'easy',
      hint: 'Think about what makes ML different from traditional programming.',
      order: 2,
    },
    {
      type: 'true-false',
      content: {
        statement: 'Machine learning requires explicit programming for every task.',
        correct: false,
      },
      difficulty: 'easy',
      hint: 'ML learns from data rather than following explicit rules.',
      order: 3,
    },
    {
      type: 'yes-no',
      content: {
        question: 'Is machine learning a subset of artificial intelligence?',
        correct: true,
      },
      difficulty: 'easy',
      hint: 'AI is the broader field, ML is a specific approach.',
      order: 4,
    },
  ];

  // Chapter 2: Core Concepts
  const chapter2Blocks = [
    {
      type: 'theory',
      content: {
        title: 'Types of Machine Learning',
        body: `There are three main types of machine learning:\n\n### 1. Supervised Learning\n- Uses labeled training data\n- Learns mapping from inputs to outputs\n- Examples: Classification, Regression\n\n### 2. Unsupervised Learning\n- Works with unlabeled data\n- Finds hidden patterns\n- Examples: Clustering, Dimensionality Reduction\n\n### 3. Reinforcement Learning\n- Agent learns through interaction\n- Uses rewards and penalties\n- Examples: Game playing, Robotics`
      },
      difficulty: 'medium',
      hint: 'Think about whether the data has labels or not.',
      order: 1,
    },
    {
      type: 'matching',
      content: {
        question: 'Match each learning type with its description:',
        options: [
          'Supervised Learning - Uses labeled data',
          'Unsupervised Learning - Finds patterns in unlabeled data',
          'Reinforcement Learning - Learns through rewards'
        ],
        correctIndex: 0,
      },
      difficulty: 'medium',
      hint: 'Consider how each type of learning works.',
      order: 2,
    },
    {
      type: 'fill-blank',
      content: {
        sentence: 'In ___ learning, the model learns from labeled training data.',
        options: ['Supervised', 'Unsupervised', 'Reinforcement'],
        correctIndex: 0,
      },
      difficulty: 'easy',
      hint: 'This type uses labeled data for training.',
      order: 3,
    },
  ];

  // Chapter 3: Building Your First Model
  const chapter3Blocks = [
    {
      type: 'theory',
      content: {
        title: 'The ML Pipeline',
        body: `Building a machine learning model involves several steps:\n\n### The ML Pipeline:\n1. **Data Collection**: Gather relevant data\n2. **Data Preprocessing**: Clean and prepare data\n3. **Feature Engineering**: Select important features\n4. **Model Selection**: Choose the right algorithm\n5. **Training**: Fit the model to data\n6. **Evaluation**: Test model performance\n7. **Deployment**: Use in production\n\nEach step is crucial for building effective ML systems.`
      },
      difficulty: 'medium',
      hint: 'Think about the journey from raw data to deployed model.',
      order: 1,
    },
    {
      type: 'code',
      content: {
        title: 'Your First ML Model',
        explanation: 'Let\'s create a simple linear regression model using Python and scikit-learn.',
        code: `from sklearn.linear_model import LinearRegression\nimport numpy as np\n\n# Sample data\nX = np.array([[1], [2], [3], [4], [5]])\ny = np.array([2, 4, 5, 4, 5])\n\n# Create and train model\nmodel = LinearRegression()\nmodel.fit(X, y)\n\n# Make prediction\nprediction = model.predict([[6]])`,
        task: 'What method do we call to train the model?',
        expectedAnswer: 'model.fit(X, y)',
      },
      difficulty: 'medium',
      hint: 'Look for the method that trains the model on data.',
      order: 2,
    },
  ];

  // Chapter 4: Real-World Applications
  const chapter4Blocks = [
    {
      type: 'theory',
      content: {
        title: 'ML in the Real World',
        body: `Machine learning is used across many industries:\n\n### Healthcare\n- Disease diagnosis\n- Drug discovery\n- Personalized medicine\n\n### Finance\n- Fraud detection\n- Algorithmic trading\n- Credit scoring\n\n### Technology\n- Recommendation systems\n- Voice assistants\n- Image recognition\n\n### Transportation\n- Self-driving cars\n- Route optimization\n- Predictive maintenance`
      },
      difficulty: 'easy',
      hint: 'ML applications are everywhere in modern life.',
      order: 1,
    },
    {
      type: 'multiple-choice',
      content: {
        question: 'Which industry uses ML for fraud detection?',
        options: [
          'Healthcare',
          'Finance',
          'Education',
          'Entertainment'
        ],
        correctIndex: 1,
      },
      difficulty: 'easy',
      hint: 'Think about where financial transactions happen.',
      order: 2,
    },
    {
      type: 'true-false',
      content: {
        statement: 'Machine learning is only used in the technology industry.',
        correct: false,
      },
      difficulty: 'easy',
      hint: 'ML has applications across many different sectors.',
      order: 3,
    },
  ];

  // Create content blocks for each chapter
  const allBlocks = [
    { chapterId: createdChapters[0]?.id, blocks: chapter1Blocks },
    { chapterId: createdChapters[1]?.id, blocks: chapter2Blocks },
    { chapterId: createdChapters[2]?.id, blocks: chapter3Blocks },
    { chapterId: createdChapters[3]?.id, blocks: chapter4Blocks },
  ];

  for (const { chapterId, blocks } of allBlocks) {
    if (!chapterId) continue;
    
    for (const block of blocks) {
      const result = await makeRequest('POST', '/api/chapter-content-blocks', {
        data: {
          ...block,
          chapter: chapterId,
        }
      });
      console.log(`   ✅ ${block.type} block created (ID: ${result.data?.id})`);
    }
  }

  console.log('\n🎉 Seed completed successfully!');
  console.log(`\n📊 Summary:`);
  console.log(`   - 1 Course created`);
  console.log(`   - ${createdChapters.length} Chapters created`);
  console.log(`   - ${chapter1Blocks.length + chapter2Blocks.length + chapter3Blocks.length + chapter4Blocks.length} Content blocks created`);
  console.log(`\n🚀 You can now access the course at: http://localhost:3000/courses/machine-learning-foundations`);
}

// Run the seed
seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
