import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Contributors Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Contributors
          </h3>
          <div className="flex justify-center">
            <a
              href="https://github.com/abhivaikar/howtheytest/graphs/contributors"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block transition-opacity hover:opacity-80"
            >
              <Image
                src="https://contributors-img.web.app/image?repo=abhivaikar/howtheytest"
                alt="Contributors"
                width={800}
                height={200}
                className="rounded-lg"
              />
            </a>
          </div>
          <p className="text-center mt-4 text-gray-600 dark:text-gray-400">
            Want to contribute?{' '}
            <Link href="/contribute" className="text-blue-600 dark:text-blue-400 hover:underline">
              Submit a resource
            </Link>{' '}
            or{' '}
            <a
              href="https://github.com/abhivaikar/howtheytest"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              fork and raise a PR
            </a>
            !
          </p>
        </div>

        {/* Credits Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Credits & Tools
          </h3>
          <div className="max-w-3xl mx-auto">
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  Images in banner from{' '}
                  <a
                    href="https://undraw.co/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    undraw.co
                  </a>
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  Built with{' '}
                  <a
                    href="https://nextjs.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Next.js
                  </a>
                  ,{' '}
                  <a
                    href="https://tailwindcss.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Tailwind CSS
                  </a>
                  , and{' '}
                  <a
                    href="https://www.typescriptlang.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    TypeScript
                  </a>
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  Hosted on{' '}
                  <a
                    href="https://pages.github.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    GitHub Pages
                  </a>
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  Serverless functions powered by{' '}
                  <a
                    href="https://www.netlify.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Netlify
                  </a>
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  Contributors list from{' '}
                  <a
                    href="https://contributors-img.web.app/preview"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    contributors-img
                  </a>
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  Inspired by the{' '}
                  <a
                    href="https://github.com/sindresorhus/awesome"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    awesome
                  </a>{' '}
                  lists
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>All the authors and companies who shared their testing resources</span>
              </li>
            </ul>
          </div>
        </div>

        {/* License Section */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            License
          </h3>
          <div className="flex flex-col items-center">
            <a
              href="https://creativecommons.org/publicdomain/zero/1.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block transition-opacity hover:opacity-80"
            >
              <Image
                src="https://licensebuttons.net/p/zero/1.0/88x31.png"
                alt="CC0 License"
                width={88}
                height={31}
              />
            </a>
            <p className="mt-4 text-center text-gray-600 dark:text-gray-400 max-w-2xl">
              This work is licensed under{' '}
              <a
                href="https://creativecommons.org/publicdomain/zero/1.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Creative Commons Zero v1.0 Universal
              </a>
              . You can copy, modify, distribute and perform the work, even for commercial purposes, all without asking permission.
            </p>
          </div>
        </div>

        {/* Code of Conduct */}
        <div className="text-center pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            <a
              href="https://github.com/abhivaikar/howtheytest/blob/master/CODE_OF_CONDUCT.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Code of Conduct
            </a>
            {' • '}
            <a
              href="https://github.com/abhivaikar/howtheytest"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              GitHub
            </a>
          </p>
          <p className="text-gray-600 dark:text-gray-400 mt-4">
            Made with ❤️ by the community
          </p>
        </div>
      </div>
    </footer>
  );
}
