import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

const QR_CODE_DIR = path.join(process.cwd(), 'qrcodes');

if (!fs.existsSync(QR_CODE_DIR)) {
  fs.mkdirSync(QR_CODE_DIR, { recursive: true });
}

export async function generateQRCode(establishmentId, establishmentName) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const url = `${frontendUrl}/pwa/?id=${establishmentId}`;
  
  const fileName = `qr_${establishmentId}_${Date.now()}.png`;
  const filePath = path.join(QR_CODE_DIR, fileName);
  
  await QRCode.toFile(filePath, url, {
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });
  
  return `/qrcodes/${fileName}`;
}

export async function generateQRCodeDataURL(establishmentId) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const url = `${frontendUrl}/pwa/?id=${establishmentId}`;
  
  return await QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });
}
