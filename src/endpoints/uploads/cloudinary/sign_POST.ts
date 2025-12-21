import crypto from 'crypto';
import superjson from 'superjson';
import { getServerUserSession } from '../../../helpers/getServerUserSession';
import { schema, OutputType } from './sign_POST.schema';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const defaultFolder = (process.env as any)['CLOUDINARY_FOLDER'] || 'Alwon/products';

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error('Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) must be set.');
}

export async function handle(request: Request) {
  try {
    await getServerUserSession(request);

    const json = superjson.parse(await request.text());
    const { folder, publicId } = schema.parse(json);

    const timestamp = Math.round(new Date().getTime() / 1000);

    const paramsToSign: Record<string, string | number> = {
      timestamp,
    };

    // Use provided folder or default from environment variable
    const finalFolder = folder || defaultFolder;
    if (finalFolder) {
      paramsToSign.folder = finalFolder;
    }
    if (publicId) {
      paramsToSign.public_id = publicId;
    }

    // Sort parameters alphabetically and create string to sign
    const sortedParams = Object.keys(paramsToSign)
      .sort()
      .map(key => `${key}=${paramsToSign[key]}`)
      .join('&');

    const stringToSign = `${sortedParams}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    const responsePayload: OutputType = {
      ok: true,
      timestamp,
      signature,
      apiKey,
      cloudName,
      folder: finalFolder,
    };

    return new Response(superjson.stringify(responsePayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating Cloudinary signature:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    const errorResponse = {
      ok: false,
      error: errorMessage,
    };
    
    const status = error instanceof Error && error.name === 'NotAuthenticatedError' ? 401 : 400;
    return new Response(superjson.stringify(errorResponse), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}