// ============================================================
// ROLE CONFIGURATION — Edit this file before your demo
// to update job title, responsibilities, and requirements.
// All role content is sourced from this single file.
// ============================================================

export const ROLE_CONFIG = {
  title: 'Software Engineer — Platform & Payments',
  department: 'Engineering',
  team: 'Platform Infrastructure',
  location: 'Bengaluru, India (Hybrid)',
  employmentType: 'Full-time',
  // Mark as provisional until official JD is confirmed
  isProvisional: true,

  overview: `Pine Labs is building the commerce infrastructure that connects merchants,
  customers, and financial institutions across India and Southeast Asia. As a
  Software Engineer on the Platform team, you will contribute to the systems
  that process millions of transactions daily — designing, building, and
  maintaining services that are reliable, observable, and easy to extend.`,

  responsibilities: [
    'Design and build backend services and APIs that power payment and commerce experiences',
    'Contribute to system architecture discussions and translate requirements into technical designs',
    'Write well-tested, maintainable code and participate in thorough code reviews',
    'Identify and resolve reliability, performance, or scalability issues in production systems',
    'Collaborate with product, design, and cross-functional engineering teams',
    'Document your work so teammates can build on it confidently',
  ],

  requiredSkills: [
    'Proficiency in Python, Java, Go, or a comparable backend language',
    'Experience designing and consuming REST or gRPC APIs',
    'Solid understanding of data structures, algorithms, and system design fundamentals',
    'Familiarity with relational databases and SQL',
    'Working knowledge of version control (Git) and collaborative development workflows',
  ],

  preferredSkills: [
    'Experience with distributed systems, microservices, or event-driven architectures',
    'Exposure to cloud platforms (AWS, GCP, or Azure)',
    'Knowledge of message queues or streaming systems (Kafka, RabbitMQ)',
    'Understanding of payment processing concepts or financial services',
    'Frontend integration experience (React, TypeScript)',
    'Familiarity with LLM / AI tooling or responsible AI practices',
  ],

  whatToDemo: [
    'A project that solves a real problem — complexity matters less than clarity of thought',
    'Clean, readable code with sensible structure and naming',
    'A README that explains your architecture and design choices',
    'Tests or documentation that help others understand your work',
    'Any trade-offs you made and why',
  ],

  whatWeWillLearn: `The hiring team will review a technical overview prepared from your submitted
  materials. We want to understand how you think about problems, how you structure
  your code, and what you consider important when building software — not just
  whether the application runs.`,
}

export const COMPANY_CAPABILITIES = [
  {
    id: 'online-payments',
    title: 'Online Payments',
    description: 'Payment gateway and checkout experiences for digital commerce platforms.',
    href: 'https://www.pinelabs.com/online-payment-gateway',
    icon: 'Globe',
  },
  {
    id: 'instore-payments',
    title: 'In-store Payments',
    description: 'Smart POS terminals and merchant solutions powering retail acceptance.',
    href: 'https://www.pinelabs.com/pos-payment-system',
    icon: 'CreditCard',
  },
  {
    id: 'prepaid-solutions',
    title: 'Prepaid & Gift Cards',
    description: 'Enterprise prepaid and stored-value card programs at scale.',
    href: 'https://www.pinelabs.com/prepaid-solutions',
    icon: 'Wallet',
  },
  {
    id: 'fintech-infra',
    title: 'Fintech Infrastructure',
    description: 'APIs and financial infrastructure enabling modern fintech applications.',
    href: 'https://www.pinelabs.com',
    icon: 'Server',
  },
  {
    id: 'credit-processing',
    title: 'Credit & EMI',
    description: 'Flexible credit and buy-now-pay-later solutions for merchants and customers.',
    href: 'https://www.pinelabs.com/emi-solutions',
    icon: 'TrendingUp',
  },
]

export const COMPANY_VALUES = [
  {
    id: 'take-the-shot',
    title: 'Take the shot',
    description: 'Decide fast, deliver right. Action and precision power our momentum.',
    engineering: 'Ship with confidence. Know when to move and when to ask.',
  },
  {
    id: 'sign-your-work',
    title: 'Sign your work like an artist',
    description: 'Master your craft and take pride in delivering excellence.',
    engineering: 'Write code you are proud to put your name on.',
  },
  {
    id: 'be-the-sherpa',
    title: 'Be the Sherpa',
    description: 'Lead, guide, and support your crew on every expedition.',
    engineering: 'Lift teammates through reviews, documentation, and mentorship.',
  },
  {
    id: 'be-the-ceo',
    title: 'Be the CEO of what you do',
    description: 'Take ownership. Deliver results. No excuses, just impact.',
    engineering: 'Own a feature end-to-end, from design to production.',
  },
  {
    id: 'own-tomorrow',
    title: 'Own tomorrow',
    description: 'Innovate for the customer, the industry, and the future.',
    engineering: 'Build systems that outlast the sprint, not just the deadline.',
  },
]

export const APPLICATION_STEPS = [
  {
    number: 1,
    title: 'Tell us about yourself',
    description: 'Share your name, contact details, and the role you are applying for.',
  },
  {
    number: 2,
    title: 'Upload your resume',
    description: 'A current PDF or DOCX resume covering your experience and projects.',
  },
  {
    number: 3,
    title: 'Share your project',
    description: 'A ZIP archive of a project you are proud of, with a README explaining your thinking.',
  },
  {
    number: 4,
    title: 'Review and submit',
    description: 'Confirm your details and submit. The hiring team will be in touch.',
  },
]
