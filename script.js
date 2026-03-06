let scene, camera, renderer, particles, constellations = [], clock, circleTexture, cameraTarget;
let isSceneFrozen = false;
let hasStarted = false;
let terminalOverlay, terminalLayout, terminalText, terminalBody, profileText;
let introOverlay, aboutButton, countdownDisplay;
let scrollHideTimer;

init();
animate();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 8000);
  camera.position.z = 1200;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.domElement.style.opacity = "1";
  document.body.appendChild(renderer.domElement);

  clock = new THREE.Clock();
  circleTexture = createCircleTexture();
  cameraTarget = new THREE.Vector3(0, 0, 0);
  terminalOverlay = document.getElementById("terminal-overlay");
  terminalLayout = document.getElementById("terminal-layout");
  terminalText = document.getElementById("terminal-text");
  terminalBody = document.getElementById("terminal-body");
  profileText = document.getElementById("profile-text");
  introOverlay = document.getElementById("intro-overlay");
  aboutButton = document.getElementById("about-btn");
  countdownDisplay = document.getElementById("countdown-display");
  setupTerminalScrollIndicator();
  setupIntroSequence();

  const particleCount = 20000;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    size: 2,
    color: 0xff5500,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    map: circleTexture,
    alphaTest: 0.5,
    depthWrite: false
  });

  particles = new THREE.Points(geometry, material);
  scene.add(particles);

  const light = new THREE.PointLight(0xffffff, 2);
  light.position.set(200, 200, 300);
  scene.add(light);

  window.addEventListener("resize", onWindowResize, false);
}

function createConstellations() {
  const zodiacNames = [
    "Bạch Dương", "Kim Ngưu", "Song Tử", "Cự Giải",
    "Sư Tử", "Xử Nữ", "Thiên Bình", "Bọ Cạp",
    "Nhân Mã", "Ma Kết", "Bảo Bình", "Song Ngư"
  ];

  const starMaterial = new THREE.PointsMaterial({
    color: 0xffd700,
    size: 4,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    map: circleTexture,
    alphaTest: 0.5,
    depthWrite: false
  });

  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xffa500,
    transparent: true,
    opacity: 0.6
  });

  const radius = 800;
  for (let i = 0; i < 12; i++) {
    const starCount = 6 + Math.floor(Math.random() * 5);
    const starPositions = [];
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);

    const phi = Math.acos(2 * Math.random() - 1);
    const theta = (i / 12) * Math.PI * 2;
    const cx = Math.sin(phi) * Math.cos(theta) * radius * 0.6;
    const cy = Math.cos(phi) * radius * 0.6;
    const cz = Math.sin(phi) * Math.sin(theta) * radius * 0.6;

    for (let j = 0; j < starCount; j++) {
      const x = cx + (Math.random() - 0.5) * 100;
      const y = cy + (Math.random() - 0.5) * 100;
      const z = cz + (Math.random() - 0.5) * 100;
      positions[j * 3] = x;
      positions[j * 3 + 1] = y;
      positions[j * 3 + 2] = z;
      starPositions.push(new THREE.Vector3(x, y, z));
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const stars = new THREE.Points(geometry, starMaterial);
    scene.add(stars);

    const lineGeo = new THREE.BufferGeometry().setFromPoints(starPositions);
    const lines = new THREE.Line(lineGeo, lineMaterial);
    scene.add(lines);

    const center = new THREE.Vector3(cx, cy, cz);
    constellations.push({ stars, lines, center, name: zodiacNames[i] });
  }

  gsap.delayedCall(0.35, () => zoomToConstellation("Sư Tử"));
}

function animate() {
  requestAnimationFrame(animate);
  clock.getElapsedTime();

  if (hasStarted && !isSceneFrozen) {
    particles.rotation.y += 0.003;
    particles.rotation.x += 0.0015;

    constellations.forEach((c, i) => {
      c.stars.rotation.y += 0.0015 + i * 0.00012;
      c.lines.rotation.y += 0.0015 + i * 0.00012;
    });

    scene.rotation.y += 0.001;
  }

  camera.lookAt(cameraTarget);
  renderer.render(scene, camera);
}

function setupIntroSequence() {
  if (!aboutButton || !countdownDisplay || !introOverlay) return;

  // keep the button present but disable it; no click required
  aboutButton.disabled = true;
  aboutButton.style.pointerEvents = "none";

  // begin the countdown immediately
  runCountdown(() => {
    gsap.to(introOverlay, {
      opacity: 0,
      duration: 0.55,
      ease: "power2.out",
      onComplete: () => {
        introOverlay.style.display = "none";
        startBigBangSequence();
      }
    });
  });

  // ensure any clicks are ignored
  aboutButton.addEventListener("click", (e) => {
    e.preventDefault();
  });
}

