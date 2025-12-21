import { z } from "zod";
import superjson from 'superjson';
import { type Selectable } from "kysely";
import { type Products, type Suppliers } from "../helpers/schema";

// No input schema needed for a simple GET all request.

export type ProductWithSupplier = Selectable<Products> & {
  supplier: Selectable<Suppliers> | null;
};

export type OutputType = ProductWithSupplier[];

export const getProducts = async (init?: RequestInit): Promise<OutputType> => {
  // Get API URL from env.json
  let API_URL = 'http://localhost:8080/api';
  try {
    const envResponse = await fetch('/env.json');
    const env = await envResponse.json();
    if (env.API_URL) API_URL = env.API_URL;
  } catch (e) {
    console.warn("Could not load env.json, using fallback URL");
  }

  // Get token for authorization
  const token = localStorage.getItem('alwon_auth_token');

  const result = await fetch(`${API_URL}/products`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Authorization": token ? `Bearer ${token}` : "",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    try {
      const errorObject = JSON.parse(await result.text());
      throw new Error(errorObject.error || "Failed to fetch products");
    } catch (e) {
      throw new Error("Failed to fetch products");
    }
  }

  return await result.json();
};