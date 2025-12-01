export default function Intro() {
  return (
    <section className="bg-white dark:bg-gray-800 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Foreword */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Foreword
          </h2>

          <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed">
            <p>
              One of the outcomes of the various{' '}
              <a
                href="https://taqelah.sg/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 dark:text-green-400 hover:underline"
              >
                Taqelah
              </a>{' '}
              meetups was that many software companies got to share their testing and quality culture with the community. It was absolutely fantastic to see the amazing stuff companies are doing to test their software, and ensure quality of their products and platforms.
            </p>

            <p>
              Apart from this, many companies regularly come forward and share their best practices, tools, techniques and culture of software testing on various public platforms like conferences, blogs & meetups. The resources are there but dispersed, lost into the internet.
            </p>

            <p>
              There is no single knowledge repository that gives a direct look at these best practices, tools, techniques and culture of software testing these companies adopt. This repository intends to do that.
            </p>

            <p className="font-semibold">Happy Learning!</p>

            <p className="italic text-sm">
              Please note, that all the resources mentioned here are publicly available resources.
            </p>
          </div>
        </div>

        {/* Topics Section */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Kind of topics here
          </h2>

          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
            Testing / quality of software goes beyond traditional activities of pre-release functional testing and test automation. Hence the kind of topics you can expect to read about here are:
          </p>

          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Functional testing</li>
            <li>Non-functional testing</li>
            <li>Test automation</li>
            <li>Testing in CI/CD</li>
            <li>Release management and its impact on quality/testing</li>
            <li>Quality processes and culture</li>
            <li>Testing in production (monitoring/observability, chaos engineering, site reliability engineering etc.)</li>
            <li>Customer / user support</li>
            <li>User research / user testing from product/UX perspective</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
