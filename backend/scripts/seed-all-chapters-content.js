/**
 * Comprehensive Seed Script for ALL Courses and Chapters
 * 
 * This script creates 6-7 content blocks for EVERY chapter in EVERY course.
 * Each chapter gets a mix of all 7 content types:
 * 1. Theory / Explanation
 * 2. Code Explanation / Code Writing
 * 3. Fill in the Blank
 * 4. Multiple Choice
 * 5. True / False
 * 6. Yes / No
 * 7. Selection / Matching
 * 
 * Usage:
 *   cd <strapi-project-root>
 *   node scripts/seed-all-chapters-content.js
 * 
 * Prerequisites:
 *   - Strapi instance running on localhost:1337
 *   - Courses and chapters already exist (run seed-chapters.js first)
 *   - Valid API token with write permissions
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

// ============================================================
// COURSE CONTENT DATA - 6-7 blocks per chapter, all 7 types
// ============================================================

const courseContent = {
  // ========================================================
  // AI FUNDAMENTALS
  // ========================================================
  'AI Fundamentals': {
    1: [ // Chapter 1: Introduction to AI
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
      },
      {
        type: 'fill-blank',
        content: {
          sentence: '___ is a field of AI that enables machines to understand and generate human language.',
          options: ['Computer Vision', 'Natural Language Processing', 'Robotics', 'Expert Systems'],
          correctIndex: 1
        },
        difficulty: 'easy',
        hint: 'Think about language and text processing.',
        order: 4
      },
      {
        type: 'yes-no',
        content: {
          question: 'Is machine learning a subset of artificial intelligence?',
          correct: true
        },
        difficulty: 'easy',
        hint: 'AI is the broader field.',
        order: 5
      },
      {
        type: 'matching',
        content: {
          question: 'Match the AI subfield with its description:',
          options: [
            'Computer Vision - Interpreting visual information',
            'NLP - Understanding human language',
            'Robotics - Physical movement and interaction',
            'Expert Systems - Rule-based decision making'
          ],
          correctIndex: 0
        },
        difficulty: 'medium',
        hint: 'Think about images and visual data.',
        order: 6
      },
      {
        type: 'code',
        content: {
          title: 'Your First AI Prediction',
          explanation: `Let's use a simple AI model to make a prediction based on data.`,
          code: `from sklearn.linear_model import LinearRegression\nimport numpy as np\n\n# Training data\nX = np.array([[1], [2], [3], [4]])\ny = np.array([2, 4, 6, 8])\n\n# Create model\nmodel = LinearRegression()\nmodel.fit(X, y)\n\n# Predict\nprediction = model.predict([[5]])`,
          task: 'What value does the model predict for input [[5]]?',
          expectedAnswer: '10.0'
        },
        difficulty: 'medium',
        hint: 'Follow the pattern in the training data.',
        order: 7
      }
    ],
    2: [ // Chapter 2: Machine Learning Basics
      {
        type: 'theory',
        content: {
          title: 'Supervised vs Unsupervised Learning',
          body: `### Supervised Learning\n- Uses **labeled data** for training\n- Model learns mapping from inputs to outputs\n- Examples: Classification, Regression\n\n### Unsupervised Learning\n- Works with **unlabeled data**\n- Finds hidden patterns in data\n- Examples: Clustering, Dimensionality Reduction\n\n### Key Difference\nSupervised learning has a "teacher" providing correct answers, while unsupervised learning discovers structure on its own.`
        },
        difficulty: 'easy',
        hint: 'Think about whether data has labels.',
        order: 1
      },
      {
        type: 'true-false',
        content: {
          statement: 'In unsupervised learning, the training data includes labels.',
          correct: false
        },
        difficulty: 'easy',
        hint: 'Unsupervised means no labels.',
        order: 2
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
        order: 3
      },
      {
        type: 'multiple-choice',
        content: {
          question: 'Which type of learning is best for customer segmentation?',
          options: ['Supervised Learning', 'Unsupervised Learning', 'Reinforcement Learning', 'Transfer Learning'],
          correctIndex: 1
        },
        difficulty: 'medium',
        hint: 'Customer groups are not predefined.',
        order: 4
      },
      {
        type: 'yes-no',
        content: {
          question: 'Can supervised learning be used for image classification?',
          correct: true
        },
        difficulty: 'easy',
        hint: 'Images can be labeled with categories.',
        order: 5
      },
      {
        type: 'matching',
        content: {
          question: 'Match each learning type with its example:',
          options: [
            'Supervised - Email spam detection',
            'Unsupervised - Customer clustering',
            'Reinforcement - Game playing AI',
            'Transfer - Using pre-trained model'
          ],
          correctIndex: 0
        },
        difficulty: 'medium',
        hint: 'Spam detection uses labeled emails.',
        order: 6
      }
    ],
    3: [ // Chapter 3: Neural Networks
      {
        type: 'theory',
        content: {
          title: 'Introduction to Neural Networks',
          body: `**Neural Networks** are computing systems inspired by biological brains.\n\n### Network Structure:\n- **Input Layer**: Receives raw data\n- **Hidden Layers**: Process information\n- **Output Layer**: Produces results\n\n### How They Learn:\n1. Forward propagation\n2. Calculate loss\n3. Backpropagation\n4. Update weights\n\nNeural networks excel at recognizing patterns in complex data.`
        },
        difficulty: 'medium',
        hint: 'Neural networks mimic brain structure.',
        order: 1
      },
      {
        type: 'code',
        content: {
          title: 'Building a Neural Network',
          explanation: `Let's create a simple neural network using TensorFlow.`,
          code: `import tensorflow as tf\n\nmodel = tf.keras.Sequential([\n    tf.keras.layers.Dense(64, activation='relu'),\n    tf.keras.layers.Dense(32, activation='relu'),\n    tf.keras.layers.Dense(10, activation='softmax')\n])`,
          task: 'Write code to compile the model with Adam optimizer and categorical crossentropy loss.',
          expectedAnswer: "model.compile(optimizer='adam', loss='categorical_crossentropy')"
        },
        difficulty: 'medium',
        hint: 'Use model.compile().',
        order: 2
      },
      {
        type: 'multiple-choice',
        content: {
          question: 'What is the purpose of an activation function?',
          options: [
            'To initialize weights',
            'To introduce non-linearity',
            'To reduce overfitting',
            'To speed up training'
          ],
          correctIndex: 1
        },
        difficulty: 'medium',
        hint: 'Think about what happens without activation functions.',
        order: 3
      },
      {
        type: 'true-false',
        content: {
          statement: 'A neural network with more layers is always better.',
          correct: false
        },
        difficulty: 'medium',
        hint: 'Consider overfitting and diminishing returns.',
        order: 4
      },
      {
        type: 'fill-blank',
        content: {
          sentence: 'The ___ algorithm is used to train neural networks by adjusting weights.',
          options: ['Forward Propagation', 'Backpropagation', 'Gradient Descent', 'Activation'],
          correctIndex: 1
        },
        difficulty: 'medium',
        hint: 'This algorithm propagates errors backward.',
        order: 5
      },
      {
        type: 'yes-no',
        content: {
          question: 'Can neural networks be used for image recognition?',
          correct: true
        },
        difficulty: 'easy',
        hint: 'CNNs are widely used for this.',
        order: 6
      },
      {
        type: 'matching',
        content: {
          question: 'Match each activation function with its use case:',
          options: [
            'ReLU - Hidden layers',
            'Sigmoid - Binary classification',
            'Softmax - Multi-class classification',
            'Tanh - Hidden layers (alternative)'
          ],
          correctIndex: 0
        },
        difficulty: 'medium',
        hint: 'ReLU is the most common for hidden layers.',
        order: 7
      }
    ]
  },

  // ========================================================
  // AI ETHICS & SAFETY
  // ========================================================
  'AI Ethics & Safety': {
    1: [ // Chapter 1: Ethical Principles
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
      },
      {
        type: 'true-false',
        content: {
          statement: 'AI ethics is only important for large corporations.',
          correct: false
        },
        difficulty: 'easy',
        hint: 'AI ethics matters for everyone.',
        order: 4
      },
      {
        type: 'multiple-choice',
        content: {
          question: 'What is algorithmic bias?',
          options: [
            'Faster processing of certain data',
            'Systematic unfairness in AI outputs',
            'Using more memory for specific tasks',
            'Preferential treatment of certain programming languages'
          ],
          correctIndex: 1
        },
        difficulty: 'medium',
        hint: 'Think about fairness and discrimination.',
        order: 5
      },
      {
        type: 'fill-blank',
        content: {
          sentence: '___ in AI means being able to explain how a model reached its decision.',
          options: ['Transparency', 'Privacy', 'Efficiency', 'Scalability'],
          correctIndex: 0
        },
        difficulty: 'easy',
        hint: 'Being able to see and understand.',
        order: 6
      }
    ],
    2: [ // Chapter 2: Bias and Fairness
      {
        type: 'theory',
        content: {
          title: 'Understanding AI Bias',
          body: `**AI Bias** occurs when systems produce unfair outcomes.\n\n### Sources of Bias:\n- **Data Bias**: Training data doesn't represent reality\n- **Selection Bias**: Non-random data sampling\n- **Confirmation Bias**: Reinforcing existing beliefs\n\n### Mitigation Strategies:\n- Diverse training data\n- Regular bias audits\n- Fairness-aware algorithms\n- Human oversight`
        },
        difficulty: 'medium',
        hint: 'Bias can come from data or algorithms.',
        order: 1
      },
      {
        type: 'multiple-choice',
        content: {
          question: 'Which is a common source of AI bias?',
          options: [
            'Using too much computational power',
            'Training on non-representative data',
            'Having too many features',
            'Using modern hardware'
          ],
          correctIndex: 1
        },
        difficulty: 'easy',
        hint: 'The data we feed AI matters.',
        order: 2
      },
      {
        type: 'true-false',
        content: {
          statement: 'AI systems are always objective and unbiased.',
          correct: false
        },
        difficulty: 'easy',
        hint: 'AI reflects the data it learns from.',
        order: 3
      },
      {
        type: 'yes-no',
        content: {
          question: 'Can diverse training data help reduce AI bias?',
          correct: true
        },
        difficulty: 'easy',
        hint: 'Representation matters.',
        order: 4
      },
      {
        type: 'fill-blank',
        content: {
          sentence: '___ auditing involves regularly checking AI systems for unfair outcomes.',
          options: ['Performance', 'Bias', 'Security', 'Speed'],
          correctIndex: 1
        },
        difficulty: 'easy',
        hint: 'Checking for unfairness.',
        order: 5
      },
      {
        type: 'matching',
        content: {
          question: 'Match the bias type with its description:',
          options: [
            'Selection Bias - Non-random sampling',
            'Data Bias - Unrepresentative training data',
            'Confirmation Bias - Reinforcing beliefs',
            'Automation Bias - Over-relying on AI'
          ],
          correctIndex: 0
        },
        difficulty: 'medium',
        hint: 'Think about how data is selected.',
        order: 6
      }
    ],
    3: [ // Chapter 3: Privacy and Safety
      {
        type: 'theory',
        content: {
          title: 'AI Privacy and Safety',
          body: `### Privacy Concerns:\n- **Data Collection**: What data is gathered?\n- **Data Storage**: How is it protected?\n- **Data Usage**: How is it used?\n- **Consent**: Do users know and agree?\n\n### Safety Measures:\n- **Adversarial Testing**: Stress-testing AI systems\n- **Fail-safes**: Emergency shutdowns\n- **Monitoring**: Continuous performance tracking\n- **Red Teaming**: Ethical hacking of AI`
        },
        difficulty: 'medium',
        hint: 'Privacy and safety go hand in hand.',
        order: 1
      },
      {
        type: 'true-false',
        content: {
          statement: 'Users should always be informed when AI is being used.',
          correct: true
        },
        difficulty: 'easy',
        hint: 'Informed consent matters.',
        order: 2
      },
      {
        type: 'multiple-choice',
        content: {
          question: 'What is adversarial testing?',
          options: [
            'Testing with friendly data',
            'Stress-testing AI with malicious inputs',
            'Testing on slow computers',
            'Using old test data'
          ],
          correctIndex: 1
        },
        difficulty: 'medium',
        hint: 'Think about trying to break the system.',
        order: 3
      },
      {
        type: 'yes-no',
        content: {
          question: 'Is it ethical to use AI for surveillance without consent?',
          correct: false
        },
        difficulty: 'easy',
        hint: 'Consent is essential.',
        order: 4
      },
      {
        type: 'fill-blank',
        content: {
          sentence: '___ involves testing AI systems with malicious inputs to find vulnerabilities.',
          options: ['User Testing', 'Adversarial Testing', 'Performance Testing', 'Load Testing'],
          correctIndex: 1
        },
        difficulty: 'medium',
        hint: 'Testing against attacks.',
        order: 5
      },
      {
        type: 'matching',
        content: {
          question: 'Match the privacy concept with its description:',
          options: [
            'Data Minimization - Collect only what\'s needed',
            'Purpose Limitation - Use data only for stated purpose',
            'Right to be Forgotten - Users can delete their data',
            'Encryption - Protecting data in transit and at rest'
          ],
          correctIndex: 0
        },
        difficulty: 'medium',
        hint: 'Less data means less risk.',
        order: 6
      }
    ]
  },

  // ========================================================
  // MACHINE LEARNING
  // ========================================================
  'Machine Learning': {
    1: [ // Chapter 1: ML Fundamentals
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
      },
      {
        type: 'multiple-choice',
        content: {
          question: 'Which algorithm is used for classification tasks?',
          options: ['Linear Regression', 'Logistic Regression', 'K-Means', 'PCA'],
          correctIndex: 1
        },
        difficulty: 'medium',
        hint: 'Think about predicting categories.',
        order: 4
      },
      {
        type: 'yes-no',
        content: {
          question: 'Can machine learning be used for predicting stock prices?',
          correct: true
        },
        difficulty: 'easy',
        hint: 'Time series prediction is a common use case.',
        order: 5
      },
      {
        type: 'code',
        content: {
          title: 'Your First ML Model',
          explanation: `Let's create a simple linear regression model.`,
          code: `from sklearn.linear_model import LinearRegression\nimport numpy as np\n\n# Training data\nX = np.array([[1], [2], [3], [4]])\ny = np.array([2, 4, 5, 4])\n\n# Create and train model\nmodel = LinearRegression()\nmodel.fit(X, y)`,
          task: 'What method do we call to train the model?',
          expectedAnswer: 'model.fit(X, y)'
        },
        difficulty: 'easy',
        hint: 'Look for the method that trains the model.',
        order: 6
      },
      {
        type: 'matching',
        content: {
          question: 'Match each algorithm with its type:',
          options: [
            'Linear Regression - Supervised',
            'K-Means - Unsupervised',
            'Q-Learning - Reinforcement',
            'Random Forest - Supervised'
          ],
          correctIndex: 0
        },
        difficulty: 'medium',
        hint: 'Linear regression predicts continuous values.',
        order: 7
      }
    ],
    2: [ // Chapter 2: Model Evaluation
      {
        type: 'theory',
        content: {
          title: 'Evaluating ML Models',
          body: `### Key Metrics:\n- **Accuracy**: Correct predictions / Total predictions\n- **Precision**: True positives / (True + False positives)\n- **Recall**: True positives / (True + False negatives)\n- **F1 Score**: Harmonic mean of precision and recall\n\n### Validation Techniques:\n- Train/Test Split\n- Cross-Validation\n- Holdout Set\n\nGood evaluation prevents overfitting and ensures real-world performance.`
        },
        difficulty: 'medium',
        hint: 'Evaluation tells us how good our model is.',
        order: 1
      },
      {
        type: 'multiple-choice',
        content: {
          question: 'What does precision measure?',
          options: [
            'How many predictions were correct overall',
            'How many positive predictions were actually correct',
            'How many actual positives were identified',
            'How fast the model runs'
          ],
          correctIndex: 1
        },
        difficulty: 'medium',
        hint: 'Think about false positives.',
        order: 2
      },
      {
        type: 'true-false',
        content: {
          statement: 'High accuracy always means a good model.',
          correct: false
        },
        difficulty: 'medium',
        hint: 'Consider imbalanced datasets.',
        order: 3
      },
      {
        type: 'fill-blank',
        content: {
          sentence: '___ is a technique where the dataset is split into training and testing sets.',
          options: ['Cross-Validation', 'Train/Test Split', 'Regularization', 'Normalization'],
          correctIndex: 1
        },
        difficulty: 'easy',
        hint: 'Splitting data for evaluation.',
        order: 4
      },
      {
        type: 'yes-no',
        content: {
          question: 'Is cross-validation better than a single train/test split?',
          correct: true
        },
        difficulty: 'easy',
        hint: 'Cross-validation gives more reliable estimates.',
        order: 5
      },
      {
        type: 'matching',
        content: {
          question: 'Match each metric with its definition:',
          options: [
            'Precision - True positives / Predicted positives',
            'Recall - True positives / Actual positives',
            'F1 Score - Harmonic mean of precision and recall',
            'Accuracy - Correct / Total predictions'
          ],
          correctIndex: 0
        },
        difficulty: 'medium',
        hint: 'Precision focuses on positive predictions.',
        order: 6
      }
    ],
    3: [ // Chapter 3: Feature Engineering
      {
        type: 'theory',
        content: {
          title: 'Feature Engineering',
          body: `**Feature Engineering** is the process of creating useful input variables.\n\n### Techniques:\n- **Normalization**: Scaling features to same range\n- **Encoding**: Converting categories to numbers\n- **Feature Creation**: Combining existing features\n- **Feature Selection**: Choosing relevant features\n\n### Why It Matters:\nGood features can dramatically improve model performance, sometimes more than choosing a better algorithm.`
        },
        difficulty: 'medium',
        hint: 'Features are the inputs to your model.',
        order: 1
      },
      {
        type: 'code',
        content: {
          title: 'Feature Scaling with Python',
          explanation: `Let's normalize features using scikit-learn.`,
          code: `from sklearn.preprocessing import StandardScaler\nimport numpy as np\n\n# Sample data\nX = np.array([[1000, 0.5],\n              [1500, 0.7],\n              [2000, 0.9]])\n\n# Create scaler\nscaler = StandardScaler()\nX_scaled = scaler.fit_transform(X)`,
          task: 'What method scales the features?',
          expectedAnswer: 'scaler.fit_transform(X)'
        },
        difficulty: 'medium',
        hint: 'Look for the transformation method.',
        order: 2
      },
      {
        type: 'fill-blank',
        content: {
          sentence: '___ converts categorical variables into numerical format.',
          options: ['Normalization', 'Encoding', 'Scaling', 'Filtering'],
          correctIndex: 1
        },
        difficulty: 'easy',
        hint: 'Categories need to become numbers.',
        order: 3
      },
      {
        type: 'multiple-choice',
        content: {
          question: 'Why is feature scaling important?',
          options: [
            'It makes the code run faster',
            'It ensures features are on the same scale',
            'It increases the number of features',
            'It removes missing values'
          ],
          correctIndex: 1
        },
        difficulty: 'easy',
        hint: 'Different scales can bias algorithms.',
        order: 4
      },
      {
        type: 'true-false',
        content: {
          statement: 'Feature engineering is only necessary for complex algorithms.',
          correct: false
        },
        difficulty: 'medium',
        hint: 'All algorithms benefit from good features.',
        order: 5
      },
      {
        type: 'yes-no',
        content: {
          question: 'Can feature selection improve model performance?',
          correct: true
        },
        difficulty: 'easy',
        hint: 'Removing irrelevant features helps.',
        order: 6
      },
      {
        type: 'matching',
        content: {
          question: 'Match each technique with its purpose:',
          options: [
            'Normalization - Scale features to same range',
            'One-Hot Encoding - Convert categories to numbers',
            'Feature Selection - Choose relevant features',
            'Dimensionality Reduction - Reduce number of features'
          ],
          correctIndex: 0
        },
        difficulty: 'medium',
        hint: 'Normalization ensures equal feature importance.',
        order: 7
      }
    ]
  },

  // ========================================================
  // DATA SCIENCE
  // ========================================================
  'Data Science': {
    1: [ // Chapter 1: Data Science Overview
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
      },
      {
        type: 'true-false',
        content: {
          statement: 'Data cleaning is optional in data science.',
          correct: false
        },
        difficulty: 'easy',
        hint: 'Clean data is essential for accurate results.',
        order: 4
      },
      {
        type: 'fill-blank',
        content: {
          sentence: '___ is the process of exploring and summarizing data characteristics.',
          options: ['Data Cleaning', 'Exploratory Data Analysis', 'Modeling', 'Deployment'],
          correctIndex: 1
        },
        difficulty: 'easy',
        hint: 'Understanding your data before modeling.',
        order: 5
      },
      {
        type: 'yes-no',
        content: {
          question: 'Is SQL important for data scientists?',
          correct: true
        },
        difficulty: 'easy',
        hint: 'SQL is used to query databases.',
        order: 6
      },
      {
        type: 'matching',
        content: {
          question: 'Match each tool with its primary use:',
          options: [
            'Pandas - Data manipulation',
            'Matplotlib - Data visualization',
            'Scikit-learn - Machine learning',
            'SQL - Database queries'
          ],
          correctIndex: 0
        },
        difficulty: 'easy',
        hint: 'Pandas is for working with DataFrames.',
        order: 7
      }
    ],
    2: [ // Chapter 2: Data Visualization
      {
        type: 'theory',
        content: {
          title: 'Data Visualization',
          body: `**Data Visualization** represents data graphically to reveal patterns.\n\n### Chart Types:\n- **Bar Chart**: Comparing categories\n- **Line Chart**: Showing trends over time\n- **Scatter Plot**: Revealing correlations\n- **Histogram**: Displaying distributions\n- **Heatmap**: Showing correlations between variables\n\n### Python Libraries:\n- Matplotlib (基础)\n- Seaborn (统计可视化)\n- Plotly (交互式)`
        },
        difficulty: 'easy',
        hint: 'A picture is worth a thousand numbers.',
        order: 1
      },
      {
        type: 'code',
        content: {
          title: 'Creating a Bar Chart',
          explanation: `Let's create a simple bar chart using Matplotlib.`,
          code: `import matplotlib.pyplot as plt\n\n# Data\ncategories = ['A', 'B', 'C', 'D']\nvalues = [23, 45, 56, 78]\n\n# Create bar chart\nplt.bar(categories, values)\nplt.xlabel('Category')\nplt.ylabel('Value')\nplt.title('Sample Bar Chart')\nplt.show()`,
          task: 'What function creates the bar chart?',
          expectedAnswer: 'plt.bar(categories, values)'
        },
        difficulty: 'easy',
        hint: 'Look for the plt.bar function.',
        order: 2
      },
      {
        type: 'multiple-choice',
        content: {
          question: 'Which chart type is best for showing trends over time?',
          options: ['Bar Chart', 'Pie Chart', 'Line Chart', 'Scatter Plot'],
          correctIndex: 2
        },
        difficulty: 'easy',
        hint: 'Think about continuous data.',
        order: 3
      },
      {
        type: 'true-false',
        content: {
          statement: 'Data visualization is only for making reports look pretty.',
          correct: false
        },
        difficulty: 'easy',
        hint: 'Visualization reveals insights.',
        order: 4
      },
      {
        type: 'fill-blank',
        content: {
          sentence: 'A ___ plot shows the relationship between two continuous variables.',
          options: ['Bar', 'Pie', 'Scatter', 'Histogram'],
          correctIndex: 2
        },
        difficulty: 'easy',
        hint: 'Think about correlations.',
        order: 5
      },
      {
        type: 'yes-no',
        content: {
          question: 'Can interactive visualizations help with data exploration?',
          correct: true
        },
        difficulty: 'easy',
        hint: 'Interactivity allows deeper analysis.',
        order: 6
      }
    ],
    3: [ // Chapter 3: Statistical Analysis
      {
        type: 'theory',
        content: {
          title: 'Statistics for Data Science',
          body: `### Descriptive Statistics:\n- **Mean**: Average value\n- **Median**: Middle value\n- **Mode**: Most frequent value\n- **Std Dev**: Spread of data\n\n### Inferential Statistics:\n- **Hypothesis Testing**: Testing assumptions\n- **Confidence Intervals**: Range of likely values\n- **P-values**: Significance of results\n\nStatistics is the foundation of data science.`
        },
        difficulty: 'medium',
        hint: 'Statistics helps us understand data.',
        order: 1
      },
      {
        type: 'multiple-choice',
        content: {
          question: 'What does standard deviation measure?',
          options: [
            'The average value',
            'The middle value',
            'The spread of data',
            'The most common value'
          ],
          correctIndex: 2
        },
        difficulty: 'easy',
        hint: 'Think about how spread out values are.',
        order: 2
      },
      {
        type: 'true-false',
        content: {
          statement: 'The mean is always the best measure of central tendency.',
          correct: false
        },
        difficulty: 'medium',
        hint: 'Consider skewed data.',
        order: 3
      },
      {
        type: 'fill-blank',
        content: {
          sentence: 'A ___ value indicates that a result is statistically significant.',
          options: ['High p-value', 'Low p-value', 'High mean', 'Low standard deviation'],
          correctIndex: 1
        },
        difficulty: 'medium',
        hint: 'Lower is more significant.',
        order: 4
      },
      {
        type: 'yes-no',
        content: {
          question: 'Is the median affected by outliers?',
          correct: false
        },
        difficulty: 'easy',
        hint: 'The median is robust to outliers.',
        order: 5
      },
      {
        type: 'matching',
        content: {
          question: 'Match each statistic with its definition:',
          options: [
            'Mean - Average of all values',
            'Median - Middle value when sorted',
            'Mode - Most frequent value',
            'Std Dev - Measure of data spread'
          ],
          correctIndex: 0
        },
        difficulty: 'easy',
        hint: 'The mean sums all values and divides.',
        order: 6
      }
    ]
  },

  // ========================================================
  // DEEP LEARNING
  // ========================================================
  'Deep Learning': {
    1: [ // Chapter 1: Neural Networks Fundamentals
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
      },
      {
        type: 'true-false',
        content: {
          statement: 'Deep learning is just neural networks with many layers.',
          correct: true
        },
        difficulty: 'easy',
        hint: 'Depth refers to the number of layers.',
        order: 4
      },
      {
        type: 'fill-blank',
        content: {
          sentence: '___ is the process of adjusting network weights to minimize prediction error.',
          options: ['Inference', 'Training', 'Deployment', 'Preprocessing'],
          correctIndex: 1
        },
        difficulty: 'easy',
        hint: 'Learning happens during training.',
        order: 5
      },
      {
        type: 'yes-no',
        content: {
          question: 'Can neural networks learn without labeled data?',
          correct: true
        },
        difficulty: 'medium',
        hint: 'Think about autoencoders and GANs.',
        order: 6
      },
      {
        type: 'multiple-choice',
        content: {
          question: 'What is the purpose of an activation function?',
          options: [
            'To initialize weights',
            'To introduce non-linearity',
            'To reduce overfitting',
            'To speed up training'
          ],
          correctIndex: 1
        },
        difficulty: 'medium',
        hint: 'Without activation, networks would be linear.',
        order: 7
      }
    ],
    2: [ // Chapter 2: CNNs
      {
        type: 'theory',
        content: {
          title: 'Convolutional Neural Networks',
          body: `**CNNs** are specialized for processing grid-like data (images).\n\n### Key Layers:\n- **Convolutional Layer**: Extracts features using filters\n- **Pooling Layer**: Reduces spatial dimensions\n- **Fully Connected Layer**: Makes final predictions\n\n### Common Architectures:\n- LeNet, AlexNet\n- VGG, ResNet\n- EfficientNet, MobileNet\n\nCNNs power image recognition, self-driving cars, and medical imaging.`
        },
        difficulty: 'medium',
        hint: 'CNNs are great at finding patterns in images.',
        order: 1
      },
      {
        type: 'multiple-choice',
        content: {
          question: 'What does a convolutional layer do?',
          options: [
            'Reduces image size',
            'Extracts features using filters',
            'Makes final predictions',
            'Normalizes input data'
          ],
          correctIndex: 1
        },
        difficulty: 'medium',
        hint: 'Think about edge and pattern detection.',
        order: 2
      },
      {
        type: 'true-false',
        content: {
          statement: 'CNNs can only be used for image classification.',
          correct: false
        },
        difficulty: 'medium',
        hint: 'CNNs are used for many tasks.',
        order: 3
      },
      {
        type: 'fill-blank',
        content: {
          sentence: '___ layers reduce the spatial dimensions of feature maps.',
          options: ['Convolutional', 'Pooling', 'Dense', 'Dropout'],
          correctIndex: 1
        },
        difficulty: 'medium',
        hint: 'They downsample the data.',
        order: 4
      },
      {
        type: 'yes-no',
        content: {
          question: 'Are CNNs used in self-driving cars?',
          correct: true
        },
        difficulty: 'easy',
        hint: 'They process camera feeds.',
        order: 5
      },
      {
        type: 'matching',
        content: {
          question: 'Match each CNN layer with its function:',
          options: [
            'Convolutional - Feature extraction',
            'Pooling - Dimensionality reduction',
            'Fully Connected - Classification',
            'Dropout - Regularization'
          ],
          correctIndex: 0
        },
        difficulty: 'medium',
        hint: 'Convolutional layers use filters.',
        order: 6
      }
    ],
    3: [ // Chapter 3: RNNs and Transformers
      {
        type: 'theory',
        content: {
          title: 'Sequence Models: RNNs and Transformers',
          body: `### Recurrent Neural Networks (RNNs):\n- Process sequences step by step\n- Have internal memory\n- Used for text, time series\n- Problem: Vanishing gradients\n\n### Transformers:\n- Use attention mechanism\n- Process all positions in parallel\n- State-of-the-art for NLP\n- Examples: BERT, GPT, T5\n\nTransformers have largely replaced RNNs for most sequence tasks.`
        },
        difficulty: 'hard',
        hint: 'Sequence models handle ordered data.',
        order: 1
      },
      {
        type: 'multiple-choice',
        content: {
          question: 'What is the main advantage of Transformers over RNNs?',
          options: [
            'They use less memory',
            'They process sequences in parallel',
            'They are simpler to implement',
            'They work better with small datasets'
          ],
          correctIndex: 1
        },
        difficulty: 'hard',
        hint: 'Parallel processing is key.',
        order: 2
      },
      {
        type: 'true-false',
        content: {
          statement: 'RNNs can process sequences of variable length.',
          correct: true
        },
        difficulty: 'medium',
        hint: 'RNNs process one element at a time.',
        order: 3
      },
      {
        type: 'fill-blank',
        content: {
          sentence: 'The ___ mechanism allows Transformers to focus on relevant parts of the input.',
          options: ['Pooling', 'Attention', 'Convolution', 'Normalization'],
          correctIndex: 1
        },
        difficulty: 'hard',
        hint: 'It weighs the importance of different positions.',
        order: 4
      },
      {
        type: 'yes-no',
        content: {
          question: 'Is BERT a Transformer-based model?',
          correct: true
        },
        difficulty: 'easy',
        hint: 'BERT stands for Bidirectional Encoder Representations from Transformers.',
        order: 5
      },
      {
        type: 'matching',
        content: {
          question: 'Match each model with its type:',
          options: [
            'LSTM - RNN variant',
            'BERT - Transformer encoder',
            'GPT - Transformer decoder',
            'T5 - Sequence-to-sequence Transformer'
          ],
          correctIndex: 0
        },
        difficulty: 'hard',
        hint: 'LSTM is a type of RNN.',
        order: 6
      }
    ]
  },

  // ========================================================
  // COMPUTER VISION
  // ========================================================
  'Computer Vision': {
    1: [ // Chapter 1: Introduction to CV
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
      },
      {
        type: 'multiple-choice',
        content: {
          question: 'What does YOLO stand for?',
          options: [
            'Your Own Learning Algorithm',
            'You Only Look Once',
            'Yearly Organization for Logic Operations',
            'Yet Another Object Locator'
          ],
          correctIndex: 1
        },
        difficulty: 'easy',
        hint: 'It\'s a real-time object detection system.',
        order: 4
      },
      {
        type: 'true-false',
        content: {
          statement: 'Computer vision can only process static images.',
          correct: false
        },
        difficulty: 'easy',
        hint: 'CV also works with video.',
        order: 5
      },
      {
        type: 'yes-no',
        content: {
          question: 'Is face recognition a application of computer vision?',
          correct: true
        },
        difficulty: 'easy',
        hint: 'CV can identify individuals.',
        order: 6
      },
      {
        type: 'matching',
        content: {
          question: 'Match each CV task with its description:',
          options: [
            'Classification - Assigning a label to an image',
            'Detection - Finding and labeling objects',
            'Segmentation - Pixel-level classification',
            'Recognition - Identifying specific instances'
          ],
          correctIndex: 0
        },
        difficulty: 'medium',
        hint: 'Classification answers "what is this?"',
        order: 7
      }
    ],
    2: [ // Chapter 2: Image Processing
      {
        type: 'theory',
        content: {
          title: 'Image Processing Fundamentals',
          body: `### Basic Operations:\n- **Grayscale Conversion**: Reducing color channels\n- **Blurring**: Smoothing images\n- **Edge Detection**: Finding boundaries\n- **Thresholding**: Converting to binary\n\n### Filters:\n- Gaussian Blur\n- Median Filter\n- Bilateral Filter\n\nGood preprocessing improves model performance.`
        },
        difficulty: 'medium',
        hint: 'Preprocessing is crucial for CV.',
        order: 1
      },
      {
        type: 'code',
        content: {
          title: 'Edge Detection with OpenCV',
          explanation: `Edge detection finds boundaries in images.`,
          code: `import cv2\n\n# Load image\nimage = cv2.imread('photo.jpg')\n\n# Convert to grayscale\ngray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)\n\n# Apply Canny edge detection\nedges = cv2.Canny(gray, 100, 200)`,
          task: 'Write code to convert an image to grayscale.',
          expectedAnswer: 'gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)'
        },
        difficulty: 'medium',
        hint: 'Use cv2.cvtColor().',
        order: 2
      },
      {
        type: 'multiple-choice',
        content: {
          question: 'What does Canny edge detection do?',
          options: [
            'Blurs the image',
            'Finds edges and boundaries',
            'Changes image colors',
            'Resizes the image'
          ],
          correctIndex: 1
        },
        difficulty: 'easy',
        hint: 'It detects sharp changes in intensity.',
        order: 3
      },
      {
        type: 'true-false',
        content: {
          statement: 'Grayscale images have only one color channel.',
          correct: true
        },
        difficulty: 'easy',
        hint: 'Gray values range from 0 to 255.',
        order: 4
      },
      {
        type: 'fill-blank',
        content: {
          sentence: '___ is used to reduce noise and smooth images.',
          options: ['Edge Detection', 'Blurring', 'Thresholding', 'Segmentation'],
          correctIndex: 1
        },
        difficulty: 'easy',
        hint: 'Smoothing removes noise.',
        order: 5
      },
      {
        type: 'yes-no',
        content: {
          question: 'Is preprocessing always necessary in computer vision?',
          correct: true
        },
        difficulty: 'easy',
        hint: 'Clean input leads to better results.',
        order: 6
      }
    ],
    3: [ // Chapter 3: Object Detection
      {
        type: 'theory',
        content: {
          title: 'Object Detection',
          body: `**Object Detection** locates and classifies objects in images.\n\n### Approaches:\n- **Two-stage**: Region proposals + classification (R-CNN)\n- **One-stage**: Direct detection (YOLO, SSD)\n\n### Evaluation Metrics:\n- **IoU (Intersection over Union)**: Overlap measurement\n- **mAP (mean Average Precision)**: Overall accuracy\n\n### Applications:\n- Autonomous vehicles\n- Surveillance\n- Retail analytics`
        },
        difficulty: 'hard',
        hint: 'Detection finds WHERE objects are.',
        order: 1
      },
      {
        type: 'multiple-choice',
        content: {
          question: 'What does IoU measure?',
          options: [
            'Image quality',
            'Overlap between predicted and ground truth boxes',
            'Processing speed',
            'Model size'
          ],
          correctIndex: 1
        },
        difficulty: 'hard',
        hint: 'It measures how well boxes overlap.',
        order: 2
      },
      {
        type: 'true-false',
        content: {
          statement: 'YOLO is a two-stage object detection algorithm.',
          correct: false
        },
        difficulty: 'medium',
        hint: 'YOLO stands for You Only Look Once.',
        order: 3
      },
      {
        type: 'fill-blank',
        content: {
          sentence: '___ is a metric that measures the overlap between predicted and actual bounding boxes.',
          options: ['Accuracy', 'IoU', 'Precision', 'Recall'],
          correctIndex: 1
        },
        difficulty: 'medium',
        hint: 'Intersection over Union.',
        order: 4
      },
      {
        type: 'yes-no',
        content: {
          question: 'Can object detection be used for self-driving cars?',
          correct: true
        },
        difficulty: 'easy',
        hint: 'Cars need to detect pedestrians, signs, etc.',
        order: 5
      },
      {
        type: 'matching',
        content: {
          question: 'Match each detection approach with its characteristic:',
          options: [
            'Two-stage - Higher accuracy, slower',
            'One-stage - Faster, real-time capable',
            'YOLO - Single-pass detection',
            'R-CNN - Region-based approach'
          ],
          correctIndex: 0
        },
        difficulty: 'hard',
        hint: 'Two-stage methods are more accurate but slower.',
        order: 6
      }
    ]
  },

  // ========================================================
  // NATURAL LANGUAGE PROCESSING
  // ========================================================
  'Natural Language Processing': {
    1: [ // Chapter 1: NLP Basics
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
      },
      {
        type: 'true-false',
        content: {
          statement: 'NLP can only process English text.',
          correct: false
        },
        difficulty: 'easy',
        hint: 'NLP works with many languages.',
        order: 4
      },
      {
        type: 'fill-blank',
        content: {
          sentence: '___ analysis determines the emotional tone of text.',
          options: ['Sentiment', 'Syntactic', 'Semantic', 'Phonetic'],
          correctIndex: 0
        },
        difficulty: 'easy',
        hint: 'It detects positive, negative, or neutral.',
        order: 5
      },
      {
        type: 'matching',
        content: {
          question: 'Match each NLP task with its description:',
          options: [
            'Tokenization - Splitting text into words',
            'NER - Identifying named entities',
            'Sentiment Analysis - Detecting emotion',
            'Translation - Converting between languages'
          ],
          correctIndex: 0
        },
        difficulty: 'easy',
        hint: 'Tokenization is often the first step.',
        order: 6
      },
      {
        type: 'code',
        content: {
          title: 'Tokenizing Text with Python',
          explanation: `Let's split text into individual tokens.`,
          code: `text = "Natural Language Processing is amazing"\n\n# Simple tokenization\ntokens = text.split()\nprint(tokens)`,
          task: 'What does text.split() return?',
          expectedAnswer: "['Natural', 'Language', 'Processing', 'is', 'amazing']"
        },
        difficulty: 'easy',
        hint: 'Split by whitespace.',
        order: 7
      }
    ],
    2: [ // Chapter 2: Text Processing
      {
        type: 'theory',
        content: {
          title: 'Text Preprocessing',
          body: `### Preprocessing Steps:\n- **Lowercasing**: Converting to lowercase\n- **Stop Word Removal**: Removing common words (the, is, at)\n- **Stemming**: Reducing words to root form\n- **Lemmatization**: Reducing to dictionary form\n\n### Why Preprocess?\n- Reduces vocabulary size\n- Improves model accuracy\n- Removes noise\n\n### Tools:\n- NLTK, spaCy, TextBlob`
        },
        difficulty: 'medium',
        hint: 'Preprocessing cleans text data.',
        order: 1
      },
      {
        type: 'code',
        content: {
          title: 'Removing Stop Words',
          explanation: `Stop words add noise to text analysis.`,
          code: `import nltk\nfrom nltk.corpus import stopwords\n\nnltk.download('stopwords')\nstop_words = set(stopwords.words('english'))\n\ntext = "This is a sample sentence"\nwords = text.split()\nfiltered = [w for w in words if w.lower() not in stop_words]`,
          task: 'Write code to filter out stop words from a list of words.',
          expectedAnswer: '[w for w in words if w.lower() not in stop_words]'
        },
        difficulty: 'medium',
        hint: 'Use a list comprehension with stop_words.',
        order: 2
      },
      {
        type: 'multiple-choice',
        content: {
          question: 'What is the difference between stemming and lemmatization?',
          options: [
            'They are the same',
            'Stemming is faster, lemmatization is more accurate',
            'Stemming uses dictionaries, lemmatization doesn\'t',
            'Lemm