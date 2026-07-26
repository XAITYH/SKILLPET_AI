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

// Course-specific chapter content
const courseChapters = {
  'Python Basics': [
    { title: 'Introduction to Python', description: 'Overview of Python and its applications', emoji: '🐍', order: 1 },
    { title: 'Setting Up Your Environment', description: 'Installing Python and setting up IDE', emoji: '⚙️', order: 2 },
    { title: 'Variables and Data Types', description: 'Understanding variables, strings, integers, and floats', emoji: '📦', order: 3 },
    { title: 'Control Flow', description: 'If statements, loops, and conditional logic', emoji: '🔀', order: 4 },
    { title: 'Functions', description: 'Creating and calling functions', emoji: '⚡', order: 5 },
    { title: 'Lists and Tuples', description: 'Working with ordered collections', emoji: '📋', order: 6 },
    { title: 'Dictionaries and Sets', description: 'Key-value pairs and unique collections', emoji: '🗂️', order: 7 },
    { title: 'File Handling', description: 'Reading and writing files', emoji: '📁', order: 8 },
    { title: 'Error Handling', description: 'Try-except blocks and exceptions', emoji: '🛡️', order: 9 },
    { title: 'Final Project', description: 'Building a complete Python program', emoji: '🎯', order: 10 },
  ],
  'JavaScript Fundamentals': [
    { title: 'JavaScript Basics', description: 'Introduction to JavaScript and its role in web development', emoji: '💻', order: 1 },
    { title: 'Variables and Types', description: 'let, const, var and data types', emoji: '📦', order: 2 },
    { title: 'Operators and Expressions', description: 'Arithmetic, comparison, and logical operators', emoji: '🔢', order: 3 },
    { title: 'Control Structures', description: 'If-else, switch, and loops', emoji: '🔀', order: 4 },
    { title: 'Functions', description: 'Function declarations, expressions, and arrow functions', emoji: '⚡', order: 5 },
    { title: 'Arrays', description: 'Array methods and manipulation', emoji: '📊', order: 6 },
    { title: 'Objects', description: 'Object properties and methods', emoji: '🧩', order: 7 },
    { title: 'DOM Manipulation', description: 'Interacting with the HTML document', emoji: '🌐', order: 8 },
    { title: 'Events', description: 'Handling user interactions', emoji: '🖱️', order: 9 },
  ],
  'Web Development': [
    { title: 'How the Web Works', description: 'HTTP, browsers, and servers', emoji: '🌍', order: 1 },
    { title: 'HTML Fundamentals', description: 'Structure and semantics of HTML', emoji: '📝', order: 2 },
    { title: 'CSS Basics', description: 'Styling with CSS selectors and properties', emoji: '🎨', order: 3 },
    { title: 'Box Model and Layout', description: 'Understanding margins, padding, and positioning', emoji: '📦', order: 4 },
    { title: 'Responsive Design', description: 'Media queries and mobile-first approach', emoji: '📱', order: 5 },
    { title: 'JavaScript for Web', description: 'Adding interactivity to web pages', emoji: '⚡', order: 6 },
    { title: 'Forms and Validation', description: 'Building and validating forms', emoji: '✅', order: 7 },
    { title: 'APIs and Fetch', description: 'Consuming REST APIs', emoji: '🔌', order: 8 },
    { title: 'Deployment', description: 'Deploying your website to the internet', emoji: '🚀', order: 9 },
    { title: 'Final Project', description: 'Building a complete website', emoji: '🎯', order: 10 },
  ],
  'Data Science': [
    { title: 'Introduction to Data Science', description: 'What is data science and why it matters', emoji: '📊', order: 1 },
    { title: 'Python for Data Science', description: 'Essential Python libraries', emoji: '🐍', order: 2 },
    { title: 'NumPy Fundamentals', description: 'Arrays and numerical computing', emoji: '🔢', order: 3 },
    { title: 'Pandas for Data Analysis', description: 'DataFrames and data manipulation', emoji: '🐼', order: 4 },
    { title: 'Data Visualization', description: 'Matplotlib and Seaborn', emoji: '📈', order: 5 },
    { title: 'Statistical Analysis', description: 'Basic statistics and probability', emoji: '📉', order: 6 },
    { title: 'Machine Learning Basics', description: 'Introduction to ML concepts', emoji: '🤖', order: 7 },
    { title: 'Data Cleaning', description: 'Handling missing data and outliers', emoji: '🧹', order: 8 },
  ],
  'Mobile App Development': [
    { title: 'Mobile Development Overview', description: 'Native vs cross-platform', emoji: '📱', order: 1 },
    { title: 'React Native Setup', description: 'Environment and project setup', emoji: '⚛️', order: 2 },
    { title: 'Components and JSX', description: 'Building UI components', emoji: '🧩', order: 3 },
    { title: 'State Management', description: 'Managing application state', emoji: '🔄', order: 4 },
    { title: 'Navigation', description: 'Screen navigation and routing', emoji: '🧭', order: 5 },
    { title: 'API Integration', description: 'Connecting to backend services', emoji: '🔌', order: 6 },
    { title: 'Styling', description: 'Styling mobile applications', emoji: '🎨', order: 7 },
    { title: 'Testing', description: 'Testing your mobile app', emoji: '🧪', order: 8 },
    { title: 'Publishing', description: 'App store submission', emoji: '🚀', order: 9 },
  ],
  'Machine Learning': [
    { title: 'Introduction to ML', description: 'What is machine learning', emoji: '🤖', order: 1 },
    { title: 'Supervised Learning', description: 'Classification and regression', emoji: '📊', order: 2 },
    { title: 'Unsupervised Learning', description: 'Clustering and dimensionality reduction', emoji: '🔍', order: 3 },
    { title: 'Model Evaluation', description: 'Metrics and validation', emoji: '✅', order: 4 },
    { title: 'Feature Engineering', description: 'Preparing data for ML', emoji: '⚙️', order: 5 },
    { title: 'Neural Networks', description: 'Deep learning fundamentals', emoji: '🧠', order: 6 },
    { title: 'Real-world Projects', description: 'Applied machine learning', emoji: '🎯', order: 7 },
  ],
  // Default chapters for courses without specific content
  'default': [
    { title: 'Course Introduction', description: 'Overview and learning objectives', emoji: '📚', order: 1 },
    { title: 'Getting Started', description: 'Prerequisites and setup', emoji: '🚀', order: 2 },
    { title: 'Core Concepts', description: 'Fundamental principles', emoji: '💡', order: 3 },
    { title: 'Hands-on Practice', description: 'Practical exercises', emoji: '🛠️', order: 4 },
    { title: 'Advanced Topics', description: 'Deeper exploration', emoji: '🔬', order: 5 },
    { title: 'Real-world Applications', description: 'Practical use cases', emoji: '🌍', order: 6 },
    { title: 'Best Practices', description: 'Industry standards and tips', emoji: '✅', order: 7 },
    { title: 'Final Project', description: 'Putting it all together', emoji: '🎯', order: 8 },
  ],
};

