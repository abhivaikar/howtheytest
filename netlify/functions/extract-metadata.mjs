import * as cheerio from 'cheerio';

// Security configuration
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['https://abhivaikar.github.io', 'http://localhost:3000'];

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per IP
const rateLimits = new Map();

// Clean up old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, requests] of rateLimits.entries()) {
    const validRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW_MS);
    if (validRequests.length === 0) {
      rateLimits.delete(ip);
    } else {
      rateLimits.set(ip, validRequests);
    }
  }
}, 300000);

// Helper function to check rate limit
function checkRateLimit(ip) {
  const now = Date.now();

  if (!rateLimits.has(ip)) {
    rateLimits.set(ip, []);
  }

  const requests = rateLimits.get(ip).filter(time => now - time < RATE_LIMIT_WINDOW_MS);

  if (requests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false; // Rate limit exceeded
  }

  requests.push(now);
  rateLimits.set(ip, requests);
  return true;
}

// Resource type detection patterns
// Note: Only detecting types that exist in the HowTheyTest system
const RESOURCE_TYPE_PATTERNS = {
  video: [
    /youtube\.com\/watch/i,
    /youtu\.be\//i,
    /vimeo\.com/i,
    /youtube\.com\/embed/i,
    /loom\.com/i,
    /wistia\.com/i,
    /dailymotion\.com/i,
    /twitch\.tv\/videos/i,
  ],
  blog: [
    /medium\.com/i,
    /dev\.to/i,
    /hashnode\./i,
    /\/blog\//i,
    /\/posts?\//i,
    /substack\.com/i,
    /wordpress\.com/i,
    /blogger\.com/i,
    /tumblr\.com/i,
    /ghost\.io/i,
    /\.blog/i,
  ],
  repo: [
    /github\.com\/[^\/]+\/[^\/]+\/?$/i,
    /gitlab\.com\/[^\/]+\/[^\/]+\/?$/i,
    /bitbucket\.org\/[^\/]+\/[^\/]+\/?$/i,
    /gitea\./i,
    /sourceforge\.net\/projects/i,
  ],
  book: [
    /\/books?\//i,
    /amazon\.com\/.*\/dp\//i,
    /goodreads\.com\/book/i,
    /oreilly\.com/i,
    /packtpub\.com/i,
    /manning\.com/i,
    /pragprog\.com/i,
    /leanpub\.com/i,
  ],
  article: [
    // Academic/research papers
    /arxiv\.org/i,
    /acm\.org/i,
    /ieee\.org/i,
    /springer\.com/i,
    /sciencedirect\.com/i,
    /\.pdf$/i,
    // Documentation and guides (categorized as articles)
    /\/docs/i,
    /\/documentation/i,
    /\/guide/i,
    /\/wiki/i,
    /\/manual/i,
    /readthedocs\.io/i,
    /gitbook\.io/i,
    /notion\.site/i,
    /confluence\./i,
    // Conference talks and presentations (categorized as articles)
    /\/talks?\//i,
    /\/presentations?\//i,
    /\/conference/i,
    /slideshare\.net/i,
    /speakerdeck\.com/i,
    /\/slides?\//i,
    /\/webinar/i,
    /\/summit/i,
    /\/meetup/i,
    // Podcasts (categorized as articles for now)
    /spotify\.com\/episode/i,
    /podcasts\.apple\.com/i,
    /anchor\.fm/i,
    /\/podcast/i,
    /soundcloud\.com/i,
    /overcast\.fm/i,
    /pocketcasts\.com/i,
    /castbox\.fm/i,
  ],
};

// Topic keywords mapping (will be enhanced with actual topics from database)
const TOPIC_KEYWORDS = {
  'testing': ['test', 'testing', 'qa', 'quality assurance'],
  'automation': ['automation', 'automated', 'selenium', 'cypress', 'playwright'],
  'ci/cd': ['ci/cd', 'continuous integration', 'continuous deployment', 'jenkins', 'github actions', 'gitlab ci'],
  'unit-testing': ['unit test', 'unittest', 'jest', 'mocha', 'pytest'],
  'integration-testing': ['integration test', 'integration testing', 'api test'],
  'e2e-testing': ['e2e', 'end-to-end', 'end to end'],
  'performance': ['performance', 'load test', 'stress test', 'jmeter', 'gatling'],
  'security': ['security', 'penetration test', 'security test', 'vulnerability'],
  'mobile': ['mobile', 'ios', 'android', 'appium'],
  'api': ['api', 'rest', 'graphql', 'postman'],
  'tdd': ['tdd', 'test-driven', 'test driven development'],
  'bdd': ['bdd', 'behavior-driven', 'cucumber', 'gherkin'],
  'test-strategy': ['test strategy', 'testing strategy', 'test plan'],
  'code-review': ['code review', 'pull request', 'pr review'],
  'monitoring': ['monitoring', 'observability', 'logging', 'metrics'],
  'chaos-engineering': ['chaos', 'chaos engineering', 'resilience'],
  'shift-left': ['shift left', 'shift-left'],
};

