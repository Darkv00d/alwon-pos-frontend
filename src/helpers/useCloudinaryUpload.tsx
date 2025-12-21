import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { postUploadsCloudinarySign } from "../endpoints/uploads/cloudinary/sign_POST.schema";

type CloudinaryUploadParams = {
  file: File;
  folder?: string;
  publicId?: string;
};

type CloudinaryUploadResponse = {
  asset_id: string;
  public_id: string;
  version: number;
  version_id: string;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  folder: string;
  original_filename: string;
};

type UseCloudinaryUploadOptions = {
  onProgress?: (progress: number) => void;
} & Omit<
  UseMutationOptions<
    CloudinaryUploadResponse,
    Error,
    CloudinaryUploadParams
  >,
  "mutationFn"
>;

/**
 * A React hook to upload files directly to Cloudinary.
 * It handles signature generation, client-side upload, progress tracking, and state management.
 *
 * @param options - React Query mutation options plus an `onProgress` callback.
 * @returns A React Query mutation object for the upload process.
 */
export const useCloudinaryUpload = (options?: UseCloudinaryUploadOptions) => {
  const { onProgress, ...mutationOptions } = options || {};

  const uploadMutation = useMutation<
    CloudinaryUploadResponse,
    Error,
    CloudinaryUploadParams
  >({
    mutationFn: async ({ file, folder, publicId }) => {
      // 1. Get signature from our backend
      const signatureData = await postUploadsCloudinarySign({ folder, publicId });
      const { apiKey, cloudName, signature, timestamp } = signatureData;

      // 2. Prepare form data for Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      if (folder) {
        formData.append("folder", folder);
      }
      if (publicId) {
        formData.append("public_id", publicId);
      }

      // 3. Upload directly to Cloudinary using XMLHttpRequest for progress tracking
      return new Promise<CloudinaryUploadResponse>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(
          "POST",
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
        );

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = Math.round((event.loaded * 100) / event.total);
            onProgress(progress);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(
                xhr.responseText
              ) as CloudinaryUploadResponse;
              resolve(response);
            } catch (e) {
              reject(new Error("Failed to parse Cloudinary response."));
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(
                new Error(
                  errorResponse?.error?.message ||
                    `Cloudinary upload failed with status ${xhr.status}`
                )
              );
            } catch {
              reject(
                new Error(`Cloudinary upload failed with status ${xhr.status}`)
              );
            }
          }
        };

        xhr.onerror = () => {
          reject(new Error("Network error during file upload."));
        };

        xhr.send(formData);
      });
    },
    ...mutationOptions,
  });

  return uploadMutation;
};