async function seedChapters() {
  try {
    // Fetch all courses
    console.log('Fetching courses...');
    const coursesRes = await makeRequest('GET', '/api/courses?populate=*');
    const courses = coursesRes.data || [];
    
    console.log(`Found ${courses.length} courses`);
    
    // First, delete ALL existing chapters (force clean)
    console.log('\nDeleting all existing chapters...');
    let page = 1;
    let hasMore = true;
    let totalDeleted = 0;
    while (hasMore) {
      const existingChapters = await makeRequest('GET', `/api/chapters?pagination[page]=${page}&pagination[pageSize]=25`);
      if (existingChapters.data && existingChapters.data.length > 0) {
        for (const ch of existingChapters.data) {
          try {
            await makeRequest('DELETE', `/api/chapters/${ch.documentId}`);
            console.log(`  ✓ Deleted: ${ch.title}`);
            totalDeleted++;
          } catch (err) {
            console.error(`  ✗ Failed to delete ${ch.title}:`, err.message);
          }
        }
        hasMore = existingChapters.data.length === 25;
        page++;
      } else {
        hasMore = false;
      }
    }
    console.log(`Deleted ${totalDeleted} chapters total`);
    
    // Also delete ALL content blocks
    console.log('\nDeleting all existing content blocks...');
    page = 1;
    hasMore = true;
    while (hasMore) {
      const existingBlocks = await makeRequest('GET', `/api/chapter-content-blocks?pagination[page]=${page}&pagination[pageSize]=25`);
      if (existingBlocks.data && existingBlocks.data.length > 0) {
        for (const block of existingBlocks.data) {
          try {
            await makeRequest('DELETE', `/api/chapter-content-blocks/${block.documentId}`);
            console.log(`  ✓ Deleted content block`);
          } catch (err) {
            console.error(`  ✗ Failed to delete content block:`, err.message);
          }
        }
        hasMore = existingBlocks.data.length === 25;
        page++;
      } else {
        hasMore = false;
      }
    }
    
    // Now create fresh chapters for all courses
    for (const course of courses) {
      const courseName = course.title || course.name;
      console.log(`\nProcessing: ${courseName}`);
      
      // Get chapters for this course (or use default)
      const chapters = courseChapters[courseName] || courseChapters['default'];
      
      // Create each chapter
      for (const chapter of chapters) {
        try {
          const result = await makeRequest('POST', '/api/chapters', {
            data: {
              title: chapter.title,
              description: chapter.description,
              emoji: chapter.emoji,
              order: chapter.order,
              course: course.id,
            },
          });
          console.log(`  ✓ Created: ${chapter.emoji} ${chapter.title}`);
        } catch (err) {
          console.error(`  ✗ Failed to create ${chapter.title}:`, err.message);
        }
      }
    }
    
    console.log('\n✅ Seed completed!');
  } catch (error) {
    console.error('Seed failed:', error);
  }
}

seedChapters();
