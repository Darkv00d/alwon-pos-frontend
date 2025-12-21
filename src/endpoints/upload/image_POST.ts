import { schema, OutputType } from "./image_POST.schema";
import superjson from 'superjson';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error("Cloudinary environment variables are not set.");
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

// Helper to upload buffer to Cloudinary
const uploadToCloudinary = (buffer: Buffer): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'image' },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result);
        } else {
          reject(new Error("Cloudinary upload failed without an error object."));
        }
      }
    );
    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

export async function handle(request: Request) {
  try {
    if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
      return new Response(superjson.stringify({ error: "Invalid content type, expected multipart/form-data" }), { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('image');

    const validationResult = schema.safeParse({ image: file });

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors.map(e => e.message).join(', ');
      return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
    }

    const imageFile = validationResult.data.image;
    const buffer = Buffer.from(await imageFile.arrayBuffer());

    const uploadResult = await uploadToCloudinary(buffer);

    if (!uploadResult.secure_url) {
      console.error("Cloudinary upload failed:", uploadResult);
      return new Response(superjson.stringify({ error: "Image upload failed after processing." }), { status: 500 });
    }

    return new Response(superjson.stringify({ imageUrl: uploadResult.secure_url } satisfies OutputType));
  } catch (error) {
    console.error("Error handling image upload:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred during image upload.";
    return new Response(superjson.stringify({ error: message }), { status: 500 });
  }
}