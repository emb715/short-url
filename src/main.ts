import * as log from "log";
import { Application, Router } from "oak";
import type { RouterContext } from "oak";
import { oakCors } from "oakCors";
import * as z from "zod";
import {
  AuthMiddleware,
  errorLogger,
  handleError,
  handleSuccess,
  schemaParser,
} from "./utils.ts";
import { __DEV__, API_PORT, BASE_URL } from "./config.ts";
import { CreatedUrl, createUrl, getUrl, setUrl } from "./actions.ts";

const SHORT_URL = __DEV__ ? `https://localhost:${API_PORT}` : BASE_URL;

const app = new Application();
const ApiRouter = new Router();

// CORS
app.use(oakCors());
// Logger
app.use(async (ctx, next) => {
  await next();
  const rt = ctx.response.headers.get("X-Response-Time");
  console.log(`${ctx.request.method} ${ctx.request.url} - ${rt}`);
});
// Timing
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.response.headers.set("X-Response-Time", `${ms}ms`);
});
// Error
app.addEventListener("error", (evt) => {
  // Will log the thrown error to the console.
  log.error(evt);
  errorLogger.captureException(evt.error);
});

ApiRouter.get<string>(`/`, (ctx: RouterContext<string>) => {
  ctx.response.body = "Alive :)";
});

const GetSchema = z.object({
  params: z.object({
    id: z.string({
      required_error: "ID is required",
    }),
  }),
});

ApiRouter.get<string>(`/:id`, async (ctx: RouterContext<string>) => {
  const {
    params: { id },
  } = await schemaParser(GetSchema, ctx);

  // try to retrieve an url
  const data = await getUrl(id);

  const values = data.value as CreatedUrl;
  if (data.value === null) {
    handleError(new Error("Not found"), ctx);
    return;
  }

  const redirectUrl = values.url;
  if (redirectUrl) {
    try {
      const checkUrl = new URL(values.url);
      __DEV__ && log.info("GetUrl.check", checkUrl);
    } catch (error) {
      handleError(error as Error, ctx);
      return;
    }
  }
  ctx.response.body = {
    status: "success",
    message: `redirecting to ${redirectUrl}`,
  };

  ctx.response.redirect(redirectUrl);
  return;
});

const CreateSchema = z.object({
  body: z.object({
    url: z
      .string({
        required_error: "Url is required",
      })
      .url(),
  }),
});

ApiRouter.use(AuthMiddleware());
ApiRouter.post<string>(`/new`, async (ctx: RouterContext<string>) => {
  try {
    const { body: payload } = await schemaParser(CreateSchema, ctx);

    const createdId = await createUrl(payload.url);
    const shortUrl = `${SHORT_URL}/${createdId}`;

    const response = {
      id: createdId,
      url: shortUrl,
    };

    handleSuccess(ctx, {
      status: "OK",
      data: response,
    });
  } catch (error) {
    handleError(error as Error, ctx);
  }
});

const UpdateSchema = z.object({
  body: z.object({
    url: z
      .string({
        required_error: "Url is required",
      })
      .url(),
  }),
  params: z.object({
    id: z.string({
      required_error: "ID is required",
    }),
  }),
});
ApiRouter.use(AuthMiddleware());
ApiRouter.put<string>(`/:id`, async (ctx: RouterContext<string>) => {
  try {
    const {
      body: payload,
      params: { id },
    } = await schemaParser(UpdateSchema, ctx);

    const updatedId = await setUrl({
      id,
      url: payload.url,
    });
    const shortUrl = `${SHORT_URL}/${updatedId}`;

    const response = {
      id: updatedId,
      url: shortUrl,
    };

    handleSuccess(ctx, {
      status: "OK",
      data: response,
    });
  } catch (error) {
    handleError(error as Error, ctx);
  }
});

// TODO: mask url, return the content of the id in the response it maybe be an iframe or something if cors or something is bothering
// ApiRouter.post<string>(`/m/:id`, async (ctx: RouterContext<string>)  => {
//   try {
//   const {
//     params: {
//       id,
//     },
//   } = await schemaParser(GetSchema, ctx)

//   // try to retrieve an url
//   const data = await getUrl(id)

//   const values = data.value as CreatedUrl
//   if (data.value === null) {
//     handleError(new Error('Not found'), ctx)
//     return
//   }

//   const maskUrl = values.url
//   const response = await fetch(maskUrl)
//   handleSuccess(ctx, {
//     status: 'OK',
//     data: response.text(),
//   })
// } catch (error) {
//   handleError(error as Error, ctx)
// }
// })
app.use(ApiRouter.routes());
app.use(ApiRouter.allowedMethods());

log.info(`Server running on port ${API_PORT}`);
await app.listen({ port: Number(API_PORT) });
