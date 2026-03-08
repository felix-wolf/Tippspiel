type status = {
  status: string;
};

type NetworkError = {
  status: number;
  text: string;
  data?: unknown;
  cause?: unknown;
};

export class NetworkHelper {
  public static getStatus(): Promise<status> {
    const builder = (object: any): status => {
      return { status: object["Time"] };
    };
    return this.executeFetch("/api/status", builder);
  }

  public static fetchOne<Type>(
    url: string,
    builder: (object: any) => Type,
  ): Promise<Type> {
    return this.executeFetch(url, builder);
  }

  public static fetchAll<Type>(
    url: string,
    builder: (object: any) => Type,
  ): Promise<Type> {
    return this.executeFetch(url, builder);
  }

  public static post<Type>(
    url: string,
    builder: (object: any) => Type,
    body: unknown,
  ): Promise<Type> {
    const b: RequestInit = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    };
    return this.executeFetch(url, builder, b);
  }

  public static update<Type>(
    url: string,
    builder: (object: any) => Type,
    body: unknown,
  ): Promise<Type> {
    const b: RequestInit = {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    };
    return this.executeFetch(url, builder, b);
  }

  public static delete<Type>(
    url: string,
    builder: (object: any) => Type,
    body: unknown,
  ): Promise<Type> {
    const b: RequestInit = {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    };
    return this.executeFetch(url, builder, b);
  }

  public static execute<Type>(
    url: string,
    builder: (object: any) => Type,
  ): Promise<Type> {
    return this.executeFetch(url, builder);
  }

  private static executeFetch<Type>(
    url: string,
    builder: (object: any) => Type,
    init?: RequestInit,
  ): Promise<Type> {
    return fetch(url, init)
      .then(async (res) => {
        const rawText = await res.text();
        const parsedBody = this.tryParseJson(rawText);

        if (res.ok) {
          if (rawText.trim() === "") {
            return builder(undefined);
          }
          if (parsedBody !== undefined) {
            return builder(parsedBody);
          }
          throw this.createError(
            res.status,
            "Die Serverantwort enthält kein gültiges JSON.",
            rawText,
          );
        }

        throw this.createError(
          res.status,
          this.extractErrorText(parsedBody, rawText, res.statusText),
          parsedBody,
        );
      })
      .catch((error: NetworkError | Error) => {
        if (this.isNetworkError(error)) {
          throw error;
        }
        throw this.createError(0, "Die Anfrage an den Server ist fehlgeschlagen.", undefined, error);
      });
  }

  private static tryParseJson(rawText: string): unknown | undefined {
    if (rawText.trim() === "") {
      return undefined;
    }
    try {
      return JSON.parse(rawText);
    } catch {
      return undefined;
    }
  }

  private static extractErrorText(
    parsedBody: unknown,
    rawText: string,
    fallback: string,
  ): string {
    if (parsedBody && typeof parsedBody === "object") {
      const errorMessage = (parsedBody as Record<string, unknown>).error;
      const message = (parsedBody as Record<string, unknown>).message;
      if (typeof errorMessage === "string") {
        return errorMessage;
      }
      if (typeof message === "string") {
        return message;
      }
    }
    if (rawText.trim() !== "") {
      return rawText;
    }
    return fallback || "Die Anfrage konnte nicht verarbeitet werden.";
  }

  private static createError(
    status: number,
    text: string,
    data?: unknown,
    cause?: unknown,
  ): NetworkError {
    return { status, text, data, cause };
  }

  private static isNetworkError(error: unknown): error is NetworkError {
    return !!error && typeof error === "object" && "status" in error && "text" in error;
  }
}
