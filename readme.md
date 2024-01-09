![Made with love in Deno](https://madewithlove.now.sh/af?heart=true&text=Deno)

Create a short URL and redirect

## Working on [shioo.deno.dev](https://shioo.deno.dev)

### Example:
redirect to google https://shioo.deno.dev/NzpCPjVUsB

### Configuration
Add to .env file
- API_KEY 
- SENTRY_KEY


## Endpoints
POST `/new`
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


GET `/:id`

302 redirect
or 
404 not found

### Dependencies
- Deno
- Oak
- Zod
- Sentry

---

### TODO
- Add [Zoic](https://deno.land/x/zoic@v1.0.2) (Cache layer)
- Add analytics?