import { FreshContext } from "$fresh/server.ts";
import { decode } from "cbor";
import { encodeBase64Url } from "$std/encoding/base64url.ts";

export interface TPV {
  time: string | null;
  lat: number | null;
  lon: number | null;
  [moar: string]: unknown;
}

const kv = await Deno.openKv();

export const handler = async (
  req: Request,
  _ctx: FreshContext,
): Promise<Response> => {
  let msg: unknown;
  try {
    msg = decode(await req.arrayBuffer());
  } catch (_) {
    return new Response("bad req", { status: 400 });
  }
  if (
    !msg || typeof msg !== "object" || !Object.hasOwn(msg, "tok") ||
    typeof (msg as { tok: unknown }).tok !== "string"
  ) return new Response("bad req", { status: 400 });
  const [piid, mac] = (msg as { tok: string }).tok.split(".");
  const sec = await kv.get<string>(["pis", piid, "sec"]);
  if (!sec.value) return new Response("unauthn", { status: 401 });
  const expectedMac = encodeBase64Url(
    await crypto.subtle.digest(
      "SHA256",
      new TextEncoder().encode(`${piid}\0${sec.value}`),
    ),
  );
  if (mac !== expectedMac) return new Response("unauthn", { status: 401 });

  const tx = kv.atomic();
  for (
    const [id, tpv] of Object.entries(
      (msg as { tpvs: Record<string, TPV> }).tpvs,
    )
  ) {
    tx.set(["pis", piid, "tpv", id], tpv);
  }
  await tx.commit();
  return new Response(null, { status: 204 });
};
