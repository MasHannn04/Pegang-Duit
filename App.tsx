import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import {
  JenisKeuangan,
  Transaksi,
  RingkasanBulan,
  RingkasanDashboard,
  DompetFisik,
  StatusAudit,
} from './src/types';
import { getDatabase } from './src/database/db';
import {
  ambilSemuaJenisKeuangan,
  ambilJenisKeuanganBulan,
  tambahJenisKeuangan,
  ubahJenisKeuangan,
  toggleArsipJenisKeuangan,
  aturAktifJenisBulan,
  hapusPermanenJenisKeuangan,
} from './src/database/jenisKeuangan';
import {
  ambilTransaksiBulan,
  ambilRingkasanDashboard,
  tambahTransaksi,
  hapusTransaksi,
  perbaruiTransaksi,
  ambilPeriodeTerawal,
} from './src/database/transaksi';
import {
  ambilSemuaDompet,
  perbaruiSaldoDompet,
  ubahNamaDompet,
  tambahDompetBaru,
  hapusDompet,
} from './src/database/dompet';
import { hitungStatusAudit } from './src/database/rekonsiliasi';
import { muatDataSimulasiOktober } from './src/utils/simulasi';
import { eksporLaporanBulanKeExcel } from './src/utils/exportExcel';
import { getPeriodeBulanSekarang } from './src/utils/format';

import { HeaderPeriode } from './src/components/HeaderPeriode';
import { NavbarBawah } from './src/components/NavbarBawah';
import { TabMenu } from './src/types';
import { DashboardView } from './src/views/DashboardView';
import { DompetView } from './src/views/DompetView';
import { CatatView } from './src/views/CatatView';
import { LaporanView } from './src/views/LaporanView';
import { AkunView } from './src/views/AkunView';

import { ModalKelolaJenisKeuangan } from './src/components/ModalKelolaJenisKeuangan';
import { ModalKalkulatorGaji } from './src/components/ModalKalkulatorGaji';
import { CustomAlertModal } from './src/components/CustomAlertModal';
import { Colors } from './src/theme/colors';

