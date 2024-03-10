import { crypto } from "$std/crypto/mod.ts";
import { FreshContext } from "$fresh/server.ts";
import { decode } from "cbor";
import { encodeBase64Url } from "$std/encoding/base64url.ts";
import { addTpvs, getPiSecret, TPV } from "../../db.ts";

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
  const [piid, mac] = (msg as { tok: string }).tok.split("\0");
  const sec = await getPiSecret(piid);
  if (!sec) return new Response("unauthn", { status: 401 });
  const expectedMac = encodeBase64Url(
    await crypto.subtle.digest(
      "SHA3-512",
      new TextEncoder().encode(`${piid}\0${sec}`),
    ),
  );
  if (mac !== expectedMac) return new Response("unauthn", { status: 401 });
  await addTpvs(piid, (msg as { tpvs: Record<string, TPV> }).tpvs);
  return new Response(null, { status: 204 });
};
