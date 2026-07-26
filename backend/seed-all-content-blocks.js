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

// Course-specific content blocks for ALL courses
const courseContentBlocks = {
  'AI Fundamentals': [
    {
      type: 'theory',
      content: {
        title: 'What is Artificial Intelligence?',
        body: `**Artificial Intelligence (AI)** is the simulation of human intelligence by machines.\n\n### Key Concepts:\n- **Machine Learning**: Systems that learn from data\n- **Deep Learning**: Neural networks with multiple layers\n- **NLP**: Natural Language Processing for text understanding\n- **Computer Vision**: Interpreting visual information\n\nAI is transforming industries from healthcare to finance.`
      },
      difficulty: 'easy',
      hint: 'AI encompasses many subfields.',
      order: 1
    },
    {
      type: 'multiple-choice',
      content: {
        question: 'Which of the following is NOT a branch of AI?',
        options: ['Machine Learning', 'Natural Language Processing', 'Database Management', 'Computer Vision'],
        correctIndex: 2
      },
      difficulty: 'easy',
      hint: 'Think about what AI focuses on.',
      order: 2
    },
    {
      type: 'true-false',
      content: {
        statement: 'AI can only perform tasks it has been explicitly programmed to do.',
        correct: false
      },
      difficulty: 'medium',
      hint: 'Consider machine learning capabilities.',
      order: 3
    }
  ],
  'AI Ethics & Safety': [
    {
      type: 'theory',
      content: {
        title: 'Ethical AI Principles',
        body: `**AI Ethics** ensures AI systems are developed and used responsibly.\n\n### Core Principles:\n- **Fairness**: Avoiding bias and discrimination\n- **Transparency**: Explainable AI decisions\n- **Privacy**: Protecting user data\n- **Accountability**: Clear responsibility for AI outcomes\n- **Safety**: Preventing harm to humans`
      },
      difficulty: 'easy',
      hint: 'Ethics guides responsible AI development.',
      order: 1
    },
    {
      type: 'yes-no',
      content: {
        question: 'Should AI systems be transparent about how they make decisions?',
        correct: true
      },
      difficulty: 'easy',
      hint: 'Transparency builds trust.',
      order: 2
    },
    {
      type: 'matching',
      content: {
        question: 'Which principle ensures AI doesn\'t discriminate against certain groups?',
        options: ['Transparency', 'Fairness', 'Privacy', 'Efficiency'],
        correctIndex: 1
      },
      difficulty: 'easy',
      hint: 'Think about equal treatment.',
      order: 3
    }
  ],
  'Computer Vision': [
    {
      type: 'theory',
      content: {
        title: 'Introduction to Computer Vision',
        body: `**Computer Vision** enables machines to interpret and understand visual information.\n\n### Key Applications:\n- **Image Classification**: Identifying objects in images\n- **Object Detection**: Locating and labeling objects\n- **Image Segmentation**: Pixel-level understanding\n- **Face Recognition**: Identifying individuals\n\n### Common Models:\n- CNNs (Convolutional Neural Networks)\n- YOLO (You Only Look Once)\n- ResNet, VGG, EfficientNet`
      },
      difficulty: 'easy',
      hint: 'Computer vision processes visual data.',
      order: 1
    },
    {
      type: 'code',
      content: {
        title: 'Loading an Image with OpenCV',
        explanation: `**OpenCV** is the most popular library for computer vision in Python.`,
        code: `import cv2\n\n# Read an image\nimage = cv2.imread('photo.jpg')\n\n# Display image size\nprint(image.shape)`,
        task: 'Write code to read an image named "test.png" using OpenCV.',
        expectedAnswer: "image = cv2.imread('test.png')"
      },
      difficulty: 'easy',
      hint: 'Use cv2.imread() function.',
      order: 2
    },
    {
      type: 'fill-blank',
      content: {
        sentence: '___ is a technique that assigns a class label to each pixel in an image.',
        options: ['Image Classification', 'Image Segmentation', 'Object Detection', 'Feature Extraction'],
        correctIndex: 1
      },
      difficulty: 'medium',
      hint: 'Think about pixel-level understanding.',
      order: 3
    }
  ],
  'Data Science': [
    {
      type: 'theory',
      content: {
        title: 'What is Data Science?',
        body: `**Data Science** combines statistics, programming, and domain knowledge to extract insights from data.\n\n### The Data Science Process:\n1. **Data Collection**: Gathering relevant data\n2. **Data Cleaning**: Handling missing values, outliers\n3. **Exploratory Analysis**: Understanding patterns\n4. **Modeling**: Building predictive models\n5. **Communication**: Sharing insights with stakeholders\n\n### Essential Tools:\n- Python, R, SQL\n- Pandas, NumPy, Scikit-learn\n- Matplotlib, Seaborn`
      },
      difficulty: 'easy',
      hint: 'Data science turns data into insights.',
      order: 1
    },
    {
      type: 'code',
      content: {
        title: 'Loading Data with Pandas',
        explanation: `**Pandas** is the fundamental library for data manipulation in Python.`,
        code: `import pandas as pd\n\n# Load CSV file\ndf = pd.read_csv('data.csv')\n\n# View first 5 rows\nprint(df.head())`,
        task: 'Write code to load a CSV file named "sales.csv" into a DataFrame.',
        expectedAnswer: "df = pd.read_csv('sales.csv')"
      },
      difficulty: 'easy',
      hint: 'Use pd.read_csv() function.',
      order: 2
    },
    {
      type: 'multiple-choice',
      content: {
        question: 'Which Pandas function is used to load data from a CSV file?',
        options: ['pd.read_csv()', 'pd.load_csv()', 'pd.import_csv()', 'pd.open_csv()'],
        correctIndex: 0
      },
      difficulty: 'easy',
      hint: 'It follows the pattern pd.read_*.',
      order: 3
    }
  ],
  'Machine Learning': [
    {
      type: 'theory',
      content: {
        title: 'Introduction to Machine Learning',
        body: `**Machine Learning** enables computers to learn from data without explicit programming.\n\n### Types of ML:\n- **Supervised Learning**: Labeled training data\n- **Unsupervised Learning**: Finding patterns in unlabeled data\n- **Reinforcement Learning**: Learning through trial and error\n\n### Common Algorithms:\n- Linear/Logistic Regression\n- Decision Trees, Random Forests\n- Support Vector Machines\n- Neural Networks`
      },
      difficulty: 'easy',
      hint: 'ML learns patterns from data.',
      order: 1
    },
    {
      type: 'fill-blank',
      content: {
        sentence: 'In ___ learning, the model learns from labeled training data.',
        options: ['unsupervised', 'supervised', 'reinforcement', 'transfer'],
        correctIndex: 1
      },
      difficulty: 'easy',
      hint: 'Labels are provided during training.',
      order: 2
    },
    {
      type: 'true-false',
      content: {
        statement: 'In unsupervised learning, the training data includes labels.',
        correct: false
      },
      difficulty: 'easy',
      hint: 'Unsupervised means no labels.',
      order: 3
    }
  ],
  'Deep Learning': [
    {
      type: 'theory',
      content: {
        title: 'Neural Networks Fundamentals',
        body: `**Neural Networks** are the foundation of deep learning.\n\n### Network Structure:\n- **Input Layer**: Receives raw data\n- **Hidden Layers**: Process and transform data\n- **Output Layer**: Produces predictions\n\n### Key Concepts:\n- **Weights**: Connection strengths between neurons\n- **Activation Functions**: Introduce non-linearity (ReLU, Sigmoid, Softmax)\n- **Backpropagation**: Algorithm for training networks\n- **Loss Functions**: Measure prediction accuracy`
      },
      difficulty: 'easy',
      hint: 'Neural networks mimic brain structure.',
      order: 1
    },
    {
      type: 'code',
      content: {
        title: 'Building a Simple Neural Network',
        explanation: `**TensorFlow/Keras** makes building neural networks straightforward.`,
        code: `import tensorflow as tf\n\nmodel = tf.keras.Sequential([\n    tf.keras.layers.Dense(64, activation='relu'),\n    tf.keras.layers.Dense(32, activation='relu'),\n    tf.keras.layers.Dense(10, activation='softmax')\n])`,
        task: 'Write code to add a Dense layer with 128 units and ReLU activation.',
        expectedAnswer: "tf.keras.layers.Dense(128, activation='relu')"
      },
      difficulty: 'medium',
      hint: 'Use tf.keras.layers.Dense().',
      order: 2
    },
    {
      type: 'matching',
      content: {
        question: 'Which activation function is commonly used for multi-class classification output?',
        options: ['ReLU', 'Sigmoid', 'Softmax', 'Tanh'],
        correctIndex: 2
      },
      difficulty: 'medium',
      hint: 'It outputs probabilities that sum to 1.',
      order: 3
    }
  ],
  'Natural Language Processing': [
    {
      type: 'theory',
      content: {
        title: 'What is NLP?',
        body: `**Natural Language Processing (NLP)** enables computers to understand and generate human language.\n\n### Key NLP Tasks:\n- **Tokenization**: Breaking text into words/tokens\n- **Sentiment Analysis**: Determining emotion/tone\n- **Named Entity Recognition**: Identifying people, places, organizations\n- **Machine Translation**: Translating between languages\n- **Text Generation**: Creating human-like text\n\n### Modern NLP:\n- Transformers (BERT, GPT)\n- Word Embeddings (Word2Vec, GloVe)\n- Attention Mechanisms`
      },
      difficulty: 'easy',
      hint: 'NLP bridges human language and computers.',
      order: 1
    },
    {
      type: 'multiple-choice',
      content: {
        question: 'What is tokenization in NLP?',
        options: ['Removing stop words', 'Breaking text into tokens', 'Converting to lowercase', 'Stemming words'],
        correctIndex: 1
      },
      difficulty: 'easy',
      hint: 'Think about the first step in text processing.',
      order: 2
    },
    {
      type: 'yes-no',
      content: {
        question: 'Can NLP be used for language translation?',
        correct: true
      },
      difficulty: 'easy',
      hint: 'Google Translate uses NLP.',
      order: 3
    }
  ],
  'Prompt Engineering': [
    {
      type: 'theory',
      content: {
        title: 'The Art of Prompt Engineering',
        body: `**Prompt Engineering** is the skill of crafting effective inputs for AI models.\n\n### Key Techniques:\n- **Be Specific**: Clear, detailed instructions\n- **Provide Context**: Background information\n- **Use Examples**: Show desired output format\n- **Set Constraints**: Limit scope and format\n- **Chain of Thought**: Step-by-step reasoning\n\n### Best Practices:\n- Start with clear objective\n- Iterate and refine prompts\n- Test with different inputs`
      },
      difficulty: 'easy',
      hint: 'Good prompts get better results.',
      order: 1
    },
    {
      type: 'fill-blank',
      content: {
        sentence: 'A good prompt should be ___, detailed, and provide relevant context.',
        options: ['vague', 'specific', 'long', 'complex'],
        correctIndex: 1
      },
      difficulty: 'easy',
      hint: 'Clarity is key.',
      order: 2
    },
    {
      type: 'matching',
      content: {
        question: 'Which technique involves asking the AI to explain its reasoning step by step?',
        options: ['Few-shot learning', 'Chain of Thought', 'Zero-shot prompting', 'Temperature setting'],
        correctIndex: 1
      },
      difficulty: 'easy',
      hint: 'Think about breaking down complex problems.',
      order: 3
    }
  ]
};

