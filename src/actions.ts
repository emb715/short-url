/// <reference lib="deno.unstable" />
import ShortUniqueId from 'short-uuid'
import { __DEV__ } from "./config.ts";

const kv = await Deno.openKv()

const KV_KEY = 'url'

function generateId({
  type = 'random'
}: {type?: string} = {}) {
  //@ts-ignore
  const uid = new ShortUniqueId({ length: 10 });
  if (type === 'random') {
    return uid.rnd() as string
  } else {
    // timestamp
    return  uid.stamp(10) as string
  }

}

export type CreatedUrl = {
  url: string
  createdAt: string
}

export async function createUrl(url: string) {
  const id = generateId()
  const payload = {
    url,
    createdAt: Date.now()
  }
  await kv.set([KV_KEY, id], payload)

  return id
}

export async function getUrl(id: string) {
  if (!id) {
    throw new Error("getUrl. No ID given");
  }
  return await kv.get([KV_KEY, id])
}