export default function App() {
  const [loading, setLoading] = useState(true);

  // Tab Menu Utama & Riwayat Navigasi (5 Tab: Dashboard, Dompet, Catat, Laporan, Akun)
  const [tabAktif, setTabAktif] = useState<TabMenu>('dashboard');
  const [tabSebelumnya, setTabSebelumnya] = useState<TabMenu>('dashboard');
  const [riwayatTab, setRiwayatTab] = useState<TabMenu[]>([]);

  // Periode Bulan (Otomatis mengikuti bulan & tahun saat ini dari device)
  const [periodeBulan, setPeriodeBulan] = useState(getPeriodeBulanSekarang());
  const [periodeTerawal, setPeriodeTerawal] = useState('2026-01');

  // State Jenis Keuangan
  // Jika jenisDipilih === null: Laporan menampilkan Portofolio List (Bibit style)
  // Jika jenisDipilih !== null: Laporan menampilkan Rincian Buku tersebut
  const [daftarJenisBulan, setDaftarJenisBulan] = useState<JenisKeuangan[]>([]);
  const [semuaMasterJenis, setSemuaMasterJenis] = useState<JenisKeuangan[]>([]);
  const [jenisDipilih, setJenisDipilih] = useState<JenisKeuangan | null>(null);

  // Data Dashboard & Laporan
  const [dashboardData, setDashboardData] = useState<RingkasanDashboard>({
    total_saldo_semua: 0,
    total_debit_semua: 0,
    total_kredit_semua: 0,
    daftar_ringkasan: [],
  });
  const [transaksiList, setTransaksiList] = useState<Transaksi[]>([]);
  const [ringkasanLaporan, setRingkasanLaporan] = useState<RingkasanBulan>({
    saldo_awal: 0,
    total_debit: 0,
    total_kredit: 0,
    saldo_akhir: 0,
  });

  // State Audit Uang Fisik
  const [dompetList, setDompetList] = useState<DompetFisik[]>([]);
  const [auditStatus, setAuditStatus] = useState<StatusAudit>({
    total_fisik: 0,
    total_buku_seluruhnya: 0,
    selisih: 0,
    apakah_cocok: true,
    rincian_buku: [],
  });

  // State Transaksi Edit & Modal Khusus
  const [transaksiEdit, setTransaksiEdit] = useState<Transaksi | null>(null);
  const [modalKelolaJenisVisible, setModalKelolaJenisVisible] = useState(false);
  const [modalGajiVisible, setModalGajiVisible] = useState(false);

  // Memuat data komprehensif
  const muatSemuaData = useCallback(async () => {
    try {
      await getDatabase();

      // 1. Ambil jenis keuangan untuk bulan ini
      const jenisBulan = await ambilJenisKeuanganBulan(periodeBulan);

      // 2. Ambil ringkasan dashboard (untuk Grand Total dan saldo per buku)
      const dash = await ambilRingkasanDashboard(periodeBulan);
      setDashboardData(dash);

      // Masukkan saldo_bulan_ini ke setiap item di daftarJenisBulan
      const jenisDenganSaldo = jenisBulan.map((jb) => {
        const match = dash.daftar_ringkasan.find((dr) => dr.jenis.id === jb.id);
        return {
          ...jb,
          saldo_bulan_ini: match ? match.ringkasan.saldo_akhir : 0,
        };
      });
      setDaftarJenisBulan(jenisDenganSaldo);

      // Ambil seluruh master (termasuk yang diarsipkan) untuk menu kelola
      const masterSemua = await ambilSemuaJenisKeuangan(true);
      setSemuaMasterJenis(masterSemua);

      // 3. Jika sedang melihat detail salah satu buku di Laporan, muat transaksinya
      if (jenisDipilih) {
        const trxLaporan = await ambilTransaksiBulan(jenisDipilih.id, periodeBulan);
        setTransaksiList(trxLaporan.transaksi);
        setRingkasanLaporan(trxLaporan.ringkasan);
      }

      // 4. Ambil dompet fisik & audit
      const dompet = await ambilSemuaDompet();
      setDompetList(dompet);

      const audit = await hitungStatusAudit(periodeBulan);
      setAuditStatus(audit);

      // 5. Ambil batas bulan terawal
      const awal = await ambilPeriodeTerawal();
      setPeriodeTerawal(awal);
    } catch (error) {
      console.error('Gagal memuat data:', error);
    } finally {
      setLoading(false);
    }
  }, [periodeBulan, jenisDipilih]);

  useEffect(() => {
    const initApp = async () => {
      await getDatabase();
      await muatSemuaData();
    };

    initApp();
  }, [muatSemuaData]);

  // Handler Transaksi
  const handleSimpanTransaksi = async (trx: Transaksi) => {
    if (trx.id) {
      await perbaruiTransaksi(trx);
    } else {
      await tambahTransaksi(trx);
    }
    await muatSemuaData();
  };

  const handleHapusTransaksi = async (id: number) => {
    await hapusTransaksi(id);
    await muatSemuaData();
  };

  const handleBukaEdit = (trx: Transaksi) => {
    setTransaksiEdit(trx);
    setRiwayatTab((prev) => {
      const filterPrev = prev.filter((t) => t !== 'catat');
      return [...filterPrev, tabAktif];
    });
    setTabSebelumnya(tabAktif === 'catat' ? 'dashboard' : tabAktif);
    setTabAktif('catat');
  };

  // Handler Dompet Fisik
  const handleSimpanDompet = async (id: number, saldoBaru: number) => {
    await perbaruiSaldoDompet(id, saldoBaru);
    await muatSemuaData();
  };

  const handleUbahNamaDompet = async (id: number, namaBaru: string) => {
    await ubahNamaDompet(id, namaBaru);
    await muatSemuaData();
  };

  const handleTambahDompet = async (nama: string, saldoAwal: number) => {
    await tambahDompetBaru(nama, saldoAwal);
    await muatSemuaData();
  };

  const handleHapusDompet = async (id: number) => {
    await hapusDompet(id);
    await muatSemuaData();
  };

  // Handler Kelola Jenis Keuangan
  const handleTambahJenisKeuangan = async (nama: string, ikon: string, warna: string) => {
    const baruId = await tambahJenisKeuangan(nama, ikon, warna);
    await aturAktifJenisBulan(periodeBulan, baruId, true);
    await muatSemuaData();
  };

  const handleUbahNamaJenis = async (id: number, namaBaru: string) => {
    const target = semuaMasterJenis.find((j) => j.id === id);
    if (target) {
      await ubahJenisKeuangan(id, namaBaru, target.ikon, target.warna);
      await muatSemuaData();
    }
  };

  const handleToggleArsipJenis = async (id: number, arsipkan: boolean) => {
    await toggleArsipJenisKeuangan(id, arsipkan);
    if (arsipkan) {
      await aturAktifJenisBulan(periodeBulan, id, false);
      if (jenisDipilih?.id === id) {
        setJenisDipilih(null);
      }
    }
    await muatSemuaData();
  };

  const handleToggleAktifBulan = async (jenisId: number, isAktif: boolean) => {
    await aturAktifJenisBulan(periodeBulan, jenisId, isAktif);
    if (!isAktif && jenisDipilih?.id === jenisId) {
      setJenisDipilih(null);
    }
    await muatSemuaData();
  };

  const handleHapusPermanenJenis = async (id: number) => {
    await hapusPermanenJenisKeuangan(id);
    if (jenisDipilih?.id === id) {
      setJenisDipilih(null);
    }
    await muatSemuaData();
  };

  // Handler Auto-Catat Selisih
  const handleAutoCatatSelisih = async (selisihNominal: number) => {
    await tambahTransaksi({
      jenis_keuangan_id: 1, // Catat ke Keuangan Pribadi
      tanggal: `${periodeBulan}-14`,
      keterangan: 'Pengeluaran Tak Terduga (Selisih Audit)',
      tipe: 'kredit',
      nominal: selisihNominal,
    });
    await muatSemuaData();
  };

  // Handler Navigasi Tab dengan pencatatan riwayat (untuk tombol Back HP)
  const navigasiKeTab = useCallback((tabBaru: TabMenu) => {
    setPeriodeBulan(getPeriodeBulanSekarang());

    if (tabBaru === tabAktif) {
      if (tabBaru === 'laporan' && jenisDipilih !== null) {
        setJenisDipilih(null);
      }
      return;
    }

    if (tabBaru === 'dashboard') {
      // Kembali ke Dashboard (home base), kosongkan riwayat
      setRiwayatTab([]);
    } else {
      // Catat tab aktif ke riwayat navigasi
      setRiwayatTab((prev) => {
        const filterPrev = prev.filter((t) => t !== tabBaru);
        return [...filterPrev, tabAktif];
      });
    }

    if (tabBaru === 'catat') {
      setTabSebelumnya(tabAktif === 'catat' ? 'dashboard' : tabAktif);
      setTransaksiEdit(null);
    }
    if (tabBaru === 'laporan') {
      setJenisDipilih(null);
    }

    setTabAktif(tabBaru);
  }, [tabAktif, jenisDipilih]);

  // Handler Navigasi dari Dashboard ke Laporan Detail
  const handlePilihLaporanDariDashboard = (jenis: JenisKeuangan) => {
    setRiwayatTab((prev) => {
      const filterPrev = prev.filter((t) => t !== 'laporan');
      return [...filterPrev, 'dashboard'];
    });
    setJenisDipilih(jenis);
    setTabAktif('laporan');
  };

  // Handler Gaji Masuk dari Kalkulator
  const handleGajiDariKalkulator = (nominalGaji: number, ket: string) => {
    setTransaksiEdit({
      jenis_keuangan_id: 1,
      tanggal: `${periodeBulan}-01`,
      keterangan: ket,
      tipe: 'debit',
      nominal: nominalGaji,
    });
    setRiwayatTab((prev) => {
      const filterPrev = prev.filter((t) => t !== 'catat');
      return [...filterPrev, tabAktif];
    });
    setTabSebelumnya(tabAktif === 'catat' ? 'dashboard' : tabAktif);
    setTabAktif('catat');
  };

  // Handler Tombol Back Bawaan Sistem Android
  useEffect(() => {
    const onBackPress = () => {
      // 1. Jika modal kelola jenis keuangan terbuka, tutup modal
      if (modalKelolaJenisVisible) {
        setModalKelolaJenisVisible(false);
        return true;
      }

      // 2. Jika modal kalkulator gaji terbuka, tutup modal
      if (modalGajiVisible) {
        setModalGajiVisible(false);
        return true;
      }

      // 3. Jika di tab Laporan dan sedang membuka rincian buku, kembali ke daftar portofolio buku
      if (tabAktif === 'laporan' && jenisDipilih !== null) {
        setJenisDipilih(null);
        return true;
      }

      // 4. Jika sedang di tab Catat dan sedang mode edit, batalkan edit dulu
      if (tabAktif === 'catat' && transaksiEdit !== null) {
        setTransaksiEdit(null);
        return true;
      }

      // 5. Jika tidak di dashboard, mundur satu langkah di riwayat atau kembali ke dashboard
      if (tabAktif !== 'dashboard') {
        if (riwayatTab.length > 0) {
          const tabTujuan = riwayatTab[riwayatTab.length - 1];
          setRiwayatTab((prev) => prev.slice(0, -1));
          if (tabTujuan === 'laporan') {
            setJenisDipilih(null);
          }
          setTabAktif(tabTujuan);
        } else {
          setTabAktif('dashboard');
        }
        return true;
      }

      // 6. Jika sudah di dashboard (halaman utama): biarkan default Android (keluar aplikasi)
      return false;
    };

    const backSub = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    return () => backSub.remove();
  }, [
    modalKelolaJenisVisible,
    modalGajiVisible,
    tabAktif,
    jenisDipilih,
    transaksiEdit,
    riwayatTab,
  ]);

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingScreenText}>Membuka Pegang Duit...</Text>
      </View>
    );
  }

  const jenisAktifBulanIni = daftarJenisBulan.filter((j) => j.is_aktif_bulan_ini);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

        {/* 1. Header Navigasi Periode Bulan/Tahun */}
        <HeaderPeriode
          periodeBulan={periodeBulan}
          periodeTerawal={periodeTerawal}
          sembunyikanBulan={
            tabAktif === 'dompet' ||
            tabAktif === 'catat' ||
            tabAktif === 'akun' ||
            (tabAktif === 'laporan' && !jenisDipilih)
          }
          onUbahPeriode={(baru) => {
            setPeriodeBulan(baru);
          }}
        />

        {/* 2. Tampilan Sesuai Tab Aktif: 5 Halaman Utuh */}
        {tabAktif === 'dashboard' && (
          <DashboardView
            dashboardData={dashboardData}
            auditStatus={auditStatus}
            onBukaAudit={() => navigasiKeTab('dompet')}
            onBukaKelolaJenis={() => setModalKelolaJenisVisible(true)}
            onPilihLaporanJenis={handlePilihLaporanDariDashboard}
          />
        )}

        {tabAktif === 'dompet' && (
          <DompetView
            dompetList={dompetList}
            auditStatus={auditStatus}
            onSimpanDompet={handleSimpanDompet}
            onUbahNamaDompet={handleUbahNamaDompet}
            onTambahDompet={handleTambahDompet}
            onHapusDompet={handleHapusDompet}
            onAutoCatatSelisih={handleAutoCatatSelisih}
          />
        )}

        {tabAktif === 'catat' && (
          <CatatView
            daftarJenis={jenisAktifBulanIni}
            jenisDipilihId={jenisDipilih?.id ?? 1}
            transaksiEdit={transaksiEdit}
            onSimpan={async (trx) => {
              await handleSimpanTransaksi(trx);
              setTransaksiEdit(null);
              if (riwayatTab.length > 0) {
                const tabTujuan = riwayatTab[riwayatTab.length - 1];
                setRiwayatTab((prev) => prev.slice(0, -1));
                setTabAktif(tabTujuan);
              } else {
                setTabAktif(tabSebelumnya || 'dashboard');
              }
            }}
            onBatal={() => {
              setTransaksiEdit(null);
              if (riwayatTab.length > 0) {
                const tabTujuan = riwayatTab[riwayatTab.length - 1];
                setRiwayatTab((prev) => prev.slice(0, -1));
                setTabAktif(tabTujuan);
              } else {
                setTabAktif(tabSebelumnya || 'dashboard');
              }
            }}
            onHapus={async (id) => {
              await handleHapusTransaksi(id);
              setTransaksiEdit(null);
              if (riwayatTab.length > 0) {
                const tabTujuan = riwayatTab[riwayatTab.length - 1];
                setRiwayatTab((prev) => prev.slice(0, -1));
                setTabAktif(tabTujuan);
              } else {
                setTabAktif(tabSebelumnya || 'dashboard');
              }
            }}
          />
        )}

        {tabAktif === 'laporan' && (
          <LaporanView
            daftarJenis={jenisAktifBulanIni}
            jenisDipilih={jenisDipilih}
            ringkasan={ringkasanLaporan}
            transaksiList={transaksiList}
            onPilihJenis={(j) => {
              setJenisDipilih(j);
            }}
            onBukaKelolaJenis={() => setModalKelolaJenisVisible(true)}
            onEksporExcel={() => eksporLaporanBulanKeExcel(periodeBulan)}
            onHapusTransaksi={handleHapusTransaksi}
            onEditTransaksi={handleBukaEdit}
          />
        )}

        {tabAktif === 'akun' && (
          <AkunView
            onBukaKalkulatorGaji={() => setModalGajiVisible(true)}
            onMuatDataSimulasi={muatDataSimulasiOktober}
            onDataBerubah={muatSemuaData}
          />
        )}

        {/* 3. Bottom Navigation Bar Modern (5 Tab) */}
        <NavbarBawah
          tabAktif={tabAktif}
          onPilihTab={navigasiKeTab}
          onTekanTambahTransaksi={() => navigasiKeTab('catat')}
        />

        {/* MODAL 1: Kelola Jenis Keuangan (Master & Arsip) */}
        <ModalKelolaJenisKeuangan
          visible={modalKelolaJenisVisible}
          periodeBulan={periodeBulan}
          daftarJenis={daftarJenisBulan}
          onTutup={() => setModalKelolaJenisVisible(false)}
          onTambahJenis={handleTambahJenisKeuangan}
          onUbahNamaJenis={handleUbahNamaJenis}
          onToggleArsip={handleToggleArsipJenis}
          onToggleAktifBulan={handleToggleAktifBulan}
          onHapusPermanen={handleHapusPermanenJenis}
        />

        {/* MODAL 2: Kalkulator Gaji */}
        <ModalKalkulatorGaji
          visible={modalGajiVisible}
          onTutup={() => setModalGajiVisible(false)}
          onGunakanSebagaiPemasukan={handleGajiDariKalkulator}
        />

        {/* MODAL GLOBAL: Custom Alert Dialog Serasi Tema */}
        <CustomAlertModal />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingScreenText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
