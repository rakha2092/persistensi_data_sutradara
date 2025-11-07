# Autentikasi dan Autorisasi dengan JWT

# PRAKTIKUM

1. Registrasi Pengguna
registrasi pengguna ada pada auth/register dimana endpoint ini digunakan untuk menambah pengguna baru.
Sebelum disimpan, password di-hash menggunakan bcrypt agar aman.
![](img/register.png)

2. login pengguna
login pengguna dalam kode ada di auth/login difile server.js, yang mana digunakan untuk memverifikasi username dan password.Jika berhasil, server mengembalikan JWT token yang menjadi bukti autentikasi.
![](img/login.png)
JWT dihasilkan dengan payload berisi ID dan username user.Token ini digunakan untuk mengakses endpoint yang dilindungi.

3. middleware authentikasi
File middleware/authMiddleware.js berfungsi memverifikasi token JWT di setiap permintaan ke rute yang dilindungi.
![](img/middleware.png)
Token diverifikasi menggunakan jwt.verify(), lalu Jika token valid request lanjut ke endpoint berikutnya, Jika token invalid, API akan mengembalikan error 403.

4. endpoint movies
disini menggunakan token untuk melihat data pada movies id 1
![](img/token.png)
disini percobaan saat tidak menggunakan token, akses ditolak karena tidak ada token yang diterima middleware
![](img/tanpatoken.png)

5. endpoint put dan delete
percobaan put untuk movies
![](img/putmovie.png)
percobaan delete untuk movies
![](img/deletemovie.png)

# Tugas Praktikum

1. Terapkan middleware authenticateToken ke endpoint berikut:

- POST /directors
post director menggunakan token
![](img/postdirectors.png)
post director tanpa menggunakan token
![](img/postdirector_tanpatoken.png)

- PUT /directors/:id
put/update director menggunakan token 
![](img/putdirector.png)
put/update director tidak menggunakan token
![](img/putdirector_tanpatoken.png)

- DELETE /directors/:id
delete director menggunakan token
![](img/deletedirector.png)
delete director tanpa token
![](img/deletedirector_tanpatoken.png)

2. Biarkan endpoint GET /directors dan GET /directors/:id tetap publik.
get director untuk menampilkan data semua director
![](img/getdirector.png)
get director menurut id yang dipilih
![](img/getdirectorbyid.png)