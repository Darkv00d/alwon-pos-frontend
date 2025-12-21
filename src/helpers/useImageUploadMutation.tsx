import { useMutation } from "@tanstack/react-query";
import { postUploadImage } from "../endpoints/upload/image_POST.schema";
import { toast } from "sonner";

export const useImageUploadMutation = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      return postUploadImage(formData);
    },
    onSuccess: () => {
      toast.success("Image uploaded successfully!");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Upload failed: ${message}`);
      console.error("Image upload error:", error);
    },
  });
};