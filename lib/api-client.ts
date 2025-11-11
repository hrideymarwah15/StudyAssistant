// API client utilities for making requests to our backend
export async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "API call failed")
  }

  return response.json()
}

export async function uploadFile(file: File, userId: string): Promise<{ materialId: string; fileUrl: string }> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("userId", userId)

  const response = await fetch("/api/materials/upload", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error("Upload failed")
  }

  return response.json()
}
