import { Context, helpers as routerHelpers, RouterContext, Status } from "oak";
import * as z from "zod";
import * as Sentry from "sentry";
import {
  __DEV__,
  API_KEY,
  APP_NAME,
  APP_VERSION,
  SENTRY_KEY,
} from "./config.ts";
// import { routerHelpers, z } from "../deps.ts";
// import { CustomError, ErrorStatusList, ErrorTypes } from "./handle_error.ts";
// import type { RouterContext } from "../deps.ts";

type ResponseParams = {
  status: number;
  headers?: Headers;
  body?: string | object;
};

export function handleResponse(ctx: Context, params: ResponseParams): void {
  ctx.response.status = params.status;
  ctx.response.body = params.body;
  return;
}

const SuccessStatus = {
  OK: Status.OK,
  Created: Status.Created,
  NoContent: Status.NoContent,
} as const;

type SuccessResponseParams = {
  status: keyof typeof SuccessStatus;
  data: ResponseParams["body"];
};
export function handleSuccess(
  ctx: RouterContext<string>,
  success: SuccessResponseParams,
) {
  handleResponse(ctx, {
    status: SuccessStatus[success.status],
    body: success.data,
  });
}

export const AuthMiddleware = () => {
  return async (ctx: Context, next: () => Promise<unknown>) => {
    try {
      const authHeader = ctx.request.headers.get("apiKey")?.trim() ?? null;
      console.log("LOG: > AuthMiddleware > authHeader:", authHeader);
      if (!authHeader) {
        throw new ServerError("MISSING API KEY");
      }
      if (authHeader !== API_KEY) {
        throw new ServerError("INVALID API KEY");
      }
      await next();
    } catch (err) {
      console.log("LOG: > AuthMiddleware > err:", err);
      handleError(err as Error, ctx);
    }
  };
};

Sentry.init({
  dsn: SENTRY_KEY,
  onFatalError: (error) => {
    console.log("LOG: > onFatalError:", error);
  },
  environment: __DEV__ ? "development" : "production",
  debug: __DEV__,

  release: `${APP_NAME}@${APP_VERSION}`,
});

class ErrorLogger {
  constructor() {}

  // TODO: Implement this
  configureScope(options: any) {
    console.log("NOT IMPLEMENTED: ErrorLogger.configureScope");
    // Sentry.configureScope((scope: Sentry.Scope) => {
    // scope.setExtra('battery', 0.7);
    // scope.setTag('user_mode', 'admin');
    // scope.setUser({ id: '4711' });
    // scope.clear();
    // });
  }

  captureException(e: Error) {
    Sentry.captureException(e);
  }
  captureEvent(event: Sentry.Event) {
    Sentry.captureEvent(event);
  }
  captureMessage(message: string) {
    Sentry.captureMessage(message);
  }
}
export const errorLogger = new ErrorLogger();

enum ErrorTypes {
  ZodError = "zodError",
  HttpError = "httpError",
  ServerError = "serverError",
}

class CustomError extends Error {
  _type: ErrorTypes;
  override message: string;
  override cause?: string;
  status?: ErrorStatusList;
  constructor(
    message: string,
    options: { type: ErrorTypes; cause?: string; status?: ErrorStatusList },
  ) {
    super(message);
    this._type = options.type;
    this.message = message;
    options?.cause && (this.cause = options.cause);
    options?.status && (this.status = options.status);
  }
}

class ServerError extends CustomError {
  constructor(message: string, options?: { cause?: string }) {
    super(message, {
      ...options,
      type: ErrorTypes.ServerError,
    });
  }
}

enum ErrorStatusList {
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  Conflict = 409,
  InternalServerError = 500,
  NotImplemented = 501,
  ServiceUnavailable = 503,
}

const handleError = (error: CustomError | Error, ctx: Context) => {
  try {
    if (error instanceof z.ZodError) {
      handleResponse(ctx, {
        status: ErrorStatusList.BadRequest,
        body: {
          error: error?.issues,
          ...(__DEV__ && { ["__DEV__"]: error }),
        },
      });
    } else if (error instanceof ServerError) {
      throw error;
    } else if (
      error instanceof CustomError &&
      error._type === ErrorTypes.HttpError
    ) {
      handleResponse(ctx, {
        status: error?.status || ErrorStatusList.BadRequest,
        body: {
          error: error.message,
          ...(__DEV__ && { ["__DEV__"]: error }),
        },
      });
    } else if (error instanceof Error) {
      handleResponse(ctx, {
        status: ErrorStatusList.NotFound,
        body: {
          error: error.message,
          ...(__DEV__ && { ["__DEV__"]: error }),
        },
      });
    }
  } catch (err) {
    // @ts-expect-error message
    const message = err?.message || "";
    handleResponse(ctx, {
      status: ErrorStatusList.InternalServerError,
      body: {
        message,
        ...(__DEV__ && { ["__DEV__"]: error }),
      },
    });
    // Error Log Service
    errorLogger.captureException(error);
  }
};

export { CustomError, ErrorStatusList, ErrorTypes, handleError, ServerError };

export async function schemaParser<T extends z.AnyZodObject>(
  schema: T,
  ctx: RouterContext<string>,
): Promise<z.infer<T>> {
  if (ctx.request.hasBody) {
    const body = ctx.request.body();
    if (body.type !== "json") {
      throw new CustomError("Invalid Body Type. Expected JSON", {
        type: ErrorTypes.HttpError,
        status: ErrorStatusList.BadRequest,
        cause: `Expected JSON, got ${body.type}`,
      });
    }
  }

  const params = ctx.params,
    query = routerHelpers.getQuery(ctx),
    body = await ctx.request.body()?.value;
  return schema.parse({
    params,
    query,
    body,
  });
}
