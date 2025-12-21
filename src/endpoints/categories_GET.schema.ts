import { z } from 'zod';

// No input schema needed for a public GET request
export const schema = z.object({});

type PublicSubcategory = {
  id: number;
  name: string;
};

export type PublicCategory = {
  id: number;
  name: string;
  subs?: PublicSubcategory[];
};

export type OutputType = {
  ok: true;
  categories: PublicCategory[];
};

export const getCategories = async (init?: RequestInit): Promise<OutputType> => {
  // Get API URL from env.json
  const envResponse = await fetch('/env.json');
  const env = await envResponse.json();
  const API_URL = env.API_URL || 'http://localhost:8080/api';

  // Get token for authentication
  const token = localStorage.getItem('alwon_auth_token');

  const result = await fetch(`${API_URL}/categories`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorData = await result.json();
    throw new Error(errorData.error || errorData.message || 'Failed to fetch categories');
  }

  // Transform Java backend response to match expected format
  const categories = await result.json();
  return {
    ok: true,
    categories: categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      subs: [] // Java backend doesn't have subcategories yet
    }))
  };
};