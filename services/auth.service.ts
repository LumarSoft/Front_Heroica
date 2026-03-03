import { API_ENDPOINTS } from "@/lib/config";

interface LoginResponse {
  data: {
    token: string;
    user: {
      id: number;
      email: string;
      nombre: string;
      rol: string;
    };
  };
  message?: string;
}

export async function loginRequest(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Error al iniciar sesión");
  }

  return data;
}
