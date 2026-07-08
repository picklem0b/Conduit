/**
 * Conduit License Server — Ed25519 Key Pair Generator
 *
 * Run once to generate a key pair:
 *   bun src/keygen.ts
 *
 * Output:
 *   private.pem  — PKCS8 PEM. Set as LICENSE_PRIVATE_KEY in the license server.
 *   public.pem   — SPKI PEM. Set as LICENSE_PUBLIC_KEY in the gateway's .env.
 *
 * Keys are printed to stdout AND written to files in the current directory.
 * Keep private.pem secret — it is the only thing that can sign manifests.
 *
 * This script is intentionally standalone (no imports beyond Node built-ins)
 * so it can be run without installing dependencies.
 */

import { writeFileSync } from "node:fs";

async function main(): Promise<void> {
   console.log("[keygen] Generating Ed25519 key pair...");

   const keyPair = await crypto.subtle.generateKey(
      "Ed25519",
      true, // extractable — we need to export both keys
      ["sign", "verify"]
   );

   // Export private key as PKCS8
   const privateKeyDer = await crypto.subtle.exportKey(
      "pkcs8",
      keyPair.privateKey
   );
   const privateB64 = btoa(
      String.fromCharCode(...new Uint8Array(privateKeyDer))
   );
   const privateLines = privateB64.match(/.{1,64}/g)?.join("\n") ?? privateB64;
   const privatePem = `-----BEGIN PRIVATE KEY-----\n${privateLines}\n-----END PRIVATE KEY-----`;

   // Export public key as SPKI
   const publicKeyDer = await crypto.subtle.exportKey(
      "spki",
      keyPair.publicKey
   );
   const publicB64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyDer)));
   const publicLines = publicB64.match(/.{1,64}/g)?.join("\n") ?? publicB64;
   const publicPem = `-----BEGIN PUBLIC KEY-----\n${publicLines}\n-----END PUBLIC KEY-----`;

   writeFileSync("private.pem", privatePem + "\n");
   writeFileSync("public.pem", publicPem + "\n");

   console.log("\n[keygen] Done. Files written: private.pem, public.pem\n");
   console.log("=".repeat(72));
   console.log("Set in the license server (.env):");
   console.log('  LICENSE_PRIVATE_KEY="""');
   console.log(privatePem);
   console.log('"""');
   console.log("\nSet in the gateway (.env):");
   console.log('  LICENSE_PUBLIC_KEY="""');
   console.log(publicPem);
   console.log('"""');
   console.log("=".repeat(72));
   console.log(
      "\nKeep private.pem secret. Do not commit it to version control."
   );
}

main().catch(err => {
   console.error("[keygen] Failed:", err);
   process.exit(1);
});