async function seedAllContentBlocks() {
  try {
    // Fetch all chapters
    console.log('Fetching chapters...');
    const chaptersRes = await makeRequest('GET', '/api/chapters?populate=course&sort=order:asc&pagination[pageSize]=100');
    const chapters = chaptersRes.data || [];
    
    console.log(`Found ${chapters.length} chapters`);
    
    if (chapters.length === 0) {
      console.log('\n❌ No chapters found! Please run seed-chapters.js first.');
      return;
    }
    
    // Group chapters by course
    const chaptersByCourse = {};
    for (const ch of chapters) {
      const courseTitle = ch.course?.title || ch.course?.name || 'Unknown';
      if (!chaptersByCourse[courseTitle]) {
        chaptersByCourse[courseTitle] = [];
      }
      chaptersByCourse[courseTitle].push(ch);
    }
    
    console.log(`\nCourses with chapters: ${Object.keys(chaptersByCourse).join(', ')}`);
    
    // Process each course
    for (const [courseTitle, courseChapters] of Object.entries(chaptersByCourse)) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`Processing: ${courseTitle}`);
      console.log(`${'='.repeat(50)}`);
      
      // Get content blocks for this course (or use defaults)
      const contentBlocks = courseContentBlocks[courseTitle] || [
        {
          type: 'theory',
          content: {
            title: `Welcome to ${courseTitle}`,
            body: `This is the introduction to **${courseTitle}**.\n\n### What You'll Learn:\n- Core concepts and principles\n- Practical applications\n- Best practices and tips\n\nLet's begin your learning journey!`
          },
          difficulty: 'easy',
          hint: 'Every journey starts with a single step.',
          order: 1
        },
        {
          type: 'multiple-choice',
          content: {
            question: `What is the primary focus of ${courseTitle}?`,
            options: ['Learning theory only', 'Practical application', 'Both theory and practice', 'None of the above'],
            correctIndex: 2
          },
          difficulty: 'easy',
          hint: 'Think about comprehensive learning.',
          order: 2
        },
        {
          type: 'true-false',
          content: {
            statement: `${courseTitle} is an important field in technology.`,
            correct: true
          },
          difficulty: 'easy',
          hint: 'Consider the impact of this field.',
          order: 3
        }
      ];
      
      // Add content blocks to the first chapter of this course
      const firstChapter = courseChapters.find(ch => ch.order === 1) || courseChapters[0];
      
      if (!firstChapter) {
        console.log('  ⚠ No chapters found for this course');
        continue;
      }
      
      console.log(`\nAdding content blocks to: ${firstChapter.title}`);
      
      // Delete existing content blocks for this chapter
      const existingBlocks = await makeRequest('GET', `/api/chapter-content-blocks?filters[chapter][documentId][$eq]=${firstChapter.documentId}&pagination[pageSize]=100`);
      if (existingBlocks.data && existingBlocks.data.length > 0) {
        console.log(`  Deleting ${existingBlocks.data.length} existing content blocks...`);
        for (const block of existingBlocks.data) {
          try {
            await makeRequest('DELETE', `/api/chapter-content-blocks/${block.documentId}`);
          } catch (err) {
            console.error(`  ✗ Failed to delete block:`, err.message);
          }
        }
      }
      
      // Create new content blocks
      for (const block of contentBlocks) {
        try {
          await makeRequest('POST', '/api/chapter-content-blocks', {
            data: {
              ...block,
              chapter: firstChapter.id,
            },
          });
          console.log(`  ✓ Created: ${block.type} - ${block.content.title || block.content.question || 'Block'}`);
        } catch (err) {
          console.error(`  ✗ Failed to create ${block.type}:`, err.message);
        }
      }
    }
    
    console.log('\n✅ All content blocks seed completed!');
  } catch (error) {
    console.error('Seed failed:', error);
  }
}

seedAllContentBlocks();
