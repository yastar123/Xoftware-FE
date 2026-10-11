import CryptoJS from 'crypto-js';

const password = 'Bolaxddd'; // Ganti dengan kunci rahasia Anda

export function hashPassword(password, salt, iterations = 1000, keySize = 256) {
  const key = CryptoJS.PBKDF2(password, salt, {
    keySize: keySize / 32,
    iterations: iterations,
  });
  return key.toString(CryptoJS.enc.Hex);
}

export const encryptAES = (text) => {
  const iv = CryptoJS.lib.WordArray.random(128 / 8);
  const encrypted = CryptoJS.AES.encrypt(text, password, { iv: iv });
  return iv.toString() + ':' + encrypted.toString();
};

export const decryptAES = (cipherText) => {
  const parts = cipherText.split(':');
  const iv = CryptoJS.enc.Hex.parse(parts.shift());
  const encryptedText = parts.join(':');
  const decrypted = CryptoJS.AES.decrypt(encryptedText, password, { iv: iv });
  return decrypted.toString(CryptoJS.enc.Utf8);
};

export function dec(str, len) {
    let data = str;
    Array.from(Array(len)).map(() => {
      data = Buffer.from(data, 'base64').toString();
    })
    return data;
}

export function generateRandomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  const length = Math.floor(Math.random() * 2) + 5; // random 5 atau 6
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function idr(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function enc(str, len) {
    let data = str;
    Array.from(Array(len)).map(() => {
      data = Buffer.from(data).toString('base64');
    })
    return data;
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result?.split(",")?.[1];
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
  });
}


export const dateParse = (d) => new Date(d).toLocaleDateString("id", { day: "numeric", month: "numeric", year: "numeric", hour: "numeric", minute: "numeric", timeZone: "asia/jakarta" });
export const timeParse = (s) => new Date(s).toLocaleTimeString("id", { hour: "numeric", minute: "numeric", timeZone: "asia/jakarta" })
export const regexURL = /^(https?|ftp):\/\/[^\s]*[^\s\/$.?#].[^\s]*$/i;
export function timers(time) {
    let currentTime = "";
    const miliseconds = Math.floor(time % 1000),
        seconds = Math.floor((time / 1000) % 60),
        minutes = Math.floor((time / (60 * 1000)) % 60),
        hours = Math.floor((time / (60 * 60 * 1000)) % 24),
        days = Math.floor(time / (24 * 60 * 60 * 1000)),
        weeks = Math.floor(time / (7 * 24 * 60 * 60 * 1000)),
        months = Math.floor(time / (30 * 24 * 60 * 60 * 1000)),
        years = Math.floor(time / (12 * 30 * 24 * 60 * 60 * 1000));
    if (miliseconds) currentTime = miliseconds + " Mili Detik";
    if (seconds) currentTime = seconds + " Detik";
    if (minutes) currentTime = minutes + " Menit " + seconds + " Detik";
    if (hours) currentTime = hours + " Jam " + minutes + " Menit";
    if (days) currentTime = days + " Hari " + hours + " Jam";
    return currentTime;
}

export function parseTime(arg) {
    let timeList = ["s", "m", "h", "d", "w", "b", "y"];
    let endArg = arg.split("").slice(-1).toString();
    if (!timeList.includes(endArg)) return false;
    let timeLock;
    if (arg.endsWith(timeList[0])) timeLock = 1000;
    if (arg.endsWith(timeList[1])) timeLock = 60 * 1000;
    if (arg.endsWith(timeList[2])) timeLock = 60 * 60 * 1000;
    if (arg.endsWith(timeList[3])) timeLock = 24 * 60 * 60 * 1000;
    if (arg.endsWith(timeList[4])) timeLock = 7 * 24 * 60 * 60 * 1000;
    if (arg.endsWith(timeList[5])) timeLock = 30 * 24 * 60 * 60 * 1000;
    if (arg.endsWith(timeList[6])) timeLock = 12 * 30 * 24 * 60 * 60 * 1000;
    arg = parseInt(arg);
    if (isNaN(arg)) return false;
    return arg * timeLock;
}