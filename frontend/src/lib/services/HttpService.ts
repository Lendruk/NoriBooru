import type { Vault } from "$lib/types/Vault";

export class HttpService {
  private static currentVault: Vault | null = null;
  public static BASE_URL = `http://localhost:8080`;

  public static getVaultId(): string | undefined {
    if (this.currentVault) {
      return this.currentVault.id;
    } else {
      const storageVault = localStorage.getItem("currentVault");

      if (storageVault) {
        this.currentVault = JSON.parse(storageVault);
        return this.currentVault?.id;
      }
    }
  };

  public static async get<T>(url: string): Promise<T> {
    const response = await fetch(`${HttpService.BASE_URL}${url}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "vault": this.getVaultId() || "",
      },
    });

    if (response.status >= 400) {
      throw new Error(`Error during request status: ${response.status}`);
    }

    return response.json() as Promise<T>;
  };

  public static async post<T>(url: string, body: Record<string, unknown>): Promise<T> {
    const response = await fetch(`${HttpService.BASE_URL}${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "vault": this.getVaultId() || "",
      },
      body: JSON.stringify(body),
    });

    if (response.status >= 400) {
      throw new Error(`Error during request status: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  public static async put<T>(url: string, body: Record<string, unknown>): Promise<T> {
    const response = await fetch(`${HttpService.BASE_URL}${url}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "vault": this.getVaultId() || "",
      },
      body: JSON.stringify(body),
    });

    if (response.status >= 400) {
      throw new Error(`Error during request status: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  public static async delete<T>(url: string, body?: Record<string, unknown>): Promise<T> {
    const response = await fetch(`${HttpService.BASE_URL}${url}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "vault": this.getVaultId() || "",
      },
      body: JSON.stringify(body),
    });

    if (response.status >= 400) {
      throw new Error(`Error during request status: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  public static async patch<T>(url: string, body: Record<string, unknown>): Promise<T> {
    const response = await fetch(`${HttpService.BASE_URL}${url}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "vault": this.getVaultId() || "",
      },
      body: JSON.stringify(body),
    });

    if (response.status >= 400) {
      throw new Error(`Error during request status: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }
}