function runCountdown(onComplete) {
  const steps = ["3", "2", "1", "IGNITION"];
  const countdownTimeline = gsap.timeline({ onComplete });

  steps.forEach((value, index) => {
    countdownTimeline.call(() => {
      countdownDisplay.textContent = value;
    });
    countdownTimeline.fromTo(
      countdownDisplay,
      { scale: 0.4, opacity: 0 },
      { scale: 1.2, opacity: 1, duration: 0.33, ease: "back.out(2)" }
    );
    countdownTimeline.to(countdownDisplay, {
      scale: index === steps.length - 1 ? 1.45 : 1,
      opacity: 0,
      duration: 0.25,
      ease: "power1.in"
    });
  });
}

function startBigBangSequence() {
  hasStarted = true;
  gsap.timeline()
    .to(particles.scale, { x: 200, y: 200, z: 200, duration: 1.6, ease: "power2.out" })
    .to(particles.material.color, { r: 1, g: 0.8, b: 0.2, duration: 0.9 })
    .call(() => {
      createConstellations();
    });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function createCircleTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.beginPath();
  context.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
  context.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function zoomToConstellation(name) {
  const targetConstellation = constellations.find(c => c.name === name);
  if (!targetConstellation) return;

  const focusPoint = targetConstellation.center.clone();
  const direction = focusPoint.clone().normalize();
  const cameraDestination = focusPoint.clone().add(direction.multiplyScalar(220));

  gsap.to(camera.position, {
    x: cameraDestination.x,
    y: cameraDestination.y,
    z: cameraDestination.z,
    duration: 3,
    ease: "power2.inOut",
    onComplete: () => {
      freezeSceneAndType();
    }
  });

  gsap.to(cameraTarget, {
    x: focusPoint.x,
    y: focusPoint.y,
    z: focusPoint.z,
    duration: 3,
    ease: "power2.inOut"
  });
}

function freezeSceneAndType() {
  isSceneFrozen = true;
  if (terminalLayout) {
    terminalLayout.classList.remove("layout-split");
  }
  if (profileText) {
    profileText.textContent = "";
  }

  gsap.to(renderer.domElement, {
    opacity: 0.35,
    duration: 1.2,
    ease: "power2.out"
  });

  terminalOverlay.style.visibility = "visible";
  gsap.to(terminalOverlay, {
    opacity: 1,
    duration: 1.1,
    ease: "power2.out",
    onComplete: () => {
      // auto-type date string instead of the name
      typeCommandText("12_08_1999", 140, () => {
        runDownloadEffect(1500, showFullProfile);
      });
    }
  });
}

function typeCommandText(content, speed, onComplete) {
  const prompt = "C:\\Users\\admin> ";
  let index = 0;
  terminalText.innerHTML = `${prompt}<span class="cursor">_</span>`;

  const timer = setInterval(() => {
    index += 1;
    const typed = content.slice(0, index);
    terminalText.innerHTML = `${prompt}${typed}<span class="cursor">_</span>`;

    if (index >= content.length) {
      clearInterval(timer);
      if (onComplete) onComplete();
    }
  }, speed);
}

function runDownloadEffect(durationMs, onComplete) {
  const start = performance.now();
  const cmd = "C:\\Users\\admin> download profile --source local-cache";
  const totalBars = 24;

  function tick(now) {
    const elapsed = now - start;
    const ratio = Math.min(elapsed / durationMs, 1);
    const percent = Math.round(ratio * 100);
    const filled = Math.round((percent / 100) * totalBars);
    const bar = `${"#".repeat(filled)}${".".repeat(totalBars - filled)}`;

    terminalText.textContent = `${cmd}\nDownloading [${bar}] ${percent}%`;

    if (ratio < 1) {
      requestAnimationFrame(tick);
    } else if (onComplete) {
      onComplete();
    }
  }

  requestAnimationFrame(tick);
}

function showFullProfile() {
  const profileSummary = `VŨ CHÍ CÔNG
SOFTWARE ENGINEER`;

  const profileDetails = `Lập trình viên .NET
12-08-1999
0966.238.334
interact.congvu@gmail.com
Đình Thôn, Mỹ Đình, Nam Từ Liêm, Hà Nội

MỤC TIÊU NGHỀ NGHIỆP
Lập trình viên Fullstack với hơn 4 năm kinh nghiệm xây dựng và phát triển hệ thống trên nền tảng .NET Core và Spring Boot.
Có kinh nghiệm thiết kế microservices, triển khai ứng dụng trên AWS bằng Docker, và phối hợp hiệu quả giữa frontend với backend để tối ưu luồng dữ liệu và trải nghiệm người dùng.

HỌC VẤN
2017 - 2021
Tốt nghiệp ngành Công nghệ phần mềm
Đại học Kinh tế Kỹ thuật Công nghiệp
Xếp loại: Khá

CÁC KỸ NĂNG
Technical Skills
- .NET Ecosystem: ASP.NET Core, MVC, Entity Framework, LINQ, WebSocket, Repository Pattern
- Java/Spring Boot: Spring Boot, JPA, Maven, REST API, Hibernate, Circuit Breaker Pattern
- DevOps & Cloud: AWS EC2, S3, Docker, CI/CD (GitHub Actions), Docker Compose
- Kiến trúc & Bảo mật: Microservices, OAuth2, JWT, Design Patterns, DDD Pattern, CQRS, Clean Code
- Monitoring & Logging: Seq, Prometheus, Grafana
- Payment Integration: Stripe, PayPal, SePay

Database Management Systems
- MySQL, MSSQL, Oracle

Frameworks/Platforms
- .NET Core, ASP.NET, Spring Boot, RESTful API
- React, Redux, Kendo React, HTML, CSS, JS, Webpack
- Docker
- WordPress

Version Control
- Git

Soft Skills
- Estimate Task (Jira)
- Làm việc nhóm (Microsoft Teams)
- Quản lý công việc với Jira
- Setup CI/CD với Jenkins
- Quản lý source code với GitLab

Others
- Phân tích thiết kế database
- Phân tích yêu cầu nghiệp vụ

SỞ THÍCH
- Chạy bộ
- Xem phim

KINH NGHIỆM LÀM VIỆC
Amitech (2021 - 2025)
Một số dự án nổi bật:

1) DỰ ÁN: TÀI NGUYÊN VÀ MÔI TRƯỜNG - KIỂM KÊ KHÍ NHÀ KÍNH
- Mô tả: Phát triển tool tính toán phát thải cho doanh nghiệp, thực hiện báo cáo online.
  Thu thập và tổng hợp dữ liệu cho Bộ TN&MT, Bộ Công Thương, Bộ GTVT, Bộ Nông nghiệp, Bộ Xây dựng (đang hoàn thiện).
- Vị trí: Lập trình viên Backend, Frontend
- Công nghệ: .NET Core, SQL Server, ReactJS, Bootstrap 4, HTML, CSS, JS
- Công việc chính: Phân tích làm rõ nghiệp vụ, thiết kế cơ sở dữ liệu, xử lý truy vấn dữ liệu, dựng giao diện theo Figma

2) DỰ ÁN: SỞ CÔNG THƯƠNG HẢI PHÒNG - SỐ HÓA LƯỚI ĐIỆN
- Mô tả: Hỗ trợ quản lý thông tin vị trí và bản đồ lưới điện
- Vị trí: Lập trình viên Backend
- Công nghệ: .NET Core, SQL Server, ReactJS, Bootstrap 4, Highcharts
- Công việc chính: Xử lý truy vấn dữ liệu, dựng giao diện theo Figma

3) DỰ ÁN: NPC THÁI NGUYÊN - SỔ ONLINE
- Mô tả: Hỗ trợ tạo sổ online
- Vị trí: Lập trình viên Backend - Frontend
- Công nghệ: SQL Server, Spring Boot, RESTful API, ReactJS, Bootstrap 4
- Công việc chính: Viết API chia sẻ dữ liệu, call API và dựng giao diện theo Figma

4) DỰ ÁN: PHẦN MỀM KHAI BÁO BẢO LÃNH VIỆN PHÍ
- Mô tả: Giúp cơ sở y tế tra cứu, khai báo thông tin
- Vị trí: Lập trình viên Backend - Frontend
- Công nghệ: .NET, Oracle, WebSocket, Kendo React
- Công việc chính: Viết API kết nối nhiều hệ thống, xử lý truy vấn dữ liệu, dựng giao diện, viết tiến trình chạy ngầm theo yêu cầu nghiệp vụ`;
  if (profileText) {
    profileText.textContent = profileSummary;
  }
  terminalText.textContent = profileDetails;
  revealSplitLayout();
}

function revealSplitLayout() {
  if (!terminalLayout) return;
  // Delay a bit so the user sees the left CMD "spawn" over the main CMD first
  gsap.delayedCall(0.15, () => {
    terminalLayout.classList.add("layout-split");
  });
}

function setupTerminalScrollIndicator() {
  if (!terminalBody) return;

  terminalBody.addEventListener("scroll", () => {
    terminalBody.classList.add("scrolling");
    clearTimeout(scrollHideTimer);
    scrollHideTimer = setTimeout(() => {
      terminalBody.classList.remove("scrolling");
    }, 700);
  }, { passive: true });
}