/**
 * Detect resource type from URL patterns
 */
function detectResourceType(url) {
  const urlLower = url.toLowerCase();

  for (const [type, patterns] of Object.entries(RESOURCE_TYPE_PATTERNS)) {
    if (patterns.some(pattern => pattern.test(urlLower))) {
      return type;
    }
  }

  return null;
}

/**
 * Extract title from HTML using multiple fallback strategies
 */
function extractTitle($) {
  // Priority order for title extraction
  const titleCandidates = [
    $('meta[property="og:title"]').attr('content'),
    $('meta[name="twitter:title"]').attr('content'),
    $('meta[name="title"]').attr('content'),
    $('title').text(),
    $('h1').first().text(),
    $('h2').first().text(),
  ];

  for (const candidate of titleCandidates) {
    if (candidate && candidate.trim()) {
      // Clean up title (remove site name suffixes like " | Site Name")
      let title = candidate.trim();
      title = title.replace(/\s*[\|\-\u2014]\s*.+$/, ''); // Remove " | SiteName" or " - SiteName"
      return title.trim();
    }
  }

  return null;
}

/**
 * Extract and suggest topics based on page content
 */
function extractTopics($, existingTopics) {
  // Get all text content from key areas
  const title = $('title').text() || '';
  const description = $('meta[name="description"]').attr('content') || '';
  const h1 = $('h1').text() || '';
  const h2 = $('h2').text() || '';
  const keywords = $('meta[name="keywords"]').attr('content') || '';

  // Combine all text for analysis
  const combinedText = `${title} ${description} ${h1} ${h2} ${keywords}`.toLowerCase();

  const suggestedTopics = [];

  // Match against existing topics from the database
  for (const topic of existingTopics) {
    const topicLower = topic.toLowerCase();
    const topicWords = topicLower.split(/[\s\-_]+/);

    // Check if topic or its words appear in content
    if (combinedText.includes(topicLower)) {
      suggestedTopics.push(topic);
      continue;
    }

    // Check individual words of multi-word topics
    if (topicWords.length > 1) {
      const allWordsPresent = topicWords.every(word =>
        word.length > 2 && combinedText.includes(word)
      );
      if (allWordsPresent) {
        suggestedTopics.push(topic);
      }
    }
  }

  // Also check against common keyword patterns
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (suggestedTopics.includes(topic)) continue; // Already added

    const hasKeyword = keywords.some(keyword =>
      combinedText.includes(keyword.toLowerCase())
    );

    if (hasKeyword && existingTopics.includes(topic)) {
      suggestedTopics.push(topic);
    }
  }

  // Return unique topics, limited to top 5 most relevant
  return [...new Set(suggestedTopics)].slice(0, 5);
}

/**
 * Fetch and extract metadata from URL
 */
async function fetchMetadata(url, existingTopics = []) {
  try {
    // Fetch the URL with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'HowTheyTest-Bot/1.0 (Resource metadata extraction)',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract metadata
    const title = extractTitle($);
    const type = detectResourceType(url);
    const topics = extractTopics($, existingTopics);

    return {
      success: true,
      title,
      type,
      topics,
    };
  } catch (error) {
    console.error('Metadata extraction error:', error);
    return {
      success: false,
      error: error.message,
      title: null,
      type: detectResourceType(url), // Still try to detect type from URL
      topics: [],
    };
  }
}

/**
 * Netlify function handler
 */
export const handler = async (event) => {
  // Origin validation
  const origin = event.headers.origin || event.headers.Origin || '';
  const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin);

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : '',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Check origin for actual requests
  if (!isAllowedOrigin) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: 'Origin not allowed' }),
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Rate limiting
  const clientIp = event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return {
      statusCode: 429,
      headers,
      body: JSON.stringify({ error: 'Too many requests. Please try again in a minute.' }),
    };
  }

  try {
    // Get URL and topics from query parameters
    const url = event.queryStringParameters?.url;
    const topicsParam = event.queryStringParameters?.topics;

    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'URL parameter is required' }),
      };
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid URL format' }),
      };
    }

    // Parse existing topics if provided
    const existingTopics = topicsParam ? JSON.parse(decodeURIComponent(topicsParam)) : [];

    // Extract metadata
    const metadata = await fetchMetadata(url, existingTopics);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(metadata),
    };
  } catch (error) {
    console.error('Error in extract-metadata function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to extract metadata',
        details: error.message,
      }),
    };
  }
};
