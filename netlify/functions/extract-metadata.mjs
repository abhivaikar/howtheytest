import * as cheerio from 'cheerio';

// Security configuration
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['https://abhivaikar.github.io', 'http://localhost:3000'];

// Security constants
const MAX_RESPONSE_SIZE = 5 * 1024 * 1024; // 5MB limit
const FETCH_TIMEOUT_MS = 10000; // 10 seconds
const ALLOWED_PROTOCOLS = ['http:', 'https:'];
const ALLOWED_CONTENT_TYPES = ['text/html', 'application/xhtml+xml'];

// Private IP ranges and cloud metadata endpoints (SSRF protection)
const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\./,  // Loopback
  /^10\./,   // Private Class A
  /^172\.(1[6-9]|2[0-9]|3[01])\./,  // Private Class B
  /^192\.168\./,  // Private Class C
  /^169\.254\./,  // Link-local / AWS metadata
  /^::1$/,  // IPv6 loopback
  /^fe80:/i,  // IPv6 link-local
  /^fc00:/i,  // IPv6 private
  /^fd00:/i,  // IPv6 private
];

// Resource type detection patterns
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
  'blog or article': [
    // Blog platforms
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
    // Academic/research papers
    /arxiv\.org/i,
    /acm\.org/i,
    /ieee\.org/i,
    /springer\.com/i,
    /sciencedirect\.com/i,
    /\.pdf$/i,
    // Documentation and guides
    /\/docs/i,
    /\/documentation/i,
    /\/guide/i,
    /\/wiki/i,
    /\/manual/i,
    /readthedocs\.io/i,
    /gitbook\.io/i,
    /notion\.site/i,
    /confluence\./i,
    // Conference talks and presentations
    /\/talks?\//i,
    /\/presentations?\//i,
    /\/conference/i,
    /slideshare\.net/i,
    /speakerdeck\.com/i,
    /\/slides?\//i,
    /\/webinar/i,
    /\/summit/i,
    /\/meetup/i,
    // Podcasts
    /spotify\.com\/episode/i,
    /podcasts\.apple\.com/i,
    /anchor\.fm/i,
    /\/podcast/i,
    /soundcloud\.com/i,
    /overcast\.fm/i,
    /pocketcasts\.com/i,
    /castbox\.fm/i,
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
};

/**
 * Validate URL to prevent SSRF attacks
 * @param {string} url - URL to validate
 * @throws {Error} If URL is invalid or points to private/local resources
 */
function validateSecureUrl(url) {
  let parsedUrl;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error('INVALID_URL');
  }

  // Check protocol (only http and https allowed)
  if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
    throw new Error('INVALID_PROTOCOL');
  }

  // Check for private/local IP addresses and cloud metadata endpoints
  const hostname = parsedUrl.hostname.toLowerCase();

  if (PRIVATE_IP_PATTERNS.some(pattern => pattern.test(hostname))) {
    throw new Error('PRIVATE_IP');
  }

  return parsedUrl;
}

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

  // Return unique topics, limited to top 5 most relevant
  return [...new Set(suggestedTopics)].slice(0, 5);
}

/**
 * Fetch and extract metadata from URL with security protections
 */
async function fetchMetadata(url, existingTopics = []) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const startTime = Date.now();

  try {
    // Validate URL for SSRF protection
    validateSecureUrl(url);

    // Fetch the URL with timeout and size limit
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      const error = new Error('FETCH_FAILED');
      error.statusCode = response.status;
      error.statusText = response.statusText;
      throw error;
    }

    // Validate Content-Type
    const contentType = response.headers.get('content-type') || '';
    const isHtml = ALLOWED_CONTENT_TYPES.some(type => contentType.toLowerCase().includes(type));

    if (!isHtml) {
      throw new Error('INVALID_CONTENT_TYPE');
    }

    // Check Content-Length if available
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_RESPONSE_SIZE) {
      throw new Error('RESPONSE_TOO_LARGE');
    }

    // Read response with size limit
    const html = await response.text();

    if (html.length > MAX_RESPONSE_SIZE) {
      throw new Error('RESPONSE_TOO_LARGE');
    }

    const $ = cheerio.load(html);

    // Extract metadata
    const title = extractTitle($);
    const type = detectResourceType(url);
    const topics = extractTopics($, existingTopics);

    const duration = Date.now() - startTime;

    // Log successful extraction
    console.log('Metadata extraction successful:', {
      url,
      duration: `${duration}ms`,
      statusCode: response.status,
      statusText: response.statusText,
      contentType,
      contentLength: contentLength || 'unknown',
      htmlSize: html.length,
      extracted: {
        title: title || 'null',
        type: type || 'null',
        topicsCount: topics.length,
      },
    });

    return {
      success: true,
      title,
      type,
      topics,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    // Log error internally but don't expose details
    console.error('Metadata extraction error:', {
      url,
      duration: `${duration}ms`,
      error: error.message,
      name: error.name,
      statusCode: error.statusCode,
      statusText: error.statusText,
      cause: error.cause,
      stack: error.stack,
    });

    // Map internal errors to user-friendly messages
    let userMessage = 'Unable to analyze this resource';

    if (error.name === 'AbortError') {
      userMessage = 'Request timeout - the resource took too long to respond';
    } else if (error.message === 'INVALID_URL') {
      userMessage = 'Invalid URL format';
    } else if (error.message === 'INVALID_PROTOCOL') {
      userMessage = 'Only HTTP and HTTPS URLs are supported';
    } else if (error.message === 'PRIVATE_IP') {
      userMessage = 'Private and local IP addresses are not allowed';
    } else if (error.message === 'INVALID_CONTENT_TYPE') {
      userMessage = 'Resource is not an HTML page';
    } else if (error.message === 'RESPONSE_TOO_LARGE') {
      userMessage = 'Resource is too large to analyze';
    } else if (error.message === 'FETCH_FAILED') {
      userMessage = 'Unable to fetch the resource';
    }

    return {
      success: false,
      error: userMessage,
      title: null,
      type: detectResourceType(url), // Still try to detect type from URL
      topics: [],
    };
  } finally {
    clearTimeout(timeout);
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

    // Basic request validation (abuse detection)
    if (url.length > 2000) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'URL is too long' }),
      };
    }

    // Parse existing topics if provided
    let existingTopics = [];
    if (topicsParam) {
      try {
        existingTopics = JSON.parse(decodeURIComponent(topicsParam));
        if (!Array.isArray(existingTopics)) {
          throw new Error('Topics must be an array');
        }
      } catch {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid topics parameter' }),
        };
      }
    }

    // Extract metadata
    const metadata = await fetchMetadata(url, existingTopics);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(metadata),
    };
  } catch (error) {
    // Log error internally
    console.error('Error in extract-metadata function:', error);

    // Return generic error message (no internal details)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Unable to process request. Please try again later.',
      }),
    };
  }
};
