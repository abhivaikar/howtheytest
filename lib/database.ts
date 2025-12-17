import type { Database } from '@/types/database';
import databaseData from '@/public/database.json';

export function getDatabase(): Database {
  return databaseData as Database;
}

export function getCompanies() {
  const db = getDatabase();
  return db.companies;
}

export function getCompanyById(id: string) {
  const companies = getCompanies();
  return companies.find(company => company.id === id);
}

export function getIndustries() {
  const db = getDatabase();
  return db.meta.industries;
}

export function getTopics() {
  const db = getDatabase();
  return db.meta.topics;
}

export function getResourceTypes() {
  const db = getDatabase();
  return Object.keys(db.meta.resourceTypes);
}
