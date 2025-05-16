import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedFileTypes?: string[];
  onFilesChange: (files: File[]) => void;
}

export default function FileUpload({
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedFileTypes = ["image/jpeg", "image/png", "image/gif"],
  onFilesChange,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    processFiles(Array.from(selectedFiles));
    
    // Reset the input so the same file can be selected again if removed
    event.target.value = "";
  };
  
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = event.dataTransfer.files;
    if (!droppedFiles || droppedFiles.length === 0) return;
    
    processFiles(Array.from(droppedFiles));
  };
  
  const processFiles = (newFiles: File[]) => {
    const validFiles: File[] = [];
    
    for (const file of newFiles) {
      // Check if we've reached the maximum number of files
      if (files.length + validFiles.length >= maxFiles) {
        toast({
          title: "Maximum files reached",
          description: `You can only upload a maximum of ${maxFiles} files.`,
          variant: "destructive",
        });
        break;
      }
      
      // Check file type
      if (acceptedFileTypes.length > 0 && !acceptedFileTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `File "${file.name}" is not an accepted file type.`,
          variant: "destructive",
        });
        continue;
      }
      
      // Check file size
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `File "${file.name}" exceeds the maximum size limit of ${Math.round(maxSize / 1024 / 1024)}MB.`,
          variant: "destructive",
        });
        continue;
      }
      
      validFiles.push(file);
    }
    
    if (validFiles.length === 0) return;
    
    const updatedFiles = [...files, ...validFiles];
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };
  
  const removeFile = (index: number) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };
  
  return (
    <div className="w-full space-y-4">
      <div
        className={`border-2 border-dashed rounded-md p-6 text-center ${
          isDragging ? "border-primary-500 bg-primary-50" : "border-gray-300"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept={acceptedFileTypes.join(",")}
          className="hidden"
        />
        <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-2">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-primary-600 hover:text-primary-500">
              Click to upload
            </span>
            {" or drag and drop"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {acceptedFileTypes.map(type => type.split("/")[1].toUpperCase()).join(", ")} 
            {" up to "}
            {Math.round(maxSize / 1024 / 1024)}MB
          </p>
        </div>
      </div>
      
      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file, index) => (
            <div key={index} className="relative group">
              <div className="border rounded-md overflow-hidden h-24">
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  {file.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-500 truncate px-2">{file.name}</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="absolute -top-2 -right-2 bg-white rounded-full border border-gray-300 p-0.5 text-gray-500 hover:text-red-500 hover:border-red-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
