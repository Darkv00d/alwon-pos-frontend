import { z } from "zod";
import superjson from 'superjson';

export const schema = z.object({
  folder: z.string().optional(),
  publicId: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  ok: true;
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder?: string;
};

export type ErrorType = {
  ok: false;
  error: string;
};

export const postUploadsCloudinarySign = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/uploads/cloudinary/sign`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const responseData = superjson.parse<OutputType | ErrorType>(await result.text());

  if (!result.ok || !responseData.ok) {
    const errorObject = responseData as ErrorType;
    throw new Error(errorObject.error);
  }

  return responseData as OutputType;
};