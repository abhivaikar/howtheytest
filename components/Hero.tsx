export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 dark:bg-blue-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-300 dark:bg-pink-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="text-center">
          {/* Banner Image */}
          <div className="mb-8 flex justify-center">
            <img
              src="/howtheytest/howtheytest-banner-transparent.png"
              alt="How They Test Banner"
              className="max-w-full h-auto w-[500px] sm:w-[600px] md:w-[700px]"
            />
          </div>

          {/* Title */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6">
            How They Test
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl md:text-2xl text-gray-700 dark:text-gray-300 max-w-4xl mx-auto mb-8">
            A curated collection of publicly available resources on how software companies around the world test their software systems and build their quality culture.
          </p>

          {/* GitHub Stats */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <a
              href="https://github.com/abhivaikar/howtheytest/network/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center"
            >
              <img
                src="https://img.shields.io/github/forks/abhivaikar/howtheytest.svg?style=social&label=Fork&maxAge=2592000"
                alt="GitHub forks"
                className="h-6"
              />
            </a>
            <a
              href="https://github.com/abhivaikar/howtheytest/stargazers/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center"
            >
              <img
                src="https://img.shields.io/github/stars/abhivaikar/howtheytest.svg?style=social&label=Star&maxAge=2592000"
                alt="GitHub stars"
                className="h-6"
              />
            </a>
            <img
              src="https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat"
              alt="Contributions welcome"
              className="h-6"
            />
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://github.com/abhivaikar/howtheytest"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 rounded-full border-2 border-gray-700 dark:border-gray-300 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-700 hover:text-white dark:hover:bg-gray-300 dark:hover:text-gray-900 transition-colors"
            >
              GitHub
            </a>
            <a
              href="#browse"
              className="px-8 py-3 rounded-full text-white font-medium shadow-lg hover:shadow-xl transition-all"
              style={{ backgroundColor: '#42b983' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3aa876'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#42b983'}
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
