
# Create short URL and redirect

Add apiKey to .env file

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

## Dependencies
- Deno
- Oak
- Zod
- Sentry

## TODO
- Add analytics?