![Made with love in Deno](https://madewithlove.now.sh/af?heart=true&text=Deno)

# Url Shortener

Create a short URL and redirect.

Using Oak a middleware framework for Deno’s native HTTP server and Deno KV as
database with a fallback to sql lite for local development

## Working on [shioo.deno.dev](https://shioo.deno.dev)

### Example:

redirect to google https://shioo.deno.dev/NzpCPjVUsB

### Configuration

Add to .env file

- API_KEY
- SENTRY_KEY

## Endpoints

POST `/new`

> create new url

```
headers: {
  apiKey: 'mySecretKey'
}
body: {
  "url": "https://google.com"
}
```

**Response**

```
{
    "id": "2A8Pb0CVuI",
    "url": "https://localhost:8000/2A8Pb0CVuI"
}
```

PUT `/:id`

> edit url with id

```
headers: {
  apiKey: 'mySecretKey'
}
body: {
  "url": "https://youtube.com"
}
```

**Response**

```
{
    "id": "2A8Pb0CVuI",
    "url": "https://localhost:8000/2A8Pb0CVuI"
}
```

GET `/:id`

> use url redirection

302 redirect or 404 not found

<!-- GET `/m/:id` Mask content. return the content of the url 200 or 404 -->

### Dependencies

- Deno, Deno KV, Oak,
- Zod
- Sentry

---

### TODO

- Add [Zoic](https://deno.land/x/zoic@v1.0.2) (Cache layer)
- Add analytics?
- Add Dashboard
- Add accounts creation, credentials generation, custom domain
