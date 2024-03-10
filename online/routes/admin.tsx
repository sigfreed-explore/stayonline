import { crypto } from "$std/crypto/mod.ts";
import { decodeBase64Url, encodeBase64Url } from "$std/encoding/base64url.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";
import { addPi, getPis, PiMeta } from "../db.ts";

interface AP {
  pis: Record<string, PiMeta>;
}

async function isAdmin(headers: Headers) {
  const { secret } = getCookies(headers);
  if (!secret) return false;
  const digest = encodeBase64Url(
    await crypto.subtle.digest("SHA3-512", decodeBase64Url(secret)),
  );
  return digest ===
    "wPUpKsaPqzrVVtOdrEP0zaAe1AZCmswBFNiK52oWHi6PKjHEQJISviwF9prJiy7gUPPMFGQHPaR3FU-gz4aU1Q";
}

export const handler: Handlers<AP> = {
  async GET(req, ctx) {
    const authPage = new URL(ctx.url);
    authPage.pathname = "/auth";
    if (!await isAdmin(req.headers)) return Response.redirect(authPage);
    return ctx.render({ pis: {} });
  },
  POST() {
    return new Response("TODO", { status: 501 });
  },
};

export default function Admin({}: PageProps<AP>) {
  return <div>TODO</div>;
}
