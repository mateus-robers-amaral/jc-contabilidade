import QRCode from "qrcode";

interface PixPayloadParams {
  pixKey: string;
  pixKeyType: string;
  nomeBeneficiario: string;
  cidade: string;
  valor?: number;
  identificador?: string;
}

/**
 * Calculates the CRC16-CCITT checksum for PIX payload
 * Polynomial: 0x1021, Initial value: 0xFFFF
 */
function crc16ccitt(str: string): string {
  const polynomial = 0x1021;
  let crc = 0xFFFF;

  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ polynomial) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Formats a TLV (Tag-Length-Value) field for EMV format
 */
function formatTLV(id: string, value: string): string {
  const length = value.length.toString().padStart(2, "0");
  return `${id}${length}${value}`;
}

/**
 * Removes accents and special characters from string
 */
function normalizeString(str: string, maxLength: number): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-zA-Z0-9 ]/g, "") // Keep only alphanumeric and spaces
    .trim()
    .substring(0, maxLength)
    .toUpperCase();
}

/**
 * Generates a STATIC PIX EMV/BRCode payload string
 * This creates a simple QR code that directs to the PIX key
 * The payer will enter the amount manually in their banking app
 */
export function generatePixPayload(params: PixPayloadParams): string {
  const {
    pixKey,
    nomeBeneficiario,
    cidade,
  } = params;

  // Normalize strings according to PIX specification
  const nome = normalizeString(nomeBeneficiario, 25);
  const cidadeNorm = normalizeString(cidade, 15);

  // Build payload in the correct order
  let payload = "";

  // ID 00 - Payload Format Indicator (Required, fixed "01")
  payload += formatTLV("00", "01");

  // ID 26 - Merchant Account Information for PIX
  const merchantAccountInfo =
    formatTLV("00", "BR.GOV.BCB.PIX") + // GUI
    formatTLV("01", pixKey); // Chave PIX
  payload += formatTLV("26", merchantAccountInfo);

  // ID 52 - Merchant Category Code (Required, "0000" for general)
  payload += formatTLV("52", "0000");

  // ID 53 - Transaction Currency (Required, "986" = BRL)
  payload += formatTLV("53", "986");

  // ID 58 - Country Code (Required, "BR")
  payload += formatTLV("58", "BR");

  // ID 59 - Merchant Name (Required, max 25 chars)
  payload += formatTLV("59", nome);

  // ID 60 - Merchant City (Required, max 15 chars)
  payload += formatTLV("60", cidadeNorm);

  // ID 62 - Additional Data Field Template (with empty TXID for static)
  const additionalData = formatTLV("05", "***");
  payload += formatTLV("62", additionalData);

  // ID 63 - CRC16 (Required, calculated over entire payload including "6304")
  payload += "6304";
  payload += crc16ccitt(payload);

  return payload;
}

/**
 * Generates a QR Code image as base64 data URL
 */
export async function generatePixQRCode(params: PixPayloadParams): Promise<string> {
  const payload = generatePixPayload(params);

  const qrCodeDataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    type: "image/png",
    width: 200,
    margin: 1,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });

  return qrCodeDataUrl;
}

/**
 * Generates a QR Code image as buffer (for server-side rendering)
 */
export async function generatePixQRCodeBuffer(params: PixPayloadParams): Promise<Buffer> {
  const payload = generatePixPayload(params);

  return QRCode.toBuffer(payload, {
    errorCorrectionLevel: "M",
    type: "png",
    width: 200,
    margin: 1,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
}
