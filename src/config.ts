import 'https://deno.land/std@0.177.0/dotenv/load.ts'

const packageJson = JSON.parse(
  new TextDecoder().decode(await Deno.readFile('./package.json')),
)

export const __DEV__ = Deno.env.get('NODE_ENV') !== 'production' ?? false as boolean

export const BASE_URL = Deno.env.get('BASE_URL')

export const API_KEY = Deno.env.get('API_KEY')
export const API_PORT = Deno.env.get('API_PORT') ?? 8000
export const SENTRY_KEY = Deno.env.get('SENTRY_KEY')

export const APP_NAME = packageJson.name as string
export const APP_VERSION = packageJson.version as string
