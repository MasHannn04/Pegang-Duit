import { getDatabase } from './db';
import { ProfilPengguna } from '../types';

const PROFIL_DEFAULT: ProfilPengguna = {
  nama: 'Pengguna',
  motto: 'Catat uang tiap hari, hidup tenang & teratur.',
  avatar_ikon: 'person',
  avatar_warna: '#2563EB',
};

export const ambilProfilPengguna = async (): Promise<ProfilPengguna> => {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ nilai: string }>(
    'SELECT nilai FROM pengaturan WHERE kunci = ?;',
    'profil_pengguna'
  );

  if (!row) {
    return PROFIL_DEFAULT;
  }

  try {
    return JSON.parse(row.nilai);
  } catch {
    return PROFIL_DEFAULT;
  }
};

export const simpanProfilPengguna = async (
  profil: ProfilPengguna
): Promise<void> => {
  const db = await getDatabase();
  const nilaiJson = JSON.stringify(profil);
  await db.runAsync(
    `INSERT INTO pengaturan (kunci, nilai) VALUES (?, ?)
     ON CONFLICT(kunci) DO UPDATE SET nilai = excluded.nilai;`,
    'profil_pengguna',
    nilaiJson
  );
};

export const ambilPengaturan = async (kunci: string): Promise<string | null> => {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ nilai: string }>(
    'SELECT nilai FROM pengaturan WHERE kunci = ?;',
    kunci
  );
  return row ? row.nilai : null;
};

export const simpanPengaturan = async (
  kunci: string,
  nilai: string
): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO pengaturan (kunci, nilai) VALUES (?, ?)
     ON CONFLICT(kunci) DO UPDATE SET nilai = excluded.nilai;`,
    kunci,
    nilai
  );
};

