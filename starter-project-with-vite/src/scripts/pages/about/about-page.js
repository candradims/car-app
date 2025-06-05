export default class AboutPage {
  async render() {
    return `
      <section class="container about-container">
        <div class="about-header">
          <h1>Tentang City Care App</h1>
        </div>
        
        <div class="about-content">
          <div class="about-section">
            <h2>Misi Kami</h2>
            <p>City Care App adalah platform yang didedikasikan untuk meningkatkan lingkungan perkotaan dengan memungkinkan warga untuk melaporkan dan melacak masalah di komunitas mereka. Dengan menghubungkan penduduk dengan pemerintah setempat, kami bertujuan untuk menciptakan kota yang lebih responsif, transparan, dan layak huni.</p>
          </div>
          
          <div class="about-section">
            <h2>Cara Kerja</h2>
            <p>Menggunakan City Care App sangat mudah:</p>
            <ol>
              <li><strong>Buat Akun</strong> - Daftar untuk mengakses semua fitur platform</li>
              <li><strong>Laporkan Masalah</strong> - Dokumentasikan masalah perkotaan dengan foto dan lokasi yang tepat</li>
              <li><strong>Pantau Kemajuan</strong> - Ikuti status laporan Anda dan lihat apa yang telah dilaporkan oleh orang lain</li>
              <li><strong>Berpartisipasi</strong> - Bantu ciptakan komunitas yang lebih baik dengan berpartisipasi aktif</li>
            </ol>
          </div>
          
          <div class="about-section">
            <h2>Teknologi yang Digunakan</h2>
            <p>Aplikasi ini dibangun dengan:</p>
            <ul>
              <li>JavaScript murni dengan pola Model-View-Presenter (MVP)</li>
              <li>HTML5 dan CSS3 untuk desain responsif</li>
              <li>Leaflet.js untuk peta interaktif</li>
              <li>View Transitions API untuk transisi halaman yang mulus</li>
              <li>Camera API untuk mengambil foto</li>
              <li>Geolocation API untuk layanan lokasi</li>
            </ul>
          </div>
        </div>
        
        <div class="about-footer">
          <a href="#/" class="btn btn-primary">Kembali ke Beranda</a>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Tidak ada fungsi khusus yang diperlukan untuk halaman Tentang
  }
}
