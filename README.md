# iOS IPA Online Signer & OTA Installer (Web Ký IPA Trực Tuyến)

Ứng dụng web hiện đại cho phép ký lại file `.ipa` trực tiếp trên trình duyệt bằng chứng chỉ nhà phát triển iOS (`.p12` và `.mobileprovision`) thông qua bộ máy **WebAssembly (zsign)**, sau đó cài đặt trực tiếp lên iPhone/iPad thông qua giao thức OTA (`itms-services`) hoặc tải về file IPA thô đã ký.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-iOS-lightgrey.svg)
![Engine](https://img.shields.io/badge/engine-WebAssembly%20zsign-purple.svg)
![Deploy](https://img.shields.io/badge/deploy-Vercel-black.svg)

---

## Tính Năng Nổi Bật

- **Tự động bóc tách file ZIP chứng chỉ**: Chỉ cần tải lên 1 file `.zip` chứa chứng chỉ, hệ thống tự động tìm và trích xuất file `.p12`/`.pfx` và `.mobileprovision` mà không cần giải nén thủ công.
- **Hỗ trợ nạp thủ công**: Cung cấp tab nạp riêng lẻ từng file `.p12` và `.mobileprovision` linh hoạt.
- **Tự động nhận diện & kiểm tra mật khẩu P12**: Tự động lấy mật khẩu nếu có file text trong zip, đồng thời xác thực mật khẩu ngay trên trình duyệt bằng `node-forge`.
- **Trích xuất thông tin IPA thời gian thực**: Đọc tệp `Info.plist` (hỗ trợ cả bplist00 và XML), hiển thị biểu tượng ứng dụng (App Icon) chuẩn iOS squircle, tên ứng dụng, Bundle ID, phiên bản và dung lượng.
- **Tùy chỉnh linh hoạt**: Cho phép đổi tên hiển thị (Display Name) và Bundle ID theo nhu cầu.
- **Bảo mật tuyệt đối với WebAssembly**: Toàn bộ quá trình ký diễn ra trên RAM của trình duyệt thông qua `zsign-wasm`. Chứng chỉ và khóa riêng tư (Private Key) **không bao giờ bị gửi lên máy chủ**, loại bỏ nguy cơ bị lộ hay đánh cắp chứng chỉ Apple.
- **Cài đặt trực tiếp lên iPhone (OTA - itms-services)**: Khi bấm cài đặt trên Safari iOS, hệ thống hiển thị thông báo *"Mở trang này trong iTunes?"* -> bấm **Mở** -> hiện thông báo cài đặt app trực tiếp về màn hình chính iPhone.
- **Mã QR Camera iPhone**: Tự động sinh mã QR để người dùng thao tác trên máy tính có thể giơ camera iPhone quét và cài đặt ngay lập tức.
- **Tải file IPA thô đã ký**: Nút tải về tức thì file `.ipa` đã ký để lưu trữ hoặc cài đặt qua TrollStore, AltStore, Sideloadly, Scarlet, Esign.

---

## Cấu Trúc Dự Án

```
├── api/
│   └── manifest.js         # Vercel Serverless Function tạo file manifest.plist OTA
├── public/
│   ├── zsign-wasm.wasm     # Bộ máy WebAssembly ký Mach-O và CodeResources
│   └── zsign-wasm.min.js   # Wrapper kết nối zsign WASM
├── src/
│   ├── modules/
│   │   ├── bplist-browser.js   # Bộ phân tích binary plist thuần browser
│   │   ├── cert-manager.js     # Giải nén ZIP, phân tích chứng chỉ & xác thực P12
│   │   ├── ipa-manager.js      # Phân tích file IPA, trích xuất Info.plist & App Icon
│   │   ├── ota-helper.js       # Xử lý upload đám mây OTA, tạo QR & tải file thô
│   │   ├── signer-engine.js    # Điều phối ký số IPA qua WebAssembly
│   │   └── zsign-loader.js     # Khởi tạo và liên kết module WASM
│   ├── main.js             # Logic điều phối giao diện và sự kiện người dùng
│   └── style.css           # Hệ thống giao diện Glassmorphism Apple đẳng cấp
├── index.html              # Giao diện chính chuẩn SEO & tối ưu Safari iOS
├── vercel.json             # Cấu hình định tuyến và triển khai Vercel
└── package.json            # Quản lý gói dependencies
```

---

## Hướng Dẫn Triển Khai Lên Vercel

### Cách 1: Triển khai qua GitHub (Khuyên dùng)
1. Truy cập [Vercel Dashboard](https://vercel.com/new).
2. Chọn **Import Git Repository** và kết nối tới repository: `https://github.com/okphong582-png/Ipa`.
3. Vercel sẽ tự động phát hiện framework **Vite**:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Bấm nút **Deploy**. Chỉ sau khoảng 30 giây, website của bạn sẽ hoạt động với chứng chỉ HTTPS miễn phí!

---

## Hướng Dẫn Sử Dụng & Tin Cậy Ứng Dụng Trên iPhone

1. **Bước 1**: Mở trang web trên trình duyệt Safari của iPhone (hoặc trên máy tính).
2. **Bước 2**: Tải lên file ZIP chứng chỉ (hoặc nạp thủ công file `.p12` và `.mobileprovision`). Nhập mật khẩu P12 nếu có.
3. **Bước 3**: Tải lên file `.ipa` cần ký.
4. **Bước 4**: Bấm nút **KÝ IPA NGAY** và đợi vài giây để hệ thống ký số ứng dụng.
5. **Bước 5**:
   - Bấm **Cài Đặt Trực Tiếp Lên iPhone (OTA)**: Safari sẽ hiện thông báo *"Mở trang này trong iTunes?"* -> Bấm **Mở** -> Bấm **Cài đặt**.
   - Hoặc bấm **Tải File IPA Thô Đã Ký** nếu muốn lưu file về máy.
6. **Bước 6 (Tin cậy chứng chỉ trên iPhone)**:
   - Vào **Cài đặt (Settings)** trên iPhone.
   - Chọn **Cài đặt chung (General)** -> **Quản lý VPN & Thiết bị (VPN & Device Management)**.
   - Chọn tên chứng chỉ của bạn trong mục *Ứng dụng doanh nghiệp* / *Nhà phát triển*.
   - Bấm **Tin cậy (Trust)** để hoàn tất và mở ứng dụng.

---

## Giấy phép (License)

Dự án phát hành dưới giấy phép MIT License.
