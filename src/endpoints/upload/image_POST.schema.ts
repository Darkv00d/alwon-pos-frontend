import { z } from "zod";
import superjson from 'superjson';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const schema = z.object({
  image: z
    .instanceof(File, { message: "Image is required." })
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  imageUrl: string;
};

export const postUploadImage = async (body: FormData, init?: RequestInit): Promise<OutputType> => {
  // We don't use schema.parse here because we are sending FormData directly
  const result = await fetch(`/_api/upload/image`, {
    method: "POST",
    body: body,
    ...init,
    // Do not set Content-Type header for FormData, the browser will do it with the correct boundary
  });

  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(await result.text());
    throw new Error(errorObject.error || "Image upload failed");
  }
  return superjson.parse<OutputType>(await result.text());
};