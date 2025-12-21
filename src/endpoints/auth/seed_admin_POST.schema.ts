export type InputType = {
  email: string;
  password: string;
  fullName?: string;
};

export type OutputType = { success: true } | { error: string };

export const postSeedAdmin = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/auth/seed_admin`, {
    method: "POST",
    body: JSON.stringify(body),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const responseText = await result.text();
  const json = JSON.parse(responseText) as OutputType;

  if (!result.ok) {
    if ('error' in json) {
      throw new Error(json.error);
    }
    throw new Error("An unexpected error occurred");
  }
  
  return json;
};