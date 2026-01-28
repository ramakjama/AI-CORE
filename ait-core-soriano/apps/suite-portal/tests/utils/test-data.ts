import { faker } from '@faker-js/faker';

/**
 * Generate random user data
 */
export function generateUser() {
  return {
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    password: faker.internet.password({ length: 12 }),
    phone: faker.phone.number(),
    company: faker.company.name(),
    role: faker.helpers.arrayElement(['admin', 'user', 'guest']),
    avatar: faker.image.avatar(),
  };
}

/**
 * Generate random document data
 */
export function generateDocument() {
  return {
    title: faker.lorem.sentence({ min: 3, max: 8 }),
    content: faker.lorem.paragraphs(5),
    description: faker.lorem.sentence(),
    tags: faker.helpers.arrayElements(['work', 'personal', 'urgent', 'draft', 'important'], 3),
    category: faker.helpers.arrayElement(['report', 'proposal', 'memo', 'notes']),
    author: faker.person.fullName(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
  };
}

/**
 * Generate random task data
 */
export function generateTask() {
  return {
    title: faker.lorem.sentence({ min: 3, max: 6 }),
    description: faker.lorem.paragraph(),
    status: faker.helpers.arrayElement(['todo', 'in-progress', 'done', 'blocked']),
    priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'urgent']),
    assignee: faker.person.fullName(),
    dueDate: faker.date.future(),
    tags: faker.helpers.arrayElements(['bug', 'feature', 'enhancement', 'documentation'], 2),
    estimatedHours: faker.number.int({ min: 1, max: 40 }),
  };
}

/**
 * Generate random event data
 */
export function generateEvent() {
  const start = faker.date.future();
  const end = new Date(start.getTime() + faker.number.int({ min: 30, max: 240 }) * 60000);

  return {
    title: faker.lorem.sentence({ min: 2, max: 5 }),
    description: faker.lorem.paragraph(),
    start: start.toISOString(),
    end: end.toISOString(),
    location: faker.location.streetAddress(),
    attendees: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
      name: faker.person.fullName(),
      email: faker.internet.email(),
    })),
    isAllDay: faker.datatype.boolean(),
    color: faker.color.rgb(),
  };
}

/**
 * Generate random notification data
 */
export function generateNotification() {
  return {
    title: faker.lorem.sentence({ min: 3, max: 6 }),
    message: faker.lorem.sentence(),
    type: faker.helpers.arrayElement(['info', 'success', 'warning', 'error']),
    timestamp: faker.date.recent(),
    read: faker.datatype.boolean(),
    action: faker.helpers.maybe(() => ({
      label: faker.lorem.word(),
      url: faker.internet.url(),
    })),
  };
}

/**
 * Generate random spreadsheet data
 */
export function generateSpreadsheetData(rows: number = 10, cols: number = 5) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => {
      const type = faker.helpers.arrayElement(['number', 'text', 'date', 'currency']);
      switch (type) {
        case 'number':
          return faker.number.int({ min: 0, max: 1000 });
        case 'date':
          return faker.date.recent().toLocaleDateString();
        case 'currency':
          return faker.finance.amount();
        default:
          return faker.lorem.word();
      }
    })
  );
}

/**
 * Generate random email data
 */
export function generateEmail() {
  return {
    from: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
    },
    to: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => ({
      name: faker.person.fullName(),
      email: faker.internet.email(),
    })),
    subject: faker.lorem.sentence({ min: 4, max: 10 }),
    body: faker.lorem.paragraphs(3),
    timestamp: faker.date.recent(),
    read: faker.datatype.boolean(),
    starred: faker.datatype.boolean(),
    attachments: faker.helpers.maybe(() =>
      Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => ({
        name: faker.system.fileName(),
        size: faker.number.int({ min: 1024, max: 1048576 }),
        type: faker.system.mimeType(),
      }))
    ),
  };
}

/**
 * Generate random note data
 */
export function generateNote() {
  return {
    title: faker.lorem.sentence({ min: 2, max: 6 }),
    content: faker.lorem.paragraphs(3),
    color: faker.color.rgb(),
    pinned: faker.datatype.boolean(),
    tags: faker.helpers.arrayElements(['personal', 'work', 'ideas', 'todo', 'important'], 2),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
  };
}

/**
 * Generate random file data
 */
export function generateFile() {
  const fileName = faker.system.fileName();
  const extension = fileName.split('.').pop() || 'txt';

  return {
    name: fileName,
    size: faker.number.int({ min: 1024, max: 10485760 }),
    type: faker.system.mimeType(),
    extension,
    url: faker.internet.url(),
    thumbnail: faker.helpers.maybe(() => faker.image.url()),
    uploadedAt: faker.date.recent(),
    uploadedBy: faker.person.fullName(),
    folder: faker.helpers.arrayElement(['Documents', 'Images', 'Videos', 'Downloads']),
  };
}

/**
 * Generate random presentation data
 */
export function generatePresentation() {
  return {
    title: faker.lorem.sentence({ min: 3, max: 8 }),
    description: faker.lorem.paragraph(),
    theme: faker.helpers.arrayElement(['default', 'dark', 'minimal', 'corporate']),
    slides: Array.from({ length: faker.number.int({ min: 5, max: 20 }) }, (_, index) => ({
      id: index + 1,
      title: faker.lorem.sentence({ min: 2, max: 5 }),
      content: faker.lorem.paragraph(),
      layout: faker.helpers.arrayElement(['title', 'content', 'two-column', 'image']),
    })),
    author: faker.person.fullName(),
    createdAt: faker.date.past(),
  };
}

/**
 * Generate random CRM contact data
 */
export function generateContact() {
  return {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    company: faker.company.name(),
    position: faker.person.jobTitle(),
    status: faker.helpers.arrayElement(['lead', 'prospect', 'customer', 'partner']),
    source: faker.helpers.arrayElement(['website', 'referral', 'social', 'event']),
    tags: faker.helpers.arrayElements(['vip', 'hot-lead', 'cold', 'nurture'], 2),
    notes: faker.lorem.paragraph(),
    lastContact: faker.date.recent(),
    value: faker.number.int({ min: 1000, max: 100000 }),
  };
}

/**
 * Generate random analytics data
 */
export function generateAnalyticsData(days: number = 30) {
  return Array.from({ length: days }, (_, index) => ({
    date: faker.date.recent({ days: days - index }),
    pageViews: faker.number.int({ min: 100, max: 10000 }),
    uniqueVisitors: faker.number.int({ min: 50, max: 5000 }),
    bounceRate: faker.number.float({ min: 0, max: 100, precision: 0.01 }),
    avgSessionDuration: faker.number.int({ min: 60, max: 600 }),
    conversions: faker.number.int({ min: 0, max: 100 }),
  }));
}

/**
 * Generate multiple items
 */
export function generateMultiple<T>(generator: () => T, count: number): T[] {
  return Array.from({ length: count }, generator);
}

/**
 * Wait helper
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate random color
 */
export function generateColor() {
  return faker.color.rgb();
}

/**
 * Generate random date range
 */
export function generateDateRange() {
  const start = faker.date.past();
  const end = faker.date.between({ from: start, to: new Date() });

  return { start, end };
}
