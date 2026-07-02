import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Cool Molecules Media";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

async function readCssToken(tokenName: string) {
  const globalsCss = await readFile(join(process.cwd(), "app/globals.css"), "utf8");
  const tokenMatch = globalsCss.match(
    new RegExp(`${tokenName}:\\s*([^;]+);`),
  );

  if (!tokenMatch) {
    throw new Error(`Missing CSS token: ${tokenName}`);
  }

  return tokenMatch[1].trim();
}

export default async function Image() {
  const [logo, background] = await Promise.all([
    readFile(join(process.cwd(), "public/images/stamp-logo.png")),
    readCssToken("--cmm-color-yellow-400"),
  ]);
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={logoSrc}
          alt=""
          width="310"
          height="310"
          style={{
            width: 310,
            height: 310,
            objectFit: "contain",
          }}
        />
      </div>
    ),
    size,
  );
}
